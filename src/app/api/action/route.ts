import { NextRequest, NextResponse } from 'next/server';
import db from '@/utils/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'register') {
      const { username, password, is2faEnabled } = payload;
      
      const checkUser = db.prepare('SELECT id FROM accounts WHERE username = ?');
      if (checkUser.get(username)) {
         return NextResponse.json({ success: false, error: "Username taken" }, { status: 400 });
      }

      const id = Math.random().toString(36).substring(2, 9);
      const insert = db.prepare(`
        INSERT INTO accounts (id, username, password, is2faEnabled, balance) 
        VALUES (?, ?, ?, ?, 0)
      `);
      insert.run(id, username, password, is2faEnabled ? 1 : 0);
      
      return NextResponse.json({ success: true, user: { id, username, kycStatus: 'none', balance: 0, isAdmin: 0, is2faEnabled: is2faEnabled ? 1 : 0 } });
    }

    if (action === 'login') {
      const { username, password } = payload;
      const stmnt = db.prepare('SELECT id, username, kycStatus, isAdmin, is2faEnabled, balance FROM accounts WHERE username = ? AND password = ?');
      const user = stmnt.get(username, password) as any;
      
      if (!user) {
        return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
      }
      
      return NextResponse.json({ success: true, user: { ...user, isAdmin: Boolean(user.isAdmin), is2faEnabled: Boolean(user.is2faEnabled) } });
    }

    if (action === 'updateBalance') {
      const { id, amount } = payload;
      const stmnt = db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? RETURNING balance');
      const result = stmnt.get(amount, id) as { balance: number };
      return NextResponse.json({ success: true, balance: result.balance });
    }

    if (action === 'submitKYC') {
       const { id, doc } = payload;
       const stmnt = db.prepare('UPDATE accounts SET kycStatus = ?, kycDoc = ? WHERE id = ?');
       stmnt.run('pending', doc, id);
       return NextResponse.json({ success: true });
    }

    if (action === 'approveKYC') {
      const { id } = payload;
      const stmnt = db.prepare('UPDATE accounts SET kycStatus = ?, kycDoc = NULL WHERE id = ?');
      stmnt.run('approved', id);
      return NextResponse.json({ success: true });
    }

    if (action === 'rejectKYC') {
      const { id } = payload;
      const stmnt = db.prepare('UPDATE accounts SET kycStatus = ?, kycDoc = NULL WHERE id = ?');
      stmnt.run('none', id);
      return NextResponse.json({ success: true });
    }

    if (action === 'getUser') {
      const { id } = payload;
      const stmnt = db.prepare('SELECT id, username, kycStatus, kycDoc, isAdmin, is2faEnabled, balance FROM accounts WHERE id = ?');
      const user = stmnt.get(id);
      return NextResponse.json({ success: true, user });
    }

    if (action === 'logGame') {
        const { userId, game, bet, win, multiplier } = payload;
        const insert = db.prepare(`
            INSERT INTO play_history (userId, game, bet, win, multiplier)
            VALUES (?, ?, ?, ?, ?)
        `);
        insert.run(userId, game, bet, win, multiplier);
        return NextResponse.json({ success: true });
    }

    if (action === 'deleteAccount') {
        const { id } = payload;
        const deleteHistory = db.prepare('DELETE FROM play_history WHERE userId = ?');
        const deleteAccount = db.prepare('DELETE FROM accounts WHERE id = ?');
        
        deleteHistory.run(id);
        deleteAccount.run(id);
        
        return NextResponse.json({ success: true });
    }

    if (action === 'updateAccountSettings') {
        const { id, password, is2faEnabled } = payload;
        
        if (password) {
            const stmnt = db.prepare('UPDATE accounts SET password = ?, is2faEnabled = ? WHERE id = ?');
            stmnt.run(password, is2faEnabled ? 1 : 0, id);
        } else {
            const stmnt = db.prepare('UPDATE accounts SET is2faEnabled = ? WHERE id = ?');
            stmnt.run(is2faEnabled ? 1 : 0, id);
        }
        
        return NextResponse.json({ success: true });
    }

    if (action === 'getHistory') {
        const { userId } = payload;
        const stmnt = db.prepare('SELECT game, bet, win, multiplier, timestamp FROM play_history WHERE userId = ? ORDER BY timestamp DESC LIMIT 50');
        const history = stmnt.all(userId);
        return NextResponse.json({ success: true, history });
    }

    if (action === 'getSiteSettings') {
        const stmnt = db.prepare("SELECT showPrototypeMessages, showDisclaimerScreen FROM site_settings WHERE id = 'global'");
        const settings = stmnt.get() as any;
        return NextResponse.json({ 
            success: true, 
            settings: {
                showPrototypeMessages: Boolean(settings?.showPrototypeMessages ?? true),
                showDisclaimerScreen: Boolean(settings?.showDisclaimerScreen ?? true)
            } 
        });
    }

    if (action === 'updateSiteSettings') {
        const { showPrototypeMessages, showDisclaimerScreen } = payload;
        const stmnt = db.prepare("UPDATE site_settings SET showPrototypeMessages = ?, showDisclaimerScreen = ? WHERE id = 'global'");
        stmnt.run(showPrototypeMessages ? 1 : 0, showDisclaimerScreen ? 1 : 0);
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch (error) {
    console.error("Action failed:", error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
