const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
    min: 5,
    max: 15,
  },
  hospital: {
    type: String,
    required: true,
  },
  doctor: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Dashboard', dashboardSchema);
