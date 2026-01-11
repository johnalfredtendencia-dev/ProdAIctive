# Supabase Migration Checklist

Use this checklist to track your migration from custom Node.js backend to Supabase.

## Phase 1: Supabase Setup ✅

- [ ] 1.1 Go to Supabase dashboard and get API keys
- [ ] 1.2 Create all database tables using SQL script
- [ ] 1.3 Enable Row-Level Security policies
- [ ] 1.4 Configure Google OAuth in Supabase dashboard
- [ ] 1.5 Verify tables created with correct schema

**Resources**: See `SUPABASE_SETUP.md` Step 1-4

---

## Phase 2: Frontend Setup 🔄

### Installation
- [ ] 2.1 Install Supabase client: `npm install @supabase/supabase-js`
- [ ] 2.2 Verify installation: `npm list @supabase/supabase-js`

### Configuration
- [ ] 2.3 Create `.env.local` with Supabase API keys
- [ ] 2.4 Add to `.gitignore` (already included):
  ```
  .env.local
  .env.*.local
  ```
- [ ] 2.5 Restart Expo dev server to load env vars

### Code Updates
- [ ] 2.6 `services/supabaseApi.ts` is ready (already created)
- [ ] 2.7 Update `services/index.ts` to export Supabase API:
  ```typescript
  export { authAPI, taskAPI, focusAPI, chatAPI } from './supabaseApi';
  ```

**Resources**: See `SUPABASE_SETUP.md` Step 5-7

---

## Phase 3: Component Migration 🔄

### Login Component (`app/login.tsx`)
- [ ] 3.1 Import Supabase auth functions
- [ ] 3.2 Update email login to use Supabase auth
- [ ] 3.3 Update Google login to use Supabase
- [ ] 3.4 Test login functionality in dev mode

### Dashboard Component (`app/(tabs)/index.tsx`)
- [ ] 3.5 Fetch user data from Supabase
- [ ] 3.6 Ensure tasks load correctly
- [ ] 3.7 Test task operations (create, update, delete)

### Tasks Component (`app/(tabs)/tasks.tsx`)
- [ ] 3.8 Update to use Supabase taskAPI
- [ ] 3.9 Verify all CRUD operations work
- [ ] 3.10 Test filtering and sorting

### Focus Component (`app/(tabs)/focus.tsx`)
- [ ] 3.11 Update to use Supabase focusAPI
- [ ] 3.12 Test session creation and tracking
- [ ] 3.13 Verify statistics calculations

### AI/Chat Component (`app/(tabs)/ai.tsx`)
- [ ] 3.14 Update to use Supabase chatAPI
- [ ] 3.15 Test message sending and receiving
- [ ] 3.16 Verify session management

**Resources**: Update each component file to import from `services/supabaseApi`

---

## Phase 4: Testing 🔄

### Unit Testing
- [ ] 4.1 Test Supabase connection
- [ ] 4.2 Test authentication flows
- [ ] 4.3 Test each API function separately
- [ ] 4.4 Test RLS policies

### Integration Testing
- [ ] 4.5 Test complete user signup flow
- [ ] 4.6 Test task creation → completion flow
- [ ] 4.7 Test focus session tracking
- [ ] 4.8 Test chat messaging

### End-to-End Testing
- [ ] 4.9 Test full app workflow on iOS simulator
- [ ] 4.10 Test full app workflow on Android simulator
- [ ] 4.11 Test on physical device if available
- [ ] 4.12 Test offline functionality (if cached)

**Resources**: Create test file using `test-supabase.ts` template in `SUPABASE_SETUP.md`

---

## Phase 5: Cleanup & Optimization 🔄

### Remove Old Backend (Optional)
- [ ] 5.1 Verify all data migrated to Supabase
- [ ] 5.2 Keep `backend/` directory as backup or delete
- [ ] 5.3 Remove `backend/` from git if not needed:
  ```bash
  git rm -r --cached backend/
  echo "backend/" >> .gitignore
  git add .gitignore
  git commit -m "Remove custom backend, using Supabase"
  ```
- [ ] 5.4 Update README.md to reference Supabase

### Update Documentation
- [ ] 5.5 Update `README.md` with Supabase setup instructions
- [ ] 5.6 Update `ARCHITECTURE_GUIDE.md` with new architecture
- [ ] 5.7 Archive or delete `BACKEND_*.md` files

### Code Quality
- [ ] 5.8 Remove all `api.ts` references (use `supabaseApi.ts` instead)
- [ ] 5.9 Run ESLint: `npx eslint .`
- [ ] 5.10 Fix any TypeScript errors: `tsc --noEmit`

**Resources**: N/A

---

## Phase 6: Deployment 🔄

### Expo EAS Build
- [ ] 6.1 Create EAS account: https://expo.dev
- [ ] 6.2 Link project: `eas build:configure`
- [ ] 6.3 Build for iOS: `eas build --platform ios`
- [ ] 6.4 Build for Android: `eas build --platform android`

### Production Verification
- [ ] 6.5 Test built version on simulator
- [ ] 6.6 Verify Supabase connection in production
- [ ] 6.7 Test all core features work

### App Store Submission (Optional)
- [ ] 6.8 Submit to Apple App Store: `eas submit --platform ios`
- [ ] 6.9 Submit to Google Play Store: `eas submit --platform android`

**Resources**: See `SUPABASE_SETUP.md` Step 10

---

## Phase 7: Post-Deployment 🔄

### Monitoring
- [ ] 7.1 Set up Supabase monitoring/logs
- [ ] 7.2 Monitor database usage
- [ ] 7.3 Monitor API usage

### Maintenance
- [ ] 7.4 Set up automated backups (Supabase does this by default)
- [ ] 7.5 Review and optimize slow queries
- [ ] 7.6 Test disaster recovery procedures

### Documentation
- [ ] 7.7 Document any custom modifications
- [ ] 7.8 Create runbooks for common issues
- [ ] 7.9 Set up team access to Supabase dashboard

**Resources**: Supabase docs: https://supabase.com/docs

---

## Summary

**Estimated Time**: 2-4 hours for complete migration

**Difficulty**: Medium (mainly configuration and testing)

**Risks**: None - can rollback to custom backend at any time

**Benefits**:
- ✅ No server maintenance needed
- ✅ Automatic scaling
- ✅ Built-in auth and RLS
- ✅ Better for mobile apps
- ✅ Generous free tier

---

## Need Help?

- 📚 **Supabase Docs**: https://supabase.com/docs
- 💬 **Supabase Discord**: https://discord.supabase.com
- 🐛 **Report Issues**: https://github.com/supabase/supabase/issues
- 📖 **Setup Guide**: See `SUPABASE_SETUP.md`

---

## Notes

Add any notes or blockers here as you progress through the checklist:

```
[Your notes here]
```
