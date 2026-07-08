import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TaskCard } from "./TaskCard";
import type { Task, TaskStatus } from "@/hooks/useTasks";

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  projectId: string;
  onEdit: (task: Task) => void;
  onAdd: (status: TaskStatus) => void;
}

const STATUS_DOT: Record<TaskStatus, string> = {
  TODO: "bg-sky-500",
  IN_PROGRESS: "bg-amber-500",
  DONE: "bg-emerald-500",
};

export function TaskColumn({ status, title, tasks, projectId, onEdit, onAdd }: TaskColumnProps) {
  return (
    <div className="flex flex-col rounded-[var(--radius-default)] bg-muted/50 p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
          {title}
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} projectId={projectId} onEdit={onEdit} />
        ))}
      </div>
      <Button variant="ghost" size="sm" className="mt-2 justify-start" onClick={() => onAdd(status)}>
        <Plus className="h-4 w-4" />
        Add task
      </Button>
    </div>
  );
}
