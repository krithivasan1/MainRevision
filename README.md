# Word Editor & Revision Tool

A web-based word editor with revision tracking. Content is stored on the server and accessible from any device.

## Features
- Rich text editor supporting text and images
- Copy-paste from MS Word with images
- Revision view to review and delete content line by line
- Persistent storage across all devices

## Deploy to Cloud (with persistent storage)

### Option 1: Render.com (Free - Recommended)
1. Create account at https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo or upload files
4. Settings:
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Deploy - you'll get a public URL like `https://your-app.onrender.com`

### Option 2: Railway.app (Free tier)
1. Go to https://railway.app
2. Click "Start a New Project" → "Deploy from GitHub"
3. Select your repo
4. Railway auto-detects Node.js and deploys
5. Get public URL

### Option 3: Heroku
```cmd
heroku create your-app-name
git push heroku main
```

## Local Development
```cmd
node server.js
```
Visit http://localhost:3000

## API Endpoints
- GET `/api/content` - Retrieve stored content
- POST `/api/content` - Save content
