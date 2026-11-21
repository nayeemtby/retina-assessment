import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  getStudentCore,
  createStudentGetAdapter,
  type GetStudentPort,
} from "./core.js";

export function createStudentGetShell(
  portFactory: () => GetStudentPort = createStudentGetAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await getStudentCore(port, caller, { id: req.params.id });
    res.status(200).json(result);
  };
}
