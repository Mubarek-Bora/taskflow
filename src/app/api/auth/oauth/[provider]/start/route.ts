import { NextRequest, NextResponse } from "next/server";
import { getOAuthProvider, oauthRedirectUri } from "@/lib/oauth/providers";
import { setOAuthState } from "@/lib/oauth/state";
import { logger } from "@/lib/logger";

type RouteParams = { params: Promise<{ provider: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { provider: providerId } = await params;

  let provider;
  try {
    provider = getOAuthProvider(providerId);
  } catch (err) {
    logger.error("OAuth provider misconfigured", {
      provider: providerId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.redirect(new URL("/login?error=oauth_not_configured", request.url));
  }

  if (!provider) {
    return new NextResponse("Unknown provider", { status: 404 });
  }

  const state = await setOAuthState();

  const url = new URL(provider.authorizeUrl);
  url.searchParams.set("client_id", provider.clientId);
  url.searchParams.set("redirect_uri", oauthRedirectUri(provider.id));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", provider.scope);
  url.searchParams.set("state", state);
  if (provider.id === "google") {
    url.searchParams.set("access_type", "online");
    url.searchParams.set("prompt", "select_account");
  }

  return NextResponse.redirect(url);
}
