"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NewProjectPage;
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
function NewProjectPage() {
    const router = (0, navigation_1.useRouter)();
    const [error, setError] = (0, react_1.useState)(null);
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const { register, handleSubmit, formState: { errors }, } = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(projectSchema),
    });
    const onSubmit = async (data) => {
        setError(null);
        setIsSubmitting(true);
        try {
            const response = await api_1.api.createProject(data);
            const project = response.data;
            router.push(`/`);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to create project');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="max-w-2xl mx-auto">
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Create New Project</card_1.CardTitle>
          <card_1.CardDescription>
            Set up a new project to start collecting signals
          </card_1.CardDescription>
        </card_1.CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <card_1.CardContent className="space-y-4">
            {error && (<alert_1.Alert variant="destructive">
                <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
              </alert_1.Alert>)}

            <div className="space-y-2">
              <label_1.Label htmlFor="name">Project Name</label_1.Label>
              <input_1.Input id="name" placeholder="My Awesome Project" {...register('name')}/>
              {errors.name && (<p className="text-sm text-destructive">{errors.name.message}</p>)}
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="description">Description (optional)</label_1.Label>
              <textarea id="description" className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="What problem are you solving?" {...register('description')}/>
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
                  Creating...
                </>) : ('Create Project')}
            </button_1.Button>
          </card_1.CardFooter>
        </form>
      </card_1.Card>
    </div>);
}
//# sourceMappingURL=page.js.map