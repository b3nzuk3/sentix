"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const google_1 = require("next/font/google");
require("./globals.css");
const query_provider_1 = require("@/lib/query-provider");
const inter = (0, google_1.Inter)({ subsets: ['latin'] });
exports.metadata = {
    title: 'Sentix - AI-Powered Product OS',
    description: 'Ingest customer signals, synthesize roadmap decisions with AI',
};
function RootLayout({ children, }) {
    return (<html lang="en" className="dark">
      <body className={inter.className}>
        <query_provider_1.QueryProvider>{children}</query_provider_1.QueryProvider>
      </body>
    </html>);
}
//# sourceMappingURL=layout.js.map