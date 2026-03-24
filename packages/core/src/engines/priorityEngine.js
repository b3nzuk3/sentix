"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decide = decide;
// Result type exported via PriorityResult in types
/**
 * Decides roadmap priority based on revenue impact, churn risk, and effort.
 *
 * Decision matrix (evaluated in order):
 * 1. IF effort=LOW AND revenue_lost > 0 → NOW (0.9)
 * 2. IF revenue_lost ≥ 10000 → NOW (0.9)
 * 3. IF churn_probability ≥ 0.7 → NOW (0.8)
 * 4. IF revenue_at_risk ≥ 5000 → NEXT (0.7)
 * 5. IF effort=LOW → LATER (0.6)
 * 6. DEFAULT → LATER (0.5)
 */
function decide(inputs) {
    const { revenue_lost, revenue_at_risk, churn_probability, effort_bucket } = inputs;
    // Rule 1: Quick win (low effort + proven revenue impact)
    if (effort_bucket === 'LOW' && revenue_lost > 0) {
        return { bucket: 'NOW', confidence: 0.9 };
    }
    // Rule 2: High lost revenue demands immediate attention
    if (revenue_lost >= 10000) {
        return { bucket: 'NOW', confidence: 0.9 };
    }
    // Rule 3: High churn risk is urgent
    if (churn_probability >= 0.7) {
        return { bucket: 'NOW', confidence: 0.8 };
    }
    // Rule 4: Significant at-risk revenue should be planned soon
    if (revenue_at_risk >= 5000) {
        return { bucket: 'NEXT', confidence: 0.7 };
    }
    // Rule 5: Low effort items without urgency can be done later
    if (effort_bucket === 'LOW') {
        return { bucket: 'LATER', confidence: 0.6 };
    }
    // Rule 6: Default is LATER with baseline confidence
    return { bucket: 'LATER', confidence: 0.5 };
}
//# sourceMappingURL=priorityEngine.js.map