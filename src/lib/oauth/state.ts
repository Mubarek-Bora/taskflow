import { randomBytes } from "crypto";
import { cookies } from "next/headers";

const STATE_COOKIE = "taskflow_oauth_state";
const STATE_TTL_SECONDS = 5 * 60;

export async function setOAuthState(): Promise<string> {
  const state = randomBytes(24).toString("base64url");
  const store = await cookies();

  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Must be "lax", not "strict": this cookie has to survive the top-level
    // redirect back from the provider's domain (accounts.google.com / github.com)
    // to our /callback route, which is a cross-site navigation.
    sameSite: "lax",
    path: "/api/auth/oauth",
    maxAge: STATE_TTL_SECONDS,
  });

  return state;
}

export async function verifyAndClearOAuthState(receivedState: string | null): Promise<boolean> {
  const store = await cookies();
  const expected = store.get(STATE_COOKIE)?.value;

  store.set(STATE_COOKIE, "", { path: "/api/auth/oauth", maxAge: 0 });

  return !!expected && !!receivedState && expected === receivedState;
}
