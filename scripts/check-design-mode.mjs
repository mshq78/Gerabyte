/**
 * Build-time guard: design mode must never be built for a deployment.
 *
 * `VITE_DESIGN_MODE=1` replaces the API with an in-memory fake. Built with
 * that flag and deployed, the app would look completely normal and be
 * entirely fictional — signing anyone in, showing invented colleagues, and
 * never touching the server. That is a worse failure than a crash, because
 * nothing about it looks wrong.
 *
 * So the combination is refused at build time, before the bundle exists.
 */
const designMode = process.env.VITE_DESIGN_MODE === '1';
const deployEnv = process.env.DEPLOY_ENV ?? 'local';

if (designMode && (deployEnv === 'staging' || deployEnv === 'production')) {
  console.error(
    `check-design-mode: refusing to build with VITE_DESIGN_MODE=1 and DEPLOY_ENV=${deployEnv}.\n` +
      '       Design mode replaces the API with an in-memory fake. A deployment\n' +
      '       built this way would sign anyone in and show invented data, and\n' +
      '       would look entirely normal doing it.\n' +
      '       Use `npm run design:export` to hand the UI to a design tool instead.'
  );
  process.exit(1);
}

if (designMode) {
  console.log(
    'check-design-mode: building WITH design mode — the API is an in-memory fake.\n' +
      '                   This build is for design work only. Do not deploy it.'
  );
}
