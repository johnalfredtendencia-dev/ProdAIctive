# ProdAIctive Backend API

A Node.js/Express backend server for the ProdAIctive productivity app, featuring user authentication, task management, focus sessions tracking, and AI chat history.

## Features

- **User Authentication**: Register, login, and Google OAuth integration
- **Task Management**: Create, read, update, and delete tasks
- **Focus Sessions**: Track Pomodoro sessions and productivity metrics
- **Chat History**: Store and manage chat sessions with the AI assistant
- **JWT Authentication**: Secure API endpoints with JWT tokens

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create a `.env` file in the backend directory:
```
MONGODB_URI=mongodb://localhost:27017/prodaictive
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Running the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Google Login
```
POST /api/auth/google-login
Content-Type: application/json

{
  "googleToken": "google_access_token"
}
```

#### Get User Profile
```
GET /api/auth/profile
Authorization: Bearer {token}
```

### Task Routes (`/api/tasks`)

#### Get All Tasks
```
GET /api/tasks
Authorization: Bearer {token}
```

#### Create Task
```
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Complete Math Assignment",
  "description": "Chapter 5-7",
  "priority": "High",
  "subject": "Mathematics",
  "duration": "2 hours",
  "dueDate": "2024-01-15"
}
```

#### Update Task
```
PUT /api/tasks/{taskId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "completed": true,
  "priority": "Medium"
}
```

#### Delete Task
```
DELETE /api/tasks/{taskId}
Authorization: Bearer {token}
```

### Focus Session Routes (`/api/focus`)

#### Create Focus Session
```
POST /api/focus/session
Authorization: Bearer {token}
Content-Type: application/json

{
  "taskId": "optional_task_id",
  "duration": 25,
  "breakDuration": 5,
  "sessionsCompleted": 1
}
```

#### Get All Focus Sessions
```
GET /api/focus/sessions
Authorization: Bearer {token}
```

#### Get Focus Statistics
```
GET /api/focus/statistics
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalSessions": 10,
    "totalFocusTime": 250,
    "totalBreakTime": 50,
    "totalPomodoros": 12,
    "averageSessionDuration": 25
  }
}
```

### Chat Routes (`/api/chat`)

#### Get or Create Chat Session
```
GET /api/chat/session
Authorization: Bearer {token}
```

#### Get All Chat Sessions
```
GET /api/chat/sessions
Authorization: Bearer {token}
```

#### Add Message to Chat
```
POST /api/chat/message
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Hello AI assistant",
  "sender": "user"
}
```

#### Delete Chat Session
```
DELETE /api/chat/session/{sessionId}
Authorization: Bearer {token}
```

## Database Schema

### User
```
{
  fullName: String,
  email: String (unique),
  password: String (hashed),
  googleId: String,
  profilePicture: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Task
```
{
  userId: ObjectId,
  title: String,
  description: String,
  priority: String (Low/Medium/High),
  subject: String,
  completed: Boolean,
  duration: String,
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### FocusSession
```
{
  userId: ObjectId,
  taskId: ObjectId,
  duration: Number (minutes),
  breakDuration: Number (minutes),
  sessionsCompleted: Number,
  completedAt: Date
}
```

### ChatSession
```
{
  userId: ObjectId,
  title: String,
  messages: [
    {
      id: String,
      text: String,
      sender: String (user/bot),
      timestamp: Date
    }
  ],
  createdAt: Date,
  lastUpdated: Date
}
```

## MongoDB Setup

### Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Default connection: `mongodb://localhost:27017/prodaictive`

### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/prodaictive?retryWrites=true&w=majority
```

## Frontend Integration

Update your React Native app to connect to this backend:

```typescript
// constants/api.ts
export const API_URL = 'http://localhost:5000/api';

// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (googleToken) => api.post('/auth/google-login', { googleToken }),
  getProfile: (token) => api.get('/auth/profile', {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

export const taskAPI = {
  getTasks: (token) => api.get('/tasks', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  createTask: (task, token) => api.post('/tasks', task, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateTask: (taskId, updates, token) => api.put(`/tasks/${taskId}`, updates, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  deleteTask: (taskId, token) => api.delete(`/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description here"
}
```

HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Security

- Passwords are hashed using bcryptjs
- JWT tokens expire in 7 days
- All sensitive routes require authentication
- CORS enabled for frontend communication
- Environment variables used for sensitive data

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify database credentials for Atlas

### Port Already in Use
```bash
# Change port in .env
PORT=5001
```

### Token Expired
- Get a new token by logging in again
- Token expires in 7 days

## Future Enhancements

- WebSocket support for real-time chat
- AI integration for smart task suggestions
- Advanced analytics dashboard
- Email notifications
- Mobile push notifications
- Payment integration for premium features

## Support

For issues and questions, please create an issue in the repository.
