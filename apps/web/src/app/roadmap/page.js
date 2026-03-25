"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RoadmapPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const react_query_1 = require("@tanstack/react-query");
const api_1 = require("@/lib/api");
const RoadmapColumn_1 = require("@/components/roadmap/RoadmapColumn");
const TraceDrawer_1 = require("@/components/roadmap/TraceDrawer");
const button_1 = require("@sentix/ui/components/button");
const card_1 = require("@sentix/ui/components/card");
const skeleton_1 = require("@sentix/ui/components/skeleton");
function RoadmapPage() {
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const analysisIdFromUrl = searchParams.get('analysis_id');
    const [selectedTheme, setSelectedTheme] = (0, react_1.useState)(null);
    const [projectId, setProjectId] = (0, react_1.useState)(null);
    const { data: projects, isLoading: projectsLoading } = (0, react_query_1.useQuery)({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await api_1.api.getProjects();
            return response.data;
        },
    });
    (0, react_1.useEffect)(() => {
        if (projects?.length > 0 && !projectId) {
            setProjectId(projects[0].id);
        }
    }, [projects, projectId]);
    const { data: analysis, isLoading: analysisLoading } = (0, react_query_1.useQuery)({
        queryKey: ['analysis', projectId],
        queryFn: async () => {
            if (!projectId)
                return null;
            const response = await api_1.api.getAnalysis(projectId);
            return response.data;
        },
        enabled: !!projectId,
    });
    (0, react_1.useEffect)(() => {
        if (analysisIdFromUrl && analysis?.id === analysisIdFromUrl) {
            // Could auto-select theme or scroll to it
        }
    }, [analysisIdFromUrl, analysis]);
    const handleTraceClick = async (analysisTheme) => {
        try {
            const response = await api_1.api.getTrace(analysisTheme.id);
            setSelectedTheme({ ...analysisTheme, ...response.data });
        }
        catch (error) {
            console.error('Failed to fetch trace:', error);
            setSelectedTheme(analysisTheme);
        }
    };
    const buckets = ['NOW', 'NEXT', 'LATER'];
    const getThemesByBucket = (bucket) => {
        return analysis?.themes?.filter((t) => t.roadmap_bucket === bucket) || [];
    };
    if (projectsLoading) {
        return (<div className="space-y-6">
        <skeleton_1.Skeleton className="h-12 w-64"/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (<skeleton_1.Skeleton key={i} className="h-96 w-full"/>))}
        </div>
      </div>);
    }
    if (!projectId) {
        return (<card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Roadmap</card_1.CardTitle>
          <card_1.CardDescription>No project selected</card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <p className="text-muted-foreground">Select a project to view roadmap.</p>
        </card_1.CardContent>
      </card_1.Card>);
    }
    if (analysisLoading) {
        return (<div className="space-y-6">
        <div className="flex items-center justify-between">
          <skeleton_1.Skeleton className="h-8 w-48"/>
          <skeleton_1.Skeleton className="h-10 w-32"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (<skeleton_1.Skeleton key={i} className="h-96 w-full"/>))}
        </div>
      </div>);
    }
    if (!analysis || analysis.status !== 'COMPLETED') {
        return (<div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Roadmap</h2>
        </div>
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>No completed analysis</card_1.CardTitle>
            <card_1.CardDescription>
              {analysis?.status === 'PROCESSING'
                ? 'Analysis is currently running. Please wait...'
                : analysis?.status === 'FAILED'
                    ? 'Previous analysis failed. Try again.'
                    : 'Start a synthesis to generate roadmap items.'}
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            {analysis?.status !== 'PROCESSING' && (<button_1.Button onClick={() => router.push('/')} className="glow">
                Go to Dashboard
              </button_1.Button>)}
          </card_1.CardContent>
        </card_1.Card>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Roadmap</h2>
          <p className="text-muted-foreground">
            Analysis completed on {new Date(analysis.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {buckets.map((bucket) => (<RoadmapColumn_1.RoadmapColumn key={bucket} bucket={bucket} themes={getThemesByBucket(bucket)} onTraceClick={handleTraceClick}/>))}
      </div>

      {selectedTheme && (<TraceDrawer_1.TraceDrawer theme={selectedTheme} onClose={() => setSelectedTheme(null)}/>)}
    </div>);
}
//# sourceMappingURL=page.js.map