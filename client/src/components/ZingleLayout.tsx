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
} from './icons';
import { useCall } from '../contexts/CallContext'; // Import useCall
import { CallState } from '../types'; // Import CallState
import type { User as UserType } from '../types'; // Import User as type

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

  const showCallNotification = callSession.state === CallState.RECEIVING_INCOMING && incomingCallDetails !== null;
  const incomingCallUser = incomingCallDetails?.initiator;


  return (
    <div className="flex h-screen antialiased text-gray-800 bg-slate-100 font-sans">
      <div className={`absolute md:static inset-y-0 left-0 z-30 w-72 bg-white border-r border-gray-200 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 h-16">
          <div className="flex items-center space-x-2">
            <ZingleLogo className="w-8 h-8 text-primary-500" />
            <h1 className="text-2xl font-bold text-primary-600">{APP_NAME}</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-primary-600">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <UserAvatar user={currentUser} size="md" className="border-2 border-primary-500" />
            <div>
              <p className="text-md font-semibold text-gray-700">{currentUser.username}</p>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="ml-auto p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-100 transition-colors">
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
                  : 'text-dark-muted hover:bg-dark-card/80 hover:text-primary-300 active:bg-primary-600/15'
                }`}
            >
              <MessageSquareIcon className="w-5 h-5 mr-3" />
              <span className="font-medium">Chats</span>
            </button>

            <button
              onClick={() => handleNavigate('people', ROUTE_PATHS.PEOPLE)}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200
                ${activeMainTab === 'people'
                  ? 'bg-primary-600/25 text-primary-400 shadow-sm'
                  : 'text-dark-muted hover:bg-dark-card/80 hover:text-primary-300 active:bg-primary-600/15'
                }`}
            >
              <UsersIcon className="w-5 h-5 mr-3" />
              <span className="font-medium">People</span>
            </button>

            <button
              onClick={() => handleNavigate('settings', ROUTE_PATHS.SETTINGS)}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200
                ${activeMainTab === 'settings'
                  ? 'bg-primary-600/25 text-primary-400 shadow-sm'
                  : 'text-dark-muted hover:bg-dark-card/80 hover:text-primary-300 active:bg-primary-600/15'
                }`}
            >
              <SettingsIcon className="w-5 h-5 mr-3" />
              <span className="font-medium">Settings</span>
            </button>
          </div>
        </nav>
        
        <div className="mt-auto p-4 border-t border-gray-200">
             <p className="text-xs text-gray-400 text-center">&copy; {new Date().getFullYear()} {APP_NAME}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
         <div className="md:hidden flex items-center justify-between p-3 border-b bg-white h-16">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-primary-600">
                <MenuIcon />
            </button>
            <span className="text-lg font-semibold text-primary-600">{activeMainTab.charAt(0).toUpperCase() + activeMainTab.slice(1)}</span>
            <div className="w-6"></div>
        </div>
        
         <Outlet context={outletContextValue} />
      </div>

        {showCallNotification && incomingCallUser && (
             <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[100]"> {/* Increased z-index */}
                <div className="bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl shadow-2xl p-6 w-full max-w-sm text-center text-white transform transition-all animate-pulse">
                    <UserAvatar user={incomingCallUser as UserType} size="xl" className="mx-auto mb-3 border-4 border-primary-300 ring-2 ring-white"/>
                    <h3 className="text-2xl font-bold">Incoming {incomingCallDetails?.type} Call</h3>
                    <p className="text-lg mb-6">from <span className="font-semibold">{incomingCallUser.username}</span></p>
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
