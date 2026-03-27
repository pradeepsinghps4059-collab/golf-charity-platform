const express = require('express');
const router = express.Router();
const {
  getAllUsers, getUserScores, editScore,
  getAllWinners, reviewWinnerProof, markWinnerPaid, getStats, updateUserSubscription, updateUserProfile
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/users/:id/scores', getUserScores);
router.put('/users/:id/profile', updateUserProfile);
router.put('/users/:id/subscription', updateUserSubscription);
router.put('/scores/:id', editScore);
router.get('/winners', getAllWinners);
router.put('/winners/:id/review', reviewWinnerProof);
router.put('/winners/:id/pay', markWinnerPaid);

module.exports = router;
