import React from 'react';

interface TypingIndicatorProps {
  usersTyping: string[]; // Usernames or IDs
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ usersTyping }) => {
  if (usersTyping.length === 0) {
    return null;
  }

  let text = '';
  if (usersTyping.length === 1) {
    text = `${usersTyping[0]} is typing`;
  } else if (usersTyping.length === 2) {
    text = `${usersTyping[0]} and ${usersTyping[1]} are typing`;
  } else {
    text = `${usersTyping.slice(0,2).join(', ')} and others are typing`;
  }

  return (
    <div className="flex items-center space-x-1 text-xs text-dark-muted h-5">
      <span>{text}</span>
      <div className="flex space-x-0.5">
        <span className="animate-bounce delay-0 duration-1000 inline-block w-1 h-1 bg-dark-muted rounded-full"></span>
        <span className="animate-bounce delay-150 duration-1000 inline-block w-1 h-1 bg-dark-muted rounded-full"></span>
        <span className="animate-bounce delay-300 duration-1000 inline-block w-1 h-1 bg-dark-muted rounded-full"></span>
      </div>
    </div>
  );
};

export default TypingIndicator;
