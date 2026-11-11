import cors from "cors";
import express, { Express } from "express";
import { createUrlRouter } from "./api/url/routes";
import { createUrlService, UrlService } from "./api/url/service";

export interface AppDependencies {
  urlService?: UrlService;
  isReady?: () => Promise<boolean>;
}

export function createApp(dependencies: AppDependencies = {}): Express {
  const app = express();
  const urlService = dependencies.urlService ?? createUrlService();



const allowedOrigins = (
  process.env.CORS_ORIGINS ??
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
  }),
);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  app.get("/ready", async (_req, res) => {
    try {
      const ready = (await dependencies.isReady?.()) ?? true;
      res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not_ready" });
    } catch {
      res.status(503).json({ status: "not_ready" });
    }
  });

  app.use("/", createUrlRouter(urlService));

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}

export default createApp();
