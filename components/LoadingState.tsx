'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  type: 'cards' | 'chart' | 'table' | 'viewer' | 'page';
  className?: string;
}

export default function LoadingState({ type, className }: LoadingStateProps) {
  switch (type) {
    case 'cards':
      return (
        <div className={cn('grid gap-6 md:grid-cols-2 lg:grid-cols-4', className)}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="w-6 h-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'chart':
      return (
        <div className={cn('bg-card rounded-lg border p-6', className)}>
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="relative flex items-center justify-center mb-6">
            <Skeleton className="w-48 h-48 rounded-full" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'table':
      return (
        <div className={cn('bg-card rounded-lg border', className)}>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <th key={i} className="text-left p-4">
                      <Skeleton className="h-4 w-16" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="p-4">
                        <Skeleton className="h-4 w-full max-w-24" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'viewer':
      return (
        <div className={cn('grid gap-6 lg:grid-cols-[3fr_2fr]', className)}>
          <div className="relative bg-muted rounded-lg overflow-hidden min-h-[300px] lg:min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <Skeleton className="w-24 h-24 rounded-lg mx-auto mb-4" />
              <Skeleton className="h-4 w-32 mx-auto mb-2" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
          </div>
          <LoadingState type="chart" />
        </div>
      );

    case 'page':
      return (
        <div className={cn('container-spacing', className)}>
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-8 w-64 mb-6" />
            <LoadingState type="cards" className="mb-8" />
            <LoadingState type="viewer" />
          </div>
        </div>
      );

    default:
      return (
        <div className={cn('flex items-center justify-center p-8', className)}>
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
  }
}