import 'dotenv/config';
import * as mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema';

const g = globalThis as any;

export const pool = g.__POOL__ ?? mysql.createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: 'root',
  database: process.env.DB_NAME!,
  connectionLimit: 10,
  // optional: waitForConnections: true,
});
if (!g.__POOL__) g.__POOL__ = pool;

export const db = drizzle(pool, { schema, mode: 'default' });
