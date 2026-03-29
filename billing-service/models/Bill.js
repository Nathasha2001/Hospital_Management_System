const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  patientId: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bill', billSchema);
