import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';

  return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}

export function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}
