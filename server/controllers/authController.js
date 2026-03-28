const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Charity = require('../models/Charity');
const User = require('../models/User');
const { isSupabaseConfigured, supabaseAdmin } = require('../services/supabaseAdmin');

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

const buildSupabaseProfilePayload = async (profile) => {
  let charity = null;
  let organization = null;

  if (profile.charity_id) {
    const { data } = await supabaseAdmin
      .from('charities')
      .select('*')
      .eq('id', profile.charity_id)
      .eq('active', true)
      .single();
    charity = data || null;
  }

  if (profile.organization_id) {
    const { data } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .eq('active', true)
      .single();
    organization = data || null;
  }

  return {
    ...profile,
    id: profile.id,
    _id: profile.id,
    charity_id: charity || profile.charity_id,
    organization_id: organization || profile.organization_id,
  };
};

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
    if (isSupabaseConfigured && req.user?.email) {
      const { data: profile, error } = await supabaseAdmin
        .from('users_profile')
        .select('*')
        .eq('email', req.user.email)
        .single();

      if (error || !profile) {
        return res.status(404).json({ success: false, message: 'User profile not found' });
      }

      const user = await buildSupabaseProfilePayload(profile);
      return res.json({ success: true, user });
    }

    const user = await User.findById(req.user.id)
      .populate('charity_id', 'name image description')
      .populate('organization_id', 'name slug type country_code currency');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/auth/bootstrap-profile
const bootstrapProfile = async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.status(400).json({ success: false, message: 'Supabase is not configured on the server' });
    }

    const {
      name,
      charity_id,
      charity_percentage = 10,
      country_code = 'IN',
      locale = 'en-IN',
      timezone = 'Asia/Kolkata',
      preferred_currency = 'INR'
    } = req.body;

    if (!req.user?.email || !name) {
      return res.status(400).json({ success: false, message: 'Name and authenticated email are required' });
    }

    const percentage = Number(charity_percentage) || 10;
    if (percentage < 10 || percentage > 100) {
      return res.status(400).json({ success: false, message: 'Charity percentage must be between 10 and 100' });
    }

    if (charity_id) {
      const { data: charity } = await supabaseAdmin
        .from('charities')
        .select('id')
        .eq('id', charity_id)
        .eq('active', true)
        .single();

      if (!charity) {
        return res.status(400).json({ success: false, message: 'Selected charity is not available' });
      }
    }

    const payload = {
      name,
      email: req.user.email,
      role: req.user.role || 'user',
      country_code,
      locale,
      timezone,
      preferred_currency,
      charity_id: charity_id || null,
      charity_percentage: percentage,
      updated_at: new Date().toISOString(),
    };

    const { data: existingProfile } = await supabaseAdmin
      .from('users_profile')
      .select('*')
      .eq('email', req.user.email)
      .maybeSingle();

    let savedProfile;
    if (existingProfile) {
      const { data, error } = await supabaseAdmin
        .from('users_profile')
        .update(payload)
        .eq('email', req.user.email)
        .select('*')
        .single();
      if (error) throw error;
      savedProfile = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('users_profile')
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      savedProfile = data;
    }

    const user = await buildSupabaseProfilePayload(savedProfile);
    return res.status(existingProfile ? 200 : 201).json({ success: true, user });
  } catch (error) {
    console.error('Bootstrap profile error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating profile' });
  }
};

module.exports = { register, login, getMe, bootstrapProfile };
