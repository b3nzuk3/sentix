'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@sentix/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sentix/ui';
import { Progress } from '@sentix/ui';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface SynthesizeButtonProps {
  projectId: string;
  onComplete?: () => void;
}

type JobStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

export function SynthesizeButton({ projectId, onComplete }: SynthesizeButtonProps) {
  const [status, setStatus] = useState<JobStatus>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await api.startSynthesis(projectId);
      return response.data;
    },
    onSuccess: (data) => {
      setJobId(data.job_id);
      setStatus('queued');
      setError(null);
    },
  });

  const pollJobStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await api.getSynthesisStatus(jobId);
      const { status: jobStatus } = response.data;

      if (jobStatus === 'completed') {
        setStatus('completed');
        setProgress(100);
        onComplete?.();
        // Auto-redirect to roadmap after 2 seconds
        setTimeout(() => {
          window.location.href = `/roadmap?analysis_id=${jobId}`;
        }, 2000);
      } else if (jobStatus === 'failed') {
        setStatus('failed');
        setError(response.data.error?.message || 'Synthesis failed');
      } else if (jobStatus === 'active' || jobStatus === 'waiting') {
        setStatus('processing');
        // Update progress based on job progress if available
        if (response.data.progress) {
          const percent = (response.data.progress.current / response.data.progress.total) * 100;
          setProgress(percent);
        }
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error('Polling error:', err);
      }
    }
  }, [jobId, onComplete]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === 'queued' || status === 'processing') {
      // Poll every 3 seconds
      interval = setInterval(() => {
        pollJobStatus();
      }, 3000);

      // Initial poll
      pollJobStatus();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, pollJobStatus]);

  const handleClick = () => {
    if (status === 'idle') {
      setProgress(0);
      startMutation.mutate();
    }
  };

  const getButtonText = () => {
    if (startMutation.isPending) return 'Starting...';
    if (status === 'queued') return 'Queued';
    if (status === 'processing') return 'Processing...';
    if (status === 'completed') return 'Complete!';
    if (status === 'failed') return 'Failed - Retry';
    return 'Synthesize Roadmap';
  };

  const getProgressLabel = () => {
    if (status === 'queued') return 'Waiting in queue...';
    if (status === 'processing') return `Processing: ${Math.round(progress)}%`;
    if (status === 'completed') return 'Roadmap generated successfully!';
    if (status === 'failed') return error || 'Unknown error';
    return 'Click to synthesize all signals into roadmap';
  };

  const isButtonDisabled =
    startMutation.isPending ||
    status === 'queued' ||
    status === 'processing' ||
    status === 'completed';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Synthesize</CardTitle>
        <CardDescription>AI-powered analysis of your signals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'processing' && (
          <Progress value={progress} className="w-full" />
        )}

        <div className="flex items-center gap-2 text-sm">
          {status === 'idle' && (
            <span className="text-muted-foreground">{getProgressLabel()}</span>
          )}
          {status === 'queued' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">{getProgressLabel()}</span>
            </>
          )}
          {status === 'processing' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{getProgressLabel()}</span>
            </>
          )}
          {status === 'completed' && (
            <>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-success">{getProgressLabel()}</span>
            </>
          )}
          {status === 'failed' && (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-destructive">{getProgressLabel()}</span>
            </>
          )}
        </div>

        <Button
          onClick={handleClick}
          disabled={isButtonDisabled}
          className="w-full glow"
          variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'default'}
        >
          {getButtonText()}
        </Button>

        {status === 'completed' && (
          <p className="text-xs text-success text-center">
            Redirecting to roadmap...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
