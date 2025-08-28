import { useState, useEffect } from 'react';
import { friendApi } from '../services/api/friendApi';
import type { User, FriendRequest } from '../types';

export const useFriends = () => {
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = async () => {
    setIsLoadingFriends(true);
    setError(null);
    try {
      const friendsData = await friendApi.getFriends();
      setFriends(friendsData);
    } catch (err: any) {
      console.error('Failed to load friends:', err);
      setError(err.message || 'Failed to load friends');
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const requests = await friendApi.getFriendRequests();
      setFriendRequests(requests);
    } catch (err: any) {
      console.error('Failed to load friend requests:', err);
    }
  };

  const sendFriendRequest = async (toUserId: string): Promise<void> => {
    try {
      await friendApi.sendFriendRequest(toUserId);
      await loadFriendRequests(); // Refresh requests
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    try {
      await friendApi.acceptFriendRequest(requestId);
      await loadFriends(); // Refresh friends list
      await loadFriendRequests(); // Refresh requests
    } catch (err: any) {
      throw new Error(err.message || 'Failed to accept friend request');
    }
  };

  const declineFriendRequest = async (requestId: string): Promise<void> => {
    try {
      await friendApi.declineFriendRequest(requestId);
      await loadFriendRequests(); // Refresh requests
    } catch (err: any) {
      throw new Error(err.message || 'Failed to decline friend request');
    }
  };

  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      return await friendApi.searchUsers(query);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to search users');
    }
  };

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  return {
    friends,
    friendRequests,
    isLoadingFriends,
    error,
    loadFriends,
    loadFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    searchUsers
  };
};
