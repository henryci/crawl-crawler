import { closePool, recordStreakDownloadDate } from "@crawl-crawler/game-data-db";

interface RevalidateResponseBody {
  revalidated?: boolean;
  tag?: string;
  instance?: string;
  error?: string;
}

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
    const bodyText = await response.text();
    let body: RevalidateResponseBody = {};
    if (bodyText.trim()) {
      try {
        body = JSON.parse(bodyText) as RevalidateResponseBody;
      } catch {
        // Keep raw body text in error paths below; some gateways may return HTML/plain text.
      }
    }

    if (!response.ok) {
      throw new Error(`Cache revalidation failed (${response.status}): ${bodyText}`);
    }

    const instance = body.instance ?? response.headers.get("x-crawl-instance");
    const appOrigin = response.headers.get("x-do-app-origin");
    const cfRay = response.headers.get("cf-ray");
    const server = response.headers.get("server");

    if (instance) {
      console.log(`  Revalidated on instance: ${instance}`);
    } else {
      console.log("  Revalidated instance: unknown (instance header/body not present)");
    }

    if (appOrigin) console.log(`  x-do-app-origin: ${appOrigin}`);
    if (cfRay) console.log(`  cf-ray: ${cfRay}`);
    if (server) console.log(`  edge server: ${server}`);
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
