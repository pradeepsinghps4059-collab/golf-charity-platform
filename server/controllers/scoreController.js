const Score = require('../models/Score');
const { isSupabaseConfigured, supabaseAdmin } = require('../services/supabaseAdmin');

const MAX_SCORES = 5;

// @route   GET /api/scores
const getScores = async (req, res) => {
  try {
    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data, error } = await supabaseAdmin
        .from('scores')
        .select('*')
        .eq('user_id', req.user.id)
        .order('played_at', { ascending: false })
        .limit(MAX_SCORES);

      if (error) {
        return res.status(500).json({ success: false, message: 'Error fetching scores' });
      }

      const scores = (data || []).map((score) => ({
        _id: score.id,
        score: score.score,
        date: score.played_at,
      }));

      return res.json({ success: true, scores });
    }

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

    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const playedAt = date || new Date().toISOString().split('T')[0];
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('scores')
        .insert({
          user_id: req.user.id,
          score: Number(score),
          played_at: playedAt,
        })
        .select('*')
        .single();

      if (insertError || !inserted) {
        return res.status(500).json({ success: false, message: 'Error adding score' });
      }

      const { data: allScores, error: listError } = await supabaseAdmin
        .from('scores')
        .select('*')
        .eq('user_id', req.user.id)
        .order('played_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (listError) {
        return res.status(500).json({ success: false, message: 'Error adding score' });
      }

      const retainedScores = (allScores || []).slice(0, MAX_SCORES);
      const overflowScores = (allScores || []).slice(MAX_SCORES);

      if (overflowScores.length > 0) {
        await supabaseAdmin
          .from('scores')
          .delete()
          .in('id', overflowScores.map((entry) => entry.id));
      }

      const normalizedScores = retainedScores.map((entry) => ({
        _id: entry.id,
        score: entry.score,
        date: entry.played_at,
      }));

      return res.status(201).json({
        success: true,
        message: 'Score added successfully',
        score: {
          _id: inserted.id,
          score: inserted.score,
          date: inserted.played_at,
        },
        scores: normalizedScores,
        retained: retainedScores.some((entry) => entry.id === inserted.id),
      });
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

    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data: existingScore, error: existingError } = await supabaseAdmin
        .from('scores')
        .select('*')
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .single();

      if (existingError || !existingScore) {
        return res.status(404).json({ success: false, message: 'Score not found' });
      }

      const { data: updatedScore, error: updateError } = await supabaseAdmin
        .from('scores')
        .update({
          score: Number(score),
          played_at: date || existingScore.played_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.params.id)
        .select('*')
        .single();

      if (updateError || !updatedScore) {
        return res.status(500).json({ success: false, message: 'Error updating score' });
      }

      const { data: scoresData } = await supabaseAdmin
        .from('scores')
        .select('*')
        .eq('user_id', req.user.id)
        .order('played_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(MAX_SCORES);

      const scores = (scoresData || []).map((entry) => ({
        _id: entry.id,
        score: entry.score,
        date: entry.played_at,
      }));

      return res.json({
        success: true,
        message: 'Score updated successfully',
        score: { _id: updatedScore.id, score: updatedScore.score, date: updatedScore.played_at },
        scores,
      });
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
    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data: existingScore, error: existingError } = await supabaseAdmin
        .from('scores')
        .select('id')
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .single();

      if (existingError || !existingScore) {
        return res.status(404).json({ success: false, message: 'Score not found' });
      }

      const { error: deleteError } = await supabaseAdmin
        .from('scores')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);

      if (deleteError) {
        return res.status(500).json({ success: false, message: 'Error deleting score' });
      }

      return res.json({ success: true, message: 'Score deleted' });
    }

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
