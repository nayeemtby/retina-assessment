import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017/assessment_db"),
  JWT_SECRET: z.string().min(16).default("assessment_jwt_super_secret_key_minimum_32_chars"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.format());
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
export type EnvConfig = typeof env;
