
import * as signalR from "@microsoft/signalr";
import type { 
  User,
  CallOfferSignalPayload, 
  CallAnswerSignalPayload, 
  IceCandidateSignalPayload,
  InitiateCallSignalPayload,
  CallAcceptedSignalPayload,
  CallDeclinedSignalPayload,
  CallEndedSignalPayload,
  SignalRBasePayload
} from '../types';
import { SIGNALR_CALL_HUB_URL } from "../constants";

// Callbacks that CallContext will provide
interface SignalRCallCallbacks {
  onIncomingCall: (payload: InitiateCallSignalPayload) => void;
  onCallOffer: (payload: CallOfferSignalPayload) => void;
  onCallAnswer: (payload: CallAnswerSignalPayload) => void;
  onIceCandidate: (payload: IceCandidateSignalPayload) => void;
  onCallAccepted: (payload: CallAcceptedSignalPayload) => void;
  onCallDeclined: (payload: CallDeclinedSignalPayload) => void;
  onCallEnded: (payload: CallEndedSignalPayload) => void;
  onUserBusy: (payload: SignalRBasePayload) => void;
  onCallError: (error: string, callId?: string) => void;
}

let connection: signalR.HubConnection | null = null;
let callCallbacks: SignalRCallCallbacks | null = null;
let currentSignalRUser: User | null = null; // Store the user for re-connection attempts

// Encapsulates setting up all SignalR event handlers for a connection instance
const setupConnectionHandlers = (conn: signalR.HubConnection) => {
  conn.onclose(error => {
    console.warn("SignalR Call Hub connection closed.", error);
    if (callCallbacks?.onCallError && error) {
        callCallbacks.onCallError("SignalR connection closed: " + error.message);
    }
    // Note: withAutomaticReconnect handles re-establishing.
    // If auto-reconnect fails permanently, onclose will be the final notification.
  });

  conn.onreconnecting(error => {
    console.warn("SignalR Call Hub attempting to reconnect...", error);
    if (callCallbacks?.onCallError && error) {
      // Avoid flooding with "reconnecting" errors if it's normal behavior.
      // Only report if it's an unexpected or persistent issue.
      // callCallbacks.onCallError("SignalR connection reconnecting: " + error.message);
    }
  });

  conn.onreconnected(connectionId => {
    console.log("SignalR Call Hub reconnected. ConnectionId:", connectionId);
    // Optionally notify UI about successful reconnection
  });

  // Register application-specific handlers
  conn.on("IncomingCall", (payload: InitiateCallSignalPayload) => {
    console.log("SignalR: Received IncomingCall", payload);
    callCallbacks?.onIncomingCall(payload);
  });

  conn.on("ReceiveOffer", (payload: CallOfferSignalPayload) => {
    console.log("SignalR: Received Offer", payload);
    callCallbacks?.onCallOffer(payload);
  });

  conn.on("ReceiveAnswer", (payload: CallAnswerSignalPayload) => {
    console.log("SignalR: Received Answer", payload);
    callCallbacks?.onCallAnswer(payload);
  });

  conn.on("ReceiveIceCandidate", (payload: IceCandidateSignalPayload) => {
    console.log("SignalR: Received ICE Candidate", payload);
    callCallbacks?.onIceCandidate(payload);
  });
  
  conn.on("CallAccepted", (payload: CallAcceptedSignalPayload) => {
    console.log("SignalR: CallAccepted", payload);
    callCallbacks?.onCallAccepted(payload);
  });

  conn.on("CallDeclined", (payload: CallDeclinedSignalPayload) => {
    console.log("SignalR: CallDeclined", payload);
    callCallbacks?.onCallDeclined(payload);
  });
  
  conn.on("CallEnded", (payload: CallEndedSignalPayload) => {
    console.log("SignalR: CallEnded", payload);
    callCallbacks?.onCallEnded(payload);
  });

  conn.on("UserBusy", (payload: SignalRBasePayload) => {
    console.log("SignalR: UserBusy", payload);
    callCallbacks?.onUserBusy(payload);
  });
  
  conn.on("CallError", (errorMessage: string, callId?: string) => {
    console.error("SignalR: CallError received from hub:", errorMessage, callId);
    callCallbacks?.onCallError(errorMessage, callId);
  });
};


