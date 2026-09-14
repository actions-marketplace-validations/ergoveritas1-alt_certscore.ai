/** Safety ceilings, not preview lengths. Keep the database migration in sync. */
export const MCP_INPUT_RETENTION = {
  version: 2,
  textCharacters: 8_192,
  inputBytes: 12_288,
  requestDetailsBytes: 16_384,
  fields: 128,
  depth: 8,
} as const;
