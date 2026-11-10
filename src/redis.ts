import Redis from "ioredis";

let client: Redis | undefined;

export interface RedisLifecycle {
  status: string;
  connect(): Promise<void>;
  ping(): Promise<string>;
  quit(): Promise<"OK">;
  disconnect(reconnect?: boolean): void;
}

export function getRedisClient(redisUrl?: string): Redis {
  if (client) {
    return client;
  }

  if (!redisUrl) {
    throw new Error("Redis client has not been configured");
  }

  client = new Redis(redisUrl, {
    lazyConnect: true,
    enableReadyCheck: true,
    maxRetriesPerRequest: 2,
    retryStrategy(attempt) {
      return Math.min(attempt * 200, 2_000);
    },
  });

  client.on("error", () => {
    console.error("Redis connection error");
  });
  client.on("reconnecting", (delay: number) => {
    console.warn(`Redis reconnecting in ${delay}ms`);
  });

  return client;
}

export async function connectRedis(redis: RedisLifecycle): Promise<void> {
  if (redis.status === "wait") {
    await redis.connect();
  }
  await redis.ping();
}

export async function closeRedis(redis: RedisLifecycle): Promise<void> {
  if (redis.status === "end") {
    return;
  }

  try {
    await redis.quit();
  } catch {
    redis.disconnect(false);
  }
}
