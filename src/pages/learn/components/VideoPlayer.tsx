import type { ReactNode } from 'react';

interface VideoPlayerProps {
  veedUrl: string;
  title: string;
  completed?: boolean;
  onComplete?: () => void;
  children?: ReactNode;
}

export default function VideoPlayer({ veedUrl, title, completed = false, onComplete }: VideoPlayerProps) {
  return (
    <div className="w-full">
      <div className="relative w-full bg-background-950 rounded-2xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={veedUrl}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="mt-6 flex items-center justify-center">
        {!completed ? (
          <button
            onClick={onComplete}
            className="group flex items-center gap-3 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-background-50 font-semibold rounded-2xl text-base transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-check-double-line text-xl"></i>
            <span>I've Finished Watching &mdash; Unlock Quiz</span>
            <i className="ri-arrow-right-line text-xl group-hover:translate-x-1 transition-transform"></i>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-accent-50 text-accent-700 rounded-full text-sm font-medium">
            <i className="ri-checkbox-circle-fill text-lg"></i>
            <span>Video completed</span>
          </div>
        )}
      </div>
    </div>
  );
}