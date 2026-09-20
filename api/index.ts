import { createApp, defaultDatabase } from '../server/app';
import { loadEnv } from '../server/config/env';

/**
 * Vercel entry. The only vendor-specific file in the backend: it exports the
 * same Express app the plain Node entry runs, so nothing about the application
 * depends on Vercel.
 */

/**
 * Preview deployments get a fresh URL per branch, so APP_ORIGIN cannot be a
 * fixed project-wide value for them. Vercel hands us the branch URL, which is
 * the one a pull request links to and the one a reviewer actually opens, so we
 * adopt it as this deployment's origin.
 *
 * Only for previews, and only when nothing else set APP_ORIGIN: staging and
 * production always carry an explicit value, and an unset origin there must
 * still fail validation rather than be guessed from a request.
 */
function adoptPreviewOrigin(): void {
  if (process.env.VERCEL_ENV !== 'preview') return;
  if (process.env.APP_ORIGIN) return;
  const host = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;
  if (host) process.env.APP_ORIGIN = `https://${host}`;
}

adoptPreviewOrigin();

// Environment validation runs at module load, so a misconfigured deployment
// fails on the first cold start rather than serving broken requests.
loadEnv();

const app = createApp({ db: defaultDatabase() });

export default app;
