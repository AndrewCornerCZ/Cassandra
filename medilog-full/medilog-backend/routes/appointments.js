const express = require('express');
const router = express.Router();
const { getClient } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.use(authMiddleware);

// GET /api/doctors/:id/appointments?date=YYYY-MM-DD
router.get('/:id/appointments', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date parameter required (YYYY-MM-DD)' });
    }

    const client = await getClient();
    
    const result = await client.execute(
      'SELECT * FROM appointments_by_doctor_day WHERE doctor_id = ? AND appt_date = ?',
      [req.params.id, date],
      { prepare: true }
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to get appointments' });
  }
});

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const {
      doctor_id,
      appt_date,
      start_time,
      patient_id,
      patient_name,
      reason,
      status,
    } = req.body;

    if (!doctor_id || !appt_date || !start_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await getClient();
    const appt_id = uuidv4();

    await client.execute(
      `INSERT INTO appointments_by_doctor_day 
       (doctor_id, appt_date, start_time, appt_id, patient_id, patient_name, reason, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doctor_id,
        appt_date,
        start_time,
        appt_id,
        patient_id,
        patient_name,
        reason,
        status || 'scheduled',
      ],
      { prepare: true }
    );

    res.status(201).json({
      appt_id,
      doctor_id,
      appt_date,
      start_time,
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// PUT /api/appointments/:id
router.put('/:id', async (req, res) => {
  try {
    const { doctor_id, appt_date, start_time, status } = req.body;

    if (!doctor_id || !appt_date || !start_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await getClient();

    await client.execute(
      `UPDATE appointments_by_doctor_day 
       SET status = ? 
       WHERE doctor_id = ? AND appt_date = ? AND start_time = ?`,
      [status || 'scheduled', doctor_id, appt_date, start_time],
      { prepare: true }
    );

    res.json({ message: 'Appointment updated' });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

module.exports = router;
