"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createProjectSchema, type CreateProjectInput } from "@/lib/validation/project";
import { useCreateProject, useUpdateProject, type Project } from "@/hooks/useProjects";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label, FieldError } from "@/components/ui/Label";
import { ApiClientError } from "@/lib/api-client";

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
}

export function ProjectFormModal({ open, onClose, project }: ProjectFormModalProps) {
  const isEditing = !!project;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject(project?.id ?? "");
  const mutation = isEditing ? updateProject : createProject;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({ resolver: zodResolver(createProjectSchema) });

  useEffect(() => {
    if (open) {
      reset({ name: project?.name ?? "", description: project?.description ?? "" });
    }
  }, [open, project, reset]);

  const onSubmit = (data: CreateProjectInput) => {
    mutation.mutate(data, {
      onSuccess: () => {
        toast.success(isEditing ? "Project updated" : "Project created");
        onClose();
      },
      onError: (err) => {
        toast.error(err instanceof ApiClientError ? err.message : "Something went wrong");
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit project" : "New project"}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <Label htmlFor="project-name">Name</Label>
          <Input id="project-name" error={errors.name?.message} {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="project-description">Description</Label>
          <Textarea
            id="project-description"
            rows={3}
            error={errors.description?.message}
            {...register("description")}
          />
          <FieldError>{errors.description?.message}</FieldError>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {isEditing ? "Save changes" : "Create project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
