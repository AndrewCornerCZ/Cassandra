require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db/init');
const { getClient, closeClient } = require('./db/connection');
const { authMiddleware } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
let dbInitialized = false;

app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      return res.status(500).json({ error: 'Database initialization failed' });
    }
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/appointments'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/drugs', require('./routes/drugs'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: dbInitialized ? 'initialized' : 'initializing' });
});

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log(`🚀 MediLog Backend běží na http://localhost:${PORT}`);
  console.log(`📊 Cassandra Keyspace: ${process.env.CASSANDRA_KEYSPACE}`);
  console.log(`🔧 Prostředí: ${NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully');
  server.close(async () => {
    try {
      await closeClient();
      console.log('✅ Server shut down successfully');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  console.log('⚠️  SIGINT received, shutting down gracefully');
  server.close(async () => {
    try {
      await closeClient();
      console.log('✅ Server shut down successfully');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  });
});

module.exports = app;
