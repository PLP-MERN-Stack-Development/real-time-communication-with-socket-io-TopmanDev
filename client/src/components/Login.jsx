import { useState } from 'react';
import { FiUser, FiWifi, FiWifiOff, FiAlertCircle } from 'react-icons/fi';
import './Login.css';

const Login = ({ onLogin, isConnected, connectionError, reconnectAttempt }) => {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim(), avatar || undefined);
    }
  };

  const generateAvatar = () => {
    const name = username.trim() || 'User';
    const colors = ['008751', '764ba2', '667eea', 'ff6b6b', '4ecdc4', 'f39c12', 'e74c3c', '3498db', '9b59b6', '1abc9c'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${randomColor}&color=fff&size=128&bold=true`;
    setAvatar(avatarUrl);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>💬 Real-Time Chat</h1>
          <p>Join the conversation with Socket.io</p>
        </div>

        <div className="connection-status">
          {isConnected && (
            <span className="status connected">
              <FiWifi /> Connected to server
            </span>
          )}
          {!isConnected && reconnectAttempt > 0 && (
            <span className="status reconnecting">
              <FiWifi /> Reconnecting... (Attempt {reconnectAttempt})
            </span>
          )}
          {connectionError && (
            <div className="connection-error">
              <FiAlertCircle /> {connectionError}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              <FiUser /> Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label htmlFor="avatar">Avatar URL (optional)</label>
            {avatar && (
              <div className="avatar-preview">
                <img src={avatar} alt="Avatar preview" />
              </div>
            )}
            <input
              id="avatar"
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
            <button
              type="button"
              onClick={generateAvatar}
              className="btn-generate-avatar"
            >
              Generate Avatar
            </button>
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={!username.trim()}
          >
            {isConnected ? 'Join Chat' : 'Connecting...'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

