import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { 
  User, 
  CallSession,
  InitiateCallSignalPayload,
  CallOfferSignalPayload,
  CallAnswerSignalPayload,
  IceCandidateSignalPayload,
  CallAcceptedSignalPayload,
  CallDeclinedSignalPayload,
  CallEndedSignalPayload,
  SignalRBasePayload
} from '../types';
import { CallState } from '../types';
import { useAuth } from '../hooks/useAuth';
import * as signalrCallService from '../services/signalrCallService';
import { RTC_CONFIGURATION } from '../constants';

const initialCallSession: CallSession = {
  callId: '',
  type: 'voice',
  state: CallState.IDLE,
  isLocalAudioMuted: false,
  isLocalVideoMuted: false,
};

interface CallContextType {
  callSession: CallSession;
  isCallModalOpen: boolean;
  initiateCall: (targetUser: User, type: 'video' | 'voice') => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMuteAudio: () => void;
  toggleMuteVideo: () => void;
  incomingCallDetails: InitiateCallSignalPayload | null;
  clearIncomingCallDetails: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

interface CallProviderProps {
  children: ReactNode;
}

export const CallProvider: React.FC<CallProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [callSession, setCallSession] = useState<CallSession>(initialCallSession);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [incomingCallDetails, setIncomingCallDetails] = useState<InitiateCallSignalPayload | null>(null);

  const resetCallSession = useCallback(() => {
    if (callSession.localStream) {
      callSession.localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
    if (callSession.peerConnection) {
      callSession.peerConnection.close();
    }
    setCallSession(initialCallSession);
    setIsCallModalOpen(false);
  }, [callSession.localStream, callSession.peerConnection]);

  const createPeerConnection = useCallback((currentCallId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(RTC_CONFIGURATION);

    pc.ontrack = (event) => {
      setCallSession((prev) => ({ ...prev, remoteStream: event.streams[0] }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalrCallService.sendIceCandidate({
          callId: currentCallId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
        setCallSession((prev) => ({...prev, state: CallState.ERROR, error: "ICE connection failed"}));
      }
    };

    return pc;
  }, []);

  // SignalR Handlers
  const handleIncomingCall = useCallback((payload: InitiateCallSignalPayload) => {
    if (callSession.state !== CallState.IDLE) {
      signalrCallService.sendCallDeclinedSignal({ 
        callId: payload.callId, 
        declinerId: currentUser!.id,
        isBusy: true 
      });
      return;
    }
    setIncomingCallDetails(payload);
    setCallSession((prev) => ({
      ...prev,
      callId: payload.callId,
      type: payload.type,
      state: CallState.RECEIVING_INCOMING,
      initiator: payload.initiator,
      targetUser: payload.targetUser,
    }));
  }, [callSession.state, currentUser]);

  const handleCallAccepted = useCallback(async (payload: CallAcceptedSignalPayload) => {
    // This is for the original caller when the callee accepts
    if (!currentUser || callSession.callId !== payload.callId || callSession.state !== CallState.INITIATING_OUTGOING) return;
    console.log("CallContext: Call accepted by", payload.accepter.username);

    setCallSession(prev => ({ 
        ...prev, 
        state: CallState.NEGOTIATING, 
        receiver: payload.accepter, // The one who accepted is the receiver
        targetUser: payload.accepter, // Update targetUser to the accepter
    }));

    // Now, the original caller creates and sends the offer
    if (callSession.peerConnection && callSession.localStream) {
        try {
            const offer = await callSession.peerConnection.createOffer();
            await callSession.peerConnection.setLocalDescription(offer);
            signalrCallService.sendOffer({
                callId: payload.callId,
                peerId: currentUser.id,
                offer: offer
            });
        } catch (error) {
            console.error("Error creating/sending offer:", error);
            setCallSession(prev => ({...prev, state: CallState.ERROR, error: "Failed to create offer"}));
        }
    } else {
        console.error("PeerConnection or LocalStream not ready for offer");
        setCallSession(prev => ({...prev, state: CallState.ERROR, error: "Call setup error"}));
    }
  }, [currentUser, callSession.callId, callSession.state, callSession.peerConnection, callSession.localStream]);

  const handleOffer = useCallback(async (payload: CallOfferSignalPayload) => {
    // This is for the callee who accepted the call and is now receiving an offer
    if (!currentUser || callSession.callId !== payload.callId || callSession.state !== CallState.NEGOTIATING || !callSession.initiator) return;
    console.log("CallContext: Received offer from", payload.callId);

    if (callSession.peerConnection && callSession.localStream) {
        try {
            await callSession.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await callSession.peerConnection.createAnswer();
            await callSession.peerConnection.setLocalDescription(answer);

            signalrCallService.sendAnswer({
                callId: payload.callId,
                answererId: currentUser.id,
                peerId: currentUser.id,
                answer: answer
            });
            setCallSession(prev => ({ ...prev, state: CallState.ONGOING })); // Or keep NEGOTIATING until ICE completes fully
            setIsCallModalOpen(true);
        } catch (error) {
            console.error("Error processing offer/creating answer:", error);
            setCallSession(prev => ({...prev, state: CallState.ERROR, error: "Failed to process offer"}));
        }
    } else {
         console.error("PeerConnection or LocalStream not ready for answer");
         setCallSession(prev => ({...prev, state: CallState.ERROR, error: "Call setup error on callee side"}));
    }
  }, [currentUser, callSession.callId, callSession.state, callSession.peerConnection, callSession.localStream, callSession.initiator]);

  const handleAnswer = useCallback(async (payload: CallAnswerSignalPayload) => {
    // This is for the original caller who sent an offer and is now receiving an answer
     if (!currentUser || callSession.callId !== payload.callId || callSession.state !== CallState.NEGOTIATING) return;
     console.log("CallContext: Received answer from", payload.callId);

    if (callSession.peerConnection) {
        try {
            await callSession.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.answer));
            setCallSession(prev => ({ ...prev, state: CallState.ONGOING }));
            setIsCallModalOpen(true);
        } catch (error) {
            console.error("Error setting remote description from answer:", error);
            setCallSession(prev => ({...prev, state: CallState.ERROR, error: "Failed to process answer"}));
        }
    }
  }, [currentUser, callSession.callId, callSession.state, callSession.peerConnection]);
  
  const handleIceCandidate = useCallback((payload: IceCandidateSignalPayload) => {
    if (callSession.peerConnection && payload.candidate && callSession.callId === payload.callId) {
      try {
        callSession.peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate))
          .catch(e => console.error("Error adding ICE candidate:", e));
      } catch (e) {
        console.error("Error creating RTCIceCandidate:", e);
      }
    }
  }, [callSession.peerConnection, callSession.callId]);

