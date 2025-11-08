import { useState } from 'react';
import { useSocket } from '../socket/socket';
import { format, formatDistanceToNow } from 'date-fns';
import {
  FiSmile,
  FiHeart,
  FiThumbsUp,
  FiThumbsDown,
  FiMoreVertical,
} from 'react-icons/fi';
import './Message.css';

const Message = ({ message }) => {
  const { socket, addReaction, currentRoom } = useSocket();
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwnMessage = message.senderId === socket.id;
  const reactions = message.reactions || {};

  const handleReaction = (reaction) => {
    addReaction(message.id, reaction, message.roomId || currentRoom);
    setShowReactions(false);
  };

  const reactionIcons = {
    like: <FiThumbsUp />,
    love: <FiHeart />,
    smile: <FiSmile />,
    dislike: <FiThumbsDown />,
  };

  const getFilePreview = () => {
    if (!message.file) return null;

    const fileUrl = message.file.url || message.file;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);

    if (isImage) {
      return (
        <div className="file-preview">
          <img src={fileUrl} alt="Shared file" className="file-image" />
        </div>
      );
    }

    return (
      <div className="file-preview">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="file-link"
        >
          📎 {message.file.filename || 'Download file'}
        </a>
      </div>
    );
  };

  if (message.system) {
    return (
      <div className="message system-message">
        <span>{message.message}</span>
      </div>
    );
  }

  return (
    <div className={`message ${isOwnMessage ? 'own' : 'other'}`}>
      {!isOwnMessage && (
        <img
          src={message.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender)}&background=random`}
          alt={message.sender}
          className="message-avatar"
        />
      )}

      <div className="message-content">
        {!isOwnMessage && (
          <div className="message-sender">{message.sender}</div>
        )}

        <div className="message-bubble">
          {message.message && <p>{message.message}</p>}
          {message.file && getFilePreview()}

          <div className="message-footer">
            <span className="message-time">
              {format(new Date(message.timestamp), 'HH:mm')}
            </span>
            {message.delivered && (
              <span className="message-status">✓</span>
            )}
            {message.read && (
              <span className="message-status read">✓✓</span>
            )}
          </div>
        </div>

        {Object.keys(reactions).length > 0 && (
          <div className="message-reactions">
            {Object.entries(reactions).map(([reaction, userIds]) => {
              if (userIds.length === 0) return null;
              return (
                <button
                  key={reaction}
                  className={`reaction-badge ${
                    userIds.includes(socket.id) ? 'active' : ''
                  }`}
                  onClick={() => handleReaction(reaction)}
                  title={`${userIds.length} ${reaction}(s)`}
                >
                  {reactionIcons[reaction] || reaction} {userIds.length}
                </button>
              );
            })}
          </div>
        )}

        <div className="message-actions">
          <button
            className="action-btn"
            onClick={() => setShowReactions(!showReactions)}
            title="Add reaction"
          >
            <FiSmile />
          </button>
          {showReactions && (
            <div className="reactions-picker">
              {Object.keys(reactionIcons).map((reaction) => (
                <button
                  key={reaction}
                  className="reaction-btn"
                  onClick={() => handleReaction(reaction)}
                  title={reaction}
                >
                  {reactionIcons[reaction]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isOwnMessage && (
        <img
          src={message.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender)}&background=random`}
          alt={message.sender}
          className="message-avatar"
        />
      )}
    </div>
  );
};

export default Message;

