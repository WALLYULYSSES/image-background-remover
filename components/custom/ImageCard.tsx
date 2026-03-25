'use client';

import { ImageTask, TaskStatus } from '@/app/page';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, X, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageCardProps {
  task: ImageTask;
  onRemove: () => void;
}

export function ImageCard({ task, onRemove }: ImageCardProps) {
  const { file, previewUrl, status, progress, resultUrl, error } = task;

  return (
    <Card className="overflow-hidden group flex flex-col h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-950/50 flex items-center justify-center p-4">
        {/* Checkered pattern background for transparent images */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
             style={{
               backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)',
               backgroundSize: '20px 20px',
               backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
             }}
        />

        <div className="relative w-full h-full">
          {resultUrl ? (
             <Image
              src={resultUrl}
              alt="Result"
              fill
              className="object-contain z-10 drop-shadow-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <Image
              src={previewUrl}
              alt="Original preview"
              fill
              className={`object-contain transition-opacity duration-300 ${status === 'processing' ? 'opacity-50 blur-sm' : ''}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}

          {status === 'processing' && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-3 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex flex-col items-center gap-3 w-4/5 max-w-[200px]">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
                <div className="w-full space-y-1">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-xs font-medium text-center text-slate-600 dark:text-slate-300">
                    处理中 {progress}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 h-8 w-8"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        {error && (
          <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 p-2.5 rounded-md border border-red-100 dark:border-red-900/50">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="mt-auto pt-2">
          <Button
            className="w-full shadow-sm"
            variant={status === 'completed' ? 'default' : 'outline'}
            disabled={status !== 'completed'}
            onClick={() => {
              if (resultUrl) {
                const a = document.createElement('a');
                a.href = resultUrl;
                a.download = `removed-bg-${file.name.replace(/\.[^/.]+$/, "")}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }
            }}
          >
            {status === 'completed' ? (
              <>
                <Download className="w-4 h-4 mr-2" />
                下载结果
              </>
            ) : status === 'failed' ? (
              <>
                <X className="w-4 h-4 mr-2" />
                无法下载
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2 text-slate-400" />
                <span className="text-slate-500">等待处理完成</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  if (status === 'completed') {
    return (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 shadow-sm flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        完成
      </Badge>
    );
  }

  if (status === 'failed') {
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50 shadow-sm flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        失败
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 shadow-sm flex items-center gap-1">
      <Loader2 className="w-3 h-3 animate-spin" />
      处理中
    </Badge>
  );
}
