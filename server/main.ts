import { createApp, defaultDatabase } from './app.js';
import { loadEnv } from './config/env.js';
import { logger } from './logger.js';

/**
 * Plain Node entry, for local development, Docker, or any host that is not
 * Vercel. Nothing vendor-specific lives here; api/index.ts is the only adapter.
 */
function main(): void {
  let env;
  try {
    env = loadEnv();
  } catch (error) {
    // Config failures must be loud and fatal, never a half-running server.
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const app = createApp({ db: defaultDatabase() });
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, deployEnv: env.DEPLOY_ENV }, 'api listening');
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
