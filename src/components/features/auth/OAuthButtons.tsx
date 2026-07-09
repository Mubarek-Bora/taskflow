import { GithubIcon, GoogleIcon } from "@/components/ui/icons";

export function OAuthButtons() {
  return (
    <div className="space-y-2">
      <a
        href="/api/auth/oauth/google/start"
        className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-default)] border border-border text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <GoogleIcon className="h-4 w-4" />
        Continue with Google
      </a>
      <a
        href="/api/auth/oauth/github/start"
        className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-default)] border border-border text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <GithubIcon className="h-4 w-4" />
        Continue with GitHub
      </a>
    </div>
  );
}
