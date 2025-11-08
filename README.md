# 💬 Real-Time Chat Application with Socket.io

A full-featured real-time chat application built with React, Node.js, Express, and Socket.io. This application demonstrates bidirectional communication, multiple chat rooms, file sharing, message reactions, read receipts, and more.

## 🚀 Features

### Core Features
- ✅ Real-time messaging with Socket.io
- ✅ User authentication (username-based)
- ✅ Multiple chat rooms/channels
- ✅ Private messaging between users
- ✅ Online/offline user status
- ✅ Typing indicators
- ✅ Message timestamps
- ✅ Responsive design (mobile & desktop)

### Advanced Features
- ✅ File and image sharing
- ✅ Message reactions (like, love, smile, dislike)
- ✅ Read receipts
- ✅ Message search functionality
- ✅ Message pagination (load older messages)
- ✅ Unread message counts
- ✅ Browser notifications
- ✅ Sound notifications
- ✅ Auto-reconnection on disconnect
- ✅ Message delivery acknowledgment

## 📁 Project Structure

```
real-time-communication-with-socket-io/
├── client/                 # React front-end
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Login.jsx
│   │   │   ├── ChatRoom.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── Message.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   ├── RoomList.jsx
│   │   │   └── UserList.jsx
│   │   ├── socket/         # Socket.io client setup
│   │   │   └── socket.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                 # Node.js back-end
│   ├── uploads/            # Uploaded files
│   ├── server.js           # Main server file
│   └── package.json
├── Week5-Assignment.md     # Assignment details
└── README.md               # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd real-time-communication-with-socket-io
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure environment variables**

   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

   Create a `.env` file in the `client` directory (optional):
   ```env
   VITE_SOCKET_URL=http://localhost:5000
   ```

5. **Start the development servers**

   In one terminal, start the server:
   ```bash
   cd server
   npm run dev
   ```

   In another terminal, start the client:
   ```bash
   cd client
   npm run dev
   ```

6. **Access the application**

   Open your browser and navigate to `http://localhost:5173`

## 📖 Usage

### Getting Started

1. Enter your username (and optional avatar URL) on the login page
2. Click "Join Chat" to connect to the server
3. Start chatting in the default "general" room

### Creating Rooms

1. Click the "+" button in the Rooms section of the sidebar
2. Enter a room name
3. Click "Create" to create and join the new room

### Sending Messages

1. Type your message in the input box at the bottom
2. Press Enter to send (Shift+Enter for a new line)
3. Click the paperclip icon to attach files or images

### Message Reactions

1. Hover over a message
2. Click the smile icon
3. Select a reaction (like, love, smile, dislike)

### Private Messaging

1. Click on a user in the Users list
2. Start a private conversation (feature can be extended)

### Search Messages

1. Click the search icon in the messages header
2. Type your search query
3. View filtered results

## 🎨 Features in Detail

### Real-Time Communication
- Messages are instantly delivered to all users in the same room
- Typing indicators show when users are composing messages
- Online/offline status updates in real-time

### File Sharing
- Support for images (JPG, PNG, GIF, WebP)
- Support for documents (PDF, DOC, DOCX, TXT)
- File size limit: 10MB
- Image previews in chat
- Download links for documents

### Message Reactions
- Add reactions to any message
- See reaction counts
- Toggle your own reactions

### Read Receipts
- Messages are marked as delivered when sent
- Messages are marked as read when viewed by recipients
- Visual indicators (✓ and ✓✓)

### Notifications
- Browser notifications for new messages (requires permission)
- Sound notifications (optional - add notification.mp3 to client/public folder)
- Unread message counts per room

**Note**: To enable sound notifications, add a `notification.mp3` file to the `client/public` folder. You can download free notification sounds from [NotificationSounds.com](https://notificationsounds.com/) or [ZapSplat](https://www.zapsplat.com/).

### Responsive Design
- Works on desktop and mobile devices
- Collapsible sidebar on mobile
- Touch-friendly interface

## 🔧 Technical Details

### Server (Node.js + Express + Socket.io)

- **Port**: 5000 (configurable via .env)
- **Socket.io**: Version 4.6.1
- **File Upload**: Multer middleware
- **Storage**: In-memory (messages, users, rooms)

### Client (React + Vite + Socket.io Client)

- **Port**: 5173 (Vite default)
- **React**: Version 18.2.0
- **Styling**: CSS modules
- **Icons**: React Icons
- **Date Formatting**: date-fns

### Socket Events

#### Client → Server
- `user_join` - Join the chat with username
- `join_room` - Join a specific room
- `create_room` - Create a new room
- `send_message` - Send a message
- `private_message` - Send a private message
- `typing` - Typing indicator
- `add_reaction` - Add reaction to message
- `mark_read` - Mark messages as read
- `search_messages` - Search messages
- `load_older_messages` - Load older messages
- `get_unread_counts` - Get unread message counts

#### Server → Client
- `rooms_list` - List of available rooms
- `room_created` - Room created notification
- `room_members` - Room members list
- `receive_message` - New message received
- `private_message` - Private message received
- `load_messages` - Load messages for room
- `older_messages` - Older messages loaded
- `user_list` - List of online users
- `user_joined` - User joined notification
- `user_left` - User left notification
- `typing_users` - Users typing in room
- `reaction_added` - Reaction added to message
- `read_receipt` - Read receipt update
- `message_delivered` - Message delivery confirmation
- `search_results` - Search results
- `unread_count_update` - Unread count update
- `unread_counts` - All unread counts

## 🚢 Deployment

### Server Deployment (Render, Railway, Heroku)

1. Set environment variables:
   - `PORT` (auto-assigned on most platforms)
   - `CLIENT_URL` (your deployed client URL)
   - `NODE_ENV=production`

2. Make sure the `uploads` directory is writable

3. Deploy using your platform's instructions

### Client Deployment (Vercel, Netlify, GitHub Pages)

1. Set environment variables:
   - `VITE_SOCKET_URL` (your deployed server URL)

2. Build the application:
   ```bash
   npm run build
   ```

3. Deploy the `dist` folder

## 🐛 Troubleshooting

### Connection Issues
- Ensure the server is running on port 5000
- Check that `CLIENT_URL` in server .env matches your client URL
- Verify CORS settings in server.js

### File Upload Issues
- Ensure the `uploads` directory exists in the server folder
- Check file size limits (10MB max)
- Verify file type restrictions

### Notification Issues
- Grant browser notification permissions
- Check browser console for errors
- Ensure notification.mp3 exists in client/public (optional)

## 📝 Assignment Completion Checklist

- [x] Task 1: Project Setup
- [x] Task 2: Core Chat Functionality
- [x] Task 3: Advanced Chat Features
- [x] Task 4: Real-Time Notifications
- [x] Task 5: Performance and UX Optimization

## 🎯 Future Enhancements

- Database integration (MongoDB/PostgreSQL) for message persistence
- User authentication with JWT
- Message encryption
- Voice and video calls
- Screen sharing
- Message editing and deletion
- User profiles and avatars
- Emoji picker
- Message threads/replies
- Bot integration
- Analytics and message statistics

## 📚 Resources

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Building a Chat Application with Socket.io](https://socket.io/get-started/chat)

## 📄 License

This project is part of a learning assignment and is for educational purposes.

## 👤 Author

Created as part of the MERN Full Stack Development program.

---

**Note**: This application uses in-memory storage. Messages and user data are not persisted between server restarts. For production use, integrate a database.
