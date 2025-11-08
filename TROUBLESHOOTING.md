# Troubleshooting Guide - Chat Application

## Cannot Join Chat Issue

If you're unable to join the chat, follow these steps:

### 1. Check if Server is Running

**Make sure the server is running:**
```bash
cd server
npm install
npm run dev
```

You should see: `Server running on port 5000`

### 2. Check if Client is Running

**In a separate terminal:**
```bash
cd client
npm install
npm run dev
```

You should see: `Local: http://localhost:5173`

### 3. Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab for errors:

- **Connection Error**: Server might not be running or wrong URL
- **CORS Error**: Check server CORS settings
- **404 Error**: Check if server URL is correct

### 4. Verify Server URL

Check that the client is trying to connect to the correct server:

- Default: `http://localhost:5000`
- Check `client/.env` file for `VITE_SOCKET_URL`
- Check `server/.env` file for `CLIENT_URL` (should be `http://localhost:5173`)

### 5. Check Connection Status

On the login page, you should see:
- ✅ **Connected** - Server is reachable
- ❌ **Disconnected** - Server is not running or unreachable

### 6. Common Issues

#### Issue: Button is disabled
**Solution**: Make sure you've entered a username

#### Issue: "Not connected" status
**Solutions**:
1. Make sure server is running on port 5000
2. Check firewall/antivirus isn't blocking the connection
3. Verify no other application is using port 5000

#### Issue: Connection timeout
**Solutions**:
1. Check server logs for errors
2. Verify CORS settings in `server/server.js`
3. Try restarting both server and client

#### Issue: CORS errors in console
**Solution**: Make sure `CLIENT_URL` in server `.env` matches your client URL

### 7. Test Server Manually

Test if the server is responding:
```bash
curl http://localhost:5000
```

Should return: `Socket.io Chat Server is running`

### 8. Check Port Availability

Make sure ports 5000 (server) and 5173 (client) are not in use:

**Windows:**
```bash
netstat -ano | findstr :5000
netstat -ano | findstr :5173
```

**Mac/Linux:**
```bash
lsof -i :5000
lsof -i :5173
```

### 9. Reset Everything

If nothing works, try:
1. Stop both server and client (Ctrl+C)
2. Delete `node_modules` folders
3. Delete `package-lock.json` files
4. Run `npm install` again in both folders
5. Restart both server and client

### 10. Check Environment Variables

**Server `.env` file:**
```env
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Client `.env` file (optional):**
```env
VITE_SOCKET_URL=http://localhost:5000
```

## Still Having Issues?

1. Check the browser console for detailed error messages
2. Check server terminal for error logs
3. Verify Node.js version (v18+ recommended)
4. Make sure all dependencies are installed correctly

## Quick Fix Checklist

- [ ] Server is running (`npm run dev` in server folder)
- [ ] Client is running (`npm run dev` in client folder)
- [ ] No port conflicts (5000 and 5173 available)
- [ ] Browser console shows no errors
- [ ] Server console shows "Server running on port 5000"
- [ ] Connection status shows "Connected" on login page
- [ ] Username is entered in login form

