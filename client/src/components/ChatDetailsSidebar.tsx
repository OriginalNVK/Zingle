import React, { useState, useEffect, useMemo } from 'react';
import type { User, Message, Chat as ChatType } from '../types';
import { UserRole, MessageType } from '../types';
import UserAvatar from './UserAvatar';
import {
  XIcon,
  FileTextIcon,
  LinkIcon,
  ImageIcon,
  AlertTriangleIcon,
  Trash2Icon,
  UserXIcon,
  Edit2Icon,
  ChevronLeftIcon
} from './icons';
import Button from './common/Button';

interface ChatDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatType | null | undefined;
  currentUser: User | null;
  messages: Message[];
}

type ViewMode = 'overview' | 'tabs';
type TabName = 'media' | 'files' | 'links';

const ChatDetailsSidebar: React.FC<ChatDetailsSidebarProps> = ({
  isOpen,
  onClose,
  chat,
  currentUser,
  messages,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [activeTab, setActiveTab] = useState<TabName>('media');
  const [nickname, setNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  const otherParticipant = useMemo(() => 
    chat && !chat.isGroupChat ? chat.participants.find(p => p.id !== currentUser?.id) : null
  , [chat, currentUser]);

  const displayUser = useMemo(() =>
    chat?.isGroupChat
      ? { 
          id: chat.id, 
          username: chat.name, 
          displayName: chat.name,
          avatarUrl: chat.avatarUrl, 
          email: '', 
          isOnline: false, 
          role: UserRole.USER,
          bio: ''
        }
      : otherParticipant
  , [chat, otherParticipant]);

  useEffect(() => {
    if (displayUser) {
      setNickname(displayUser.displayName || displayUser.username);
    }
    setViewMode('overview');
    setActiveTab('media');
    setIsEditingNickname(false);
  }, [displayUser, isOpen]);

  const handleSaveNickname = () => {
    console.log(`Nickname for ${displayUser?.id} set to: ${nickname}`);
    setIsEditingNickname(false);
  };

  const mediaMessages = useMemo(() =>
    messages.filter(msg => msg.type === MessageType.IMAGE)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  , [messages]);

  const fileMessages = useMemo(() =>
    messages.filter(msg => {
      const isFileByName = /\.(pdf|docx?|xlsx?|pptx?|zip|txt)$/i.test(msg.content);
      const isNonMediaAttachment = msg.type === MessageType.FILE;
      return isFileByName || isNonMediaAttachment;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  , [messages]);

  const linkMessages = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return messages
      .map(msg => ({ ...msg, urls: Array.from(msg.content.matchAll(urlRegex), m => m[0]) }))
      .filter(msg => msg.urls.length > 0)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [messages]);

  const switchToTabView = (tab: TabName) => {
    setViewMode('tabs');
    setActiveTab(tab);
  };
  
  const renderSectionPreview = (title: string, items: any[], renderItem: (item: any, index: number) => React.ReactElement, onShowAll: () => void, icon: React.ReactElement) => (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </h3>
        <button 
          onClick={onShowAll}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          Show All
        </button>
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {items.slice(0, 6).map((item, index) => renderItem(item, index))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-4">No items yet</p>
      )}
    </div>
  );
  
  const renderMediaItem = (msg: Message, index: number) => (
    <img 
      key={msg.id + index} 
      src={msg.imageUrl} 
      alt={`media ${index}`} 
      className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80" 
      onClick={() => window.open(msg.imageUrl, '_blank')}
    />
  );

  const renderFileItem = (msg: Message, index: number) => (
    <div 
      key={msg.id + index}
      className="flex items-center p-2 bg-white rounded border border-gray-200 hover:border-primary-500 cursor-pointer transition-colors"
      onClick={() => msg.fileUrl && window.open(msg.fileUrl, '_blank')}
    >
      <FileTextIcon className="w-4 h-4 text-gray-500 mr-2" />
      <span className="text-xs truncate">{msg.fileName || msg.content}</span>
    </div>
  );

  const renderLinkItem = (msg: Message & { urls: string[] }, _: number): React.ReactElement => {
    const validateAndOpenUrl = (url: string) => {
      try {
        const urlObj = new URL(url);
        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } catch {
        console.warn('Invalid URL:', url);
      }
    };

    return (
      <div className="space-y-2">
        {msg.urls.map((url, urlIndex) => (
          <div 
            key={`${msg.id}-${urlIndex}`}
            className="flex items-center p-2 bg-white rounded border border-gray-200 hover:border-primary-500 cursor-pointer transition-colors"
            onClick={() => validateAndOpenUrl(url)}
          >
            <LinkIcon className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-xs truncate">{url}</span>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen || !chat || !currentUser) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button 
          onClick={() => viewMode === 'tabs' ? setViewMode('overview') : onClose()}
          className="text-gray-500 hover:text-primary-600"
        >
          {viewMode === 'tabs' ? (
            <ChevronLeftIcon className="w-5 h-5" />
          ) : (
            <XIcon className="w-5 h-5" />
          )}
        </button>
        <span className="text-lg font-semibold">{viewMode === 'overview' ? 'Chat Details' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
        <div className="w-5" /> {/* Spacer for alignment */}
      </div>

      {/* User Info */}
      <div className="p-4 text-center border-b border-gray-200">
        {displayUser && (
          <UserAvatar user={displayUser} size="xl" className="mx-auto mb-2" />
        )}
        {!isEditingNickname ? (
          <div className="flex items-center justify-center">
            <h3 className="text-md font-semibold text-gray-700">{nickname || displayUser?.username}</h3>
            {!chat.isGroupChat && (
              <button onClick={() => setIsEditingNickname(true)} className="ml-2 text-gray-400 hover:text-primary-500">
                <Edit2Icon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-1">
            <input 
              type="text" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)} 
              className="text-sm p-1 border rounded-md text-center focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
            <Button size="sm" onClick={handleSaveNickname} className="px-2 py-1">Save</Button>
          </div>
        )}
        <p className="text-xs text-gray-500">
          {chat.isGroupChat ? `${chat.participants.length} members` : (displayUser?.isOnline ? 'Online' : 'Offline')}
        </p>
      </div>

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto p-3">
        {viewMode === 'overview' ? (
          <>
            {renderSectionPreview(
              "Media", 
              mediaMessages, 
              renderMediaItem, 
              () => switchToTabView('media'),
              <ImageIcon className="w-4 h-4"/>
            )}
            {renderSectionPreview(
              "Files", 
              fileMessages, 
              renderFileItem, 
              () => switchToTabView('files'),
              <FileTextIcon className="w-4 h-4"/>
            )}
            {renderSectionPreview(
              "Links", 
              linkMessages, 
              renderLinkItem, 
              () => switchToTabView('links'),
              <LinkIcon className="w-4 h-4"/>
            )}
          </>
        ) : (
          <div className="space-y-2">
            {activeTab === 'media' && (
              mediaMessages.length > 0 ?
                <div className="grid grid-cols-3 gap-2">
                  {mediaMessages.map(renderMediaItem)}
                </div>
                : <p className="text-xs text-gray-400 text-center py-4">No media yet</p>
            )}
            {activeTab === 'files' && (
              fileMessages.length > 0 ?
                <div className="space-y-1">
                  {fileMessages.map(renderFileItem)}
                </div>
                : <p className="text-xs text-gray-400 text-center py-4">No files yet</p>
            )}
            {activeTab === 'links' && (
              linkMessages.length > 0 ?
                <div className="space-y-1">
                  {linkMessages.map(renderLinkItem)}
                </div>
                : <p className="text-xs text-gray-400 text-center py-4">No links yet</p>
            )}
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="p-3 border-t border-gray-200 space-y-2">
        {!chat.isGroupChat && (
          <Button
            variant="danger"
            className="w-full justify-center"
            leftIcon={<UserXIcon className="w-4 h-4" />}
          >
            Block User
          </Button>
        )}
        <Button
          variant="danger"
          className="w-full justify-center"
          leftIcon={<Trash2Icon className="w-4 h-4" />}
        >
          Delete Chat
        </Button>
        <Button
          variant="danger"
          className="w-full justify-center"
          leftIcon={<AlertTriangleIcon className="w-4 h-4" />}
        >
          Report {chat.isGroupChat ? 'Group' : 'User'}
        </Button>
      </div>
    </div>
  );
};

export default ChatDetailsSidebar;
