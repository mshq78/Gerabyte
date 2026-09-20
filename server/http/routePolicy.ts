import type { Express, RequestHandler, Router } from 'express';
import type { Permission } from '../../shared/permissions.js';

/**
 * Deny by default, enforced by a test rather than by discipline.
 *
 * Every route declares who may call it by carrying one tagged handler. A route
 * added without one is not "open" — it fails `routePolicy.test.ts`, so the
 * question "who is allowed to call this?" has to be answered before the
 * endpoint can be merged.
 */
export const ROUTE_POLICY = Symbol.for('gerabyte.routePolicy');

export type RoutePolicy =
  | { kind: 'public'; reason: string }
  | { kind: 'authenticated' }
  | { kind: 'permission'; permission: Permission };

type TaggedHandler = RequestHandler & { [ROUTE_POLICY]?: RoutePolicy };

/** Attach a policy declaration to a middleware that already enforces it. */
export function tagPolicy(handler: RequestHandler, policy: RoutePolicy): RequestHandler {
  (handler as TaggedHandler)[ROUTE_POLICY] = policy;
  return handler;
}

/**
 * Declare a route deliberately reachable without a session, and say why.
 * It enforces nothing — being public is the absence of a check — so the
 * reason string is the whole point: it is the record of the decision.
 */
export function publicRoute(reason: string): RequestHandler {
  return tagPolicy((_req, _res, next) => next(), { kind: 'public', reason });
}

interface Mount {
  prefix: string;
  router: Router;
}

const MOUNTS_KEY = 'gerabyte:mounts';

/**
 * Mount a router and remember where, so the policy test can walk the real
 * routing table instead of a hand-maintained list that could drift from it.
 */
export function mountRouter(app: Express, prefix: string, router: Router): void {
  const mounts = (app.get(MOUNTS_KEY) as Mount[] | undefined) ?? [];
  mounts.push({ prefix, router });
  app.set(MOUNTS_KEY, mounts);
  app.use(prefix, router);
}

export interface RegisteredRoute {
  method: string;
  path: string;
  policy: RoutePolicy | null;
}

function joinPath(prefix: string, path: string): string {
  if (path === '/') return prefix;
  return `${prefix}${path}`;
}

/** Every route the app actually serves, with the policy it declared. */
export function collectRoutes(app: Express): RegisteredRoute[] {
  const mounts = (app.get(MOUNTS_KEY) as Mount[] | undefined) ?? [];
  const routes: RegisteredRoute[] = [];

  for (const { prefix, router } of mounts) {
    // Router-level middleware applies to every route in that router, so a
    // policy declared there counts for all of them.
    const routerWide: RoutePolicy[] = [];
    const stack = (router as unknown as { stack: RouterLayer[] }).stack ?? [];

    for (const layer of stack) {
      if (!layer.route) {
        const policy = (layer.handle as TaggedHandler | undefined)?.[ROUTE_POLICY];
        if (policy) routerWide.push(policy);
      }
    }

    for (const layer of stack) {
      const route = layer.route;
      if (!route) continue;

      const declared = route.stack
        .map((s) => (s.handle as TaggedHandler)[ROUTE_POLICY])
        .filter((p): p is RoutePolicy => Boolean(p));

      // The most specific declaration wins: a permission on the route beats
      // an `authenticated` applied to the whole router.
      const all = [...declared, ...routerWide];
      const policy = all.find((p) => p.kind === 'permission') ?? all[0] ?? null;

      for (const method of Object.keys(route.methods)) {
        if (method === '_all') continue;
        routes.push({ method: method.toUpperCase(), path: joinPath(prefix, route.path), policy });
      }
    }
  }

  return routes;
}

interface RouterLayer {
  handle?: unknown;
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: { handle: unknown }[];
  };
}
