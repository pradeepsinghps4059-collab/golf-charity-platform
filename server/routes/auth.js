const express = require('express');
const router = express.Router();
const { register, login, getMe, bootstrapProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/bootstrap-profile', protect, bootstrapProfile);
router.get('/me', protect, getMe);

module.exports = router;