const ensureConnection = async (userForConnection: User | null): Promise<signalR.HubConnection> => {
  if (!userForConnection) {
    const errMsg = "User not available for SignalR connection.";
    console.error("SignalR:", errMsg);
    if (callCallbacks?.onCallError) {
        callCallbacks.onCallError(errMsg);
    }
    throw new Error(errMsg);
  }

  // If connection exists and is connected, return it.
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  // If connection exists but is currently Connecting or Reconnecting, return it.
  // SignalR's .invoke() will queue the call and wait for connection.
  if (connection && (connection.state === signalR.HubConnectionState.Connecting || connection.state === signalR.HubConnectionState.Reconnecting)) {
    console.log(`SignalR: Connection is already ${connection.state}. Proceeding, invoke will queue/wait.`);
    return connection;
  }
  
  // If connection doesn't exist, or is Disconnected (or Disconnecting, which means it needs to be recreated)
  // then create and start a new one.
  if (!connection || 
      connection.state === signalR.HubConnectionState.Disconnected ||
      connection.state === signalR.HubConnectionState.Disconnecting) {
    
    if (connection) { 
        console.log(`SignalR: Previous connection was ${connection.state}. Stopping and creating a new connection object.`);
         await connection.stop().catch(e => console.warn("SignalR: Error stopping previous connection during ensureConnection:", e));
    }
    
    console.log("SignalR: Creating and starting new HubConnection for user:", userForConnection.id);
    connection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_CALL_HUB_URL}?userId=${userForConnection.id}`)
      .withAutomaticReconnect() 
      .configureLogging(signalR.LogLevel.Information)
      .build();
    
    setupConnectionHandlers(connection); // Setup handlers for the NEW connection

    try {
      await connection.start();
      console.log("SignalR Call Hub new connection started successfully. State:", connection.state);
      if (connection.state !== signalR.HubConnectionState.Connected) {
        // This case should ideally not be hit if .start() resolves without error.
        // If it does, it implies an immediate issue post-successful start promise.
        const errMessage = `SignalR: Connection.start() resolved, but state is ${connection.state}.`;
        console.error(errMessage);
        // connection = null; // Nullify as it's not in a usable state.
        throw new Error(errMessage);
      }
    } catch (err) {
      console.error("SignalR Call Hub new connection start failed: ", err);
      if (callCallbacks?.onCallError && err instanceof Error) {
        callCallbacks.onCallError("SignalR connection failed: " + err.message);
      }
      connection = null; 
      throw err;
    }
  }
  
  if (!connection) {
      const errMsg = "SignalR: Connection is null after attempt to establish.";
      console.error(errMsg);
      throw new Error(errMsg); 
  }
  
  return connection;
};

export const initializeSignalRCallService = (callbacks: SignalRCallCallbacks, user: User | null) => {
  callCallbacks = callbacks;
  currentSignalRUser = user; 
  if (currentSignalRUser) {
      console.log("SignalR: Initializing connection for user:", currentSignalRUser.id);
      ensureConnection(currentSignalRUser).catch(err => {
          console.error("SignalR: Background initialization/ensureConnection failed:", err.message);
      });
  } else {
      console.warn("SignalR Call Service: Current user not available, connection deferred.");
  }
};

export const disconnectSignalRCallService = async () => {
  if (connection) {
    console.log("SignalR: Disconnecting call service. Current state:", connection.state);
    connection.off("IncomingCall");
    connection.off("ReceiveOffer");
    connection.off("ReceiveAnswer");
    connection.off("ReceiveIceCandidate");
    connection.off("CallAccepted");
    connection.off("CallDeclined");
    connection.off("CallEnded");
    connection.off("UserBusy");
    connection.off("CallError");
    try {
        await connection.stop();
        console.log("SignalR Call Hub disconnected successfully.");
    } catch(e) {
        console.error("SignalR: Error during explicit disconnect stop:", e);
    }
  }
  connection = null; 
  currentSignalRUser = null; 
};

// Helper for invoking hub methods with error handling
const invokeHubMethod = async (methodName: string, payload: any, callId?: string) => {
  let activeConnection: signalR.HubConnection;
  try {
    activeConnection = await ensureConnection(currentSignalRUser);
  } catch (e: any) {
    console.error(`SignalR: ensureConnection failed before invoking ${methodName}:`, e.message);
    // ensureConnection calls onCallError if userForConnection is null or if start fails.
    // Re-throw so the calling function knows the operation failed.
    throw e;
  }
  
  try {
    await activeConnection.invoke(methodName, payload);
    console.log(`SignalR: ${methodName} invoked successfully.`, payload);
  } catch (e: any) {
    const originalErrorMessage = String(e.message || e);
    
    // Check for the specific error: "Cannot send data if the connection is not in the 'Connected' State."
    if (originalErrorMessage.includes("Cannot send data if the connection is not in the 'Connected' State")) {
      console.warn(`SignalR: Retrying ${methodName} after "not connected" error during invoke. Original error: ${originalErrorMessage}`);
      try {
        // Force re-evaluation of connection, potentially starting a new one if it had dropped.
        activeConnection = await ensureConnection(currentSignalRUser); // Re-ensure
        await activeConnection.invoke(methodName, payload); // Retry invoke
        console.log(`SignalR: ${methodName} succeeded on retry.`);
        return; // Successful retry, exit function
      } catch (retryError: any) {
        console.error(`SignalR: Error on retry invoking ${methodName}:`, retryError.message, "Payload for retry:", payload);
        // If retry fails, use the retryError for reporting and throwing
        if (callCallbacks) {
            callCallbacks.onCallError(
                `Hub operation ${methodName} failed on retry: ${String(retryError.message || retryError)}`, 
                callId || (payload as SignalRBasePayload)?.callId
            );
        }
        throw retryError; // Throw the error from the retry attempt
      }
    }

    // If it's not the specific "not connected" error, or if it's an error from a failed retry logic above, handle as original.
    console.error(`SignalR: Error invoking ${methodName} on hub:`, originalErrorMessage, "Payload:", payload);
    if (callCallbacks) {
        callCallbacks.onCallError(
            `Hub operation ${methodName} failed: ${originalErrorMessage}`, 
            callId || (payload as SignalRBasePayload)?.callId
        );
    }
    throw e; // Re-throw original error or the error that bypassed the retry logic
  }
};


export const sendInitiateCallRequest = async (payload: InitiateCallSignalPayload) => {
  await invokeHubMethod("InitiateCall", payload, payload.callId);
};

export const sendOffer = async (payload: CallOfferSignalPayload) => {
  await invokeHubMethod("SendOffer", payload, payload.callId);
};

export const sendAnswer = async (payload: CallAnswerSignalPayload) => {
  await invokeHubMethod("SendAnswer", payload, payload.callId);
};

export const sendIceCandidate = async (payload: IceCandidateSignalPayload) => {
  await invokeHubMethod("SendIceCandidate", payload, payload.callId);
};

export const sendCallAcceptedSignal = async (payload: CallAcceptedSignalPayload) => {
  await invokeHubMethod("AcceptCall", payload, payload.callId);
};

export const sendCallDeclinedSignal = async (payload: CallDeclinedSignalPayload) => {
  await invokeHubMethod("DeclineCall", payload, payload.callId);
};

export const sendCallEndedSignal = async (payload: CallEndedSignalPayload) => {
  await invokeHubMethod("EndCall", payload, payload.callId);
};
