"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProjectsPage;
const react_query_1 = require("@tanstack/react-query");
const navigation_1 = require("next/navigation");
const api_1 = require("@/lib/api");
const button_1 = require("@sentix/ui/components/button");
const card_1 = require("@sentix/ui/components/card");
const skeleton_1 = require("@sentix/ui/components/skeleton");
const lucide_react_1 = require("lucide-react");
function ProjectsPage() {
    const router = (0, navigation_1.useRouter)();
    const queryClient = (0, react_query_1.useQueryClient)();
    const { data: projects, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await api_1.api.getProjects();
            return response.data;
        },
    });
    const deleteMutation = (0, react_query_1.useMutation)({
        mutationFn: async (projectId) => {
            await api_1.api.deleteProject(projectId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
    const handleDelete = (project) => {
        if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
            deleteMutation.mutate(project.id);
        }
    };
    if (isLoading) {
        return (<div className="space-y-6">
        <skeleton_1.Skeleton className="h-12 w-48"/>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (<skeleton_1.Skeleton key={i} className="h-40 w-full"/>))}
        </div>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">Manage your product projects</p>
        </div>
        <button_1.Button onClick={() => router.push('/projects/new')}>
          <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
          New Project
        </button_1.Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (<card_1.Card key={project.id} className="group">
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-start justify-between">
                {project.name}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button_1.Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/projects/${project.id}/edit`)}>
                    <lucide_react_1.Pencil className="h-4 w-4"/>
                  </button_1.Button>
                  <button_1.Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(project)} disabled={deleteMutation.isPending}>
                    <lucide_react_1.Trash2 className="h-4 w-4"/>
                  </button_1.Button>
                </div>
              </card_1.CardTitle>
              {project.description && (<card_1.CardDescription className="line-clamp-2">
                  {project.description}
                </card_1.CardDescription>)}
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Signals</p>
                  <p className="font-semibold text-lg">{project._count?.signals || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Analyses</p>
                  <p className="font-semibold text-lg">{project._count?.analyses || 0}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Created</p>
                  <p className="text-sm">{new Date(project.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button_1.Button variant="outline" className="flex-1" onClick={() => router.push(`/`)}>
                  <lucide_react_1.Eye className="mr-2 h-4 w-4"/>
                  Open Dashboard
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>))}

        {projects?.length === 0 && (<div className="col-span-full text-center py-12">
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <button_1.Button onClick={() => router.push('/projects/new')}>
              Create your first project
            </button_1.Button>
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map