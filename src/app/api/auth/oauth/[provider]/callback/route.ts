import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueSession } from "@/lib/auth";
import { getOAuthProvider, exchangeCodeForToken } from "@/lib/oauth/providers";
import { verifyAndClearOAuthState } from "@/lib/oauth/state";
import { logger } from "@/lib/logger";

type RouteParams = { params: Promise<{ provider: string }> };

function failureRedirect(request: NextRequest, reason: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { provider: providerId } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const providerError = searchParams.get("error");

  if (providerError) {
    return failureRedirect(request, "oauth_denied");
  }

  let provider;
  try {
    provider = getOAuthProvider(providerId);
  } catch (err) {
    logger.error("OAuth provider misconfigured", {
      provider: providerId,
      error: err instanceof Error ? err.message : String(err),
    });
    return failureRedirect(request, "oauth_not_configured");
  }

  if (!provider) {
    return new NextResponse("Unknown provider", { status: 404 });
  }

  const stateValid = await verifyAndClearOAuthState(state);
  if (!stateValid || !code) {
    return failureRedirect(request, "oauth_failed");
  }

  try {
    const accessToken = await exchangeCodeForToken(provider, code);
    const profile = await provider.getProfile(accessToken);

    const existingAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: provider.id,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    });

    let user = existingAccount?.user ?? null;

    if (user?.deletedAt) {
      return failureRedirect(request, "oauth_failed");
    }

    if (!user) {
      const existingUser = await prisma.user.findFirst({
        where: { email: profile.email, deletedAt: null },
      });

      if (existingUser) {
        // Only auto-link to an existing account if the provider confirms the
        // email is verified -- otherwise an attacker could take over any
        // account by registering an OAuth identity with someone else's
        // (unverified) email address.
        if (!profile.emailVerified) {
          return failureRedirect(request, "oauth_email_unverified");
        }
        user = existingUser;
      } else {
        user = await prisma.user.create({
          data: { email: profile.email, name: profile.name, passwordHash: null },
        });
      }

      await prisma.oAuthAccount.create({
        data: {
          provider: provider.id,
          providerAccountId: profile.providerAccountId,
          userId: user.id,
        },
      });
    }

    await issueSession(user);

    logger.info("OAuth sign-in", { provider: provider.id, userId: user.id });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    logger.error("OAuth callback failed", {
      provider: providerId,
      error: err instanceof Error ? err.message : String(err),
    });
    return failureRedirect(request, "oauth_failed");
  }
}
