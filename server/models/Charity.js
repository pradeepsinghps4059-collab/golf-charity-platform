const mongoose = require('mongoose');

const charitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Charity name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    default: 'General'
  },
  country_codes: {
    type: [String],
    default: ['IN']
  },
  default_currency: {
    type: String,
    uppercase: true,
    trim: true,
    default: 'INR'
  },
  image: {
    type: String,
    default: ''
  },
  featured: {
    type: Boolean,
    default: false
  },
  events: {
    type: [{
      title: { type: String, required: true },
      date: { type: Date, required: true },
      location: { type: String, default: '' },
      description: { type: String, default: '' }
    }],
    default: []
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Charity', charitySchema);
