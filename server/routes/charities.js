const express = require('express');
const router = express.Router();
const {
  getCharities,
  getCharityById,
  selectCharity,
  donateToCharity,
  createCharity,
  updateCharity,
  deleteCharity
} = require('../controllers/charityController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getCharities);
router.get('/:id', getCharityById);
router.post('/select', protect, selectCharity);
router.post('/donate', protect, donateToCharity);
router.post('/', protect, adminOnly, createCharity);
router.put('/:id', protect, adminOnly, updateCharity);
router.delete('/:id', protect, adminOnly, deleteCharity);

module.exports = router;
