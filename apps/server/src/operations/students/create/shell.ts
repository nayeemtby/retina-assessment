import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  createStudentCore,
  createStudentCreateAdapter,
  type CreateStudentPort,
} from "./core.js";

export function createStudentCreateShell(
  portFactory: () => CreateStudentPort = createStudentCreateAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await createStudentCore(port, caller, req.body);
    res.status(200).json(result);
  };
}
