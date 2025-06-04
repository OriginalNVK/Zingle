import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import UserAvatar from './UserAvatar';
import TypingIndicator from './TypingIndicator'; 
import { MessageSquareIcon, PhoneSolidIcon, VideoIcon, MoreVerticalIcon } from './icons';
import { UserRole } from '../types'; 
import type { User } from '../types'; 
import ChatDetailsSidebar from './ChatDetailsSidebar';
import { useCall } from '../contexts/CallContext';

const ChatWindow: React.FC = () => {
  const { activeChatId, messages: allMessages, chats, loadMessages, isLoadingMessages, typingUsers, getChatUserIsTyping } = useChat();
  const { currentUser } = useAuth();
  const { initiateCall } = useCall();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isDetailsSidebarOpen, setIsDetailsSidebarOpen] = useState(false);

  const activeChat = chats.find(chat => chat.id === activeChatId);
  const currentChatMessages = activeChatId ? allMessages[activeChatId] || [] : [];
  
  const otherParticipant = activeChat && !activeChat.isGroupChat 
    ? activeChat.participants.find(p => p.id !== currentUser?.id) 
    : null;
  
  const displayUserForHeader = activeChat?.isGroupChat 
    ? {
        id: activeChat.id,
        username: activeChat.name,
        displayName: activeChat.name,
        avatarUrl: activeChat.avatarUrl,
        email: '',
        isOnline: false,
        role: UserRole.USER
      }
    : otherParticipant;

  const isCurrentlyTyping = activeChatId ? getChatUserIsTyping(activeChatId) : false;
  const typingUserNames = activeChatId ? (typingUsers[activeChatId] || [])
    .filter(id => id !== currentUser?.id)
    .map(userId => {
      const participant = activeChat?.participants.find(p => p.id === userId);
      return participant?.username;
    })
    .filter(Boolean) as string[] : [];

  useEffect(() => {
    if (activeChatId) {
      if (!allMessages[activeChatId] || allMessages[activeChatId].length === 0) {
        loadMessages(activeChatId);
      }
    }
    setIsDetailsSidebarOpen(false);
  }, [activeChatId, allMessages, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChatMessages]);
  
  const handleInitiateCall = (callType: "video" | "voice") => {
    if (displayUserForHeader) {
      initiateCall(displayUserForHeader, callType);
    }
  };

  if (!activeChatId || !activeChat || !currentUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 relative">
        <MessageSquareIcon className="w-24 h-24 text-primary-300 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Chat Selected</h3>
        <p className="text-gray-500">Select a chat from the sidebar to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-dark-bg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-border bg-dark-card">
        <div className="flex items-center space-x-3">
          {displayUserForHeader && (
            <UserAvatar 
              user={displayUserForHeader} 
              size="md" 
              showStatus={!activeChat.isGroupChat}
            />
          )}
          <div>
            <h2 className="font-semibold">{activeChat.isGroupChat ? activeChat.name : displayUserForHeader?.username}</h2>
            {isCurrentlyTyping && typingUserNames.length > 0 && (
              <TypingIndicator usersTyping={typingUserNames} />
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4 text-dark-text">
          <button 
            onClick={() => handleInitiateCall("voice")}
            className="p-2 hover:bg-primary-700/20 rounded-full transition-colors"
          >
            <PhoneSolidIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handleInitiateCall("video")}
            className="p-2 hover:bg-primary-700/20 rounded-full transition-colors"
          >
            <VideoIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsDetailsSidebarOpen(!isDetailsSidebarOpen)}
            className="p-2 hover:bg-primary-700/20 rounded-full transition-colors"
          >
            <MoreVerticalIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-dark-bg">
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          currentChatMessages.map((message, index) => {
            const isLastInGroup = index === currentChatMessages.length - 1 || 
              currentChatMessages[index + 1]?.senderId !== message.senderId;
            const senderUser = activeChat.participants.find(p => p.id === message.senderId);
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.senderId === currentUser?.id}
                showAvatar={isLastInGroup}
                senderUser={senderUser}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {isCurrentlyTyping && typingUserNames.length > 0 && (
        <div className="px-4 pb-1 h-6 text-sm text-gray-500 italic">
          <TypingIndicator usersTyping={typingUserNames} />
        </div>
      )}

      <ChatInput chatId={activeChatId} />

      <ChatDetailsSidebar
        isOpen={isDetailsSidebarOpen}
        onClose={() => setIsDetailsSidebarOpen(false)}
        chat={activeChat}
        currentUser={currentUser}
        messages={currentChatMessages}
      />
    </div>
  );
};

export default ChatWindow;
