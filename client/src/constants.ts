export const DEFAULT_AVATAR_URL = 'https://placehold.co/100x100/7F00FF/FFFFFF?text=??';
export const APP_NAME = 'Zingle';

// Route Paths
export const ROUTE_PATHS = {
  LOGIN: '/login',
  REGISTER: '/register',
  CHAT: '/', // Main view with ZingleLayout will default to chats
  PEOPLE: '/people', 
  SETTINGS: '/settings', 
  ADMIN_DASHBOARD: '/admin', 
  NOT_FOUND: '/404',
};

// --- Call Related Constants ---
// This URL would point to your SignalR Hub for call signaling.
// For local development, it might be 'https://localhost:PORT/callhub' or similar.
export const SIGNALR_CALL_HUB_URL = "http://localhost:5024/hubs/call"; // Updated with correct server URL and path

// Basic WebRTC configuration using a public STUN server.
// For production, you'd likely need TURN servers as well.
export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Add TURN server configurations here if needed
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'your-username',
    //   credential: 'your-password',
    // },
  ],
};
