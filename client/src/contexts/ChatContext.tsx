import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Chat, Message, User, TypingIndicatorPayload } from '../types';
import { MessageType, MessageStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { chatApi } from '../services/api/chatApi';
import { SignalRChatService } from '../services/signalRChatService';
import { NotificationSound } from '../utils/notificationSound';

interface ChatContextType {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  activeChatId: string | null;
  setActiveChatId: (chatId: string | null) => void;
  sendMessage: (chatId: string, content: string, type?: MessageType) => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>; 
  contacts: User[];
  typingUsers: { [chatId: string]: string[] }; 
  sendTypingIndicator: (chatId: string, isTyping: boolean) => void;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  getChatUserIsTyping: (chatId: string) => boolean;
  isSignalRConnected: boolean;
  error: string | null;
  resetLoadedChats: () => void;
  reconnectSignalR: () => Promise<void>;
  startChatWithFriend: (friend: User) => Promise<string>;
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
  const [isSignalRConnected, setIsSignalRConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedChats, setLoadedChats] = useState<Set<string>>(new Set());
  const maxRetryAttempts = 5;

  // Initialize SignalR when user is authenticated
  useEffect(() => {
    let service: SignalRChatService | null = null;

    const initializeService = async () => {
      if (currentUser && !chatService) {
        try {
          console.log('Initializing SignalR chat service...');
          service = new SignalRChatService();
          
          // Try to start SignalR with retry logic
          let connected = false;
          for (let attempt = 0; attempt < maxRetryAttempts; attempt++) {
            try {
              await service.start();
              console.log('SignalR chat service initialized successfully');
              setIsSignalRConnected(true);
              connected = true;
              break;
            } catch (signalRError) {
              console.warn(`SignalR initialization attempt ${attempt + 1} failed:`, signalRError);
              
              if (attempt < maxRetryAttempts - 1) {
                // Wait before retry with exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }
          
          if (!connected) {
            console.warn('SignalR initialization failed after all attempts, continuing without real-time features');
            setIsSignalRConnected(false);
            setError('Không thể kết nối tới máy chủ real-time. Một số tính năng có thể không hoạt động.');
          }
          
          setChatService(service);

          const messageCallback = (message: Message) => {
            console.log('Received message via SignalR:', message);
            
            // Play notification sound for new messages (but not from current user)
            if (message.senderId !== currentUser?.id) {
              NotificationSound.playMessageSound();
            }
            
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const existingMessages = prev[message.chatId] || [];
              const messageExists = existingMessages.some(m => m.id === message.id);
              
              if (messageExists) {
                return prev;
              }
              
              return {
                ...prev,
                [message.chatId]: [...existingMessages, message]
              };
            });
            
            setChats(prevChats => prevChats.map(chat =>
              chat.id === message.chatId
                ? { ...chat, lastMessage: message, lastActivity: new Date() }
                : chat
            ));
            
            // Mark this chat as loaded if it wasn't already
            setLoadedChats(prev => {
              if (!prev.has(message.chatId)) {
                return new Set(prev).add(message.chatId);
              }
              return prev;
            });
          };

          const typingCallback = (payload: TypingIndicatorPayload) => {
            console.log('Received typing indicator via SignalR:', payload);
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
            console.log('Received message status via SignalR:', data);
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
          setIsSignalRConnected(false);
          setError('Không thể khởi tạo dịch vụ chat. Vui lòng thử lại sau.');
        }
      }
    };

    initializeService();

    return () => {
      if (service) {
        service.stop().catch(console.error);
        setIsSignalRConnected(false);
      }
    };
  }, [currentUser, maxRetryAttempts]);

  // Load initial chats
  useEffect(() => {
    const loadChats = async () => {
      if (!currentUser) return;
      
      setIsLoadingChats(true);
      try {
        console.log('Loading chats...');
        const fetchedChats = await chatApi.getChats();
        console.log('Chats loaded:', fetchedChats);
        setChats(fetchedChats);
      } catch (error) {
        console.error('Failed to load chats:', error);
        setError('Không thể tải danh sách chat. Vui lòng thử lại sau.');
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChats();
  }, [currentUser]);

  // Reset loaded chats when user changes (login/logout)
  useEffect(() => {
    if (!currentUser) {
      // User logged out, reset loaded chats
      console.log('User logged out, resetting chat state...');
      setLoadedChats(new Set());
      setMessages({});
      setError(null);
      setActiveChatId(null);
      setTypingUsers({});
    }
  }, [currentUser]);

  const loadMessages = useCallback(async (chatId: string) => {
    if (!currentUser) return;

    // Check if messages for this chat have already been loaded
    if (loadedChats.has(chatId)) {
      console.log(`Messages for chat ${chatId} already loaded, skipping...`);
      return;
    }

    setIsLoadingMessages(true);
    setError(null);
    try {
      console.log('Loading messages for chat:', chatId);
      const chatMessages = await chatApi.getMessages(chatId);
      console.log('Messages loaded:', chatMessages);
      
      // Sort messages by timestamp to ensure correct order
      const sortedMessages = chatMessages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setMessages(prev => ({
        ...prev,
        [chatId]: sortedMessages
      }));
      
      // Mark this chat as loaded
      setLoadedChats(prev => new Set(prev).add(chatId));
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Show user-friendly error message
      let errorMessage = 'Failed to load messages';
      if (error instanceof Error) {
        if (error.message.includes('Không thể kết nối tới máy chủ')) {
          errorMessage = error.message;
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Không thể kết nối tới máy chủ (timeout). Vui lòng kiểm tra lại backend server hoặc kết nối mạng.';
        } else if (error.message.includes('Unable to connect to server')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
        } else if (error.message.includes('Request timeout')) {
          errorMessage = 'Request timeout. The server is taking too long to respond. Please try again.';
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'You do not have permission to access this chat.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Chat not found.';
        } else if (error.message.includes('Server is not responding')) {
          errorMessage = 'Server is not responding. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentUser, loadedChats]);

  // Load messages when activeChatId changes
  useEffect(() => {
    if (activeChatId && chatService) {
      console.log('Joining chat:', activeChatId);
      // Join the chat in SignalR
      if (isSignalRConnected) {
        chatService.joinChat(activeChatId).catch(error => {
          console.warn('Failed to join chat via SignalR:', error);
        });
      }
      
      // Load messages if not already loaded (using the new tracking system)
      if (!loadedChats.has(activeChatId)) {
        console.log(`Loading messages for chat ${activeChatId} (not previously loaded)`);
        loadMessages(activeChatId);
      } else {
        console.log(`Messages for chat ${activeChatId} already loaded, skipping load...`);
      }
    }

    // Leave previous chat when switching
    return () => {
      if (activeChatId && chatService && isSignalRConnected) {
        console.log('Leaving chat:', activeChatId);
        chatService.leaveChat(activeChatId).catch(error => {
          console.warn('Failed to leave chat via SignalR:', error);
        });
      }
    };
  }, [activeChatId, chatService, isSignalRConnected, loadedChats, loadMessages]);

  // Load messages for activeChatId when chats are loaded and activeChatId is set
  useEffect(() => {
    if (activeChatId && !isLoadingChats && chats.length > 0 && !loadedChats.has(activeChatId)) {
      console.log(`Auto-loading messages for activeChatId ${activeChatId} after chats loaded`);
      loadMessages(activeChatId);
    }
  }, [activeChatId, isLoadingChats, chats.length, loadedChats, loadMessages]);

  const sendMessage = async (
    chatId: string,
    content: string,
    type: MessageType = MessageType.TEXT
  ) => {
    if (!currentUser) return;

    try {
      console.log('Sending message:', { chatId, content, type });
      // Send message via API first
      const messageData = {
        content,
        type: type.toString()
      };
      
      const newMessage = await chatApi.sendMessage(chatId, messageData);
      console.log('Message sent successfully:', newMessage);
      
      // Add message to local state
      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), newMessage]
      }));
      
      // Update chat's last message
      setChats(prevChats => prevChats.map(chat =>
        chat.id === chatId
          ? { ...chat, lastMessage: newMessage, lastActivity: new Date() }
          : chat
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const sendTypingIndicator = (chatId: string, isTyping: boolean) => {
    if (chatService && isSignalRConnected && chatService.isConnected()) {
      chatService.sendTypingIndicator(chatId, isTyping).catch(console.error);
    }
  };

  const getChatUserIsTyping = (chatId: string) => {
    return (typingUsers[chatId] || []).length > 0;
  };

  const resetLoadedChats = () => {
    setLoadedChats(new Set());
  };

  const reconnectSignalR = async () => {
    if (chatService) {
      try {
        setError(null);
        await chatService.start();
        setIsSignalRConnected(true);
        console.log('SignalR reconnected successfully');
      } catch (error) {
        console.error('Failed to reconnect SignalR:', error);
        setError('Không thể kết nối lại tới máy chủ real-time.');
        setIsSignalRConnected(false);
      }
    }
  };

  const startChatWithFriend = async (friend: User): Promise<string> => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      // Check if chat already exists with this friend
      const existingChat = chats.find(chat => 
        !chat.isGroupChat && 
        chat.participants.some(p => p.id === friend.id && p.id !== currentUser.id)
      );

      if (existingChat) {
        setActiveChatId(existingChat.id);
        return existingChat.id;
      }

      // Create new chat with friend
      const newChatData = {
        participantIds: [friend.id],
        isGroupChat: false,
        name: '' // Will be auto-generated by server for 1-on-1 chats
      };

      const newChat = await chatApi.createChat(newChatData);
      
      // Add new chat to state
      setChats(prevChats => [newChat, ...prevChats]);
      setActiveChatId(newChat.id);
      
      return newChat.id;
    } catch (error) {
      console.error('Failed to start chat with friend:', error);
      throw new Error('Failed to start chat with friend');
    }
  };

  // Ensure context is always available with default values
  const contextValue: ChatContextType = {
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
    getChatUserIsTyping,
    isSignalRConnected,
    error,
    resetLoadedChats,
    reconnectSignalR,
    startChatWithFriend
  };

  // Ensure ChatProvider always renders even if there are errors
  try {
    return (
      <ChatContext.Provider value={contextValue}>
        {children}
      </ChatContext.Provider>
    );
  } catch (error) {
    console.error('Error rendering ChatProvider:', error);
    // Return a minimal context to prevent crashes
    const fallbackContext: ChatContextType = {
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
    return (
      <ChatContext.Provider value={fallbackContext}>
        {children}
      </ChatContext.Provider>
    );
  }
};
