import React, { useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import UserAvatar from './UserAvatar';
import { SearchIcon } from './icons';
import Input from './common/Input';
import { MessageType, UserRole } from '../types';

const ContactList: React.FC = () => {
  const { chats, setActiveChatId, activeChatId, isLoadingChats, getChatUserIsTyping } = useChat();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChats = chats.filter(chat => {
    const chatPartner = chat.isGroupChat ? null : chat.participants.find(p => p.id !== currentUser?.id);
    const nameToSearch = chat.isGroupChat ? chat.name : (chatPartner?.username || chat.name);
    return nameToSearch.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (chat.lastMessage && chat.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase()));
  });

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

  if (isLoadingChats) {
    return (
      <div className="w-full h-full p-4 border-r border-dark-border bg-dark-bg">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-dark-bg border-r border-dark-border">
      <div className="p-4 border-b border-dark-border">
        <Input
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<SearchIcon className="w-5 h-5" />}
          className="bg-dark-card"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {!filteredChats.length && (
          <div className="text-center p-4 text-gray-500">
            <p className="text-sm">No chats found</p>
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
                messagePrefix = 'You: ';
              } else if (chat.isGroupChat && chat.lastMessage) {
                const sender = chat.participants.find(p => p.id === chat.lastMessage?.senderId);
                messagePrefix = sender ? `${sender.username}: ` : '';
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
                    } : chatPartner}
                    size="md"
                    showStatus={!chat.isGroupChat}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium text-dark-text truncate">
                        {chat.isGroupChat ? chat.name : chatPartner?.username}
                      </h3>
                      <span className="text-xs text-dark-muted ml-2">
                        {formatTimestamp(chat.lastMessage?.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm truncate">
                      {isTyping ? (
                        <span className="text-primary-400">typing...</span>
                      ) : (
                        <span className="text-dark-muted">{messagePrefix + lastMessageText}</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactList;