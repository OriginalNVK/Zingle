import type { User } from '../types';

/**
 * Get the preferred display name for a user
 * Priority: nickname > displayName > username
 */
export const getDisplayName = (user: User): string => {
  if (user.nickname && user.nickname.trim()) {
    return user.nickname.trim();
  }
  
  if (user.displayName && user.displayName.trim()) {
    return user.displayName.trim();
  }
  
  return user.username;
};

/**
 * Get the preferred display name for a user with fallback
 * If no preferred name is available, returns the fallback text
 */
export const getDisplayNameWithFallback = (user: User, fallback: string = 'Unknown'): string => {
  const displayName = getDisplayName(user);
  return displayName || fallback;
}; 