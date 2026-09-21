"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { buildMarketplaceScanPrompt, marketplaceScanFocus, type MarketplaceScanFocus } from "../../lib/marketplace-light";

const button = "inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-50";

export function MarketplaceCopy({ value, label = "Copy", disabled = false }: { value: string; label?: string; disabled?: boolean }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(value); setStatus("Copied. Ready to paste."); }
    catch { setStatus("Clipboard unavailable. Select and copy the text manually."); }
  }
  return <div className="flex flex-wrap items-center gap-3">
    <button type="button" disabled={disabled} onClick={copy} className={`${button} border border-sky-200 bg-white text-sky-800 hover:bg-sky-50`}>{label}</button>
    <span role="status" className="text-xs text-slate-600">{status}</span>
  </div>;
}

export function MarketplaceRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className={`${button} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>{pending ? "Checking…" : "Check activation status"}</button>;
}

export function MarketplaceClientGuide({ endpoint }: { endpoint: string }) {
  const id = useId();
  const [client, setClient] = useState("general");
  const cursor = JSON.stringify({ mcpServers: { "certscore-marketplace": { url: endpoint, headers: { Authorization: "Bearer YOUR_API_KEY" } } } }, null, 2);
  const vscode = JSON.stringify({ inputs: [{ id: "certscore-marketplace-key", type: "promptString", description: "CertScore Marketplace API key", password: true }], servers: { "certscore-marketplace": { type: "http", url: endpoint, headers: { Authorization: "Bearer ${input:certscore-marketplace-key}" } } } }, null, 2);
  return <div className="space-y-5">
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-800">Choose your setup</label>
      <select id={id} value={client} onChange={event => setClient(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 sm:w-64">
        <option value="general">Any compatible MCP client</option><option value="cursor">Cursor</option><option value="vscode">VS Code</option>
      </select>
    </div>
    {client === "general" ? <>
      <p className="text-sm leading-6 text-slate-600">In your assistant&apos;s MCP settings, add a remote server using <strong>Streamable HTTP</strong>. Your client must support a custom Authorization header or bearer-token authentication.</p>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Server URL</p>
        <code className="mb-3 block break-all text-sm text-slate-900">{endpoint}</code>
        <MarketplaceCopy value={endpoint} label="Copy server URL" />
      </div>
      <p className="text-sm leading-6 text-slate-600">If asked for a bearer token, enter your key. For a custom header, use <code className="text-slate-900">Authorization</code> with the value <code className="text-slate-900">Bearer YOUR_API_KEY</code>. Replace the placeholder with your key; keep it out of chat messages.</p>
    </> : <>
      <p className="text-sm leading-6 text-slate-600">{client === "cursor" ? <>Add this server to your personal <code>~/.cursor/mcp.json</code>. Replace <code>YOUR_API_KEY</code> with your key. Keep the file private and out of source control.</> : <>Run <strong>MCP: Open User Configuration</strong> from the Command Palette and merge this configuration. VS Code will prompt for your key in a password input.</>}</p>
      <pre tabIndex={0} aria-label={`${client === "cursor" ? "Cursor" : "VS Code"} MCP configuration`} className="max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-sky-100">{client === "cursor" ? cursor : vscode}</pre>
      <MarketplaceCopy key={client} value={client === "cursor" ? cursor : vscode} label="Copy configuration" />
      <a className="inline-block text-sm font-medium text-sky-800 underline underline-offset-4" href={client === "cursor" ? "https://cursor.com/docs/context/mcp" : "https://code.visualstudio.com/docs/agents/reference/mcp-configuration"}>Official {client === "cursor" ? "Cursor" : "VS Code"} setup reference ↗</a>
    </>}
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
      <p className="font-semibold">Check the connection before scanning</p>
      <p className="mt-1">Start or restart the server in your client&apos;s MCP settings. Check its discovered tool list for <code className="break-all">certscore_scan_site</code>, <code className="break-all">certscore_get_scan_status</code>, <code className="break-all">certscore_get_scan_bundle</code> and <code className="break-all">certscore_get_report_evidence_page</code>, then enable them.</p>
      <p className="mt-2">Tool discovery does not start a scan. An assistant&apos;s text saying it is connected is not enough to verify the connection. Once the tools appear, continue with a scan prompt.</p>
    </div>
  </div>;
}

export function MarketplaceScanPrompt() {
  const id = useId();
  const [url, setUrl] = useState("");
  const [focus, setFocus] = useState<MarketplaceScanFocus>("overview");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    try { setPrompt(buildMarketplaceScanPrompt(url, focus)); setError(""); }
    catch (cause) { setPrompt(""); setError(cause instanceof Error ? cause.message : "Check the website address."); }
  }
  return <div className="space-y-5">
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor={`${id}-url`} className="mb-2 block text-sm font-semibold text-slate-800">Which website would you like to understand?</label>
        <input id={`${id}-url`} required maxLength={2048} autoComplete="off" autoCapitalize="none" spellCheck={false} inputMode="url" type="text" placeholder="example.com" value={url} onChange={event => { setUrl(event.target.value); setPrompt(""); setError(""); }} aria-invalid={Boolean(error)} aria-describedby={`${id}-privacy${error ? ` ${id}-error` : ""}`} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
        <p id={`${id}-privacy`} className="mt-2 text-xs leading-5 text-slate-500">Public pages only. Reports are public. Do not include private links, access tokens or personal data.</p>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-800">Choose a focus</legend>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(marketplaceScanFocus).map(([value, option]) => <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${focus === value ? "border-sky-500 bg-sky-50 font-medium text-sky-900" : "border-slate-200 bg-white text-slate-600 hover:border-sky-300"}`}>
            <input type="radio" name={`${id}-focus`} value={value} checked={focus === value} onChange={() => { setFocus(value as MarketplaceScanFocus); setPrompt(""); }} className="accent-sky-700" />{option.label}
          </label>)}
        </div>
      </fieldset>
      <button className={`${button} w-full bg-sky-700 text-white hover:bg-sky-800 sm:w-auto`} type="submit">Build my scan prompt <span aria-hidden="true" className="ml-2">→</span></button>
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-red-700">{error}</p>}
    </form>
    {prompt ? <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
      <p role="status" className="font-semibold text-slate-900">Your prompt is ready</p>
      <p className="text-sm text-slate-600">Copy it into your connected assistant to start the scan.</p>
      <textarea aria-label="Your scan prompt" readOnly value={prompt} rows={7} onFocus={event => event.target.select()} className="w-full resize-y rounded-lg border border-sky-200 bg-white p-3 text-sm leading-6 text-slate-700" />
      <MarketplaceCopy key={prompt} value={prompt} label="Copy scan prompt" />
    </div> : <p className="text-sm leading-6 text-slate-500">This builds a prompt in your browser. A scan starts only when you send it to your connected assistant.</p>}
  </div>;
}
