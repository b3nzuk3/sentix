"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_utils_1 = require("../../utils/test-utils");
(0, test_1.test)('GET /health returns ok', async () => {
    const response = await (0, test_utils_1.request)().get('/health');
    (0, test_1.expect)(response.status).toBe(200);
    (0, test_1.expect)(response.body).toEqual({ status: 'ok' });
});
//# sourceMappingURL=health.test.js.map