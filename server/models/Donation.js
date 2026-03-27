const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  charity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Charity',
    required: true
  },
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    uppercase: true,
    default: 'INR'
  },
  country_code: {
    type: String,
    uppercase: true,
    trim: true,
    default: 'IN'
  },
  note: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['recorded'],
    default: 'recorded'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Donation', donationSchema);
