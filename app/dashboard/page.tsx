'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, ArrowLeft, Sparkles, LogOut, Clock } from 'lucide-react';
import { UserInfo } from '@/components/custom/UserButton';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user_info');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch {}
    }
    setLoading(false);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user_info');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-500">Please sign in to view your dashboard.</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:underline"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  const creditsMax = 3;
  const creditsPercent = Math.round((user.credits / creditsMax) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="w-full px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-blue-600" />
              Image Background Remover
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">

        {/* User Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name || user.email}
                className="w-16 h-16 rounded-full ring-2 ring-blue-100 dark:ring-blue-900"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold">
                {(user.name || user.email)?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {user.name || 'User'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Credits Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Remaining Credits</h3>
          </div>

          <div className="flex items-end gap-2">
            <span className={`text-5xl font-extrabold ${user.credits <= 0 ? 'text-red-500' : 'text-blue-600'}`}>
              {user.credits}
            </span>
            <span className="text-slate-400 text-lg mb-1">/ {creditsMax}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${user.credits <= 0 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${creditsPercent}%` }}
            />
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            {user.credits <= 0
              ? 'You have used all your free credits.'
              : `You have ${user.credits} free background removal${user.credits !== 1 ? 's' : ''} remaining.`}
          </p>

          <a
            href="/pricing"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade for More Credits
          </a>
        </div>

        {/* Usage History placeholder */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Usage History</h3>
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
            Your recent background removals will appear here.
          </p>
        </div>

        {/* Account Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Account</h3>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

      </div>
    </div>
  );
}
