import { useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    console.warn('useChat called outside of ChatProvider, returning default values');
    return {
      chats: [],
      messages: {},
      activeChatId: null,
      setActiveChatId: () => {},
      sendMessage: async () => {},
      loadMessages: async () => {},
      contacts: [],
      typingUsers: {},
      sendTypingIndicator: () => {},
      isLoadingChats: false,
      isLoadingMessages: false,
      getChatUserIsTyping: () => false,
      isSignalRConnected: false,
      error: null,
      resetLoadedChats: () => {},
      reconnectSignalR: async () => {},
      startChatWithFriend: async () => ''
    };
  }
  return context;
};
