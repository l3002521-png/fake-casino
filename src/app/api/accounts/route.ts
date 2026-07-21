import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureDb, mapAccountRow } from '@/utils/db';

export async function GET() {
  try {
    await ensureDb();
    const accounts = await sql`SELECT id, username, kycStatus, kycDoc, isAdmin, is2faEnabled, balance FROM accounts`;
    return NextResponse.json(accounts.map((row) => mapAccountRow(row as Record<string, unknown>)));
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}
