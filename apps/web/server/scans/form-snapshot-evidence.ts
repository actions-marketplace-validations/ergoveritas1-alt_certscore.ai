import { createHash } from "node:crypto";
import { collectionSurfaceInventorySchema, collectionSurfaceSnapshotSchema, type CollectionSurfaceSnapshot } from "@certscore/contracts";

/** Verify retained image bytes against the exact canonical inventory before serving. */
export function verifiedFormSnapshots(raw: { collectionSurfaceInventory?: unknown; collectionSurfaceSnapshots?: unknown[] }) {
  const inventory = collectionSurfaceInventorySchema.safeParse(raw.collectionSurfaceInventory);
  if (!inventory.success) return [];
  const inventoryHash = createHash("sha256").update(JSON.stringify(inventory.data)).digest("hex");
  return (raw.collectionSurfaceSnapshots ?? []).flatMap<{ snapshot: CollectionSurfaceSnapshot; bytes: Buffer | null }>(candidate => {
    const parsed = collectionSurfaceSnapshotSchema.safeParse(candidate);
    if (!parsed.success) return [];
    const snapshot = parsed.data;
    if (snapshot.sourceInventoryHash !== inventoryHash || snapshot.pageUrl !== inventory.data.pageUrl || !inventory.data.forms.some(form => form.formRef === snapshot.formRef)) return [];
    if (snapshot.status !== "available") return [{ snapshot, bytes: null }];
    if (!snapshot.data) return [];
    const bytes = Buffer.from(snapshot.data, "base64");
    if (bytes.length !== snapshot.sizeBytes || createHash("sha256").update(bytes).digest("hex") !== snapshot.sha256 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return [];
    return [{ snapshot, bytes }];
  });
}
