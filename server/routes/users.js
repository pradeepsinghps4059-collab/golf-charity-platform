const express = require('express');
const router = express.Router();
const { subscribe, cancelSubscription, getDashboard } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboard);
router.post('/subscribe', subscribe);
router.post('/cancel-subscription', cancelSubscription);

module.exports = router;
