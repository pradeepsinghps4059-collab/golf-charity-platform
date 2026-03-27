const User = require('../models/User');
const Score = require('../models/Score');
const Winner = require('../models/Winner');
const Draw = require('../models/Draw');
const Charity = require('../models/Charity');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const Organization = require('../models/Organization');
const { sendWinnerAlertEmail } = require('../services/emailService');

const PLAN_PRIZE_CONTRIBUTIONS = {
  monthly: 300,
  yearly: 2700,
};

// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .populate('charity_id', 'name')
      .populate('organization_id', 'name type country_code')
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

// @route   GET /api/admin/users/:id/scores
const getUserScores = async (req, res) => {
  try {
    const scores = await Score.find({ user_id: req.params.id }).sort({ date: -1 });
    const user = await User.findById(req.params.id).select('name email');
    res.json({ success: true, scores, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user scores' });
  }
};

// @route   PUT /api/admin/users/:id/profile
const updateUserProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      plan,
      charity_id,
      charity_percentage,
      role,
      subscription_status,
      country_code,
      locale,
      timezone,
      preferred_currency,
      organization_id,
      organization_role,
    } = req.body;

    const update = {
      name,
      email,
      plan: plan || null,
      charity_id: charity_id || null,
      charity_percentage: charity_percentage ? Number(charity_percentage) : 10,
      role: role || 'user',
      subscription_status: subscription_status || 'inactive',
      country_code: country_code || 'IN',
      locale: locale || 'en-IN',
      timezone: timezone || 'Asia/Kolkata',
      preferred_currency: preferred_currency || 'INR',
      organization_id: organization_id || null,
      organization_role: organization_role || null,
    };

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('charity_id', 'name')
      .populate('organization_id', 'name slug type');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user profile' });
  }
};

