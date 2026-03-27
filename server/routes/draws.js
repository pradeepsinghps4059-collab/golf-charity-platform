const express = require('express');
const router = express.Router();
const { getDraws, getMyResults, uploadWinnerProof, runDraw, publishDraw, getAllDraws } = require('../controllers/drawController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', getDraws);
router.get('/my-results', getMyResults);
router.post('/my-results/:winnerId/proof', uploadWinnerProof);
router.get('/all', adminOnly, getAllDraws);
router.post('/run', adminOnly, runDraw);
router.put('/:id/publish', adminOnly, publishDraw);

module.exports = router;
