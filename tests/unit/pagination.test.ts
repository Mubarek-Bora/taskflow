import { describe, it, expect } from "vitest";
import { parsePagination, paginationMeta } from "@/lib/pagination";

describe("parsePagination", () => {
  it("uses defaults when no params are given", () => {
    const result = parsePagination(new URLSearchParams());
    expect(result).toEqual({ page: 1, pageSize: 20, skip: 0, take: 20 });
  });

  it("honors explicit page and pageSize", () => {
    const result = parsePagination(new URLSearchParams("page=3&pageSize=10"));
    expect(result).toEqual({ page: 3, pageSize: 10, skip: 20, take: 10 });
  });

  it("clamps page to a minimum of 1 for zero/negative/invalid values", () => {
    expect(parsePagination(new URLSearchParams("page=0")).page).toBe(1);
    expect(parsePagination(new URLSearchParams("page=-5")).page).toBe(1);
    expect(parsePagination(new URLSearchParams("page=nonsense")).page).toBe(1);
  });

  it("clamps pageSize to a maximum of 100", () => {
    expect(parsePagination(new URLSearchParams("pageSize=500")).pageSize).toBe(100);
  });

  it("clamps a negative pageSize to a minimum of 1", () => {
    expect(parsePagination(new URLSearchParams("pageSize=-5")).pageSize).toBe(1);
  });

  it("falls back to the default pageSize when given 0 (falsy, not a valid override)", () => {
    expect(parsePagination(new URLSearchParams("pageSize=0")).pageSize).toBe(20);
  });

  it("respects custom defaults", () => {
    const result = parsePagination(new URLSearchParams(), { page: 2, pageSize: 5 });
    expect(result).toEqual({ page: 2, pageSize: 5, skip: 5, take: 5 });
  });
});

describe("paginationMeta", () => {
  it("computes totalPages from total and pageSize", () => {
    expect(paginationMeta(1, 20, 45)).toEqual({ page: 1, pageSize: 20, total: 45, totalPages: 3 });
  });

  it("returns totalPages of 1 when there are zero results", () => {
    expect(paginationMeta(1, 20, 0).totalPages).toBe(1);
  });

  it("returns exact page count when total divides evenly", () => {
    expect(paginationMeta(1, 10, 30).totalPages).toBe(3);
  });
});