  const handleCallDeclined = useCallback((payload: CallDeclinedSignalPayload) => {
    if (callSession.callId === payload.callId || (callSession.targetUser && callSession.targetUser.id === payload.declinerId)) {
      console.log("CallContext: Call declined by", payload.declinerId, "Busy:", payload.isBusy);
      resetCallSession();
      alert(payload.isBusy ? `User is busy.` : `Call declined.`);
    }
  }, [callSession.callId, callSession.targetUser, resetCallSession]);

  const handleCallEnded = useCallback((payload: CallEndedSignalPayload) => {
     if (callSession.callId === payload.callId) {
        console.log("CallContext: Call ended by", payload.enderId);
        resetCallSession();
     }
  }, [callSession.callId, resetCallSession]);

  const handleUserBusy = useCallback((payload: SignalRBasePayload) => {
    if(callSession.callId === payload.callId && callSession.state === CallState.INITIATING_OUTGOING) {
        alert("User is busy on another call.");
        resetCallSession();
    }
  },[callSession.callId, callSession.state, resetCallSession]);

  const handleCallError = useCallback((error: string, errorCallId?: string) => {
    if (errorCallId && callSession.callId !== errorCallId) return; // Error for a different call
    console.error("CallContext: Call Error:", error);
    setCallSession(prev => ({ ...prev, state: CallState.ERROR, error: error }));
    // Potentially resetCallSession() after a delay or based on error type
    alert(`Call error: ${error}`);
    resetCallSession();
  }, [callSession.callId, resetCallSession]);


  useEffect(() => {
    if (currentUser) {
      signalrCallService.initializeSignalRCallService({
        onIncomingCall: handleIncomingCall,
        onCallOffer: handleOffer,
        onCallAnswer: handleAnswer,
        onIceCandidate: handleIceCandidate,
        onCallAccepted: handleCallAccepted,
        onCallDeclined: handleCallDeclined,
        onCallEnded: handleCallEnded,
        onUserBusy: handleUserBusy,
        onCallError: handleCallError,
      }, currentUser);
    }
    return () => {
      // Cleanup function to safely disconnect
      const cleanup = async () => {
        try {
          await signalrCallService.disconnectSignalRCallService();
        } catch (error) {
          console.warn('Error during SignalR disconnect cleanup:', error);
        }
        resetCallSession(); // Clean up streams and connections
      };
      cleanup();
    };
  }, [currentUser]); // Only depend on currentUser to avoid re-initialization


