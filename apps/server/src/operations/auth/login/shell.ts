import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import { loginCore, createLoginAdapter, type LoginPort } from "./core.js";

export function createLoginShell(
  portFactory: () => LoginPort = createLoginAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await loginCore(port, caller, req.body);
    res.status(200).json(result);
  };
}
