"use client";

import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let sql: NeonQueryFunction<false, false>;
let initPromise: Promise<void> | null = null;

async function initSchema() {
    console.log("Checking/Initializing database schema with Neon...");
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS accounts (
              id TEXT PRIMARY KEY,
              username TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL,
              kycStatus TEXT NOT NULL DEFAULT 'none',
              kycDoc TEXT,
              isAdmin INTEGER NOT NULL DEFAULT 0,
              is2faEnabled INTEGER NOT NULL DEFAULT 0,
              twoFactorSecret TEXT,
              balance REAL NOT NULL DEFAULT 0,
              depositWalletAddress TEXT,
              depositWalletPrivateKey TEXT
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS play_history (
              id SERIAL PRIMARY KEY,
              userId TEXT NOT NULL,
              game TEXT NOT NULL,
              bet REAL NOT NULL,
              win REAL NOT NULL,
              multiplier REAL NOT NULL,
              timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(userId) REFERENCES accounts(id) ON DELETE CASCADE
            );
        `;
      
        await sql`
            CREATE TABLE IF NOT EXISTS deposits (
               txHash TEXT PRIMARY KEY,
               userId TEXT NOT NULL,
               amount REAL NOT NULL,
               timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               FOREIGN KEY(userId) REFERENCES accounts(id) ON DELETE CASCADE
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS site_settings (
                id TEXT PRIMARY KEY,
                showPrototypeMessages INTEGER DEFAULT 1,
                showDisclaimerScreen INTEGER DEFAULT 1
            );
        `;
      
        await sql`
            INSERT INTO site_settings (id, showPrototypeMessages, showDisclaimerScreen) 
            VALUES ('global', 1, 1)
            ON CONFLICT (id) DO NOTHING;
        `;

        const adminExists = await sql`SELECT id FROM accounts WHERE username = 'admin'`;
        if (adminExists.length === 0) {
            await sql`
                INSERT INTO accounts (id, username, password, kycStatus, isAdmin, balance) 
                VALUES ('admin-root-001', 'admin', 'adminpassword', 'approved', 1, 1000000)
            `;
        }
        console.log("Database schema is ready.");
    } catch (error) {
        console.error("Failed to initialize Neon DB schema:", error);
        throw error;
    }
}

const initializeConnection = () => {
    if (!initPromise) {
        console.log("Initializing Neon DB connection for the first time...");
        initPromise = (async () => {
            const databaseUrl = process.env.DATABASE_URL;
            if (!databaseUrl) {
                console.error('FATAL: DATABASE_URL environment variable is not set.');
                throw new Error('DATABASE_URL environment variable is not set.');
            }
            sql = neon(databaseUrl);
            await initSchema();
        })();
    }
    return initPromise;
};

export const getDb = async () => {
    await initializeConnection();
    return sql;
};
