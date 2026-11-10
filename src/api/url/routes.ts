import { Router } from "express";
import { createUrlController, getOriginalUrlController } from "./controller";
import { UrlService } from "./service";

export function createUrlRouter(service: UrlService): Router {
  const router = Router();

  router.get("/testCiCD", (_req, res) => {
    res.send("Hello World");
  });
  router.post("/create", createUrlController(service));
  router.get("/:shortUrl", getOriginalUrlController(service));

  return router;
}
