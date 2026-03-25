'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@sentix/ui';
import { Input } from '@sentix/ui';
import { Label } from '@sentix/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sentix/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sentix/ui';
import { Skeleton } from '@sentix/ui';
import { Upload, FileText, Trash2 } from 'lucide-react';
import type { Signal } from '@sentix/types';

interface IngestPanelProps {
  projectId: string;
}

type UploadResult = {
  count: number;
  signals: Array<{ project_id: string; source_type: string; text: string; account_name?: string }>;
};

export function IngestPanel({ projectId }: IngestPanelProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceType, setSourceType] = useState('manual');
  const [manualText, setManualText] = useState('');
  const [accountName, setAccountName] = useState('');
  const [recentSignals, setRecentSignals] = useState<Signal[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.uploadSignals(formData);
      return response.data as UploadResult;
    },
    onSuccess: (data) => {
      setRecentSignals(data.signals);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('source_type', sourceType);

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    if (manualText) {
      formData.append('text', manualText);
      formData.append('account_name', accountName || '');
    }

    await uploadMutation.mutateAsync(formData);
  };

  const handleManualSubmit = async () => {
    if (!manualText.trim()) return;

    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('source_type', sourceType);
    formData.append('text', manualText);
    formData.append('account_name', accountName || '');

    await uploadMutation.mutateAsync(formData);
    setManualText('');
    setAccountName('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingest Signals</CardTitle>
        <CardDescription>
          Upload signal files or manually add customer feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text" onValueChange={setSourceType} value={sourceType}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Text</TabsTrigger>
            <TabsTrigger value="file">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="sourceType">Source Type</Label>
              <Input
                id="sourceType"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                placeholder="e.g., support, sales, nps"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name (optional)</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manualText">Signal Text</Label>
              <textarea
                id="manualText"
                className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste customer feedback, support ticket, or deal loss reason..."
              />
            </div>
            <Button onClick={handleManualSubmit} disabled={uploadMutation.isPending || !manualText.trim()}>
              {uploadMutation.isPending ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Add Signal
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="file" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="fileSourceType">Source Type</Label>
              <Input
                id="fileSourceType"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                placeholder="e.g., support, sales, nps"
              />
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,.json,.txt"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-2">Drop files here or click to upload</p>
              <p className="text-xs text-muted-foreground mb-4">
                Supports CSV, JSON, TXT. Max 10MB per file.
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Select Files'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Recent Signals Preview */}
        {recentSignals.length > 0 && (
          <div className="mt-6 space-y-2">
            <Label>Recently Added Signals</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentSignals.map((signal, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-md bg-muted"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{signal.account_name || 'Unknown Account'}</p>
                    <p className="text-xs text-muted-foreground truncate">{signal.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
