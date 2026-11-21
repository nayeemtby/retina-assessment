import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import { meCore, createMeAdapter, type MePort } from "./core.js";

export function createMeShell(
  portFactory: () => MePort = createMeAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await meCore(port, caller);
    res.status(200).json(result);
  };
}
