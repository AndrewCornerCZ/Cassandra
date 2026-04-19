const express = require('express');
const router = express.Router();
const { getClient } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Middleware to check authentication
router.use(authMiddleware);

// GET /api/patients?lastName=&nationalId=
router.get('/', async (req, res) => {
  try {
    const { lastName, nationalId } = req.query;
    const client = await getClient();

    let query = 'SELECT * FROM patients';
    const params = [];

    if (lastName) {
      query += ' WHERE last_name = ?';
      params.push(lastName);
    } else if (nationalId) {
      query += ' WHERE national_id = ?';
      params.push(nationalId);
    } else {
      // Get all patients (limit for safety)
      query += ' LIMIT 100';
    }

    const result = await client.execute(query, params, { prepare: true });
    res.json(result.rows);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to get patients' });
  }
});

// GET /api/patients/:id
router.get('/:id', async (req, res) => {
  try {
    const client = await getClient();
    const result = await client.execute('SELECT * FROM patients WHERE patient_id = ?', [
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to get patient' });
  }
});

// POST /api/patients
router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      birth_date,
      national_id,
      blood_type,
      allergies,
      phone,
      email,
    } = req.body;

    if (!first_name || !last_name || !national_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await getClient();
    const patient_id = uuidv4();

    await client.execute(
      `INSERT INTO patients 
       (patient_id, first_name, last_name, birth_date, national_id, blood_type, allergies, phone, email, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id,
        first_name,
        last_name,
        birth_date,
        national_id,
        blood_type || null,
        allergies || [],
        phone,
        email,
        new Date(),
      ],
      { prepare: true }
    );

    // Log audit event
    await logAuditEvent(client, req, patient_id, 'CREATE', 'PATIENT', patient_id, null);

    res.status(201).json({
      patient_id,
      first_name,
      last_name,
      national_id,
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// PUT /api/patients/:id
router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, blood_type, allergies, phone, email } = req.body;

    const client = await getClient();

    // Get current data for audit
    const current = await client.execute('SELECT * FROM patients WHERE patient_id = ?', [
      req.params.id,
    ]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const changes = {};
    if (first_name && first_name !== current.rows[0].first_name)
      changes.first_name = `${current.rows[0].first_name} -> ${first_name}`;
    if (last_name && last_name !== current.rows[0].last_name)
      changes.last_name = `${current.rows[0].last_name} -> ${last_name}`;
    if (blood_type && blood_type !== current.rows[0].blood_type)
      changes.blood_type = `${current.rows[0].blood_type} -> ${blood_type}`;

    await client.execute(
      `UPDATE patients SET first_name = ?, last_name = ?, blood_type = ?, allergies = ?, phone = ?, email = ? WHERE patient_id = ?`,
      [
        first_name || current.rows[0].first_name,
        last_name || current.rows[0].last_name,
        blood_type || current.rows[0].blood_type,
        allergies || current.rows[0].allergies,
        phone || current.rows[0].phone,
        email || current.rows[0].email,
        req.params.id,
      ],
      { prepare: true }
    );

    await logAuditEvent(client, req, req.params.id, 'UPDATE', 'PATIENT', req.params.id, changes);

    res.json({ message: 'Patient updated' });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', async (req, res) => {
  try {
    const client = await getClient();
    await client.execute('DELETE FROM patients WHERE patient_id = ?', [req.params.id], {
      prepare: true,
    });

    await logAuditEvent(client, req, req.params.id, 'DELETE', 'PATIENT', req.params.id, null);

    res.json({ message: 'Patient deleted' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// GET /api/patients/:id/examinations
router.get('/:id/examinations', async (req, res) => {
  try {
    const client = await getClient();
    const result = await client.execute(
      'SELECT * FROM examinations_by_patient WHERE patient_id = ?',
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get examinations error:', error);
    res.status(500).json({ error: 'Failed to get examinations' });
  }
});

// POST /api/patients/:id/examinations
router.post('/:id/examinations', async (req, res) => {
  try {
    const { exam_id, doctor_id, doctor_name, diagnosis, notes, icd10_code, follow_up } = req.body;

    const client = await getClient();
    const exam_uuid = exam_id || uuidv4();
    const examined_at = new Date();

    await client.execute(
      `INSERT INTO examinations_by_patient 
       (patient_id, examined_at, exam_id, doctor_id, doctor_name, diagnosis, notes, icd10_code, follow_up) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.id,
        examined_at,
        exam_uuid,
        doctor_id,
        doctor_name,
        diagnosis,
        notes,
        icd10_code,
        follow_up,
      ],
      { prepare: true }
    );

    await logAuditEvent(client, req, req.params.id, 'CREATE', 'EXAMINATION', exam_uuid, null);

    res.status(201).json({
      exam_id: exam_uuid,
      examined_at,
    });
  } catch (error) {
    console.error('Create examination error:', error);
    res.status(500).json({ error: 'Failed to create examination' });
  }
});

