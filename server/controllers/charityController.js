const Charity = require('../models/Charity');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { isSupabaseConfigured, supabaseAdmin } = require('../services/supabaseAdmin');

const parseEvents = (eventsInput) => {
  if (!eventsInput) return [];
  if (Array.isArray(eventsInput)) return eventsInput;

  try {
    const parsed = JSON.parse(eventsInput);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseCountryCodes = (input) => {
  if (!input) return undefined;
  if (Array.isArray(input)) return input.map((value) => String(value).toUpperCase()).filter(Boolean);
  return String(input)
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
};

const normalizeCharity = (charity) => ({
  ...charity,
  _id: charity._id || charity.id,
});

const buildSupabaseCharityQuery = ({ search = '', category = '', featured = '', country = '' }) => {
  let query = supabaseAdmin
    .from('charities')
    .select('*')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('name', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  if (featured === 'true') {
    query = query.eq('featured', true);
  }

  if (country) {
    query = query.contains('country_codes', [country.toUpperCase()]);
  }

  if (search) {
    const term = search.trim();
    if (term) {
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`);
    }
  }

  return query;
};

const findSupabaseProfileByRequestUser = async (reqUser) => {
  const { data, error } = await supabaseAdmin
    .from('users_profile')
    .select('*')
    .eq('email', reqUser.email)
    .single();

  if (error) throw error;
  return data;
};

// @route   GET /api/charities
const getCharities = async (req, res) => {
  try {
    if (isSupabaseConfigured) {
      const { search = '', category = '', featured = '', country = '' } = req.query;
      const { data, error } = await buildSupabaseCharityQuery({ search, category, featured, country });
      if (error) throw error;

      const charities = (data || []).map(normalizeCharity);
      const categories = [...new Set(charities.map((charity) => charity.category).filter(Boolean))];
      return res.json({ success: true, charities, categories });
    }

    const { search = '', category = '', featured = '', country = '' } = req.query;
    const query = { active: true };

    if (category) {
      query.category = category;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (country) {
      query.country_codes = country.toUpperCase();
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const charities = await Charity.find(query).sort({ featured: -1, name: 1 });
    const categories = await Charity.distinct('category', { active: true });

    res.json({ success: true, charities, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching charities' });
  }
};

// @route   GET /api/charities/:id
const getCharityById = async (req, res) => {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('charities')
        .select('*')
        .eq('id', req.params.id)
        .eq('active', true)
        .single();

      if (error || !data) {
        return res.status(404).json({ success: false, message: 'Charity not found' });
      }

      return res.json({ success: true, charity: normalizeCharity(data) });
    }

    const charity = await Charity.findOne({ _id: req.params.id, active: true });
    if (!charity) {
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    res.json({ success: true, charity });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching charity' });
  }
};

// @route   POST /api/charities/select
const selectCharity = async (req, res) => {
  try {
    const { charity_id, charity_percentage } = req.body;

    if (!charity_id) {
      return res.status(400).json({ success: false, message: 'Charity ID required' });
    }

    const percentage = Number(charity_percentage) || 10;
    if (percentage < 10 || percentage > 100) {
      return res.status(400).json({ success: false, message: 'Percentage must be between 10 and 100' });
    }

    if (isSupabaseConfigured) {
      const { data: charity, error: charityError } = await supabaseAdmin
        .from('charities')
        .select('*')
        .eq('id', charity_id)
        .eq('active', true)
        .single();

      if (charityError || !charity) {
        return res.status(404).json({ success: false, message: 'Charity not found' });
      }

      const profile = await findSupabaseProfileByRequestUser(req.user);
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('users_profile')
        .update({ charity_id, charity_percentage: percentage, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
        .select('*, charities(*)')
        .single();

      if (updateError) throw updateError;

      return res.json({
        success: true,
        message: 'Charity selected successfully',
        user: {
          ...updatedProfile,
          _id: updatedProfile.id,
          charity_id: updatedProfile.charities ? normalizeCharity(updatedProfile.charities) : updatedProfile.charity_id,
        }
      });
    }

    const charity = await Charity.findOne({ _id: charity_id, active: true });
    if (!charity) {
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { charity_id, charity_percentage: percentage },
      { new: true }
    ).populate('charity_id', 'name image description category featured events');

    res.json({
      success: true,
      message: 'Charity selected successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error selecting charity' });
  }
};

// @route   POST /api/charities/donate
const donateToCharity = async (req, res) => {
  try {
    const { charity_id, amount, note = '', currency, campaign_id = null } = req.body;
    const normalizedAmount = Number(amount);

    if (!charity_id) {
      return res.status(400).json({ success: false, message: 'Charity ID required' });
    }

    if (!normalizedAmount || normalizedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Donation amount must be greater than 0' });
    }

    if (isSupabaseConfigured) {
      const { data: charity, error: charityError } = await supabaseAdmin
        .from('charities')
        .select('*')
        .eq('id', charity_id)
        .eq('active', true)
        .single();

      if (charityError || !charity) {
        return res.status(404).json({ success: false, message: 'Charity not found' });
      }

      const profile = await findSupabaseProfileByRequestUser(req.user);
      const payload = {
        user_id: profile.id,
        charity_id,
        organization_id: profile.organization_id || null,
        campaign_id,
        amount: normalizedAmount,
        currency: currency || profile.preferred_currency || charity.default_currency || 'INR',
        country_code: profile.country_code || 'IN',
        note,
      };

      const { data: donation, error: donationError } = await supabaseAdmin
        .from('donations')
        .insert(payload)
        .select('*')
        .single();

      if (donationError) throw donationError;

      return res.status(201).json({
        success: true,
        message: 'Donation recorded successfully',
        donation
      });
    }

    const charity = await Charity.findOne({ _id: charity_id, active: true });
    if (!charity) {
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    const donation = await Donation.create({
      user_id: req.user.id,
      charity_id,
      organization_id: req.user.organization_id || null,
      campaign_id,
      amount: normalizedAmount,
      currency: currency || req.user.preferred_currency || charity.default_currency || 'INR',
      country_code: req.user.country_code || 'IN',
      note
    });

    res.status(201).json({
      success: true,
      message: 'Donation recorded successfully',
      donation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error recording donation' });
  }
};

// @route   POST /api/charities  (admin)
const createCharity = async (req, res) => {
  try {
    const { name, description, image, category, featured, default_currency } = req.body;
    if (!name || !description) {
      return res.status(400).json({ success: false, message: 'Name and description required' });
    }

    if (isSupabaseConfigured) {
      const payload = {
        name,
        description,
        image,
        category: category || 'General',
        country_codes: parseCountryCodes(req.body.country_codes) || ['IN'],
        default_currency: default_currency || 'INR',
        featured: Boolean(featured),
        events: parseEvents(req.body.events),
      };

      const { data, error } = await supabaseAdmin
        .from('charities')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, charity: normalizeCharity(data) });
    }

    const charity = await Charity.create({
      name,
      description,
      image,
      category: category || 'General',
      country_codes: parseCountryCodes(req.body.country_codes) || ['IN'],
      default_currency: default_currency || 'INR',
      featured: Boolean(featured),
      events: parseEvents(req.body.events)
    });

    res.status(201).json({ success: true, charity });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating charity' });
  }
};

// @route   PUT /api/charities/:id  (admin)
const updateCharity = async (req, res) => {
  try {
    if (isSupabaseConfigured) {
      const update = {
        ...req.body,
        country_codes: parseCountryCodes(req.body.country_codes) || undefined,
        events: parseEvents(req.body.events),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('charities')
        .update(update)
        .eq('id', req.params.id)
        .select('*')
        .single();

      if (error || !data) {
        return res.status(404).json({ success: false, message: 'Charity not found' });
      }

      return res.json({ success: true, charity: normalizeCharity(data) });
    }

    const update = {
      ...req.body,
      country_codes: parseCountryCodes(req.body.country_codes) || undefined,
      events: parseEvents(req.body.events)
    };

    const charity = await Charity.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!charity) {
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    res.json({ success: true, charity });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating charity' });
  }
};

// @route   DELETE /api/charities/:id  (admin)
const deleteCharity = async (req, res) => {
  try {
    if (isSupabaseConfigured) {
      const { error } = await supabaseAdmin
        .from('charities')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', req.params.id);

      if (error) throw error;
      return res.json({ success: true, message: 'Charity deactivated' });
    }

    await Charity.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true, message: 'Charity deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting charity' });
  }
};

module.exports = {
  getCharities,
  getCharityById,
  selectCharity,
  donateToCharity,
  createCharity,
  updateCharity,
  deleteCharity
};
