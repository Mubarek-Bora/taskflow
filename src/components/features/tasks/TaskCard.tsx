"use client";

import type { ChangeEvent } from "react";
import { Pencil, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { useDeleteTask, useUpdateTask, type Task, type TaskStatus } from "@/hooks/useTasks";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

interface TaskCardProps {
  task: Task;
  projectId: string;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, projectId, onEdit }: TaskCardProps) {
  const updateTask = useUpdateTask(projectId, task.id);
  const deleteTask = useDeleteTask(projectId);

  const isOverdue = !!task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateTask.mutate(
      { status: e.target.value as TaskStatus },
      {
        onError: (err) => {
          toast.error(err instanceof ApiClientError ? err.message : "Something went wrong");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    deleteTask.mutate(task.id, {
      onError: (err) => {
        toast.error(err instanceof ApiClientError ? err.message : "Something went wrong");
      },
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{task.title}</p>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Edit ${task.title}`}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label={`Delete ${task.title}`}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}

      {task.dueDate && (
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs",
            isOverdue ? "text-danger" : "text-muted-foreground"
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {new Date(task.dueDate).toLocaleDateString()}
          {isOverdue && <span className="font-medium">Overdue</span>}
        </div>
      )}

      <Select
        value={task.status}
        onChange={handleStatusChange}
        disabled={updateTask.isPending}
        aria-label={`Move ${task.title}`}
        className="mt-3 h-8 text-xs"
      >
        {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </Select>
    </Card>
  );
}
