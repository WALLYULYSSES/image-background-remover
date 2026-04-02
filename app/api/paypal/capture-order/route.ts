import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(`Missing PayPal credentials: clientId=${!!clientId}, clientSecret=${!!clientSecret}`);
  }

  const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
  const baseUrl = mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PayPal token error ${res.status}: ${errText}`);
  }

  const data = await res.json() as { access_token: string };
  if (!data.access_token) {
    throw new Error('PayPal token response missing access_token');
  }
  return data.access_token;
}

export async function POST(request: NextRequest) {
  let orderID = '';
  let credits = '';
  let userId = '';

  try {
    const body = await request.json() as { orderID: string; credits: string; userId: string };
    orderID = body.orderID;
    credits = body.credits;
    userId = body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    if (!orderID) {
      return NextResponse.json({ error: 'Missing orderID' }, { status: 400 });
    }

    const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
    const baseUrl = mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    // Step 1: Get access token
    let accessToken: string;
    try {
      accessToken = await getPayPalAccessToken();
    } catch (tokenErr: any) {
      return NextResponse.json({ error: 'PayPal auth failed', detail: String(tokenErr.message) }, { status: 500 });
    }

    // Step 2: Capture order
    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation',
      },
    });

    const captureText = await captureRes.text();

    if (!captureRes.ok) {
      return NextResponse.json({
        error: 'PayPal capture failed',
        detail: captureText,
        httpStatus: captureRes.status,
      }, { status: 500 });
    }

    let capture: { status: string; id?: string };
    try {
      capture = JSON.parse(captureText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON from PayPal', detail: captureText }, { status: 500 });
    }

    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ error: `Payment status: ${capture.status}`, detail: captureText }, { status: 400 });
    }

    // Step 3: Update credits in D1
    const db = (process.env as any).DB;
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const creditsToAdd = parseInt(credits, 10);
    if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
      return NextResponse.json({ error: `Invalid credits value: ${credits}` }, { status: 400 });
    }

    await db
      .prepare('UPDATE users SET credits = credits + ? WHERE id = ?')
      .bind(creditsToAdd, userId)
      .run();

    // Step 4: Log purchase
    const logId = crypto.randomUUID();
    await db
      .prepare('INSERT INTO usage_logs (id, user_id, status) VALUES (?, ?, ?)')
      .bind(logId, userId, `purchase:${credits}`)
      .run();

    return NextResponse.json({ success: true, credits: creditsToAdd });

  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('PayPal capture unhandled error:', msg);
    return NextResponse.json({
      error: 'Unexpected error',
      detail: msg,
      context: { orderID, credits, hasUserId: !!userId }
    }, { status: 500 });
  }
}
