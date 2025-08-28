import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useFriends } from '../hooks/useFriends';
import { SearchIcon, UserPlusIcon, FilterIcon, PhoneIcon } from './icons';
import UserAvatar from './UserAvatar';
import Input from './common/Input';
import Modal from './common/Modal';
import CallButton from './CallButton';
import { MessageType, UserRole } from '../types';
import { getDisplayName } from '../utils/displayName';

const ContactList: React.FC = () => {
  const { chats, setActiveChatId, activeChatId, isLoadingChats, getChatUserIsTyping, startChatWithFriend } = useChat();
  const { currentUser } = useAuth();
  const { friends, isLoadingFriends } = useFriends();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats');

  const filteredChats = chats.filter(chat => {
    const chatPartner = chat.isGroupChat ? null : chat.participants.find(p => p.id !== currentUser?.id);
    const nameToSearch = chat.isGroupChat ? chat.name : (chatPartner ? getDisplayName(chatPartner) : chat.name);
    const matchesSearch = nameToSearch.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (chat.lastMessage && chat.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply filters
    if (selectedFilters.length === 0) return matchesSearch;
    
    let matchesFilters = false;
    if (selectedFilters.includes('unread') && chat.unreadCount > 0) matchesFilters = true;
    if (selectedFilters.includes('not_in_contacts') && !chat.isGroupChat) matchesFilters = true;
    if (selectedFilters.includes('groups') && chat.isGroupChat) matchesFilters = true;
    
    return matchesSearch && matchesFilters;
  });

  const filteredFriends = friends.filter(friend => {
    const nameToSearch = getDisplayName(friend);
    return nameToSearch.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleStartChatWithFriend = async (friend: any) => {
    try {
      await startChatWithFriend(friend);
    } catch (error) {
      console.error('Failed to start chat with friend:', error);
    }
  };

  const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    if (then.toDateString() === now.toDateString()) {
      return then.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (then.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    if (then > lastWeek) {
      return then.toLocaleDateString([], { weekday: 'short' });
    }
    return then.toLocaleDateString();
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  if (isLoadingChats) {
    return (
      <div className="w-full h-full p-4 border-r border-dark-border bg-dark-bg">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-dark-hover animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-dark-hover rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-3 bg-dark-hover rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-dark-bg border-r border-dark-border">
      {/* Header */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-dark-text">
            {activeTab === 'chats' ? 'Đoạn chat' : 'Bạn bè'}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddUserModal(true)}
              className="p-2 text-dark-muted hover:text-primary-600 hover:bg-primary-600/10 rounded-full transition-colors"
              title="Tìm kiếm người dùng mới"
            >
              <UserPlusIcon className="w-5 h-5" />
            </button>
            {activeTab === 'chats' && (
              <button
                onClick={() => setShowFilterModal(true)}
                className={`p-2 rounded-full transition-colors ${
                  selectedFilters.length > 0 
                    ? 'text-primary-600 bg-primary-600/20' 
                    : 'text-dark-muted hover:text-primary-600 hover:bg-primary-600/10'
                }`}
                title="Lọc đoạn chat"
              >
                <FilterIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-4 border-b border-dark-border">
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'chats'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-dark-muted hover:text-dark-text'
            }`}
          >
            Đoạn chat ({filteredChats.length})
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'friends'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-dark-muted hover:text-dark-text'
            }`}
          >
            Bạn bè ({filteredFriends.length})
          </button>
        </div>
        
        {/* Search Bar */}
        <Input
          placeholder={activeTab === 'chats' ? "Tìm kiếm cuộc trò chuyện..." : "Tìm kiếm bạn bè..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<SearchIcon className="w-5 h-5" />}
          className="bg-dark-card"
        />
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' ? (
          // Chat List
          <>
            {!filteredChats.length && (
              <div className="text-center p-4 text-dark-muted">
                <p className="text-sm">Không tìm thấy đoạn chat nào</p>
              </div>
            )}

            {filteredChats.length > 0 && (
              <div className="divide-y divide-dark-border">
                {filteredChats.map(chat => {
                  const chatPartner = !chat.isGroupChat ? chat.participants.find(p => p.id !== currentUser?.id) : null;
                  const isTyping = getChatUserIsTyping(chat.id);
                  
                  let lastMessageText = chat.lastMessage?.content || '';
                  if (chat.lastMessage?.type === MessageType.IMAGE) {
                    lastMessageText = 'Photo';
                  } else if (chat.lastMessage?.type === MessageType.FILE) {
                    lastMessageText = 'File';
                  }

                  let messagePrefix = '';
                  if (chat.lastMessage?.senderId === currentUser?.id && chat.lastMessage?.type !== MessageType.SYSTEM) {
                    messagePrefix = 'Bạn: ';
                  } else if (chat.isGroupChat && chat.lastMessage) {
                    const sender = chat.participants.find(p => p.id === chat.lastMessage?.senderId);
                    messagePrefix = sender ? `${getDisplayName(sender)}: ` : '';
                  }

                  return (
                    <div
                      key={chat.id}
                      className={`flex items-center space-x-3 p-3 hover:bg-dark-hover cursor-pointer
                        ${chat.id === activeChatId ? 'bg-dark-hover' : ''}`}
                      onClick={() => setActiveChatId(chat.id)}
                    >
                      <UserAvatar 
                        user={chat.isGroupChat ? {
                          id: chat.id,
                          username: chat.name,
                          displayName: chat.name,
                          avatarUrl: chat.avatarUrl,
                          isOnline: false,
                          role: UserRole.USER
                        } : (chatPartner || {
                          id: '',
                          username: 'Unknown',
                          displayName: 'Unknown',
                          avatarUrl: undefined,
                          isOnline: false,
                          role: UserRole.USER
                        })}
                        size="md"
                        showStatus={!chat.isGroupChat}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-medium text-dark-text truncate">
                            {chat.isGroupChat ? chat.name : (chatPartner ? getDisplayName(chatPartner) : 'Unknown')}
                          </h3>
                          <span className="text-xs text-dark-muted ml-2">
                            {formatTimestamp(chat.lastMessage?.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm truncate">
                          {isTyping ? (
                            <span className="text-primary-400">đang nhập...</span>
                          ) : (
                            <span className="text-dark-muted">{messagePrefix + lastMessageText}</span>
                          )}
                        </p>
                        {chat.unreadCount > 0 && (
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-dark-muted">
                              {chat.unreadCount} tin nhắn chưa đọc
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Call Buttons - Only show for individual chats, not group chats */}
                      {!chat.isGroupChat && chatPartner && (
                        <CallButton targetUser={chatPartner} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          // Friends List
          <>
            {isLoadingFriends ? (
              <div className="p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-dark-hover animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-dark-hover rounded w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-3 bg-dark-hover rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !filteredFriends.length ? (
              <div className="text-center p-4 text-dark-muted">
                <p className="text-sm">Không tìm thấy bạn bè nào</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-border">
                {filteredFriends.map(friend => (
                  <div
                    key={friend.id}
                    className="flex items-center space-x-3 p-3 hover:bg-dark-hover cursor-pointer"
                    onClick={() => handleStartChatWithFriend(friend)}
                  >
                    <UserAvatar 
                      user={friend}
                      size="md"
                      showStatus={true}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-medium text-dark-text truncate">
                          {getDisplayName(friend)}
                        </h3>
                        <span className="text-xs text-dark-muted">
                          {friend.isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
                        </span>
                      </div>
                      <p className="text-sm text-dark-muted truncate">
                        @{friend.username}
                      </p>
                    </div>
                    
                    {/* Call Button for friends */}
                    <CallButton targetUser={friend} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title="Tìm kiếm người dùng mới"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-text">
              Tìm kiếm theo số điện thoại
            </label>
            <Input
              placeholder="Nhập số điện thoại"
              icon={<PhoneIcon className="w-5 h-5" />}
              className="bg-dark-card"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-text">
              Lập nhóm mới
            </label>
            <Input
              placeholder="Tên nhóm"
              className="bg-dark-card"
            />
            <Input
              placeholder="Mô tả nhóm (tùy chọn)"
              className="bg-dark-card"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="px-4 py-2 text-dark-muted hover:text-dark-text transition-colors"
            >
              Hủy
            </button>
            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors">
              Tìm kiếm
            </button>
          </div>
        </div>
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Lọc đoạn chat"
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.includes('unread')}
                onChange={() => handleFilterChange('unread')}
                className="rounded border-dark-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-dark-text">Chưa đọc</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.includes('not_in_contacts')}
                onChange={() => handleFilterChange('not_in_contacts')}
                className="rounded border-dark-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-dark-text">Không có trong danh bạ</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.includes('groups')}
                onChange={() => handleFilterChange('groups')}
                className="rounded border-dark-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-dark-text">Nhóm</span>
            </label>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              onClick={() => setShowFilterModal(false)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ContactList;