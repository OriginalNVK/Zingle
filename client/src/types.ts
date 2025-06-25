export enum UserRole {
  USER = 'User',
  ADMIN = 'Admin',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system'
}

export enum FriendRequestStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  DECLINED = 'Declined',
  BLOCKED = 'Blocked'
}

export enum CallState {
  IDLE = 'IDLE',
  INITIATING_OUTGOING = 'INITIATING_OUTGOING',
  RECEIVING_INCOMING = 'RECEIVING_INCOMING',
  NEGOTIATING = 'NEGOTIATING',
  ONGOING = 'ONGOING',
  ERROR = 'ERROR',
  ENDED = 'ENDED'
}

export interface User {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastActive?: Date;
  bio?: string;
  role?: string;
  isFriend?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastActive?: Date;
  bio?: string;
  token: string;
  role: string;
}

export interface Chat {
  id: string;
  name: string;
  isGroupChat: boolean;
  avatarUrl?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  lastActivity?: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderUsername?: string;
  senderAvatarUrl?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  status?: MessageStatus;
}

export interface CreateChatRequest {
  participantIds: string[];
  isGroupChat: boolean;
  name: string;
  avatarUrl?: string;
}

export interface Friend {
  id: string;
  friend: User;
  createdAt: Date;
}

export interface FriendRequest {
  id: string;
  fromUser: User;
  toUser: User;
  status: string;
  createdAt: Date;
  respondedAt?: Date;
}

export enum CallType {
  AUDIO = 0,
  VIDEO = 1
}

export interface Call {
  id: string;
  callerId: string;
  recipientId: string;
  type: CallType;
  state: CallState;
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
}

export interface CallSession {
  callId: string;
  type: 'voice' | 'video';
  state: CallState;
  initiator?: User;
  receiver?: User;
  targetUser?: User;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  peerConnection?: RTCPeerConnection;
  isLocalAudioMuted: boolean;
  isLocalVideoMuted: boolean;
  error?: string;
}

export interface SignalRBasePayload {
  callId: string;
}

export interface InitiateCallSignalPayload extends SignalRBasePayload {
  initiator: User;
  type: 'video' | 'voice';
  targetUser: User;
}

export interface CallOfferSignalPayload extends SignalRBasePayload {
  peerId: string;
  offer: RTCSessionDescriptionInit;
}

export interface CallAnswerSignalPayload extends SignalRBasePayload {
  peerId: string;
  answer: RTCSessionDescriptionInit;
  answererId: string;
}

export interface CallAcceptedSignalPayload extends SignalRBasePayload {
  accepter: User;
  answerSdp: string;
}

export interface CallDeclinedSignalPayload extends SignalRBasePayload {
  declinerId: string;
  isBusy?: boolean;
}

export interface CallEndedSignalPayload extends SignalRBasePayload {
  enderId: string;
}

export interface IceCandidateSignalPayload extends SignalRBasePayload {
  candidate: RTCIceCandidateInit;
}

export interface TypingIndicatorPayload {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  SEEN = 'seen'
}
