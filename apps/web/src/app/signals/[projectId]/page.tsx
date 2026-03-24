'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@sentix/ui/components/button';
import { Input } from '@sentix/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sentix/ui/components/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@sentix/ui/components/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@sentix/ui/components/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sentix/ui/components/card';
import { Skeleton } from '@sentix/ui/components/skeleton';
import { formatDate, truncate } from '@/lib/utils';
import { Search, Trash2, Download, Filter } from 'lucide-react';
import type { Signal } from '@sentix/types';

interface SignalsPageProps {
  params: Promise<{ projectId: string }>;
}

export default function SignalsPage({ params }: SignalsPageProps) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sourceType, setSourceType] = useState<string>('');
  const [accountName, setAccountName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    params.then((p) => setProjectId(p.projectId));
  }, [params]);

  const { data, isLoading } = useQuery({
    queryKey: ['signals', projectId, page, sourceType, accountName],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await api.getSignals(projectId, {
        page,
        limit: 20,
        source_type: sourceType || undefined,
        account_name: accountName || undefined,
      });
      return response.data as { signals: Signal[]; pagination: { total: number; pages: number } };
    },
    enabled: !!projectId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (signalId: string) => {
      await api.deleteSignal(signalId);
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
    if (!data?.signals) return;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Signals</h2>
          <p className="text-muted-foreground">Manage customer feedback and signals</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={!data?.signals?.length}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter signals by source or account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search account name..."
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-48">
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger>
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sources</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="nps">NPS</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => { setSourceType(''); setAccountName(''); }}>
              <Filter className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8">
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : data?.signals?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No signals found. Add some signals to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Text Preview</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.signals?.map((signal) => (
                  <TableRow key={signal.id}>
                    <TableCell className="font-mono text-xs">
                      {signal.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-muted rounded text-xs">
                        {signal.source_type}
                      </span>
                    </TableCell>
                    <TableCell>{signal.account_name || '-'}</TableCell>
                    <TableCell className="max-w-md">
                      <p title={signal.text} className="truncate">
                        {truncate(signal.text, 100)}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(signal.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteId(signal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} signals
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Signal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
