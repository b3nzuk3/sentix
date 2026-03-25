"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentAnalyses = RecentAnalyses;
const react_query_1 = require("@tanstack/react-query");
const api_1 = require("@/lib/api");
const utils_1 = require("@/lib/utils");
const button_1 = require("@sentix/ui/components/button");
const lucide_react_1 = require("lucide-react");
const navigation_1 = require("next/navigation");
const skeleton_1 = require("@sentix/ui/components/skeleton");
function RecentAnalyses({ projectId }) {
    const router = (0, navigation_1.useRouter)();
    const { data: analyses, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['analysis-history', projectId],
        queryFn: async () => {
            const response = await api_1.api.getAnalysisHistory(projectId);
            return response.data;
        },
        enabled: !!projectId,
    });
    if (isLoading) {
        return (<div className="space-y-4">
        <skeleton_1.Skeleton className="h-8 w-64"/>
        <skeleton_1.Skeleton className="h-32 w-full"/>
      </div>);
    }
    if (!analyses || analyses.length === 0) {
        return null;
    }
    return (<div className="space-y-4">
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
            {analyses.slice(0, 5).map((analysis) => (<tr key={analysis.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 text-sm">{(0, utils_1.formatDate)(analysis.created_at)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${analysis.status === 'COMPLETED' ? 'bg-success/20 text-success' :
                analysis.status === 'PROCESSING' ? 'bg-warning/20 text-warning' :
                    analysis.status === 'FAILED' ? 'bg-destructive/20 text-destructive' :
                        'bg-muted text-muted-foreground'}`}>
                    {analysis.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{analysis.theme_count}</td>
                <td className="px-4 py-3 text-sm">
                  {(0, utils_1.formatCurrency)(analysis.total_revenue_lost || 0)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button_1.Button variant="ghost" size="sm" onClick={() => router.push(`/analysis/${analysis.id}`)}>
                    <lucide_react_1.Eye className="mr-2 h-4 w-4"/>
                    View
                  </button_1.Button>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
}
//# sourceMappingURL=recent-analyses.js.map