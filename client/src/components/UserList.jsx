import { useSocket } from '../socket/socket';
import { FiUser } from 'react-icons/fi';
import './UserList.css';

const UserList = ({ users, currentRoom }) => {
  const { sendPrivateMessage, socket } = useSocket();

  const handlePrivateMessage = (user) => {
    if (user.id !== socket.id) {
      // You can implement a private message modal or switch to private chat view
      console.log('Start private chat with:', user.username);
    }
  };

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h3>Online Users ({users.length})</h3>
      </div>
      {users && users.length > 0 ? (
        <div className="users">
          {users.map((user) => (
            <div
              key={user.id}
              className={`user-item ${user.id === socket.id ? 'current-user' : ''}`}
              onClick={() => handlePrivateMessage(user)}
            >
              <div className="user-avatar-container">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="user-avatar"
                  />
                ) : (
                  <div className="user-avatar-placeholder">
                    <FiUser />
                  </div>
                )}
                <span className={`online-indicator ${user.id === socket.id ? 'current' : ''}`} />
              </div>
              <span className="user-name">
                {user.username}
                {user.id === socket.id && ' (You)'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <FiUser />
          <p>No users online</p>
        </div>
      )}
    </div>
  );
};

export default UserList;

