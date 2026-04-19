const express = require('express');
const router = express.Router();
const { getClient } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/analytics/prescriptions?month=YYYY-MM
router.get('/prescriptions', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().substring(0, 7);
    const client = await getClient();

    const result = await client.execute(
      'SELECT * FROM prescription_stats WHERE month = ?',
      [month]
    );

    res.json(
      result.rows.map((row) => ({
        drug_id: row.drug_id,
        drug_name: row.drug_name,
        count: row.count,
      }))
    );
  } catch (error) {
    console.error('Get prescription stats error:', error);
    res.status(500).json({ error: 'Failed to get prescription stats' });
  }
});

// GET /api/analytics/diagnoses?month=YYYY-MM
router.get('/diagnoses', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().substring(0, 7);
    const client = await getClient();

    // Get all patients' examinations and aggregate by ICD10 code
    const patients = await client.execute('SELECT patient_id FROM patients LIMIT 1000');

    const diagnoses = {};

    for (const patient of patients.rows) {
      const result = await client.execute(
        'SELECT icd10_code FROM examinations_by_patient WHERE patient_id = ?',
        [patient.patient_id]
      );

      for (const exam of result.rows) {
        if (exam.icd10_code) {
          diagnoses[exam.icd10_code] = (diagnoses[exam.icd10_code] || 0) + 1;
        }
      }
    }

    const stats = Object.entries(diagnoses).map(([code, count]) => ({
      icd10_code: code,
      count,
    }));

    res.json(stats);
  } catch (error) {
    console.error('Get diagnosis stats error:', error);
    res.status(500).json({ error: 'Failed to get diagnosis stats' });
  }
});

module.exports = router;
