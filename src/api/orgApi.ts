import type { Paginated } from '../../shared/schemas/common';
import type {
  OrgNodeDto,
  OrgPersonDto,
  OrgPersonSummaryDto,
  PeopleQuery,
} from '../../shared/schemas/org';
import { http } from './http';

/** The scoped organization reads. The server decides what is in scope. */
export const orgApi = {
  async tree(): Promise<{ rootId: string; items: OrgNodeDto[] }> {
    return http.get('/org/tree');
  },

  async people(query: Partial<PeopleQuery> = {}): Promise<Paginated<OrgPersonDto>> {
    return http.get('/org/people', {
      query: {
        page: query.page,
        q: query.q,
        nodeId: query.nodeId,
        status: query.status,
        rank: query.rank,
        sort: query.sort,
        dir: query.dir,
      },
    });
  },

  async personSummary(id: string): Promise<OrgPersonSummaryDto> {
    return http.get(`/org/people/${id}/summary`);
  },
};
