
import React from 'react';
import type { User } from '../types';
import { DEFAULT_AVATAR_URL } from '../constants';

interface UserAvatarProps {
  user?: User | null; // User can be null or undefined
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md', className = '', showStatus = true }) => {
  const avatarUrl = user?.avatarUrl || DEFAULT_AVATAR_URL;
  const username = user?.username || 'User';
  const isOnline = user?.isOnline || false;

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const statusSizeClasses = {
    sm: 'h-2 w-2 bottom-0 right-0',
    md: 'h-2.5 w-2.5 bottom-0 right-0',
    lg: 'h-3 w-3 bottom-0.5 right-0.5',
    xl: 'h-3.5 w-3.5 bottom-1 right-1',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <img
        className={`rounded-full object-cover ${sizeClasses[size]}`}
        src={avatarUrl}
        alt={username}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null; // prevent infinite loop if default also fails
          target.src = DEFAULT_AVATAR_URL;
        }}
      />
      {showStatus && user && (
        <span
          className={`absolute block rounded-full ring-2 ring-white ${statusSizeClasses[size]} ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default UserAvatar;
