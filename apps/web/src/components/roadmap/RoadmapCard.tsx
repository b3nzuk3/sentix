'use client';

import { AnalysisTheme } from '@sentix/types';
import { Button } from '@sentix/ui';
import { formatCurrency, getEffortBucketColor } from '@/lib/utils';
import { BarChart3, Target, TrendingUp, TrendingDown, Clock, Eye } from 'lucide-react';

interface RoadmapCardProps {
  theme: AnalysisTheme;
  onTraceClick: () => void;
}

export function RoadmapCard({ theme, onTraceClick }: RoadmapCardProps) {
  const effortColor = getEffortBucketColor(theme.effort_bucket);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-sm leading-tight flex-1 pr-2">
          {theme.title}
        </h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onTraceClick}
          title="View traceability"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      {theme.theme.summary && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {theme.theme.summary}
        </p>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Revenue */}
        <div className="rounded bg-muted p-2">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3 text-destructive" />
            <span className="text-xs text-muted-foreground">Revenue Lost</span>
          </div>
          <p className="text-sm font-semibold text-destructive">
            {theme.revenue_lost > 0 ? formatCurrency(theme.revenue_lost) : 'N/A'}
          </p>
          {theme.revenue_at_risk > 0 && (
            <p className="text-xs text-warning">
              +{formatCurrency(theme.revenue_at_risk)} at risk
            </p>
          )}
        </div>

        {/* Effort */}
        <div className="rounded bg-muted p-2">
          <div className="flex items-center gap-1 mb-1">
            <Clock className="h-3 w-3" />
            <span className="text-xs text-muted-foreground">Effort</span>
          </div>
          <p className="text-sm font-semibold">{theme.effort_days} days</p>
          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${effortColor}`}>
            {theme.effort_bucket}
          </span>
        </div>

        {/* Churn */}
        <div className="rounded bg-muted p-2">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="h-3 w-3" />
            <span className="text-xs text-muted-foreground">Churn Risk</span>
          </div>
          <p className="text-sm font-semibold">
            {theme.churn_probability > 0 ? `${Math.round(theme.churn_probability * 100)}%` : 'N/A'}
          </p>
        </div>

        {/* Confidence */}
        <div className="rounded bg-muted p-2">
          <div className="flex items-center gap-1 mb-1">
            <Target className="h-3 w-3" />
            <span className="text-xs text-muted-foreground">Confidence</span>
          </div>
          <p className="text-sm font-semibold">{Math.round(theme.confidence * 100)}%</p>
          <div className="mt-1 h-1.5 w-full rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${theme.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{theme.engine_outputs.priority.bucket}</span>
        <Button
          variant="link"
          size="sm"
          onClick={onTraceClick}
          className="h-auto p-0 text-xs"
        >
          <BarChart3 className="mr-1 h-3 w-3" />
          View Evidence ({theme.evidence_ids.length})
        </Button>
      </div>
    </div>
  );
}
