import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { DESIGN_PERSONAS, personaById, visibleNodeIds } from './personas';
import { DESIGN_MODE_MARKER, designTransport, setPersona } from './transport';

/**
 * Design mode has two jobs: be faithful enough that a designer is not
 * designing for a state the real app cannot reach, and be impossible to
 * deploy. Both are tested here.
 */
describe('the fake transport', () => {
  it('answers /api/me with the selected persona', async () => {
    setPersona('unit-manager');
    const response = await designTransport('/api/me');
    expect(response.status).toBe(200);
    const me = await response.json();
    expect(me.roles).toContain('unit_manager');
    expect(me.managedNodeId).toBeTruthy();
  });

  it('scopes the tree to a unit manager subtree, as the server does', async () => {
    setPersona('unit-manager');
    const tree = await (await designTransport('/api/org/tree')).json();
    const adminTree = await (async () => {
      setPersona('org-admin');
      return (await designTransport('/api/org/tree')).json();
    })();

    expect(tree.items.length).toBeLessThan(adminTree.items.length);
    expect(adminTree.items.length).toBe(4);
  });

  it('refuses a learner the org endpoints, as the server does', async () => {
    setPersona('new-learner');
    const response = await designTransport('/api/org/people');
    expect(response.status).toBe(403);
  });

  it('answers 404, not 403, for a person outside the scope', async () => {
    setPersona('unit-manager');
    const outOfScope = await designTransport('/api/org/people/p-6/summary');
    // A 403 would confirm the record exists. The real server answers 404, so
    // design mode must too, or the designer styles a state that cannot occur.
    expect(outOfScope.status).toBe(404);

    const inScope = await designTransport('/api/org/people/p-1/summary');
    expect(inScope.status).toBe(200);
  });

  it('masks every phone it returns', async () => {
    setPersona('org-admin');
    const people = await (await designTransport('/api/org/people')).json();
    expect(people.items.length).toBeGreaterThan(0);
    for (const person of people.items) {
      expect(person.phoneMasked, person.fullName).toContain('***');
      expect(person).not.toHaveProperty('phone');
      expect(person).not.toHaveProperty('email');
    }
  });

  it('gives every persona a coherent scope', () => {
    for (const persona of DESIGN_PERSONAS) {
      expect(visibleNodeIds(persona).length, persona.id).toBeGreaterThan(0);
    }
    expect(personaById('nonsense').id).toBeTruthy();
  });
});

describe('production safety', () => {
  it('keeps the marker where the build guard looks for it', () => {
    expect(DESIGN_MODE_MARKER).toBe('__GB_DESIGN_MODE__');
    const guard = readFileSync('scripts/check-dist.mjs', 'utf8');
    expect(guard).toContain(DESIGN_MODE_MARKER);
  });

  it('is reached only from a statically guarded dynamic import', () => {
    // If src/design were imported statically anywhere, it would land in the
    // production bundle no matter what the flag said.
    const entry = readFileSync('src/main.tsx', 'utf8');
    expect(entry).toContain("import.meta.env.VITE_DESIGN_MODE === '1'");
    expect(entry).toContain("await import('./design')");
    expect(entry).not.toMatch(/^import .* from '\.\/design'/m);
  });

  it('refuses to build for a deployment', () => {
    for (const deployEnv of ['staging', 'production']) {
      const result = spawnSync('node', ['scripts/check-design-mode.mjs'], {
        env: { ...process.env, VITE_DESIGN_MODE: '1', DEPLOY_ENV: deployEnv },
        encoding: 'utf8',
      });
      expect(result.status, deployEnv).toBe(1);
      expect(result.stderr, deployEnv).toContain('refusing to build');
    }
  });

  it('allows the design build locally', () => {
    const result = spawnSync('node', ['scripts/check-design-mode.mjs'], {
      env: { ...process.env, VITE_DESIGN_MODE: '1', DEPLOY_ENV: 'local' },
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
  });
});
