import { logger } from "./logger";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function errorResponse(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message, details: err.details }, { status: err.status });
  }
  logger.error("Unhandled API error", {
    error: err instanceof Error ? err.message : String(err),
  });
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
