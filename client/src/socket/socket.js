// socket.js - Socket.io client setup

import { io } from 'socket.io-client';
import { useEffect, useState, useCallback } from 'react';

// Socket.io connection URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'],
});

// Custom hook for using socket.io
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState({}); // { roomId: [messages] }
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [typingUsers, setTypingUsers] = useState({}); // { roomId: [usernames] }
  const [roomMembers, setRoomMembers] = useState({}); // { roomId: [users] }
  const [unreadCounts, setUnreadCounts] = useState({}); // { roomId: count }
  const [lastMessage, setLastMessage] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [reactions, setReactions] = useState({}); // { messageId: { reaction: [userIds] } }
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // Connect to socket server
  const connect = useCallback((username, avatar) => {
    console.log('Attempting to connect with username:', username);
    const userData = { username, avatar };
    
    // Function to join user after connection
    const joinUser = () => {
      if (socket.id) {
        console.log('Emitting user_join with socket.id:', socket.id);
        socket.emit('user_join', userData);
        setCurrentUser({ ...userData, id: socket.id });
      } else {
        console.warn('Socket connected but no socket.id yet');
        // Try again after a short delay
        setTimeout(() => {
          if (socket.id) {
            socket.emit('user_join', userData);
            setCurrentUser({ ...userData, id: socket.id });
          }
        }, 100);
      }
    };
    
    // If already connected, join immediately
    if (socket.connected) {
      console.log('Socket already connected');
      joinUser();
      return;
    }
    
    // Connect and wait for connection
    console.log('Connecting to server...');
    socket.connect();
    
    // Use once to avoid duplicate handlers
    socket.once('connect', () => {
      console.log('Socket connected successfully');
      joinUser();
    });
  }, []);

  // Disconnect from socket server
  const disconnect = useCallback(() => {
    socket.disconnect();
    setCurrentUser(null);
  }, []);

  // Join a room
  const joinRoom = useCallback((roomId) => {
    socket.emit('join_room', { roomId, username: currentUser?.username });
    setCurrentRoom(roomId);
  }, [currentUser]);

  // Create a new room
  const createRoom = useCallback((roomId, roomName) => {
    socket.emit('create_room', { roomId, roomName });
  }, []);

  // Leave a room
  const leaveRoom = useCallback((roomId) => {
    socket.emit('leave_room', { roomId });
  }, []);

  // Send a message
  const sendMessage = useCallback((message, roomId, file) => {
    socket.emit('send_message', {
      message,
      roomId: roomId || currentRoom,
      file,
    });
  }, [currentRoom]);

  // Send a private message
  const sendPrivateMessage = useCallback((to, message, file) => {
    socket.emit('private_message', { to, message, file });
  }, []);

  // Set typing status
  const setTyping = useCallback((isTyping, roomId) => {
    socket.emit('typing', {
      roomId: roomId || currentRoom,
      isTyping,
    });
  }, [currentRoom]);

  // Add reaction to a message
  const addReaction = useCallback((messageId, reaction, roomId) => {
    socket.emit('add_reaction', {
      messageId,
      reaction,
      roomId: roomId || currentRoom,
    });
  }, [currentRoom]);

  // Mark messages as read
  const markRead = useCallback((messageIds, roomId) => {
    socket.emit('mark_read', {
      messageIds,
      roomId: roomId || currentRoom,
    });
  }, [currentRoom]);

  // Search messages
  const searchMessages = useCallback((query, roomId) => {
    socket.emit('search_messages', {
      query,
      roomId: roomId || currentRoom,
    });
  }, [currentRoom]);

  // Load older messages
  const loadOlderMessages = useCallback((roomId, beforeMessageId, limit = 20) => {
    socket.emit('load_older_messages', {
      roomId: roomId || currentRoom,
      beforeMessageId,
      limit,
    });
  }, [currentRoom]);

  // Get unread counts
  const getUnreadCounts = useCallback(() => {
    socket.emit('get_unread_counts');
  }, []);

  // Socket event listeners
  useEffect(() => {
    // Connection events
    const onConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempt(0);
      console.log('Connected to server', socket.id);
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);
      console.log('Disconnected from server', reason);
      
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, need to reconnect manually
        console.log('Server disconnected the socket, reconnecting...');
        socket.connect();
      }
    };

    const onConnectError = (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
      setConnectionError(error.message || 'Failed to connect to server');
    };

    const onReconnectAttempt = (attemptNumber) => {
      setReconnectAttempt(attemptNumber);
      console.log(`Reconnection attempt ${attemptNumber}...`);
    };

    const onReconnectError = (error) => {
      console.error('Reconnection error:', error);
      setConnectionError(`Reconnection failed: ${error.message}`);
    };

    const onReconnectFailed = () => {
      console.error('All reconnection attempts failed');
      setConnectionError('Could not connect to server. Please check if the server is running on port 5000.');
    };

    // Room events
    const onRoomsList = (roomsList) => {
      setRooms(roomsList);
    };

    const onRoomCreated = ({ roomId, roomName }) => {
      setRooms((prev) => {
        // Only add if it doesn't already exist
        if (prev.includes(roomId)) {
          return prev;
        }
        return [...prev, roomId];
      });
    };

    const onRoomMembers = ({ roomId, members }) => {
      setRoomMembers((prev) => ({
        ...prev,
        [roomId]: members,
      }));
    };

    // Message events
    const onReceiveMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => {
        const roomMessages = prev[message.roomId] || [];
        return {
          ...prev,
          [message.roomId]: [...roomMessages, message],
        };
      });

      // Play notification sound if message is not from current user
      if (message.senderId !== socket.id && 'Notification' in window) {
        // Request notification permission if not already granted
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
        
        if (Notification.permission === 'granted') {
          new Notification(`New message from ${message.sender}`, {
            body: message.message || 'File shared',
            icon: message.senderAvatar,
            tag: message.roomId,
          });
        }

        // Play sound notification
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {
          // Ignore audio play errors
        });
      }
    };

    const onPrivateMessage = (message) => {
      setLastMessage(message);
      const privateRoomId = `private_${message.senderId}`;
      setMessages((prev) => {
        const roomMessages = prev[privateRoomId] || [];
        return {
          ...prev,
          [privateRoomId]: [...roomMessages, message],
        };
      });
    };

    const onLoadMessages = ({ roomId, messages: roomMessages }) => {
      setMessages((prev) => ({
        ...prev,
        [roomId]: roomMessages,
      }));
    };

    const onOlderMessages = ({ messages: olderMessages }) => {
      if (olderMessages.length > 0) {
        const roomId = olderMessages[0].roomId || currentRoom;
        setMessages((prev) => {
          const currentMessages = prev[roomId] || [];
          return {
            ...prev,
            [roomId]: [...olderMessages, ...currentMessages],
          };
        });
      }
    };

    // User events
    const onUserList = (userList) => {
      setUsers(userList);
    };

    const onUserJoined = ({ username, room }) => {
      // System message handled on server
    };

    const onUserJoinedRoom = ({ username, roomId }) => {
      // System message for room join
    };

    const onUserLeft = ({ username }) => {
      // System message handled on server
    };

    const onUserLeftRoom = ({ username, roomId }) => {
      // System message for room leave
    };

    // Typing events
    const onTypingUsers = ({ roomId, users: typingUsersList }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [roomId]: typingUsersList,
      }));
    };

    // Reaction events
    const onReactionAdded = ({ messageId, reactions: messageReactions }) => {
      setReactions((prev) => ({
        ...prev,
        [messageId]: messageReactions,
      }));
      
      // Update reactions in messages
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((roomId) => {
          updated[roomId] = updated[roomId].map((msg) => {
            if (msg.id === messageId) {
              return { ...msg, reactions: messageReactions };
            }
            return msg;
          });
        });
        return updated;
      });
    };

    // Read receipt events
    const onReadReceipt = ({ messageId, userId, username, timestamp }) => {
      // Update message read status
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((roomId) => {
          updated[roomId] = updated[roomId].map((msg) => {
            if (msg.id === messageId) {
              return {
                ...msg,
                readBy: [...(msg.readBy || []), { userId, username, timestamp }],
              };
            }
            return msg;
          });
        });
        return updated;
      });
    };

    // Message delivery events
    const onMessageDelivered = ({ messageId }) => {
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((roomId) => {
          updated[roomId] = updated[roomId].map((msg) => {
            if (msg.id === messageId) {
              return { ...msg, delivered: true };
            }
            return msg;
          });
        });
        return updated;
      });
    };

    // Search events
    const onSearchResults = ({ query, results }) => {
      setSearchResults(results);
    };

    // Unread count events
    const onUnreadCountUpdate = ({ roomId, count }) => {
      setUnreadCounts((prev) => ({
        ...prev,
        [roomId]: count,
      }));
    };

    const onUnreadCounts = (counts) => {
      setUnreadCounts(counts);
    };

    // Error events
    const onError = ({ message }) => {
      console.error('Socket error:', message);
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('reconnect_error', onReconnectError);
    socket.on('reconnect_failed', onReconnectFailed);
    socket.on('rooms_list', onRoomsList);
    socket.on('room_created', onRoomCreated);
    socket.on('room_members', onRoomMembers);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('load_messages', onLoadMessages);
    socket.on('older_messages', onOlderMessages);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_joined_room', onUserJoinedRoom);
    socket.on('user_left', onUserLeft);
    socket.on('user_left_room', onUserLeftRoom);
    socket.on('typing_users', onTypingUsers);
    socket.on('reaction_added', onReactionAdded);
    socket.on('read_receipt', onReadReceipt);
    socket.on('message_delivered', onMessageDelivered);
    socket.on('search_results', onSearchResults);
    socket.on('unread_count_update', onUnreadCountUpdate);
    socket.on('unread_counts', onUnreadCounts);
    socket.on('error', onError);

    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('reconnect_error', onReconnectError);
      socket.off('reconnect_failed', onReconnectFailed);
      socket.off('rooms_list', onRoomsList);
      socket.off('room_created', onRoomCreated);
      socket.off('room_members', onRoomMembers);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('load_messages', onLoadMessages);
      socket.off('older_messages', onOlderMessages);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_joined_room', onUserJoinedRoom);
      socket.off('user_left', onUserLeft);
      socket.off('user_left_room', onUserLeftRoom);
      socket.off('typing_users', onTypingUsers);
      socket.off('reaction_added', onReactionAdded);
      socket.off('read_receipt', onReadReceipt);
      socket.off('message_delivered', onMessageDelivered);
      socket.off('search_results', onSearchResults);
      socket.off('unread_count_update', onUnreadCountUpdate);
      socket.off('unread_counts', onUnreadCounts);
      socket.off('error', onError);
    };
  }, [currentRoom]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Try to connect on mount (optional - helps with connection status)
  useEffect(() => {
    // Don't auto-connect, wait for user to click "Join Chat"
    // But we can check connection status
    if (!socket.connected && !socket.disconnected) {
      // Socket is in initial state
      console.log('Socket ready, waiting for user to connect...');
    }
  }, []);

  // Note: Room joining is handled in ChatRoom component
  // This useEffect could cause infinite loops if not careful

  return {
    socket,
    isConnected,
    currentUser,
    messages: messages[currentRoom] || [],
    allMessages: messages,
    users,
    rooms,
    currentRoom,
    typingUsers: typingUsers[currentRoom] || [],
    roomMembers: roomMembers[currentRoom] || [],
    unreadCounts,
    lastMessage,
    searchResults,
    reactions,
    connectionError,
    reconnectAttempt,
    connect,
    disconnect,
    joinRoom,
    createRoom,
    leaveRoom,
    sendMessage,
    sendPrivateMessage,
    setTyping,
    addReaction,
    markRead,
    searchMessages,
    loadOlderMessages,
    getUnreadCounts,
    setCurrentRoom,
  };
};

export default socket;
