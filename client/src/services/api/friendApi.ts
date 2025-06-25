import api from './axiosConfig';
import type { User, Friend, FriendRequest } from '../../types';

export const friendApi = {
    getFriends: async (): Promise<User[]> => {
        try {
            const response = await api.get<Friend[]>('/friends');
            // Backend returns FriendshipDto[], so we need to extract the friend user
            return response.data.map((friendship: Friend) => friendship.friend);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch friends');
        }
    },

    getFriendRequests: async () => {
        try {
            const response = await api.get<FriendRequest[]>('/friends/requests');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch friend requests');
        }
    },

    sendFriendRequest: async (toUserId: string): Promise<FriendRequest> => {
        try {
            const response = await api.post<FriendRequest>('/friends/requests', { toUserId });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 400) {
                throw new Error('Cannot send friend request to this user');
            }
            throw new Error(error.response?.data?.message || 'Failed to send friend request');
        }
    },

    acceptFriendRequest: async (requestId: string): Promise<Friend> => {
        try {
            const response = await api.post<Friend>(`/friends/requests/${requestId}/accept`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to accept friend request');
        }
    },

    declineFriendRequest: async (requestId: string): Promise<void> => {
        try {
            await api.post(`/friends/requests/${requestId}/decline`);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to decline friend request');
        }
    },

    removeFriend: async (friendshipId: string): Promise<void> => {
        try {
            await api.delete(`/friends/${friendshipId}`);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to remove friend');
        }
    },

    getAllUsersExceptAdmin: async (): Promise<User[]> => {
        try {
            const response = await api.get<User[]>('/users/all-except-admin');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch users');
        }
    },

    searchUsers: async (query: string): Promise<User[]> => {
        try {
            const response = await api.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to search users');
        }
    }
};
