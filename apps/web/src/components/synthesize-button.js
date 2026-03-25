"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynthesizeButton = SynthesizeButton;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const api_1 = require("@/lib/api");
const button_1 = require("@sentix/ui/components/button");
const card_1 = require("@sentix/ui/components/card");
const progress_1 = require("@sentix/ui/components/progress");
const lucide_react_1 = require("lucide-react");
function SynthesizeButton({ projectId, onComplete }) {
    const [status, setStatus] = (0, react_1.useState)('idle');
    const [jobId, setJobId] = (0, react_1.useState)(null);
    const [progress, setProgress] = (0, react_1.useState)(0);
    const [error, setError] = (0, react_1.useState)(null);
    const startMutation = (0, react_query_1.useMutation)({
        mutationFn: async () => {
            const response = await api_1.api.startSynthesis(projectId);
            return response.data;
        },
        onSuccess: (data) => {
            setJobId(data.job_id);
            setStatus('queued');
            setError(null);
        },
    });
    const pollJobStatus = (0, react_1.useCallback)(async () => {
        if (!jobId)
            return;
        try {
            const response = await api_1.api.getSynthesisStatus(jobId);
            const { status: jobStatus } = response.data;
            if (jobStatus === 'completed') {
                setStatus('completed');
                setProgress(100);
                onComplete?.();
                // Auto-redirect to roadmap after 2 seconds
                setTimeout(() => {
                    window.location.href = `/roadmap?analysis_id=${jobId}`;
                }, 2000);
            }
            else if (jobStatus === 'failed') {
                setStatus('failed');
                setError(response.data.error?.message || 'Synthesis failed');
            }
            else if (jobStatus === 'active' || jobStatus === 'waiting') {
                setStatus('processing');
                // Update progress based on job progress if available
                if (response.data.progress) {
                    const percent = (response.data.progress.current / response.data.progress.total) * 100;
                    setProgress(percent);
                }
            }
        }
        catch (err) {
            if (err.response?.status !== 404) {
                console.error('Polling error:', err);
            }
        }
    }, [jobId, onComplete]);
    (0, react_1.useEffect)(() => {
        let interval;
        if (status === 'queued' || status === 'processing') {
            // Poll every 3 seconds
            interval = setInterval(() => {
                pollJobStatus();
            }, 3000);
            // Initial poll
            pollJobStatus();
        }
        return () => {
            if (interval)
                clearInterval(interval);
        };
    }, [status, pollJobStatus]);
    const handleClick = () => {
        if (status === 'idle') {
            setProgress(0);
            startMutation.mutate();
        }
    };
    const getButtonText = () => {
        if (startMutation.isPending)
            return 'Starting...';
        if (status === 'queued')
            return 'Queued';
        if (status === 'processing')
            return 'Processing...';
        if (status === 'completed')
            return 'Complete!';
        if (status === 'failed')
            return 'Failed - Retry';
        return 'Synthesize Roadmap';
    };
    const getProgressLabel = () => {
        if (status === 'queued')
            return 'Waiting in queue...';
        if (status === 'processing')
            return `Processing: ${Math.round(progress)}%`;
        if (status === 'completed')
            return 'Roadmap generated successfully!';
        if (status === 'failed')
            return error || 'Unknown error';
        return 'Click to synthesize all signals into roadmap';
    };
    const isButtonDisabled = startMutation.isPending ||
        status === 'queued' ||
        status === 'processing' ||
        status === 'completed';
    return (<card_1.Card>
      <card_1.CardHeader>
        <card_1.CardTitle>Synthesize</card_1.CardTitle>
        <card_1.CardDescription>AI-powered analysis of your signals</card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent className="space-y-4">
        {status === 'processing' && (<progress_1.Progress value={progress} className="w-full"/>)}

        <div className="flex items-center gap-2 text-sm">
          {status === 'idle' && (<span className="text-muted-foreground">{getProgressLabel()}</span>)}
          {status === 'queued' && (<>
              <lucide_react_1.Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>
              <span className="text-muted-foreground">{getProgressLabel()}</span>
            </>)}
          {status === 'processing' && (<>
              <lucide_react_1.Loader2 className="h-4 w-4 animate-spin text-primary"/>
              <span>{getProgressLabel()}</span>
            </>)}
          {status === 'completed' && (<>
              <lucide_react_1.CheckCircle2 className="h-4 w-4 text-success"/>
              <span className="text-success">{getProgressLabel()}</span>
            </>)}
          {status === 'failed' && (<>
              <lucide_react_1.AlertCircle className="h-4 w-4 text-destructive"/>
              <span className="text-destructive">{getProgressLabel()}</span>
            </>)}
        </div>

        <button_1.Button onClick={handleClick} disabled={isButtonDisabled} className="w-full glow" variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'default'}>
          {getButtonText()}
        </button_1.Button>

        {status === 'completed' && (<p className="text-xs text-success text-center">
            Redirecting to roadmap...
          </p>)}
      </card_1.CardContent>
    </card_1.Card>);
}
//# sourceMappingURL=synthesize-button.js.map