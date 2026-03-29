export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ error: 'No credential provided' }, { status: 400 });
    }

    // Decode JWT payload (middle segment)
    const payload = JSON.parse(atob(credential.split('.')[1]));
    const { sub: googleId, email, name, picture: avatarUrl } = payload;

    if (!googleId || !email) {
      return NextResponse.json({ error: 'Invalid credential' }, { status: 400 });
    }

    const db = (process.env as any).DB;

    // Check if user exists
    const existingUser = await db
      .prepare('SELECT * FROM users WHERE google_id = ?')
      .bind(googleId)
      .first();

    let user;

    if (existingUser) {
      // Update last login
      await db
        .prepare('UPDATE users SET last_login_at = unixepoch(), name = ?, avatar_url = ? WHERE google_id = ?')
        .bind(name || null, avatarUrl || null, googleId)
        .run();

      user = {
        id: existingUser.id,
        email: existingUser.email,
        name: name || existingUser.name,
        avatar_url: avatarUrl || existingUser.avatar_url,
        credits: existingUser.credits,
      };
    } else {
      // Create new user with 3 credits
      const userId = crypto.randomUUID();
      await db
        .prepare('INSERT INTO users (id, google_id, email, name, avatar_url, credits) VALUES (?, ?, ?, ?, ?, 3)')
        .bind(userId, googleId, email, name || null, avatarUrl || null)
        .run();

      user = {
        id: userId,
        email,
        name: name || null,
        avatar_url: avatarUrl || null,
        credits: 3,
      };
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in auth/google route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
