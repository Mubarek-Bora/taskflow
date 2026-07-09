export type OAuthProviderId = "google" | "github";

export interface OAuthProfile {
  providerAccountId: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface OAuthProviderConfig {
  id: OAuthProviderId;
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  getProfile: (accessToken: string) => Promise<OAuthProfile>;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function getGoogleProfile(accessToken: string): Promise<OAuthProfile> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Google profile");
  const data = await res.json();

  return {
    providerAccountId: data.sub,
    email: data.email,
    name: data.name ?? data.email,
    emailVerified: data.email_verified === true,
  };
}

async function getGithubProfile(accessToken: string): Promise<OAuthProfile> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "TaskFlow-App",
    Accept: "application/vnd.github+json",
  };

  const userRes = await fetch("https://api.github.com/user", { headers });
  if (!userRes.ok) throw new Error("Failed to fetch GitHub profile");
  const user = await userRes.json();

  // GitHub only includes `email` on /user if the user has made it public;
  // otherwise we fall back to their verified primary address from /user/emails.
  let email: string | null = user.email;
  let emailVerified = false;

  const emailsRes = await fetch("https://api.github.com/user/emails", { headers });
  if (emailsRes.ok) {
    const emails: { email: string; primary: boolean; verified: boolean }[] = await emailsRes.json();
    const primary = emails.find((e) => e.primary) ?? emails.find((e) => e.verified);
    if (primary) {
      email = primary.email;
      emailVerified = primary.verified;
    }
  }

  if (!email) throw new Error("GitHub account has no accessible email address");

  return {
    providerAccountId: String(user.id),
    email,
    name: user.name ?? user.login,
    emailVerified,
  };
}

export function getOAuthProvider(id: string): OAuthProviderConfig | null {
  if (id === "google") {
    return {
      id: "google",
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scope: "openid email profile",
      getProfile: getGoogleProfile,
    };
  }
  if (id === "github") {
    return {
      id: "github",
      clientId: requireEnv("GITHUB_CLIENT_ID"),
      clientSecret: requireEnv("GITHUB_CLIENT_SECRET"),
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      scope: "read:user user:email",
      getProfile: getGithubProfile,
    };
  }
  return null;
}

export function oauthRedirectUri(providerId: OAuthProviderId): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/api/auth/oauth/${providerId}/callback`;
}

export async function exchangeCodeForToken(
  provider: OAuthProviderConfig,
  code: string
): Promise<string> {
  const body = new URLSearchParams({
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    code,
    redirect_uri: oauthRedirectUri(provider.id),
    grant_type: "authorization_code",
  });

  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Token exchange failed for ${provider.id}`);
  const data = await res.json();
  if (!data.access_token) throw new Error(`No access_token in ${provider.id} token response`);
  return data.access_token as string;
}
