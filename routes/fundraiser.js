const express = require('express');
const router = express.Router();
const Fundraiser = require('../models/Fundraiser');

// Route to add a new donor
router.post('/add', async (req, res) => {
    try {
        const { name, hospital, amount } = req.body;

        // Create a new donor entry
        const newDonor = new Fundraiser({ name, hospital, amount });
        await newDonor.save();

        res.status(201).json({ message: 'Donor added successfully', donor: newDonor });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add donor', details: error.message });
    }
});

// Route to get all donors
router.get('/all', async (req, res) => {
    try {
        const donors = await Fundraiser.find();
        res.status(200).json(donors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch donors', details: error.message });
    }
});

module.exports = router;
