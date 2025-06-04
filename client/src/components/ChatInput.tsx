import React, { useState, useEffect, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useChat } from '../hooks/useChat';
import { MessageType } from '../types';
import { SendIcon } from './icons';
import { AttachmentIcon } from '../assets/icons';

interface ChatInputProps {
  chatId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ chatId }) => {
  const [messageText, setMessageText] = useState('');
  const { sendMessage, sendTypingIndicator } = useChat();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      sendTypingIndicator(chatId, true);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(chatId, false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (messageText.trim() === '') return;

    try {
      await sendMessage(chatId, messageText.trim(), MessageType.TEXT);
      setMessageText('');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      sendTypingIndicator(chatId, false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        sendMessage(chatId, file.name, MessageType.IMAGE, undefined, result);
      };
      reader.readAsDataURL(file);
    }
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        sendTypingIndicator(chatId, false);
      }
    };
  }, [chatId, sendTypingIndicator]);

  return (
    <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload} 
          accept="image/*"
          className="hidden" 
          id="file-upload"
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Attach file"
        >
          <AttachmentIcon className="w-5 h-5 text-gray-500" />
        </button>
        <input
          type="text"
          value={messageText}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 p-2 border border-gray-300 rounded-full focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={messageText.trim() === ''}
          className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;