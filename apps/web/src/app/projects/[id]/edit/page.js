"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EditProjectPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("@hookform/resolvers/zod");
const zod_2 = require("zod");
const api_1 = require("@/lib/api");
const button_1 = require("@sentix/ui/components/button");
const input_1 = require("@sentix/ui/components/input");
const label_1 = require("@sentix/ui/components/label");
const card_1 = require("@sentix/ui/components/card");
const alert_1 = require("@sentix/ui/components/alert");
const lucide_react_1 = require("lucide-react");
const projectSchema = zod_2.z.object({
    name: zod_2.z.string().min(1, 'Project name is required'),
    description: zod_2.z.string().max(500).optional(),
});
function EditProjectPage({ params }) {
    const router = (0, navigation_1.useRouter)();
    const [projectId, setProjectId] = (0, react_1.useState)(null);
    const [originalProject, setOriginalProject] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const { register, handleSubmit, reset, formState: { errors }, } = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(projectSchema),
    });
    (0, react_1.useEffect)(() => {
        params.then((p) => {
            setProjectId(p.id);
            fetchProject(p.id);
        });
    }, [params]);
    const fetchProject = async (id) => {
        try {
            const response = await api_1.api.getProject(id);
            setOriginalProject(response.data);
            reset({
                name: response.data.name,
                description: response.data.description || '',
            });
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load project');
        }
        finally {
            setIsLoading(false);
        }
    };
    const onSubmit = async (data) => {
        if (!projectId)
            return;
        setError(null);
        setIsSubmitting(true);
        try {
            await api_1.api.updateProject(projectId, data);
            router.push('/projects');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to update project');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (isLoading) {
        return (<div className="max-w-2xl mx-auto">
        <card_1.Card>
          <card_1.CardContent className="py-12 text-center">
            <lucide_react_1.Loader2 className="mx-auto h-8 w-8 animate-spin"/>
            <p className="mt-4 text-muted-foreground">Loading project...</p>
          </card_1.CardContent>
        </card_1.Card>
      </div>);
    }
    if (!originalProject) {
        return (<div className="max-w-2xl mx-auto">
        <card_1.Card>
          <card_1.CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">Project not found</p>
            <button_1.Button onClick={() => router.push('/projects')}>
              Back to Projects
            </button_1.Button>
          </card_1.CardContent>
        </card_1.Card>
      </div>);
    }
    return (<div className="max-w-2xl mx-auto">
      <card_1.Card>
        <CardHeader>
          <card_1.CardTitle>Edit Project</card_1.CardTitle>
          <card_1.CardDescription>
            Update project details
          </card_1.CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <card_1.CardContent className="space-y-4">
            {error && (<alert_1.Alert variant="destructive">
                <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
              </alert_1.Alert>)}

            <div className="space-y-2">
              <label_1.Label htmlFor="name">Project Name</label_1.Label>
              <input_1.Input id="name" {...register('name')}/>
              {errors.name && (<p className="text-sm text-destructive">{errors.name.message}</p>)}
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="description">Description (optional)</label_1.Label>
              <textarea id="description" className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('description')}/>
              {errors.description && (<p className="text-sm text-destructive">{errors.description.message}</p>)}
            </div>
          </card_1.CardContent>
          <card_1.CardFooter className="flex justify-between">
            <button_1.Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </button_1.Button>
            <button_1.Button type="submit" disabled={isSubmitting} className="glow">
              {isSubmitting ? (<>
                  <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Saving...
                </>) : ('Save Changes')}
            </button_1.Button>
          </card_1.CardFooter>
        </form>
      </card_1.Card>
    </div>);
}
//# sourceMappingURL=page.js.map