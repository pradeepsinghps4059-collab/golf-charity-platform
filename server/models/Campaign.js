const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Campaign slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['seasonal', 'partner', 'charity', 'acquisition'],
    default: 'seasonal'
  },
  country_codes: {
    type: [String],
    default: ['IN']
  },
  currency: {
    type: String,
    uppercase: true,
    trim: true,
    default: 'INR'
  },
  starts_at: {
    type: Date,
    default: null
  },
  ends_at: {
    type: Date,
    default: null
  },
  featured: {
    type: Boolean,
    default: false
  },
  donation_multiplier: {
    type: Number,
    min: 0,
    default: 1
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Campaign', campaignSchema);
