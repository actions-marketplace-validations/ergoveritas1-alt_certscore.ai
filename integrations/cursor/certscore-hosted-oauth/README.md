# CertScore Hosted OAuth for Cursor

Release status: prepared locally; requires migration 0198 and the self-serve trial release before installation. Not yet published.

Use this package for workspace scan creation and history. Install only one connection to `https://mcp.certscore.ai/mcp`, named **CertScore Hosted OAuth**. If it is already configured as `certscore` or `certscore-oauth`, reuse that connection. The server cannot remove or deduplicate client-side installs.

Copy `mcp.json` into your project’s `.cursor/mcp.json` (merge with existing servers), or configure it globally in `~/.cursor/mcp.json`. Cursor Agents uses the same remote server configuration. No client secret or manually registered client is needed. Complete the human OAuth consent step. Active trial workspaces can approve scan creation within existing limits. Existing read-only connections must reauthorize; token refresh does not add scopes.

First prompt for Cursor, Claude, or ChatGPT after configuring the hosted endpoint:

> Scan https://your-site.com with CertScore. Use certscore_scan_site, poll certscore_get_scan_status only while active, then retrieve certscore_get_scan_bundle. Summarize score, coverage, finding IDs, pre-consent observations, and the report link. Do not describe an existing reused scan as a fresh scan.

For a Grok model running inside Cursor, use Cursor’s configuration. A separate Grok host must document its own OAuth configuration; there is no assumed portable AddMcpServer API.

The public client ID uses PKCE S256 and exact callbacks: `https://www.cursor.com/agents/mcp/oauth/callback` and `http://localhost:8787/callback`. This ID is not a secret or proof of client identity. Do not add arbitrary custom-scheme redirects.

Light at `/mcp/light` is a separate public scan route with bounded anonymous access and no workspace history. It can start eligible public scans; do not label it incapable of all creation. Use Hosted OAuth when workspace identity, history, or trial allowance is required.

Sources: [Cursor static OAuth configuration](https://prod.cursor.com/docs/mcp), [Cursor plugin reference](https://prod.cursor.com/docs/reference/plugins).

The Apache-2.0 license applies only to this integration package. CertScore trademarks and other repository components retain their respective terms.
