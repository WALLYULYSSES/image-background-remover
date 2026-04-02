'use client';

import { useState, useEffect, useRef } from 'react';
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
    amount: '4.99',
    credits: '10',
    perCredit: '$0.50',
    features: ['10 credits (one-time)', 'Never expires', 'High-quality results', 'PNG download', 'Email support'],
    cta: 'Buy Now',
    popular: false
  },
  {
    name: 'Popular',
    price: '$14.99',
    amount: '14.99',
    credits: '40',
    perCredit: '$0.37',
    features: ['40 credits (one-time)', 'Never expires', 'High-quality results', 'PNG download', 'Priority support', 'Batch processing'],
    cta: 'Buy Now',
    popular: true
  },
  {
    name: 'Pro',
    price: '$39.99',
    amount: '39.99',
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
    amount: '9.99',
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
    amount: '19.99',
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
    amount: '39.99',
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
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const router = useRouter();
  const currentPlans = planType === 'credits' ? creditPacks : subscriptions;

  // Load userId from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('user_info');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserId(parsed.id || null);
      } catch {
        setUserId(null);
      }
    }
  }, []);

  // Load PayPal SDK
  useEffect(() => {
    // Remove previous script if any
    if (scriptRef.current && document.body.contains(scriptRef.current)) {
      document.body.removeChild(scriptRef.current);
      scriptRef.current = null;
    }
    // Clean up existing paypal button containers
    setPaypalLoaded(false);

    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=AZ8UfPHkpOK1jfUT4O1JRJe5bq84_eDNQzN90n2hN_PDGotH_t7OpKApf3nNT1AZS9aJycf_KB28DJgr&currency=USD';
    script.async = true;
    script.onload = () => {
      setPaypalLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load PayPal SDK. Please refresh the page.');
    };
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [planType]);

  // Render PayPal buttons after SDK is loaded and DOM is ready
  useEffect(() => {
    if (!paypalLoaded || !window.paypal) return;

    currentPlans.forEach((plan) => {
      const containerId = `paypal-btn-${plan.amount.replace('.', '')}`;
      const container = document.getElementById(containerId);
      if (!container) return;
      // Clear any existing buttons
      container.innerHTML = '';

      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal'
        },
        createOrder: async () => {
          if (!userId) {
            setError('Please sign in before purchasing.');
            throw new Error('Not authenticated');
          }
          try {
            const res = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: plan.amount,
                description: `${plan.credits} credits`
              })
            });
            if (!res.ok) throw new Error('Failed to create order');
            const data = await res.json();
            if (!data.id) throw new Error('No order ID returned');
            return data.id;
          } catch (err) {
            console.error('Create order error:', err);
            setError('Failed to start payment. Please try again.');
            throw err;
          }
        },
        onApprove: async (data: any) => {
          if (!userId) {
            setError('User session lost. Please sign in and try again.');
            return;
          }
          try {
            const res = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderID: data.orderID, credits: plan.credits, userId })
            });
            const result = await res.json();
            if (result.success) {
              // Update localStorage credits immediately
              const stored = localStorage.getItem('user_info');
              if (stored) {
                const parsed = JSON.parse(stored);
                parsed.credits = (parsed.credits || 0) + result.credits;
                localStorage.setItem('user_info', JSON.stringify(parsed));
              }
              router.push('/dashboard?payment=success&credits=' + plan.credits);
            } else {
              setError(`Payment capture failed: ${result.detail || result.error || 'Unknown error'}. Please contact support.`);
            }
          } catch (err) {
            console.error('Capture order error:', err);
            setError('Payment verification failed. Please contact support.');
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          setError('Payment failed. Please try again.');
        },
        onCancel: () => {
          // User cancelled, do nothing
        }
      }).render(`#${containerId}`);
    });
  }, [paypalLoaded, currentPlans, router]);

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

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-center">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline text-sm">Dismiss</button>
          </div>
        )}

        {!userId && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-300 text-center">
            ⚠️ Please <button onClick={() => router.push('/')} className="underline font-medium">sign in</button> before purchasing.
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {currentPlans.map((plan) => {
            const containerId = `paypal-btn-${plan.amount.replace('.', '')}`;
            return (
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

                {/* PayPal button container */}
                <div id={containerId} className="mt-2">
                  {!paypalLoaded && (
                    <div className="w-full py-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 text-center text-sm animate-pulse">
                      Loading PayPal...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          <p>All plans include high-quality background removal with no watermarks.</p>
          <p className="mt-2">Need more? Contact us for custom enterprise plans.</p>
        </div>
      </div>
    </div>
  );
}
