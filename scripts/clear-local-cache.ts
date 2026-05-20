import { rm } from "node:fs/promises";
import { join } from "node:path";

const CACHE_DIRS = [
  "apps/web/.next/dev/cache/fetch-cache",
  "apps/web/.next/cache/fetch-cache",
];

async function main(): Promise<void> {
  for (const dir of CACHE_DIRS) {
    await rm(join(process.cwd(), dir), { recursive: true, force: true });
    console.log(`✓ Removed ${dir}`);
  }

  console.log("");
  console.log("⚠ Restart your dev server to flush the in-memory cache.");
  console.log("  Next.js keeps unstable_cache entries in process memory; deleting");
  console.log("  the disk cache alone won't evict them. Kill `pnpm dev` and start it again.");
}

main().catch((error: unknown) => {
  console.error(
    "Failed to clear local cache:",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
});
