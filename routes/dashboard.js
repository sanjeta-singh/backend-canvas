const express = require('express');
const router = express.Router();
const Dashboard = require('../models/Dashboard');

// Route to add a new patient
router.post('/add', async (req, res) => {
  try {
    const { name, age, hospital, doctor } = req.body;
    const newPatient = new Dashboard({ name, age, hospital, doctor });

    await newPatient.save();
    res.status(201).json({ message: 'Patient added successfully' });
  } catch (error) {
    console.error('Error adding patient:', error.message);
    res.status(500).json({ error: 'Failed to add patient' });
  }
});

// Route to get all patients
router.get('/list', async (req, res) => {
  try {
    const patients = await Dashboard.find();
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error.message);
    res.status(500).json({ error: 'Failed to retrieve patients' });
  }
});

module.exports = router;


