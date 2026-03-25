interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}
interface Org {
    id: string;
    name: string;
    slug: string;
}
interface AuthState {
    user: User | null;
    org: Org | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
interface AuthActions {
    setAuth: (user: User, org: Org, accessToken: string, refreshToken: string) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthState & AuthActions>>;
export {};
//# sourceMappingURL=authStore.d.ts.map