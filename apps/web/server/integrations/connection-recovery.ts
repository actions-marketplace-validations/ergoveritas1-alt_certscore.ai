export function connectionRecovery(active: boolean, createScope: boolean, quotaAllowed: boolean | null) {
  return {
    canRequestScanNow: active && createScope && quotaAllowed === true,
    nextAction: !active ? "Sign in to CertScore and check your workspace membership and status."
      : !createScope ? "Reconnect the existing Hosted OAuth connector with scan:read scan:create mcp; approve the new permissions once."
      : quotaAllowed === null ? "Quota could not be checked. Retry diagnostics; do not assume capacity is available."
      : !quotaAllowed ? "Wait for retryAfterSeconds, or read an eligible existing domain scan. Reconnecting does not reset workspace quota."
      : "Call certscore_scan_site when the user requests a scan; no staff approval is required."
  };
}
