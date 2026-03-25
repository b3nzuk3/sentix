"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AnalysisPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const react_query_1 = require("@tanstack/react-query");
const api_1 = require("@/lib/api");
const card_1 = require("@sentix/ui/components/card");
const skeleton_1 = require("@sentix/ui/components/skeleton");
const button_1 = require("@sentix/ui/components/button");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const RoadmapColumn_1 = require("@/components/roadmap/RoadmapColumn");
function AnalysisPage({ params }) {
    const router = (0, navigation_1.useRouter)();
    const [analysisId, setAnalysisId] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        params.then((p) => setAnalysisId(p.id));
    }, [params]);
    const { data: analysis, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['analysis-by-id', analysisId],
        queryFn: async () => {
            if (!analysisId)
                return null;
            const response = await api_1.api.getAnalysisById(analysisId);
            return response.data;
        },
        enabled: !!analysisId,
    });
    if (isLoading) {
        return (<div className="space-y-6">
        <skeleton_1.Skeleton className="h-12 w-48"/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (<skeleton_1.Skeleton key={i} className="h-96 w-full"/>))}
        </div>
      </div>);
    }
    if (!analysis) {
        return (<card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Analysis not found</card_1.CardTitle>
          <card_1.CardDescription>The requested analysis does not exist or has been deleted.</card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <button_1.Button onClick={() => router.push('/')}>
            <lucide_react_1.ArrowLeft className="mr-2 h-4 w-4"/>
            Back to Dashboard
          </button_1.Button>
        </card_1.CardContent>
      </card_1.Card>);
    }
    // Compute totals for summary
    const totalRevenueLost = analysis.themes.reduce((sum, t) => sum + t.revenue_lost, 0);
    const totalRevenueAtRisk = analysis.themes.reduce((sum, t) => sum + t.revenue_at_risk, 0);
    const buckets = ['NOW', 'NEXT', 'LATER'];
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button_1.Button variant="ghost" size="sm" onClick={() => router.back()}>
              <lucide_react_1.ArrowLeft className="mr-2 h-4 w-4"/>
              Back
            </button_1.Button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Analysis Details</h2>
          <p className="text-muted-foreground">
            {analysis.project.name} • Completed {new Date(analysis.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <card_1.Card>
          <card_1.CardHeader className="pb-2">
            <card_1.CardDescription>Revenue Lost</card_1.CardDescription>
            <card_1.CardTitle className="text-2xl text-destructive">
              {(0, utils_1.formatCurrency)(totalRevenueLost)}
            </card_1.CardTitle>
          </card_1.CardHeader>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader className="pb-2">
            <card_1.CardDescription>Revenue at Risk</card_1.CardDescription>
            <card_1.CardTitle className="text-2xl text-warning">
              {(0, utils_1.formatCurrency)(totalRevenueAtRisk)}
            </card_1.CardTitle>
          </card_1.CardHeader>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader className="pb-2">
            <card_1.CardDescription>Themes</card_1.CardDescription>
            <card_1.CardTitle className="text-2xl">{analysis.themes.length}</card_1.CardTitle>
          </card_1.CardHeader>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader className="pb-2">
            <card_1.CardDescription>Status</card_1.CardDescription>
            <card_1.CardTitle className={`text-2xl ${analysis.status === 'COMPLETED' ? 'text-success' :
            analysis.status === 'FAILED' ? 'text-destructive' : ''}`}>
              {analysis.status}
            </card_1.CardTitle>
          </card_1.CardHeader>
        </card_1.Card>
      </div>

      {/* Roadmap Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {buckets.map((bucket) => (<RoadmapColumn_1.RoadmapColumn key={bucket} bucket={bucket} themes={analysis.themes.filter((t) => t.roadmap_bucket === bucket)} onTraceClick={() => { }}/>))}
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map