// GET /api/patients/:id/prescriptions
router.get('/:id/prescriptions', async (req, res) => {
  try {
    const client = await getClient();
    const result = await client.execute(
      'SELECT * FROM prescriptions_by_patient WHERE patient_id = ?',
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: 'Failed to get prescriptions' });
  }
});

// POST /api/patients/:id/prescriptions
router.post('/:id/prescriptions', async (req, res) => {
  try {
    const { drug_id, drug_name, dosage, start_date, end_date, prescribed_by } = req.body;

    if (!drug_id || !drug_name) {
      return res.status(400).json({ error: 'Drug ID and name required' });
    }

    const client = await getClient();
    const start = new Date(start_date || new Date());

    await client.execute(
      `INSERT INTO prescriptions_by_patient 
       (patient_id, drug_id, drug_name, dosage, start_date, end_date, prescribed_by, active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, drug_id, drug_name, dosage, start, end_date, prescribed_by, true],
      { prepare: true }
    );

    // Update prescription stats
    const month = new Date().toISOString().substring(0, 7);
    await client.execute(
      `UPDATE prescription_stats SET count = count + 1 WHERE month = ? AND drug_id = ?`,
      [month, drug_id],
      { prepare: true }
    );

    await logAuditEvent(client, req, req.params.id, 'CREATE', 'PRESCRIPTION', drug_id, null);

    res.status(201).json({
      drug_id,
      drug_name,
      start_date: start,
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// POST /api/patients/:id/medications/log
router.post('/:id/medications/log', async (req, res) => {
  try {
    const { drug_id, dose_taken, administered_by, notes } = req.body;

    if (!drug_id) {
      return res.status(400).json({ error: 'Drug ID required' });
    }

    const client = await getClient();
    const taken_at = new Date();

    await client.execute(
      `INSERT INTO medication_log 
       (patient_id, drug_id, taken_at, dose_taken, administered_by, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.id, drug_id, taken_at, dose_taken, administered_by, notes],
      { prepare: true }
    );

    await logAuditEvent(client, req, req.params.id, 'LOG_MEDICATION', 'MEDICATION_LOG', drug_id, null);

    res.status(201).json({
      drug_id,
      taken_at,
    });
  } catch (error) {
    console.error('Log medication error:', error);
    res.status(500).json({ error: 'Failed to log medication' });
  }
});

// GET /api/patients/:id/medications/:drugId/log?days=30
router.get('/:id/medications/:drugId/log', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const client = await getClient();

    const result = await client.execute(
      'SELECT * FROM medication_log WHERE patient_id = ? AND drug_id = ? LIMIT 1000',
      [req.params.id, req.params.drugId]
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filtered = result.rows.filter((row) => new Date(row.taken_at) >= cutoffDate);

    res.json(filtered);
  } catch (error) {
    console.error('Get medication log error:', error);
    res.status(500).json({ error: 'Failed to get medication log' });
  }
});

// GET /api/patients/:id/audit?from=&to=&action=
router.get('/:id/audit', async (req, res) => {
  try {
    const { from, to, action } = req.query;
    const client = await getClient();

    const result = await client.execute(
      'SELECT * FROM patient_audit_log WHERE patient_id = ? LIMIT 1000',
      [req.params.id]
    );

    let filtered = result.rows;

    if (from || to) {
      filtered = filtered.filter((row) => {
        const eventTime = new Date(row.event_at);
        if (from && eventTime < new Date(from)) return false;
        if (to && eventTime > new Date(to)) return false;
        return true;
      });
    }

    if (action) {
      filtered = filtered.filter((row) => row.action === action);
    }

    res.json(filtered);
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to get audit log' });
  }
});

// GET /api/patients/:id/interaction-check
router.get('/:id/interaction-check', async (req, res) => {
  try {
    const client = await getClient();

    // Get active prescriptions
    const prescResult = await client.execute(
      'SELECT * FROM prescriptions_by_patient WHERE patient_id = ? AND active = true',
      [req.params.id]
    );

    const drugs = prescResult.rows.map((r) => r.drug_id);
    const interactions = [];

    // Check all pairs for interactions
    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const result = await client.execute(
          'SELECT * FROM drug_interactions WHERE drug_id_a = ? AND drug_id_b = ?',
          [drugs[i], drugs[j]]
        );

        if (result.rows.length > 0) {
          interactions.push(result.rows[0]);
        }
      }
    }

    res.json(interactions);
  } catch (error) {
    console.error('Interaction check error:', error);
    res.status(500).json({ error: 'Failed to check interactions' });
  }
});

// Helper function to log audit events
async function logAuditEvent(client, req, patientId, action, entityType, entityId, changes) {
  try {
    await client.execute(
      `INSERT INTO patient_audit_log 
       (patient_id, event_at, event_id, actor_id, actor_name, action, entity_type, entity_id, changes, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientId,
        new Date(),
        uuidv4(),
        req.user?.user_id || 'system',
        req.user?.username || 'system',
        action,
        entityType,
        entityId,
        changes || {},
        req.ip,
      ],
      { prepare: true }
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

module.exports = router;
