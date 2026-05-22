import { Pool } from "pg"
import config from "../config/config"
export const pool = new Pool({
    connectionString: config.connectionString
})

export const initDB = async () => {
    try {
        await pool.query(
            `
            CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'contributor',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )`
        )
        console.log("DB Created successfully")
        await pool.query(
            `
            CREATE TABLE IF NOT EXISTS issues (
            id SERIAL PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            description TEXT NOT NULL CHECK (char_length(description) >= 20),
            type VARCHAR(20) NOT NULL CHECK (type IN ('bug','feature_request')),
            status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
            reporter_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW());
            `
        )
    } catch (error) {
    console.log(error)
  }
}