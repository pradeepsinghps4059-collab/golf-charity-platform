const Draw = require('../models/Draw');
const Winner = require('../models/Winner');
const Score = require('../models/Score');
const User = require('../models/User');
const { sendDrawResultsEmail, sendWinnerAlertEmail } = require('../services/emailService');
const { isSupabaseConfigured, supabaseAdmin } = require('../services/supabaseAdmin');

const DRAW_SIZE = 5;
const SCORE_MIN = 1;
const SCORE_MAX = 45;
const PLAN_PRIZE_CONTRIBUTIONS = {
  monthly: 300,
  yearly: 2700,
};
const POOL_SHARE = {
  gold: 0.4,
  silver: 0.35,
  bronze: 0.25,
};

// Generate 5 unique random numbers between 1-45
const generateRandomDrawNumbers = () => {
  const numbers = new Set();
  while (numbers.size < DRAW_SIZE) {
    numbers.add(Math.floor(Math.random() * SCORE_MAX) + SCORE_MIN);
  }
  return Array.from(numbers);
};

const pickWeightedNumber = (weights, excluded) => {
  const available = weights.filter((entry) => !excluded.has(entry.number));
  const totalWeight = available.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    return null;
  }

  let threshold = Math.random() * totalWeight;
  for (const entry of available) {
    threshold -= entry.weight;
    if (threshold <= 0) {
      return entry.number;
    }
  }

  return available[available.length - 1]?.number || null;
};

const generateAlgorithmicDrawNumbers = async () => {
  if (isSupabaseConfigured) {
    const { data: scores = [] } = await supabaseAdmin
      .from('scores')
      .select('score');

    const frequencyMap = new Map();
    scores.forEach((entry) => {
      const current = frequencyMap.get(entry.score) || 0;
      frequencyMap.set(entry.score, current + 1);
    });

    const weightedNumbers = [];
    for (let score = SCORE_MIN; score <= SCORE_MAX; score += 1) {
      const frequency = frequencyMap.get(score) || 0;
      weightedNumbers.push({
        number: score,
        weight: 1 / (frequency + 1)
      });
    }

    const chosen = new Set();
    while (chosen.size < DRAW_SIZE) {
      const nextNumber = pickWeightedNumber(weightedNumbers, chosen);
      if (nextNumber === null) break;
      chosen.add(nextNumber);
    }

    while (chosen.size < DRAW_SIZE) {
      chosen.add(Math.floor(Math.random() * SCORE_MAX) + SCORE_MIN);
    }

    return Array.from(chosen);
  }

  const scoreFrequency = await Score.aggregate([
    {
      $group: {
        _id: '$score',
        frequency: { $sum: 1 }
      }
    }
  ]);

  const frequencyMap = new Map(scoreFrequency.map((entry) => [entry._id, entry.frequency]));
  const weightedNumbers = [];

  for (let score = SCORE_MIN; score <= SCORE_MAX; score += 1) {
    const frequency = frequencyMap.get(score) || 0;
    weightedNumbers.push({
      number: score,
      // Lower-frequency scores get a higher chance of being drawn.
      weight: 1 / (frequency + 1)
    });
  }

  const chosen = new Set();
  while (chosen.size < DRAW_SIZE) {
    const nextNumber = pickWeightedNumber(weightedNumbers, chosen);
    if (nextNumber === null) {
      break;
    }
    chosen.add(nextNumber);
  }

  while (chosen.size < DRAW_SIZE) {
    chosen.add(Math.floor(Math.random() * SCORE_MAX) + SCORE_MIN);
  }

  return Array.from(chosen);
};

const generateDrawNumbers = async (mode) => {
  if (mode === 'algorithmic') {
    return generateAlgorithmicDrawNumbers();
  }

  return generateRandomDrawNumbers();
};

const getPrizeTier = (matchCount) => {
  if (matchCount === 5) return 'gold';
  if (matchCount === 4) return 'silver';
  return 'bronze';
};

const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const calculatePrizePool = (activeUsers) => {
  const total = activeUsers.reduce((sum, user) => {
    const contribution = PLAN_PRIZE_CONTRIBUTIONS[user.plan] || 0;
    return sum + contribution;
  }, 0);

  return {
    total: roundCurrency(total),
    bronze: roundCurrency(total * POOL_SHARE.bronze),
    silver: roundCurrency(total * POOL_SHARE.silver),
    gold: roundCurrency(total * POOL_SHARE.gold),
  };
};

