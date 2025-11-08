import { useState } from 'react';
import { useSocket } from '../socket/socket';
import RoomList from './RoomList';
import UserList from './UserList';
import { FiUsers, FiHash, FiPlus } from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({
  isOpen,
  onClose,
  currentRoom,
  onRoomChange,
  rooms,
  unreadCounts,
  showRooms,
  setShowRooms,
}) => {
  const { createRoom, users } = useSocket();
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      const roomId = newRoomName.trim().toLowerCase().replace(/\s+/g, '-');
      createRoom(roomId, newRoomName.trim());
      setNewRoomName('');
      setShowCreateRoom(false);
      onRoomChange(roomId);
    }
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-tabs">
            <button
              className={`tab ${showRooms ? 'active' : ''}`}
              onClick={() => setShowRooms(true)}
            >
              <FiHash /> Rooms
            </button>
            <button
              className={`tab ${!showRooms ? 'active' : ''}`}
              onClick={() => setShowRooms(false)}
            >
              <FiUsers /> Users
            </button>
          </div>
        </div>

        <div className="sidebar-content">
          {showRooms ? (
            <div className="rooms-section">
              <div className="section-header">
                <h3>Rooms</h3>
                <button
                  className="btn-create-room"
                  onClick={() => setShowCreateRoom(!showCreateRoom)}
                  title="Create new room"
                >
                  <FiPlus />
                </button>
              </div>

              {showCreateRoom && (
                <form onSubmit={handleCreateRoom} className="create-room-form">
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Room name"
                    autoFocus
                    maxLength={30}
                  />
                  <div className="form-actions">
                    <button type="submit" className="btn-submit">
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateRoom(false);
                        setNewRoomName('');
                      }}
                      className="btn-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <RoomList
                rooms={rooms}
                currentRoom={currentRoom}
                onRoomChange={onRoomChange}
                unreadCounts={unreadCounts}
              />
            </div>
          ) : (
            <UserList users={users} currentRoom={currentRoom} />
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

