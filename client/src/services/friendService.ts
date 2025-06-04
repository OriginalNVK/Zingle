import api from './api';
import type { Friend, FriendRequest } from '../types';

export const friendService = {
    getFriends: async (): Promise<Friend[]> => {
        const response = await api.get('/friends');
        return response.data;
    },

    getFriendRequests: async (): Promise<FriendRequest[]> => {
        const response = await api.get('/friends/requests');
        return response.data;
    },

    sendFriendRequest: async (toUserId: string): Promise<FriendRequest> => {
        const response = await api.post('/friends/requests', { toUserId });
        return response.data;
    },

    acceptFriendRequest: async (requestId: string): Promise<Friend> => {
        const response = await api.post(`/friends/requests/${requestId}/accept`);
        return response.data;
    },

    declineFriendRequest: async (requestId: string): Promise<void> => {
        await api.post(`/friends/requests/${requestId}/decline`);
    },

    removeFriend: async (friendshipId: string): Promise<void> => {
        await api.delete(`/friends/${friendshipId}`);
    }
};
