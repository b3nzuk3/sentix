'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RoadmapColumn } from '@/components/roadmap/RoadmapColumn';
import { TraceDrawer } from '@/components/roadmap/TraceDrawer';
import { Button } from '@sentix/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sentix/ui';
import { Skeleton } from '@sentix/ui';
import { Loader2 } from 'lucide-react';
import type { Analysis, AnalysisTheme } from '@sentix/types';

function RoadmapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisIdFromUrl = searchParams.get('analysis_id');

  const [selectedTheme, setSelectedTheme] = useState<AnalysisTheme | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.getProjects();
      return response.data as any[];
    },
  });

  useEffect(() => {
    if (projects?.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['analysis', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await api.getAnalysis(projectId);
      return response.data as Analysis;
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (analysisIdFromUrl && analysis?.id === analysisIdFromUrl) {
      // Could auto-select theme or scroll to it
    }
  }, [analysisIdFromUrl, analysis]);

  const handleTraceClick = async (analysisTheme: AnalysisTheme) => {
    try {
      const response = await api.getTrace(analysisTheme.id);
      setSelectedTheme({ ...analysisTheme, ...response.data });
    } catch (error) {
      console.error('Failed to fetch trace:', error);
      setSelectedTheme(analysisTheme);
    }
  };

  const buckets = ['NOW', 'NEXT', 'LATER'] as const;

  const getThemesByBucket = (bucket: string): AnalysisTheme[] => {
    return analysis?.themes?.filter((t) => t.roadmap_bucket === bucket) || [];
  };

  if (projectsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Roadmap</CardTitle>
          <CardDescription>No project selected</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a project to view roadmap.</p>
        </CardContent>
      </Card>
    );
  }

  if (analysisLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!analysis || analysis.status !== 'COMPLETED') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Roadmap</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No completed analysis</CardTitle>
            <CardDescription>
              {analysis?.status === 'PROCESSING'
                ? 'Analysis is currently running. Please wait...'
                : analysis?.status === 'FAILED'
                ? 'Previous analysis failed. Try again.'
                : 'Start a synthesis to generate roadmap items.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysis?.status !== 'PROCESSING' && (
              <Button onClick={() => router.push('/')} className="glow">
                Go to Dashboard
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Roadmap</h2>
          <p className="text-muted-foreground">
            Analysis completed on {new Date(analysis.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {buckets.map((bucket) => (
          <RoadmapColumn
            key={bucket}
            bucket={bucket}
            themes={getThemesByBucket(bucket)}
            onTraceClick={handleTraceClick}
          />
        ))}
      </div>

      {selectedTheme && (
        <TraceDrawer
          theme={selectedTheme}
          onClose={() => setSelectedTheme(null)}
        />
      )}
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <RoadmapContent />
    </Suspense>
  );
}
