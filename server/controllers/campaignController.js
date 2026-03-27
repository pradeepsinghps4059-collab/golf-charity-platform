const Campaign = require('../models/Campaign');

// @route   GET /api/campaigns
const getCampaigns = async (req, res) => {
  try {
    const { status = '', country = '' } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (country) {
      query.country_codes = country.toUpperCase();
    }

    const campaigns = await Campaign.find(query).sort({ featured: -1, createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching campaigns' });
  }
};

// @route   POST /api/campaigns  (admin)
const createCampaign = async (req, res) => {
  try {
    const {
      title,
      slug,
      description = '',
      status = 'draft',
      type = 'seasonal',
      country_codes = ['IN'],
      currency = 'INR',
      starts_at = null,
      ends_at = null,
      featured = false,
      donation_multiplier = 1,
      metadata = {}
    } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ success: false, message: 'Title and slug are required' });
    }

    const campaign = await Campaign.create({
      title,
      slug,
      description,
      status,
      type,
      country_codes: Array.isArray(country_codes) ? country_codes : [country_codes],
      currency,
      starts_at,
      ends_at,
      featured,
      donation_multiplier,
      metadata
    });

    res.status(201).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating campaign' });
  }
};

// @route   PUT /api/campaigns/:id  (admin)
const updateCampaign = async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.country_codes && !Array.isArray(update.country_codes)) {
      update.country_codes = [update.country_codes];
    }

    const campaign = await Campaign.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating campaign' });
  }
};

// @route   DELETE /api/campaigns/:id  (admin)
const archiveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'archived' },
      { new: true }
    );
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({ success: true, message: 'Campaign archived', campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error archiving campaign' });
  }
};

module.exports = {
  getCampaigns,
  createCampaign,
  updateCampaign,
  archiveCampaign
};
