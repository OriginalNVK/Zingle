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
            console.log('Sending friend request to:', toUserId);
            const payload = { ToUserId: toUserId };
            console.log('Request payload:', payload);
            
            const response = await api.post<FriendRequest>('/friends/requests', payload);
            console.log('Friend request response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Send friend request error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            // Extract detailed error message from server response
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    throw new Error(error.response.data);
                } else if (error.response.data.message) {
                    throw new Error(error.response.data.message);
                } else if (error.response.data.title) {
                    throw new Error(error.response.data.title);
                }
            }
            
            // Default error messages based on status code
            if (error.response?.status === 400) {
                throw new Error('Cannot send friend request to this user. You may already be friends or have a pending request.');
            }
            
            throw new Error('Failed to send friend request. Please try again.');
        }
    },

    acceptFriendRequest: async (requestId: string): Promise<Friend> => {
        try {
            const response = await api.post<Friend>(`/friends/requests/${requestId}/accept`);
            return response.data;
        } catch (error: any) {
            console.error('Accept friend request error:', error);
            
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    throw new Error(error.response.data);
                } else if (error.response.data.message) {
                    throw new Error(error.response.data.message);
                }
            }
            
            if (error.response?.status === 400) {
                throw new Error('This friend request has already been processed');
            } else if (error.response?.status === 404) {
                throw new Error('Friend request not found');
            }
            
            throw new Error('Failed to accept friend request');
        }
    },

    declineFriendRequest: async (requestId: string): Promise<void> => {
        try {
            await api.post(`/friends/requests/${requestId}/decline`);
        } catch (error: any) {
            console.error('Decline friend request error:', error);
            
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    throw new Error(error.response.data);
                } else if (error.response.data.message) {
                    throw new Error(error.response.data.message);
                }
            }
            
            if (error.response?.status === 400) {
                throw new Error('This friend request has already been processed');
            } else if (error.response?.status === 404) {
                throw new Error('Friend request not found');
            }
            
            throw new Error('Failed to decline friend request');
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
