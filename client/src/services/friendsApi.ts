import type { User } from '../types';
import { API_BASE_URL } from '../config';

export const friendsApi = {
  async getFriends(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/friends`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch friends');
    return response.json();
  },

  async getFriendRequests(): Promise<{
    received: { id: string; fromUser: User; createdAt: Date }[];
    sent: { id: string; toUser: User; createdAt: Date }[];
  }> {
    const response = await fetch(`${API_BASE_URL}/api/friends/requests`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch friend requests');
    return response.json();
  },

  async sendFriendRequest(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/friends/requests`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId })
    });
    if (!response.ok) throw new Error('Failed to send friend request');
  },

  async acceptFriendRequest(requestId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/friends/requests/${requestId}/accept`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to accept friend request');
  },

  async declineFriendRequest(requestId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/friends/requests/${requestId}/decline`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to decline friend request');
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
  }
};
