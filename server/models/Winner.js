const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  draw_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Draw',
    required: true
  },
  match_count: {
    type: Number,
    required: true,
    min: 3,
    max: 5
  },
  matched_numbers: {
    type: [Number]
  },
  prize_tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold'],
    // bronze = 3 match, silver = 4 match, gold = 5 match
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'paid'],
    default: 'pending'
  },
  prize_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  proof_url: {
    type: String,
    default: ''
  },
  proof_note: {
    type: String,
    default: ''
  },
  verification_status: {
    type: String,
    enum: ['not_submitted', 'submitted', 'approved', 'rejected'],
    default: 'not_submitted'
  },
  admin_review_note: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Winner', winnerSchema);
