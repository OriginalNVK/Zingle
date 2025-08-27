import React, { useRef, useEffect, useState } from 'react';
import { useCall } from '../contexts/CallContext';
import { CallState } from '../types';
import UserAvatar from './UserAvatar';
import Button from './common/Button';
import { LogOutIcon as EndCallIcon, PhoneIcon } from './icons';
import { getDisplayName } from '../utils/displayName';

// Define proper on/off state icons
const MicOn: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
);

const MicOff: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
);

const VideoOn: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="23 7 16 12 23 17 23 7"></polygon>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
    </svg>
);

const VideoOff: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

const CallModal: React.FC = () => {
  const { callSession, isCallModalOpen, endCall, toggleMuteAudio, toggleMuteVideo, answerCall, declineCall } = useCall();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);

  // Countdown timer for outgoing calls
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (callSession.state === CallState.INITIATING_OUTGOING) {
      setTimeRemaining(30);
      intervalId = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (intervalId) clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalId) clearInterval(intervalId);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [callSession.state]);

  useEffect(() => {
    if (localVideoRef.current && callSession.localStream) {
      localVideoRef.current.srcObject = callSession.localStream;
    }
  }, [callSession.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && callSession.remoteStream) {
      remoteVideoRef.current.srcObject = callSession.remoteStream;
    }
  }, [callSession.remoteStream]);

  if (!isCallModalOpen && 
      callSession.state !== CallState.INITIATING_OUTGOING && 
      callSession.state !== CallState.RECEIVING_INCOMING &&
      callSession.state !== CallState.NEGOTIATING && 
      callSession.state !== CallState.ONGOING) {
    // Show modal for initiating, receiving, negotiating, and ongoing calls
    // Hide for idle, error, and ended states
    return null; 
  }

  const targetUser = callSession.initiator?.id === callSession.targetUser?.id ? callSession.receiver : callSession.targetUser;


  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 text-white p-4">
      {/* Emergency End Call Button - Always available in top right */}
      <div className="absolute top-4 right-4">
        <Button
          onClick={endCall}
          variant="danger"
          className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white opacity-80 hover:opacity-100 transition-all duration-200"
          title="End Call"
        >
          <EndCallIcon className="w-5 h-5 transform rotate-[135deg]" />
        </Button>
      </div>

      <div className="absolute top-4 left-4 text-left">
        {targetUser && (
            <>
                <UserAvatar user={targetUser} size="md" className="inline-block mr-2"/>
                <span className="text-lg font-semibold">Call with {getDisplayName(targetUser)}</span>
            </>
        )}
        <p className="text-sm capitalize">
          {callSession.type} Call - {callSession.state === CallState.INITIATING_OUTGOING ? 'Calling...' : 
                                    callSession.state === CallState.NEGOTIATING ? 'Connecting...' : 
                                    callSession.state === CallState.ONGOING ? 'Connected' : callSession.state}
        </p>
        {callSession.state === CallState.INITIATING_OUTGOING && (
          <div>
            <p className="text-xs text-yellow-400 mt-1">Waiting for user to answer...</p>
            <p className="text-xs text-red-400 mt-1">Auto-cancel in: {timeRemaining}s</p>
          </div>
        )}
        {callSession.state === CallState.NEGOTIATING && (
          <p className="text-xs text-blue-400 mt-1">Establishing connection...</p>
        )}
      </div>

      {/* Video Streams */}
      <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center gap-4 my-16">
        {/* Remote Video (Main View) */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden w-full md:w-3/4 h-3/4 md:h-full shadow-2xl">
          {callSession.type === 'video' && callSession.remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover transform scaleX-[-1]" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {targetUser && <UserAvatar user={targetUser} size="xl" showStatus={false} />}
              {callSession.type === 'voice' && <p className="mt-2 text-xl">{targetUser ? getDisplayName(targetUser) : 'Unknown'} (Voice Call)</p>}
              {callSession.state === CallState.INITIATING_OUTGOING && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                  <p className="text-gray-400">Calling...</p>
                </div>
              )}
              {callSession.state === CallState.NEGOTIATING && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-400">Connecting...</p>
                </div>
              )}
              {!callSession.remoteStream && callSession.type === 'video' && callSession.state === CallState.ONGOING && (
                <p className="text-gray-400 mt-2">Waiting for remote video...</p>
              )}
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture style) */}
         {callSession.type === 'video' && callSession.localStream && (
            <div className="absolute bottom-6 right-6 md:relative md:bottom-auto md:right-auto bg-gray-700 rounded-lg overflow-hidden w-32 h-24 md:w-1/4 md:h-1/4 shadow-lg border-2 border-gray-600">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scaleX-[-1]" />
            </div>
        )}
      </div>
      
      {/* Call Controls - Only show when call is ongoing or negotiating */}
      {(callSession.state === CallState.ONGOING || callSession.state === CallState.NEGOTIATING) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 flex justify-center items-center space-x-3 md:space-x-6">
          <Button
            onClick={toggleMuteAudio}
            variant="secondary"
            className={`p-3 rounded-full ${callSession.isLocalAudioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
            title={callSession.isLocalAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {callSession.isLocalAudioMuted ? <MicOff className="w-6 h-6" /> : <MicOn className="w-6 h-6" />}
          </Button>

          {callSession.type === 'video' && (
            <Button
              onClick={toggleMuteVideo}
              variant="secondary"
              className={`p-3 rounded-full ${callSession.isLocalVideoMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
              title={callSession.isLocalVideoMuted ? 'Turn Video On' : 'Turn Video Off'}
            >
              {callSession.isLocalVideoMuted ? <VideoOff className="w-6 h-6" /> : <VideoOn className="w-6 h-6" />}
            </Button>
          )}

          <Button
            onClick={endCall}
            variant="danger"
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white"
            title="End Call"
          >
            <EndCallIcon className="w-6 h-6 transform rotate-[135deg]" />
          </Button>
        </div>
      )}

      {/* End Call Button for initiating calls */}
      {callSession.state === CallState.INITIATING_OUTGOING && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 flex justify-center items-center">
          <Button
            onClick={endCall}
            variant="danger"
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white"
            title="Cancel Call"
          >
            <EndCallIcon className="w-6 h-6 transform rotate-[135deg]" />
          </Button>
        </div>
      )}

      {/* Answer/Decline buttons for incoming calls */}
      {callSession.state === CallState.RECEIVING_INCOMING && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 flex justify-center items-center space-x-6">
          <Button
            onClick={declineCall}
            variant="danger"
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transform hover:scale-105 transition-all duration-200"
            title="Decline Call"
          >
            <EndCallIcon className="w-7 h-7 transform rotate-[135deg]" />
          </Button>
          <Button
            onClick={answerCall}
            variant="primary"
            className="p-4 rounded-full bg-green-600 hover:bg-green-700 text-white transform hover:scale-105 transition-all duration-200 animate-pulse"
            title="Answer Call"
          >
            <PhoneIcon className="w-7 h-7" />
          </Button>
        </div>
      )}
       {callSession.error && <p className="text-red-400 text-xs mt-2 absolute bottom-20">{callSession.error}</p>}
    </div>
  );
};

export default CallModal;
