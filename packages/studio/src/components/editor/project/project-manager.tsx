/**
 * ProjectManager Component
 * Project list/dashboard with create, open, delete functionality
 */

import * as React from 'react';
import {
  FilePlus,
  FolderOpen,
  Trash2,
  MoreVertical,
  Search,
  Calendar,
  Copy,
  Download,
} from 'lucide-react';
import { useProjectStore } from '@/stores/project-store';
import type { ProjectListItem } from '@/types/project';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface ProjectManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectOpen?: (projectId: string) => void;
  className?: string;
}

export const ProjectManager = React.memo(
  ({ open, onOpenChange, onProjectOpen, className }: ProjectManagerProps) => {
    const {
      projects,
      createProject,
      deleteProject,
      duplicateProject,
      loadProject,
      refreshProjectsList,
      storageStats,
      getStorageStats,
    } = useProjectStore();

    const [searchQuery, setSearchQuery] = React.useState('');
    const [projectToDelete, setProjectToDelete] = React.useState<ProjectListItem | null>(
      null
    );
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isCreating, setIsCreating] = React.useState(false);
    const [isDuplicating, setIsDuplicating] = React.useState<string | null>(null);

    // Load projects on mount
    React.useEffect(() => {
      if (open) {
        refreshProjectsList();
        getStorageStats();
      }
    }, [open, refreshProjectsList, getStorageStats]);

    // Filter projects by search query
    const filteredProjects = React.useMemo(() => {
      if (!searchQuery.trim()) {
        return projects;
      }

      const query = searchQuery.toLowerCase();
      return projects.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query)
      );
    }, [projects, searchQuery]);

    // Handle project open
    const handleProjectOpen = async (project: ProjectListItem) => {
      try {
        await loadProject(project.id);
        onOpenChange(false);
        onProjectOpen?.(project.id);
      } catch (error) {
        console.error('Failed to load project:', error);
      }
    };

    // Handle project delete
    const handleProjectDelete = async () => {
      if (!projectToDelete) return;

      setIsDeleting(true);

      try {
        await deleteProject(projectToDelete.id);
        setProjectToDelete(null);
      } catch (error) {
        console.error('Failed to delete project:', error);
      } finally {
        setIsDeleting(false);
      }
    };

    // Handle project duplicate
    const handleProjectDuplicate = async (project: ProjectListItem) => {
      setIsDuplicating(project.id);

      try {
        await duplicateProject(project.id);
      } catch (error) {
        console.error('Failed to duplicate project:', error);
      } finally {
        setIsDuplicating(null);
      }
    };

    // Handle create new project
    const handleCreateProject = async () => {
      setIsCreating(true);

      try {
        const project = await createProject(`Untitled Project ${projects.length + 1}`);
        onOpenChange(false);
        onProjectOpen?.(project.id);
      } catch (error) {
        console.error('Failed to create project:', error);
      } finally {
        setIsCreating(false);
      }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    };

    // Format file size
    const formatStorageSize = (bytes: number) => {
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(1)} MB`;
    };

    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Projects</DialogTitle>
              <DialogDescription>
                Manage your website projects. Create, open, or delete projects.
                {storageStats && (
                  <span className="block mt-1 text-xs">
                    {storageStats.totalProjects} projects •{' '}
                    {formatStorageSize(storageStats.totalSize)} used
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search and Create */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  onClick={handleCreateProject}
                  disabled={isCreating}
                  className="shrink-0"
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>

              {/* Projects List */}
              <div className="border rounded-lg">
                <ScrollArea className="h-[400px]">
                  {filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-1">
                        {searchQuery
                          ? 'No projects found'
                          : 'No projects yet'}
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        {searchQuery
                          ? 'Try a different search term'
                          : 'Create your first project to get started'}
                      </p>
                      {!searchQuery && (
                        <Button
                          onClick={handleCreateProject}
                          disabled={isCreating}
                          variant="outline"
                        >
                          <FilePlus className="h-4 w-4 mr-2" />
                          Create Project
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredProjects.map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                        >
                          {/* Thumbnail */}
                          {project.thumbnail ? (
                            <div className="h-16 w-16 rounded border overflow-hidden shrink-0 bg-background">
                              <img
                                src={project.thumbnail}
                                alt={project.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center shrink-0">
                              <span className="text-xs text-muted-foreground font-medium">
                                {project.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{project.name}</h3>
                            {project.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {project.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(project.updatedAt)}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleProjectOpen(project)}
                              variant="default"
                              size="sm"
                            >
                              Open
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleProjectDuplicate(project)}
                                  disabled={isDuplicating === project.id}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setProjectToDelete(project)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!projectToDelete}
          onOpenChange={(open) => !open && setProjectToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{projectToDelete?.name}&quot;?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleProjectDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);

ProjectManager.displayName = 'ProjectManager';
