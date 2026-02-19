# Quick MongoDB Setup - Fix Content Not Persisting

## Problem
Your content is not persisting across sessions because you're using file storage on Render's free tier, which resets on server restarts.

## Solution: Setup MongoDB Atlas (5 minutes)

### Step 1: Create MongoDB Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google/Email (FREE)
3. Choose "Create a deployment" → FREE (M0)
4. Provider: AWS, Region: Any nearby region
5. Click "Create Deployment"
6. Wait 2-3 minutes

### Step 2: Create Database User
1. You'll see a popup "Create Database User"
2. Username: `wordeditor`
3. Password: Click "Autogenerate Secure Password"
4. **COPY THE PASSWORD** (you won't see it again!)
5. Click "Create Database User"

### Step 3: Setup Network Access (UPDATED UI)

**Option A - During Initial Setup:**
1. You'll see a popup: "Where would you like to connect from?"
2. Look for "Cloud Environment" or "IP Access List"
3. In the IP Address field, enter: `0.0.0.0/0`
4. Description: "Allow all"
5. Click "Add Entry" or "Finish and Close"

**Option B - If you already closed the popup:**
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address" button (green button)
3. You'll see a dialog with options:
   - Either manually enter: `0.0.0.0/0` in the IP Address field
   - Or look for a checkbox/option that says "Allow access from anywhere"
4. Add a comment: "Render deployment"
5. Click "Confirm"
6. Wait 1-2 minutes for changes to take effect

### Step 4: Get Connection String
1. Click "Connect" button on your cluster
2. Choose "Drivers"
3. Copy the connection string (looks like):
```
mongodb+srv://wordeditor:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
4. Replace `<password>` with the password you copied in Step 2

**Example:**
- Password: `Abc123XYZ`
- Final string: `mongodb+srv://wordeditor:Abc123XYZ@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority`

### Step 5: Add to Render
1. Go to your Render dashboard: https://dashboard.render.com
2. Click your web service
3. Click "Environment" tab (left sidebar)
4. Click "Add Environment Variable"
5. Key: `MONGODB_URI`
6. Value: (paste your connection string from Step 4)
7. Click "Save Changes"
8. Render will automatically redeploy (takes 2-3 minutes)

### Step 6: Verify
1. Go to "Logs" tab in Render
2. Look for: `✅ Successfully connected to MongoDB`
3. If you see this, you're done!
4. Your content will now persist forever

## Test It
1. Open your Render URL
2. Add some text
3. Close the browser
4. Open the URL again (even on different device)
5. Content should still be there!

## Troubleshooting

### "Falling back to file storage"
- MongoDB URI not set correctly in Render
- Check Environment tab, make sure MONGODB_URI exists
- Make sure password has no spaces

### "MongoDB connection failed"
- Wrong password in connection string
- IP not whitelisted (use 0.0.0.0/0)
- Wait 2-3 minutes after creating cluster

### Still not working?
- Delete the MONGODB_URI variable in Render
- App will use file storage (but won't persist on restarts)
- Try MongoDB setup again later
