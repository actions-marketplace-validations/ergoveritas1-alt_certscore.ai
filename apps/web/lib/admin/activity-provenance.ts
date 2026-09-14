/** Only the persisted ingestion projection may establish an audience. */
export function activityTrafficSql(alias: string) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(alias)) throw new Error("Invalid repository SQL alias");
  return `coalesce(${alias}.activity_traffic->>'class', 'unknown')`;
}
export function activityTrafficLabel(value: unknown) {
  return value === "external" ? "External" : value === "internal" ? "Internal / QA" : value === "automation" ? "Automation" : "Unknown audience";
}

/** Repository-owned SQL expressions only. Unknown is visible, never relabelled external. */
export function activityTrafficDefaultVisibilitySql(classExpression: string) {
  return `coalesce(${classExpression}, 'unknown') not in ('internal', 'automation')`;
}
