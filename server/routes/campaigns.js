const express = require('express');
const router = express.Router();
const {
  getCampaigns,
  createCampaign,
  updateCampaign,
  archiveCampaign
} = require('../controllers/campaignController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getCampaigns);
router.post('/', protect, adminOnly, createCampaign);
router.put('/:id', protect, adminOnly, updateCampaign);
router.delete('/:id', protect, adminOnly, archiveCampaign);

module.exports = router;
