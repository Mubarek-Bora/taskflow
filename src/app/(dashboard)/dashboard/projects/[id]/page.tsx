"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useProject } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(params.id);

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      {isLoading ? (
        <Skeleton className="h-8 w-64" />
      ) : project ? (
        <>
          <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          )}
          <p className="mt-8 text-sm text-muted-foreground">
            The task board for this project is coming next.
          </p>
        </>
      ) : (
        <p className="text-muted-foreground">Project not found.</p>
      )}
    </div>
  );
}
