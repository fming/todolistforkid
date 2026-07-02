import { Redis } from "@upstash/redis";

/**
 * Upstash Redis client, initialized from env vars.
 *
 * Required environment variables:
 *   - UPSTASH_REDIS_REST_URL
 *   - UPSTASH_REDIS_REST_TOKEN
 *
 * Both are shown in the Upstash console for your database.
 */
export const redis = Redis.fromEnv();

/**
 * Iterate over all keys matching a pattern. Uses SCAN rather than KEYS so it
 * scales when the dataset grows.
 */
export async function scanKeys(pattern: string): Promise<string[]> {
  const found: string[] = [];
  let cursor: string | number = 0;

  do {
    const [next, batch] = (await redis.scan(cursor, {
      match: pattern,
      count: 200,
    })) as [string | number, string[]];
    found.push(...batch);
    cursor = next;
  } while (cursor !== "0" && cursor !== 0);

  return found;
}
