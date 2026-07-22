import 'server-only';
import { neon } from '@neondatabase/serverless';
import type { NeonQueryFunction } from '@neondatabase/serverless';

let sqlInstance: NeonQueryFunction<false, false> | null = null;
let initPromise: Promise<void> | null = null;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add your Neon connection string to .env.local (see .env.example).'
    );
  }
  return url;
}

export function getSql(): NeonQueryFunction<false, false> {
  if (!sqlInstance) {
    sqlInstance = neon(getDatabaseUrl());
  }
  return sqlInstance;
}

// Lazy tagged-template wrapper so builds without DATABASE_URL still compile.
export const sql = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  getSql()(strings, ...(values as never[]))) as NeonQueryFunction<false, false>;

export function mapAccountRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    username: String(row.username),
    password: row.password ? String(row.password) : undefined,
    kycStatus: String(row.kycstatus ?? row.kycStatus ?? 'none'),
    kycDoc: (row.kycdoc ?? row.kycDoc) as string | undefined,
    isAdmin: Boolean(row.isadmin ?? row.isAdmin),
    is2faEnabled: Boolean(row.is2faenabled ?? row.is2faEnabled),
    balance: Number(row.balance ?? 0),
  };
}

export function mapSiteSettings(row: Record<string, unknown> | undefined) {
  return {
    showPrototypeMessages: Boolean(row?.showprototypemessages ?? row?.showPrototypeMessages ?? true),
    showDisclaimerScreen: Boolean(row?.showdisclaimerscreen ?? row?.showDisclaimerScreen ?? true),
    autoApproveKYC: Boolean(row?.autoapprovkyc ?? row?.autoApproveKYC ?? false),
  };
}

export async function initDb() {
  const db = getSql();

  await db`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      kycStatus TEXT NOT NULL DEFAULT 'none',
      kycDoc TEXT,
      isAdmin INTEGER NOT NULL DEFAULT 0,
      is2faEnabled INTEGER NOT NULL DEFAULT 0,
      twoFactorSecret TEXT,
      balance DOUBLE PRECISION NOT NULL DEFAULT 0,
      depositWalletAddress TEXT,
      depositWalletPrivateKey TEXT,
      lastDailyRewardDate TEXT
    );
  `;

  await db`
    CREATE TABLE IF NOT EXISTS play_history (
      id SERIAL PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      game TEXT NOT NULL,
      bet DOUBLE PRECISION NOT NULL,
      win DOUBLE PRECISION NOT NULL,
      multiplier DOUBLE PRECISION NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await db`
    CREATE TABLE IF NOT EXISTS deposits (
      txHash TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      amount DOUBLE PRECISION NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await db`
    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      showPrototypeMessages INTEGER NOT NULL DEFAULT 1,
      showDisclaimerScreen INTEGER NOT NULL DEFAULT 1,
      autoApproveKYC INTEGER NOT NULL DEFAULT 0
    );
  `;

  await db`
    INSERT INTO site_settings (id, showPrototypeMessages, showDisclaimerScreen, autoApproveKYC)
    VALUES ('global', 1, 1, 0)
    ON CONFLICT (id) DO NOTHING;
  `;

  await db`
    CREATE TABLE IF NOT EXISTS game_odds (
      gameName TEXT PRIMARY KEY,
      houseEdge DOUBLE PRECISION NOT NULL DEFAULT 0.05,
      multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0,
      enabled INTEGER NOT NULL DEFAULT 1,
      updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // Initialize default game odds
  const defaultGames = ['slots', 'crash', 'coinflip', 'roulette', 'dice', 'blackjack', 'hilo', 'keno', 'mines', 'plinko', 'video-poker', 'baccarat', 'tower', 'wheel'];
  for (const game of defaultGames) {
    await db`
      INSERT INTO game_odds (gameName, houseEdge, multiplier, enabled)
      VALUES (${game}, 0.05, 1.0, 1)
      ON CONFLICT (gameName) DO NOTHING;
    `;
  }

  const adminExists = await db`SELECT id FROM accounts WHERE username = 'admin'`;
  if (adminExists.length === 0) {
    await db`
      INSERT INTO accounts (id, username, password, kycStatus, isAdmin, balance)
      VALUES ('admin-root-001', 'admin', 'adminpassword', 'approved', 1, 1000000)
    `;
  }
}

export async function ensureDb() {
  if (!initPromise) {
    initPromise = initDb().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}
