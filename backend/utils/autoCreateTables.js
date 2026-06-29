const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

/**
 * Automatically checks and creates the required PostgreSQL tables
 * if they are missing in the Supabase database.
 * Requires DB_PASSWORD to be defined in .env.
 */
const autoCreateTables = async () => {
  const supabase = require('../config/supabase');
  
  try {
    // Use a regular select (not head) because HEAD requests return 204/null even for missing tables
    const { error } = await supabase.from('admins').select('id').limit(1);
    
    if (!error) {
      console.log('Supabase tables verification: OK (tables exist).');
      return true;
    }

    // PGRST202 = function not found, PGRST205 = table/view not found in schema cache
    const missingCodes = ['PGRST202', 'PGRST205'];
    if (!missingCodes.includes(error.code) && !error.message.includes('does not exist') && !error.message.includes('schema cache')) {
      console.log(`Supabase verification query returned unexpected error: ${error.message} (Code: ${error.code})`);
      return false;
    }

    console.log('Supabase tables are missing! Attempting automatic table creation...');

    // 2. Resolve database password
    const dbPassword = process.env.DB_PASSWORD;
    if (!dbPassword) {
      console.warn('--------------------------------------------------------------------------------');
      console.warn('⚠️  AUTOMATIC TABLE CREATION FAILED: DB_PASSWORD is not defined in backend/.env');
      console.warn('To resolve this, please either:');
      console.warn(' 1. Paste and run backend/schema.sql inside your Supabase Project SQL Editor.');
      console.warn(' 2. Define DB_PASSWORD=your_database_password in backend/.env to auto-create on startup.');
      console.warn('--------------------------------------------------------------------------------');
      return false;
    }

    // 3. Extract project reference from SUPABASE_URL
    // e.g. https://poxgptgwjwukwqspbopz.supabase.co -> poxgptgwjwukwqspbopz
    const supabaseUrl = process.env.SUPABASE_URL;
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    
    // We connect to the Supavisor Pooler Host since it supports IPv4 connectivity
    const poolerHost = `aws-0-ap-south-1.pooler.supabase.com`;
    
    console.log(`Connecting to Supabase PostgreSQL pooler at ${poolerHost}...`);
    
    const client = new Client({
      host: poolerHost,
      port: 5432, // Session mode
      user: `postgres.${projectRef}`,
      password: dbPassword,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');

    // 4. Read schema.sql
    const schemaPath = path.join(__dirname, '../schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // 5. Execute SQL queries
    console.log('Executing schema.sql queries...');
    await client.query(sql);
    console.log('✅ Database tables created successfully!');

    await client.end();
    return true;
  } catch (err) {
    console.error('❌ Failed to automatically create database tables:', err.message);
    return false;
  }
};

module.exports = autoCreateTables;
