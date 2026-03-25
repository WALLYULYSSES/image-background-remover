'use client';

import { useState, useCallback } from 'react';
import { UploadZone } from '@/components/custom/UploadZone';
import { ImageList } from '@/components/custom/ImageList';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Scissors } from 'lucide-react';

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

  const handleFilesAdded = useCallback((files: File[]) => {
    const newTasks: ImageTask[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'processing',
      progress: 0,
    }));

    setTasks(prev => [...prev, ...newTasks]);

    // Mock processing for each file
    newTasks.forEach(task => {
      mockProcessImage(task.id);
    });
  }, []);

  const mockProcessImage = (taskId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10;

      if (progress >= 100) {
        clearInterval(interval);
        setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
            // Randomly fail about 10% of the time to show error state
            const isError = Math.random() > 0.9;
            return {
              ...t,
              status: isError ? 'failed' : 'completed',
              progress: 100,
              resultUrl: isError ? undefined : t.previewUrl, // Mock result as original for now
              error: isError ? '处理失败，请重试' : undefined,
            };
          }
          return t;
        }));
      } else {
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, progress } : t
        ));
      }
    }, 500);
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (task?.previewUrl) {
        URL.revokeObjectURL(task.previewUrl);
      }
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 p-6 md:p-12 lg:p-24">
      <main className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
            <Scissors className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Image Background Remover
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            快速、精准的背景移除工具。支持批量处理，一键下载透明背景图片。
          </p>
        </div>

        <UploadZone onFilesAdded={handleFilesAdded} disabled={false} />

        {hasTasks && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4">
              <h2 className="text-2xl font-semibold tracking-tight">
                处理列表 <span className="text-slate-500 text-lg font-normal">({tasks.length})</span>
              </h2>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={clearAll}
                  className="text-slate-500 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清空列表
                </Button>
                {completedCount > 0 && (
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                    <Download className="w-4 h-4 mr-2" />
                    下载全部 ({completedCount})
                  </Button>
                )}
              </div>
            </div>

            <ImageList tasks={tasks} onRemove={handleRemoveTask} />
          </div>
        )}
      </main>
    </div>
  );
}
