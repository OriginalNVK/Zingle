import React from 'react';
import type { Message, User } from '../types';
import { MessageType } from '../types';
import UserAvatar from './UserAvatar';
import { CheckIcon, DoubleCheckIcon } from './icons';
// import { MOCK_USERS } from '../constants'; // To find sender for avatar (if not group chat)


interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean; 
  senderUser?: User | null; // Pass sender for non-own messages if needed for avatar/name
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage, showAvatar, senderUser }) => {
  const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  // const displaySender = isOwnMessage ? null : (senderUser || MOCK_USERS.find(u => u.id === message.senderId));


  const bubbleClasses = isOwnMessage
    ? 'bg-primary-600 text-white rounded-br-none'
    : 'bg-dark-card text-dark-text rounded-bl-none border border-dark-border';
  
  const alignmentClasses = isOwnMessage ? 'items-end' : 'items-start';
  const avatarMargin = isOwnMessage ? 'ml-2' : 'mr-2';
  const messageContentClasses = message.type === MessageType.TEXT ? 'text-sm break-words' : '';

  return (
    <div className={`flex flex-col ${alignmentClasses} mb-1 ${showAvatar ? 'mt-2' : ''}`}>
      <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end max-w-md md:max-w-lg`}>
        {!isOwnMessage && showAvatar && senderUser && (
          <UserAvatar user={senderUser} size="sm" className={avatarMargin} showStatus={false} />
        )}
        {isOwnMessage && showAvatar && (
          <div className={`${avatarMargin} w-8`}></div>
        )}

        <div className={`px-3 py-2 rounded-xl shadow-md hover:shadow-lg transition-shadow ${bubbleClasses} ${!showAvatar && !isOwnMessage ? 'ml-10' : ''} ${!showAvatar && isOwnMessage ? 'mr-10' : ''}`}>
          {!isOwnMessage && showAvatar && senderUser && !message.chatId.startsWith("group") && (
            <p className="text-xs font-semibold mb-0.5 text-primary-400">{senderUser.username}</p>
          )}
          
          {message.type === MessageType.IMAGE && message.imageUrl && (
            <img 
              src={message.imageUrl} 
              alt={message.content || "Shared image"} 
              className="rounded-md max-w-full h-auto my-1 object-contain" 
              style={{ maxHeight: '200px', maxWidth: '250px' }}
            />
          )}
          {message.type === MessageType.TEXT && <p className={messageContentClasses}>{message.content}</p>}
          {message.type === MessageType.SYSTEM && <p className="text-xs italic text-center text-dark-muted px-2 py-1">{message.content}</p>}
          
          <div className={`text-xs mt-1 flex items-center ${isOwnMessage ? 'text-primary-200 justify-end' : 'text-dark-muted justify-start'}`}>
            <span>{timeFormatter.format(new Date(message.timestamp))}</span>
            {isOwnMessage && message.status && (
              <span className="ml-1">
                {message.status === 'delivered' ? <CheckIcon className="w-4 h-4"/> : null}
                {message.status === 'seen' ? <DoubleCheckIcon className="w-4 h-4"/> : null}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
