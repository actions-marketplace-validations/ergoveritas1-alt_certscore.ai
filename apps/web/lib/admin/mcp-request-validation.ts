/** Browser-safe canonical request-validation registry, shared by discovery and outcomes. */
export const MCP_REQUEST_VALIDATION_LABELS: Record<string, string> = {
  invalid_url: "Invalid target URL",
  invalid_scan_id: "Invalid scan ID",
  invalid_arguments: "Invalid arguments",
  unknown_tool: "Unknown tool",
};

export const MCP_REQUEST_VALIDATION_CODES = Object.keys(MCP_REQUEST_VALIDATION_LABELS);
