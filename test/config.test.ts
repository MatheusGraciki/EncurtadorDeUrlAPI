import assert from "node:assert/strict";
import test from "node:test";
import { ConfigurationError, loadConfig } from "../src/config";

test("loadConfig requires REDIS_URL", () => {
  assert.throws(() => loadConfig({}), ConfigurationError);
});

test("loadConfig validates the Redis protocol and port", () => {
  assert.throws(
    () => loadConfig({ REDIS_URL: "https://redis.example", PORT: "8080" }),
    /redis:\/\/ or rediss:\/\//,
  );
  assert.throws(
    () => loadConfig({ REDIS_URL: "redis://redis:6379", PORT: "zero" }),
    /PORT/,
  );
});

test("loadConfig uses port 8080 by default", () => {
  assert.deepEqual(loadConfig({ REDIS_URL: "redis://redis:6379" }), {
    port: 8080,
    redisUrl: "redis://redis:6379",
  });
});
