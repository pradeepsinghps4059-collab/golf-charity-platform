const User = require('../models/User');
const Score = require('../models/Score');
const Winner = require('../models/Winner');
const Draw = require('../models/Draw');
const { sendSystemUpdateEmail } = require('../services/emailService');
const { isSupabaseConfigured, supabaseAdmin } = require('../services/supabaseAdmin');

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

    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data: profile, error } = await supabaseAdmin
        .from('users_profile')
        .update({
          subscription_status: 'active',
          plan,
          subscription_start: start.toISOString(),
          subscription_end: end.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.user.id)
        .select(`
          *,
          charity:charity_id ( id, name, image )
        `)
        .single();

      if (error || !profile) {
        return res.status(500).json({ success: false, message: 'Error processing subscription' });
      }

      const user = {
        ...profile,
        _id: profile.id,
        charity_id: profile.charity ? { _id: profile.charity.id, ...profile.charity } : null,
      };

      res.json({
        success: true,
        message: `Subscribed to ${plan} plan successfully!`,
        user,
      });

      sendSystemUpdateEmail({
        email: user.email,
        name: user.name,
        title: 'Subscription activated',
        body: `Your ${plan} subscription is now active.`,
      }).catch((emailError) => console.error('Subscription email error:', emailError.message));
      return;
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
    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data: profile, error } = await supabaseAdmin
        .from('users_profile')
        .update({
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.user.id)
        .select('*')
        .single();

      if (error || !profile) {
        return res.status(500).json({ success: false, message: 'Error cancelling subscription' });
      }

      const user = { ...profile, _id: profile.id };
      res.json({ success: true, message: 'Subscription cancelled', user });

      sendSystemUpdateEmail({
        email: user.email,
        name: user.name,
        title: 'Subscription cancelled',
        body: 'Your subscription has been cancelled. You can reactivate at any time.',
      }).catch((emailError) => console.error('Cancellation email error:', emailError.message));
      return;
    }

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
    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users_profile')
        .select(`
          *,
          charity:charity_id ( id, name, image, description, country_codes, default_currency )
        `)
        .eq('id', req.user.id)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ success: false, message: 'User profile not found' });
      }

      const { data: scoresData } = await supabaseAdmin
        .from('scores')
        .select('*')
        .eq('user_id', req.user.id)
        .order('played_at', { ascending: false })
        .limit(5);

      const { count: scoreCount = 0 } = await supabaseAdmin
        .from('scores')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.id);

      let winsData = [];
      const { data: winnersRows } = await supabaseAdmin
        .from('winners')
        .select(`
          *,
          draw:draw_id ( id, month, draw_date, draw_numbers )
        `)
        .eq('user_id', req.user.id)
        .in('status', ['confirmed', 'paid'])
        .order('created_at', { ascending: false });

      winsData = winnersRows || [];

      let drawsEntered = 0;
      if (profile.subscription_start) {
        const { count = 0 } = await supabaseAdmin
          .from('draws')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published')
          .gte('draw_date', profile.subscription_start);
        drawsEntered = count;
      }

      const { data: upcomingDrawRows } = await supabaseAdmin
        .from('draws')
        .select('id, month, draw_date, generation_mode, sequence')
        .eq('status', 'draft')
        .order('draw_date', { ascending: true })
        .limit(3);

      const scores = (scoresData || []).map((score) => ({
        _id: score.id,
        score: score.score,
        date: score.played_at,
      }));

      const wins = winsData.map((win) => ({
        _id: win.id,
        match_count: win.match_count,
        prize_tier: win.prize_tier,
        prize_amount: Number(win.prize_amount || 0),
        status: win.status,
        draw_id: win.draw
          ? {
              _id: win.draw.id,
              month: win.draw.month,
              date: win.draw.draw_date,
              draw_numbers: win.draw.draw_numbers,
            }
          : null,
      }));

      const upcomingDraws = (upcomingDrawRows || []).map((draw) => ({
        _id: draw.id,
        month: draw.month,
        date: draw.draw_date,
        generation_mode: draw.generation_mode,
        sequence: draw.sequence,
      }));

      const totalAmountWon = wins.reduce((sum, win) => sum + (win.prize_amount || 0), 0);
      const pendingPayouts = wins.filter((win) => win.status === 'confirmed').length;
      const paidPayouts = wins.filter((win) => win.status === 'paid').length;

      return res.json({
        success: true,
        dashboard: {
          user: {
            ...profile,
            _id: profile.id,
            charity_id: profile.charity
              ? {
                  _id: profile.charity.id,
                  ...profile.charity,
                }
              : null,
          },
          scores,
          wins,
          score_count: scoreCount,
          draws_entered: drawsEntered,
          upcoming_draws: upcomingDraws,
          total_amount_won: totalAmountWon,
          pending_payouts: pendingPayouts,
          paid_payouts: paidPayouts,
          total_wins: wins.length,
          gold_wins: wins.filter((w) => w.prize_tier === 'gold').length,
          silver_wins: wins.filter((w) => w.prize_tier === 'silver').length,
          bronze_wins: wins.filter((w) => w.prize_tier === 'bronze').length,
        },
      });
    }

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
