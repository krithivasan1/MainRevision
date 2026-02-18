# Word Editor & Revision Tool

A web-based word editor with revision tracking. Content is stored on the server and accessible from any device.

## Features
- Rich text editor supporting text and images
- Copy-paste from MS Word with images
- Revision view to review and delete content line by line
- Persistent storage across all devices

## Deploy to Render.com (Free - Step by Step)

### Step 1: Push to GitHub
```cmd
git add .
git commit -m "Add word editor app"
git push origin main
```

### Step 2: Deploy on Render
1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Click "Connect account" to link GitHub
4. Select your repository
5. Configure:
   - Name: word-editor (or any name)
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Click "Create Web Service"
7. Wait 2-3 minutes for deployment
8. Your public URL will be: `https://word-editor-xxxx.onrender.com`

### Alternative: Railway.app
1. Go to https://railway.app
2. Click "Start a New Project" → "Deploy from GitHub"
3. Select your repo
4. Railway auto-deploys
5. Click "Generate Domain" to get public URL

## Local Development
```cmd
node server.js
```
Visit http://localhost:3000

## Important Notes
- GitHub Pages DOES NOT work for this app (no backend support)
- You MUST use Render, Railway, or similar Node.js hosting
- Content persists on the server's file system
- Free tier may sleep after inactivity (wakes up on first request)

## API Endpoints
- GET `/api/content` - Retrieve stored content
- POST `/api/content` - Save content
