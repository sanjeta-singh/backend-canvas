const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const { OpenAI } = require('openai');


// Load environment variables from .env file
dotenv.config();

if (!process.env.MONGO_URI || !process.env.AZURE_STORAGE_CONNECTION_STRING || !process.env.AZURE_CONTAINER_NAME) {
    console.error("❌ Missing required environment variables. Check your .env file.");
    process.exit(1);
}

const app = express();
app.use(cors({ origin: 'http://localhost:3000' })); // Allow frontend access
app.use(express.json());

// Constants
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

// Database connection
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Multer setup for file uploads (stores files in memory as buffer)
const upload = multer({ storage: multer.memoryStorage() });

// Azure Blob Storage setup
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);

// ✅ Route: Upload Image to Azure Blob Storage
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const blobName = `${Date.now()}-${req.file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Upload file buffer to Azure
        await blockBlobClient.uploadData(req.file.buffer, {
            blobHTTPHeaders: { blobContentType: req.file.mimetype },
        });

        const imageUrl = blockBlobClient.url;
        res.json({ message: "Upload successful", imageUrl });
    } catch (error) {
        console.error("❌ Upload error:", error.message);
        res.status(500).json({ error: "Failed to upload image" });
    }
});

// ✅ Route: Fetch Images from Azure Blob Storage
app.get('/api/gallery', async (req, res) => {
    try {
        let imageUrls = [];
        for await (const blob of containerClient.listBlobsFlat()) {
            const blobUrl = `${containerClient.url}/${blob.name}`;
            imageUrls.push({ imageUrl: blobUrl });
        }
        res.json({ images: imageUrls });
    } catch (error) {
        console.error("❌ Error fetching images:", error.message);
        res.status(500).json({ error: "Failed to retrieve images" });
    }
});

// ✅ Authentication Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// ✅ Fundraiser Routes
const fundraiserRoutes = require('./routes/fundraiser');
app.use('/api/fundraiser', fundraiserRoutes);  // Add fundraiser routes

// ✅ Dashboard Routes
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);

// ✅ NEW: ChatGPT Route
const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1", // Important!
  });
  

app.post("/api/chat", async (req, res) => {
    const { message } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: message }
            ]
        });

        res.json({ reply: response.choices[0].message.content });
    } catch (err) {
        console.error("❌ OpenAI Error:", err.message);
        res.status(500).json({ error: "Something went wrong with OpenAI" });
    }
});

// Start the server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));



