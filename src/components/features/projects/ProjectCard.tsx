"use client";

import Link from "next/link";
import { Pencil, Trash2, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { useDeleteProject, type Project } from "@/hooks/useProjects";
import { ApiClientError } from "@/lib/api-client";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
}

export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  const deleteProject = useDeleteProject();

  const handleDelete = () => {
    if (!window.confirm(`Delete "${project.name}"? This can't be undone.`)) return;
    deleteProject.mutate(project.id, {
      onSuccess: () => toast.success("Project deleted"),
      onError: (err) => {
        toast.error(err instanceof ApiClientError ? err.message : "Something went wrong");
      },
    });
  };

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/dashboard/projects/${project.id}`}
          className="text-base font-semibold text-foreground hover:text-primary"
        >
          {project.name}
        </Link>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onEdit(project)}
            aria-label={`Edit ${project.name}`}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label={`Delete ${project.name}`}
            disabled={deleteProject.isPending}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-danger disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {project.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
      )}

      <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ListTodo className="h-3.5 w-3.5" />
        <span>
          {project._count.tasks} {project._count.tasks === 1 ? "task" : "tasks"}
        </span>
      </div>
    </Card>
  );
}
