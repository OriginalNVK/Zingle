import type { User } from '../types';
import api from './api/axiosConfig';

export const friendsApi = {  
  async getFriends(): Promise<User[]> {
    try {
      const response = await api.get<User[]>('/Friends');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch friends:', error.response?.status, error.response?.statusText);
      throw new Error(error.response?.data?.message || 'Failed to fetch friends');
    }
  },  async getFriendRequests(): Promise<{
    received: { id: string; fromUser: User; createdAt: Date }[];
    sent: { id: string; toUser: User; createdAt: Date }[];
  }> {
    try {
      const response = await api.get<{ id: string; fromUser: User; toUser: User; status: string; createdAt: string; respondedAt?: string }[]>('/Friends/requests');
      
      // The API returns a single array of requests, we need to transform it to match our UI's expected format
      // First ensure we have a valid response.data
      if (!response.data) {
        console.error('Friend requests API returned empty data');
        return { received: [], sent: [] };
      }
      
      // Transform the data and filter out any malformed requests
      const received = response.data
        .filter(req => req && req.id && req.fromUser) // Ensure required fields exist
        .map(req => ({
          id: req.id,
          fromUser: req.fromUser,
          createdAt: new Date(req.createdAt)
        }));
      
      return {
        received,
        sent: [] // Currently the API doesn't return sent requests, so return an empty array
      };
    } catch (error: any) {
      console.error('Failed to fetch friend requests:', error.response?.status, error.response?.statusText);
      console.error('Error details:', error);
      // Return empty arrays instead of throwing to prevent UI from breaking
      return { received: [], sent: [] };
    }
  },async sendFriendRequest(userId: string): Promise<void> {
    try {
      await api.post('/Friends/requests', { toUserId: userId });
    } catch (error: any) {
      console.error('Failed to send friend request:', error.response?.status, error.response?.statusText);
      throw new Error(error.response?.data?.message || 'Failed to send friend request');
    }
  },  async acceptFriendRequest(requestId: string): Promise<void> {
    try {
      await api.post(`/Friends/requests/${requestId}/accept`);
    } catch (error: any) {
      console.error('Failed to accept friend request:', error.response?.status, error.response?.statusText);
      throw new Error(error.response?.data?.message || 'Failed to accept friend request');
    }
  },  async declineFriendRequest(requestId: string): Promise<void> {
    try {
      await api.post(`/Friends/requests/${requestId}/decline`);
    } catch (error: any) {
      console.error('Failed to decline friend request:', error.response?.status, error.response?.statusText);
      throw new Error(error.response?.data?.message || 'Failed to decline friend request');
    }
  },  async searchUsers(query: string): Promise<User[]> {
    try {
      // Since there's no explicit search endpoint in the API, 
      // we'll get all users and filter them on the client side for now
      const response = await api.get<User[]>('/Users');
      
      // Filter users by username, displayName or email containing the query
      return response.data.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        (user.displayName && user.displayName.toLowerCase().includes(query.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(query.toLowerCase()))
      );
    } catch (error: any) {
      console.error('Failed to search users:', error.response?.status, error.response?.statusText);
      throw new Error(error.response?.data?.message || 'Failed to search users');
    }
  }
};
