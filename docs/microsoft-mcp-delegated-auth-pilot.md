# Microsoft MCP delegated sign-in pilot

Status: Azure registration, consent and exact connector callback configured;
owner approved isolated AWS pilot deployment on September 18, 2026. Runtime
implementation remains disabled by default; the approved tenant pilot is now
**deployed and enabled** on the isolated AWS MCP service. This is
not proof that Microsoft's authentication finding is resolved. The temporary
bearer-token demonstration is diagnostic only.

## Design and boundaries

`/mcp/microsoft` can optionally accept Entra v2 delegated access tokens, alongside
the existing application-only tokens. The existing tenant, audience, issuer and
Microsoft JWKS are still required. No arbitrary tenant discovery is performed.
Delegated access requires a separately registered allowed client, an exact
`scp` permission, a GUID `oid`, expiration, valid signature and time claims.
Application roles cannot substitute for delegated scope. Malformed scopes fail
closed rather than falling back to application auth.

Session identity is bound to auth mode, tenant, client and (for delegated auth)
immutable user object ID. A refreshed access token for the same identity can use
the existing session; another user or an app-only token cannot. Every request
revalidates the access token. No user email or raw object ID is logged.

Both modes retain the same four public/light tools and signed anonymous API
requester flow. Entra tokens never become CertScore workspace credentials.
Existing per-IP read protection and downstream scan quotas are unchanged; this
does **not** introduce separate paid quotas, higher limits, or private scan
access. Public report access semantics are unchanged. Signing in is not an
upgrade to a CertScore subscription.

This first pilot accepts only the configured tenant. It is **not yet a general
cross-tenant customer sign-in implementation**. Reviewer accounts must exist in
that tenant (including an explicitly provisioned guest, if approved). General
marketplace rollout requires a separate multitenant authorization design,
reviewer/customer validation and quota/cost assessment.

## Runtime configuration

Preserve all existing application-only environment values. Add only after Azure
setup and separate deployment approval:

```text
CERTSCORE_MICROSOFT_DELEGATED_ENABLED=1
CERTSCORE_MICROSOFT_DELEGATED_CLIENT_ID=<separate-client-registration-GUID>
CERTSCORE_MICROSOFT_DELEGATED_SCOPE=Mcp.Invoke
```

`Mcp.Invoke` is now exposed and admin-consented for the separate pilot client.
The configured value is the short scope name in the access token, not the full
resource URI. The flag defaults to `0`; missing configuration fails startup when
enabled. A delegated client equal to the app-only client is rejected. Keep the
resource registration separate from the delegated client registration so ID
tokens for the client cannot have the API's expected audience.

## Azure and Copilot Studio steps requiring approval

1. Confirm the pilot tenant and API resource registration. Expose delegated scope
   `Mcp.Invoke` on the existing resource, with access token version 2. Do not alter
   the existing application role or client-credentials assignment.
2. Create a **separate** connector client registration with only that delegated API
   permission. Decide user/admin consent policy explicitly. Do not grant Graph or
   directory-wide permissions for this scanner integration.
3. Configure the connector's supported OAuth authorization-code flow. Obtain the
   actual callback URL from the connector UI and register that exact URI; do not
   guess a callback or use wildcards. Store any required confidential client
   secret only in the approved connector/Key Vault configuration, never the repo,
   notes, video or email.
4. Use tenant-specific endpoints:
   - authorize: `https://login.microsoftonline.com/<tenant>/oauth2/v2.0/authorize`
   - token and refresh: `https://login.microsoftonline.com/<tenant>/oauth2/v2.0/token`
   - requested API scope: `api://<resource-audience>/Mcp.Invoke` (confirm the actual
     Application ID URI); request `offline_access` for refresh and the identity
     scopes required by the connector.
5. This pilot uses **manual OAuth configuration**. It does not implement Entra
   dynamic client registration, a CertScore token endpoint, or automatic MCP
   discovery. Do not claim those capabilities. The connector and Entra handle
   authorization codes and refresh tokens; the MCP API validates access tokens.
6. After deployment approval, enable the new settings on the canonical AWS MCP
   runtime. Do not replace the existing app-only credentials or weaken validation.

## Release evidence required before resubmitting

### September 18 deployment and initial live verification

