# MongoDB Atlas Setup - Detailed Guide

## The SSL Error You're Seeing

The error `tlsv1 alert internal error` usually means:
1. Wrong username/password
2. Special characters in password not URL-encoded
3. IP not whitelisted in MongoDB Atlas
4. Wrong connection string format

## Step-by-Step Fix

### 1. Create New MongoDB User (Fresh Start)

1. Go to https://cloud.mongodb.com
2. Select your cluster
3. Click "Database Access" (left sidebar)
4. Click "ADD NEW DATABASE USER"
5. Authentication Method: Password
6. Username: `wordeditor`
7. Password: Click "Autogenerate Secure Password"
8. **IMPORTANT**: Copy the password immediately - you won't see it again!
9. Database User Privileges: Select "Atlas admin"
10. Click "Add User"

### 2. Whitelist All IPs

1. Click "Network Access" (left sidebar)
2. Click "ADD IP ADDRESS"
3. Click "ALLOW ACCESS FROM ANYWHERE"
4. This adds `0.0.0.0/0`
5. Click "Confirm"
6. Wait 2-3 minutes for changes to propagate

### 3. Get Correct Connection String

1. Go to "Database" (left sidebar)
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Driver: Node.js
5. Version: 5.5 or later
6. Copy the connection string

It should look like:
```
mongodb+srv://wordeditor:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 4. Format Connection String Correctly

Replace `<password>` with your actual password.

**If password has special characters**, URL encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `/` → `%2F`
- `:` → `%3A`
- `=` → `%3D`
- `?` → `%3F`

Example:
- Password: `MyP@ss#123`
- Encoded: `MyP%40ss%23123`
- Full string: `mongodb+srv://wordeditor:MyP%40ss%23123@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### 5. Update Render Environment Variable

1. Go to your Render dashboard
2. Click your web service
3. Go to "Environment" tab
4. Find `MONGODB_URI` or click "Add Environment Variable"
5. Key: `MONGODB_URI`
6. Value: Paste your FULL connection string (with encoded password)
7. Click "Save Changes"
8. Render will automatically redeploy

### 6. Check Logs

After deployment:
1. Go to "Logs" tab in Render
2. Look for: "Successfully connected to MongoDB"
3. If you see "Falling back to file storage", MongoDB connection failed

## Alternative: Use File Storage (Temporary)

The app now has a fallback to file storage if MongoDB fails. This works but:
- ❌ Data may be lost on Render restarts
- ❌ Not reliable for production
- ✅ Good for testing

To use file storage temporarily:
1. Remove the `MONGODB_URI` environment variable in Render
2. The app will automatically use file storage
3. You can fix MongoDB later

## Test MongoDB Connection Locally

Create `.env` file:
```
MONGODB_URI=mongodb+srv://wordeditor:YOUR_ENCODED_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
PORT=3000
```

Run:
```cmd
npm install
node server.js
```

Look for "Successfully connected to MongoDB" in console.

## Still Having Issues?

1. Try creating a completely new cluster in MongoDB Atlas
2. Use a simple password with NO special characters (e.g., `SimplePass123`)
3. Make sure you're using MongoDB Atlas (cloud), not local MongoDB
4. Check MongoDB Atlas status: https://status.mongodb.com/
