export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = (process.env as any).DB;
    const user = await db
      .prepare('SELECT id, email, name, avatar_url, credits FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in user/me route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
