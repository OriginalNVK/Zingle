import React, { useState, useEffect } from 'react';
// import { useOutletContext } from 'react-router-dom'; // Replaced by custom hook
import { useZingleLayoutContext } from '../components/ZingleLayout'; // Import custom hook
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import UserAvatar from '../components/UserAvatar';
import type { User } from '../types';
import { getDisplayName } from '../utils/displayName';

// Context type from ZingleLayout is now implicitly handled by useZingleLayoutContext

const UserProfilePage: React.FC = () => {
  const { currentUser, isLoading: authLoading, logout } = useAuth();
  const [profileData, setProfileData] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const layoutContext = useZingleLayoutContext(); // Use the custom hook


  useEffect(() => {
    if (currentUser) {
      setProfileData({
        username: currentUser.username,
        nickname: currentUser.nickname,
        email: currentUser.email,
        bio: currentUser.bio || '',
        avatarUrl: currentUser.avatarUrl
      });
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('Updating profile... (mocked)');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Updated profile data (mocked):', profileData);
    if(currentUser) { 
        // const updatedUser = { ...currentUser, ...profileData };
        // This won't persist in AuthContext globally without a proper update mechanism there
    }
    setStatusMessage('Profile updated successfully! (mocked)');
    setIsEditing(false);
  };

  if (authLoading || !currentUser) {
    return <div className="text-center p-10">Loading profile...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto bg-dark-bg text-dark-text">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      
      {statusMessage && (
        <p className="mb-4 text-sm text-primary-400 bg-primary-600/10 p-3 rounded-md">
          {statusMessage}
        </p>
      )}

      <div className="max-w-2xl mx-auto space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-6 bg-dark-card/50 p-6 rounded-lg shadow-sm">
            <div className="flex flex-col items-center space-y-4">
              <UserAvatar user={{...currentUser, ...profileData} as User} size="xl" />
              {isEditing && (
                <div>
                  <label 
                    htmlFor="avatarUpload" 
                    className="cursor-pointer text-sm text-primary-400 hover:text-primary-300 transition-colors duration-200"
                  >
                    Change Avatar
                  </label>
                  <input type="file" id="avatarUpload" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </div>
              )}
            </div>

            <Input
              label="Username"
              name="username"
              value={profileData.username || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="bg-dark-card border-dark-border text-dark-text"
            />
            <Input
              label="Nickname"
              name="nickname"
              value={profileData.nickname || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Enter your nickname (optional)"
              className="bg-dark-card border-dark-border text-dark-text"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={profileData.email || ''}
              onChange={handleChange}
              disabled
              className="bg-dark-card border-dark-border text-dark-text"
            />
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-dark-text mb-1">Bio</label>
              <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  className="block w-full px-3 py-2 border border-dark-border rounded-md shadow-sm bg-dark-card text-dark-text placeholder-dark-muted/70 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-dark-card/50"
                  value={profileData.bio || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Tell us a bit about yourself..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              {isEditing ? (
                  <>
                  <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); if (currentUser) setProfileData(currentUser); }}>
                      Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                      Save Changes
                  </Button>
                  </>
              ) : (
                  <Button type="button" variant="primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                  </Button>
              )}
            </div>
          </form>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
          <div className="bg-dark-card/50 p-6 rounded-lg shadow-sm space-y-3">
               <Button 
                  variant="danger" 
                  onClick={logout}
                  className="w-full sm:w-auto hover:bg-red-600/90 transition-colors duration-200"
              >
                  Log Out
              </Button>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Developer Options</h2>
          <div className="bg-dark-card/50 p-6 rounded-lg shadow-sm">
              {layoutContext?.MOCK_simulateIncomingCall_DEPRECATED && (
                   <Button 
                      onClick={layoutContext.MOCK_simulateIncomingCall_DEPRECATED} 
                      variant="secondary" 
                      className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/50 hover:border-amber-400/50 transition-colors duration-200"
                  >
                      Simulate Incoming Call (Dev - Deprecated)
                  </Button>
              )}
              <p className="text-xs text-dark-muted mt-2">This button is for development testing of the incoming call UI. This specific button is now deprecated as real call notifications are handled by the Call System.</p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default UserProfilePage;
