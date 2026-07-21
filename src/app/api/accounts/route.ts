import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/utils/db';

export async function GET(req: NextRequest) {
  try {
    const sql = await getDb();
    const accounts = await sql`SELECT id, username, kycStatus, kycDoc, isAdmin, is2faEnabled, balance FROM accounts`;
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}
