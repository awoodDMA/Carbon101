'use client';

import { ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error while loading this content.',
  action,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="mx-auto w-12 h-12 text-destructive/60 mb-4">
        <AlertCircle className="w-full h-full" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      <div className="flex items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
        {action}
      </div>
    </div>
  );
}