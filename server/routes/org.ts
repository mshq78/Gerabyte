import { Router } from 'express';
import { z } from 'zod';
import { PAGE_SIZE, type Paginated } from '../../shared/schemas/common.js';
import { peopleQuerySchema, type OrgPersonDto } from '../../shared/schemas/org.js';
import { env } from '../config/env.js';
import { notFound, unauthenticated } from '../http/errors.js';
import { requireAuth, requirePermission, requireScope } from '../http/middleware/auth.js';
import { parseQuery } from '../http/validate.js';
import { toOrgNodeDto, toOrgPersonDto, toOrgPersonSummaryDto } from '../dto/org.js';
import * as orgRepo from '../repositories/org.js';
import * as audit from '../services/audit.js';
import { hashIp } from '../util/crypto.js';

/**
 * The first scoped resource, end to end. Every handler:
 *   1. requires a session,
 *   2. checks a central policy action,
 *   3. resolves a Scope and passes it into the repository,
 *   4. returns whitelisted DTOs with masked phones.
 *
 * TODO(server): this is the pattern every later org resource must follow.
 */
export function orgRouter(): Router {
  const router = Router();
  router.use(requireAuth());

  /** GET /api/org/tree — the subtree the caller may see, and nothing above it. */
  router.get('/tree', requirePermission('org.tree.read'), requireScope(), async (req, res, next) => {
    try {
      const scope = req.scope;
      if (!scope) throw unauthenticated();
      const nodes = await orgRepo.listNodes(req.db, scope);
      res.json({ rootId: scope.rootNodeId, items: nodes.map(toOrgNodeDto) });
    } catch (error) {
      next(error);
    }
  });

  /** GET /api/org/people — search, filter, sort, 25 per page, inside the scope. */
  router.get(
    '/people',
    requirePermission('org.people.read'),
    requireScope(),
    async (req, res, next) => {
      try {
        const scope = req.scope;
        if (!scope) throw unauthenticated();
        const query = parseQuery(peopleQuerySchema, req);
        const { items, total } = await orgRepo.listPeople(req.db, scope, query);

        const body: Paginated<OrgPersonDto> = {
          items: items.map(toOrgPersonDto),
          page: query.page,
          pageSize: PAGE_SIZE,
          total,
          totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        };
        res.json(body);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/org/people/:id/summary — one person's report.
   * Opening an individual's report is audited every time.
   */
  router.get(
    '/people/:id/summary',
    requirePermission('org.person.read'),
    requireScope(),
    async (req, res, next) => {
      try {
        const auth = req.auth;
        const scope = req.scope;
        if (!auth || !scope) throw unauthenticated();

        const id = z.uuid().parse(req.params.id);
        const person = await orgRepo.findPersonInScope(req.db, scope, id);
        // Out of scope reads as "not found": a 403 would confirm it exists.
        if (!person) throw notFound();

        const nodePath = await orgRepo.namesForPath(req.db, scope, person.nodePath);

        await audit.record(req.db, {
          action: 'org.person.viewed',
          actorUserId: auth.principal.userId,
          targetType: 'membership',
          targetId: person.id,
          orgId: scope.orgId,
          ipHash: hashIp(env().IP_HASH_SECRET, req.ip),
          requestId: req.requestId,
        });

        res.json(toOrgPersonSummaryDto(person, nodePath));
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
