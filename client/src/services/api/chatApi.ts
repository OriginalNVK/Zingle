import api from './axiosConfig';
import type { Chat, Message } from '../../types';

interface CreateChatRequest {
    participantIds: string[];
    isGroupChat: boolean;
    name: string;
    avatarUrl?: string;
}

interface CreateMessageDto {
    content: string;
    type: string;
    imageUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
}

// Backend DTOs
interface ChatDto {
    id: string;
    name: string;
    isGroupChat: boolean;
    avatarUrl?: string;
    createdAt: string;
    lastActivity?: string;
    lastMessage?: MessageDto;
    unreadCount: number;
    participants: ChatParticipantDto[];
    isTyping: boolean;
}

interface ChatParticipantDto {
    userId: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    isOnline: boolean;
    lastActive?: string;
    customNickname?: string;
    isAdmin: boolean;
}

interface MessageDto {
    id: string;
    chatId: string;
    senderId: string;
    senderUsername: string;
    senderAvatarUrl?: string;
    content: string;
    timestamp: string;
    type: string;
    imageUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    isRead: boolean;
    status?: string;
}

// Adapter functions
const mapChatDtoToChat = (dto: ChatDto): Chat => ({
    id: dto.id,
    name: dto.name,
    isGroupChat: dto.isGroupChat,
    avatarUrl: dto.avatarUrl,
    participants: dto.participants.map(p => ({
        id: p.userId,
        username: p.username,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        isOnline: p.isOnline,
        lastActive: p.lastActive ? new Date(p.lastActive) : undefined,
        role: p.isAdmin ? 'Admin' : 'User'
    })),
    lastMessage: dto.lastMessage ? mapMessageDtoToMessage(dto.lastMessage) : undefined,
    unreadCount: dto.unreadCount,
    createdAt: new Date(dto.createdAt),
    lastActivity: dto.lastActivity ? new Date(dto.lastActivity) : undefined
});

const mapMessageDtoToMessage = (dto: MessageDto): Message => ({
    id: dto.id,
    chatId: dto.chatId,
    senderId: dto.senderId,
    senderUsername: dto.senderUsername,
    senderAvatarUrl: dto.senderAvatarUrl,
    content: dto.content,
    timestamp: new Date(dto.timestamp),
    isRead: dto.isRead,
    type: dto.type,
    imageUrl: dto.imageUrl,
    fileUrl: dto.fileUrl,
    fileName: dto.fileName,
    fileSize: dto.fileSize,
    status: dto.status as any
});

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

// Retry function for network errors
const retryRequest = async <T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await requestFn();
        } catch (error: any) {
            lastError = error;
            
            // Only retry on network errors or 5xx server errors
            const isNetworkError = error.message === 'Network Error' || 
                                 error.code === 'NETWORK_ERROR' ||
                                 error.code === 'ECONNABORTED' ||
                                 error.code === 'ERR_NETWORK';
            const isServerError = error.response?.status >= 500;
            const isTimeoutError = error.code === 'ECONNABORTED' || error.message.includes('timeout');
            
            if ((isNetworkError || isServerError || isTimeoutError) && attempt < maxRetries) {
                console.warn(`API request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
                continue;
            }
            
            break;
        }
    }
    
    throw lastError;
};

export const chatApi = {
    getChats: async (): Promise<Chat[]> => {
        return retryRequest(async () => {
            try {
                const response = await api.get<ChatDto[]>('/chats');
                return response.data.map(mapChatDtoToChat);
            } catch (error: any) {
                if (error.response?.status === 401) {
                    throw new ApiError(401, 'Unauthorized. Please log in again.');
                }
                throw new ApiError(error.response?.status || 500, error.message);
            }
        });
    },

    createChat: async (data: CreateChatRequest): Promise<Chat> => {
        return retryRequest(async () => {
            try {
                const response = await api.post<ChatDto>('/chats', {
                    isGroupChat: data.isGroupChat,
                    name: data.name,
                    avatarUrl: data.avatarUrl,
                    participantIds: data.participantIds
                });
                return mapChatDtoToChat(response.data);
            } catch (error: any) {
                if (error.response?.status === 400) {
                    throw new ApiError(400, error.response.data.message || 'Invalid chat creation request');
                }
                if (error.response?.status === 401) {
                    throw new ApiError(401, 'Unauthorized. Please log in again.');
                }
                throw new ApiError(error.response?.status || 500, error.message);
            }
        });
    },

    getMessages: async (chatId: string): Promise<Message[]> => {
        return retryRequest(async () => {
            try {
                console.log(`Fetching messages for chat: ${chatId}`);
                const response = await api.get<MessageDto[]>(`/chats/${chatId}/messages`);
                console.log(`Successfully fetched ${response.data.length} messages for chat: ${chatId}`);
                return response.data.map(mapMessageDtoToMessage);
            } catch (error: any) {
                console.error(`Failed to fetch messages for chat ${chatId}:`, error);
                if (error.response?.status === 403) {
                    throw new ApiError(403, 'You do not have permission to access this chat');
                }
                if (error.response?.status === 404) {
                    throw new ApiError(404, 'Chat not found');
                }
                // Handle network errors more gracefully
                if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                    throw new ApiError(0, 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc đảm bảo backend đang chạy.');
                }
                if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                    console.warn('Request timeout. Hãy kiểm tra lại backend server có đang chạy không!');
                    throw new ApiError(0, 'Không thể kết nối tới máy chủ (timeout). Vui lòng kiểm tra lại backend server hoặc kết nối mạng.');
                }
                throw new ApiError(error.response?.status || 500, error.message);
            }
        }, 3, 2000); // Retry up to 3 times with 2 second initial delay
    },

    sendMessage: async (chatId: string, messageData: CreateMessageDto): Promise<Message> => {
        return retryRequest(async () => {
            try {
                const response = await api.post<MessageDto>(`/chats/${chatId}/messages`, messageData);
                return mapMessageDtoToMessage(response.data);
            } catch (error: any) {
                if (error.response?.status === 403) {
                    throw new ApiError(403, 'You do not have permission to send messages in this chat');
                }
                if (error.response?.status === 404) {
                    throw new ApiError(404, 'Chat not found');
                }
                throw new ApiError(error.response?.status || 500, error.message);
            }
        });
    },

    markAsRead: async (chatId: string): Promise<void> => {
        return retryRequest(async () => {
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
        });
    },

    deleteChat: async (chatId: string): Promise<void> => {
        return retryRequest(async () => {
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
        });
    }
};
