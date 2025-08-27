import React from 'react';
import { useCall } from '../contexts/CallContext';
import Button from './common/Button';
import { VideoCameraIcon, PhoneIcon } from './icons';
import type { User } from '../types';
import { getDisplayName } from '../utils/displayName';

interface CallButtonProps {
  targetUser: User; // The user to call
}

const CallButton: React.FC<CallButtonProps> = ({ targetUser }) => {
  const { initiateCall } = useCall();

  const handleVideoCall = async () => {
    try {
      await initiateCall(targetUser, 'video');
    } catch (error) {
      console.error('Failed to initiate video call:', error);
      alert(`Không thể thực hiện video call với ${getDisplayName(targetUser)}`);
    }
  };

  const handleVoiceCall = async () => {
    try {
      await initiateCall(targetUser, 'voice');
    } catch (error) {
      console.error('Failed to initiate voice call:', error);
      alert(`Không thể thực hiện voice call với ${getDisplayName(targetUser)}`);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button 
        onClick={handleVideoCall} 
        variant="ghost" 
        size="sm" 
        className="p-1.5 hover:bg-primary-100 hover:text-primary-600 transition-colors" 
        title={`Video call ${getDisplayName(targetUser)}`}
      >
        <VideoCameraIcon className="h-5 w-5 text-gray-600 hover:text-primary-600" />
      </Button>
      <Button 
        onClick={handleVoiceCall} 
        variant="ghost" 
        size="sm" 
        className="p-1.5 hover:bg-primary-100 hover:text-primary-600 transition-colors" 
        title={`Voice call ${getDisplayName(targetUser)}`}
      >
        <PhoneIcon className="h-5 w-5 text-gray-600 hover:text-primary-600" />
      </Button>
    </div>
  );
};

export default CallButton;
