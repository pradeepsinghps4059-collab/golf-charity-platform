const User = require('../models/User');
const Score = require('../models/Score');
const Winner = require('../models/Winner');
const Draw = require('../models/Draw');
const Charity = require('../models/Charity');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const Organization = require('../models/Organization');
const { sendWinnerAlertEmail } = require('../services/emailService');
const { isSupabaseConfigured, supabaseAdmin } = require('../services/supabaseAdmin');

const PLAN_PRIZE_CONTRIBUTIONS = {
  monthly: 300,
  yearly: 2700,
};

// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data: usersData, error } = await supabaseAdmin
        .from('users_profile')
        .select(`
          *,
          charity:charity_id ( id, name ),
          organization:organization_id ( id, name, type, country_code )
        `)
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, message: 'Error fetching users' });
      }

      const users = (usersData || []).map((user) => ({
        ...user,
        _id: user.id,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        charity_id: user.charity ? { _id: user.charity.id, ...user.charity } : null,
        organization_id: user.organization ? { _id: user.organization.id, ...user.organization } : null,
      }));

      return res.json({ success: true, users });
    }

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
    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const [{ data: scoresData, error: scoresError }, { data: userData, error: userError }] = await Promise.all([
        supabaseAdmin
          .from('scores')
          .select('*')
          .eq('user_id', req.params.id)
          .order('played_at', { ascending: false }),
        supabaseAdmin
          .from('users_profile')
          .select('id, name, email')
          .eq('id', req.params.id)
          .single(),
      ]);

      if (scoresError || userError || !userData) {
        return res.status(500).json({ success: false, message: 'Error fetching user scores' });
      }

      const scores = (scoresData || []).map((score) => ({
        _id: score.id,
        score: score.score,
        date: score.played_at,
      }));
      const user = { _id: userData.id, name: userData.name, email: userData.email };
      return res.json({ success: true, scores, user });
    }

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

    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const payload = {
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
        updated_at: new Date().toISOString(),
      };

      const { data: userData, error } = await supabaseAdmin
        .from('users_profile')
        .update(payload)
        .eq('id', req.params.id)
        .select(`
          *,
          charity:charity_id ( id, name ),
          organization:organization_id ( id, name, slug, type )
        `)
        .single();

      if (error || !userData) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = {
        ...userData,
        _id: userData.id,
        charity_id: userData.charity ? { _id: userData.charity.id, ...userData.charity } : null,
        organization_id: userData.organization ? { _id: userData.organization.id, ...userData.organization } : null,
      };

      return res.json({ success: true, user });
    }

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

    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const payload = {
        updated_at: new Date().toISOString(),
      };
      if (score !== undefined) payload.score = score;
      if (date) payload.played_at = date;

      const { data: updated, error } = await supabaseAdmin
        .from('scores')
        .update(payload)
        .eq('id', req.params.id)
        .select('*')
        .single();

      if (error || !updated) {
        return res.status(404).json({ success: false, message: 'Score not found' });
      }

      return res.json({
        success: true,
        score: {
          _id: updated.id,
          score: updated.score,
          date: updated.played_at,
        }
      });
    }

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
    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data, error } = await supabaseAdmin
        .from('winners')
        .select(`
          *,
          user:user_id ( id, name, email ),
          draw:draw_id ( id, draw_numbers, draw_date, month )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, message: 'Error fetching winners' });
      }

      const winners = (data || []).map((winner) => ({
        _id: winner.id,
        match_count: winner.match_count,
        matched_numbers: winner.matched_numbers || [],
        prize_tier: winner.prize_tier,
        status: winner.status,
        prize_amount: winner.prize_amount || 0,
        proof_url: winner.proof_url,
        proof_note: winner.proof_note,
        verification_status: winner.verification_status,
        admin_review_note: winner.admin_review_note,
        createdAt: winner.created_at,
        user_id: winner.user ? { _id: winner.user.id, ...winner.user } : null,
        draw_id: winner.draw
          ? {
              _id: winner.draw.id,
              draw_numbers: winner.draw.draw_numbers || [],
              date: winner.draw.draw_date,
              month: winner.draw.month,
            }
          : null,
      }));

      return res.json({ success: true, winners });
    }

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

    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data: existingWinner, error: existingError } = await supabaseAdmin
        .from('winners')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (existingError || !existingWinner) {
        return res.status(404).json({ success: false, message: 'Winner not found' });
      }

      const { data: winner, error } = await supabaseAdmin
        .from('winners')
        .update({
          verification_status: decision,
          admin_review_note,
          status: decision === 'rejected' ? 'confirmed' : existingWinner.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.params.id)
        .select(`
          *,
          user:user_id ( id, name, email ),
          draw:draw_id ( id, draw_numbers, draw_date, month )
        `)
        .single();

      if (error || !winner) {
        return res.status(500).json({ success: false, message: 'Error reviewing winner proof' });
      }

      const normalizedWinner = {
        _id: winner.id,
        match_count: winner.match_count,
        matched_numbers: winner.matched_numbers || [],
        prize_tier: winner.prize_tier,
        status: winner.status,
        prize_amount: winner.prize_amount || 0,
        proof_url: winner.proof_url,
        proof_note: winner.proof_note,
        verification_status: winner.verification_status,
        admin_review_note: winner.admin_review_note,
        user_id: winner.user ? { _id: winner.user.id, ...winner.user } : null,
        draw_id: winner.draw ? { _id: winner.draw.id, draw_numbers: winner.draw.draw_numbers || [], date: winner.draw.draw_date, month: winner.draw.month } : null,
      };

      if (normalizedWinner.user_id?.email) {
        sendWinnerAlertEmail({
          email: normalizedWinner.user_id.email,
          name: normalizedWinner.user_id.name,
          tier: normalizedWinner.prize_tier,
          amount: normalizedWinner.prize_amount || 0,
          status: decision,
        }).catch((emailError) => console.error('Winner review email error:', emailError.message));
      }

      return res.json({ success: true, winner: normalizedWinner });
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
    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data: existingWinner, error: existingError } = await supabaseAdmin
        .from('winners')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (existingError || !existingWinner) {
        return res.status(404).json({ success: false, message: 'Winner not found' });
      }

      if (existingWinner.verification_status !== 'approved') {
        return res.status(400).json({ success: false, message: 'Winner must be approved before marking as paid' });
      }

      const { data: winner, error } = await supabaseAdmin
        .from('winners')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.params.id)
        .select(`
          *,
          user:user_id ( id, name, email ),
          draw:draw_id ( id, draw_numbers, draw_date, month )
        `)
        .single();

      if (error || !winner) {
        return res.status(500).json({ success: false, message: 'Error marking winner as paid' });
      }

      const normalizedWinner = {
        _id: winner.id,
        match_count: winner.match_count,
        matched_numbers: winner.matched_numbers || [],
        prize_tier: winner.prize_tier,
        status: winner.status,
        prize_amount: winner.prize_amount || 0,
        proof_url: winner.proof_url,
        proof_note: winner.proof_note,
        verification_status: winner.verification_status,
        admin_review_note: winner.admin_review_note,
        user_id: winner.user ? { _id: winner.user.id, ...winner.user } : null,
        draw_id: winner.draw ? { _id: winner.draw.id, draw_numbers: winner.draw.draw_numbers || [], date: winner.draw.draw_date, month: winner.draw.month } : null,
      };

      if (normalizedWinner.user_id?.email) {
        sendWinnerAlertEmail({
          email: normalizedWinner.user_id.email,
          name: normalizedWinner.user_id.name,
          tier: normalizedWinner.prize_tier,
          amount: normalizedWinner.prize_amount || 0,
          status: 'paid',
        }).catch((emailError) => console.error('Winner paid email error:', emailError.message));
      }

      return res.json({ success: true, winner: normalizedWinner });
    }

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
    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const [
        usersResponse,
        drawsResponse,
        winnersResponse,
        charitiesResponse,
        donationsResponse,
        campaignsResponse,
        organizationsResponse,
      ] = await Promise.all([
        supabaseAdmin.from('users_profile').select('*'),
        supabaseAdmin.from('draws').select('*'),
        supabaseAdmin.from('winners').select('*'),
        supabaseAdmin.from('charities').select('*'),
        supabaseAdmin.from('donations').select('*'),
        supabaseAdmin.from('campaigns').select('*'),
        supabaseAdmin.from('organizations').select('*'),
      ]);

      const users = usersResponse.data || [];
      const draws = drawsResponse.data || [];
      const winners = winnersResponse.data || [];
      const charities = charitiesResponse.data || [];
      const donations = donationsResponse.data || [];
      const campaigns = campaignsResponse.data || [];
      const organizations = organizationsResponse.data || [];

      const totalUsers = users.filter((user) => user.role === 'user').length;
      const activeSubscribers = users.filter((user) => user.role === 'user' && user.subscription_status === 'active').length;
      const totalDraws = draws.length;
      const publishedDraws = draws.filter((draw) => draw.status === 'published').length;
      const totalWinners = winners.length;
      const totalCharities = charities.filter((charity) => charity.active !== false).length;
      const totalOrganizations = organizations.filter((org) => org.active !== false).length;
      const totalCampaigns = campaigns.length;
      const totalPrizePool = draws.reduce((sum, draw) => sum + Number(draw.prize_pool_total || 0), 0);
      const jackpotRolloverCount = draws.filter((draw) => draw.jackpot_rollover_eligible).length;

      const groupCounts = (items, key, mapper = (value) => value) => {
        const map = new Map();
        items.forEach((item) => {
          const raw = item[key];
          const groupKey = raw ?? null;
          const current = map.get(groupKey) || 0;
          map.set(groupKey, current + 1);
        });
        return Array.from(map.entries()).map(([groupKey, count]) => ({
          _id: mapper(groupKey),
          count,
        }));
      };

      const drawModeBreakdown = groupCounts(draws, 'generation_mode');
      const subscriptionBreakdown = groupCounts(
        users.filter((user) => user.role === 'user' && user.subscription_status === 'active'),
        'plan'
      );

      const winnerTierMap = new Map();
      winners.forEach((winner) => {
        const key = winner.prize_tier || 'unknown';
        const existing = winnerTierMap.get(key) || { _id: key, count: 0, totalPrize: 0 };
        existing.count += 1;
        existing.totalPrize += Number(winner.prize_amount || 0);
        winnerTierMap.set(key, existing);
      });
      const winnerTierBreakdown = Array.from(winnerTierMap.values());

      const charityById = new Map(charities.map((charity) => [charity.id, charity]));
      const activeUsers = users.filter((user) => user.role === 'user' && user.subscription_status === 'active' && user.charity_id);

      const subscriptionContributionMap = new Map();
      activeUsers.forEach((user) => {
        const base = PLAN_PRIZE_CONTRIBUTIONS[user.plan] || 0;
        const contribution = (base * (user.charity_percentage || 10)) / 100;
        const key = user.charity_id;
        subscriptionContributionMap.set(key, (subscriptionContributionMap.get(key) || 0) + contribution);
      });

      const donationMap = new Map();
      donations.forEach((donation) => {
        const key = donation.charity_id;
        donationMap.set(key, (donationMap.get(key) || 0) + Number(donation.amount || 0));
      });

      const charityAggregateMap = new Map();
      activeUsers.forEach((user) => {
        const key = user.charity_id;
        const charity = charityById.get(key);
        const existing = charityAggregateMap.get(key) || {
          _id: key,
          count: 0,
          avgTotal: 0,
          charity,
        };
        existing.count += 1;
        existing.avgTotal += Number(user.charity_percentage || 10);
        charityAggregateMap.set(key, existing);
      });

      const charityContributions = Array.from(charityAggregateMap.values()).map((item) => ({
        _id: item._id,
        count: item.count,
        avg_percentage: item.count ? item.avgTotal / item.count : 0,
        charity: item.charity,
      }));

      const charityContributionTotals = charityContributions.map((item) => {
        const subscriptionTotal = Math.round((subscriptionContributionMap.get(item._id) || 0) * 100) / 100;
        const donationTotal = Math.round((donationMap.get(item._id) || 0) * 100) / 100;
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

      return res.json({
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
          totalPrizePool,
          drawModeBreakdown,
          jackpotRolloverCount,
          winnerTierBreakdown,
          subscriptionBreakdown,
          charityContributions,
          charityContributionTotals,
        }
      });
    }

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
