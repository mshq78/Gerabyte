import { mockRequest } from './client';
import { LeagueBoard, TeamBoardEntry, LeagueTier } from '../types/domain';
import { MOCK_LEAGUE_MEMBERS, MOCK_TEAM_BOARD } from '../mock/data';
import { getStoredUser } from './auth';
import { RULES } from '../lib/rules';

export const leagueApi = {
  // TODO(backend): GET /api/v1/league/board?scope=org|public
  async getBoard(scope: 'org' | 'public' = 'org'): Promise<LeagueBoard> {
    return mockRequest(
      () => {
        const user = getStoredUser();
        const currentTier: LeagueTier = 'kilobyte';

        // Update current user's row in league with live stats
        const entries = MOCK_LEAGUE_MEMBERS.map((m) => {
          if (m.isMe || m.userId === 'u-me') {
            return {
              ...m,
              displayName: `${user.fullName} (شما)`,
              weeklyXp: Math.min(300, Math.max(80, Math.round(user.xpTotal * 0.2))),
            };
          }
          return m;
        });

        // Sort by weeklyXp desc
        entries.sort((a, b) => b.weeklyXp - a.weeklyXp);
        entries.forEach((e, idx) => {
          e.rank = idx + 1;
        });

        const myEntry = entries.find((e) => e.isMe) || entries[11];
        const myRank = myEntry.rank;

        // Next Friday 23:59:59
        const now = new Date();
        const currentDay = now.getDay();
        let daysUntilFriday = (5 - currentDay + 7) % 7;
        if (daysUntilFriday === 0) daysUntilFriday = 7;
        const target = new Date(now);
        target.setDate(now.getDate() + daysUntilFriday);
        target.setHours(23, 59, 59, 999);

        return {
          scope,
          tier: currentTier,
          tierTitle: 'کیلوبایت',
          weekEndsAt: target.toISOString(),
          promoteTop: RULES.LEAGUE_PROMOTE_TOP,
          demoteBottom: RULES.LEAGUE_DEMOTE_BOTTOM,
          entries: entries.slice(0, RULES.LEAGUE_BOARD_SIZE),
          myRank,
        };
      },
      { endpoint: `/api/v1/league/board?scope=${scope}` }
    );
  },

  // TODO(backend): GET /api/v1/league/teams
  async getTeamBoard(): Promise<TeamBoardEntry[]> {
    return mockRequest(() => MOCK_TEAM_BOARD, { endpoint: '/api/v1/league/teams' });
  },
};
