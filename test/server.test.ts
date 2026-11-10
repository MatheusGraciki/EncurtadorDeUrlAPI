import assert from "node:assert/strict";
import { AddressInfo } from "node:net";
import test from "node:test";
import Redis from "ioredis";
import { startServer } from "../index";

test("checks Redis before listening and closes both server and Redis", async () => {
  const calls: string[] = [];
  const fakeRedis = {
    status: "wait",
    connect: async () => {
      calls.push("connect");
      fakeRedis.status = "ready";
    },
    ping: async () => {
      calls.push("ping");
      return "PONG";
    },
    quit: async () => {
      calls.push("quit");
      fakeRedis.status = "end";
      return "OK" as const;
    },
    disconnect: () => {
      calls.push("disconnect");
    },
    get: async () => null,
    set: async () => "OK" as const,
  };

  const running = await startServer(
    { port: 0, redisUrl: "redis://unused:6379" },
    fakeRedis as unknown as Redis,
  );
  const { port } = running.server.address() as AddressInfo;
  assert.deepEqual(calls, ["connect", "ping"]);
  assert.equal((await fetch(`http://127.0.0.1:${port}/health`)).status, 200);

  await running.shutdown("test");
  assert.equal(calls.at(-1), "quit");
  assert.equal(running.server.listening, false);
});

test("does not start listening when the initial Redis check fails", async () => {
  let disconnected = false;
  const fakeRedis = {
    status: "wait",
    connect: async () => {
      throw new Error("unavailable");
    },
    ping: async () => "PONG",
    quit: async () => "OK" as const,
    disconnect: () => {
      disconnected = true;
    },
    get: async () => null,
    set: async () => "OK" as const,
  };

  await assert.rejects(
    startServer(
      { port: 0, redisUrl: "redis://unused:6379" },
      fakeRedis as unknown as Redis,
    ),
    /unavailable/,
  );
  assert.equal(disconnected, true);
});
