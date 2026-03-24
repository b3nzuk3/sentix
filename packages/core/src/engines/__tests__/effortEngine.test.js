"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const effortEngine_1 = require("../effortEngine");
describe('Effort Engine', () => {
    it('classifies HIGH effort for infrastructure/auth/compliance keywords', () => {
        const signals = [
            {
                id: '1',
                text: 'Need SAML/SSO integration for enterprise',
                account_name: 'Acme',
                created_at: new Date(),
                project_id: 'p1',
                source_type: 'SLACK',
                signal_type: 'FEATURE_REQUEST'
            }
        ];
        const result = (0, effortEngine_1.estimate)({ title: 'Implement SAML SSO' }, signals);
        expect(result.bucket).toBe('HIGH');
        expect(result.estimate).toBeGreaterThanOrEqual(5);
    });
    it('classifies MEDIUM effort for API/performance/bug keywords', () => {
        const signals = [
            {
                id: '1',
                text: 'API response times are too slow',
                account_name: 'Acme',
                created_at: new Date(),
                project_id: 'p1',
                source_type: 'JIRA',
                signal_type: 'BUG'
            }
        ];
        const result = (0, effortEngine_1.estimate)({ title: 'Fix API performance' }, signals);
        expect(result.bucket).toBe('MEDIUM');
        expect(result.estimate).toBeGreaterThanOrEqual(2);
        expect(result.estimate).toBeLessThanOrEqual(4);
    });
    it('classifies LOW effort for UI/UX/copy/styling keywords', () => {
        const signals = [
            {
                id: '1',
                text: 'Button color doesn\'t match brand guidelines',
                account_name: 'Acme',
                created_at: new Date(),
                project_id: 'p1',
                source_type: 'ZENDESK',
                signal_type: 'QUESTION'
            }
        ];
        const result = (0, effortEngine_1.estimate)({ title: 'Fix button color' }, signals);
        expect(result.bucket).toBe('LOW');
        expect(result.estimate).toBeLessThan(2);
    });
    it('defaults to MEDIUM when no keywords match', () => {
        const signals = [
            {
                id: '1',
                text: 'Some vague requirement',
                account_name: 'Acme',
                created_at: new Date(),
                project_id: 'p1',
                source_type: 'MANUAL',
                signal_type: 'FEATURE_REQUEST'
            }
        ];
        const result = (0, effortEngine_1.estimate)({ title: 'Generic feature' }, signals);
        expect(result.bucket).toBe('MEDIUM');
        expect(result.estimate).toBeGreaterThanOrEqual(2);
    });
    it('handles empty signals array', () => {
        const result = (0, effortEngine_1.estimate)({ title: 'Unknown' }, []);
        expect(result.bucket).toBe('MEDIUM');
    });
    it('combines multiple signals to influence estimate', () => {
        const signals = [
            {
                id: '1',
                text: 'Need responsive layout',
                account_name: 'Acme',
                created_at: new Date(),
                project_id: 'p1',
                source_type: 'SLACK',
                signal_type: 'FEATURE_REQUEST'
            },
            {
                id: '2',
                text: 'Add dark mode support',
                account_name: 'Beta',
                created_at: new Date(),
                project_id: 'p1',
                source_type: 'TRANSCRIPT',
                signal_type: 'FEATURE_REQUEST'
            }
        ];
        const result = (0, effortEngine_1.estimate)({ title: 'UI improvements' }, signals);
        expect(result.bucket).toBe('LOW');
        expect(result.estimate).toBeLessThan(2);
    });
});
//# sourceMappingURL=effortEngine.test.js.map