- Source: `057d512a709488458242827c82977c2d84e96eb6`; workflow
  [35328464231](https://github.com/ergoveritas1-alt/certscore.ai/actions/runs/35328464231)
  completed successfully.
- ECS `certscore-web-mcp:141` uses that immutable image; previous revision was
  `140`. Existing one-task capacity and app-only settings were preserved.
- 45 MCP HTTP tests, two configuration-guard tests and typechecking passed.
- Copilot Studio's new OAuth connector successfully discovered all four tools
  after deployment; the earlier 401 disappeared. Its connection manager shows
  Connected. This proves discovery, not a completed scan or live refresh.
- The old temporary-token diagnostic tool was disabled in the unpublished
  validation agent so it cannot interfere with OAuth testing. It was not deleted.
- With only the OAuth tool enabled, the test chat invoked
  `certscore_get_scan_status` for the intentionally nonexistent
  `00000000-0000-4000-8000-000000000000` and returned `404/not_found`, not an
  authentication failure. Server logs also record the status-tool invocation.
  No scan was created. This validates the authenticated read error path only.
- At 09:24–09:26 UTC, the OAuth-only Copilot test exercised all four tools for
  publisher-owned `https://certscore.ai/`. Default freshness reused completed
  scan `4792e2ad-fc6f-4bb6-bf99-8b9a4ffc2822` (original completion September 17).
  Status explicitly returned `completed`; bundle retrieval succeeded and report
  evidence pagination returned 76 + 6 entries (82 total), with export complete.
  AWS MCP request logs corroborate all four tool invocations and both evidence
  page calls. No fresh scan or additional scan compute was created. Report
  coverage remains partial and GPC response indeterminate; successful retrieval
  does not establish complete observation coverage or legal compliance.
- A separate explicitly requested fresh OAuth scan (`freshness=refresh`) created
  `1205ebad-00be-421e-b7a8-d419a76bcf15`, starting at 09:27:33.922 UTC and
  completing at 09:27:54.752 UTC on September 18 (about 21 seconds). Copilot
  observed running status before terminal completion; bundle and both evidence
  pages were retrieved (75 + 17 entries, 92 total, export complete). AWS logs
  corroborate scan creation, polling, bundle and evidence-page calls. The browser
  tab crashed after the first report retrieval; a recovered test session
  successfully re-read the same scan without creating another one. Coverage
  remains partial and GPC response indeterminate. Estimated incremental compute
  for this one fresh test is below $1, disclosed before execution; no capacity
  or quota increase was made.
- Token refresh after expiry and external
  reviewer-tenant support remain separate verification requirements.

- Delete/avoid the temporary-token connection; create a new connection using
  interactive work-account sign-in without pasting an access token.
- Confirm all four tools can be listed; run one explicitly authorized test scan,
  poll status and retrieve bundle and evidence pages to completion.
- Confirm a new access token is obtained after expiry and the connection still
  works without manual token replacement. Local tests simulate fresh signed
  access tokens; they do **not** prove live connector refresh.
- Test expired tokens, wrong audience/scope/client/tenant, another user's session,
  and app/user session crossover are denied before tool work.
- Verify the existing application-only path still works. Verify neither mode
  exposes private workspace tools or forwards an Entra bearer upstream.
- Validate the actual Microsoft reviewer/customer tenant, consent experience and
  connector/package auth format with the certification team. Tenant-local success
  alone does not settle marketplace-wide availability.
- Record the real sign-in, tools and completed results. Update package auth
  configuration, reviewer notes and screenshots only after this evidence exists.
  Do not send a remediation-complete email or resubmit until authorized.

## Local validation

```sh
node --import tsx --test apps/mcp/src/env.test.ts apps/mcp/src/microsoft-entra-auth.test.ts apps/mcp/src/http-integration.test.ts
pnpm --filter @certscore/mcp-http typecheck
```

The approved deployment uses the existing isolated MCP ECS service and capacity.
Estimated incremental pilot infrastructure cost is below $1/month, disclosed to
the owner. No new resources, scan limits or customer expansion are included.
The workflow's `microsoft_delegated_pilot=enable` option validates the exact
existing tenant/resource/app-only client before adding the three pilot settings.
`preserve` is the default; `disable` provides a flag-only rollback on redeploy.
The previous task definition is retained by the workflow for automatic rollback.

## Microsoft references

- [Validate access-token claims](https://learn.microsoft.com/en-us/entra/identity-platform/claims-validation)
- [Application versus delegated permissions](https://learn.microsoft.com/en-us/troubleshoot/entra/entra-id/app-integration/application-delegated-permission-access-tokens-identity-platform)
- [Custom connector connection parameters](https://learn.microsoft.com/en-us/connectors/custom-connectors/connection-parameters)
- [Add an MCP server to an agent](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent)
