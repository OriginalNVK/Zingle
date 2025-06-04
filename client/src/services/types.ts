export enum UserRole {
    USER = 'User',
    ADMIN = 'Admin'
}

export enum MessageType {
    TEXT = 0,
    IMAGE = 1,
    FILE = 2,
    SYSTEM = 3
}

export enum CallType {
    AUDIO = 0,
    VIDEO = 1
}

export enum CallState {
    INITIATED = 0,
    ACTIVE = 1,
    MISSED = 2,
    REJECTED = 3,
    COMPLETED = 4
}

export interface User {
    id: string;
    username: string;
    displayName: string;
    email?: string;
    avatarUrl?: string;
    isOnline: boolean;
    lastActive?: Date;
    bio?: string;
    role: string;
}

export interface AuthRequest {
    email: string;
    password: string;
}

export interface RegisterRequest extends AuthRequest {
    username: string;
}

export interface AuthResponse extends User {
    token: string;
}

export interface Chat {
    id: string;
    name: string;
    isGroupChat: boolean;
    avatarUrl?: string;
    participants: User[];
    lastMessage?: Message;
    createdAt: Date;
    lastActivity?: Date;
}

export interface Message {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    type: MessageType;
    timestamp: Date;
    imageUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
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
