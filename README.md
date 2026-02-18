# Word Editor & Revision Tool

A web-based word editor with revision tracking. Content is stored in MongoDB and accessible from any device (desktop, mobile, tablet).

## Features
- Rich text editor supporting text and images
- Copy-paste from MS Word with images
- Revision view to review and delete content line by line
- MongoDB database for reliable cross-device sync
- Works on desktop and mobile browsers

## Setup MongoDB Atlas (Free Database)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Create a FREE cluster (M0 Sandbox)
4. Choose a cloud provider and region (any)
5. Click "Create Cluster" (takes 3-5 minutes)

### Step 2: Configure Database Access
1. In Atlas, go to "Database Access" (left menu)
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `wordeditor`
5. Password: Click "Autogenerate Secure Password" (COPY THIS!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### Step 3: Configure Network Access
1. Go to "Network Access" (left menu)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Step 4: Get Connection String
1. Go to "Database" (left menu)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://wordeditor:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with the password you copied earlier

## Deploy to Render.com

### Step 1: Push to GitHub
```cmd
git add .
git commit -m "Add MongoDB database"
git push origin main
```

### Step 2: Deploy on Render
1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: `word-editor`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Click "Advanced" → "Add Environment Variable"
6. Add:
   - Key: `MONGODB_URI`
   - Value: (paste your MongoDB connection string from Step 4)
7. Click "Create Web Service"
8. Wait 2-3 minutes for deployment
9. Your public URL: `https://word-editor-xxxx.onrender.com`

## Test on Multiple Devices
1. Open the URL on your desktop browser
2. Add some text and images
3. Open the same URL on your mobile phone
4. You should see the same content!

## Local Development
1. Create `.env` file:
```
MONGODB_URI=mongodb+srv://wordeditor:yourpassword@cluster0.xxxxx.mongodb.net/wordeditor?retryWrites=true&w=majority
PORT=3000
```

2. Install dependencies:
```cmd
npm install
```

3. Run server:
```cmd
node server.js
```

4. Visit http://localhost:3000

## API Endpoints
- GET `/api/content` - Retrieve stored content from MongoDB
- POST `/api/content` - Save content to MongoDB
