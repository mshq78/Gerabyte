import { mockRequest } from './client';
import { Domain, LearningPath } from '../types/domain';
import { MOCK_DOMAINS, MOCK_PATHS } from '../mock/data';

const STORAGE_PATHS_KEY = 'gerabyte:paths_state';

export function getStoredPaths(): LearningPath[] {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_PATHS_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
  }
  return MOCK_PATHS;
}

export function saveStoredPaths(paths: LearningPath[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_PATHS_KEY, JSON.stringify(paths));
  }
}

export const pathsApi = {
  // TODO(backend): GET /api/v1/domains
  async listDomains(): Promise<Domain[]> {
    return mockRequest(() => MOCK_DOMAINS, { endpoint: '/api/v1/domains' });
  },

  // TODO(backend): GET /api/v1/paths
  async list(): Promise<LearningPath[]> {
    return mockRequest(() => getStoredPaths(), { endpoint: '/api/v1/paths' });
  },

  // TODO(backend): GET /api/v1/paths/:id
  async get(id: string): Promise<LearningPath | null> {
    return mockRequest(
      () => {
        const paths = getStoredPaths();
        return paths.find((p) => p.id === id || p.domainId === id) || paths[0];
      },
      { endpoint: `/api/v1/paths/${id}` }
    );
  },
};
