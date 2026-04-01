import { NextRequest, NextResponse } from 'next/server';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { client } from '@/lib/paypal';

export async function POST(request: NextRequest) {
  try {
    const { amount, description } = await request.json();

    const requestBody = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    requestBody.prefer('return=representation');
    requestBody.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount
        },
        description: description
      }]
    });

    const order = await client().execute(requestBody);
    
    return NextResponse.json({ 
      id: order.result.id 
    });
  } catch (error) {
    console.error('PayPal create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
