import * as signalR from '@microsoft/signalr';
import type { Message } from '../types';
import { MessageType } from '../types';
import { tokenStorage } from '../utils/tokenStorage';
import { API_URL } from '../config';

interface TypingIndicatorPayload {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

export class SignalRChatService {
    private connection: signalR.HubConnection | null = null;
    private messageCallbacks: ((message: Message) => void)[] = [];
    private typingCallbacks: ((payload: TypingIndicatorPayload) => void)[] = [];
    private messageStatusCallbacks: ((data: { chatId: string; messageId: string; userId: string; status: string }) => void)[] = [];
    private isInitialized = false;
    private isConnecting = false;
    private connectionAttempts = 0;
    private maxConnectionAttempts = 5;
    private reconnectTimer: number | null = null;

    constructor() {
        // Defer connection initialization until start() is called
    }

    private initializeConnection(): void {
        if (this.isInitialized) return;

        const token = tokenStorage.getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Use the same base URL as API
        const baseUrl = API_URL.replace('/api', ''); // Remove /api from the end
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrl}/hubs/chat`, {
                accessTokenFactory: () => token,
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets,
                withCredentials: true
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: retryContext => {
                    if (retryContext.previousRetryCount === 0) {
                        return 0;
                    }
                    if (retryContext.previousRetryCount < 3) {
                        return 2000;
                    }
                    if (retryContext.previousRetryCount < 5) {
                        return 10000;
                    }
                    return null;
                }
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.setupEventHandlers();
        this.isInitialized = true;
    }

    private setupEventHandlers(): void {
        if (!this.connection) return;

        this.connection.on('ReceiveMessage', (messageData: any) => {
            console.log('Received message:', messageData);
            // Convert backend message format to frontend Message type
            const message: Message = {
                id: messageData.Id,
                chatId: messageData.ChatId,
                senderId: messageData.SenderId,
                senderUsername: messageData.SenderUsername,
                content: messageData.Content,
                timestamp: new Date(messageData.Timestamp),
                isRead: messageData.IsRead,
                type: messageData.Type,
                imageUrl: messageData.ImageUrl,
                fileUrl: messageData.FileUrl,
                fileName: messageData.FileName,
                fileSize: messageData.FileSize,
                status: messageData.Status
            };
            this.messageCallbacks.forEach(callback => callback(message));
        });

        this.connection.on('ReceiveTypingIndicator', (payload: any) => {
            console.log('Received typing indicator:', payload);
            // Convert backend typing indicator format to frontend format
            const typingPayload: TypingIndicatorPayload = {
                chatId: payload.ChatId,
                userId: payload.UserId,
                isTyping: payload.IsTyping
            };
            this.typingCallbacks.forEach(callback => callback(typingPayload));
        });

        this.connection.on('MessageStatus', (data: { chatId: string; messageId: string; userId: string; status: string }) => {
            console.log('Received message status:', data);
            this.messageStatusCallbacks.forEach(callback => callback(data));
        });

        // Connection state change handling
        this.connection.onreconnecting((error) => {
            console.log('SignalR Connection reconnecting...', error);
        });

        this.connection.onreconnected((connectionId) => {
            console.log('SignalR Connection reconnected with ID:', connectionId);
            this.connectionAttempts = 0; // Reset attempts on successful reconnection
        });

        this.connection.onclose(async (error) => {
            console.log('SignalR Connection closed, attempting to reconnect...', error);
            this.scheduleReconnect();
        });
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000); // Max 30 seconds
        this.reconnectTimer = window.setTimeout(() => {
            this.retryConnection();
        }, delay);
    }

    private async retryConnection(retryAttempt = 0, maxRetries = 5): Promise<void> {
        if (!this.connection || this.connectionAttempts >= maxRetries) {
            console.log('Max retry attempts reached or connection not available');
            return;
        }

        try {
            this.connectionAttempts++;
            console.log(`Attempting to reconnect (${this.connectionAttempts}/${maxRetries})...`);
            await this.connection.start();
            console.log('SignalR Connection reestablished');
            this.connectionAttempts = 0; // Reset on successful connection
        } catch (err) {
            console.error(`SignalR Connection retry attempt ${this.connectionAttempts} failed:`, err);
            if (this.connectionAttempts < maxRetries) {
                this.scheduleReconnect();
            }
        }
    }

    async start(): Promise<void> {
        if (this.isConnecting) {
            console.log('SignalR connection already in progress, skipping...');
            return;
        }

        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            console.log('SignalR connection already connected');
            return;
        }

        try {
            this.isConnecting = true;
            this.connectionAttempts = 0;

            if (!this.isInitialized) {
                this.initializeConnection();
            }

            if (this.connection && this.connection.state === signalR.HubConnectionState.Disconnected) {
                console.log('Starting SignalR connection...');
                await this.connection.start();
                console.log('SignalR Connection started successfully');
                this.connectionAttempts = 0; // Reset attempts on successful connection
            }
        } catch (err) {
            console.error('Error starting SignalR connection:', err);
            this.connectionAttempts++;
            
            // Handle specific handshake errors
            if (err instanceof Error) {
                if (err.message.includes('Handshake was canceled') || 
                    err.message.includes('handshake error') ||
                    err.message.includes('Failed to start transport')) {
                    console.warn('Handshake error detected, this might be due to server not running or authentication issues');
                    
                    // If we have connection attempts left, try to reconnect
                    if (this.connectionAttempts < this.maxConnectionAttempts) {
                        console.log(`Retrying connection attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
                        const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 10000);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return this.start();
                    }
                }
            }
            
            // Don't throw error, just log it and allow the app to continue
            console.warn('SignalR connection failed, but app will continue without real-time features');
            throw err; // Re-throw to let caller handle it
        } finally {
            this.isConnecting = false;
        }
    }

    async stop(): Promise<void> {
        if (this.reconnectTimer) {
            window.clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            await this.connection.stop();
            console.log('SignalR Connection stopped');
        }
    }

    onMessage(callback: (message: Message) => void): void {
        this.messageCallbacks.push(callback);
    }

    offMessage(callback: (message: Message) => void): void {
        this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    }

    onTyping(callback: (payload: TypingIndicatorPayload) => void): void {
        this.typingCallbacks.push(callback);
    }

    offTyping(callback: (payload: TypingIndicatorPayload) => void): void {
        this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    }

    onMessageStatus(callback: (data: { chatId: string; messageId: string; userId: string; status: string }) => void): void {
        this.messageStatusCallbacks.push(callback);
    }

    offMessageStatus(callback: (data: { chatId: string; messageId: string; userId: string; status: string }) => void): void {
        this.messageStatusCallbacks = this.messageStatusCallbacks.filter(cb => cb !== callback);
    }

    async sendMessage(chatId: string, content: string, type: MessageType = MessageType.TEXT): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('SignalR not connected, message will not be sent via real-time');
            return;
        }
        await this.connection.invoke('SendMessage', { 
            chatId, 
            content, 
            type: type.toString() 
        });
    }

    async sendTypingIndicator(chatId: string, isTyping: boolean): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('SignalR not connected, typing indicator will not be sent');
            return;
        }
        await this.connection.invoke('SendTypingIndicator', chatId, isTyping);
    }

    async joinChat(chatId: string): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('SignalR not connected, cannot join chat');
            return;
        }
        await this.connection.invoke('JoinChat', chatId);
    }

    async leaveChat(chatId: string): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('SignalR not connected, cannot leave chat');
            return;
        }
        await this.connection.invoke('LeaveChat', chatId);
    }

    async markMessageAsRead(chatId: string, messageId: string): Promise<void> {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            console.warn('SignalR not connected, cannot mark message as read');
            return;
        }
        await this.connection.invoke('MarkMessageAsRead', chatId, messageId);
    }

    isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    getConnectionState(): string {
        return this.connection?.state || 'Unknown';
    }

    getConnectionAttempts(): number {
        return this.connectionAttempts;
    }
}
