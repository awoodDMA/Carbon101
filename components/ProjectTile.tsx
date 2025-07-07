'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectTileProps {
  id: string;
  name: string;
  projectNumber: string;
  thumbnail?: string;
  carbon: number;
  carbonSaved?: number;
  carbonSavedPercent?: number;
  status: 'Live' | 'Review' | 'Completed';
  lastUpdated: string;
  className?: string;
}

const statusColors = {
  'Live': 'bg-orange-100 text-orange-800 border-orange-200',
  'Review': 'bg-blue-100 text-blue-800 border-blue-200',
  'Completed': 'bg-green-100 text-green-800 border-green-200',
};

export default function ProjectTile({
  id,
  name,
  projectNumber,
  thumbnail,
  carbon,
  carbonSaved,
  carbonSavedPercent,
  status,
  lastUpdated,
  className,
}: ProjectTileProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!thumbnail);

  return (
    <Link
      href={`/projects/${id}`}
      className={cn(
        'group block rounded-lg border bg-card shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        className
      )}
    >
      {/* Thumbnail Section */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {thumbnail && !imageError ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail}
              alt={`${name} thumbnail`}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-200',
                isLoading ? 'opacity-0' : 'opacity-100'
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setImageError(true);
                setIsLoading(false);
              }}
              loading="lazy"
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="w-12 h-12 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-muted-foreground/20 rounded" />
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
              statusColors[status]
            )}
          >
            {status}
          </span>
        </div>

        {/* Carbon Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-end justify-between text-white">
            <div>
              <div className="text-lg font-bold carbon-value">
                {carbon.toLocaleString()} tCO₂e
              </div>
              <div className="text-xs opacity-90">Embodied Carbon</div>
            </div>
            {carbonSavedPercent !== undefined && carbonSavedPercent > 0 && (
              <div className="flex items-center gap-1 text-green-300">
                <ArrowDown className="w-3 h-3" />
                <span className="text-sm font-medium">{carbonSavedPercent}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Project Number - 10% bigger and Roboto Bold */}
        <div className="text-xl font-bold text-orange-600 mb-1" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700 }}>
          {projectNumber}
        </div>
        
        {/* Project Name */}
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        
        {carbonSaved && carbonSaved > 0 && (
          <div className="text-sm text-muted-foreground group-hover:text-orange-600 mb-2 transition-colors">
            <span className="hidden sm:inline">Carbon Saved: </span>
            <span className="sm:hidden">Saved: </span>
            {carbonSaved.toLocaleString()} tCO₂e
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="truncate">{lastUpdated}</span>
        </div>
      </div>
    </Link>
  );
}