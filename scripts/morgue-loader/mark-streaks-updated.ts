import { closePool, recordStreakDownloadDate } from "@crawl-crawler/game-data-db";

async function main(): Promise<void> {
  console.log("Recording streak download date...");
  await recordStreakDownloadDate();
  console.log("✓ Streak download date recorded");

  console.log("Revalidating cache...");
  await revalidateCache();
  console.log("✓ Cache revalidated");
}

async function revalidateCache(): Promise<void> {
  const url = process.env.REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!url || !secret) {
    throw new Error("REVALIDATE_URL and REVALIDATE_SECRET must be set for cache revalidation");
  }

  const endpoint = `${url.replace(/\/$/, "")}/api/revalidate`;
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 10_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
      signal: abortController.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Cache revalidation failed (${response.status}): ${body}`);
    }
  } catch (error) {
    throw new Error(
      `Cache revalidation request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    clearTimeout(timeout);
  }
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
