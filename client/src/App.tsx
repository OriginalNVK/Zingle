import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationSound } from './utils/notificationSound';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import UserProfilePage from './pages/UserProfilePage';
import FriendsPage from './pages/FriendsPage'; // This will be the "People" tab content
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ZingleLayout from './components/ZingleLayout'; 
import ProtectedRoute from './components/common/ProtectedRoute';
import { ROUTE_PATHS } from './constants';
import { UserRole } from './types';
import { ChatProvider } from './contexts/ChatContext';
import { CallProvider } from './contexts/CallContext'; // Import CallProvider
import CallModal from './components/CallModal'; // Import CallModal to render globally

const App: React.FC = () => {
  // Initialize notification sound system on app startup
  useEffect(() => {
    NotificationSound.initialize();
  }, []);

  return (
    <AuthProvider>
      <HashRouter>
        <CallProvider> {/* CallProvider should ideally wrap parts that need call state, potentially around ChatProvider or ZingleLayout */}
          <ChatProvider> 
            <Routes>
              <Route path={ROUTE_PATHS.LOGIN} element={<LoginPage />} />
              <Route path={ROUTE_PATHS.REGISTER} element={<RegisterPage />} />
              
              <Route element={<ProtectedRoute />}>
                <Route element={<ZingleLayout />}>
                  <Route path={ROUTE_PATHS.CHAT} element={<ChatPage />} />
                  <Route path={ROUTE_PATHS.PEOPLE} element={<FriendsPage />} /> 
                  <Route path={ROUTE_PATHS.SETTINGS} element={<UserProfilePage />} /> 
                  
                  <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                    <Route path={ROUTE_PATHS.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
                  </Route>
                </Route>
              </Route>
              
              <Route path={ROUTE_PATHS.NOT_FOUND} element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to={ROUTE_PATHS.NOT_FOUND} replace />} />
            </Routes>
            <CallModal /> {/* Render CallModal globally to overlay other content */}
          </ChatProvider>
        </CallProvider>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
