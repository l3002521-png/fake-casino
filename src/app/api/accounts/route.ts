import { NextRequest, NextResponse } from 'next/server';
import db from '@/utils/db';

export function GET(req: NextRequest) {
  try {
    const stmnt = db.prepare('SELECT id, username, kycStatus, kycDoc, isAdmin, is2faEnabled, balance FROM accounts');
    const accounts = stmnt.all();
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}
