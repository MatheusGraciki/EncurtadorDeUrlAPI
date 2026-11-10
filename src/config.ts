export interface AppConfig {
  port: number;
  redisUrl: string;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const redisUrl = env.REDIS_URL?.trim();
  if (!redisUrl) {
    throw new ConfigurationError("REDIS_URL is required");
  }

  let parsedRedisUrl: URL;
  try {
    parsedRedisUrl = new URL(redisUrl);
  } catch {
    throw new ConfigurationError("REDIS_URL must be a valid URL");
  }

  if (!["redis:", "rediss:"].includes(parsedRedisUrl.protocol)) {
    throw new ConfigurationError("REDIS_URL must use redis:// or rediss://");
  }

  const rawPort = env.PORT?.trim() || "8080";
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new ConfigurationError("PORT must be an integer between 1 and 65535");
  }

  return { port, redisUrl };
}
