import dotenv from "dotenv";
import express from "express";
import urlRoutes from "./api/url/routes";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use("/", urlRoutes);

export default app;