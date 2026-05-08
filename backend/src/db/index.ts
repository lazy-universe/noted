import { Pool } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
});

export const query = async (text: string, params?: any[]) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err: any) {
    logger.error(err, 'Database query error');
    throw err;
  }
};

export default pool;
