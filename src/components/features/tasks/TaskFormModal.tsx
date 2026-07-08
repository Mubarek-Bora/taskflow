"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validation/task";
import { useCreateTask, useUpdateTask, type Task, type TaskStatus } from "@/hooks/useTasks";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Label, FieldError } from "@/components/ui/Label";
import { ApiClientError } from "@/lib/api-client";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  task?: Task | null;
  defaultStatus?: TaskStatus;
}

export function TaskFormModal({ open, onClose, projectId, task, defaultStatus }: TaskFormModalProps) {
  const isEditing = !!task;
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId, task?.id ?? "");
  const mutation = isEditing ? updateTask : createTask;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskInput>({ resolver: zodResolver(createTaskSchema) });

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? "",
        description: task?.description ?? "",
        status: task?.status ?? defaultStatus ?? "TODO",
        dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
      });
    }
  }, [open, task, defaultStatus, reset]);

  const onSubmit = (data: CreateTaskInput) => {
    mutation.mutate(data, {
      onSuccess: () => {
        toast.success(isEditing ? "Task updated" : "Task created");
        onClose();
      },
      onError: (err) => {
        toast.error(err instanceof ApiClientError ? err.message : "Something went wrong");
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit task" : "New task"}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <Label htmlFor="task-title">Title</Label>
          <Input id="task-title" error={errors.title?.message} {...register("title")} />
          <FieldError>{errors.title?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="task-description">Description</Label>
          <Textarea
            id="task-description"
            rows={3}
            error={errors.description?.message}
            {...register("description")}
          />
          <FieldError>{errors.description?.message}</FieldError>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="task-status">Status</Label>
            <Select id="task-status" {...register("status")}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="task-due-date">Due date</Label>
            <Input id="task-due-date" type="date" error={errors.dueDate?.message} {...register("dueDate")} />
            <FieldError>{errors.dueDate?.message}</FieldError>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {isEditing ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
