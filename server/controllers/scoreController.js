const Score = require('../models/Score');

const MAX_SCORES = 5;

// @route   GET /api/scores
const getScores = async (req, res) => {
  try {
    const scores = await Score.find({ user_id: req.user.id })
      .sort({ date: -1, createdAt: -1 })
      .limit(MAX_SCORES);

    res.json({ success: true, scores });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching scores' });
  }
};

// @route   POST /api/scores
const addScore = async (req, res) => {
  try {
    const { score, date } = req.body;

    if (!score || score < 1 || score > 45) {
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 45' });
    }

    // Check subscription
    if (req.user.subscription_status !== 'active') {
      return res.status(403).json({ success: false, message: 'Active subscription required to add scores' });
    }

    const newScore = await Score.create({
      user_id: req.user.id,
      score: Number(score),
      date: date ? new Date(date) : new Date()
    });

    const allScores = await Score.find({ user_id: req.user.id })
      .sort({ date: -1, createdAt: -1 });

    const retainedScores = allScores.slice(0, MAX_SCORES);
    const overflowScores = allScores.slice(MAX_SCORES);

    if (overflowScores.length > 0) {
      await Score.deleteMany({ _id: { $in: overflowScores.map((entry) => entry._id) } });
    }

    res.status(201).json({
      success: true,
      message: 'Score added successfully',
      score: newScore,
      scores: retainedScores,
      retained: retainedScores.some((entry) => entry._id.equals(newScore._id))
    });
  } catch (error) {
    console.error('Add score error:', error);
    res.status(500).json({ success: false, message: 'Error adding score' });
  }
};

// @route   PUT /api/scores/:id
const updateScore = async (req, res) => {
  try {
    const { score, date } = req.body;

    if (!score || score < 1 || score > 45) {
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 45' });
    }

    const existingScore = await Score.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!existingScore) {
      return res.status(404).json({ success: false, message: 'Score not found' });
    }

    existingScore.score = Number(score);
    existingScore.date = date ? new Date(date) : existingScore.date;
    await existingScore.save();

    const scores = await Score.find({ user_id: req.user.id })
      .sort({ date: -1, createdAt: -1 })
      .limit(MAX_SCORES);

    res.json({ success: true, message: 'Score updated successfully', score: existingScore, scores });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating score' });
  }
};

// @route   DELETE /api/scores/:id
const deleteScore = async (req, res) => {
  try {
    const score = await Score.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!score) {
      return res.status(404).json({ success: false, message: 'Score not found' });
    }

    await Score.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Score deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting score' });
  }
};

module.exports = { getScores, addScore, updateScore, deleteScore };
