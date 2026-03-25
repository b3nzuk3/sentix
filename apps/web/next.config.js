"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nextConfig = {
    transpilePackages: ['@sentix/ui', '@sentix/types'],
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
};
exports.default = nextConfig;
//# sourceMappingURL=next.config.js.map