// @route   GET /api/draws
const getDraws = async (req, res) => {
  try {
    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data, error } = await supabaseAdmin
        .from('draws')
        .select('*')
        .eq('status', 'published')
        .order('draw_date', { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, message: 'Error fetching draws' });
      }

      const draws = (data || []).map((draw) => ({
        _id: draw.id,
        draw_numbers: draw.draw_numbers || [],
        month: draw.month,
        date: draw.draw_date,
        status: draw.status,
      }));

      return res.json({ success: true, draws });
    }

    const draws = await Draw.find({ status: 'published' }).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, draws });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching draws' });
  }
};

// @route   GET /api/draws/my-results
const getMyResults = async (req, res) => {
  try {
    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data, error } = await supabaseAdmin
        .from('winners')
        .select(`
          *,
          draw:draw_id ( id, draw_numbers, draw_date, month )
        `)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, message: 'Error fetching results' });
      }

      const results = (data || []).map((winner) => ({
        _id: winner.id,
        match_count: winner.match_count,
        matched_numbers: winner.matched_numbers || [],
        prize_tier: winner.prize_tier,
        prize_amount: winner.prize_amount || 0,
        status: winner.status,
        proof_url: winner.proof_url,
        proof_note: winner.proof_note,
        verification_status: winner.verification_status,
        admin_review_note: winner.admin_review_note,
        draw_id: winner.draw
          ? {
              _id: winner.draw.id,
              draw_numbers: winner.draw.draw_numbers || [],
              date: winner.draw.draw_date,
              month: winner.draw.month,
            }
          : null,
      }));

      return res.json({ success: true, results });
    }

    const winners = await Winner.find({ user_id: req.user.id })
      .populate('draw_id', 'draw_numbers date month jackpot_rollover_amount')
      .sort({ createdAt: -1 });

    res.json({ success: true, results: winners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching results' });
  }
};

