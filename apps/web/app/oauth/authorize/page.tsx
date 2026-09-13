import { recordMcpOAuthAuthorization } from "../../../server/oauth/mcp-oauth-authorization-event";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@website-signal-risk-scanner/ui";
import { oauthScopeString } from "@certscore/mcp-auth";
import { getCurrentUser } from "../../../server/auth";
import { bootstrapAppUserSession } from "../../../server/bootstrap-user";
import {
  createAuthorizationCode,
  getMcpOAuthClient,
  redirectUriAllowed,
  resolveMcpOAuthRequestedScopes
} from "../../../server/oauth/mcp-oauth";

export const dynamic = "force-dynamic";

type AuthorizePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function currentAuthorizePath(params: Record<string, string | string[] | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const item = first(value);
    if (item) {
      search.set(key, item);
    }
  }
  return `/oauth/authorize?${search.toString()}`;
}

function invalidRequest(message: string) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="px-6 py-5"><Link href="/" className="font-semibold text-slate-900">CertScore.ai</Link></header>
      <section className="mx-auto max-w-xl px-6 py-20">
        <Card className="border-slate-200 bg-white shadow-none">
          <CardHeader>
            <CardTitle>OAuth request unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-slate-600">{message}</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default async function AuthorizePage({ searchParams }: AuthorizePageProps) {
  const params = (await searchParams) ?? {};
  const responseType = first(params.response_type);
  const clientId = first(params.client_id);
  const redirectUri = first(params.redirect_uri);
  const codeChallenge = first(params.code_challenge);
  const codeChallengeMethod = first(params.code_challenge_method);
  const state = first(params.state) ?? "";
  const rawRequestedScopes = first(params.scope)?.split(/\s+/).filter(Boolean) ?? [];

  if (
    responseType !== "code" ||
    !clientId ||
    clientId.length > 256 ||
    !redirectUri ||
    redirectUri.length > 2_048 ||
    !codeChallenge ||
    !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge) ||
    codeChallengeMethod !== "S256"
  ) {
    return invalidRequest("This OAuth request is missing a valid client, redirect URI, or PKCE S256 challenge.");
  }
  const client = await getMcpOAuthClient(clientId);
  if (!client || !redirectUriAllowed(client, redirectUri)) {
    return invalidRequest("This OAuth client is not registered for the requested redirect URI.");
  }
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    redirect(`/login?next=${encodeURIComponent(currentAuthorizePath(params))}`);
  }
  const { organization, user } = await bootstrapAppUserSession(sessionUser);
  const scopeResolution = await resolveMcpOAuthRequestedScopes({
    client,
    requestedScopes: rawRequestedScopes,
    context: {
      clientId,
      organizationId: organization.id,
      ownerUserId: user.id
    }
  });
  if (scopeResolution.invalidScopes.length > 0) {
    return invalidRequest(
      `This OAuth client requested unsupported scopes: ${scopeResolution.invalidScopes.join(" ")}.`
    );
  }
  if (scopeResolution.deniedScopes.length > 0) {
    return invalidRequest(
      `This OAuth client requested scopes that are not available for this account: ${oauthScopeString(scopeResolution.deniedScopes)}.`
    );
  }
  const requestedScope = oauthScopeString(scopeResolution.approvedScopes);
  // Owner-approved self-serve policy: successful sign-in is sufficient to connect.
  // Client registration, exact redirect, PKCE, membership and scope checks above
  // still apply, including on first connection and prompt=consent requests.
  const code = await createAuthorizationCode({
    clientId, organizationId: organization.id, ownerUserId: user.id,
    redirectUri, codeChallenge, scopes: scopeResolution.approvedScopes
  });
  await recordMcpOAuthAuthorization({ client, sessionUser, organization, user });
  const target = new URL(redirectUri);
  target.searchParams.set("code", code);
  target.searchParams.set("scope", requestedScope);
  if (state) target.searchParams.set("state", state);
  redirect(target.toString());
}
