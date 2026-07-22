// Run this in your Neon console or use psql to execute these commands:

// Add missing columns to accounts table if they don't exist
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS lastDailyRewardDate TEXT;

// Add missing column to site_settings table if it doesn't exist
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS autoApproveKYC INTEGER NOT NULL DEFAULT 0;

// Update the global settings
UPDATE site_settings SET autoApproveKYC = 0 WHERE id = 'global';
