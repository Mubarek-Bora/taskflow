const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: "Sign-in was cancelled.",
  oauth_failed: "Something went wrong signing in. Please try again.",
  oauth_not_configured: "OAuth sign-in isn't configured yet.",
  oauth_email_unverified:
    "That provider didn't confirm your email address, so we can't link it to an existing account.",
};

export function getOAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return OAUTH_ERROR_MESSAGES[code] ?? "Sign-in failed. Please try again.";
}
