"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { useProject } from "@/hooks/useProjects";
import { useTasks, type Task, type TaskStatus } from "@/hooks/useTasks";
import { TaskColumn } from "@/components/features/tasks/TaskColumn";
import { TaskFormModal } from "@/components/features/tasks/TaskFormModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: "TODO", title: "To Do" },
  { status: "IN_PROGRESS", title: "In Progress" },
  { status: "DONE", title: "Done" },
];

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: project, isLoading: projectLoading } = useProject(params.id);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data: tasks, isLoading: tasksLoading } = useTasks(params.id, search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("TODO");

  const openCreate = (status: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      {projectLoading ? (
        <Skeleton className="h-8 w-64" />
      ) : project ? (
        <>
          <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">Project not found.</p>
      )}

      {project && (
        <>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search tasks…"
                className="pl-9"
              />
            </div>
            <Button onClick={() => openCreate("TODO")}>
              <Plus className="h-4 w-4" />
              New task
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {tasksLoading
              ? COLUMNS.map((col) => <Skeleton key={col.status} className="h-64" />)
              : COLUMNS.map((col) => (
                  <TaskColumn
                    key={col.status}
                    status={col.status}
                    title={col.title}
                    tasks={(tasks ?? []).filter((t) => t.status === col.status)}
                    projectId={params.id}
                    onEdit={openEdit}
                    onAdd={openCreate}
                  />
                ))}
          </div>

          <TaskFormModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            projectId={params.id}
            task={editingTask}
            defaultStatus={defaultStatus}
          />
        </>
      )}
    </div>
  );
}
