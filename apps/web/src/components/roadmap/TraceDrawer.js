"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceDrawer = TraceDrawer;
const react_1 = require("react");
const sheet_1 = require("@sentix/ui/components/sheet");
const separator_1 = require("@sentix/ui/components/separator");
const badge_1 = require("@sentix/ui/components/badge");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
function TraceDrawer({ theme, onClose }) {
    const { analysis_theme, theme: aiTheme, signals } = theme;
    (0, react_1.useEffect)(() => {
        // Close on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);
    return (<sheet_1.Sheet open onOpenChange={() => onClose()} modal={false}>
      <sheet_1.SheetContent side="right" className="w-full md:max-w-2xl overflow-y-auto">
        <sheet_1.SheetHeader className="mb-6">
          <sheet_1.SheetTitle className="text-xl">{aiTheme.title}</sheet_1.SheetTitle>
          <sheet_1.SheetDescription>
            Detailed breakdown of analysis and supporting evidence
          </sheet_1.SheetDescription>
        </sheet_1.SheetHeader>

        <div className="space-y-6">
          {/* Overview Section */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Overview
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2 mb-1">
                  <lucide_react_1.Target className="h-4 w-4 text-primary"/>
                  <span className="text-xs text-muted-foreground">Priority</span>
                </div>
                <badge_1.Badge variant="outline" className="font-semibold">
                  {analysis_theme?.roadmap_bucket || 'N/A'}
                </badge_1.Badge>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2 mb-1">
                  <lucide_react_1.TrendingUp className="h-4 w-4 text-destructive"/>
                  <span className="text-xs text-muted-foreground">Revenue Lost</span>
                </div>
                <p className="text-lg font-bold text-destructive">
                  {(0, utils_1.formatCurrency)(analysis_theme?.revenue_lost || 0)}
                </p>
                {analysis_theme?.revenue_at_risk > 0 && (<p className="text-xs text-warning">
                    +{(0, utils_1.formatCurrency)(analysis_theme.revenue_at_risk)} at risk
                  </p>)}
              </div>

              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2 mb-1">
                  <lucide_react_1.Clock className="h-4 w-4"/>
                  <span className="text-xs text-muted-foreground">Effort</span>
                </div>
                <p className="text-lg font-bold">{analysis_theme?.effort_days} days</p>
                <badge_1.Badge variant="secondary" className={`mt-1 ${(0, utils_1.getEffortBucketColor)(analysis_theme?.effort_bucket || '')}`}>
                  {analysis_theme?.effort_bucket}
                </badge_1.Badge>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2 mb-1">
                  <lucide_react_1.TrendingDown className="h-4 w-4"/>
                  <span className="text-xs text-muted-foreground">Churn Risk</span>
                </div>
                <p className="text-lg font-bold">
                  {analysis_theme?.churn_probability > 0
            ? `${Math.round(analysis_theme.churn_probability * 100)}%`
            : 'N/A'}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 mb-1">
                <lucide_react_1.Target className="h-4 w-4"/>
                <span className="text-xs text-muted-foreground">Confidence</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(analysis_theme?.confidence || 0) * 100}%` }}/>
                </div>
                <span className="text-sm font-mono">
                  {Math.round((analysis_theme?.confidence || 0) * 100)}%
                </span>
              </div>
            </div>
          </section>

          <separator_1.Separator />

          {/* Reasoning Section */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Reasoning
            </h3>
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 mb-2">
                <lucide_react_1.Lightbulb className="h-4 w-4"/>
                <span className="font-medium">AI Summary</span>
              </div>
              <p className="text-sm leading-relaxed">{aiTheme?.summary || 'No summary available.'}</p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 mb-3">
                <lucide_react_1.BarChart3 className="h-4 w-4"/>
                <span className="font-medium">Engine Outputs</span>
              </div>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
                {JSON.stringify(analysis_theme?.engine_outputs || {}, null, 2)}
              </pre>
            </div>
          </section>

          <separator_1.Separator />

          {/* Evidence Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Supporting Evidence ({signals?.length || 0})
              </h3>
              <badge_1.Badge variant="outline">
                {theme.evidence_ids?.length || 0} citations
              </badge_1.Badge>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {signals?.map((signal) => (<div key={signal.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground truncate">
                        {signal.account_name || 'Unknown Account'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {signal.source_type || 'Unknown source'}
                      </p>
                    </div>
                    <lucide_react_1.ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground"/>
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-3">{signal.text}</p>
                </div>))}

              {signals?.length === 0 && (<p className="text-center text-muted-foreground text-sm py-4">
                  No supporting signals found.
                </p>)}
            </div>
          </section>
        </div>
      </sheet_1.SheetContent>
    </sheet_1.Sheet>);
}
//# sourceMappingURL=TraceDrawer.js.map