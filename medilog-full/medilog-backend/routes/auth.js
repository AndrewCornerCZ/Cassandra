const express = require('express');
const router = express.Router();
const { getClient } = require('../db/connection');
const { generateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const client = await getClient();
    const result = await client.execute(
      'SELECT * FROM users WHERE username = ?',
      [username],
      { prepare: true }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    // In production, use bcrypt for password hashing
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        doctor_id: user.doctor_id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/register (for testing purposes)
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, doctor_id } = req.body;
    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ error: 'Username, password, and role required' });
    }

    const client = await getClient();
    const user_id = uuidv4();

    await client.execute(
      'INSERT INTO users (user_id, username, password, role, doctor_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, username, password, role, doctor_id || null, new Date()],
      { prepare: true }
    );

    res.status(201).json({
      user_id,
      username,
      role,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message.includes('Duplicate')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;
