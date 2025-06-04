import React from 'react';
import ContactList from '../components/ContactList';
import ChatWindow from '../components/ChatWindow';
// ChatProvider is now in App.tsx wrapping ZingleLayout

const ChatPage: React.FC = () => {
  return (
    // This div structure ensures ContactList and ChatWindow are laid out side-by-side
    // and take up the full height of their container in ZingleLayout.
    <div className="flex h-full w-full overflow-hidden"> {/* Ensure full height and width, overflow hidden for children to manage scroll */}
      {/* ContactList container - it will have its own width and scroll internally */}
      <div className="w-72 md:w-1/3 lg:w-1/4 h-full hidden md:flex flex-col border-r border-gray-200"> {/* Width matches sidebar, hidden on mobile for Zingle layout */}
         <ContactList />
      </div>
      {/* ChatWindow will take remaining space */}
      <div className="flex-1 h-full flex flex-col">
        <ChatWindow />
      </div>
    </div>
  );
};

export default ChatPage;
