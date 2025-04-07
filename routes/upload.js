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

// Check if Azure connection string is defined
if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error("Azure Storage connection string is not defined");
}

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Ensure the container exists, create if not
async function createContainerIfNotExists() {
  try {
    const exists = await containerClient.exists();
    if (!exists) {
      await containerClient.create();
      console.log(`Container "${containerName}" created successfully.`);
    } else {
      console.log(`Container "${containerName}" already exists.`);
    }
  } catch (error) {
    console.error("Error checking/creating container:", error.message);
  }
}
createContainerIfNotExists();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const blobName = `${Date.now()}-${req.file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file to Azure Blob Storage
    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    const imageUrl = blockBlobClient.url;
    console.log("Image uploaded successfully:", imageUrl);

    // Save image URL to the database
    const newImage = new Gallery({ imageUrl });
    await newImage.save();

    res.json({ message: "Upload successful", imageUrl });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ error: "Failed to upload image", details: error.message });
  }
});

module.exports = router;
