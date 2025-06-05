import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Chat, Message, User, TypingIndicatorPayload } from '../types';
import { MessageType, MessageStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { chatApi } from '../services/api/chatApi';
import SignalRChatService from '../services/signalRChatService';

interface ChatContextType {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  activeChatId: string | null;
  setActiveChatId: (chatId: string | null) => void;
  sendMessage: (chatId: string, content: string, type?: MessageType, imageUrl?: string, imageBase64?: string) => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>; 
  contacts: User[];
  typingUsers: { [chatId: string]: string[] }; 
  sendTypingIndicator: (chatId: string, isTyping: boolean) => void;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  getChatUserIsTyping: (chatId: string) => boolean;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [contacts] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: string[] }>({});
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatService, setChatService] = useState<SignalRChatService | null>(null);

  // Initialize SignalR when user is authenticated
  useEffect(() => {
    let service: SignalRChatService | null = null;

    const initializeService = async () => {
      if (currentUser && !chatService) {
        try {
          service = new SignalRChatService();
          await service.start();
          setChatService(service);

          const messageCallback = (message: Message) => {
            setMessages(prev => ({
              ...prev,
              [message.chatId]: [...(prev[message.chatId] || []), message]
            }));
            setChats(prevChats => prevChats.map(chat =>
              chat.id === message.chatId
                ? { ...chat, lastMessage: message, lastActivity: new Date() }
                : chat
            ));
          };

          const typingCallback = (payload: TypingIndicatorPayload) => {
            setTypingUsers(prev => {
              const currentTypers = [...(prev[payload.chatId] || [])];
              if (payload.isTyping && !currentTypers.includes(payload.userId)) {
                return {
                  ...prev,
                  [payload.chatId]: [...currentTypers, payload.userId]
                };
              } else if (!payload.isTyping) {
                return {
                  ...prev,
                  [payload.chatId]: currentTypers.filter(id => id !== payload.userId)
                };
              }
              return prev;
            });
          };

          const messageStatusCallback = (data: { chatId: string; messageId: string; userId: string; status: string }) => {
            setMessages(prev => ({
              ...prev,
              [data.chatId]: prev[data.chatId]?.map(message =>
                message.id === data.messageId
                  ? { ...message, status: data.status as MessageStatus }
                  : message
              ) || []
            }));
          };

          service.onMessage(messageCallback);
          service.onTyping(typingCallback);
          service.onMessageStatus(messageStatusCallback);
        } catch (error) {
          console.error('Failed to initialize chat service:', error);
          setChatService(null);
        }
      }
    };

    initializeService();

    return () => {
      if (service) {
        service.stop().catch(console.error);
      }
    };
  }, [currentUser]);

  // Load initial chats
  useEffect(() => {
    const loadChats = async () => {
      if (!currentUser) return;
      
      setIsLoadingChats(true);
      try {
        const fetchedChats = await chatApi.getChats();
        setChats(fetchedChats);
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChats();
  }, [currentUser]);

  const loadMessages = async (chatId: string) => {
    if (!currentUser || !chatService) return;

    setIsLoadingMessages(true);
    try {
      const chatMessages = await chatApi.getMessages(chatId);
      setMessages(prev => ({
        ...prev,
        [chatId]: chatMessages
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async (
    chatId: string,
    content: string,
    type: MessageType = MessageType.TEXT
  ) => {
    if (!currentUser || !chatService) return;

    try {
      await chatService.sendMessage(chatId, content, type);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const sendTypingIndicator = (chatId: string, isTyping: boolean) => {
    if (!currentUser || !chatService) return;
    chatService.sendTypingIndicator(chatId, isTyping);
  };

  const getChatUserIsTyping = useCallback((chatId: string): boolean => {
    return (typingUsers[chatId]?.length || 0) > 0;
  }, [typingUsers]);

  return (
    <ChatContext.Provider value={{
      chats,
      messages,
      activeChatId,
      setActiveChatId,
      sendMessage,
      loadMessages,
      contacts,
      typingUsers,
      sendTypingIndicator,
      isLoadingChats,
      isLoadingMessages,
      getChatUserIsTyping
    }}>
      {children}
    </ChatContext.Provider>
  );
};
