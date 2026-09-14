/** Only the persisted ingestion projection may establish an audience. */
export function activityTrafficSql(alias: string) {
  if (!/^[a-z_]+$/i.test(alias)) throw new Error("Invalid repository SQL alias");
  return `coalesce(${alias}.activity_traffic->>'class', 'unknown')`;
}
export function activityTrafficLabel(value: unknown) {
  return value === "external" ? "External" : value === "internal" ? "Internal / QA" : value === "automation" ? "Automation" : "Unknown audience";
}
