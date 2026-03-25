'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sentix/ui';
import { Skeleton } from '@sentix/ui';
import { Button } from '@sentix/ui';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { RoadmapColumn } from '@/components/roadmap/RoadmapColumn';
import type { Analysis, AnalysisTheme } from '@sentix/types';

interface AnalysisPageProps {
  params: Promise<{ id: string }>;
}

export default function AnalysisPage({ params }: AnalysisPageProps) {
  const router = useRouter();
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setAnalysisId(p.id));
  }, [params]);

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['analysis-by-id', analysisId],
    queryFn: async () => {
      if (!analysisId) return null;
      const response = await api.getAnalysisById(analysisId);
      return response.data as Analysis;
    },
    enabled: !!analysisId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis not found</CardTitle>
          <CardDescription>The requested analysis does not exist or has been deleted.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Compute totals for summary
  const totalRevenueLost = analysis.themes.reduce((sum, t) => sum + t.revenue_lost, 0);
  const totalRevenueAtRisk = analysis.themes.reduce((sum, t) => sum + t.revenue_at_risk, 0);

  const buckets = ['NOW', 'NEXT', 'LATER'] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Analysis Details</h2>
          <p className="text-muted-foreground">
            {analysis.project.name} • Completed {new Date(analysis.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue Lost</CardDescription>
            <CardTitle className="text-2xl text-destructive">
              {formatCurrency(totalRevenueLost)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue at Risk</CardDescription>
            <CardTitle className="text-2xl text-warning">
              {formatCurrency(totalRevenueAtRisk)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Themes</CardDescription>
            <CardTitle className="text-2xl">{analysis.themes.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle className={`text-2xl ${
              analysis.status === 'COMPLETED' ? 'text-success' :
              analysis.status === 'FAILED' ? 'text-destructive' : ''
            }`}>
              {analysis.status}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Roadmap Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {buckets.map((bucket) => (
          <RoadmapColumn
            key={bucket}
            bucket={bucket}
            themes={analysis.themes.filter((t) => t.roadmap_bucket === bucket)}
            onTraceClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
