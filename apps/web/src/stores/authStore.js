"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthStore = void 0;
const zustand_1 = require("zustand");
exports.useAuthStore = (0, zustand_1.create)((set) => ({
    user: null,
    org: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    setAuth: (user, org, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        set({
            user,
            org,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
        });
    },
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({
            user: null,
            org: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
        });
    },
    setLoading: (loading) => set({ isLoading: loading }),
}));
// Initialize from localStorage on load
if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (accessToken && refreshToken) {
        // We would need to fetch user profile here, but for now just mark as auth
        exports.useAuthStore.setState({
            accessToken,
            refreshToken,
            isAuthenticated: true,
        });
    }
}
//# sourceMappingURL=authStore.js.map