# Quick Deploy Guide

## Option 1: Deploy WITHOUT MongoDB (Easiest - Works Immediately)

Your app now works with file storage by default. MongoDB is optional.

### Steps:
1. Push to GitHub:
```cmd
git add .
git commit -m "Deploy with file storage"
git push origin main
```

2. Deploy on Render.com:
   - Go to https://render.com
   - New + → Web Service
   - Connect your GitHub repo
   - Settings:
     - Build Command: `npm install`
     - Start Command: `node server.js`
   - Click "Create Web Service"
   - **DO NOT add MONGODB_URI variable**

3. Done! Your app will use file storage.

⚠️ **Note**: File storage on Render's free tier may reset occasionally. For permanent storage, use MongoDB (Option 2).

---

## Option 2: Deploy WITH MongoDB (Permanent Storage)

### Step 1: Setup MongoDB Atlas
1. Go to https://cloud.mongodb.com/
2. Sign up / Login
3. Create FREE cluster (M0)
4. Wait 3-5 minutes for cluster creation

### Step 2: Create Database User
1. Database Access → ADD NEW DATABASE USER
2. Username: `wordeditor`
3. Password: Use SIMPLE password like `WordEditor123` (no special chars)
4. Privileges: "Atlas admin"
5. Add User

### Step 3: Whitelist IPs
1. Network Access → ADD IP ADDRESS
2. "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0)
3. Confirm
4. Wait 2 minutes

### Step 4: Get Connection String
1. Database → Connect → "Connect your application"
2. Copy the connection string:
```
mongodb+srv://wordeditor:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
3. Replace `<password>` with `WordEditor123` (or your password)

Final string example:
```
mongodb+srv://wordeditor:WordEditor123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

### Step 5: Deploy to Render
1. Go to your Render dashboard
2. Click your web service
3. Environment tab
4. Add Environment Variable:
   - Key: `MONGODB_URI`
   - Value: (paste your full connection string)
5. Save Changes

### Step 6: Check Logs
1. Go to Logs tab
2. Look for: `✅ Successfully connected to MongoDB`
3. If you see `⚠️ Falling back to file storage`, check your connection string

---

## Troubleshooting

### "connect ECONNREFUSED localhost:27017"
- This means MONGODB_URI is not set or is empty
- Check Render Environment variables
- Make sure you saved the variable

### "tlsv1 alert internal error"
- Wrong password in connection string
- Special characters not URL-encoded
- Try simpler password without special characters

### App works but data doesn't persist
- You're using file storage (no MongoDB)
- This is normal on Render free tier
- Add MongoDB for permanent storage

---

## Test Your Deployment

1. Open your Render URL on desktop
2. Add some text and images
3. Refresh the page - content should remain
4. Open same URL on mobile - should see same content
5. If using MongoDB, data persists forever
6. If using file storage, data may reset on app restart
