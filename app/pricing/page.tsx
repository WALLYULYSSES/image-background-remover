'use client';

import { useRouter } from 'next/navigation';
import { Check, ArrowLeft } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    credits: '3',
    features: [
      '3 free credits on signup',
      'High-quality results',
      'PNG download',
      'Basic support'
    ],
    cta: 'Sign Up Free',
    popular: false
  },
  {
    name: 'Basic',
    price: '$4.99',
    credits: '50',
    features: [
      '50 credits',
      'High-quality results',
      'PNG download',
      'Priority support',
      'No watermark'
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Pro',
    price: '$9.99',
    credits: '120',
    features: [
      '120 credits (20% off)',
      'High-quality results',
      'PNG download',
      'Priority support',
      'No watermark',
      'Batch processing'
    ],
    cta: 'Get Started',
    popular: true
  },
  {
    name: 'Business',
    price: '$19.99',
    credits: '300',
    features: [
      '300 credits (40% off)',
      'High-quality results',
      'PNG download',
      'Priority support',
      'No watermark',
      'Batch processing',
      'API access'
    ],
    cta: 'Get Started',
    popular: false
  }
];

export default function PricingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Choose the plan that fits your needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {plan.name}
                </h3>
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {plan.price}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {plan.credits} credits
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => router.push('/')}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>All plans include high-quality background removal with no watermarks.</p>
          <p className="mt-2">Need more? Contact us for custom enterprise plans.</p>
        </div>
      </div>
    </div>
  );
}
