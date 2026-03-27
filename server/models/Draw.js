const mongoose = require('mongoose');

const drawSchema = new mongoose.Schema({
  draw_numbers: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 5;
      },
      message: 'Draw must contain exactly 5 numbers'
    }
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  generation_mode: {
    type: String,
    enum: ['random', 'algorithmic'],
    default: 'random'
  },
  month: {
    type: String // e.g. "2024-01"
  },
  sequence: {
    type: Number,
    default: 1
  },
  gold_winner_count: {
    type: Number,
    default: 0
  },
  winner_count: {
    type: Number,
    default: 0
  },
  jackpot_rollover_eligible: {
    type: Boolean,
    default: false
  },
  prize_pool_total: {
    type: Number,
    default: 0
  },
  bronze_pool_amount: {
    type: Number,
    default: 0
  },
  silver_pool_amount: {
    type: Number,
    default: 0
  },
  gold_pool_amount: {
    type: Number,
    default: 0
  },
  jackpot_rollover_amount: {
    type: Number,
    default: 0
  },
  triggered_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Draw', drawSchema);
