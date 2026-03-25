"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SignalsPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const react_query_1 = require("@tanstack/react-query");
const api_1 = require("@/lib/api");
const button_1 = require("@sentix/ui/components/button");
const input_1 = require("@sentix/ui/components/input");
const select_1 = require("@sentix/ui/components/select");
const table_1 = require("@sentix/ui/components/table");
const alert_dialog_1 = require("@sentix/ui/components/alert-dialog");
const card_1 = require("@sentix/ui/components/card");
const skeleton_1 = require("@sentix/ui/components/skeleton");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
function SignalsPage({ params }) {
    const router = (0, navigation_1.useRouter)();
    const [projectId, setProjectId] = (0, react_1.useState)(null);
    const [page, setPage] = (0, react_1.useState)(1);
    const [sourceType, setSourceType] = (0, react_1.useState)('');
    const [accountName, setAccountName] = (0, react_1.useState)('');
    const [deleteId, setDeleteId] = (0, react_1.useState)(null);
    const queryClient = (0, react_query_1.useQueryClient)();
    useEffect(() => {
        params.then((p) => setProjectId(p.projectId));
    }, [params]);
    const { data, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['signals', projectId, page, sourceType, accountName],
        queryFn: async () => {
            if (!projectId)
                return null;
            const response = await api_1.api.getSignals(projectId, {
                page,
                limit: 20,
                source_type: sourceType || undefined,
                account_name: accountName || undefined,
            });
            return response.data;
        },
        enabled: !!projectId,
    });
    const deleteMutation = (0, react_query_1.useMutation)({
        mutationFn: async (signalId) => {
            await api_1.api.deleteSignal(signalId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['signals'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
    const handleDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
        }
    };
    const exportCSV = () => {
        if (!data?.signals)
            return;
        const headers = ['ID', 'Source Type', 'Account Name', 'Text', 'Created At'];
        const rows = data.signals.map((s) => [
            s.id,
            s.source_type,
            s.account_name || '',
            `"${s.text.replace(/"/g, '""')}"`,
            s.created_at,
        ]);
        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'signals.csv';
        a.click();
        URL.revokeObjectURL(url);
    };
    if (!projectId) {
        return <div>Loading...</div>;
    }
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Signals</h2>
          <p className="text-muted-foreground">Manage customer feedback and signals</p>
        </div>
        <button_1.Button variant="outline" onClick={exportCSV} disabled={!data?.signals?.length}>
          <lucide_react_1.Download className="mr-2 h-4 w-4"/>
          Export CSV
        </button_1.Button>
      </div>

      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Filters</card_1.CardTitle>
          <card_1.CardDescription>Filter signals by source or account</card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <lucide_react_1.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <input_1.Input placeholder="Search account name..." value={accountName} onChange={(e) => setAccountName(e.target.value)} className="pl-9"/>
            </div>
            <div className="w-48">
              <select_1.Select value={sourceType} onValueChange={setSourceType}>
                <select_1.SelectTrigger>
                  <select_1.SelectValue placeholder="All sources"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="">All sources</select_1.SelectItem>
                  <select_1.SelectItem value="support">Support</select_1.SelectItem>
                  <select_1.SelectItem value="sales">Sales</select_1.SelectItem>
                  <select_1.SelectItem value="nps">NPS</select_1.SelectItem>
                  <select_1.SelectItem value="manual">Manual</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            <button_1.Button variant="outline" onClick={() => { setSourceType(''); setAccountName(''); }}>
              <lucide_react_1.Filter className="mr-2 h-4 w-4"/>
              Clear
            </button_1.Button>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      <card_1.Card>
        <card_1.CardContent className="p-0">
          {isLoading ? (<div className="p-8">
              <skeleton_1.Skeleton className="h-8 w-full mb-4"/>
              <skeleton_1.Skeleton className="h-8 w-full mb-2"/>
              <skeleton_1.Skeleton className="h-8 w-full"/>
            </div>) : data?.signals?.length === 0 ? (<div className="p-8 text-center text-muted-foreground">
              No signals found. Add some signals to get started.
            </div>) : (<table_1.Table>
              <table_1.TableHeader>
                <table_1.TableRow>
                  <table_1.TableHead>ID</table_1.TableHead>
                  <table_1.TableHead>Source</table_1.TableHead>
                  <table_1.TableHead>Account</table_1.TableHead>
                  <table_1.TableHead>Text Preview</table_1.TableHead>
                  <table_1.TableHead>Created</table_1.TableHead>
                  <table_1.TableHead className="text-right">Actions</table_1.TableHead>
                </table_1.TableRow>
              </table_1.TableHeader>
              <table_1.TableBody>
                {data?.signals?.map((signal) => (<table_1.TableRow key={signal.id}>
                    <table_1.TableCell className="font-mono text-xs">
                      {signal.id.slice(0, 8)}...
                    </table_1.TableCell>
                    <table_1.TableCell>
                      <span className="px-2 py-1 bg-muted rounded text-xs">
                        {signal.source_type}
                      </span>
                    </table_1.TableCell>
                    <table_1.TableCell>{signal.account_name || '-'}</table_1.TableCell>
                    <table_1.TableCell className="max-w-md">
                      <p title={signal.text} className="truncate">
                        {(0, utils_1.truncate)(signal.text, 100)}
                      </p>
                    </table_1.TableCell>
                    <table_1.TableCell className="text-sm">
                      {new Date(signal.created_at).toLocaleDateString()}
                    </table_1.TableCell>
                    <table_1.TableCell className="text-right">
                      <button_1.Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(signal.id)}>
                        <lucide_react_1.Trash2 className="h-4 w-4"/>
                      </button_1.Button>
                    </table_1.TableCell>
                  </table_1.TableRow>))}
              </table_1.TableBody>
            </table_1.Table>)}
        </card_1.CardContent>
      </card_1.Card>

      {data?.pagination && (<div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} signals
          </p>
          <div className="flex gap-2">
            <button_1.Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button_1.Button>
            <button_1.Button variant="outline" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage(page + 1)}>
              Next
            </button_1.Button>
          </div>
        </div>)}

      <alert_dialog_1.AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <alert_dialog_1.AlertDialogContent>
          <alert_dialog_1.AlertDialogHeader>
            <alert_dialog_1.AlertDialogTitle>Delete Signal</alert_dialog_1.AlertDialogTitle>
            <alert_dialog_1.AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </alert_dialog_1.AlertDialogDescription>
          </alert_dialog_1.AlertDialogHeader>
          <alert_dialog_1.AlertDialogFooter>
            <alert_dialog_1.AlertDialogCancel>Cancel</alert_dialog_1.AlertDialogCancel>
            <alert_dialog_1.AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </alert_dialog_1.AlertDialogAction>
          </alert_dialog_1.AlertDialogFooter>
        </alert_dialog_1.AlertDialogContent>
      </alert_dialog_1.AlertDialog>
    </div>);
}
//# sourceMappingURL=page.js.map