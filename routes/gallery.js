const express = require("express");
const multer = require("multer");
const { BlobServiceClient } = require("@azure/storage-blob");
const Gallery = require("../models/Gallery");
require("dotenv").config();

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "artwork-gallery";

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(containerName);

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const blobName = `${Date.now()}-drawing.png`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    const imageUrl = blockBlobClient.url;

    // Save to MongoDB (This creates the `gallery` collection if it doesn't exist)
    const newImage = new Gallery({ imageUrl });
    await newImage.save();

    res.json({ message: "Upload successful", imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

module.exports = router;