// @route   PUT /api/admin/scores/:id
const editScore = async (req, res) => {
  try {
    const { score, date } = req.body;
    const updated = await Score.findByIdAndUpdate(
      req.params.id,
      { score, date },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Score not found' });
    res.json({ success: true, score: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating score' });
  }
};

// @route   GET /api/admin/winners
const getAllWinners = async (req, res) => {
  try {
    const winners = await Winner.find()
      .populate('user_id', 'name email')
      .populate('draw_id', 'draw_numbers date month')
      .sort({ createdAt: -1 });

    res.json({ success: true, winners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching winners' });
  }
};

// @route   PUT /api/admin/winners/:id/review
const reviewWinnerProof = async (req, res) => {
  try {
    const { decision, admin_review_note = '' } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decision must be approved or rejected' });
    }

    const winner = await Winner.findById(req.params.id);
    if (!winner) {
      return res.status(404).json({ success: false, message: 'Winner not found' });
    }

    winner.verification_status = decision;
    winner.admin_review_note = admin_review_note;
    if (decision === 'rejected') {
      winner.status = 'confirmed';
    }
    await winner.save();

    const populatedWinner = await Winner.findById(winner._id)
      .populate('user_id', 'name email')
      .populate('draw_id', 'draw_numbers date month');

    if (populatedWinner.user_id?.email) {
      sendWinnerAlertEmail({
        email: populatedWinner.user_id.email,
        name: populatedWinner.user_id.name,
        tier: populatedWinner.prize_tier,
        amount: populatedWinner.prize_amount || 0,
        status: decision,
      }).catch((error) => console.error('Winner review email error:', error.message));
    }

    res.json({ success: true, winner: populatedWinner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reviewing winner proof' });
  }
};

// @route   PUT /api/admin/winners/:id/pay
const markWinnerPaid = async (req, res) => {
  try {
    const winner = await Winner.findById(req.params.id);
    if (!winner) {
      return res.status(404).json({ success: false, message: 'Winner not found' });
    }

    if (winner.verification_status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Winner must be approved before marking as paid' });
    }

    winner.status = 'paid';
    await winner.save();

    const populatedWinner = await Winner.findById(winner._id)
      .populate('user_id', 'name email')
      .populate('draw_id', 'draw_numbers date month');

    if (populatedWinner.user_id?.email) {
      sendWinnerAlertEmail({
        email: populatedWinner.user_id.email,
        name: populatedWinner.user_id.name,
        tier: populatedWinner.prize_tier,
        amount: populatedWinner.prize_amount || 0,
        status: 'paid',
      }).catch((error) => console.error('Winner paid email error:', error.message));
    }

    res.json({ success: true, winner: populatedWinner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking winner as paid' });
  }
};

// @route   GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeSubscribers = await User.countDocuments({ subscription_status: 'active', role: 'user' });
    const totalDraws = await Draw.countDocuments();
    const publishedDraws = await Draw.countDocuments({ status: 'published' });
    const totalWinners = await Winner.countDocuments();
    const totalCharities = await Charity.countDocuments({ active: true });
    const totalOrganizations = await Organization.countDocuments({ active: true });
    const totalCampaigns = await Campaign.countDocuments();
    const totalPrizePoolAgg = await Draw.aggregate([
      { $group: { _id: null, total: { $sum: '$prize_pool_total' } } }
    ]);
    const drawModeBreakdown = await Draw.aggregate([
      { $group: { _id: '$generation_mode', count: { $sum: 1 } } }
    ]);
    const jackpotRolloverCount = await Draw.countDocuments({ jackpot_rollover_eligible: true });
    const winnerTierBreakdown = await Winner.aggregate([
      { $group: { _id: '$prize_tier', count: { $sum: 1 }, totalPrize: { $sum: '$prize_amount' } } }
    ]);

    const subscriptionBreakdown = await User.aggregate([
      { $match: { role: 'user', subscription_status: 'active' } },
      { $group: { _id: '$plan', count: { $sum: 1 } } }
    ]);

    const charityContributions = await User.aggregate([
      { $match: { role: 'user', subscription_status: 'active', charity_id: { $ne: null } } },
      { $group: { _id: '$charity_id', count: { $sum: 1 }, avg_percentage: { $avg: '$charity_percentage' } } },
      {
        $lookup: {
          from: 'charities',
          localField: '_id',
          foreignField: '_id',
          as: 'charity'
        }
      },
      { $unwind: '$charity' }
    ]);

    const activeUsers = await User.find({ role: 'user', subscription_status: 'active', charity_id: { $ne: null } })
      .select('plan charity_id charity_percentage');
    const subscriptionContributionMap = new Map();
    for (const user of activeUsers) {
      const base = PLAN_PRIZE_CONTRIBUTIONS[user.plan] || 0;
      const contribution = (base * (user.charity_percentage || 10)) / 100;
      const key = String(user.charity_id);
      subscriptionContributionMap.set(key, (subscriptionContributionMap.get(key) || 0) + contribution);
    }

    const donationTotals = await Donation.aggregate([
      { $group: { _id: '$charity_id', total: { $sum: '$amount' } } }
    ]);
    const donationMap = new Map(donationTotals.map((item) => [String(item._id), item.total]));

    const charityContributionTotals = charityContributions.map((item) => {
      const charityKey = String(item._id);
      const subscriptionTotal = Math.round((subscriptionContributionMap.get(charityKey) || 0) * 100) / 100;
      const donationTotal = Math.round((donationMap.get(charityKey) || 0) * 100) / 100;
      return {
        charity_id: item._id,
        charity_name: item.charity?.name || 'Unknown',
        subscribers: item.count,
        avg_percentage: item.avg_percentage,
        subscription_total_inr: subscriptionTotal,
        donation_total_inr: donationTotal,
        combined_total_inr: Math.round((subscriptionTotal + donationTotal) * 100) / 100,
      };
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeSubscribers,
        totalDraws,
        publishedDraws,
        totalWinners,
        totalCharities,
        totalOrganizations,
        totalCampaigns,
        totalPrizePool: totalPrizePoolAgg[0]?.total || 0,
        drawModeBreakdown,
        jackpotRolloverCount,
        winnerTierBreakdown,
        subscriptionBreakdown,
        charityContributions
        ,
        charityContributionTotals
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
};

// @route   PUT /api/admin/users/:id/subscription
const updateUserSubscription = async (req, res) => {
  try {
    const { subscription_status, plan } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { subscription_status, plan },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating subscription' });
  }
};

module.exports = {
  getAllUsers,
  getUserScores,
  updateUserProfile,
  editScore,
  getAllWinners,
  reviewWinnerProof,
  markWinnerPaid,
  getStats,
  updateUserSubscription
};
