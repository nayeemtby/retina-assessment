import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  createResultCore,
  createResultCreateAdapter,
  type CreateResultPort,
} from "./core.js";

export function createResultCreateShell(
  portFactory: () => CreateResultPort = createResultCreateAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await createResultCore(port, caller, req.body);
    res.status(200).json(result);
  };
}
