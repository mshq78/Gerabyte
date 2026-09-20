import { createApp, defaultDatabase } from '../server/app';
import { loadEnv } from '../server/config/env';

/**
 * Vercel entry. The only vendor-specific file in the backend: it exports the
 * same Express app the plain Node entry runs, so nothing about the application
 * depends on Vercel.
 *
 * Environment validation runs at module load, so a misconfigured deployment
 * fails on the first cold start rather than serving broken requests.
 */
loadEnv();

const app = createApp({ db: defaultDatabase() });

export default app;
