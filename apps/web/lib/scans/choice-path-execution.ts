import {
  assessChoicePathExecution,
  postAcceptReportProjectionSchema,
  postRefusalReportProjectionSchema,
  type ChoicePathExecution,
} from "@certscore/contracts";

/** Canonical operational assessment of persisted typed evidence, including v1
 * records. Never changes registration, findings, scoring, or the stored record. */
export function readChoicePathExecution(value: unknown, action: "accept" | "reject"): ChoicePathExecution | undefined {
  const parsed = action === "accept"
    ? postAcceptReportProjectionSchema.safeParse(value)
    : postRefusalReportProjectionSchema.safeParse(value);
  if (!parsed.success) return undefined;
  return parsed.data.execution ?? assessChoicePathExecution(parsed.data, action);
}
