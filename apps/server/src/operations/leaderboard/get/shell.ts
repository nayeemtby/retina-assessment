import type { Request, Response } from "express";
import {
  LeaderboardParamsSchema,
  LeaderboardQuerySchema,
  wireError,
  FailureCodes,
} from "@project/contracts";
import { extractCaller } from "../../../auth/extractCaller.js";
import {
  getLeaderboardCore,
  createLeaderboardGetAdapter,
  type LeaderboardPort,
} from "./core.js";

export function createLeaderboardGetShell(
  portFactory: () => LeaderboardPort = createLeaderboardGetAdapter
) {
  return async (req: Request, res: Response): Promise<void> => {
    const parsedParams = LeaderboardParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      res.status(200).json(
        wireError({
          code: FailureCodes.VALIDATION_ERROR,
          message: "Invalid request parameters",
          details: parsedParams.error.issues,
        })
      );
      return;
    }

    const parsedQuery = LeaderboardQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res.status(200).json(
        wireError({
          code: FailureCodes.VALIDATION_ERROR,
          message: "Invalid request parameters",
          details: parsedQuery.error.issues,
        })
      );
      return;
    }

    const validParams = parsedParams.data;
    const validQuery = parsedQuery.data;

    const port = portFactory();
    const caller = extractCaller(req);
    const result = await getLeaderboardCore(port, caller, {
      examId: validParams.examId,
      query: validQuery,
    });
    res.status(200).json(result);
  };
}
