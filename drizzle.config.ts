import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'mysql',              // WAJIB
  schema: './src/db/schema.ts',  // atau path lo sendiri
  out: './drizzle',
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: +(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER!,
    password: 'root',
    database: process.env.DB_NAME!,
    // ssl: 'prefer' // kalau butuh (mis. MySQL managed)
  },
  // catatan: JANGAN pakai driver: "mysql2" di sini
})