// @route   POST /api/draws/my-results/:winnerId/proof
const uploadWinnerProof = async (req, res) => {
  try {
    const { proof_url, proof_note = '' } = req.body;

    if (!proof_url) {
      return res.status(400).json({ success: false, message: 'Proof URL is required' });
    }

    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data: winner, error: winnerError } = await supabaseAdmin
        .from('winners')
        .select(`
          *,
          draw:draw_id ( id, draw_numbers, draw_date, month )
        `)
        .eq('id', req.params.winnerId)
        .eq('user_id', req.user.id)
        .single();

      if (winnerError || !winner) {
        return res.status(404).json({ success: false, message: 'Winner record not found' });
      }

      if (!['confirmed', 'paid'].includes(winner.status)) {
        return res.status(400).json({ success: false, message: 'Proof upload is only available for published winners' });
      }

      const { data: updatedWinner, error: updateError } = await supabaseAdmin
        .from('winners')
        .update({
          proof_url,
          proof_note,
          verification_status: 'submitted',
          admin_review_note: '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.params.winnerId)
        .select(`
          *,
          draw:draw_id ( id, draw_numbers, draw_date, month )
        `)
        .single();

      if (updateError || !updatedWinner) {
        return res.status(500).json({ success: false, message: 'Error uploading proof' });
      }

      return res.json({
        success: true,
        message: 'Proof uploaded successfully',
        winner: {
          _id: updatedWinner.id,
          match_count: updatedWinner.match_count,
          matched_numbers: updatedWinner.matched_numbers || [],
          prize_tier: updatedWinner.prize_tier,
          prize_amount: updatedWinner.prize_amount || 0,
          status: updatedWinner.status,
          proof_url: updatedWinner.proof_url,
          proof_note: updatedWinner.proof_note,
          verification_status: updatedWinner.verification_status,
          admin_review_note: updatedWinner.admin_review_note,
          draw_id: updatedWinner.draw
            ? {
                _id: updatedWinner.draw.id,
                draw_numbers: updatedWinner.draw.draw_numbers || [],
                date: updatedWinner.draw.draw_date,
                month: updatedWinner.draw.month,
              }
            : null,
        },
      });
    }

    const winner = await Winner.findOne({ _id: req.params.winnerId, user_id: req.user.id })
      .populate('draw_id', 'draw_numbers date month jackpot_rollover_amount');

    if (!winner) {
      return res.status(404).json({ success: false, message: 'Winner record not found' });
    }

    if (!['confirmed', 'paid'].includes(winner.status)) {
      return res.status(400).json({ success: false, message: 'Proof upload is only available for published winners' });
    }

    winner.proof_url = proof_url;
    winner.proof_note = proof_note;
    winner.verification_status = 'submitted';
    winner.admin_review_note = '';
    await winner.save();

    res.json({ success: true, message: 'Proof uploaded successfully', winner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading proof' });
  }
};

// @route   POST /api/draws/run  (admin)
const runDraw = async (req, res) => {
  try {
    const generationMode = req.body?.generationMode === 'algorithmic' ? 'algorithmic' : 'random';
    const month = new Date().toISOString().slice(0, 7); // "2024-01"

    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { count: monthDrawCount = 0 } = await supabaseAdmin
        .from('draws')
        .select('*', { count: 'exact', head: true })
        .eq('month', month);
      const sequence = monthDrawCount + 1;
      const draw_numbers = await generateDrawNumbers(generationMode);

      const { data: activeUsers = [] } = await supabaseAdmin
        .from('users_profile')
        .select('id, plan, subscription_status, role')
        .eq('subscription_status', 'active')
        .eq('role', 'user');

      const { data: previousRollovers = [] } = await supabaseAdmin
        .from('draws')
        .select('*')
        .gt('rollover_amount', 0)
        .order('draw_date', { ascending: false })
        .limit(1);
      const carriedRollover = Number(previousRollovers[0]?.rollover_amount || 0);
      const prizePool = calculatePrizePool(activeUsers);

      const { data: createdDraw, error: drawError } = await supabaseAdmin
        .from('draws')
        .insert({
          draw_numbers,
          month,
          sequence,
          draw_date: new Date().toISOString(),
          status: 'draft',
          generation_mode: generationMode,
          prize_pool_total: prizePool.total,
          bronze_pool: prizePool.bronze,
          silver_pool: prizePool.silver,
          gold_pool: roundCurrency(prizePool.gold + carriedRollover),
          rollover_amount: 0,
        })
        .select('*')
        .single();

      if (drawError || !createdDraw) {
        return res.status(500).json({ success: false, message: 'Error running draw' });
      }

      const { data: allScores = [] } = await supabaseAdmin
        .from('scores')
        .select('*')
        .in('user_id', activeUsers.map((user) => user.id));

      const scoresByUser = new Map();
      allScores.forEach((score) => {
        const list = scoresByUser.get(score.user_id) || [];
        list.push(score.score);
        scoresByUser.set(score.user_id, list);
      });

      const winnersToCreate = [];
      let goldWinnerCount = 0;
      let silverWinnerCount = 0;
      let bronzeWinnerCount = 0;

      for (const user of activeUsers) {
        const userScoreValues = scoresByUser.get(user.id) || [];
        const matched = draw_numbers.filter((n) => userScoreValues.includes(n));
        const matchCount = matched.length;

        if (matchCount >= 3) {
          const prizeTier = getPrizeTier(matchCount);
          if (prizeTier === 'gold') goldWinnerCount += 1;
          else if (prizeTier === 'silver') silverWinnerCount += 1;
          else bronzeWinnerCount += 1;

          winnersToCreate.push({
            user_id: user.id,
            draw_id: createdDraw.id,
            match_count: matchCount,
            matched_numbers: matched,
            prize_tier: prizeTier,
            status: 'pending',
            verification_status: 'pending',
          });
        }
      }

      const prizePerTier = {
        gold: goldWinnerCount > 0 ? roundCurrency(Number(createdDraw.gold_pool || 0) / goldWinnerCount) : 0,
        silver: silverWinnerCount > 0 ? roundCurrency(Number(createdDraw.silver_pool || 0) / silverWinnerCount) : 0,
        bronze: bronzeWinnerCount > 0 ? roundCurrency(Number(createdDraw.bronze_pool || 0) / bronzeWinnerCount) : 0,
      };

      const winnersWithPayout = winnersToCreate.map((winner) => ({
        ...winner,
        prize_amount: prizePerTier[winner.prize_tier] || 0,
      }));

      if (winnersWithPayout.length > 0) {
        const { error: winnersError } = await supabaseAdmin
          .from('winners')
          .insert(winnersWithPayout);
        if (winnersError) {
          return res.status(500).json({ success: false, message: 'Error running draw' });
        }
      }

      const { data: updatedDraw, error: updateError } = await supabaseAdmin
        .from('draws')
        .update({
          gold_winner_count: goldWinnerCount,
          silver_winner_count: silverWinnerCount,
          bronze_winner_count: bronzeWinnerCount,
          jackpot_rollover_eligible: goldWinnerCount === 0,
          rollover_amount: goldWinnerCount === 0 ? Number(createdDraw.gold_pool || 0) : 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', createdDraw.id)
        .select('*')
        .single();

      if (updateError || !updatedDraw) {
        return res.status(500).json({ success: false, message: 'Error running draw' });
      }

      return res.status(201).json({
        success: true,
        message: 'Draw generated successfully',
        draw: {
          _id: updatedDraw.id,
          draw_numbers: updatedDraw.draw_numbers,
          month: updatedDraw.month,
          sequence: updatedDraw.sequence,
          date: updatedDraw.draw_date,
          status: updatedDraw.status,
          generation_mode: updatedDraw.generation_mode,
          prize_pool_total: updatedDraw.prize_pool_total,
          bronze_pool_amount: updatedDraw.bronze_pool,
          silver_pool_amount: updatedDraw.silver_pool,
          gold_pool_amount: updatedDraw.gold_pool,
          jackpot_rollover_amount: updatedDraw.rollover_amount,
          jackpot_rollover_eligible: updatedDraw.jackpot_rollover_eligible,
        },
        winners_count: winnersWithPayout.length,
        gold_winner_count: goldWinnerCount,
        jackpot_rollover_eligible: goldWinnerCount === 0,
        pool_breakdown: {
          total: updatedDraw.prize_pool_total,
          gold: updatedDraw.gold_pool,
          silver: updatedDraw.silver_pool,
          bronze: updatedDraw.bronze_pool,
        }
      });
    }

    const sequence = (await Draw.countDocuments({ month })) + 1;
    const draw_numbers = await generateDrawNumbers(generationMode);

    // Find all active subscribers and their scores
    const activeUsers = await User.find({ subscription_status: 'active', role: 'user' });
    const previousRolloverDraw = await Draw.findOne({ jackpot_rollover_amount: { $gt: 0 } })
      .sort({ date: -1, createdAt: -1 });
    const carriedRollover = previousRolloverDraw?.jackpot_rollover_amount || 0;
    const prizePool = calculatePrizePool(activeUsers);

    const draw = await Draw.create({
      draw_numbers,
      month,
      sequence,
      date: new Date(),
      status: 'draft',
      generation_mode: generationMode,
      prize_pool_total: prizePool.total,
      bronze_pool_amount: prizePool.bronze,
      silver_pool_amount: prizePool.silver,
      gold_pool_amount: roundCurrency(prizePool.gold + carriedRollover),
      jackpot_rollover_amount: 0,
      triggered_by: req.user.id
    });

    const winnersToCreate = [];
    let goldWinnerCount = 0;
    let silverWinnerCount = 0;
    let bronzeWinnerCount = 0;

    for (const user of activeUsers) {
      const scores = await Score.find({ user_id: user._id });
      const userScoreValues = scores.map(s => s.score);

      const matched = draw_numbers.filter(n => userScoreValues.includes(n));
      const matchCount = matched.length;

      if (matchCount >= 3) {
        const prizeTier = getPrizeTier(matchCount);
        if (prizeTier === 'gold') {
          goldWinnerCount += 1;
        } else if (prizeTier === 'silver') {
          silverWinnerCount += 1;
        } else {
          bronzeWinnerCount += 1;
        }

        winnersToCreate.push({
          user_id: user._id,
          draw_id: draw._id,
          match_count: matchCount,
          matched_numbers: matched,
          prize_tier: prizeTier,
          status: 'pending'
        });
      }
    }

    const prizePerTier = {
      gold: goldWinnerCount > 0 ? roundCurrency(draw.gold_pool_amount / goldWinnerCount) : 0,
      silver: silverWinnerCount > 0 ? roundCurrency(draw.silver_pool_amount / silverWinnerCount) : 0,
      bronze: bronzeWinnerCount > 0 ? roundCurrency(draw.bronze_pool_amount / bronzeWinnerCount) : 0,
    };

    const winnersWithPayout = winnersToCreate.map((winner) => ({
      ...winner,
      prize_amount: prizePerTier[winner.prize_tier] || 0,
    }));

    if (winnersWithPayout.length > 0) {
      await Winner.insertMany(winnersWithPayout);
    }

    draw.gold_winner_count = goldWinnerCount;
    draw.winner_count = winnersWithPayout.length;
    draw.jackpot_rollover_eligible = goldWinnerCount === 0;
    draw.jackpot_rollover_amount = goldWinnerCount === 0 ? draw.gold_pool_amount : 0;
    await draw.save();

    res.status(201).json({
      success: true,
      message: 'Draw generated successfully',
      draw,
      winners_count: winnersWithPayout.length,
      gold_winner_count: goldWinnerCount,
      jackpot_rollover_eligible: goldWinnerCount === 0,
      pool_breakdown: {
        total: draw.prize_pool_total,
        gold: draw.gold_pool_amount,
        silver: draw.silver_pool_amount,
        bronze: draw.bronze_pool_amount,
      }
    });
  } catch (error) {
    console.error('Run draw error:', error);
    res.status(500).json({ success: false, message: 'Error running draw' });
  }
};

// @route   PUT /api/draws/:id/publish  (admin)
const publishDraw = async (req, res) => {
  try {
    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data: draw, error: drawError } = await supabaseAdmin
        .from('draws')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select('*')
        .single();

      if (drawError || !draw) {
        return res.status(404).json({ success: false, message: 'Draw not found' });
      }

      await supabaseAdmin
        .from('winners')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('draw_id', draw.id);

      const { data: activeUsers = [] } = await supabaseAdmin
        .from('users_profile')
        .select('name, email')
        .eq('subscription_status', 'active')
        .eq('role', 'user');

      activeUsers.forEach((user) => {
        sendDrawResultsEmail({
          email: user.email,
          name: user.name,
          month: draw.month,
        }).catch((emailError) => console.error('Draw result email error:', emailError.message));
      });

      const { data: winners = [] } = await supabaseAdmin
        .from('winners')
        .select(`
          *,
          user:user_id ( name, email )
        `)
        .eq('draw_id', draw.id);

      winners.forEach((winner) => {
        if (!winner.user?.email) return;
        sendWinnerAlertEmail({
          email: winner.user.email,
          name: winner.user.name,
          tier: winner.prize_tier,
          amount: winner.prize_amount || 0,
          status: 'confirmed',
        }).catch((emailError) => console.error('Winner alert email error:', emailError.message));
      });

      return res.json({
        success: true,
        message: 'Draw published successfully',
        draw: {
          _id: draw.id,
          draw_numbers: draw.draw_numbers,
          month: draw.month,
          sequence: draw.sequence,
          date: draw.draw_date,
          status: draw.status,
          generation_mode: draw.generation_mode,
        }
      });
    }

    const draw = await Draw.findByIdAndUpdate(
      req.params.id,
      { status: 'published' },
      { new: true }
    );

    if (!draw) {
      return res.status(404).json({ success: false, message: 'Draw not found' });
    }

    // Update winners status to confirmed
    await Winner.updateMany({ draw_id: draw._id }, { status: 'confirmed' });

    const activeUsers = await User.find({ subscription_status: 'active', role: 'user' }).select('name email');
    activeUsers.forEach((user) => {
      sendDrawResultsEmail({
        email: user.email,
        name: user.name,
        month: draw.month,
      }).catch((error) => console.error('Draw result email error:', error.message));
    });

    const winners = await Winner.find({ draw_id: draw._id })
      .populate('user_id', 'name email');
    winners.forEach((winner) => {
      if (!winner.user_id?.email) return;
      sendWinnerAlertEmail({
        email: winner.user_id.email,
        name: winner.user_id.name,
        tier: winner.prize_tier,
        amount: winner.prize_amount || 0,
        status: 'confirmed',
      }).catch((error) => console.error('Winner alert email error:', error.message));
    });

    res.json({ success: true, message: 'Draw published successfully', draw });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error publishing draw' });
  }
};

// @route   GET /api/draws/all  (admin)
const getAllDraws = async (req, res) => {
  try {
    if (isSupabaseConfigured && req.user?.supabase_auth_id) {
      const { data, error } = await supabaseAdmin
        .from('draws')
        .select('*')
        .order('draw_date', { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, message: 'Error fetching draws' });
      }

      const draws = (data || []).map((draw) => ({
        _id: draw.id,
        draw_numbers: draw.draw_numbers || [],
        month: draw.month,
        sequence: draw.sequence,
        date: draw.draw_date,
        status: draw.status,
        generation_mode: draw.generation_mode,
        prize_pool_total: draw.prize_pool_total,
        bronze_pool_amount: draw.bronze_pool,
        silver_pool_amount: draw.silver_pool,
        gold_pool_amount: draw.gold_pool,
        jackpot_rollover_amount: draw.rollover_amount,
        jackpot_rollover_eligible: draw.jackpot_rollover_eligible,
      }));

      return res.json({ success: true, draws });
    }

    const draws = await Draw.find().sort({ date: -1, createdAt: -1 }).populate('triggered_by', 'name email');
    res.json({ success: true, draws });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching draws' });
  }
};

module.exports = { getDraws, getMyResults, uploadWinnerProof, runDraw, publishDraw, getAllDraws };
