import express from 'express';
import { runQuery } from '../services/neo4jService.js';

const router = express.Router();

// Route: GET /api/user/:userId/status
router.get('/:userId/status', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await runQuery(
      `MATCH (u:User {id: $userId}) RETURN u.premium AS premium`,
      { userId }
    );

    const premium = result.records[0]?.get('premium') || false;
    res.json({ premium });
  } catch (err) {
    console.error('Error fetching premium status:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
