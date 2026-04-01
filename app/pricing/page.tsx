'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowLeft, Zap, Repeat } from 'lucide-react';

declare global {
  interface Window {
    paypal?: any;
  }
}

const creditPacks = [
  {
    name: 'Starter',
    price: '$4.99',
    credits: '10',
    perCredit: '$0.50',
    features: ['10 credits (one-time)', 'Never expires', 'High-quality results', 'PNG download', 'Email support'],
    cta: 'Buy Now',
    popular: false
  },
  {
    name: 'Popular',
    price: '$14.99',
    credits: '40',
    perCredit: '$0.37',
    features: ['40 credits (one-time)', 'Never expires', 'High-quality results', 'PNG download', 'Priority support', 'Batch processing'],
    cta: 'Buy Now',
    popular: true
  },
  {
    name: 'Pro',
    price: '$39.99',
    credits: '100',
    perCredit: '$0.40',
    features: ['100 credits (one-time)', 'Never expires', 'High-quality results', 'PNG download', 'Priority support', 'Batch processing', 'API access'],
    cta: 'Buy Now',
    popular: false
  }
];

const subscriptions = [
  {
    name: 'Basic',
    price: '$9.99',
    period: '/month',
    credits: '30',
    perCredit: '$0.33',
    features: ['30 credits per month', 'Auto-renewal', 'High-quality results', 'PNG download', 'Priority support', 'Cancel anytime'],
    cta: 'Subscribe',
    popular: false
  },
  {
    name: 'Pro',
    price: '$19.99',
    period: '/month',
    credits: '60',
    perCredit: '$0.33',
    features: ['60 credits per month', 'Auto-renewal', 'High-quality results', 'PNG download', 'Priority support', 'Batch processing', 'Cancel anytime'],
    cta: 'Subscribe',
    popular: true
  },
  {
    name: 'Business',
    price: '$39.99',
    period: '/month',
    credits: '120',
    perCredit: '$0.33',
    features: ['120 credits per month', 'Auto-renewal', 'High-quality results', 'PNG download', 'Priority support', 'Batch processing', 'API access', 'Cancel anytime'],
    cta: 'Subscribe',
    popular: false
  }
];

export default function PricingPage() {
  const [planType, setPlanType] = useState<'credits' | 'subscription'>('credits');
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const currentPlans = planType === 'credits' ? creditPacks : subscriptions;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=AZ8UfPHkpOK1jfUT4O1JRJe5bq84_eDNQzN90n2hN_PDGotH_t7OpKApf3nNT1AZS9aJycf_KB28DJgr&currency=USD';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async (price: string, credits: string) => {
    setLoading(price);
    const amount = price.replace('$', '');
    
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description: `${credits} credits` })
      });
      const { id } = await res.json();
      
      if (window.paypal) {
        window.paypal.Buttons({
          createOrder: () => id,
          onApprove: async (data: any) => {
            const captureRes = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderID: data.orderID, credits })
            });
            const result = await captureRes.json();
            if (result.success) {
              alert(`Payment successful! ${credits} credits added.`);
              router.push('/dashboard');
            }
          }
        }).render('#paypal-button-container-' + price);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">Choose between one-time credit packs or monthly subscriptions</p>

          <div className="inline-flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
            <button onClick={() => setPlanType('credits')} className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-colors ${planType === 'credits' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow' : 'text-slate-600 dark:text-slate-400'}`}>
              <Zap className="w-4 h-4" />
              Credit Packs
            </button>
            <button onClick={() => setPlanType('subscription')} className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-colors ${planType === 'subscription' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow' : 'text-slate-600 dark:text-slate-400'}`}>
              <Repeat className="w-4 h-4" />
              Subscriptions
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {currentPlans.map((plan) => (
            <div key={plan.name} className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 flex flex-col ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {plan.price}
                  {('period' in plan) ? <span className="text-lg text-slate-600 dark:text-slate-400">{String(plan.period)}</span> : null}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{plan.credits} credits · {plan.perCredit}/credit</div>
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handlePayment(plan.price, plan.credits)}
                disabled={loading === plan.price}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600'} disabled:opacity-50`}
              >
                {loading === plan.price ? 'Processing...' : plan.cta}
              </button>
              <div id={`paypal-button-container-${plan.price}`}></div>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          <p>All plans include high-quality background removal with no watermarks.</p>
          <p className="mt-2">Need more? Contact us for custom enterprise plans.</p>
        </div>
      </div>
    </div>
  );
}
