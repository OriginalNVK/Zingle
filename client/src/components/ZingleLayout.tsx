import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useOutletContext as useReactRouterOutletContext } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import UserAvatar from './UserAvatar';
import { ROUTE_PATHS, APP_NAME } from '../constants';
import {
  ZingleLogo,
  MessageSquareIcon,
  UsersIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from './icons';
import { useCall } from '../contexts/CallContext'; // Import useCall
import { CallState } from '../types'; // Import CallState
import type { User as UserType } from '../types'; // Import User as type
import { getDisplayName } from '../utils/displayName';
import CallModal from './CallModal';

// Define context type for Outlet
interface ZingleOutletContext {
 MOCK_simulateIncomingCall_DEPRECATED?: () => void; // Keep for UserProfilePage if still using it, but mark as deprecated
}


const ZingleLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { callSession, answerCall, declineCall, incomingCallDetails, clearIncomingCallDetails } = useCall(); // Use CallContext

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('chats'); // 'chats', 'people', 'settings'
  
  // The old mock state for call notification is now handled by CallContext's incomingCallDetails
  // const [showCallNotification, setShowCallNotification] = useState(false);
  // const [incomingCallFromUser, setIncomingCallFromUser] = useState<typeof MOCK_USERS[0] | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (location.pathname === ROUTE_PATHS.CHAT) setActiveMainTab('chats');
    else if (location.pathname === ROUTE_PATHS.PEOPLE) setActiveMainTab('people');
    else if (location.pathname === ROUTE_PATHS.SETTINGS) setActiveMainTab('settings');
    if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
  }, [location.pathname]);


  const handleLogout = () => {
    logout();
    navigate(ROUTE_PATHS.LOGIN);
  };

  const handleNavigate = (tab: string, path: string) => {
    setActiveMainTab(tab);
    navigate(path);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  const handleAcceptCall = async () => {
    try {
      await answerCall();
    } catch (error) {
      console.error("Failed to answer call:", error);
      alert("Could not answer call. " + (error instanceof Error ? error.message : "Unknown error"));
    }
    clearIncomingCallDetails(); // Clear details regardless of success/failure to hide notification
  };

  const handleDeclineCall = async () => {
    try {
      await declineCall();
    } catch (error) {
       console.error("Failed to decline call:", error);
    }
    clearIncomingCallDetails();
  };

  // This mock function for UserProfilePage is kept for now but should be removed if not needed
  const MOCK_simulateIncomingCall_DEPRECATED = () => {
    alert("This mock call simulation is deprecated. Actual calls are handled via CallContext.");
  };
  const outletContextValue: ZingleOutletContext = { MOCK_simulateIncomingCall_DEPRECATED };


  if (!currentUser) {
    navigate(ROUTE_PATHS.LOGIN);
    return null; 
  }

  return (
    <div className="flex h-screen antialiased text-dark-text bg-dark-bg font-sans">
      <div className={`absolute md:static inset-y-0 left-0 z-30 bg-dark-card border-r border-dark-border transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}>
        <div className="flex items-center justify-between p-4 border-b border-dark-border h-16">
          <div className="flex items-center space-x-2">
            <ZingleLogo className="w-8 h-8 text-primary-500" />
            {!isSidebarCollapsed && (
              <h1 className="text-2xl font-bold text-primary-600">{APP_NAME}</h1>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isSidebarCollapsed && (
              <button 
                onClick={toggleSidebarCollapse}
                className="hidden md:flex text-dark-muted hover:text-primary-600 p-1 rounded"
                title="Collapse sidebar"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-dark-muted hover:text-primary-600">
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center space-x-3">
            <UserAvatar user={currentUser} size="md" className="border-2 border-primary-500" />
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-md font-semibold text-dark-text truncate">{getDisplayName(currentUser)}</p>
                <p className="text-xs text-dark-muted truncate">{currentUser.email}</p>
              </div>
            )}
            <button onClick={handleLogout} title="Logout" className="p-2 text-dark-muted hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors">
              <LogOutIcon />
            </button>
          </div>
        </div>

        <nav className="flex flex-col p-2 space-y-1">
          <div className="flex-1 mt-8 space-y-2">
            <button
              onClick={() => handleNavigate('chats', ROUTE_PATHS.CHAT)}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 
                ${activeMainTab === 'chats'
                  ? 'bg-primary-600/25 text-primary-400 shadow-sm'
                  : 'text-dark-muted hover:bg-dark-hover hover:text-primary-300 active:bg-primary-600/15'
                }`}
              title={isSidebarCollapsed ? 'Chats' : undefined}
            >
              <MessageSquareIcon className="w-5 h-5" />
              {!isSidebarCollapsed && <span className="font-medium ml-3">Chats</span>}
            </button>

            <button
              onClick={() => handleNavigate('people', ROUTE_PATHS.PEOPLE)}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200
                ${activeMainTab === 'people'
                  ? 'bg-primary-600/25 text-primary-400 shadow-sm'
                  : 'text-dark-muted hover:bg-dark-hover hover:text-primary-300 active:bg-primary-600/15'
                }`}
              title={isSidebarCollapsed ? 'People' : undefined}
            >
              <UsersIcon className="w-5 h-5" />
              {!isSidebarCollapsed && <span className="font-medium ml-3">People</span>}
            </button>

            <button
              onClick={() => handleNavigate('settings', ROUTE_PATHS.SETTINGS)}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200
                ${activeMainTab === 'settings'
                  ? 'bg-primary-600/25 text-primary-400 shadow-sm'
                  : 'text-dark-muted hover:bg-dark-hover hover:text-primary-300 active:bg-primary-600/15'
                }`}
              title={isSidebarCollapsed ? 'Settings' : undefined}
            >
              <SettingsIcon className="w-5 h-5" />
              {!isSidebarCollapsed && <span className="font-medium ml-3">Settings</span>}
            </button>
          </div>
        </nav>
        
        <div className="mt-auto p-4 border-t border-dark-border">
          {!isSidebarCollapsed && (
            <p className="text-xs text-dark-muted text-center">&copy; {new Date().getFullYear()} {APP_NAME}</p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
         <div className="md:hidden flex items-center justify-between p-3 border-b border-dark-border bg-dark-card h-16">
            <button onClick={() => setIsSidebarOpen(true)} className="text-dark-muted hover:text-primary-600">
                <MenuIcon />
            </button>
            <span className="text-lg font-semibold text-primary-600">{activeMainTab.charAt(0).toUpperCase() + activeMainTab.slice(1)}</span>
            <div className="w-6"></div>
        </div>

        {/* Sidebar collapse toggle button for desktop */}
        {isSidebarCollapsed && (
          <div className="hidden md:block absolute left-16 top-1/2 transform -translate-y-1/2 z-20">
            <button
              onClick={toggleSidebarCollapse}
              className="bg-dark-card border border-dark-border rounded-r-lg p-2 text-dark-muted hover:text-primary-600 hover:bg-dark-hover transition-colors"
              title="Expand sidebar"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        
         <Outlet context={outletContextValue} />
      </div>

      {/* Call Modal - Renders when call is ongoing */}
      <CallModal />

      {/* Incoming Call Notification */}
      {callSession.state === CallState.RECEIVING_INCOMING && incomingCallDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[100]">
          <div className="bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl shadow-2xl p-6 w-full max-w-sm text-center text-white transform transition-all animate-pulse">
            <UserAvatar user={incomingCallDetails.initiator} size="xl" className="mx-auto mb-3 border-4 border-primary-300 ring-2 ring-white"/>
            <h3 className="text-2xl font-bold">Incoming {incomingCallDetails.type} Call</h3>
            <p className="text-lg mb-6">from <span className="font-semibold">{getDisplayName(incomingCallDetails.initiator)}</span></p>
            <div className="flex justify-around mt-4">
              <button 
                onClick={handleDeclineCall} 
                className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold text-lg shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300"
                aria-label="Decline call"
              >
                Decline
              </button>
              <button 
                onClick={handleAcceptCall} 
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold text-lg shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-300"
                aria-label="Accept call"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom hook to use the ZingleLayout's context, type-safe
export function useZingleLayoutContext() {
  return useReactRouterOutletContext<ZingleOutletContext>();
}

export default ZingleLayout;
