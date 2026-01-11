# Backend Setup Guide for ProdAIctive

## Overview

Your ProdAIctive app now has a complete Node.js/Express backend with MongoDB integration. This guide will walk you through setting everything up.

## Project Structure

```
ProdAIctive/
├── app/                          # React Native/Expo frontend
├── components/                   # React components
├── services/                     # API service layer
│   └── api.ts                   # API client configuration (NEWLY ADDED)
├── constants/                    # App constants
│   └── api.ts                   # API endpoints (NEWLY ADDED)
└── backend/                      # Node.js/Express backend (NEWLY ADDED)
    ├── models/                   # MongoDB schemas
    │   ├── User.js
    │   ├── Task.js
    │   ├── FocusSession.js
    │   └── ChatSession.js
    ├── controllers/              # Business logic
    │   ├── authController.js
    │   ├── taskController.js
    │   ├── focusController.js
    │   └── chatController.js
    ├── routes/                   # API routes
    │   ├── auth.js
    │   ├── tasks.js
    │   ├── focus.js
    │   └── chat.js
    ├── middleware/               # Custom middleware
    │   └── auth.js              # JWT verification
    ├── package.json
    ├── server.js                # Main server file
    ├── .env                     # Environment variables
    └── README.md                # Backend documentation
```

## Step-by-Step Setup

### 1. Setup MongoDB

#### Option A: Local MongoDB
```bash
# Install MongoDB Community Edition from:
# https://www.mongodb.com/try/download/community

# Start MongoDB service
# Windows: mongod service should auto-start
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

#### Option B: MongoDB Atlas (Cloud - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster
4. Under "Security" → "Database Access", create a user
5. Under "Network Access", add your IP address (or 0.0.0.0 for development)
6. Go to "Clusters" and click "Connect"
7. Copy the connection string
8. Update your backend `.env` file:

```env
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/prodaictive?retryWrites=true&w=majority
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Update .env file with your configuration
# Edit .env and replace:
# - MONGODB_URI with your MongoDB connection string
# - JWT_SECRET with a secure random string
# - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET with your Google OAuth credentials
```

### 3. Start Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# Or production mode
npm start
```

You should see:
```
MongoDB connected
Server running on port 5000
```

### 4. Configure Frontend

#### Update .env.local or create app.json
```json
{
  "expo": {
    "plugins": [
      ["expo-secure-store"]
    ],
    "extra": {
      "apiUrl": "http://192.168.1.X:5000/api"
    }
  }
}
```

> **Important**: Replace `192.168.1.X` with your computer's local IP address (not localhost). To find it:
> - Windows: `ipconfig` (look for IPv4 Address)
> - macOS/Linux: `ifconfig` (look for inet)

## Integration Examples

### Update Login Screen

Replace the current `handleLogin` function in `app/login.tsx`:

```typescript
import { authAPI } from '../services/api';

const handleLogin = async () => {
    setError('');
    if (!email || !password) {
        setError('Please fill in all fields.');
        return;
    }

    try {
        const response = await authAPI.login(email, password);
        if (response.success) {
            // Save token securely
            await authAPI.saveToken(response.token);
            
            // Navigate to dashboard
            router.replace({
                pathname: '/(tabs)',
                params: { fullName: response.user.fullName }
            });
        } else {
            setError(response.message);
        }
    } catch (error: any) {
        setError(error.response?.data?.message || 'Login failed');
    }
};
```

### Update Signup Screen

```typescript
import { authAPI } from '../services/api';

const handleSignUp = async () => {
    try {
        const response = await authAPI.register(fullName, email, password);
        if (response.success) {
            await authAPI.saveToken(response.token);
            router.replace({
                pathname: '/(tabs)',
                params: { fullName: response.user.fullName }
            });
        }
    } catch (error: any) {
        setError(error.response?.data?.message || 'Registration failed');
    }
};
```

### Update Tasks Page

```typescript
import { taskAPI } from '../services/api';

const loadTasks = async () => {
    try {
        const response = await taskAPI.getTasks();
        if (response.success) {
            setTasks(response.tasks);
        }
    } catch (error) {
        console.error('Failed to load tasks:', error);
    }
};

const handleToggleComplete = async (id: string) => {
    try {
        const task = tasks.find(t => t.id === id);
        await taskAPI.updateTask(id, { completed: !task?.completed });
        
        // Update local state
        setTasks(tasks.map(t => 
            t.id === id ? { ...t, completed: !t.completed } : t
        ));
    } catch (error) {
        console.error('Failed to update task:', error);
    }
};
```

### Update ChatBot Component

```typescript
import { chatAPI } from '../services/api';

// In your ChatBot component's handleSendMessage:
const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Save user message
    await chatAPI.addMessage(inputText, 'user');

    // Get bot response (implement your AI logic here)
    const botResponse = generateBotResponse(inputText);
    await chatAPI.addMessage(botResponse, 'bot');
};
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials:
   - Type: "Native application" or "Mobile app"
   - Download the credentials JSON
5. Update `.env` in backend:
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

## Testing the API

### Using Thunder Client or Postman

1. **Register User**
```
POST http://localhost:5000/api/auth/register
Body:
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

2. **Login User**
```
POST http://localhost:5000/api/auth/register
Body:
{
  "email": "john@example.com",
  "password": "password123"
}
```

3. **Get Tasks** (with token)
```
GET http://localhost:5000/api/tasks
Authorization: Bearer {token_from_login}
```

## Common Issues & Solutions

### "Cannot reach MongoDB"
- Ensure MongoDB is running
- Check connection string in `.env`
- For Atlas: Verify IP whitelist includes your IP

### "Port 5000 already in use"
- Change PORT in `.env` to 5001 or another free port
- Or kill the process using the port

### "CORS error from frontend"
- Ensure backend has `cors()` middleware (it does)
- Check API URL is correct in frontend

### "Token invalid/expired"
- Clear token: `await SecureStore.deleteItemAsync('authToken')`
- Login again to get new token

### Frontend can't reach backend
- Use your computer's local IP (not localhost)
- Check both frontend and backend are running
- Verify no firewall blocking port 5000

## Environment Variables Reference

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/prodaictive
PORT=5000
JWT_SECRET=generate_a_secure_random_string_here
NODE_ENV=development
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Frontend (app.json extra)
```json
{
  "apiUrl": "http://192.168.1.X:5000/api"
}
```

## Next Steps

1. **Setup Database**: Follow MongoDB setup instructions above
2. **Start Backend**: `cd backend && npm run dev`
3. **Update Frontend**: Integrate API calls as shown above
4. **Test API**: Use Postman/Thunder Client to verify endpoints
5. **Deploy**: When ready, deploy backend to cloud (Heroku, AWS, Vercel, etc.)

## Deployment

### Deploy Backend to Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create prodaictive-api`
4. Set environment variables: `heroku config:set JWT_SECRET=xxx MONGODB_URI=xxx`
5. Deploy: `git push heroku main`

### Deploy to Vercel (Serverless)

1. Create API routes in `vercel.json`
2. Update `.env.production` with production URLs
3. Run: `vercel deploy`

## Support & Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [Expo Documentation](https://docs.expo.dev/)

Enjoy building your ProdAIctive app! 🚀
