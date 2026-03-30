export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const db = (process.env as any).DB;

    // If logged in, check credits
    if (userId) {
      const user = await db
        .prepare('SELECT credits FROM users WHERE id = ?')
        .bind(userId)
        .first();

      if (!user || user.credits <= 0) {
        return NextResponse.json({ error: 'No credits remaining' }, { status: 402 });
      }
    } else {
      // If not logged in, check IP usage
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const today = Math.floor(Date.now() / 86400000); // Days since epoch
      
      const ipUsage = await db
        .prepare('SELECT COUNT(*) as count FROM usage_logs WHERE user_id = ? AND created_at >= ?')
        .bind(`ip:${ip}`, today * 86400)
        .first();

      if (ipUsage && ipUsage.count >= 1) {
        return NextResponse.json({ 
          error: 'Daily limit reached. Please sign in for more credits.' 
        }, { status: 429 });
      }
    }

    const formData = await request.formData();
    const imageFile = formData.get('image_file') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Prepare form data for remove.bg API
    const removeBgFormData = new FormData();
    removeBgFormData.append('image_file', imageFile);
    removeBgFormData.append('size', 'auto');

    // Call remove.bg API
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY || 'TwdgrsLWEp8kfBjThvgizJmv',
      },
      body: removeBgFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('remove.bg API error:', errorText);

      let errorMessage = 'Failed to remove background, please try again';
      if (response.status === 402) {
        errorMessage = 'API quota exceeded, please try again later';
      } else if (response.status === 403) {
        errorMessage = 'Invalid API key';
      } else if (response.status === 400) {
        errorMessage = 'Invalid request, please check your image';
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    // Deduct credit and log usage
    if (userId) {
      await db
        .prepare('UPDATE users SET credits = credits - 1 WHERE id = ?')
        .bind(userId)
        .run();

      const logId = crypto.randomUUID();
      await db
        .prepare('INSERT INTO usage_logs (id, user_id, status) VALUES (?, ?, ?)')
        .bind(logId, userId, 'success')
        .run();
    } else {
      // Log IP usage for non-logged-in users
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const logId = crypto.randomUUID();
      await db
        .prepare('INSERT INTO usage_logs (id, user_id, status) VALUES (?, ?, ?)')
        .bind(logId, `ip:${ip}`, 'success')
        .run();
    }

    // Return the image
    const imageBlob = await response.blob();
    return new NextResponse(imageBlob, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Error in remove-bg route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
