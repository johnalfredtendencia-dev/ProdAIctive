# Quick Reference: Supabase vs Custom Backend

## 🎯 Decision Matrix

| Feature | Supabase | Custom Backend |
|---------|----------|----------------|
| **Infrastructure** | ☁️ Managed (Zero ops) | 🖥️ You manage servers |
| **Database** | PostgreSQL + Auth | MongoDB/PostgreSQL of choice |
| **Cost** | Free tier very generous | Pay per server usage |
| **Setup Time** | 15 minutes | 1-2 hours |
| **Scaling** | Automatic | Manual |
| **RLS** | Built-in | You implement |
| **Best For** | Mobile apps, MVPs | Full control, complex logic |

## 📝 Current Setup

**Frontend**: Expo/React Native ✅
**Git**: GitHub repository configured ✅
**Authentication**: Google OAuth ready ✅
**API Client**: Ready for either backend ✅

**Backend Status**:
- Custom backend: Implemented at `backend/` directory
- Supabase integration: Ready to use `services/supabaseApi.ts`

## 🚀 To Go Live with Supabase (5 Steps)

```bash
# 1. Get Supabase credentials
# → Go to https://supabase.com/dashboard/project/ubndjsgzpkgtusevrksf
# → Copy API URL and anon key from Settings > API

# 2. Create tables
# → Open SQL Editor
# → Paste SQL from SUPABASE_SETUP.md
# → Run it

# 3. Enable RLS
# → Paste RLS policies from SUPABASE_SETUP.md
# → Verify all tables have RLS enabled

# 4. Add environment variables
echo "EXPO_PUBLIC_SUPABASE_URL=https://ubndjsgzpkgtusevrksf.supabase.co" > .env.local
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here" >> .env.local

# 5. Install Supabase client
npm install @supabase/supabase-js

# 6. Restart dev server and test
npx expo start
```

## 🚀 To Go Live with Custom Backend (5 Steps)

```bash
# 1. Set up MongoDB Atlas
# → Create cluster at https://www.mongodb.com/cloud/atlas
# → Get connection string

# 2. Deploy backend (use Railway, Heroku, or your server)
cd backend
npm install
npm start

# 3. Update API endpoint
# → Edit constants/api.ts
# → Change API_BASE_URL to your deployed backend URL

# 4. Test connection
curl https://your-backend-url/api/health

# 5. Build and deploy frontend
eas build:configure
eas build --platform ios
eas build --platform android
```

## 📂 Files You Need to Update

### For Supabase Migration
```
✅ services/supabaseApi.ts        (Ready - just use it)
📝 services/index.ts              (Change export to use supabaseApi.ts)
📝 app/login.tsx                  (Minor updates to auth flow)
📝 .env.local                     (Add Supabase credentials)
```

### For Custom Backend
```
✅ backend/server.js              (Ready - just deploy)
📝 services/index.ts              (No change needed)
📝 constants/api.ts               (Update API_BASE_URL)
📝 .env                           (MongoDB connection)
```

## 🔄 Switching Between Backends

### Use Supabase
```typescript
// services/index.ts
export { authAPI, taskAPI, focusAPI, chatAPI } from './supabaseApi';
```

### Use Custom Backend
```typescript
// services/index.ts
export { authAPI, taskAPI, focusAPI, chatAPI } from './api';
```

Just one line change! Both APIs have the same interface.

## 📊 Database Schema Comparison

### User Authentication
- **Supabase**: Built-in `auth.users` table + `users` table for profiles
- **Custom**: `User` model in MongoDB with password hashing

### Tasks
- **Supabase**: `tasks` table (PostgreSQL)
- **Custom**: `Task` collection (MongoDB)

### Focus Sessions
- **Supabase**: `focus_sessions` table
- **Custom**: `FocusSession` collection

### Chat
- **Supabase**: `chat_sessions` + `chat_messages` tables
- **Custom**: `ChatSession` collection with nested messages

## 🔐 Security Checklist

### Supabase
- ✅ RLS policies enabled (SQL provided)
- ✅ Google OAuth configured in Supabase
- ✅ JWT tokens from Supabase auth
- ✅ API keys stored in env variables

### Custom Backend
- ✅ Password hashing with bcryptjs
- ✅ JWT middleware on all protected routes
- ✅ CORS configured
- ✅ Environment variables for secrets

## 🧪 Quick Test

### Test Supabase Connection
```typescript
import { supabase } from '@/services/supabaseApi';

const test = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('count()', { count: 'exact', head: true });
  
  if (error) console.error('❌ Failed:', error);
  else console.log('✅ Connected!');
};
```

### Test Custom Backend
```typescript
import axios from 'axios';

const test = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Backend healthy:', response.data);
  } catch (error) {
    console.error('❌ Backend error:', error);
  }
};
```

## 📚 Documentation Map

| Document | Purpose | When to Read |
|----------|---------|---|
| **README.md** | Project overview | Start here |
| **SUPABASE_SETUP.md** | Supabase configuration | If using Supabase |
| **SUPABASE_MIGRATION_CHECKLIST.md** | Migration tracking | During Supabase setup |
| **BACKEND_SETUP.md** | Custom backend setup | If using Node.js backend |
| **ARCHITECTURE_GUIDE.md** | System design | Understanding overall structure |
| **IMPLEMENTATION_CHECKLIST.md** | Feature implementation | Feature development |

## 🎯 Recommended Path

### For MVP/Testing (Recommended)
1. ✅ GitHub push (authenticate with PAT)
2. ✅ Create Supabase tables (5 min)
3. ✅ Enable RLS policies (2 min)
4. ✅ Get API keys (1 min)
5. ✅ Install @supabase/supabase-js
6. 🔄 Update components to use Supabase auth
7. 🔄 Build and deploy to Expo EAS

**Time to production**: ~1 hour

### For Full Control (Advanced)
1. ✅ GitHub push (authenticate with PAT)
2. ✅ Deploy backend to Railway/Heroku
3. ✅ Update API endpoint in constants
4. ✅ Get MongoDB Atlas connection string
5. 🔄 Test backend endpoints
6. 🔄 Build and deploy to Expo EAS

**Time to production**: ~2-3 hours

## 🆘 Common Issues

**"Supabase not connecting"**
→ Check env vars start with `EXPO_PUBLIC_`
→ Restart dev server after `.env.local` changes

**"RLS blocking requests"**
→ Check you're authenticated
→ Run RLS SQL policies
→ Check Supabase logs

**"Backend 500 errors"**
→ Check MongoDB connection string
→ Verify .env file loaded
→ Check console logs

**"Auth not working"**
→ Verify Google OAuth credentials
→ Ensure scopes configured
→ Check redirect URLs match

## 📞 Next Steps

1. **Immediately**: Authenticate GitHub push (need PAT)
2. **Then**: Choose backend (Supabase recommended)
3. **Then**: Set up chosen backend
4. **Finally**: Build and deploy to Expo EAS

**Questions?** Check the detailed docs in `SUPABASE_SETUP.md` or `BACKEND_SETUP.md`
