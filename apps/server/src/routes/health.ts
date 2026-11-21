import { Router } from "express";
import { wireSuccess } from "@project/contracts";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json(
    wireSuccess({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  );
});
