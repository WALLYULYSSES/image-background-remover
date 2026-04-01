import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body.event_type;

    console.log('PayPal Webhook received:', eventType);

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // 支付完成，更新用户积分
        const captureId = body.resource.id;
        const amount = body.resource.amount.value;
        console.log('Payment completed:', captureId, amount);
        // TODO: 更新 D1 数据库
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        console.log('Payment denied');
        break;

      case 'BILLING.SUBSCRIPTION.CREATED':
        console.log('Subscription created');
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        console.log('Subscription activated');
        // TODO: 激活用户订阅
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        console.log('Subscription cancelled');
        // TODO: 取消用户订阅
        break;

      default:
        console.log('Unhandled event:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
