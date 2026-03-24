'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sentix/ui/components/tabs';
import { Button } from '@sentix/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sentix/ui/components/card';
import { Badge } from '@sentix/ui/components/badge';
import { Skeleton } from '@sentix/ui/components/skeleton';
import { RefreshCw, Wrench, Activity, HardDrive } from 'lucide-react';

const TABS = ['queues', 'health', 'stats'] as const;

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'queues';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Admin access required</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">System monitoring and management</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queues">Queues</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="queues" className="space-y-4 mt-6">
          <QueueMonitor />
        </TabsContent>

        <TabsContent value="health" className="space-y-4 mt-6">
          <HealthMonitor />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4 mt-6">
          <StatsMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QueueMonitor() {
  const queryClient = useQueryClient();
  const { data: queues, isLoading } = useQuery({
    queryKey: ['admin', 'queues'],
    queryFn: async () => {
      const response = await api.get('/admin/queues');
      return response.data.queues;
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (queueName: string) => {
      await api.post(`/admin/queues/${queueName}/retry-failed`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'queues'] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Queue Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Queue Status</CardTitle>
        <CardDescription>BullMQ job queue statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {queues?.map((queue: any) => (
            <div key={queue.name} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  <h3 className="font-semibold capitalize">{queue.name}</h3>
                </div>
                <div className="flex gap-2">
                  {queue.failed > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryMutation.mutate(queue.name)}
                      disabled={retryMutation.isPending}
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
                      Retry Failed ({queue.failed})
                    </Button>
                  )}
                  {queue.paused && (
                    <Badge variant="destructive">Paused</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Waiting</p>
                  <p className="font-semibold">{queue.waiting}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Active</p>
                  <p className="font-semibold">{queue.active}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delayed</p>
                  <p className="font-semibold">{queue.delayed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completed</p>
                  <p className="font-semibold text-success">{queue.completed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Failed</p>
                  <p className="font-semibold text-destructive">{queue.failed}</p>
                </div>
              </div>
            </div>
          ))}

          {queues?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No queues configured</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HealthMonitor() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: async () => {
      const response = await api.get('/admin/health');
      return response.data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isHealthy = (service: any) => service?.status === 'healthy';

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Database</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant={isHealthy(health?.database) ? 'default' : 'destructive'}>
            {health?.database?.status || 'unknown'}
          </Badge>
          {health?.database?.error && (
            <p className="text-xs text-destructive mt-2">{health.database.error}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Redis</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant={isHealthy(health?.redis) ? 'default' : 'destructive'}>
            {health?.redis?.status || 'unknown'}
          </Badge>
          {health?.redis?.error && (
            <p className="text-xs text-destructive mt-2">{health.redis.error}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Workers</CardTitle>
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant={health?.workers?.count > 0 ? 'default' : 'secondary'}>
            {health?.workers?.count || 0} active
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsMonitor() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
      return response.data;
    },
  });

  const statItems = [
    { label: 'Users', value: stats?.users, icon: Users },
    { label: 'Organizations', value: stats?.organizations, icon: Building },
    { label: 'Projects', value: stats?.projects, icon: FolderOpen },
    { label: 'Signals', value: stats?.signals, icon: MessageSquare },
    { label: 'Analyses', value: stats?.analyses, icon: BarChart as any },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statItems.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value || 0}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Icons for stats
function Users(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3.99-4H10a4 4 0 0 0-4 4v2"/><path d="M15 3h5v5"/></svg>
  );
}

function Building(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
  );
}

function FolderOpen(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66 1.2h3.34a2 2 0 0 1 1.66 1.2l.82-1.2a2 2 0 0 1 1.66-.9H16a2 2 0 0 1 1.94 2.5L21 17.34a2 2 0 0 1-.59 1.34"/><path d="M4 22h16"/><path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h16"/></svg>
  );
}

function MessageSquare(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  );
}

function BarChart(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
  );
}
