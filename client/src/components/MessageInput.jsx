import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../socket/socket';
import { FiSend, FiPaperclip, FiImage, FiX } from 'react-icons/fi';
import './MessageInput.css';

const MessageInput = ({ currentRoom }) => {
  const { sendMessage, setTyping, socket } = useSocket();
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    // Emit typing indicator
    setTyping(true, currentRoom);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false, currentRoom);
    }, 2000);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    e.target.value = ''; // Reset input
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      // Use the Vite proxy - it will forward /api to http://localhost:5000
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return {
        url: data.url,
        filename: data.filename,
        size: data.size,
        mimetype: data.mimetype,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() && !selectedFile) return;

    // Stop typing indicator
    setTyping(false, currentRoom);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      let fileData = null;

      if (selectedFile) {
        fileData = await uploadFile(selectedFile);
      }

      sendMessage(message.trim() || null, currentRoom, fileData);
      setMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      {selectedFile && (
        <div className="file-preview-bar">
          <div className="file-info">
            {selectedFile.type.startsWith('image/') ? (
              <FiImage className="file-icon" />
            ) : (
              <FiPaperclip className="file-icon" />
            )}
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            className="btn-remove-file"
            onClick={removeFile}
            title="Remove file"
          >
            <FiX />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-container">
          <button
            type="button"
            className="btn-attach"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            disabled={uploading}
          >
            <FiPaperclip />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={
              uploading
                ? 'Uploading file...'
                : 'Type a message... (Press Enter to send, Shift+Enter for new line)'
            }
            className="message-textarea"
            rows={1}
            disabled={uploading}
          />

          <button
            type="submit"
            className="btn-send"
            disabled={(!message.trim() && !selectedFile) || uploading}
            title="Send message"
          >
            <FiSend />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;

