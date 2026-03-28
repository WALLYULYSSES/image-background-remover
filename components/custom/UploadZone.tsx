'use client';

import { useCallback, useState } from 'react';
import { UploadCloud, FileImage, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface UploadZoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadZone({ onFilesAdded, disabled = false }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
      );

      if (files.length > 0) {
        onFilesAdded(files);
      }
    },
    [disabled, onFilesAdded]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || !e.target.files) return;

      const files = Array.from(e.target.files).filter(file =>
        file.type.startsWith('image/')
      );

      if (files.length > 0) {
        onFilesAdded(files);
      }

      // Reset input value so the same file can be selected again
      e.target.value = '';
    },
    [disabled, onFilesAdded]
  );

  return (
    <Card
      className={`
        relative overflow-hidden group border-2 border-dashed
        transition-all duration-200 ease-in-out
        ${isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
          : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />

      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
        <div className={`
          p-4 rounded-full transition-transform duration-300
          ${isDragging ? 'scale-110 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}
        `}>
          <UploadCloud className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            Click or drag images here
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Supports JPG, PNG, WebP up to 10MB. You can upload multiple images at once for batch processing.
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-slate-400 dark:text-slate-500 font-medium pt-4">
          <div className="flex items-center gap-1.5">
            <FileImage className="w-4 h-4" />
            <span>High-quality cutout</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>Batch support</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
