'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@sentix/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sentix/ui';
import { Skeleton } from '@sentix/ui';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import type { Project } from '@sentix/types';

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.getProjects();
      return response.data as Project[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await api.deleteProject(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleDelete = (project: Project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      deleteMutation.mutate(project.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">Manage your product projects</p>
        </div>
        <Button onClick={() => router.push('/projects/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Card key={project.id} className="group">
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                {project.name}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => router.push(`/projects/${project.id}/edit`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(project)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              {project.description && (
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Signals</p>
                  <p className="font-semibold text-lg">{project._count?.signals || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Analyses</p>
                  <p className="font-semibold text-lg">{project._count?.analyses || 0}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Created</p>
                  <p className="text-sm">{new Date(project.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Open Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {projects?.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <Button onClick={() => router.push('/projects/new')}>
              Create your first project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
