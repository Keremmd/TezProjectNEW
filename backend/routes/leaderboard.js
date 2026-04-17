import express from 'express';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

/**
 * GET /api/leaderboard
 *
 * Returns the global learning-points leaderboard, computed by the
 * `public.get_learning_leaderboard` RPC in Supabase.
 *
 * Query params:
 *   - limit:  number of rows to return (default 20, max 100)
 *   - userId: optional; if supplied, the user's rank is included in the
 *             response even when they're outside the top N.
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );
    const userId = req.query.userId || null;

    const { data, error } = await supabase.rpc('get_learning_leaderboard', {
      limit_count: 100, // fetch wider so we can still find the current user
    });
    if (error) {
      console.error('Leaderboard RPC error:', error);
      return res.status(500).json({
        error: 'Failed to load leaderboard',
        message: error.message,
      });
    }

    const rows = (data || []).map((row, idx) => ({ ...row, rank: idx + 1 }));
    const top = rows.slice(0, limit);

    let currentUser = null;
    if (userId) {
      currentUser = rows.find((r) => r.user_id === userId) || null;
    }

    return res.json({
      success: true,
      leaderboard: top,
      currentUser,
      total: rows.length,
    });
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return res.status(500).json({
      error: 'Failed to load leaderboard',
      message: error.message,
    });
  }
});

export default router;
