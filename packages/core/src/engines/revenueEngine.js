"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeRevenue = analyzeRevenue;
/**
 * Analyzes signals to extract revenue impact.
 *
 * Keywords for lost revenue: lost, cancelled, canceled, downgraded, churned, terminated
 * Keywords for at-risk: at risk, downgrade, budget cut, reducing, scaling back
 *
 * Currency format: $1,234.56 or 1234.56 or $1234
 */
function analyzeRevenue(signals) {
    let totalLost = 0;
    let totalAtRisk = 0;
    // Use word boundaries to avoid partial matches like "50k"
    const lostKeywords = /\b(lost|cancel(led?)?|churned|terminated)\b/i;
    const atRiskKeywords = /\b(at risk|budget cut|reducing|scaling back|downgraded?)\b/i;
    const currencyRegex = /\$?\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/g;
    for (const signal of signals) {
        const text = signal.text;
        // Check if signal indicates lost revenue
        if (lostKeywords.test(text)) {
            currencyRegex.lastIndex = 0; // Reset global regex state
            const matches = text.match(currencyRegex);
            if (matches) {
                matches.forEach(match => {
                    const amount = parseCurrency(match);
                    totalLost += amount;
                });
            }
        }
        // Check if signal indicates revenue at risk
        if (atRiskKeywords.test(text)) {
            currencyRegex.lastIndex = 0; // Reset global regex state
            const matches = text.match(currencyRegex);
            if (matches) {
                matches.forEach(match => {
                    const amount = parseCurrency(match);
                    totalAtRisk += amount;
                });
            }
        }
    }
    return {
        total_lost: totalLost,
        at_risk: totalAtRisk
    };
}
function parseCurrency(text) {
    // Remove $ and commas, then parse
    const cleaned = text.replace(/[$,]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}
//# sourceMappingURL=revenueEngine.js.map