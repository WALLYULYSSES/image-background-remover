import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
  const baseUrl = mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`Failed to get PayPal access token: ${res.status}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { orderID, credits, userId } = await request.json() as {
      orderID: string;
      credits: string;
      userId: string;
    };

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
    const baseUrl = mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const accessToken = await getPayPalAccessToken();

    const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('PayPal capture error:', err);
      return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 });
    }

    const capture = await res.json() as { status: string };

    if (capture.status === 'COMPLETED') {
      // 更新用户积分到 D1 数据库
      const db = (process.env as any).DB;
      const creditsToAdd = parseInt(credits, 10);

      await db
        .prepare('UPDATE users SET credits = credits + ? WHERE id = ?')
        .bind(creditsToAdd, userId)
        .run();

      // 记录购买日志
      const logId = crypto.randomUUID();
      await db
        .prepare('INSERT INTO usage_logs (id, user_id, status) VALUES (?, ?, ?)')
        .bind(logId, userId, `purchase:${credits}`)
        .run();

      return NextResponse.json({ success: true, credits: creditsToAdd });
    }

    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 });
  }
}
