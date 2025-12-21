import { Router } from "express";
import { createUrl, getOriginalUrl } from "./controller";

const router = Router();

router.get("/:shortUrl", getOriginalUrl);

router.get("/testCiCD", (req, res) => {
  res.send("Hello World");
});

router.post("/create", createUrl);


export default router;
