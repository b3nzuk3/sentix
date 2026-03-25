"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectSelector = ProjectSelector;
const navigation_1 = require("next/navigation");
const react_query_1 = require("@tanstack/react-query");
const api_1 = require("@/lib/api");
const authStore_1 = require("@/stores/authStore");
const dropdown_menu_1 = require("@sentix/ui/components/dropdown-menu");
const button_1 = require("@sentix/ui/components/button");
const lucide_react_1 = require("lucide-react");
function ProjectSelector() {
    const router = (0, navigation_1.useRouter)();
    const { org } = (0, authStore_1.useAuthStore)();
    const { data: projects, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await api_1.api.getProjects();
            return response.data;
        },
    });
    const handleProjectSelect = (projectId) => {
        router.push(`/projects/${projectId}`);
    };
    if (isLoading) {
        return (<button_1.Button variant="ghost" disabled className="w-48">
        <lucide_react_1.Building className="mr-2 h-4 w-4"/>
        Loading...
      </button_1.Button>);
    }
    return (<dropdown_menu_1.DropdownMenu>
      <dropdown_menu_1.DropdownMenuTrigger asChild>
        <button_1.Button variant="outline" className="w-48 justify-start">
          <lucide_react_1.Building className="mr-2 h-4 w-4"/>
          {org?.name || 'Select Project'}
        </button_1.Button>
      </dropdown_menu_1.DropdownMenuTrigger>
      <dropdown_menu_1.DropdownMenuContent align="start" className="w-48">
        {projects?.length === 0 ? (<dropdown_menu_1.DropdownMenuItem disabled>No projects yet</dropdown_menu_1.DropdownMenuItem>) : (projects?.map((project) => (<dropdown_menu_1.DropdownMenuItem key={project.id} onClick={() => handleProjectSelect(project.id)}>
              {project.name}
            </dropdown_menu_1.DropdownMenuItem>)))}
        <DropdownMenuSeparator />
        <dropdown_menu_1.DropdownMenuItem onClick={() => router.push('/projects/new')}>
          <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
          New Project
        </dropdown_menu_1.DropdownMenuItem>
      </dropdown_menu_1.DropdownMenuContent>
    </dropdown_menu_1.DropdownMenu>);
}
//# sourceMappingURL=project-selector.js.map