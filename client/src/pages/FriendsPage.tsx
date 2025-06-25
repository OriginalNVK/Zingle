import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import UserAvatar from '../components/UserAvatar';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { SearchIcon as SearchIconZingle, UserPlusIcon, MessageSquareIcon as MessageIconZingle } from '../components/icons';
import Modal from '../components/common/Modal';
import { useChat } from '../hooks/useChat';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { friendApi } from '../services/api/friendApi';
import { chatApi } from '../services/api/chatApi';
import { ROUTE_PATHS } from '../constants';
import { getDisplayName } from '../utils/displayName';


// UserProfileModal component defined within FriendsPage for now, can be extracted
interface UserProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (userId: string) => void;
  onSendMessage: (userId: string) => void;
  isFriend: (userId: string) => boolean;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose, onAddFriend, onSendMessage, isFriend }) => {
  if (!user) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${getDisplayName(user)}'s Profile`}>
      <div className="text-center p-4">
        <UserAvatar user={user} size="xl" className="mx-auto mb-4 border-4 border-primary-300" />
        <p className={`text-sm mb-4 ${user.isOnline ? 'text-green-500' : 'text-gray-400'}`}>
          {user.isOnline ? 'Online' : 'Offline'}
        </p>
        {user.bio && <p className="text-gray-600 mb-4 text-sm">{user.bio}</p>}
        
        <div className="space-y-2 mt-4">
          {!isFriend(user.id) && (
            <Button onClick={() => { onAddFriend(user.id); onClose();}} variant="primary" className="w-full">
              <UserPlusIcon className="w-4 h-4 mr-2"/> Add Friend
            </Button>
          )}
          {isFriend(user.id) && (
            <Button onClick={() => { onSendMessage(user.id); onClose(); }} variant="primary" className="w-full">
               <MessageIconZingle className="w-4 h-4 mr-2"/> Message
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};


const FriendsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [friendRequests, setFriendRequests] = useState<{ id: string; fromUser: User; toUser: User; status: string; createdAt: Date; respondedAt?: Date }[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [peopleSearchTerm, setPeopleSearchTerm] = useState('');
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setActiveChatId, chats } = useChat();
  const navigate = useNavigate();

  // Show search results if searching, otherwise show all users
  const displayedPeople = peopleSearchTerm ? searchResults : allUsers;

  const isFriend = (userId: string) => friends.some(f => f.id === userId);
  
  const handleViewProfile = (userId: string) => {
    const user = displayedPeople.find(u => u.id === userId);
    if (user) {
      setViewingProfile(user);
      setShowProfileModal(true);
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      setError(null);
      await friendApi.sendFriendRequest(userId);
      // Refresh friend requests after sending
      const requestsData = await friendApi.getFriendRequests();
      setFriendRequests(requestsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send friend request');
    }
  };
  
  const handleSendMessage = async (userId: string) => {
    try {
      // Try to find an existing chat with this user
      const existingChat = chats.find(chat => 
        !chat.isGroupChat && 
        chat.participants.some(p => p.id === userId)
      );
      
      if (existingChat) {
        setActiveChatId(existingChat.id);
      } else {
        // Create new chat via ChatContext
        const newChat = await chatApi.createChat({
          participantIds: [userId],
          isGroupChat: false,
          name: ''
        });
        setActiveChatId(newChat.id);
      }
      navigate(ROUTE_PATHS.CHAT);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start chat');
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      setError(null);
      await friendApi.acceptFriendRequest(requestId);
      
      // Refresh both friends and requests lists
      const [friendsData, requestsData] = await Promise.all([
        friendApi.getFriends(),
        friendApi.getFriendRequests()
      ]);

      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to accept friend request');
    }
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
    try {
      setError(null);
      await friendApi.declineFriendRequest(requestId);
      
      // Refresh requests list
      const requestsData = await friendApi.getFriendRequests();
      setFriendRequests(requestsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to decline friend request');
    }
  };

  // Load friends, friend requests, and all users
  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      try {
        setIsLoadingFriends(true);
        setIsLoadingRequests(true);
        setIsLoadingUsers(true);
        setError(null);

        const [friendsData, requestsData, allUsersData] = await Promise.all([
          friendApi.getFriends(),
          friendApi.getFriendRequests(),
          friendApi.getAllUsersExceptAdmin()
        ]);

        setFriends(friendsData);
        setFriendRequests(requestsData);
        setAllUsers(allUsersData);
        
        // Log to verify data structure
        console.log('Friends data:', friendsData);
        console.log('Friend requests data:', requestsData);
        console.log('All users data:', allUsersData);
      } catch (e) {
        console.error('Error loading data:', e);
        setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        setIsLoadingFriends(false);
        setIsLoadingRequests(false);
        setIsLoadingUsers(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Search for users as user types
  useEffect(() => {
    if (!peopleSearchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setError(null);
        const results = await friendApi.searchUsers(peopleSearchTerm);
        setSearchResults(results.filter(u => u.id !== currentUser?.id));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to search users');
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [peopleSearchTerm, currentUser?.id]);

  return (
    <div className="w-full h-full flex flex-col bg-dark-bg text-dark-text overflow-hidden">
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 text-sm">
          {error}
        </div>
      )}
      
      {/* Friend Requests Section */}
      <div className="p-4 border-b border-dark-border">
        <h2 className="text-xl font-semibold mb-4">Friend Requests</h2>
        <div className="space-y-3">          {isLoadingRequests ? (
            <div className="p-4 text-center text-dark-muted">
              Loading friend requests...
            </div>
          ) : friendRequests.length === 0 ? (
            <p className="text-dark-muted italic">No pending friend requests</p>
          ) : (            friendRequests.map(request => (
              <div 
                key={request.id}
                className="flex items-center p-3 rounded-lg bg-dark-card/50 hover:bg-dark-card transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <UserAvatar
                  user={request.fromUser}
                  size="md"
                  className="mr-3"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{request.fromUser ? getDisplayName(request.fromUser) : 'Unknown User'}</h3>
                  <p className="text-sm text-dark-muted truncate">
                    Wants to be your friend
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    onClick={() => handleAcceptFriendRequest(request.id)}
                    variant="primary"
                    className="text-sm py-1.5 px-3 hover:bg-primary-500/90 transition-colors duration-200"
                  >
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleDeclineFriendRequest(request.id)}
                    variant="secondary"
                    className="text-sm py-1.5 px-3 hover:bg-dark-card/90 transition-colors duration-200"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* All People Section */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {peopleSearchTerm ? 'Search Results' : 'All Users'}
          </h2>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search users..."
              value={peopleSearchTerm}
              onChange={(e) => setPeopleSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-dark-card border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 transition-all duration-200"
            />
            <SearchIconZingle className="absolute left-3 top-2.5 w-4 h-4 text-dark-muted/70 transition-colors duration-200 hover:text-primary-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingUsers ? (
            <div className="col-span-full p-4 text-center text-dark-muted">
              Loading users...
            </div>
          ) : displayedPeople.length === 0 ? (
            <div className="col-span-full p-4 text-center text-dark-muted">
              {peopleSearchTerm ? 'No matching users found' : 'No users available'}
            </div>
          ) : (
            displayedPeople.map(person => (
              <div
                key={person.id}
                className="flex items-center p-4 rounded-lg bg-dark-card/50 hover:bg-dark-card transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                onClick={() => handleViewProfile(person.id)}
              >
                <UserAvatar user={person} size="md" className="mr-3" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{getDisplayName(person)}</h3>
                  <p className="text-sm text-dark-muted truncate">
                    {person.bio || "No bio available"}
                  </p>
                </div>
                <div className="ml-3">
                  {isFriend(person.id) ? (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendMessage(person.id);
                      }}
                      variant="primary"
                      className="text-sm py-1.5 px-3 hover:bg-primary-500/90 transition-colors duration-200"
                    >
                      Message
                    </Button>
                  ) : (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddFriend(person.id);
                      }}
                      variant="secondary"
                      className="text-sm py-1.5 px-3 hover:bg-dark-card/90 transition-colors duration-200"
                    >
                      Add Friend
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <UserProfileModal 
        user={viewingProfile} 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
        onAddFriend={handleAddFriend}
        onSendMessage={handleSendMessage}
        isFriend={isFriend}
      />
    </div>
  );
};

export default FriendsPage;