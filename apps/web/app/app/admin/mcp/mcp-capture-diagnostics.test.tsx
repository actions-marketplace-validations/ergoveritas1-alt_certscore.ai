import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {McpCaptureDiagnostics} from "./mcp-capture-diagnostics";

test("capture diagnostics distinguish invocation, ingestion and client receipt", () => {
  const html=renderToStaticMarkup(<McpCaptureDiagnostics/>);
  assert.match(html,/mcp_http.auth_failed/);
  assert.match(html,/mcp.telemetry_write_failed/);
  assert.match(html,/accepted = 0/);
  assert.match(html,/No log query runs automatically/);
  assert.match(html,/not client receipt/);
  assert.match(html,/do not inherit this table/);
});
