import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { wireError, FailureCodes } from "@project/contracts";

export interface RequestValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(schemas: RequestValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        const parsedParams = await schemas.params.parseAsync(req.params);
        req.params = parsedParams as Record<string, string>;
      }

      if (schemas.query) {
        const parsedQuery = await schemas.query.parseAsync(req.query);
        req.query = parsedQuery as Request["query"];
      }

      if (schemas.body) {
        const parsedBody = await schemas.body.parseAsync(req.body);
        req.body = parsedBody;
      }

      next();
    } catch (error: any) {
      if (error && error.issues) {
        res.status(200).json(
          wireError({
            code: FailureCodes.VALIDATION_ERROR,
            message: "Validation failed",
            details: error.issues,
          })
        );
        return;
      }

      res.status(200).json(
        wireError({
          code: FailureCodes.BAD_REQUEST,
          message: error?.message || "Invalid request payload",
        })
      );
    }
  };
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return validateRequest({ body: schema });
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return validateRequest({ query: schema });
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return validateRequest({ params: schema });
}
