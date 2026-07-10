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

describe("projects", () => {
  let owner: TestClient;
  let other: TestClient;

  beforeAll(async () => {
    owner = await registeredClient("proj-owner");
    other = await registeredClient("proj-other");
  });

  it("rejects unauthenticated access", async () => {
    const anon = new TestClient();
    expect((await anon.get("/api/projects")).status).toBe(401);
  });

  it("creates, lists, fetches, updates, and soft-deletes a project", async () => {
    const create = await owner.post("/api/projects", {
      name: "Integration Project",
      description: "created by tests",
    });
    expect(create.status).toBe(201);
    const project = (await create.json()).project;
    expect(project.name).toBe("Integration Project");

    const list = await owner.get("/api/projects?search=Integration Project");
    expect(list.status).toBe(200);
    const listBody = await list.json();
    expect(listBody.items.some((p: { id: string }) => p.id === project.id)).toBe(true);

    const get = await owner.get(`/api/projects/${project.id}`);
    expect(get.status).toBe(200);

    const patch = await owner.patch(`/api/projects/${project.id}`, { name: "Renamed" });
    expect(patch.status).toBe(200);
    expect((await patch.json()).project.name).toBe("Renamed");

    const del = await owner.delete(`/api/projects/${project.id}`);
    expect(del.status).toBe(200);

    const getAfterDelete = await owner.get(`/api/projects/${project.id}`);
    expect(getAfterDelete.status).toBe(404);
  });

  it("rejects an empty name", async () => {
    const res = await owner.post("/api/projects", { name: "" });
    expect(res.status).toBe(400);
  });

  it("isolates projects between users: other users get 404, not the data", async () => {
    const create = await owner.post("/api/projects", { name: "Owner Only Project" });
    const project = (await create.json()).project;

    expect((await other.get(`/api/projects/${project.id}`)).status).toBe(404);
    expect(
      (await other.patch(`/api/projects/${project.id}`, { name: "Hijacked" })).status
    ).toBe(404);
    expect((await other.delete(`/api/projects/${project.id}`)).status).toBe(404);

    // owner is unaffected
    expect((await owner.get(`/api/projects/${project.id}`)).status).toBe(200);
  });

  it("paginates results", async () => {
    for (let i = 0; i < 3; i++) {
      await owner.post("/api/projects", { name: `Paginated Project ${i}-${Date.now()}` });
    }

    const page1 = await owner.get("/api/projects?page=1&pageSize=2");
    const body = await page1.json();
    expect(body.items.length).toBeLessThanOrEqual(2);
    expect(body.pagination).toMatchObject({ page: 1, pageSize: 2 });
  });
});
