'use client';

import { ImageTask } from '@/app/page';
import { ImageCard } from './ImageCard';

interface ImageListProps {
  tasks: ImageTask[];
  onRemove: (id: string) => void;
}

export function ImageList({ tasks, onRemove }: ImageListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map(task => (
        <div key={task.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ImageCard task={task} onRemove={() => onRemove(task.id)} />
        </div>
      ))}
    </div>
  );
}
