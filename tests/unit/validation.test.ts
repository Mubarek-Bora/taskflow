import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validation/auth";
import { createProjectSchema, updateProjectSchema } from "@/lib/validation/project";
import { createTaskSchema, updateTaskSchema } from "@/lib/validation/task";

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "Ada@Example.com",
      password: "Passw0rd!",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // email is normalized: trimmed + lowercased
      expect(result.data.email).toBe("ada@example.com");
    }
  });

  it.each([
    ["short name", { name: "A", email: "a@b.com", password: "Passw0rd!" }],
    ["invalid email", { name: "Ada", email: "not-an-email", password: "Passw0rd!" }],
    ["password too short", { name: "Ada", email: "a@b.com", password: "Pw0!" }],
    ["password missing uppercase", { name: "Ada", email: "a@b.com", password: "password0" }],
    ["password missing lowercase", { name: "Ada", email: "a@b.com", password: "PASSWORD0" }],
    ["password missing number", { name: "Ada", email: "a@b.com", password: "Password" }],
  ])("rejects: %s", (_label, input) => {
    expect(registerSchema.safeParse(input).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts email + non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("createProjectSchema", () => {
  it("accepts a name-only project", () => {
    expect(createProjectSchema.safeParse({ name: "Website Relaunch" }).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(createProjectSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects a name over 120 chars", () => {
    expect(createProjectSchema.safeParse({ name: "x".repeat(121) }).success).toBe(false);
  });

  it("updateProjectSchema allows a fully empty patch", () => {
    expect(updateProjectSchema.safeParse({}).success).toBe(true);
  });
});

describe("createTaskSchema", () => {
  it("accepts a title-only task", () => {
    expect(createTaskSchema.safeParse({ title: "Write tests" }).success).toBe(true);
  });

  it("accepts a valid status + due date", () => {
    const result = createTaskSchema.safeParse({
      title: "Ship it",
      status: "IN_PROGRESS",
      dueDate: "2026-12-31",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status", () => {
    expect(
      createTaskSchema.safeParse({ title: "x", status: "BOGUS" }).success
    ).toBe(false);
  });

  it("rejects an unparsable due date", () => {
    expect(
      createTaskSchema.safeParse({ title: "x", dueDate: "not-a-date" }).success
    ).toBe(false);
  });

  it("allows an empty-string due date (treated as unset)", () => {
    expect(createTaskSchema.safeParse({ title: "x", dueDate: "" }).success).toBe(true);
  });

  it("updateTaskSchema allows a fully empty patch", () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(true);
  });
});
