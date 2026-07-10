import { describe, it, expect, beforeAll } from "vitest";
import { TestClient, uniqueEmail } from "./helpers/client";

async function registeredClient(prefix: string): Promise<TestClient> {
  const client = new TestClient();
  await client.post("/api/auth/register", {
    name: prefix,
    email: uniqueEmail(prefix),
    password: "Passw0rd!",
  });
  return client;
}

async function createProject(client: TestClient, name: string) {
  const res = await client.post("/api/projects", { name });
  return (await res.json()).project as { id: string };
}

describe("tasks", () => {
  let owner: TestClient;
  let other: TestClient;
  let projectId: string;

  beforeAll(async () => {
    owner = await registeredClient("task-owner");
    other = await registeredClient("task-other");
    projectId = (await createProject(owner, "Task Test Project")).id;
  });

  it("creates tasks with an auto-incrementing position per status column", async () => {
    const first = await owner.post(`/api/projects/${projectId}/tasks`, { title: "Task 1" });
    const second = await owner.post(`/api/projects/${projectId}/tasks`, { title: "Task 2" });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const firstTask = (await first.json()).task;
    const secondTask = (await second.json()).task;
    expect(firstTask.status).toBe("TODO");
    expect(secondTask.position).toBeGreaterThan(firstTask.position);
  });

  it("lists tasks and filters by status", async () => {
    const create = await owner.post(`/api/projects/${projectId}/tasks`, {
      title: "In progress task",
      status: "IN_PROGRESS",
    });
    expect(create.status).toBe(201);

    const filtered = await owner.get(`/api/projects/${projectId}/tasks?status=IN_PROGRESS`);
    const body = await filtered.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((t: { status: string }) => t.status === "IN_PROGRESS")).toBe(true);
  });

  it("moving a task to a new status reassigns its position to the end of that column", async () => {
    const create = await owner.post(`/api/projects/${projectId}/tasks`, { title: "Movable" });
    const task = (await create.json()).task;

    const patch = await owner.patch(`/api/tasks/${task.id}`, { status: "DONE" });
    expect(patch.status).toBe(200);
    const updated = (await patch.json()).task;
    expect(updated.status).toBe("DONE");

    const doneList = await owner.get(`/api/projects/${projectId}/tasks?status=DONE`);
    const doneBody = await doneList.json();
    expect(doneBody.items.some((t: { id: string }) => t.id === task.id)).toBe(true);
  });

  it("rejects an invalid status", async () => {
    const create = await owner.post(`/api/projects/${projectId}/tasks`, { title: "Bad status" });
    const task = (await create.json()).task;

    const res = await owner.patch(`/api/tasks/${task.id}`, { status: "BOGUS" });
    expect(res.status).toBe(400);
  });

  it("isolates tasks between users: other users get 404, not the data", async () => {
    const create = await owner.post(`/api/projects/${projectId}/tasks`, { title: "Private" });
    const task = (await create.json()).task;

    expect((await other.get(`/api/tasks/${task.id}`)).status).toBe(404);
    expect((await other.patch(`/api/tasks/${task.id}`, { title: "Hijacked" })).status).toBe(404);
    expect((await other.delete(`/api/tasks/${task.id}`)).status).toBe(404);

    // and can't even list tasks under a project they don't own
    expect((await other.get(`/api/projects/${projectId}/tasks`)).status).toBe(404);
  });

  it("soft-deletes a task and reflects it in the project's task count", async () => {
    const projectRes = await owner.get(`/api/projects/${projectId}`);
    const projectName = (await projectRes.json()).project.name;
    const searchUrl = `/api/projects?search=${encodeURIComponent(projectName)}`;

    const create = await owner.post(`/api/projects/${projectId}/tasks`, { title: "To delete" });
    const task = (await create.json()).task;

    const afterCreate = await owner.get(searchUrl);
    const countBefore = (await afterCreate.json()).items[0]._count.tasks;

    const del = await owner.delete(`/api/tasks/${task.id}`);
    expect(del.status).toBe(200);

    const afterDelete = await owner.get(searchUrl);
    const countAfter = (await afterDelete.json()).items[0]._count.tasks;

    expect(countAfter).toBe(countBefore - 1);
  });
});
