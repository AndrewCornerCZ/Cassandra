const cassandra = require('cassandra-driver');
const client = new cassandra.Client({
  contactPoints: [process.env.CASSANDRA_HOSTS || '127.0.0.1'],
  localDataCenter: 'datacenter1',
});

const initDatabase = async () => {
  try {
    // Connect to Cassandra
    await client.connect();
    console.log('Connected to Cassandra');

    // Create keyspace
    const createKeyspaceQuery = `
      CREATE KEYSPACE IF NOT EXISTS ${process.env.CASSANDRA_KEYSPACE || 'medilog'}
      WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
    `;
    await client.execute(createKeyspaceQuery);
    console.log('Keyspace created or already exists');

    // Create tables
    const medilogClient = new cassandra.Client({
      contactPoints: [process.env.CASSANDRA_HOSTS || '127.0.0.1'],
      keyspace: process.env.CASSANDRA_KEYSPACE || 'medilog',
      localDataCenter: 'datacenter1',
    });
    await medilogClient.connect();

    // 1. Patients table
    await medilogClient.execute(`
      CREATE TABLE IF NOT EXISTS patients (
        patient_id TEXT PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        birth_date DATE,
        national_id TEXT,
        blood_type TEXT,
        allergies LIST<TEXT>,
        phone TEXT,
        email TEXT,
        created_at TIMESTAMP
      )
    `);
    console.log('✓ Table: patients');

    // 2. Examinations by patient (clustering by examined_at)
    await medilogClient.execute(`
      CREATE TABLE IF NOT EXISTS examinations_by_patient (
        patient_id TEXT,
        examined_at TIMESTAMP,
        exam_id TEXT,
        doctor_id TEXT,
        doctor_name TEXT,
        diagnosis TEXT,
        notes TEXT,
        icd10_code TEXT,
        follow_up TIMESTAMP,
        PRIMARY KEY (patient_id, examined_at)
      ) WITH CLUSTERING ORDER BY (examined_at DESC)
    `);
    console.log('✓ Table: examinations_by_patient');

    // 3. Prescriptions by patient
    await medilogClient.execute(`
      CREATE TABLE IF NOT EXISTS prescriptions_by_patient (
        patient_id TEXT,
        drug_id TEXT,
        drug_name TEXT,
        dosage TEXT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        prescribed_by TEXT,
        active BOOLEAN,
        PRIMARY KEY (patient_id, drug_id, start_date)
      ) WITH CLUSTERING ORDER BY (drug_id ASC, start_date DESC)
    `);
    console.log('✓ Table: prescriptions_by_patient');

    // 4. Medication log (with TTL of 90 days)
    await medilogClient.execute(`
      CREATE TABLE IF NOT EXISTS medication_log (
        patient_id TEXT,
        drug_id TEXT,
        taken_at TIMESTAMP,
        dose_taken TEXT,
        administered_by TEXT,
        notes TEXT,
        PRIMARY KEY (patient_id, drug_id, taken_at)
      ) WITH CLUSTERING ORDER BY (drug_id ASC, taken_at DESC)
        AND default_time_to_live = 7776000
    `);
    console.log('✓ Table: medication_log (with 90 day TTL)');

    // 5. Patient audit log
    await medilogClient.execute(`
      CREATE TABLE IF NOT EXISTS patient_audit_log (
        patient_id TEXT,
        event_at TIMESTAMP,
        event_id TEXT,
        actor_id TEXT,
        actor_name TEXT,
        action TEXT,
        entity_type TEXT,
        entity_id TEXT,
        changes MAP<TEXT, TEXT>,
        ip_address TEXT,
        PRIMARY KEY (patient_id, event_at)
      ) WITH CLUSTERING ORDER BY (event_at DESC)
    `);
    console.log('✓ Table: patient_audit_log');

    // 6. Appointments by doctor and day
    await medilogClient.execute(`
      CREATE TABLE IF NOT EXISTS appointments_by_doctor_day (
        doctor_id TEXT,
        appt_date TEXT,
        start_time TEXT,
        appt_id TEXT,
        patient_id TEXT,
        patient_name TEXT,
        reason TEXT,
        status TEXT,
        PRIMARY KEY ((doctor_id, appt_date), start_time)
      ) WITH CLUSTERING ORDER BY (start_time ASC)
    `);
    console.log('✓ Table: appointments_by_doctor_day');

    // 7. Drug interactions
    await medilogClient.execute(`
      CREATE TABLE IF NOT EXISTS drug_interactions (
        drug_id_a TEXT,
        drug_id_b TEXT,
        severity TEXT,
        description TEXT,
        PRIMARY KEY (drug_id_a, drug_id_b)
      )
    `);
    console.log('✓ Table: drug_interactions');

    // 8. Prescription statistics
    await medilogClient.execute(`
      CREATE TABLE IF NOT EXISTS prescription_stats (
        month TEXT,
        drug_id TEXT,
        drug_name TEXT,
        count INT,
        PRIMARY KEY (month, drug_id)
      )
    `);
    console.log('✓ Table: prescription_stats');

    // 9. Users table for authentication
    await medilogClient.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        username TEXT,
        password TEXT,
        role TEXT,
        doctor_id TEXT,
        created_at TIMESTAMP
      )
    `);
    console.log('✓ Table: users');

    // Create secondary index for username lookup
    await medilogClient.execute(`
      CREATE INDEX IF NOT EXISTS ON users (username)
    `);

    console.log('\n✅ Database initialization completed successfully');
    await medilogClient.shutdown();
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

module.exports = { initDatabase };
