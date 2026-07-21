import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureDb, mapAccountRow, mapSiteSettings } from '@/utils/db';
import { ethers } from 'ethers';
import speakeasy from 'speakeasy';

const provider = new ethers.JsonRpcProvider(
  `https://sepolia.infura.io/v3/3832ced86cbf489ca2a26c6359a54030`
);

function getField<T>(row: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return row[key] as T;
    }
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    await ensureDb();
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'register') {
      const { username, password, is2faEnabled } = payload;

      const checkUser = await sql`SELECT id FROM accounts WHERE username = ${username}`;
      if (checkUser.length > 0) {
        return NextResponse.json({ success: false, error: 'Username taken' }, { status: 400 });
      }

      const id = Math.random().toString(36).substring(2, 9);
      const wallet = ethers.Wallet.createRandom();

      await sql`
        INSERT INTO accounts (id, username, password, balance, depositWalletAddress, depositWalletPrivateKey, is2faEnabled)
        VALUES (${id}, ${username}, ${password}, 0, ${wallet.address}, ${wallet.privateKey}, ${is2faEnabled ? 1 : 0})
      `;

      return NextResponse.json({
        success: true,
        user: mapAccountRow({
          id,
          username,
          kycstatus: 'none',
          isadmin: 0,
          is2faenabled: is2faEnabled ? 1 : 0,
          balance: 0,
        }),
      });
    }

    if (action === 'login') {
      const { username, password } = payload;
      const users = await sql`
        SELECT id, username, kycStatus, isAdmin, is2faEnabled, balance, twoFactorSecret
        FROM accounts
        WHERE username = ${username} AND password = ${password}
      `;

      if (users.length === 0) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
      }

      const user = users[0] as Record<string, unknown>;
      const mapped = mapAccountRow(user);

      if (mapped.is2faEnabled) {
        return NextResponse.json({ success: true, requires2fa: true, userId: mapped.id });
      }

      return NextResponse.json({ success: true, user: mapped });
    }

    if (action === 'verify2FA') {
      const { userId, token } = payload;
      const users = await sql`
        SELECT twoFactorSecret, id, username, kycStatus, isAdmin, is2faEnabled, balance
        FROM accounts
        WHERE id = ${userId}
      `;

      const secret = getField<string>(users[0] as Record<string, unknown>, 'twofactorsecret', 'twoFactorSecret');
      if (users.length === 0 || !secret) {
        return NextResponse.json({ success: false, error: '2FA not setup' }, { status: 400 });
      }

      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
      });

      if (isValid) {
        return NextResponse.json({ success: true, user: mapAccountRow(users[0] as Record<string, unknown>) });
      }

      return NextResponse.json({ success: false, error: 'Invalid 2FA token' }, { status: 401 });
    }

    if (action === 'generate2FASecret') {
      const { userId } = payload;
      const secret = speakeasy.generateSecret({ name: `NeonCasino (${userId})` });

      await sql`UPDATE accounts SET twoFactorSecret = ${secret.base32} WHERE id = ${userId}`;

      return NextResponse.json({ success: true, secret: secret.base32, otpauth: secret.otpauth_url });
    }

    if (action === 'enable2FA') {
      const { userId, token } = payload;
      const users = await sql`SELECT twoFactorSecret FROM accounts WHERE id = ${userId}`;
      const twoFactorSecret = getField<string>(users[0] as Record<string, unknown>, 'twofactorsecret', 'twoFactorSecret');

      if (!twoFactorSecret) {
        return NextResponse.json({ success: false, error: '2FA not setup' });
      }

      const isValid = speakeasy.totp.verify({
        secret: twoFactorSecret,
        encoding: 'base32',
        token,
      });

      if (isValid) {
        await sql`UPDATE accounts SET is2faEnabled = 1 WHERE id = ${userId}`;
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ success: false, error: 'Invalid token' });
    }

    if (action === 'disable2FA') {
      const { userId } = payload;
      await sql`UPDATE accounts SET is2faEnabled = 0, twoFactorSecret = NULL WHERE id = ${userId}`;
      return NextResponse.json({ success: true });
    }

    if (action === 'getDepositInfo') {
      const { userId } = payload;
      const users = await sql`SELECT depositWalletAddress FROM accounts WHERE id = ${userId}`;
      const address = getField<string>(users[0] as Record<string, unknown>, 'depositwalletaddress', 'depositWalletAddress');

      if (!address) {
        return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
      }

      const balanceWei = await provider.getBalance(address);
      const balanceEth = ethers.formatEther(balanceWei);

      return NextResponse.json({ success: true, address, balance: balanceEth });
    }

    if (action === 'updateBalance') {
      const { id, amount } = payload;
      const result = await sql`
        UPDATE accounts SET balance = balance + ${amount} WHERE id = ${id} RETURNING balance
      `;
      return NextResponse.json({ success: true, balance: Number(result[0].balance) });
    }

    if (action === 'submitKYC') {
      const { id, doc } = payload;
      await sql`UPDATE accounts SET kycStatus = 'pending', kycDoc = ${doc} WHERE id = ${id}`;
      return NextResponse.json({ success: true });
    }

    if (action === 'approveKYC') {
      const { id } = payload;
      await sql`UPDATE accounts SET kycStatus = 'approved', kycDoc = NULL WHERE id = ${id}`;
      return NextResponse.json({ success: true });
    }

    if (action === 'rejectKYC') {
      const { id } = payload;
      await sql`UPDATE accounts SET kycStatus = 'none', kycDoc = NULL WHERE id = ${id}`;
      return NextResponse.json({ success: true });
    }

    if (action === 'getUser') {
      const { id } = payload;
      const users = await sql`
        SELECT id, username, kycStatus, kycDoc, isAdmin, is2faEnabled, balance
        FROM accounts
        WHERE id = ${id}
      `;
      if (users.length === 0) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, user: mapAccountRow(users[0] as Record<string, unknown>) });
    }

    if (action === 'logGame') {
      const { userId, game, bet, win, multiplier } = payload;
      await sql`
        INSERT INTO play_history (userId, game, bet, win, multiplier)
        VALUES (${userId}, ${game}, ${bet}, ${win}, ${multiplier})
      `;
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteAccount') {
      const { id } = payload;
      await sql`DELETE FROM play_history WHERE userId = ${id}`;
      await sql`DELETE FROM accounts WHERE id = ${id}`;
      return NextResponse.json({ success: true });
    }

    if (action === 'updateAccountSettings') {
      const { id, password, is2faEnabled } = payload;

      if (password) {
        await sql`
          UPDATE accounts SET password = ${password}, is2faEnabled = ${is2faEnabled ? 1 : 0}
          WHERE id = ${id}
        `;
      } else {
        await sql`UPDATE accounts SET is2faEnabled = ${is2faEnabled ? 1 : 0} WHERE id = ${id}`;
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'getHistory') {
      const { userId } = payload;
      const history = await sql`
        SELECT game, bet, win, multiplier, timestamp
        FROM play_history
        WHERE userId = ${userId}
        ORDER BY timestamp DESC
        LIMIT 50
      `;
      return NextResponse.json({
        success: true,
        history: history.map((row) => ({
          game: row.game,
          bet: Number(row.bet),
          win: Number(row.win),
          multiplier: Number(row.multiplier),
          timestamp: row.timestamp,
        })),
      });
    }

    if (action === 'getSiteSettings') {
      const settings = await sql`
        SELECT showPrototypeMessages, showDisclaimerScreen
        FROM site_settings
        WHERE id = 'global'
      `;
      return NextResponse.json({
        success: true,
        settings: mapSiteSettings(settings[0] as Record<string, unknown> | undefined),
      });
    }

    if (action === 'updateSiteSettings') {
      const { showPrototypeMessages, showDisclaimerScreen } = payload;
      await sql`
        UPDATE site_settings
        SET showPrototypeMessages = ${showPrototypeMessages ? 1 : 0},
            showDisclaimerScreen = ${showDisclaimerScreen ? 1 : 0}
        WHERE id = 'global'
      `;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Action failed:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Action failed', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
