import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  deleteStudentCore,
  createStudentDeleteAdapter,
  type DeleteStudentPort,
} from "./core.js";

export function createStudentDeleteShell(
  portFactory: () => DeleteStudentPort = createStudentDeleteAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await deleteStudentCore(port, caller, { id: req.params.id });
    res.status(200).json(result);
  };
}
