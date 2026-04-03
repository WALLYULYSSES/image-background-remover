import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

async function verifyWebhookSignature(
  headers: Headers,
  body: string,
  accessToken: string
): Promise<boolean> {
  const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
  const baseUrl = mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const verifyBody = {
    auth_algo: headers.get('paypal-auth-algo'),
    cert_url: headers.get('paypal-cert-url'),
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    transmission_time: headers.get('paypal-transmission-time'),
    webhook_id: webhookId,
    webhook_event: JSON.parse(body),
  };

  const res = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(verifyBody),
  });

  if (!res.ok) return false;
  const data = await res.json() as { verification_status: string };
  return data.verification_status === 'SUCCESS';
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
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

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// Map PayPal custom field (credits:N:userId:XXX) to credits + userId
function parseCustomId(customId: string): { credits: number; userId: string } | null {
  try {
    const parts = customId.split(':');
    // format: "credits:15:userId:abc-123"
    const creditsIdx = parts.indexOf('credits');
    const userIdIdx = parts.indexOf('userId');
    if (creditsIdx === -1 || userIdIdx === -1) return null;
    const credits = parseInt(parts[creditsIdx + 1], 10);
    const userId = parts[userIdIdx + 1];
    if (isNaN(credits) || !userId) return null;
    return { credits, userId };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verify signature
    let accessToken: string;
    try {
      accessToken = await getPayPalAccessToken();
    } catch {
      return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
    }

    const isValid = await verifyWebhookSignature(request.headers, body, accessToken);
    if (!isValid) {
      console.error('PayPal webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body) as {
      event_type: string;
      resource: {
        id: string;
        status: string;
        custom_id?: string;
        purchase_units?: Array<{
          custom_id?: string;
          payments?: {
            captures?: Array<{ id: string; status: string; custom_id?: string }>;
          };
        }>;
      };
    };

    // Only handle completed payments
    if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      return NextResponse.json({ received: true });
    }

    // Extract custom_id (contains credits + userId)
    const customId =
      event.resource.custom_id ||
      event.resource.purchase_units?.[0]?.custom_id ||
      event.resource.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;

    if (!customId) {
      console.error('Webhook: no custom_id found in event');
      return NextResponse.json({ error: 'Missing custom_id' }, { status: 400 });
    }

    const parsed = parseCustomId(customId);
    if (!parsed) {
      console.error('Webhook: failed to parse custom_id:', customId);
      return NextResponse.json({ error: 'Invalid custom_id format' }, { status: 400 });
    }

    const { credits, userId } = parsed;

    const db = (process.env as any).DB;
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Check user exists
    const userCheck = await db
      .prepare('SELECT id FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!userCheck) {
      console.error('Webhook: user not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update credits
    await db
      .prepare('UPDATE users SET credits = credits + ? WHERE id = ?')
      .bind(credits, userId)
      .run();

    // Log
    const logId = crypto.randomUUID();
    await db
      .prepare('INSERT INTO usage_logs (id, user_id, status) VALUES (?, ?, ?)')
      .bind(logId, userId, `webhook_purchase:${credits}`)
      .run();

    console.log(`Webhook: added ${credits} credits to user ${userId}`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Webhook unhandled error:', error?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
