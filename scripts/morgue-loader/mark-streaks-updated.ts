import { closePool, recordStreakDownloadDate } from "@crawl-crawler/game-data-db";

async function main(): Promise<void> {
  console.log("Recording streak download date...");
  await recordStreakDownloadDate();
  console.log("✓ Streak download date recorded");
}

main()
  .catch((error: unknown) => {
    console.error(
      "Failed to record streak download date:",
      error instanceof Error ? error.message : error
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
