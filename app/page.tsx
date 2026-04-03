'use client';

import { useState, useCallback, useEffect } from 'react';
import { UploadZone } from '@/components/custom/UploadZone';
import { ImageList } from '@/components/custom/ImageList';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Scissors, X } from 'lucide-react';
import { UserButton, UserInfo } from '@/components/custom/UserButton';

export type TaskStatus = 'processing' | 'completed' | 'failed';

export interface ImageTask {
  id: string;
  file: File;
  previewUrl: string;
  status: TaskStatus;
  progress: number;
  resultUrl?: string;
  error?: string;
}

export default function Home() {
  const [tasks, setTasks] = useState<ImageTask[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);

  // Restore user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user_info');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setCredits(parsed.credits ?? 0);
      } catch {}
    }
  }, []);

  const handleUserChange = (u: UserInfo | null) => {
    setUser(u);
    setCredits(u?.credits ?? 0);
  };

  const handleFilesAdded = useCallback((files: File[]) => {
    const newTasks: ImageTask[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'processing',
      progress: 0,
    }));

    setTasks(prev => [...prev, ...newTasks]);
    newTasks.forEach(task => processImage(task.id, task.file));
  }, [user, credits]);

  const processImage = async (taskId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('image_file', file);

      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, progress: 30 } : t
      ));

      const headers: Record<string, string> = {};
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 402 || response.status === 429) {
          setShowNoCreditsModal(true);
          setTasks(prev => prev.filter(t => t.id !== taskId));
          return;
        }

        let errorMessage = 'Processing failed, please try again';
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch {}
        throw new Error(errorMessage);
      }

      // Deduct credit from local state
      if (user?.id) {
        const newCredits = Math.max(0, credits - 1);
        setCredits(newCredits);
        const stored = localStorage.getItem('user_info');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.credits = newCredits;
            localStorage.setItem('user_info', JSON.stringify(parsed));
          } catch {}
        }
      }

      const imageBlob = await response.blob();
      const resultUrl = URL.createObjectURL(imageBlob);

      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'completed', progress: 100, resultUrl } : t
      ));
    } catch (error) {
      setTasks(prev => prev.map(t =>
        t.id === taskId ? {
          ...t,
          status: 'failed',
          progress: 100,
          error: error instanceof Error ? error.message : 'Processing failed, please try again',
        } : t
      ));
    }
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (task?.previewUrl) URL.revokeObjectURL(task.previewUrl);
      return prev.filter(t => t.id !== taskId);
    });
  };

  const clearAll = () => {
    setTasks(prev => {
      prev.forEach(task => {
        if (task.previewUrl) URL.revokeObjectURL(task.previewUrl);
      });
      return [];
    });
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const hasTasks = tasks.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="w-full px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Image Background Remover</span>
          <div className="flex items-center gap-3">
            <a
              href="/pricing"
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Pricing
            </a>
            {user && (
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                credits <= 0
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                ✨ {credits}
              </span>
            )}
            <UserButton onUserChange={handleUserChange} />
          </div>
        </div>
      </header>

      <div className="p-6 md:p-12 lg:p-24">
        <main className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
              <Scissors className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Image Background Remover
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Fast and accurate background removal. Supports batch processing and one-click download of transparent PNG images.
            </p>
          </div>

          <UploadZone onFilesAdded={handleFilesAdded} disabled={false} />

          {hasTasks && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Queue <span className="text-slate-500 text-lg font-normal">({tasks.length})</span>
                </h2>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={clearAll}
                    className="text-slate-500 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                  {completedCount > 0 && (
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                      <Download className="w-4 h-4 mr-2" />
                      Download All ({completedCount})
                    </Button>
                  )}
                </div>
              </div>
              <ImageList tasks={tasks} onRemove={handleRemoveTask} />
            </div>
          )}
        </main>
      </div>

      {/* No Credits Modal */}
      {showNoCreditsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <button
                onClick={() => setShowNoCreditsModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {user ? 'Not Enough Credits' : 'Sign In to Continue'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {user 
                ? "Upgrade to continue removing backgrounds without limits."
                : "Please sign in to use this feature. New users get 3 free credits!"}
            </p>
            <div className="flex gap-3">
              {user ? (
                <>
                  <a
                    href="/pricing"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-2.5 px-4 rounded-lg transition-colors"
                  >
                    Upgrade Plan
                  </a>
                  <button
                    onClick={() => setShowNoCreditsModal(false)}
                    className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium py-2.5 px-4 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowNoCreditsModal(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  OK, I'll Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
