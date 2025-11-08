import { FiHash, FiMessageSquare } from 'react-icons/fi';
import './RoomList.css';

const RoomList = ({ rooms, currentRoom, onRoomChange, unreadCounts }) => {
  return (
    <div className="room-list">
      {rooms && rooms.length > 0 ? (
        rooms.map((roomId) => {
          const unreadCount = unreadCounts[roomId] || 0;
          const isActive = roomId === currentRoom;

          return (
            <div
              key={roomId}
              className={`room-item ${isActive ? 'active' : ''}`}
              onClick={() => !isActive && onRoomChange(roomId)}
            >
              <FiHash className="room-icon" />
              <span className="room-name">{roomId}</span>
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount}</span>
              )}
            </div>
          );
        })
      ) : (
        <div className="empty-state">
          <FiMessageSquare />
          <p>No rooms available</p>
        </div>
      )}
    </div>
  );
};

export default RoomList;

