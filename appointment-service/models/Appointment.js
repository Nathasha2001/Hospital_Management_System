const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  patientId: {
    type: Number,
    required: true
  },
  doctorId: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
