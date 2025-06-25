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
  const handleVideoCall = () => {
    // Placeholder: Implement WebRTC or third-party call initiation
    alert(`Starting video call with ${getDisplayName(targetUser)} (Not implemented)`);
    // Example: openCallModal('video', targetUser);
  };

  const handleVoiceCall = () => {
    // Placeholder: Implement WebRTC or third-party call initiation
    alert(`Starting voice call with ${getDisplayName(targetUser)} (Not implemented)`);
    // Example: openCallModal('voice', targetUser);
  };

  return (
    <div className="flex space-x-2">
      <Button onClick={handleVideoCall} variant="ghost" size="sm" className="p-1.5" title={`Video call ${getDisplayName(targetUser)}`}>
        <VideoCameraIcon className="h-5 w-5 text-gray-600" />
      </Button>
      <Button onClick={handleVoiceCall} variant="ghost" size="sm" className="p-1.5" title={`Voice call ${getDisplayName(targetUser)}`}>
        <PhoneIcon className="h-5 w-5 text-gray-600" />
      </Button>
    </div>
  );
};

export default CallButton;