  const initiateCall = async (targetUser: User, type: 'video' | 'voice'): Promise<void> => {
    if (!currentUser || callSession.state !== CallState.IDLE) {
      alert("Cannot initiate call. Current state: " + callSession.state);
      return;
    }
    
    const callId = `call-${Date.now()}-${currentUser.id}-${targetUser.id}`;
    console.log(`Initiating ${type} call to ${targetUser.username} with callId: ${callId}`);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video' ? { width: 640, height: 480 } : false,
        audio: true,
      });
      
      const pc = createPeerConnection(callId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      setCallSession(prev => ({
        ...prev,
        callId,
        type,
        state: CallState.INITIATING_OUTGOING,
        initiator: currentUser,
        targetUser: targetUser,
        localStream: stream,
        peerConnection: pc,
      }));
      
      await signalrCallService.sendInitiateCallRequest({
        callId,
        initiator: currentUser,
        type,
        targetUser
      });
      
    } catch (error) {
      console.error("Error initiating call:", error);
      setCallSession(prev => ({...prev, state: CallState.ERROR, error: "Failed to get media or initiate call"}));
      resetCallSession();
    }
  };

  const answerCall = async (): Promise<void> => {
    if (!currentUser || callSession.state !== CallState.RECEIVING_INCOMING || !callSession.initiator || !callSession.callId) {
      alert("Cannot answer call. Invalid state.");
      return;
    }
    console.log(`Answering call from ${callSession.initiator.username}`);
    setIncomingCallDetails(null); // Clear notification details

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callSession.type === 'video' ? { width: 640, height: 480 } : false,
        audio: true,
      });

      const pc = createPeerConnection(callSession.callId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      setCallSession(prev => ({
        ...prev,
        state: CallState.NEGOTIATING, // Now negotiating SDP
        localStream: stream,
        peerConnection: pc,
        receiver: currentUser, // Current user is the receiver
        // targetUser is already set to initiator from handleIncomingCall
      }));

      // Notify caller that call is accepted. Caller will then send Offer.
      await signalrCallService.sendCallAcceptedSignal({
          callId: callSession.callId,
          accepter: currentUser,
          answerSdp: "" // Will be filled later during negotiation
      });
      // Note: The offer/answer flow will happen via SignalR handlers now.
      // setIsCallModalOpen(true); // Modal opens after SDP negotiation is successful

    } catch (error) {
      console.error("Error answering call:", error);
      setCallSession(prev => ({...prev, state: CallState.ERROR, error: "Failed to get media or answer call"}));
      // Also send decline if media fails
      await signalrCallService.sendCallDeclinedSignal({callId: callSession.callId, declinerId: currentUser.id});
      resetCallSession();
    }
  };

  const declineCall = async (): Promise<void> => {
    if (!callSession.callId || (callSession.state !== CallState.RECEIVING_INCOMING && callSession.state !== CallState.INITIATING_OUTGOING)) {
      alert("No active call to decline or invalid state.");
      return;
    }
    setIncomingCallDetails(null);

    const declinerId = currentUser!.id;
    // If we are receiving, targetUser is initiator. If we are initiating, targetUser is callee.


    console.log(`Declining call ${callSession.callId}`);
    await signalrCallService.sendCallDeclinedSignal({ callId: callSession.callId, declinerId: declinerId });
    resetCallSession();
  };

  const endCall = async (): Promise<void> => {
    if (!callSession.callId || (callSession.state !== CallState.ONGOING && callSession.state !== CallState.NEGOTIATING)) {
      // alert("No active call to end."); // Could be too noisy if called during cleanup
      return;
    }
    console.log(`Ending call ${callSession.callId}`);
    await signalrCallService.sendCallEndedSignal({ callId: callSession.callId, enderId: currentUser!.id });
    resetCallSession();
  };

  const toggleMuteAudio = () => {
    if (callSession.localStream) {
      const audioTrack = callSession.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallSession(prev => ({ ...prev, isLocalAudioMuted: !audioTrack.enabled }));
      }
    }
  };

  const toggleMuteVideo = () => {
    if (callSession.localStream && callSession.type === 'video') {
      const videoTrack = callSession.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallSession(prev => ({ ...prev, isLocalVideoMuted: !videoTrack.enabled }));
      }
    }
  };
  
  const clearIncomingCallDetails = () => {
    setIncomingCallDetails(null);
  };


  return (
    <CallContext.Provider value={{ 
      callSession, 
      isCallModalOpen,
      initiateCall, 
      answerCall, 
      declineCall, 
      endCall, 
      toggleMuteAudio, 
      toggleMuteVideo,
      incomingCallDetails,
      clearIncomingCallDetails
    }}>
      {children}
    </CallContext.Provider>
  );
};
