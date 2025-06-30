/**
 * Database configuration for PostgreSQL
 */

const { Pool } = require('pg');

// Database configuration
let config;

// Use DATABASE_URL if available (Railway/Heroku style)
if (process.env.DATABASE_URL) {
  // Parse DATABASE_URL to handle Railway's internal hostname issue
  const databaseUrl = process.env.DATABASE_URL;
  
  // Replace internal Railway hostname with public hostname if needed
  const fixedUrl = databaseUrl.replace('postgres.railway.internal', 'postgres.railway.internal');
  
  config = {
    connectionString: fixedUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
    connectionTimeoutMillis: 5000, // increased timeout for Railway
  };
  
  console.log('🔗 Using DATABASE_URL for connection');
  console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
} else {
  // Fallback to individual environment variables
  config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'smart_village',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
    connectionTimeoutMillis: 5000, // increased timeout
  };
  
  console.log('🔗 Using individual environment variables for connection');
}

// Create connection pool
const pool = new Pool(config);

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err);
  // Don't exit immediately, try to reconnect
});

// Handle pool connect events
pool.on('connect', (client) => {
  console.log('✅ New client connected to database');
});

// Database query helper with retry logic
const query = async (text, params, retries = 3) => {
  const start = Date.now();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Executed query', { text, duration, rows: res.rowCount });
      }
      
      return res;
    } catch (error) {
      console.error(`❌ Database query error (attempt ${attempt}/${retries}):`, error.message);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Get a client from the pool
const getClient = async () => {
  return await pool.connect();
};

// Transaction helper
const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Health check function
const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as db_version');
    return {
      status: 'connected',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].db_version,
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  }
};

// Close all connections
const end = async () => {
  console.log('🔌 Closing database connections...');
  await pool.end();
  console.log('✅ Database connections closed');
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, closing database connections...');
  await end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, closing database connections...');
  await end();
  process.exit(0);
});

module.exports = {
  query,
  getClient,
  transaction,
  healthCheck,
  end,
  pool
};

