'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
  info?: string;
  carbonRelated?: boolean;
}

export default function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  onClick,
  className,
  info,
  carbonRelated = false,
}: MetricCardProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'group rounded-lg border bg-card shadow-sm p-4 lg:p-6 transition-all duration-200',
        isClickable && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={isClickable ? `Filter by ${title}` : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {info && (
              <div className="group relative">
                <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground cursor-help">
                  ?
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {info}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-xl lg:text-2xl font-bold carbon-value transition-colors",
              carbonRelated && "group-hover:text-orange-600"
            )}>
              {value}
            </span>
            {unit && (
              <span className={cn(
                "text-sm text-muted-foreground transition-colors",
                carbonRelated && "group-hover:text-orange-600"
              )}>
                {unit}
              </span>
            )}
          </div>
        </div>
        <div className="ml-4">
          <Icon className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}