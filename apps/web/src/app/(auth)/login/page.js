"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginPage;
const react_1 = require("react");
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("@hookform/resolvers/zod");
const zod_2 = require("zod");
const navigation_1 = require("next/navigation");
const authStore_1 = require("@/stores/authStore");
const api_1 = require("@/lib/api");
const button_1 = require("@sentix/ui/components/button");
const input_1 = require("@sentix/ui/components/input");
const label_1 = require("@sentix/ui/components/label");
const card_1 = require("@sentix/ui/components/card");
const alert_1 = require("@sentix/ui/components/alert");
const lucide_react_1 = require("lucide-react");
const loginSchema = zod_2.z.object({
    email: zod_2.z.string().email('Invalid email address'),
    password: zod_2.z.string().min(1, 'Password is required'),
});
function LoginPage() {
    const router = (0, navigation_1.useRouter)();
    const { setAuth, setLoading } = (0, authStore_1.useAuthStore)();
    const [error, setError] = (0, react_1.useState)(null);
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const { register, handleSubmit, formState: { errors }, } = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(loginSchema),
    });
    const onSubmit = async (data) => {
        setError(null);
        setIsSubmitting(true);
        try {
            const response = await api_1.api.login(data.email, data.password);
            const { user, org, tokens } = response.data;
            setAuth(user, org, tokens.access_token, tokens.refresh_token);
            router.push('/');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="flex min-h-screen items-center justify-center bg-background p-4">
      <card_1.Card className="w-full max-w-md">
        <card_1.CardHeader className="space-y-1">
          <card_1.CardTitle className="text-2xl font-bold">Sign in to Sentix</card_1.CardTitle>
          <card_1.CardDescription>Enter your credentials to access your account</card_1.CardDescription>
        </card_1.CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <card_1.CardContent className="space-y-4">
            {error && (<alert_1.Alert variant="destructive">
                <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
              </alert_1.Alert>)}

            <div className="space-y-2">
              <label_1.Label htmlFor="email">Email</label_1.Label>
              <input_1.Input id="email" type="email" placeholder="name@example.com" {...register('email')}/>
              {errors.email && (<p className="text-sm text-destructive">{errors.email.message}</p>)}
            </div>

            <div className="space-y-2">
              <label_1.Label htmlFor="password">Password</label_1.Label>
              <input_1.Input id="password" type="password" {...register('password')}/>
              {errors.password && (<p className="text-sm text-destructive">{errors.password.message}</p>)}
            </div>
          </card_1.CardContent>
          <card_1.CardFooter>
            <button_1.Button type="submit" className="w-full glow" disabled={isSubmitting}>
              {isSubmitting ? (<>
                  <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Signing in...
                </>) : ('Sign in')}
            </button_1.Button>
          </card_1.CardFooter>
        </form>
      </card_1.Card>
    </div>);
}
//# sourceMappingURL=page.js.map