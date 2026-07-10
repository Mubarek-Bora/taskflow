import { describe, it, expect } from "vitest";
import { getOAuthErrorMessage } from "@/lib/oauth/errors";

describe("getOAuthErrorMessage", () => {
  it("returns null for a null code", () => {
    expect(getOAuthErrorMessage(null)).toBeNull();
  });

  it("maps known error codes to friendly messages", () => {
    expect(getOAuthErrorMessage("oauth_denied")).toBe("Sign-in was cancelled.");
    expect(getOAuthErrorMessage("oauth_email_unverified")).toMatch(/didn't confirm your email/i);
  });

  it("falls back to a generic message for an unknown code", () => {
    expect(getOAuthErrorMessage("something_unexpected")).toBe(
      "Sign-in failed. Please try again."
    );
  });
});
