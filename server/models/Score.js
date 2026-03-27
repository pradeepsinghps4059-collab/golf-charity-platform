const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [1, 'Score must be at least 1'],
    max: [45, 'Score cannot exceed 45']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
scoreSchema.index({ user_id: 1, date: -1 });

module.exports = mongoose.model('Score', scoreSchema);
