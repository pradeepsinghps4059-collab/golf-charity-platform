const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isSupabaseConfigured, supabaseAdmin } = require('../services/supabaseAdmin');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'golf_charity_secret_key_2024');
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    next();
  } catch (error) {
    if (!isSupabaseConfigured) {
      return res.status(401).json({ success: false, message: 'Token invalid or expired' });
    }

    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authData?.user?.email) {
        return res.status(401).json({ success: false, message: 'Token invalid or expired' });
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users_profile')
        .select('*')
        .eq('email', authData.user.email)
        .single();

      if (profileError || !profile) {
        req.user = {
          id: authData.user.id,
          _id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.name || authData.user.email.split('@')[0],
          role: authData.user.user_metadata?.role || 'user',
          supabase_auth_id: authData.user.id,
          profile_missing: true,
        };

        return next();
      }

      req.user = {
        id: profile.id,
        _id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        country_code: profile.country_code,
        locale: profile.locale,
        timezone: profile.timezone,
        preferred_currency: profile.preferred_currency,
        subscription_status: profile.subscription_status,
        plan: profile.plan,
        charity_id: profile.charity_id,
        charity_percentage: profile.charity_percentage,
        organization_id: profile.organization_id,
        organization_role: profile.organization_role,
        supabase_auth_id: authData.user.id,
      };

      next();
    } catch (supabaseError) {
      return res.status(401).json({ success: false, message: 'Token invalid or expired' });
    }
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
};

module.exports = { protect, adminOnly };
