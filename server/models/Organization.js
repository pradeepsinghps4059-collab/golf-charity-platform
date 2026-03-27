const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Organization slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['team', 'corporate'],
    default: 'team'
  },
  country_code: {
    type: String,
    uppercase: true,
    trim: true,
    default: 'IN'
  },
  locale: {
    type: String,
    trim: true,
    default: 'en-IN'
  },
  timezone: {
    type: String,
    trim: true,
    default: 'Asia/Kolkata'
  },
  currency: {
    type: String,
    uppercase: true,
    trim: true,
    default: 'INR'
  },
  owner_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  seat_limit: {
    type: Number,
    min: 1,
    default: 25
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Organization', organizationSchema);
