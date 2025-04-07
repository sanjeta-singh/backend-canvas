const mongoose = require('mongoose');

const fundraiserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    hospital: { type: String, required: true },
    amount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Fundraiser = mongoose.model('Fundraiser', fundraiserSchema);

module.exports = Fundraiser;

