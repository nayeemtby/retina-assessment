import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./db/connection.js";
import { createApp } from "./app.js";

async function bootstrap() {
  try {
    console.log(`[server] Initializing environment: ${env.NODE_ENV}`);
    await connectDatabase();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`[server] Server listening on http://localhost:${env.PORT}`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`[server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log("[server] Shutdown complete.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("[server] Failed to bootstrap application:", error);
    process.exit(1);
  }
}

bootstrap();
