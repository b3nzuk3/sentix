'use client';

import { AnalysisTheme } from '@sentix/types';
import { RoadmapCard } from './RoadmapCard';
import { cn } from '@/lib/utils';

interface RoadmapColumnProps {
  bucket: 'NOW' | 'NEXT' | 'LATER';
  themes: AnalysisTheme[];
  onTraceClick: (theme: AnalysisTheme) => void;
}

const bucketColors = {
  NOW: 'border-l-4 border-l-destructive',
  NEXT: 'border-l-4 border-l-warning',
  LATER: 'border-l-4 border-l-primary',
};

const bucketDescriptions = {
  NOW: 'High impact, low effort - execute immediately',
  NEXT: 'Medium impact or effort - plan for next cycle',
  LATER: 'Big bets or low priority - monitor',
};

export function RoadmapColumn({ bucket, themes, onTraceClick }: RoadmapColumnProps) {
  return (
    <div className={cn('space-y-4', bucketColors[bucket])}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{bucket}</h3>
          <p className="text-xs text-muted-foreground">{bucketDescriptions[bucket]}</p>
        </div>
        <span className="text-sm font-medium bg-muted px-2 py-1 rounded">
          {themes.length}
        </span>
      </div>

      <div className="space-y-3">
        {themes.map((theme) => (
          <RoadmapCard
            key={theme.id}
            theme={theme}
            onTraceClick={() => onTraceClick(theme)}
          />
        ))}

        {themes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
            No items in {bucket}
          </div>
        )}
      </div>
    </div>
  );
}
