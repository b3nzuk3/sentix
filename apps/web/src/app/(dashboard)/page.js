"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const react_query_1 = require("@tanstack/react-query");
const api_1 = require("@/lib/api");
const authStore_1 = require("@/stores/authStore");
const ingest_panel_1 = require("@/components/ingest-panel");
const synthesize_button_1 = require("@/components/synthesize-button");
const recent_analyses_1 = require("@/components/recent-analyses");
const button_1 = require("@sentix/ui/components/button");
const skeleton_1 = require("@sentix/ui/components/skeleton");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
function DashboardPage() {
    const router = (0, navigation_1.useRouter)();
    const queryClient = (0, react_query_1.useQueryClient)();
    const { org } = (0, authStore_1.useAuthStore)();
    const [selectedProjectId, setSelectedProjectId] = (0, react_1.useState)(null);
    const { data: projects, isLoading: projectsLoading } = (0, react_query_1.useQuery)({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await api_1.api.getProjects();
            return response.data;
        },
    });
    const { data: analysis, isLoading: analysisLoading } = (0, react_query_1.useQuery)({
        queryKey: ['analysis', selectedProjectId],
        queryFn: async () => {
            if (!selectedProjectId)
                return null;
            const response = await api_1.api.getAnalysis(selectedProjectId);
            return response.data;
        },
        enabled: !!selectedProjectId,
    });
    // Auto-select first project if none selected
    (0, react_1.useState)(() => {
        if (!selectedProjectId && projects?.length > 0) {
            setSelectedProjectId(projects[0].id);
        }
    });
    const handleSynthesisComplete = () => {
        queryClient.invalidateQueries({ queryKey: ['analysis', selectedProjectId] });
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            {org?.name || 'Your Organization'}
          </p>
        </div>
        <div className="flex gap-2">
          <button_1.Button variant="outline" disabled>
            <lucide_react_1.RefreshCw className="mr-2 h-4 w-4"/>
            Refresh
          </button_1.Button>
          <button_1.Button onClick={() => router.push('/projects/new')}>New Project</button_1.Button>
        </div>
      </div>

      {/* Project Selection */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2 lg:col-span-4">
          <label className="text-sm font-medium mb-2 block">Active Project</label>
          {projectsLoading ? (<skeleton_1.Skeleton className="h-10 w-64"/>) : (<select className="w-full md:w-64 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={selectedProjectId || ''} onChange={(e) => setSelectedProjectId(e.target.value)}>
              {projects?.map((project) => (<option key={project.id} value={project.id}>
                  {project.name}
                </option>))}
            </select>)}
        </div>
      </div>

      {/* Main Content */}
      {selectedProjectId && (<div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Ingest & Synthesize */}
          <div className="md:col-span-1 space-y-6">
            <ingest_panel_1.IngestPanel projectId={selectedProjectId}/>
            <synthesize_button_1.SynthesizeButton projectId={selectedProjectId} onComplete={handleSynthesisComplete}/>
          </div>

          {/* Right Column: Analysis Summary */}
          <div className="md:col-span-2">
            {analysisLoading ? (<div className="space-y-4">
                <skeleton_1.Skeleton className="h-32 w-full"/>
                <skeleton_1.Skeleton className="h-64 w-full"/>
              </div>) : analysis ? (<div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Total Revenue Lost</p>
                    <p className="text-2xl font-bold text-destructive">
                      {(0, utils_1.formatCurrency)(analysis.total_revenue_lost || 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Revenue at Risk</p>
                    <p className="text-2xl font-bold text-warning">
                      {(0, utils_1.formatCurrency)(analysis.total_revenue_at_risk || 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Themes</p>
                    <p className="text-2xl font-bold">{analysis.themes?.length || 0}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`text-lg font-semibold ${analysis.status === 'COMPLETED' ? 'text-success' :
                    analysis.status === 'PROCESSING' ? 'text-warning' :
                        analysis.status === 'FAILED' ? 'text-destructive' : ''}`}>
                      {analysis.status}
                    </p>
                  </div>
                </div>

                {analysis.status === 'COMPLETED' && analysis.themes?.length > 0 && (<div className="rounded-lg border border-border bg-card p-4">
                    <h3 className="text-lg font-semibold mb-4">Roadmap Themes</h3>
                    <div className="space-y-2">
                      {analysis.themes.map((theme) => (<div key={theme.id} className="flex items-center justify-between p-3 rounded bg-muted">
                          <div>
                            <p className="font-medium">{theme.theme.title}</p>
                            <p className="text-sm text-muted-foreground">{theme.theme.summary}</p>
                          </div>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-primary text-primary-foreground">
                            {theme.roadmap_bucket}
                          </span>
                        </div>))}
                    </div>
                  </div>)}
              </div>) : (<div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No analysis yet. Upload signals and synthesize to generate roadmap.
                </p>
                <p className="text-sm text-muted-foreground">
                  Get started by adding signals to your project.
                </p>
              </div>)}
          </div>
        </div>)}

      {/* Recent Analyses */}
      {selectedProjectId && (<recent_analyses_1.RecentAnalyses projectId={selectedProjectId}/>)}
    </div>);
}
//# sourceMappingURL=page.js.map