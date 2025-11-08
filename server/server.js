// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Allow the configured client URL or common Vite dev ports during development
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman) or allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Store connected users, messages, rooms, and other data
const users = {}; // { socketId: { username, id, currentRoom, avatar } }
const messages = {}; // { roomId: [messages] }
const typingUsers = {}; // { roomId: { socketId: username } }
const rooms = new Set(['general']); // Available rooms
const roomMembers = {}; // { roomId: Set of socketIds }
const messageReactions = {}; // { messageId: { reaction: [userIds] } }
const readReceipts = {}; // { messageId: { userId: timestamp } }
const unreadCounts = {}; // { userId: { roomId: count } }

// Initialize default room
roomMembers['general'] = new Set();
messages['general'] = [];

// Helper function to get room members
function getRoomMembers(roomId) {
  if (!roomMembers[roomId]) return [];
  return Array.from(roomMembers[roomId])
    .map(socketId => users[socketId])
    .filter(user => user !== undefined);
}

// Helper function to increment unread count
function incrementUnreadCount(roomId, excludeSocketId) {
  roomMembers[roomId]?.forEach(socketId => {
    if (socketId !== excludeSocketId) {
      if (!unreadCounts[socketId]) {
        unreadCounts[socketId] = {};
      }
      if (!unreadCounts[socketId][roomId]) {
        unreadCounts[socketId][roomId] = 0;
      }
      unreadCounts[socketId][roomId]++;
      io.to(socketId).emit('unread_count_update', {
        roomId,
        count: unreadCounts[socketId][roomId],
      });
    }
  });
}

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send available rooms to the client
  socket.emit('rooms_list', Array.from(rooms));

  // Handle user joining
  socket.on('user_join', ({ username, avatar }) => {
    users[socket.id] = {
      username: username || `User_${socket.id.substring(0, 6)}`,
      id: socket.id,
      currentRoom: 'general',
      avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
      joinedAt: new Date().toISOString(),
    };

    // Join default room
    if (!roomMembers['general']) {
      roomMembers['general'] = new Set();
    }
    roomMembers['general'].add(socket.id);
    socket.join('general');

    // Initialize unread counts
    unreadCounts[socket.id] = {};

    // Send room list and users to the client
    io.emit('user_list', Object.values(users));
    io.to('general').emit('user_joined', {
      username: users[socket.id].username,
      id: socket.id,
      room: 'general',
    });

    // Send existing messages for the room
    if (messages['general']) {
      socket.emit('load_messages', {
        roomId: 'general',
        messages: messages['general'].slice(-50), // Last 50 messages
      });
    }

    // Send room members
    socket.emit('room_members', {
      roomId: 'general',
      members: getRoomMembers('general'),
    });

    console.log(`${users[socket.id].username} joined the chat`);
  });

  // Handle joining a room
  socket.on('join_room', ({ roomId, username }) => {
    const user = users[socket.id];
    if (!user) return;

    // Leave current room
    const currentRoom = user.currentRoom;
    if (currentRoom && roomMembers[currentRoom]) {
      roomMembers[currentRoom].delete(socket.id);
      socket.leave(currentRoom);
      io.to(currentRoom).emit('room_members', {
        roomId: currentRoom,
        members: getRoomMembers(currentRoom),
      });
    }

    // Join new room
    if (!rooms.has(roomId)) {
      rooms.add(roomId);
      roomMembers[roomId] = new Set();
      messages[roomId] = [];
      io.emit('rooms_list', Array.from(rooms));
    }

    roomMembers[roomId].add(socket.id);
    socket.join(roomId);
    user.currentRoom = roomId;

    // Reset unread count for this room
    if (unreadCounts[socket.id] && unreadCounts[socket.id][roomId]) {
      unreadCounts[socket.id][roomId] = 0;
      socket.emit('unread_count_update', { roomId, count: 0 });
    }

    // Send existing messages
    if (messages[roomId]) {
      socket.emit('load_messages', {
        roomId,
        messages: messages[roomId].slice(-50),
      });
    }

    // Notify room members
    io.to(roomId).emit('user_joined_room', {
      username: user.username,
      roomId,
    });

    io.to(roomId).emit('room_members', {
      roomId,
      members: getRoomMembers(roomId),
    });

    console.log(`${user.username} joined room: ${roomId}`);
  });

  // Handle creating a new room
  socket.on('create_room', ({ roomId, roomName }) => {
    if (!rooms.has(roomId)) {
      rooms.add(roomId);
      roomMembers[roomId] = new Set();
      messages[roomId] = [];
      io.emit('rooms_list', Array.from(rooms));
      socket.emit('room_created', { roomId, roomName: roomName || roomId });
    }
  });

  // Handle chat messages
  socket.on('send_message', (messageData) => {
    const user = users[socket.id];
    if (!user) return;

    const roomId = messageData.roomId || user.currentRoom || 'general';
    if (!messages[roomId]) {
      messages[roomId] = [];
    }

    const message = {
      ...messageData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: user.username,
      senderId: socket.id,
      senderAvatar: user.avatar,
      roomId,
      timestamp: new Date().toISOString(),
      delivered: false,
      read: false,
    };

    // Remove message text if it's a file
    if (message.file) {
      delete message.message;
    }

    messages[roomId].push(message);

    // Limit stored messages per room
    if (messages[roomId].length > 500) {
      messages[roomId].shift();
    }

    // Emit to room members
    io.to(roomId).emit('receive_message', message);

    // Increment unread count for other users
    incrementUnreadCount(roomId, socket.id);

    // Acknowledgment
    socket.emit('message_delivered', { messageId: message.id });
  });

  // Handle typing indicator
  socket.on('typing', ({ roomId, isTyping }) => {
    const user = users[socket.id];
    if (!user) return;

    const targetRoom = roomId || user.currentRoom || 'general';
    
    if (!typingUsers[targetRoom]) {
      typingUsers[targetRoom] = {};
    }

    if (isTyping) {
      typingUsers[targetRoom][socket.id] = user.username;
    } else {
      delete typingUsers[targetRoom][socket.id];
    }

    socket.to(targetRoom).emit('typing_users', {
      roomId: targetRoom,
      users: Object.values(typingUsers[targetRoom]),
    });
  });

  // Handle private messages
  socket.on('private_message', ({ to, message, file }) => {
    const user = users[socket.id];
    if (!user) return;

    const recipientSocket = Object.values(users).find(u => u.id === to);
    if (!recipientSocket) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    const messageData = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: user.username,
      senderId: socket.id,
      senderAvatar: user.avatar,
      recipientId: to,
      message,
      file,
      timestamp: new Date().toISOString(),
      isPrivate: true,
      delivered: false,
      read: false,
    };

    // Remove message text if it's a file
    if (file) {
      delete messageData.message;
    }

    socket.to(to).emit('private_message', messageData);
    socket.emit('private_message', messageData);

    // Increment unread count for recipient
    if (!unreadCounts[to]) {
      unreadCounts[to] = {};
    }
    if (!unreadCounts[to]['private']) {
      unreadCounts[to]['private'] = 0;
    }
    unreadCounts[to]['private']++;
    io.to(to).emit('unread_count_update', {
      roomId: 'private',
      count: unreadCounts[to]['private'],
    });
  });

  // Handle message reactions
  socket.on('add_reaction', ({ messageId, reaction, roomId }) => {
    const user = users[socket.id];
    if (!user) return;

    if (!messageReactions[messageId]) {
      messageReactions[messageId] = {};
    }
    if (!messageReactions[messageId][reaction]) {
      messageReactions[messageId][reaction] = [];
    }

    // Remove user from other reactions on this message
    Object.keys(messageReactions[messageId]).forEach(r => {
      messageReactions[messageId][r] = messageReactions[messageId][r].filter(
        id => id !== socket.id
      );
    });

    // Add user to this reaction
    if (!messageReactions[messageId][reaction].includes(socket.id)) {
      messageReactions[messageId][reaction].push(socket.id);
    }

    io.to(roomId || user.currentRoom || 'general').emit('reaction_added', {
      messageId,
      reaction,
      reactions: messageReactions[messageId],
      userId: socket.id,
      username: user.username,
    });
  });

  // Handle read receipts
  socket.on('mark_read', ({ messageIds, roomId }) => {
    const user = users[socket.id];
    if (!user) return;

    const targetRoom = roomId || user.currentRoom || 'general';
    messageIds.forEach(messageId => {
      if (!readReceipts[messageId]) {
        readReceipts[messageId] = {};
      }
      readReceipts[messageId][socket.id] = new Date().toISOString();

      io.to(targetRoom).emit('read_receipt', {
        messageId,
        userId: socket.id,
        username: user.username,
        timestamp: readReceipts[messageId][socket.id],
      });
    });
  });

  // Handle message search
  socket.on('search_messages', ({ query, roomId }) => {
    const targetRoom = roomId || users[socket.id]?.currentRoom || 'general';
    if (!messages[targetRoom]) {
      socket.emit('search_results', { query, results: [] });
      return;
    }

    const results = messages[targetRoom].filter(msg => {
      const searchText = query.toLowerCase();
      return (
        msg.message?.toLowerCase().includes(searchText) ||
        msg.sender?.toLowerCase().includes(searchText)
      );
    });

    socket.emit('search_results', { query, results: results.slice(-20) });
  });

  // Handle loading older messages (pagination)
  socket.on('load_older_messages', ({ roomId, beforeMessageId, limit = 20 }) => {
    const targetRoom = roomId || users[socket.id]?.currentRoom || 'general';
    if (!messages[targetRoom]) {
      socket.emit('older_messages', { messages: [] });
      return;
    }

    const roomMessages = messages[targetRoom];
    let startIndex = roomMessages.length;

    if (beforeMessageId) {
      startIndex = roomMessages.findIndex(msg => msg.id === beforeMessageId);
    }

    const olderMessages = roomMessages
      .slice(Math.max(0, startIndex - limit), startIndex)
      .reverse();

    socket.emit('older_messages', { messages: olderMessages });
  });

  // Handle getting unread counts
  socket.on('get_unread_counts', () => {
    const counts = unreadCounts[socket.id] || {};
    socket.emit('unread_counts', counts);
  });

  // Handle leaving a room
  socket.on('leave_room', ({ roomId }) => {
    const user = users[socket.id];
    if (!user) return;

    if (roomMembers[roomId]) {
      roomMembers[roomId].delete(socket.id);
      socket.leave(roomId);

      io.to(roomId).emit('user_left_room', {
        username: user.username,
        roomId,
      });

      io.to(roomId).emit('room_members', {
        roomId,
        members: getRoomMembers(roomId),
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      const { username, currentRoom } = user;

      // Leave current room
      if (currentRoom && roomMembers[currentRoom]) {
        roomMembers[currentRoom].delete(socket.id);
        io.to(currentRoom).emit('user_left_room', {
          username,
          roomId: currentRoom,
        });
        io.to(currentRoom).emit('room_members', {
          roomId: currentRoom,
          members: getRoomMembers(currentRoom),
        });
      }

      // Clean up typing indicators
      Object.keys(typingUsers).forEach(roomId => {
        delete typingUsers[roomId][socket.id];
        if (Object.keys(typingUsers[roomId]).length === 0) {
          delete typingUsers[roomId];
        }
      });

      // Clean up user data
      delete users[socket.id];
      delete unreadCounts[socket.id];

      // Notify all users
      io.emit('user_left', { username, id: socket.id });
      io.emit('user_list', Object.values(users));

      console.log(`${username} left the chat`);
    }
  });
});

// API routes
app.get('/api/messages/:roomId', (req, res) => {
  const { roomId } = req.params;
  const roomMessages = messages[roomId] || [];
  res.json(roomMessages);
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

app.get('/api/rooms', (req, res) => {
  res.json(Array.from(rooms));
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io }; 