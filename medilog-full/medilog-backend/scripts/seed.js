const { getClient } = require('../db/connection');
const { initDatabase } = require('../db/init');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Initialize database first
    console.log('🔧 Initializing database...');
    await initDatabase();
    console.log('✓ Database initialized');

    const client = await getClient();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    try {
      await client.execute('TRUNCATE users');
      await client.execute('TRUNCATE patients');
      await client.execute('TRUNCATE examinations_by_patient');
      await client.execute('TRUNCATE prescriptions_by_patient');
      await client.execute('TRUNCATE medication_log');
      await client.execute('TRUNCATE patient_audit_log');
      await client.execute('TRUNCATE appointments_by_doctor_day');
      await client.execute('TRUNCATE drug_interactions');
      await client.execute('TRUNCATE prescription_stats');
    } catch (error) {
      console.warn('⚠️ Could not clear all tables (some may not exist yet):', error.message);
    }

    // Create users for testing
    console.log('\n👥 Creating test users...');
    const doctorId = uuidv4();
    const nurseId = uuidv4();

    await client.execute(
      `INSERT INTO users (user_id, username, password, role, doctor_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [doctorId, 'dr_novak', 'password123', 'doctor', doctorId, new Date()],
      { prepare: true }
    );

    await client.execute(
      `INSERT INTO users (user_id, username, password, role, doctor_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nurseId, 'nurse_jana', 'password123', 'nurse', null, new Date()],
      { prepare: true }
    );

    console.log(`   ✓ dr_novak (doctor)`);
    console.log(`   ✓ nurse_jana (nurse)`);

    // Create patients
    console.log('\n🏥 Creating test patients...');
    const patients = [
      {
        patient_id: uuidv4(),
        first_name: 'Jan',
        last_name: 'Svoboda',
        birth_date: new Date('1965-03-15'),
        national_id: '6503151234',
        blood_type: 'O+',
        allergies: ['Penicillin', 'Pollen'],
        phone: '+420 728 123 456',
        email: 'jan.svoboda@email.cz',
      },
      {
        patient_id: uuidv4(),
        first_name: 'Marie',
        last_name: 'Nováková',
        birth_date: new Date('1978-07-22'),
        national_id: '7807221567',
        blood_type: 'A+',
        allergies: ['Aspirin'],
        phone: '+420 729 234 567',
        email: 'marie.novakova@email.cz',
      },
      {
        patient_id: uuidv4(),
        first_name: 'Petr',
        last_name: 'Kučera',
        birth_date: new Date('1992-11-08'),
        national_id: '9211081890',
        blood_type: 'B+',
        allergies: [],
        phone: '+420 730 345 678',
        email: 'petr.kucera@email.cz',
      },
    ];

    for (const patient of patients) {
      await client.execute(
        `INSERT INTO patients 
         (patient_id, first_name, last_name, birth_date, national_id, blood_type, allergies, phone, email, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patient.patient_id,
          patient.first_name,
          patient.last_name,
          patient.birth_date,
          patient.national_id,
          patient.blood_type,
          patient.allergies,
          patient.phone,
          patient.email,
          new Date(),
        ],
        { prepare: true }
      );
      console.log(`   ✓ ${patient.first_name} ${patient.last_name}`);
    }

    // Create examinations
    console.log('\n🔍 Creating test examinations...');
    const examDate = new Date();
    examDate.setDate(examDate.getDate() - 5);

    for (const patient of patients) {
      await client.execute(
        `INSERT INTO examinations_by_patient 
         (patient_id, examined_at, exam_id, doctor_id, doctor_name, diagnosis, notes, icd10_code, follow_up) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patient.patient_id,
          examDate,
          uuidv4(),
          doctorId,
          'Dr. Novák',
          'Routine examination',
          'Patient in good health',
          'Z00.00',
          null,
        ],
        { prepare: true }
      );
    }
    console.log(`   ✓ Created 3 examinations`);

    // Create prescriptions
    console.log('\n💊 Creating test prescriptions...');
    const drugs = [
      { drug_id: 'drug_001', drug_name: 'Paracetamol', dosage: '500mg x3' },
      { drug_id: 'drug_002', drug_name: 'Ibuprofen', dosage: '400mg x2' },
      { drug_id: 'drug_003', drug_name: 'Amoxicillin', dosage: '500mg x3' },
    ];

    for (let i = 0; i < patients.length; i++) {
      const drug = drugs[i % drugs.length];
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10);

      await client.execute(
        `INSERT INTO prescriptions_by_patient 
         (patient_id, drug_id, drug_name, dosage, start_date, end_date, prescribed_by, active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patients[i].patient_id,
          drug.drug_id,
          drug.drug_name,
          drug.dosage,
          startDate,
          endDate,
          doctorId,
          true,
        ],
        { prepare: true }
      );

      // Update prescription stats (insert if not exists)
      const month = new Date().toISOString().substring(0, 7);
      try {
        await client.execute(
          `INSERT INTO prescription_stats (month, drug_id, drug_name, count) VALUES (?, ?, ?, 1) IF NOT EXISTS`,
          [month, drug.drug_id, drug.drug_name],
          { prepare: true }
        );
      } catch (err) {
        // If it already exists, just continue
        console.log('   ℹ️ Stat already exists, skipping insert');
      }
    }
    console.log(`   ✓ Created 3 prescriptions`);

    // Create medication logs
    console.log('\n📝 Creating test medication logs...');
    for (const patient of patients) {
      const drug = drugs[0];
      const logDate = new Date();

      await client.execute(
        `INSERT INTO medication_log 
         (patient_id, drug_id, taken_at, dose_taken, administered_by, notes) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          patient.patient_id,
          drug.drug_id,
          logDate,
          '500mg',
          'patient_self',
          'Taken with breakfast',
        ],
        { prepare: true }
      );
    }
    console.log(`   ✓ Created 3 medication logs`);

    // Create drug interactions
    console.log('\n⚠️  Creating drug interactions...');
    await client.execute(
      `INSERT INTO drug_interactions 
       (drug_id_a, drug_id_b, severity, description) 
       VALUES (?, ?, ?, ?)`,
      [
        'drug_001',
        'drug_002',
        'moderate',
        'Both are analgesics - may cause overdose risk',
      ],
      { prepare: true }
    );

    await client.execute(
      `INSERT INTO drug_interactions 
       (drug_id_a, drug_id_b, severity, description) 
       VALUES (?, ?, ?, ?)`,
      [
        'drug_002',
        'drug_003',
        'low',
        'No significant interaction reported',
      ],
      { prepare: true }
    );
    console.log(`   ✓ Created 2 drug interactions`);

    // Create appointments
    console.log('\n📅 Creating test appointments...');
    const apptDate = new Date();
    const apptDateStr = apptDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const times = ['09:00', '10:30', '14:00'];

    for (let i = 0; i < patients.length; i++) {
      await client.execute(
        `INSERT INTO appointments_by_doctor_day 
         (doctor_id, appt_date, start_time, appt_id, patient_id, patient_name, reason, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          doctorId,
          apptDateStr,
          times[i],
          uuidv4(),
          patients[i].patient_id,
          `${patients[i].first_name} ${patients[i].last_name}`,
          'Routine checkup',
          'scheduled',
        ],
        { prepare: true }
      );
    }
    console.log(`   ✓ Created 3 appointments`);

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('Test credentials:');
    console.log('  Doctor: dr_novak / password123');
    console.log('  Nurse: nurse_jana / password123\n');

    await client.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
