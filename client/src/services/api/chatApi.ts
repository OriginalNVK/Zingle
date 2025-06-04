import api from './axiosConfig';
import type { Chat, Message } from '../../types';
import { MessageType } from '../../types';

interface CreateChatRequest {
    participantIds: string[];
    isGroupChat: boolean;
    name: string;
    avatarUrl?: string;
}

interface CreateMessageDto {
    content: string;
    type: MessageType;
    imageUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
}

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

export const chatApi = {
    getChats: async (): Promise<Chat[]> => {
        try {
            const response = await api.get<Chat[]>('/chats');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new ApiError(401, 'Unauthorized. Please log in again.');
            }
            throw new ApiError(error.response?.status || 500, error.message);
        }
    },

    createChat: async (data: CreateChatRequest): Promise<Chat> => {
        try {
            const response = await api.post<Chat>('/chats', data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 400) {
                throw new ApiError(400, error.response.data.message || 'Invalid chat creation request');
            }
            if (error.response?.status === 401) {
                throw new ApiError(401, 'Unauthorized. Please log in again.');
            }
            throw new ApiError(error.response?.status || 500, error.message);
        }
    },

    getMessages: async (chatId: string): Promise<Message[]> => {
        try {
            const response = await api.get<Message[]>(`/chats/${chatId}/messages`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 403) {
                throw new ApiError(403, 'You do not have permission to access this chat');
            }
            if (error.response?.status === 404) {
                throw new ApiError(404, 'Chat not found');
            }
            throw new ApiError(error.response?.status || 500, error.message);
        }
    },

    sendMessage: async (chatId: string, messageData: CreateMessageDto): Promise<Message> => {
        try {
            const response = await api.post<Message>(`/chats/${chatId}/messages`, messageData);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 403) {
                throw new ApiError(403, 'You do not have permission to send messages in this chat');
            }
            if (error.response?.status === 404) {
                throw new ApiError(404, 'Chat not found');
            }
            throw new ApiError(error.response?.status || 500, error.message);
        }
    },

    markAsRead: async (chatId: string): Promise<void> => {
        try {
            await api.put(`/chats/${chatId}/read`);
        } catch (error: any) {
            if (error.response?.status === 403) {
                throw new ApiError(403, 'You do not have permission to access this chat');
            }
            if (error.response?.status === 404) {
                throw new ApiError(404, 'Chat not found');
            }
            throw new ApiError(error.response?.status || 500, error.message);
        }
    },

    deleteChat: async (chatId: string): Promise<void> => {
        try {
            await api.delete(`/chats/${chatId}`);
        } catch (error: any) {
            if (error.response?.status === 403) {
                throw new ApiError(403, 'You do not have permission to delete this chat');
            }
            if (error.response?.status === 404) {
                throw new ApiError(404, 'Chat not found');
            }
            throw new ApiError(error.response?.status || 500, error.message);
        }
    }
};
