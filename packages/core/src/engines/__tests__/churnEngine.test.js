"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const churnEngine_1 = require("../churnEngine");
describe('Churn Engine', () => {
    it('calculates churn risk based on complaint frequency and severity', () => {
        const signals = [
            {
                id: '1',
                text: 'Critical bug: cannot login, blocking work',
                account_name: 'Acme',
                created_at: new Date(),
                project_id: 'p1',
                source_type: 'SLACK',
                signal_type: 'BUG'
            },
            {
                id: '2',
                text: 'Urgent: system down, losing deals',
                account_name: 'Beta',
                created_at: new Date(),
                project_id: 'p1',
                source_type: 'TRANSCRIPT',
                signal_type: 'COMPLAINT'
            },
            {
                id: '3',
                text: 'Major issue with reports',
                account_name: 'Gamma',
                created_at: new Date(),
                project_id: 'p1',
                source_type: 'HUBSPOT',
                signal_type: 'BUG'
            },
            {
                id: '4',
                text: 'Minor bug in UI',
                account_name: 'Delta',
                created_at: new Date(),
                project_id: 'p1',
                source_type: 'JIRA',
                signal_type: 'BUG'
            }
        ];
        const result = (0, churnEngine_1.analyzeChurn)(signals);
        // 1 critical (3x), 1 urgent (2x), 1 major (1.5x), 1 minor (1x) -> total weight = 7.5
        // Threshold normalization: assume threshold of 2 complains = 1.0 risk
        // Expected: min(1.0, 7.5 / 2) = 1.0 (capped at 1)
        expect(result.risk).toBeCloseTo(1.0, 1);
    });
    it('returns 0 for no complaints', () => {
        const signals = [
            {
                id: '1',
                text: 'Feature request: add dark mode',
                account_name: 'Acme',
                created_at: new Date(),
                project_id: 'p1',
                source_type: 'SLACK',
                signal_type: 'FEATURE_REQUEST'
            }
        ];
        const result = (0, churnEngine_1.analyzeChurn)(signals);
        expect(result.risk).toBe(0);
    });
    it('weights severity correctly', () => {
        const signals = [
            {
                id: '1',
                text: 'Blocking issue - cannot pay invoice (critical)',
                account_name: 'Acme',
                created_at: new Date(),
                project_id: 'p1',
                source_type: 'TRANSCRIPT',
                signal_type: 'COMPLAINT'
            }
        ];
        const result = (0, churnEngine_1.analyzeChurn)(signals);
        // Critical = 3x weight. Threshold 2 => 3/2 = 1.5 -> capped to 1.0
        expect(result.risk).toBeCloseTo(1.0, 1);
    });
    it('handles empty array', () => {
        const result = (0, churnEngine_1.analyzeChurn)([]);
        expect(result.risk).toBe(0);
    });
});
//# sourceMappingURL=churnEngine.test.js.map