import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@website-signal-risk-scanner/ui";
import { CERTSCORE_OAUTH_CREATE_SCOPE, oauthScopeString } from "@certscore/mcp-auth";
import { getCurrentUser } from "../../../server/auth";
import { bootstrapAppUserSession } from "../../../server/bootstrap-user";
import { OAUTH_SCAN_CREATE_DAILY_LIMIT, OAUTH_SCAN_CREATE_HOURLY_LIMIT } from "../../../server/integrations/api-keys";
import {
  createAuthorizationCode,
  hasReusableMcpOAuthConsent,
  getMcpOAuthClient,
  getMcpOAuthWorkspaceActivity,
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
  // A changed client/workspace/scope set must go through the visible consent form.
  // Hosts can explicitly ask to show consent again using prompt=consent.
  if (!first(params.prompt)?.split(/\s+/).includes("consent") && await hasReusableMcpOAuthConsent({
    clientId, organizationId: organization.id, ownerUserId: user.id,
    scopes: scopeResolution.approvedScopes
  })) {
    const code = await createAuthorizationCode({
      clientId, organizationId: organization.id, ownerUserId: user.id,
      redirectUri, codeChallenge, scopes: scopeResolution.approvedScopes
    });
    const target = new URL(redirectUri);
    target.searchParams.set("code", code);
    target.searchParams.set("scope", requestedScope);
    if (state) target.searchParams.set("state", state);
    redirect(target.toString());
  }
  const canCreateScans = scopeResolution.approvedScopes.includes(CERTSCORE_OAUTH_CREATE_SCOPE);
  const workspaceActivity = canCreateScans ? null : await getMcpOAuthWorkspaceActivity(organization.id);
  const hasWorkspaceScans = Boolean(workspaceActivity && (workspaceActivity.scanCount > 0 || workspaceActivity.domainCount > 0));

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="px-6 py-5"><Link href="/" className="font-semibold text-slate-900">CertScore.ai</Link></header>
      <section className="mx-auto max-w-xl px-6 py-20">
        <Card className="border-slate-200 bg-white shadow-none">
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">CertScore.ai MCP</p>
            <CardTitle>Connect {client.clientName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm leading-7 text-slate-600">
              Connect {client.clientName} to your CertScore workspace to {canCreateScans ? "start website scans and read reports and scan history" : "read existing reports and scan history"}.
            </p>
            {!canCreateScans ? (
              <div className={`rounded border p-4 text-sm leading-6 ${hasWorkspaceScans ? "border-sky-200 bg-sky-50 text-sky-900" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
                <p className="font-semibold">This connection is read-only.</p>
                <p className="mt-1">Scan creation requires active workspace access. Check your workspace status before reconnecting; reconnecting alone will not activate an inactive workspace.</p>
                <p className="mt-1">
                  {hasWorkspaceScans
                    ? `${client.clientName} can review existing CertScore scans, but it cannot start a new scan.`
                    : `Your CertScore workspace has no scans yet. ${client.clientName} cannot create the first scan with the requested access.`}
                </p>
                {!hasWorkspaceScans ? (
                  <p className="mt-2">
                    After connecting, open {" "}
                    <Link className="font-semibold underline decoration-amber-400 underline-offset-4" href="/app#scan-a-site" target="_blank">
                      CertScore Scan a site
                    </Link>{" "}
                    to add a website and run the first scan.
                  </p>
                ) : null}
              </div>
            ) : null}
            {canCreateScans ? (
              <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                <p className="font-semibold">Ready to scan. No staff approval needed.</p>
                <p className="mt-1">Connect once. Your agent can reconnect automatically while this access remains valid. New permissions require your consent.</p>
                <p className="mt-1">
                  Create up to {OAUTH_SCAN_CREATE_HOURLY_LIMIT} new scans per hour and{" "}
                  {OAUTH_SCAN_CREATE_DAILY_LIMIT} per day for this workspace. Eligible recent-result reuse does not consume the allowance.
                </p>
                <p className="mt-3 font-semibold">Once connected, ask your agent:</p>
                <code className="mt-1 block rounded border border-emerald-200 bg-white px-3 py-2 text-xs text-emerald-950">
                  Scan https://your-site.com with CertScore and summarize the findings.
                </code>
              </div>
            ) : null}
            <form action="/api/v2/oauth/authorize" className="flex gap-3" method="post">
              <input name="client_id" type="hidden" value={clientId} />
              <input name="redirect_uri" type="hidden" value={redirectUri} />
              <input name="scope" type="hidden" value={requestedScope} />
              <input name="state" type="hidden" value={state} />
              <input name="code_challenge" type="hidden" value={codeChallenge} />
              <input name="code_challenge_method" type="hidden" value="S256" />
              <input name="organization_id" type="hidden" value={organization.id} />
              <input name="owner_user_id" type="hidden" value={user.id} />
              <button className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white" name="decision" type="submit" value="approve">
                Connect
              </button>
              <button className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" name="decision" type="submit" value="deny">
                Cancel
              </button>
            </form>
            <details className="rounded border border-slate-200 p-3 text-sm text-slate-600">
              <summary className="cursor-pointer font-semibold">Connection details</summary>
              <p className="mt-3">Requested scopes</p>
              <p className="mt-1 break-words font-mono text-xs">{rawRequestedScopes.join(" ") || "Client defaults"}</p>
              <p className="mt-3">Scopes granted when you connect</p>
              <p className="mt-1 break-words font-mono text-xs">{requestedScope}</p>
              <p className="mt-3">The client name is supplied by the app. Connecting lets it use these permissions on your behalf within your workspace’s usage limits.</p>
              <p className="mt-3">CertScore provides automated public-web observations, not legal advice or compliance certification.</p>
            </details>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
