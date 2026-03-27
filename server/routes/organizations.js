const express = require('express');
const router = express.Router();
const {
  getOrganizations,
  createOrganization,
  updateOrganization,
  archiveOrganization
} = require('../controllers/organizationController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getOrganizations);
router.post('/', protect, adminOnly, createOrganization);
router.put('/:id', protect, adminOnly, updateOrganization);
router.delete('/:id', protect, adminOnly, archiveOrganization);

module.exports = router;
