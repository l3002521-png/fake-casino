import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/utils/db';
import { ethers } from 'ethers';
import speakeasy from 'speakeasy';

// Setup provider for Sepolia testnet
const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/3832ced86cbf489ca2a26c6359a54030`);

export async function POST(req: NextRequest) {
  try {
    const sql = await getDb();
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'register') {
      const { username, password, is2faEnabled } = payload;
      
      const checkUser = await sql`SELECT id FROM accounts WHERE username = ${username}`;
      if (checkUser.length > 0) {
         return NextResponse.json({ success: false, error: "Username taken" }, { status: 400 });
      }

      const id = Math.random().toString(36).substring(2, 9);
      const wallet = ethers.Wallet.createRandom();

      await sql`
        INSERT INTO accounts (id, username, password, balance, depositWalletAddress, depositWalletPrivateKey, is2faEnabled) 
        VALUES (${id}, ${username}, ${password}, 0, ${wallet.address}, ${wallet.privateKey}, ${is2faEnabled ? 1 : 0})
      `;
      
      return NextResponse.json({ success: true, user: { id, username, kycStatus: 'none', balance: 0, isAdmin: 0, is2faEnabled: is2faEnabled ? 1 : 0 } });
    }

    if (action === 'login') {
      const { username, password } = payload;
      const users = await sql`SELECT id, username, kycStatus, isAdmin, is2faEnabled, balance, twoFactorSecret FROM accounts WHERE username = ${username} AND password = ${password}`;
      
      if (users.length === 0) {
        return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
      }
      
      const user = users[0];
      
      if (user.is2faenabled === 1 || user.is2faEnabled === 1 || user.is2faEnabled === true) {
          return NextResponse.json({ success: true, requires2fa: true, userId: user.id });
      }
      
      // Remove sensitive data before sending back
      const { twoFactorSecret, ...safeUser } = user;
      return NextResponse.json({ success: true, user: { ...safeUser, isAdmin: Boolean(safeUser.isadmin || safeUser.isAdmin), is2faEnabled: Boolean(safeUser.is2faenabled || safeUser.is2faEnabled) } });
    }

    if (action === 'verify2FA') {
        const { userId, token } = payload;
        const users = await sql`SELECT twoFactorSecret, id, username, kycStatus, isAdmin, is2faEnabled, balance FROM accounts WHERE id = ${userId}`;
        
        if (users.length === 0 || !users[0].twofactorsecret) return NextResponse.json({ success: false, error: "2FA not setup" }, { status: 400 });
        
        const user = users[0];
        const isValid = speakeasy.totp.verify({
            secret: user.twofactorsecret,
            encoding: 'base32',
            token: token
        });

        if (isValid) {
            const { twofactorsecret, ...safeUser } = user;
            return NextResponse.json({ success: true, user: { ...safeUser, isAdmin: Boolean(safeUser.isadmin || safeUser.isAdmin), is2faEnabled: Boolean(safeUser.is2faenabled || safeUser.is2faEnabled) } });
        } else {
            return NextResponse.json({ success: false, error: "Invalid 2FA token" }, { status: 401 });
        }
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
        const twoFactorSecret = users[0]?.twofactorsecret;

        const isValid = speakeasy.totp.verify({
            secret: twoFactorSecret,
            encoding: 'base32',
            token: token
        });
        
        if (isValid) {
            await sql`UPDATE accounts SET is2faEnabled = 1 WHERE id = ${userId}`;
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: "Invalid token" });
        }
    }

    if (action === 'disable2FA') {
        const { userId } = payload;
        await sql`UPDATE accounts SET is2faEnabled = 0, twoFactorSecret = NULL WHERE id = ${userId}`;
        return NextResponse.json({ success: true });
    }

    if (action === 'getDepositInfo') {
        const { userId } = payload;
        const users = await sql`SELECT depositWalletAddress FROM accounts WHERE id = ${userId}`;
        const address = users[0]?.depositwalletaddress;

        if (!address) return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
        
        const balanceWei = await provider.getBalance(address);
        const balanceEth = ethers.formatEther(balanceWei);

        return NextResponse.json({ success: true, address, balance: balanceEth });
    }

    if (action === 'updateBalance') {
      const { id, amount } = payload;
      const result = await sql`UPDATE accounts SET balance = balance + ${amount} WHERE id = ${id} RETURNING balance`;
      return NextResponse.json({ success: true, balance: result[0].balance });
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
      const users = await sql`SELECT id, username, kycStatus, kycDoc, isAdmin, is2faEnabled, balance FROM accounts WHERE id = ${id}`;
      return NextResponse.json({ success: true, user: users[0] });
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
            await sql`UPDATE accounts SET password = ${password}, is2faEnabled = ${is2faEnabled ? 1 : 0} WHERE id = ${id}`;
        } else {
            await sql`UPDATE accounts SET is2faEnabled = ${is2faEnabled ? 1 : 0} WHERE id = ${id}`;
        }
        
        return NextResponse.json({ success: true });
    }

    if (action === 'getHistory') {
        const { userId } = payload;
        const history = await sql`SELECT game, bet, win, multiplier, timestamp FROM play_history WHERE userId = ${userId} ORDER BY timestamp DESC LIMIT 50`;
        return NextResponse.json({ success: true, history });
    }

    if (action === 'getSiteSettings') {
        const settings = await sql`SELECT showPrototypeMessages, showDisclaimerScreen FROM site_settings WHERE id = 'global'`;
        const setting = settings[0];
        return NextResponse.json({ 
            success: true, 
            settings: {
                showPrototypeMessages: Boolean(setting?.showprototypemessages ?? true),
                showDisclaimerScreen: Boolean(setting?.showdisclaimerscreen ?? true)
            } 
        });
    }

    if (action === 'updateSiteSettings') {
        const { showPrototypeMessages, showDisclaimerScreen } = payload;
        await sql`UPDATE site_settings SET showPrototypeMessages = ${showPrototypeMessages ? 1 : 0}, showDisclaimerScreen = ${showDisclaimerScreen ? 1 : 0} WHERE id = 'global'`;
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch (error) {
    console.error("Action failed:", error);
    if (error instanceof Error) {
        return NextResponse.json({ error: 'Action failed', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
