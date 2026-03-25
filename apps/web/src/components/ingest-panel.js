"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestPanel = IngestPanel;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const api_1 = require("@/lib/api");
const button_1 = require("@sentix/ui/components/button");
const input_1 = require("@sentix/ui/components/input");
const label_1 = require("@sentix/ui/components/label");
const card_1 = require("@sentix/ui/components/card");
const tabs_1 = require("@sentix/ui/components/tabs");
const lucide_react_1 = require("lucide-react");
function IngestPanel({ projectId }) {
    const queryClient = (0, react_query_1.useQueryClient)();
    const fileInputRef = (0, react_1.useRef)(null);
    const [sourceType, setSourceType] = (0, react_1.useState)('manual');
    const [manualText, setManualText] = (0, react_1.useState)('');
    const [accountName, setAccountName] = (0, react_1.useState)('');
    const [recentSignals, setRecentSignals] = (0, react_1.useState)([]);
    const uploadMutation = (0, react_query_1.useMutation)({
        mutationFn: async (formData) => {
            const response = await api_1.api.uploadSignals(formData);
            return response.data;
        },
        onSuccess: (data) => {
            setRecentSignals(data.signals);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
    const handleFileUpload = async (files) => {
        if (!files || files.length === 0)
            return;
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
        if (!manualText.trim())
            return;
        const formData = new FormData();
        formData.append('project_id', projectId);
        formData.append('source_type', sourceType);
        formData.append('text', manualText);
        formData.append('account_name', accountName || '');
        await uploadMutation.mutateAsync(formData);
        setManualText('');
        setAccountName('');
    };
    return (<card_1.Card>
      <card_1.CardHeader>
        <card_1.CardTitle>Ingest Signals</card_1.CardTitle>
        <card_1.CardDescription>
          Upload signal files or manually add customer feedback
        </card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <tabs_1.Tabs defaultValue="text" onValueChange={setSourceType} value={sourceType}>
          <tabs_1.TabsList className="grid w-full grid-cols-2">
            <tabs_1.TabsTrigger value="manual">Text</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="file">Files</tabs_1.TabsTrigger>
          </tabs_1.TabsList>

          <tabs_1.TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label_1.Label htmlFor="sourceType">Source Type</label_1.Label>
              <input_1.Input id="sourceType" value={sourceType} onChange={(e) => setSourceType(e.target.value)} placeholder="e.g., support, sales, nps"/>
            </div>
            <div className="space-y-2">
              <label_1.Label htmlFor="accountName">Account Name (optional)</label_1.Label>
              <input_1.Input id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Acme Inc."/>
            </div>
            <div className="space-y-2">
              <label_1.Label htmlFor="manualText">Signal Text</label_1.Label>
              <textarea id="manualText" className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Paste customer feedback, support ticket, or deal loss reason..."/>
            </div>
            <button_1.Button onClick={handleManualSubmit} disabled={uploadMutation.isPending || !manualText.trim()}>
              {uploadMutation.isPending ? (<>
                  <lucide_react_1.Upload className="mr-2 h-4 w-4 animate-spin"/>
                  Adding...
                </>) : (<>
                  <lucide_react_1.FileText className="mr-2 h-4 w-4"/>
                  Add Signal
                </>)}
            </button_1.Button>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="file" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label_1.Label htmlFor="fileSourceType">Source Type</label_1.Label>
              <input_1.Input id="fileSourceType" value={sourceType} onChange={(e) => setSourceType(e.target.value)} placeholder="e.g., support, sales, nps"/>
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input ref={fileInputRef} type="file" multiple accept=".csv,.json,.txt" className="hidden" onChange={(e) => handleFileUpload(e.target.files)}/>
              <lucide_react_1.Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
              <p className="text-sm font-medium mb-2">Drop files here or click to upload</p>
              <p className="text-xs text-muted-foreground mb-4">
                Supports CSV, JSON, TXT. Max 10MB per file.
              </p>
              <button_1.Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? (<>
                    <lucide_react_1.Upload className="mr-2 h-4 w-4 animate-spin"/>
                    Uploading...
                  </>) : ('Select Files')}
              </button_1.Button>
            </div>
          </tabs_1.TabsContent>
        </tabs_1.Tabs>

        {/* Recent Signals Preview */}
        {recentSignals.length > 0 && (<div className="mt-6 space-y-2">
            <label_1.Label>Recently Added Signals</label_1.Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentSignals.map((signal, idx) => (<div key={idx} className="flex items-start justify-between p-3 rounded-md bg-muted">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{signal.account_name || 'Unknown Account'}</p>
                    <p className="text-xs text-muted-foreground truncate">{signal.text}</p>
                  </div>
                </div>))}
            </div>
          </div>)}
      </card_1.CardContent>
    </card_1.Card>);
}
//# sourceMappingURL=ingest-panel.js.map