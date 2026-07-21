import Database from 'better-sqlite3';
import path from 'path';

// Store DB in the project root for the prototype
const dbPath = path.join(process.cwd(), 'casino.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
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

  CREATE TABLE IF NOT EXISTS play_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    game TEXT NOT NULL,
    bet REAL NOT NULL,
    win REAL NOT NULL,
    multiplier REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES accounts(id) ON DELETE CASCADE
  );
  
  CREATE TABLE IF NOT EXISTS deposits (
     txHash TEXT PRIMARY KEY,
     userId TEXT NOT NULL,
     amount REAL NOT NULL,
     timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY(userId) REFERENCES accounts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      showPrototypeMessages INTEGER DEFAULT 1,
      showDisclaimerScreen INTEGER DEFAULT 1
  );
  
  INSERT OR IGNORE INTO site_settings (id, showPrototypeMessages, showDisclaimerScreen) VALUES ('global', 1, 1);
`);

// Pre-seed admin if not exists
const checkAdmin = db.prepare('SELECT id FROM accounts WHERE username = ?');
if (!checkAdmin.get('admin')) {
  const insert = db.prepare(`
    INSERT INTO accounts (id, username, password, kycStatus, isAdmin, balance) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insert.run('admin-root-001', 'admin', 'adminpassword', 'approved', 1, 1000000);
}

export default db;
