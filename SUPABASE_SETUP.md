# Supabase Setup & Migration Guide

## Overview
This guide walks you through setting up Supabase for ProdAIctive and migrating from the custom Node.js backend to Supabase's managed PostgreSQL database.

## Step 1: Get Your Supabase API Keys

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/ubndjsgzpkgtusevrksf/settings/api
2. Under **Project API Keys**, copy:
   - **Project URL** (looks like: `https://ubndjsgzpkgtusevrksf.supabase.co`)
   - **anon public key** (use this for client-side)
   - **service_role key** (use only on server-side, keep secret)

## Step 2: Create Database Tables

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy and paste the SQL script below:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase auth handles auth, but we store extra profile data)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'Medium',
  is_completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Focus Sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  duration INTEGER NOT NULL,
  break_duration INTEGER DEFAULT 0,
  sessions_completed INTEGER DEFAULT 1,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'Chat Session',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sender VARCHAR(20) DEFAULT 'user',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
```

4. Click **Run** to execute

## Step 3: Enable Row-Level Security (RLS)

RLS ensures users can only access their own data. Run this SQL:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users table: Users can only read their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Tasks table: Users can only access their own tasks
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Focus Sessions table
CREATE POLICY "Users can view their own focus sessions" ON focus_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create focus sessions" ON focus_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus sessions" ON focus_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus sessions" ON focus_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Chat Sessions table
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" ON chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions" ON chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Chat Messages table: Allow access through chat_sessions RLS
CREATE POLICY "Users can view messages from their sessions" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their sessions" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their sessions" ON chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );
```

## Step 4: Setup Google OAuth in Supabase

1. Go to **Authentication** > **Providers** in Supabase dashboard
2. Click **Google**
3. Toggle **Enabled** ON
4. Add your Google OAuth credentials (from Firebase Console or Google Cloud Console):
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
5. Click **Save**

## Step 5: Install Supabase Client in Frontend

```bash
npm install @supabase/supabase-js
```

## Step 6: Configure Environment Variables

1. Create `.env.local` in your frontend root (this file is git-ignored):

```env
EXPO_PUBLIC_SUPABASE_URL=https://ubndjsgzpkgtusevrksf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Replace `your_anon_key_here` with your actual anon key from Step 1

## Step 7: Update Frontend API Service

The Supabase API service is ready to use! In your code, you have two options:

### Option A: Use Supabase Backend (Recommended)

Update `services/index.ts`:

```typescript
// Use Supabase backend
export { authAPI, taskAPI, focusAPI, chatAPI } from './supabaseApi';
```

### Option B: Keep Custom Backend

Keep using the existing `services/api.ts` which uses your Node.js backend:

```typescript
// Use custom backend
export { authAPI, taskAPI, focusAPI, chatAPI } from './api';
```

## Step 8: Update Login Component

Your login component is already set up! Just update it to work with Supabase auth:

```typescript
import { authAPI } from '@/services/supabaseApi';

// Email login
const handleEmailLogin = async () => {
  const result = await authAPI.login(email, password);
  if (result.success) {
    // Navigate to dashboard
    router.push('/(tabs)');
  }
};

// Google login
const loginWithGoogle = async () => {
  const result = await authAPI.googleLogin(googleToken);
  if (result.success) {
    router.push('/(tabs)');
  }
};
```

## Step 9: Test the Connection

Create a test file `test-supabase.ts`:

```typescript
import { supabase } from '@/services/supabaseApi';

export async function testSupabaseConnection() {
  try {
    // Test 1: Check Supabase connection
    const { data, error } = await supabase
      .from('users')
      .select('count()', { count: 'exact', head: true });

    if (error) throw error;
    console.log('✅ Supabase connection successful');

    // Test 2: Test auth
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError) console.log('User not authenticated (expected)');
    else console.log('✅ Auth test passed, user:', user);

    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}
```

Run it in your app to verify everything works!

## Step 10: Deploy to Expo EAS (Optional)

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

## Troubleshooting

### API keys not loading
- Make sure env vars have `EXPO_PUBLIC_` prefix
- Restart Expo dev server after changing `.env.local`
- Check that your `.env.local` is in the project root, not in a subdirectory

### RLS blocking requests
- Check Supabase logs in **Settings** > **Database** > **Logs**
- Ensure you're authenticated before making requests
- Verify RLS policies match your auth ID

### Auth not working
- Verify Google OAuth credentials in Supabase
- Check that redirect URL is configured correctly
- Ensure `@supabase/supabase-js` is latest version

### Connection timeout
- Check your internet connection
- Verify Supabase project is not on free tier with all resources exhausted
- Check Supabase status page: https://status.supabase.com

## Next Steps

1. ✅ Create Supabase tables (SQL script above)
2. ✅ Enable RLS policies
3. ✅ Setup Google OAuth
4. ✅ Get API keys
5. ✅ Install Supabase client
6. ✅ Configure environment variables
7. 🔄 Switch to Supabase API service
8. 🔄 Update components to use Supabase auth
9. 🔄 Test connection
10. 🔄 Deploy to Expo EAS

## Resource Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ubndjsgzpkgtusevrksf
- **Supabase Docs**: https://supabase.com/docs
- **JavaScript Client Docs**: https://supabase.com/docs/reference/javascript
- **Authentication Docs**: https://supabase.com/docs/guides/auth
- **RLS Docs**: https://supabase.com/docs/guides/auth/row-level-security
