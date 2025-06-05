import * as signalR from '@microsoft/signalr';
import type { Message } from '../types';
import { MessageType } from '../types';
import { tokenStorage } from '../utils/tokenStorage';

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

    constructor() {
        // Defer connection initialization until start() is called
    }    private initializeConnection(): void {
        if (this.isInitialized) return;

        const token = tokenStorage.getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }        const baseUrl = 'http://localhost:5024'; // Match the server URL
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrl}/hubs/chat`, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        this.setupEventHandlers();
        this.isInitialized = true;
    }

    private setupEventHandlers(): void {
        if (!this.connection) return;

        this.connection.on('ReceiveMessage', (message: Message) => {
            this.messageCallbacks.forEach(callback => callback(message));
        });

        this.connection.on('UserTyping', (payload: TypingIndicatorPayload) => {
            this.typingCallbacks.forEach(callback => callback(payload));
        });

        this.connection.on('MessageStatus', (data: { chatId: string; messageId: string; userId: string; status: string }) => {
            this.messageStatusCallbacks.forEach(callback => callback(data));
        });

        // Reconnect handling
        this.connection.onclose(async (error) => {
            console.log('SignalR Connection closed, attempting to reconnect...', error);
            await this.retryConnection();
        });
    }

    private async retryConnection(retryAttempt = 0, maxRetries = 5): Promise<void> {
        if (!this.connection) return;

        try {
            await this.connection.start();
            console.log('SignalR Connection reestablished');
        } catch (err) {
            console.error(`SignalR Connection retry attempt ${retryAttempt + 1} failed:`, err);
            if (retryAttempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retryAttempt), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
                await this.retryConnection(retryAttempt + 1, maxRetries);
            }
        }
    }

    async start(): Promise<void> {
        try {
            if (!this.isInitialized) {
                this.initializeConnection();
            }

            if (this.connection?.state === signalR.HubConnectionState.Disconnected) {
                await this.connection.start();
                console.log('SignalR Connection started');
            }
        } catch (err) {
            console.error('Error starting SignalR connection:', err);
            throw err;
        }
    }

    async stop(): Promise<void> {
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
        if (!this.connection) throw new Error('SignalR connection not initialized');
        await this.connection.invoke('SendMessage', { chatId, content, type });
    }

    async sendTypingIndicator(chatId: string, isTyping: boolean): Promise<void> {
        if (!this.connection) throw new Error('SignalR connection not initialized');
        await this.connection.invoke('SendTypingIndicator', { chatId, isTyping });
    }

    async joinChat(chatId: string): Promise<void> {
        if (!this.connection) throw new Error('SignalR connection not initialized');
        await this.connection.invoke('JoinChat', chatId);
    }

    async leaveChat(chatId: string): Promise<void> {
        if (!this.connection) throw new Error('SignalR connection not initialized');
        await this.connection.invoke('LeaveChat', chatId);
    }

    async markMessageAsRead(chatId: string, messageId: string): Promise<void> {
        if (!this.connection) throw new Error('SignalR connection not initialized');
        await this.connection.invoke('MarkMessageAsRead', chatId, messageId);
    }
}

export default SignalRChatService;
