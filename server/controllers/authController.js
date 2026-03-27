const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Charity = require('../models/Charity');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'golf_charity_secret_key_2024', {
    expiresIn: '30d'
  });
};

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  country_code: user.country_code,
  locale: user.locale,
  timezone: user.timezone,
  preferred_currency: user.preferred_currency,
  subscription_status: user.subscription_status,
  plan: user.plan,
  charity_id: user.charity_id,
  charity_percentage: user.charity_percentage,
  organization_id: user.organization_id,
  organization_role: user.organization_role
});

// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      charity_id,
      charity_percentage,
      country_code = 'IN',
      locale = 'en-IN',
      timezone = 'Asia/Kolkata',
      preferred_currency = 'INR'
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    let selectedCharityId = null;
    let selectedPercentage = 10;

    if (charity_id) {
      const charity = await Charity.findOne({ _id: charity_id, active: true });
      if (!charity) {
        return res.status(400).json({ success: false, message: 'Selected charity is not available' });
      }

      selectedCharityId = charity_id;
      selectedPercentage = Number(charity_percentage) || 10;

      if (selectedPercentage < 10 || selectedPercentage > 100) {
        return res.status(400).json({ success: false, message: 'Charity percentage must be between 10 and 100' });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      country_code,
      locale,
      timezone,
      preferred_currency,
      charity_id: selectedCharityId,
      charity_percentage: selectedPercentage
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: buildUserPayload(user)
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password').populate('charity_id', 'name image');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: buildUserPayload(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('charity_id', 'name image description')
      .populate('organization_id', 'name slug type country_code currency');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getMe };
