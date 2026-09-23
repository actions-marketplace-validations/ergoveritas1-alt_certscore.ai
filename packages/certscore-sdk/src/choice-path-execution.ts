import type { ChoicePathExecution } from "./types.js";

/** Count both completed path outcomes. Missing legacy execution is not a failure
 * classification; callers should retain a separate unavailable denominator. */
export function isSuccessfulChoicePath(execution: ChoicePathExecution | null | undefined): boolean {
  return execution?.status === "succeeded" || execution?.status === "succeeded_with_confirmation";
}
