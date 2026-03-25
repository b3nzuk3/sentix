import { AnalysisTheme } from '@sentix/types';
interface RoadmapColumnProps {
    bucket: 'NOW' | 'NEXT' | 'LATER';
    themes: AnalysisTheme[];
    onTraceClick: (theme: AnalysisTheme) => void;
}
export declare function RoadmapColumn({ bucket, themes, onTraceClick }: RoadmapColumnProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=RoadmapColumn.d.ts.map