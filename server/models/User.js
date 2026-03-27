const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
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
  preferred_currency: {
    type: String,
    uppercase: true,
    trim: true,
    default: 'INR'
  },
  subscription_status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled'],
    default: 'inactive'
  },
  plan: {
    type: String,
    enum: ['monthly', 'yearly', null],
    default: null
  },
  subscription_start: {
    type: Date,
    default: null
  },
  subscription_end: {
    type: Date,
    default: null
  },
  charity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Charity',
    default: null
  },
  charity_percentage: {
    type: Number,
    min: 10,
    max: 100,
    default: 10
  },
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  organization_role: {
    type: String,
    enum: ['owner', 'admin', 'member', null],
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
