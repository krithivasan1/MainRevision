require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'wordeditor';
const COLLECTION_NAME = 'content';
const DATA_FILE = path.join(__dirname, 'content.json');

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json'
};

let db;
let collection;
let useFileStorage = false;

// Connect to MongoDB
async function connectDB() {
    console.log('MONGODB_URI exists:', !!MONGODB_URI);
    console.log('MONGODB_URI value:', MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'undefined');
    
    if (!MONGODB_URI || MONGODB_URI === '' || MONGODB_URI === 'undefined') {
        console.log('⚠️  No MongoDB URI provided, using file storage');
        useFileStorage = true;
        initFileStorage();
        return;
    }

    try {
        console.log('🔄 Attempting to connect to MongoDB Atlas...');
        const client = new MongoClient(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000
        });
        
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        
        db = client.db(DB_NAME);
        collection = db.collection(COLLECTION_NAME);
        console.log('✅ Successfully connected to MongoDB');
        
        // Initialize with empty content if collection is empty
        const count = await collection.countDocuments();
        if (count === 0) {
            await collection.insertOne({ _id: 'main', content: [] });
        }
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        console.log('⚠️  Falling back to file storage');
        useFileStorage = true;
        initFileStorage();
    }
}

function initFileStorage() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ content: [] }));
    }
}

async function loadContent() {
    if (useFileStorage) {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            return { content: [] };
        }
    }
    
    try {
        const doc = await collection.findOne({ _id: 'main' });
        return doc ? { content: doc.content } : { content: [] };
    } catch (err) {
        console.error('Error loading content:', err);
        return { content: [] };
    }
}

async function saveContent(content) {
    if (useFileStorage) {
        try {
            fs.writeFileSync(DATA_FILE, JSON.stringify({ content }, null, 2));
        } catch (err) {
            console.error('Error saving to file:', err);
            throw err;
        }
        return;
    }
    
    try {
        await collection.updateOne(
            { _id: 'main' },
            { $set: { content: content } },
            { upsert: true }
        );
    } catch (err) {
        console.error('Error saving content:', err);
        throw err;
    }
}

const server = http.createServer(async (req, res) => {
    // API endpoints
    if (req.url === '/api/content' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const data = await loadContent();
        res.end(JSON.stringify(data));
        return;
    }
    
    if (req.url === '/api/content' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                await saveContent(data.content);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }
    
    // Serve static files
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

// Start server after DB connection
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}/`);
        console.log(`📦 Storage mode: ${useFileStorage ? 'File Storage' : 'MongoDB'}`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
