'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatCurrency, truncate } from '@/lib/utils';
import { Button } from '@sentix/ui';
import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@sentix/ui';

interface RecentAnalysesProps {
  projectId: string;
}

export function RecentAnalyses({ projectId }: RecentAnalysesProps) {
  const router = useRouter();

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['analysis-history', projectId],
    queryFn: async () => {
      const response = await api.getAnalysisHistory(projectId);
      return response.data as any[];
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Analyses</h3>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Themes</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Revenue Impact</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {analyses.slice(0, 5).map((analysis) => (
              <tr key={analysis.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 text-sm">{formatDate(analysis.created_at)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    analysis.status === 'COMPLETED' ? 'bg-success/20 text-success' :
                    analysis.status === 'PROCESSING' ? 'bg-warning/20 text-warning' :
                    analysis.status === 'FAILED' ? 'bg-destructive/20 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {analysis.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{analysis.theme_count}</td>
                <td className="px-4 py-3 text-sm">
                  {formatCurrency(analysis.total_revenue_lost || 0)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/analysis/${analysis.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
