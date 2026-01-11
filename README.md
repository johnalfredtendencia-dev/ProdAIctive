# ProdAIctive 🎯

Your AI-powered productivity companion. Track tasks, maintain focus, and achieve your goals with intelligent insights.

## 📋 Features

- **Smart Task Management**: Create, organize, and track your daily tasks
- **Focus Sessions**: Pomodoro-style focus tracking with break management
- **AI Assistant**: Chat with your productivity assistant for tips and motivation
- **Google Authentication**: Secure login with your Google account
- **Real-time Sync**: All your data synced across devices via Supabase

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Supabase (see `SUPABASE_SETUP.md` for detailed instructions):
   ```bash
   cp .env.supabase.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Open in simulator:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## 📱 Project Structure

```
ProdAIctive/
├── app/                    # App screens and navigation
│   ├── (tabs)/            # Tab navigation
│   ├── login.tsx          # Authentication
│   ├── onboarding.tsx     # Welcome flow
│   └── _layout.tsx        # Navigation setup
├── components/            # Reusable UI components
├── services/              # API clients
│   ├── api.ts            # Custom backend API
│   └── supabaseApi.ts    # Supabase backend API
├── constants/             # App configuration
├── hooks/                 # Custom React hooks
└── backend/              # Node.js/Express server (optional)
```

## 🔧 Backend Options

### Option 1: Supabase (Recommended) ⭐
- Zero-infrastructure database and auth
- Built-in Row-Level Security
- Automatic scaling
- Free tier includes generous limits

**Setup**: See `SUPABASE_SETUP.md`

### Option 2: Custom Node.js Backend
- Full control and flexibility
- Deploy to Heroku, Railway, or any Node host
- Includes MongoDB integration

**Setup**: See `BACKEND_SETUP.md` and run:
```bash
cd backend
npm install
npm start
```

## 🔐 Authentication

### Google OAuth
1. Get Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)
2. Add them to your Supabase or custom backend config
3. Users can sign up and login with Google

### Email/Password
- Secure password hashing (bcryptjs)
- JWT token authentication
- Automatic token refresh

## 📚 Documentation

- **`SUPABASE_SETUP.md`** - Complete Supabase setup guide with SQL schemas
- **`SUPABASE_MIGRATION_CHECKLIST.md`** - Step-by-step migration checklist
- **`BACKEND_SETUP.md`** - Custom Node.js backend setup
- **`ARCHITECTURE_GUIDE.md`** - System design and architecture
- **`IMPLEMENTATION_CHECKLIST.md`** - Feature implementation guide

## 🧪 Testing

### Test Supabase Connection
```bash
npx expo start
# Press `s` to send test notifications
```

Or create a test file:
```typescript
import { supabase } from '@/services/supabaseApi';

const result = await supabase.from('users').select('count()');
console.log('✅ Connection successful');
```

## 🚢 Deployment

### Build with Expo EAS
```bash
# Setup EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

See `SUPABASE_SETUP.md` Step 10 for detailed deployment instructions.

## 📊 Tech Stack

### Frontend
- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based)
- **UI**: Custom components with Tailwind-like styling
- **State**: React hooks
- **Storage**: Expo SecureStore (tokens)
- **HTTP**: axios with interceptors

### Backend (Choose One)
- **Supabase** (Recommended): PostgreSQL + Auth + RLS
- **Node.js**: Express + MongoDB + JWT
- **Authentication**: Google OAuth + JWT tokens

### Database
- **Supabase**: PostgreSQL with RLS policies
- **Custom Backend**: MongoDB Atlas or local MongoDB

## 🔑 Environment Variables

### Frontend (.env.local)
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Backend (.env)
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
PORT=5000
```

## 🛠️ Development

### Run Linter
```bash
npx eslint .
```

### Type Check
```bash
tsc --noEmit
```

### View Logs
```bash
npx expo start --clear
```

## 🐛 Troubleshooting

### Supabase not connecting?
- Check env variables have `EXPO_PUBLIC_` prefix
- Restart dev server after changing `.env.local`
- Verify API keys are correct

### Auth not working?
- Ensure Google OAuth is enabled in Supabase
- Check that credentials are valid
- Verify RLS policies are correct

### Tasks not loading?
- Check Supabase logs in dashboard
- Verify user is authenticated
- Ensure RLS policies allow access

See `SUPABASE_SETUP.md` Troubleshooting section for more help.

## 📖 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and create a Pull Request

## 📄 License

MIT License - feel free to use this project!

## 💬 Support

- 📖 Check documentation files
- 🐛 Open an issue on GitHub
- 💬 Join Expo Discord: https://chat.expo.dev

---

**Made with ❤️ for productive humans**
