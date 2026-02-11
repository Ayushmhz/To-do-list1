const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = {
    execute: async (text, params) => {
        const result = await pool.query(text, params);
        return [result.rows, result.fields];
    },
    pool
};
