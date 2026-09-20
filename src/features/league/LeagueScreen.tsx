import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { leagueApi } from '../../api/league';
import { challengesApi } from '../../api/challenges';
import { LeagueBoard, TeamBoardEntry, Challenge } from '../../types/domain';
import { Avatar } from '../../components/ui/Avatar';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';
import { getLeagueCountdownFa } from '../../lib/jalali';
import { LEAGUE_TIER_INFO } from '../../lib/format';

export const LeagueScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'my_league' | 'teams' | 'challenges'>('my_league');
  const [board, setBoard] = useState<LeagueBoard | null>(null);
  const [teamBoard, setTeamBoard] = useState<TeamBoardEntry[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [countdown, setCountdown] = useState(getLeagueCountdownFa());

  useEffect(() => {
    async function load() {
      try {
        const b = await leagueApi.getBoard(user.accountType === 'org_member' ? 'org' : 'public');
        setBoard(b);
        const t = await leagueApi.getTeamBoard();
        setTeamBoard(t);
        const c = await challengesApi.list();
        setChallenges(c);
      } catch {
        // fallback
      }
    }
    load();

    const timer = setInterval(() => {
      setCountdown(getLeagueCountdownFa());
    }, 60000);
    return () => clearInterval(timer);
  }, [user.accountType]);

  const tierInfo = board ? LEAGUE_TIER_INFO[board.tier] : LEAGUE_TIER_INFO['kilobyte'];

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 text-ink">
      {/* 1. League Header Badge & Countdown */}
      <header
        className="p-5 rounded-sheet border shadow-xs text-center space-y-3 relative overflow-hidden"
        style={{
          backgroundColor: tierInfo.borderTone,
          borderColor: tierInfo.color + '40',
        }}
      >
        {/* Unit-named Badge built with nested squares */}
        <div className="w-14 h-14 mx-auto relative flex items-center justify-center">
          {/* Outer Square */}
          <div
            className="w-14 h-14 rounded-tile rotate-45 flex items-center justify-center shadow-md border-2 border-surface"
            style={{ backgroundColor: tierInfo.color }}
          >
            {/* Inner Nested Square */}
            <div className="w-8 h-8 rounded-tile bg-surface/25 flex items-center justify-center">
              <div className="w-4 h-4 rounded-tile bg-surface rotate-45" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-headline font-black text-ink">{tierInfo.title}</h2>
          <p className="text-meta text-ink/70 mt-0.5">گروه ۳۰ نفره شما در این هفته</p>
        </div>

        {/* Friday Night Countdown Strip */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface/90 text-meta font-bold text-ink shadow-2xs border border-sunken">
          <Clock className="w-4 h-4 text-coin" aria-hidden="true" />
          <span>{countdown.text}</span>
        </div>
      </header>

      {/* 2. League Tabs */}
      <div className="flex items-center gap-2 p-1 bg-sunken-dark rounded-tile border border-sunken">
        <button
          onClick={() => setActiveTab('my_league')}
          className={`flex-1 min-h-[48px] py-2 rounded-tile text-meta font-bold transition-all cursor-pointer ${
            activeTab === 'my_league'
              ? 'bg-surface text-ink shadow-xs'
              : 'text-ink/70 hover:text-ink'
          }`}
        >
          لیگ من
        </button>

        {user.accountType === 'org_member' && (
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 min-h-[48px] py-2 rounded-tile text-meta font-bold transition-all cursor-pointer ${
              activeTab === 'teams' ? 'bg-surface text-ink shadow-xs' : 'text-ink/70 hover:text-ink'
            }`}
          >
            واحدها و گروه‌ها
          </button>
        )}

        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 min-h-[48px] py-2 rounded-tile text-meta font-bold transition-all cursor-pointer ${
            activeTab === 'challenges'
              ? 'bg-surface text-ink shadow-xs'
              : 'text-ink/70 hover:text-ink'
          }`}
        >
          چالش‌ها
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB: MY LEAGUE */}
      {activeTab === 'my_league' && board && (
        <div className="space-y-2">
          {/* Zone Guide Legend */}
          <div className="flex items-center justify-between text-meta font-semibold text-ink/70 px-2">
            <span className="flex items-center gap-1 text-success">
              <span className="w-2 h-2 rounded-pill bg-success" />
              صعود ۷ نفر اول به مگابایت
            </span>
            <span className="flex items-center gap-1 text-danger">
              <span className="w-2 h-2 rounded-pill bg-danger" />
              سقوط ۵ نفر آخر به بایت
            </span>
          </div>

          <div className="rounded-tile bg-surface border border-sunken overflow-hidden shadow-xs divide-y divide-sunken">
            {board.entries.map((entry, idx) => {
              const isPromoteLine = idx === board.promoteTop - 1;
              const isDemoteLine = idx === board.entries.length - board.demoteBottom - 1;
              const isPromoteZone = idx < board.promoteTop;
              const isDemoteZone = idx >= board.entries.length - board.demoteBottom;

              return (
                <React.Fragment key={entry.userId}>
                  <div
                    className={`flex items-center justify-between p-3 min-h-[48px] transition-colors ${
                      entry.isMe
                        ? 'bg-domain-1-tint font-bold border-l-4 border-l-primary'
                        : isPromoteZone
                          ? 'hover:bg-domain-3-tint/30'
                          : isDemoteZone
                            ? 'hover:bg-danger-tint/30'
                            : 'hover:bg-canvas'
                    }`}
                  >
                    {/* Rank & Avatar & Name */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 text-center font-black ${
                          idx === 0
                            ? 'text-coin text-body'
                            : idx === 1
                              ? 'text-ink/60 text-meta'
                              : idx === 2
                                ? 'text-coin/80 text-meta'
                                : 'text-ink/60 text-meta'
                        }`}
                      >
                        {toFa(entry.rank)}
                      </span>

                      <Avatar seed={entry.avatarSeed} size={40} />

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-body font-bold text-ink">{entry.displayName}</span>
                          {entry.movement === 'up' && (
                            <ArrowUp className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                          )}
                          {entry.movement === 'down' && (
                            <ArrowDown className="w-3.5 h-3.5 text-danger" aria-hidden="true" />
                          )}
                        </div>
                        {entry.unitLabel && (
                          <p className="text-meta text-ink/60">{entry.unitLabel}</p>
                        )}
                      </div>
                    </div>

                    {/* Weekly XP */}
                    <div className="text-left">
                      <span className="text-meta font-bold text-primary">
                        {toFa(entry.weeklyXp)} XP
                      </span>
                    </div>
                  </div>

                  {/* Promotion Line Divider */}
                  {isPromoteLine && (
                    <div className="bg-domain-3-tint text-success px-3 py-1 text-meta font-bold flex items-center justify-between border-y border-success/20">
                      <span>▲ منطقه صعود به لیگ مگابایت</span>
                      <span>۷ نفر اول</span>
                    </div>
                  )}

                  {/* Demotion Line Divider */}
                  {isDemoteLine && (
                    <div className="bg-danger-tint text-danger px-3 py-1 text-meta font-bold flex items-center justify-between border-y border-danger/20">
                      <span>▼ منطقه خطر سقوط به لیگ بایت</span>
                      <span>۵ نفر آخر</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: TEAMS (Org Members) */}
      {activeTab === 'teams' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-tile bg-surface border border-sunken text-body text-ink/80 leading-relaxed">
            رتبه‌بندی واحدها بر اساس <strong>میانگین امتیاز هفتگی اعضا</strong> و{' '}
            <strong>درصد مشارکت</strong> محاسبه می‌شود.
          </div>

          <div className="rounded-tile bg-surface border border-sunken overflow-hidden shadow-xs divide-y divide-sunken">
            {teamBoard.map((team) => (
              <div key={team.rank} className="p-4 flex items-center justify-between min-h-[48px]">
                <div className="flex items-center gap-3">
                  <span className="w-6 font-bold text-body text-ink/70">{toFa(team.rank)}</span>
                  <div>
                    <h4 className="font-bold text-body text-ink">{team.nodeName}</h4>
                    <p className="text-meta text-ink/60 mt-0.5">
                      {toFa(team.membersCount)} نفر · مشارکت {toFa(team.participationPct)}٪
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <span className="font-black text-body text-primary">
                    {toFa(team.avgWeeklyXp)} XP
                  </span>
                  <p className="text-meta text-ink/50">میانگین هر عضو</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: CHALLENGES */}
      {activeTab === 'challenges' && (
        <div className="space-y-3">
          {challenges.map((ch) => (
            <div
              key={ch.id}
              onClick={() => navigate(`/challenges/${ch.id}`)}
              className="p-4 min-h-[48px] rounded-tile bg-surface border border-sunken hover:border-primary/50 shadow-xs cursor-pointer transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-meta font-bold text-coin bg-domain-5-tint px-2.5 py-0.5 rounded-pill border border-coin/30">
                  {ch.origin === 'org_requested' ? 'پویش سازمانی' : 'چالش گرا'}
                </span>
                <span className="text-meta text-ink/60">{toFa(ch.participants)} شرکت‌کننده</span>
              </div>

              <h4 className="font-bold text-body text-ink leading-snug">{ch.title}</h4>
              <p className="text-meta text-ink/75 line-clamp-2">{ch.description}</p>

              <div className="pt-1 border-t border-sunken flex items-center justify-between text-meta">
                <span className="font-bold text-success">جایزه: {ch.prize.title}</span>
                <span className="font-bold text-primary">مشاهده جزئیات</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
