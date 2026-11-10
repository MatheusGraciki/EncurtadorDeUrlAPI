import "dotenv/config";
import { Server } from "node:http";
import Redis from "ioredis";
import { createUrlService } from "./src/api/url/service";
import { createApp } from "./src/app";
import { AppConfig, loadConfig } from "./src/config";
import { closeRedis, connectRedis, getRedisClient } from "./src/redis";

export interface RunningServer {
  server: Server;
  shutdown: (signal?: string) => Promise<void>;
}

export async function startServer(
  config: AppConfig = loadConfig(),
  redisOverride?: Redis,
): Promise<RunningServer> {
  const redis = redisOverride ?? getRedisClient(config.redisUrl);
  try {
    await connectRedis(redis);
  } catch (error) {
    redis.disconnect(false);
    throw error;
  }

  const app = createApp({
    urlService: createUrlService(redis),
    isReady: async () => (await redis.ping()) === "PONG",
  });

  const server = await new Promise<Server>((resolve, reject) => {
    const instance = app.listen(config.port, "0.0.0.0", () => resolve(instance));
    instance.once("error", reject);
  });

  let shutdownPromise: Promise<void> | undefined;
  const handleSignal = (signal: string): void => {
    void shutdown(signal).catch(() => {
      console.error("Graceful shutdown failed");
      process.exitCode = 1;
    });
  };
  const handleSigterm = (): void => handleSignal("SIGTERM");
  const handleSigint = (): void => handleSignal("SIGINT");
  const shutdown = (signal = "shutdown"): Promise<void> => {
    if (shutdownPromise) {
      return shutdownPromise;
    }

    console.log(`Received ${signal}; shutting down`);
    shutdownPromise = (async () => {
      const forceCloseTimer = setTimeout(() => server.closeAllConnections(), 10_000);
      forceCloseTimer.unref();

      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      clearTimeout(forceCloseTimer);
      await closeRedis(redis);
      process.removeListener("SIGTERM", handleSigterm);
      process.removeListener("SIGINT", handleSigint);
    })();
    return shutdownPromise;
  };

  process.once("SIGTERM", handleSigterm);
  process.once("SIGINT", handleSigint);

  console.log(`Server listening on 0.0.0.0:${config.port}`);
  return { server, shutdown };
}

if (require.main === module) {
  startServer().catch(() => {
    console.error("Application failed to start");
    process.exitCode = 1;
  });
}
