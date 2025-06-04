import * as signalR from '@microsoft/signalr';
import type { Message } from '../types';
import { MessageType } from '../types';

interface TypingIndicatorPayload {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

export default class SignalRChatService {
    private connection: signalR.HubConnection | null = null;
    private messageCallbacks: ((message: Message) => void)[] = [];
    private typingCallbacks: ((payload: TypingIndicatorPayload) => void)[] = [];
    private messageStatusCallbacks: ((data: { chatId: string; messageId: string; userId: string; status: string }) => void)[] = [];
    private isInitialized = false;

    constructor() {
        // Defer connection initialization until start() is called
    }

    private initializeConnection(): void {
        if (this.isInitialized) return;

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl('/hubs/chat', {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        this.connection.on('ReceiveMessage', (message: Message) => {
            this.messageCallbacks.forEach(callback => callback(message));
        });

        this.connection.on('UserTyping', (payload: TypingIndicatorPayload) => {
            this.typingCallbacks.forEach(callback => callback(payload));
        });

        this.connection.on('MessageStatus', (data: { chatId: string; messageId: string; userId: string; status: string }) => {
            this.messageStatusCallbacks.forEach(callback => callback(data));
        });

        this.isInitialized = true;
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
            if (!this.connection) {
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
}
