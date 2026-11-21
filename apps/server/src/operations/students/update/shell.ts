import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  updateStudentCore,
  createStudentUpdateAdapter,
  type UpdateStudentPort,
} from "./core.js";

export function createStudentUpdateShell(
  portFactory: () => UpdateStudentPort = createStudentUpdateAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await updateStudentCore(port, caller, {
      id: req.params.id,
      data: req.body,
    });
    res.status(200).json(result);
  };
}
