"use client";

import { useEffect, useState } from "react";
import { FolderKanban, Plus, Search } from "lucide-react";
import { useProjects, type Project } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/features/projects/ProjectCard";
import { ProjectFormModal } from "@/components/features/projects/ProjectFormModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DashboardPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isPlaceholderData } = useProjects({ search, page });

  const openCreateModal = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize your work into projects and track tasks on a board.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search projects…"
          className="pl-9"
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
              isPlaceholderData ? "opacity-60" : ""
            }`}
          >
            {data.items.map((project) => (
              <ProjectCard key={project.id} project={project} onEdit={openEditModal} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FolderKanban className="h-8 w-8" />}
            title={search ? "No projects match your search" : "No projects yet"}
            description={
              search
                ? "Try a different search term."
                : "Create your first project to start tracking tasks."
            }
            action={
              !search && (
                <Button onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  New project
                </Button>
              )
            }
          />
        )}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <ProjectFormModal open={modalOpen} onClose={() => setModalOpen(false)} project={editingProject} />
    </div>
  );
}
