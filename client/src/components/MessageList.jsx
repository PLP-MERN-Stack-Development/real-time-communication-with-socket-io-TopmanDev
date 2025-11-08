import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../socket/socket';
import Message from './Message';
import { FiSearch, FiX, FiChevronUp } from 'react-icons/fi';
import { format } from 'date-fns';
import './MessageList.css';

const MessageList = ({ currentRoom }) => {
  const {
    messages,
    typingUsers,
    loadOlderMessages,
    searchMessages,
    searchResults,
    markRead,
    socket,
  } = useSocket();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when viewing them
    if (messages.length > 0 && socket.id) {
      const messageIds = messages
        .filter(
          (msg) =>
            msg.senderId !== socket.id &&
            !msg.readBy?.some((read) => read.userId === socket.id)
        )
        .map((msg) => msg.id);

      if (messageIds.length > 0) {
        markRead(messageIds, currentRoom);
      }
    }
  }, [messages, currentRoom, socket.id, markRead]);

  const handleLoadOlder = async () => {
    if (isLoadingOlder || !hasMoreMessages || messages.length === 0) return;

    setIsLoadingOlder(true);
    const firstMessageId = messages[0].id;
    loadOlderMessages(currentRoom, firstMessageId, 20);

    // Check if there are more messages (simplified check)
    setTimeout(() => {
      setIsLoadingOlder(false);
    }, 500);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchMessages(searchQuery, currentRoom);
    }
  };

  useEffect(() => {
    // Clear search when changing rooms
    setShowSearch(false);
    setSearchQuery('');
  }, [currentRoom]);

  const displayMessages = showSearch && searchResults.length > 0
    ? searchResults
    : messages;

  return (
    <div className="message-list-container">
      <div className="message-list-header">
        <h3>Messages</h3>
        <div className="header-actions">
          <button
            className="btn-search"
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) {
                setSearchQuery('');
              }
            }}
            title="Search messages"
          >
            {showSearch ? <FiX /> : <FiSearch />}
          </button>
        </div>
      </div>

      {showSearch && (
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                searchMessages(e.target.value, currentRoom);
              }
            }}
            placeholder="Search messages..."
            autoFocus
          />
        </form>
      )}

      <div className="message-list" ref={messagesContainerRef}>
        {hasMoreMessages && messages.length > 0 && (
          <button
            className="load-older-btn"
            onClick={handleLoadOlder}
            disabled={isLoadingOlder}
          >
            <FiChevronUp />
            {isLoadingOlder ? 'Loading...' : 'Load older messages'}
          </button>
        )}

        {displayMessages.length > 0 ? (
          <>
            {displayMessages.map((message, index) => {
              const prevMessage = index > 0 ? displayMessages[index - 1] : null;
              const showDateSeparator =
                !prevMessage ||
                format(new Date(message.timestamp), 'yyyy-MM-dd') !==
                  format(new Date(prevMessage.timestamp), 'yyyy-MM-dd');

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="date-separator">
                      {format(new Date(message.timestamp), 'MMMM d, yyyy')}
                    </div>
                  )}
                  <Message message={message} />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="empty-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <span>{typingUsers.join(', ')} is typing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;

