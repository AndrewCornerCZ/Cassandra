const express = require('express');
const router = express.Router();
const { getClient } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.use(authMiddleware);

// GET /api/drugs/:id1/interactions/:id2
router.get('/:id1/interactions/:id2', async (req, res) => {
  try {
    const { id1, id2 } = req.params;
    const client = await getClient();

    // Check both directions
    let result = await client.execute(
      'SELECT * FROM drug_interactions WHERE drug_id_a = ? AND drug_id_b = ?',
      [id1, id2]
    );

    if (result.rows.length === 0) {
      result = await client.execute(
        'SELECT * FROM drug_interactions WHERE drug_id_a = ? AND drug_id_b = ?',
        [id2, id1]
      );
    }

    if (result.rows.length === 0) {
      return res.json({ interaction: null });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get interaction error:', error);
    res.status(500).json({ error: 'Failed to get interaction' });
  }
});

module.exports = router;
