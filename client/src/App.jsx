import { useState, useEffect } from 'react';
import { useSocket } from './socket/socket';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import './App.css';

function App() {
  const {
    isConnected,
    currentUser,
    connectionError,
    reconnectAttempt,
    connect,
    disconnect,
    getUnreadCounts,
  } = useSocket();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setIsLoggedIn(true);
      getUnreadCounts();
    }
  }, [currentUser, getUnreadCounts]);

  const handleLogin = (username, avatar) => {
    connect(username, avatar);
  };

  const handleLogout = () => {
    disconnect();
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={handleLogin}
        isConnected={isConnected}
        connectionError={connectionError}
        reconnectAttempt={reconnectAttempt}
      />
    );
  }

  return (
    <div className="app">
      <ChatRoom currentUser={currentUser} onLogout={handleLogout} />
    </div>
  );
}

export default App;

