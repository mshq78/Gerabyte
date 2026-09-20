import { PAGE_SIZE, type Paginated } from '../../shared/schemas/common';
import { OTP_LENGTH } from '../../shared/schemas/auth';
import type { MeDto, SessionDto } from '../../shared/schemas/me';
import { SCOPE_NOTE, type OrgPersonDto, type OrgPersonSummaryDto } from '../../shared/schemas/org';
import {
  DEFAULT_PERSONA,
  DESIGN_NODES,
  DESIGN_PEOPLE,
  personaById,
  visibleNodeIds,
  type DesignPersonaId,
} from './personas';

/**
 * The marker `scripts/check-dist.mjs` refuses to find in a production bundle.
 *
 * Design mode exists so the UI can be redesigned in Google AI Studio against a
 * frontend-only copy of the app, with no backend and no secrets. None of it
 * may ever reach a real deployment, and this string is how the build proves
 * that rather than asserting it.
 */
export const DESIGN_MODE_MARKER = '__GB_DESIGN_MODE__';

const PERSONA_STORAGE_KEY = 'gerabyte:design_persona';

let currentPersona: DesignPersonaId = readStoredPersona();

function readStoredPersona(): DesignPersonaId {
  try {
    const stored = localStorage.getItem(PERSONA_STORAGE_KEY);
    return stored ? (personaById(stored).id as DesignPersonaId) : DEFAULT_PERSONA;
  } catch {
    return DEFAULT_PERSONA;
  }
}

export function getPersona(): DesignPersonaId {
  return currentPersona;
}

export function setPersona(id: DesignPersonaId): void {
  currentPersona = id;
  try {
    localStorage.setItem(PERSONA_STORAGE_KEY, id);
  } catch {
    // A designer with site data blocked still gets the switch, just not the
    // memory of it.
  }
}

let signedIn = true;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function error(status: number, code: string): Response {
  return json({ error: { code, message: code, requestId: DESIGN_MODE_MARKER } }, status);
}

function me(): MeDto {
  return personaById(currentPersona).me;
}

function peopleInScope(): OrgPersonDto[] {
  const allowed = new Set(visibleNodeIds(personaById(currentPersona)));
  return DESIGN_PEOPLE.filter((person) => allowed.has(person.nodeId));
}

function summaryFor(id: string): OrgPersonSummaryDto | null {
  const person = peopleInScope().find((p) => p.id === id);
  if (!person) return null;
  const path: string[] = [];
  let node = DESIGN_NODES.find((n) => n.id === person.nodeId) ?? null;
  while (node) {
    path.unshift(node.name);
    const parentId: string | null = node.parentId;
    node = parentId ? (DESIGN_NODES.find((n) => n.id === parentId) ?? null) : null;
  }
  return {
    ...person,
    nodePath: path,
    lastActiveAt: person.status === 'active' ? new Date().toISOString() : null,
    scopeNote: SCOPE_NOTE,
  };
}

function paginate(items: OrgPersonDto[], page: number): Paginated<OrgPersonDto> {
  const start = (page - 1) * PAGE_SIZE;
  return {
    items: items.slice(start, start + PAGE_SIZE),
    page,
    pageSize: PAGE_SIZE,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / PAGE_SIZE)),
  };
}

const SESSIONS: SessionDto[] = [
  {
    id: 'design-session',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    lastSeenAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    userAgent: 'Design mode',
    current: true,
  },
];

/**
 * Answers the endpoints the app actually calls over HTTP today: auth, me and
 * org. Everything else still goes through its own mock adapter, untouched.
 */
export async function designTransport(url: string, init: RequestInit = {}): Promise<Response> {
  const parsed = new URL(url, 'http://design.local');
  const path = parsed.pathname;
  const method = (init.method ?? 'GET').toUpperCase();
  const body = typeof init.body === 'string' ? JSON.parse(init.body) : {};

  // A touch of latency, so loading states are visible to whoever is designing
  // them rather than flashing past.
  await new Promise((resolve) => setTimeout(resolve, 120));

  if (path === '/api/auth/otp/request' && method === 'POST') {
    return json({ codeId: 'design-code', expiresInSeconds: 120, resendAfterSeconds: 60 });
  }
  if (path === '/api/auth/otp/verify' && method === 'POST') {
    if (String(body.code ?? '').length !== OTP_LENGTH) return error(400, 'OTP_INVALID');
    signedIn = true;
    return json({ ok: true });
  }
  if (path === '/api/auth/login' && method === 'POST') {
    signedIn = true;
    return json({ ok: true });
  }
  if (path === '/api/auth/password' && method === 'POST') {
    return json({ ok: true });
  }
  if (path === '/api/auth/logout' && method === 'POST') {
    signedIn = false;
    return json({ ok: true });
  }

  if (path === '/api/me') {
    if (!signedIn) return error(401, 'UNAUTHENTICATED');
    if (method === 'PATCH') return json({ ...me(), ...body, onboardingCompleted: true });
    return json(me());
  }
  if (path === '/api/me/sessions' && method === 'GET') {
    if (!signedIn) return error(401, 'UNAUTHENTICATED');
    return json(SESSIONS);
  }
  if (path.startsWith('/api/me/sessions/') && method === 'DELETE') {
    return json({ ok: true });
  }

  if (path.startsWith('/api/org')) {
    if (!signedIn) return error(401, 'UNAUTHENTICATED');
    const persona = personaById(currentPersona);
    const isManager =
      persona.me.roles.includes('org_admin') || persona.me.roles.includes('unit_manager');
    // The same refusal the server gives, so a learner persona shows the same
    // empty state a learner really sees.
    if (!isManager) return error(403, 'FORBIDDEN');

    if (path === '/api/org/tree') {
      const allowed = new Set(visibleNodeIds(persona));
      return json({
        rootId: persona.me.managedNodeId ?? DESIGN_NODES[0]!.id,
        items: DESIGN_NODES.filter((node) => allowed.has(node.id)),
      });
    }
    if (path === '/api/org/people') {
      const page = Number(parsed.searchParams.get('page') ?? '1') || 1;
      const q = parsed.searchParams.get('q')?.trim().toLowerCase();
      let items = peopleInScope();
      if (q) items = items.filter((p) => p.fullName.toLowerCase().includes(q));
      return json(paginate(items, page));
    }
    const summaryMatch = /^\/api\/org\/people\/([^/]+)\/summary$/.exec(path);
    if (summaryMatch) {
      const summary = summaryFor(summaryMatch[1]!);
      // 404 rather than 403 for someone out of scope, exactly as the server
      // does, so the designer never sees a state the real app cannot produce.
      return summary ? json(summary) : error(404, 'NOT_FOUND');
    }
  }

  return error(404, 'NOT_FOUND');
}
