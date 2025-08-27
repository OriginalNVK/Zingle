import React from 'react';
import { useChat } from '../hooks/useChat';
import { AlertTriangleIcon, RefreshCwIcon } from './icons';

const ConnectionStatus: React.FC = () => {
  const { isSignalRConnected, error, reconnectSignalR } = useChat();

  if (!error && isSignalRConnected) {
    return null; // Don't show anything when everything is working
  }

  return (
    <div className={`px-4 py-2 border-b ${
      error 
        ? 'bg-red-500/10 border-red-500/20' 
        : 'bg-yellow-500/10 border-yellow-500/20'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm">
          {error ? (
            <>
              <AlertTriangleIcon className="w-4 h-4 text-red-400" />
              <span className="text-red-400">{error}</span>
            </>
          ) : (
            <>
              <AlertTriangleIcon className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400">Đang kết nối...</span>
            </>
          )}
        </div>
        
        {!isSignalRConnected && (
          <button
            onClick={reconnectSignalR}
            className="flex items-center space-x-1 text-xs px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
            title="Kết nối lại"
          >
            <RefreshCwIcon className="w-3 h-3" />
            <span>Kết nối lại</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
