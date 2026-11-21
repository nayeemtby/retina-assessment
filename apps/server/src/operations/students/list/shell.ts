import type { Request, Response } from "express";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  listStudentsCore,
  createStudentListAdapter,
  type ListStudentsPort,
} from "./core.js";

export function createStudentListShell(
  portFactory: () => ListStudentsPort = createStudentListAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const port = portFactory();
    const caller = extractCaller(req);
    const result = await listStudentsCore(port, caller, req.query as any);
    res.status(200).json(result);
  };
}
