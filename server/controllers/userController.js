const User = require('../models/User');
const Score = require('../models/Score');
const Winner = require('../models/Winner');
const Draw = require('../models/Draw');
const { sendSystemUpdateEmail } = require('../services/emailService');

// @route   POST /api/users/subscribe
const subscribe = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Plan must be monthly or yearly' });
    }

    const start = new Date();
    const end = new Date();
    if (plan === 'monthly') {
      end.setMonth(end.getMonth() + 1);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        subscription_status: 'active',
        plan,
        subscription_start: start,
        subscription_end: end
      },
      { new: true }
    ).populate('charity_id', 'name image');

    res.json({
      success: true,
      message: `Subscribed to ${plan} plan successfully!`,
      user
    });

    sendSystemUpdateEmail({
      email: user.email,
      name: user.name,
      title: 'Subscription activated',
      body: `Your ${plan} subscription is now active.`,
    }).catch((error) => console.error('Subscription email error:', error.message));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing subscription' });
  }
};

// @route   POST /api/users/cancel-subscription
const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { subscription_status: 'cancelled' },
      { new: true }
    );

    res.json({ success: true, message: 'Subscription cancelled', user });

    sendSystemUpdateEmail({
      email: user.email,
      name: user.name,
      title: 'Subscription cancelled',
      body: 'Your subscription has been cancelled. You can reactivate at any time.',
    }).catch((error) => console.error('Cancellation email error:', error.message));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling subscription' });
  }
};

// @route   GET /api/users/dashboard
const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('charity_id', 'name image description country_codes default_currency')
      .populate('organization_id', 'name slug type currency country_code');
    const scores = await Score.find({ user_id: req.user.id }).sort({ date: -1 }).limit(5);
    const wins = await Winner.find({ user_id: req.user.id, status: { $in: ['confirmed', 'paid'] } })
      .populate('draw_id', 'draw_numbers date month')
      .sort({ createdAt: -1 });
    const currentScoreCount = await Score.countDocuments({ user_id: req.user.id });
    const drawsEntered = user.subscription_start
      ? await Draw.countDocuments({
          status: 'published',
          date: { $gte: user.subscription_start }
        })
      : 0;
    const upcomingDraws = await Draw.find({ status: 'draft' })
      .sort({ date: 1, createdAt: 1 })
      .limit(3)
      .select('month date generation_mode sequence');

    const totalAmountWon = wins.reduce((sum, win) => sum + (win.prize_amount || 0), 0);
    const pendingPayouts = wins.filter((win) => win.status === 'confirmed').length;
    const paidPayouts = wins.filter((win) => win.status === 'paid').length;

    res.json({
      success: true,
      dashboard: {
        user,
        scores,
        wins,
        score_count: currentScoreCount,
        draws_entered: drawsEntered,
        upcoming_draws: upcomingDraws,
        total_amount_won: totalAmountWon,
        pending_payouts: pendingPayouts,
        paid_payouts: paidPayouts,
        total_wins: wins.length,
        gold_wins: wins.filter(w => w.prize_tier === 'gold').length,
        silver_wins: wins.filter(w => w.prize_tier === 'silver').length,
        bronze_wins: wins.filter(w => w.prize_tier === 'bronze').length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading dashboard' });
  }
};

module.exports = { subscribe, cancelSubscription, getDashboard };
