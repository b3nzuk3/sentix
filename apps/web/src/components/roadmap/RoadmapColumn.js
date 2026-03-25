"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoadmapColumn = RoadmapColumn;
const RoadmapCard_1 = require("./RoadmapCard");
const utils_1 = require("@/lib/utils");
const bucketColors = {
    NOW: 'border-l-4 border-l-destructive',
    NEXT: 'border-l-4 border-l-warning',
    LATER: 'border-l-4 border-l-primary',
};
const bucketDescriptions = {
    NOW: 'High impact, low effort - execute immediately',
    NEXT: 'Medium impact or effort - plan for next cycle',
    LATER: 'Big bets or low priority - monitor',
};
function RoadmapColumn({ bucket, themes, onTraceClick }) {
    return (<div className={(0, utils_1.cn)('space-y-4', bucketColors[bucket])}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{bucket}</h3>
          <p className="text-xs text-muted-foreground">{bucketDescriptions[bucket]}</p>
        </div>
        <span className="text-sm font-medium bg-muted px-2 py-1 rounded">
          {themes.length}
        </span>
      </div>

      <div className="space-y-3">
        {themes.map((theme) => (<RoadmapCard_1.RoadmapCard key={theme.id} theme={theme} onTraceClick={() => onTraceClick(theme)}/>))}

        {themes.length === 0 && (<div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
            No items in {bucket}
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=RoadmapColumn.js.map