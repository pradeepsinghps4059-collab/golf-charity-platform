const Organization = require('../models/Organization');
const User = require('../models/User');

// @route   GET /api/organizations
const getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find({ active: true }).sort({ name: 1 });
    res.json({ success: true, organizations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching organizations' });
  }
};

// @route   POST /api/organizations  (admin)
const createOrganization = async (req, res) => {
  try {
    const {
      name,
      slug,
      type = 'team',
      country_code = 'IN',
      locale = 'en-IN',
      timezone = 'Asia/Kolkata',
      currency = 'INR',
      seat_limit = 25,
      owner_user_id = null
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Name and slug are required' });
    }

    const organization = await Organization.create({
      name,
      slug,
      type,
      country_code,
      locale,
      timezone,
      currency,
      seat_limit,
      owner_user_id
    });

    if (owner_user_id) {
      await User.findByIdAndUpdate(owner_user_id, {
        organization_id: organization._id,
        organization_role: 'owner'
      });
    }

    res.status(201).json({ success: true, organization });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating organization' });
  }
};

// @route   PUT /api/organizations/:id  (admin)
const updateOrganization = async (req, res) => {
  try {
    const organization = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    res.json({ success: true, organization });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating organization' });
  }
};

// @route   DELETE /api/organizations/:id  (admin)
const archiveOrganization = async (req, res) => {
  try {
    const organization = await Organization.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    res.json({ success: true, message: 'Organization archived', organization });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error archiving organization' });
  }
};

module.exports = {
  getOrganizations,
  createOrganization,
  updateOrganization,
  archiveOrganization
};
