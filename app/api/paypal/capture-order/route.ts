import { NextRequest, NextResponse } from 'next/server';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { client } from '@/lib/paypal';

export async function POST(request: NextRequest) {
  try {
    const { orderID, credits } = await request.json();

    const requestBody = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    requestBody.requestBody({});

    const capture = await client().execute(requestBody);

    if (capture.result.status === 'COMPLETED') {
      // TODO: 更新用户积分到 D1 数据库
      return NextResponse.json({ 
        success: true,
        credits: credits
      });
    }

    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 });
  }
}
