"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardLayout;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const authStore_1 = require("@/stores/authStore");
const header_1 = require("@/components/header");
function DashboardLayout({ children }) {
    const router = (0, navigation_1.useRouter)();
    const pathname = (0, navigation_1.usePathname)();
    const { isAuthenticated, isLoading, logout } = (0, authStore_1.useAuthStore)();
    (0, react_1.useEffect)(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);
    if (isLoading) {
        return (<div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>);
    }
    if (!isAuthenticated) {
        return null;
    }
    return (<div className="min-h-screen bg-background">
      <header_1.Header />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>);
}
//# sourceMappingURL=layout.js.map