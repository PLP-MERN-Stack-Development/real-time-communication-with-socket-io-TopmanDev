import { useState, useEffect } from 'react';
import { useSocket } from '../socket/socket';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import './ChatRoom.css';

const ChatRoom = ({ currentUser, onLogout }) => {
  const {
    currentRoom,
    setCurrentRoom,
    joinRoom,
    rooms,
    unreadCounts,
    isConnected,
  } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showRooms, setShowRooms] = useState(true);

  const handleRoomChange = (roomId) => {
    if (roomId !== currentRoom) {
      setCurrentRoom(roomId);
      joinRoom(roomId);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    }
  };

  return (
    <div className="chat-room">
      <header className="chat-header">
        <div className="header-left">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <h2>💬 Chat Room: {currentRoom}</h2>
        </div>
        <div className="header-right">
          <div className="connection-indicator">
            <span className={isConnected ? 'connected' : 'disconnected'}>
              {isConnected ? '🟢' : '🔴'} {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="user-info">
            <img
              src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'User')}&background=random`}
              alt={currentUser?.username}
              className="user-avatar-small"
            />
            <span>{currentUser?.username}</span>
          </div>
          <button onClick={onLogout} className="btn-logout" title="Logout">
            <FiLogOut />
          </button>
        </div>
      </header>

      <div className="chat-container">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentRoom={currentRoom}
          onRoomChange={handleRoomChange}
          rooms={rooms}
          unreadCounts={unreadCounts}
          showRooms={showRooms}
          setShowRooms={setShowRooms}
        />

        <div className="chat-main">
          <MessageList currentRoom={currentRoom} />
          <MessageInput currentRoom={currentRoom} />
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatRoom;

