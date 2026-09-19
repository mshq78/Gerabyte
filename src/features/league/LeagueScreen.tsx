import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Award, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react';
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
    <div className="flex-1 flex flex-col p-4 space-y-4">
      {/* 1. League Header Badge & Countdown */}
      <header
        className="p-5 rounded-3xl border shadow-xs text-center space-y-3 relative overflow-hidden"
        style={{
          backgroundColor: tierInfo.borderTone,
          borderColor: tierInfo.color + '40',
        }}
      >
        {/* Unit-named Badge built with nested squares */}
        <div className="w-14 h-14 mx-auto relative flex items-center justify-center">
          {/* Outer Square */}
          <div
            className="w-14 h-14 rounded-2xl rotate-45 flex items-center justify-center shadow-md border-2 border-white"
            style={{ backgroundColor: tierInfo.color }}
          >
            {/* Inner Nested Square */}
            <div className="w-8 h-8 rounded-xl bg-white/25 flex items-center justify-center">
              <div className="w-4 h-4 rounded-md bg-white rotate-45" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-black text-[#0D3F6B]">
            {tierInfo.title}
          </h2>
          <p className="text-xs text-[#0D3F6B]/70 mt-0.5">
            گروه ۳۰ نفره شما در این هفته
          </p>
        </div>

        {/* Friday Night Countdown Strip */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 text-xs font-bold text-[#0D3F6B] shadow-2xs border border-black/5">
          <Clock className="w-3.5 h-3.5 text-[#E58A1F]" />
          <span>{countdown.text}</span>
        </div>
      </header>

      {/* 2. League Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#E8E1D5]/60 rounded-2xl border border-[#E8E1D5]">
        <button
          onClick={() => setActiveTab('my_league')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'my_league'
              ? 'bg-white text-[#0D3F6B] shadow-xs'
              : 'text-[#0D3F6B]/70 hover:text-[#0D3F6B]'
          }`}
        >
          لیگ من
        </button>

        {user.accountType === 'org_member' && (
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'teams'
                ? 'bg-white text-[#0D3F6B] shadow-xs'
                : 'text-[#0D3F6B]/70 hover:text-[#0D3F6B]'
            }`}
          >
            واحدها و گروه‌ها
          </button>
        )}

        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'challenges'
              ? 'bg-white text-[#0D3F6B] shadow-xs'
              : 'text-[#0D3F6B]/70 hover:text-[#0D3F6B]'
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
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#0D3F6B]/70 px-2">
            <span className="flex items-center gap-1 text-[#2E9E6B]">
              <span className="w-2 h-2 rounded-full bg-[#2E9E6B]" />
              صعود ۷ نفر اول به مگابایت
            </span>
            <span className="flex items-center gap-1 text-[#D5483F]">
              <span className="w-2 h-2 rounded-full bg-[#D5483F]" />
              سقوط ۵ نفر آخر به بایت
            </span>
          </div>

          <div className="rounded-2xl bg-white border border-[#E8E1D5] overflow-hidden shadow-xs divide-y divide-[#E8E1D5]">
            {board.entries.map((entry, idx) => {
              const isPromoteLine = idx === board.promoteTop - 1;
              const isDemoteLine = idx === board.entries.length - board.demoteBottom - 1;
              const isPromoteZone = idx < board.promoteTop;
              const isDemoteZone = idx >= board.entries.length - board.demoteBottom;

              return (
                <React.Fragment key={entry.userId}>
                  <div
                    className={`flex items-center justify-between p-3 transition-colors ${
                      entry.isMe
                        ? 'bg-[#EAF3F9] font-bold border-l-4 border-l-[#1E6FA8]'
                        : isPromoteZone
                        ? 'hover:bg-[#F6FBF8]'
                        : isDemoteZone
                        ? 'hover:bg-[#FDF9F9]'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Rank & Avatar & Name */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 text-center font-black text-xs ${
                          idx === 0
                            ? 'text-[#F2A93B] text-base'
                            : idx === 1
                            ? 'text-gray-400 text-sm'
                            : idx === 2
                            ? 'text-[#C7821B] text-sm'
                            : 'text-[#0D3F6B]/60'
                        }`}
                      >
                        {toFa(entry.rank)}
                      </span>

                      <Avatar seed={entry.avatarSeed} size={36} />

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#0D3F6B]">
                            {entry.displayName}
                          </span>
                          {entry.movement === 'up' && (
                            <ArrowUp className="w-3 h-3 text-[#2E9E6B]" />
                          )}
                          {entry.movement === 'down' && (
                            <ArrowDown className="w-3 h-3 text-[#D5483F]" />
                          )}
                        </div>
                        {entry.unitLabel && (
                          <p className="text-[10px] text-[#0D3F6B]/60">
                            {entry.unitLabel}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Weekly XP */}
                    <div className="text-left">
                      <span className="text-xs font-bold text-[#1E6FA8]">
                        {toFa(entry.weeklyXp)} XP
                      </span>
                    </div>
                  </div>

                  {/* Promotion Line Divider */}
                  {isPromoteLine && (
                    <div className="bg-[#EDF8F6] text-[#2E9E6B] px-3 py-1 text-[10px] font-bold flex items-center justify-between border-y border-[#2E9E6B]/20">
                      <span>▲ منطقه صعود به لیگ مگابایت</span>
                      <span>۷ نفر اول</span>
                    </div>
                  )}

                  {/* Demotion Line Divider */}
                  {isDemoteLine && (
                    <div className="bg-[#FDF2F0] text-[#D5483F] px-3 py-1 text-[10px] font-bold flex items-center justify-between border-y border-[#D5483F]/20">
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
          <div className="p-3 rounded-2xl bg-white border border-[#E8E1D5] text-xs text-[#0D3F6B]/80 leading-relaxed">
            رتبه‌بندی واحدها بر اساس <strong>میانگین امتیاز هفتگی اعضا</strong> و <strong>درصد مشارکت</strong> محاسبه می‌شود.
          </div>

          <div className="rounded-2xl bg-white border border-[#E8E1D5] overflow-hidden shadow-xs divide-y divide-[#E8E1D5]">
            {teamBoard.map((team) => (
              <div key={team.rank} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 font-bold text-sm text-[#0D3F6B]/70">
                    {toFa(team.rank)}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-[#0D3F6B]">
                      {team.nodeName}
                    </h4>
                    <p className="text-[11px] text-[#0D3F6B]/60 mt-0.5">
                      {toFa(team.membersCount)} نفر · مشارکت {toFa(team.participationPct)}٪
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <span className="font-black text-xs text-[#1E6FA8]">
                    {toFa(team.avgWeeklyXp)} XP
                  </span>
                  <p className="text-[10px] text-[#0D3F6B]/50">میانگین هر عضو</p>
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
              className="p-4 rounded-2xl bg-white border border-[#E8E1D5] hover:border-[#1E6FA8]/50 shadow-xs cursor-pointer transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#E58A1F] bg-[#FEF6EC] px-2.5 py-0.5 rounded-full border border-[#F2A93B]/30">
                  {ch.origin === 'org_requested' ? 'پویش سازمانی' : 'چالش گرا'}
                </span>
                <span className="text-xs text-[#0D3F6B]/60">
                  {toFa(ch.participants)} شرکت‌کننده
                </span>
              </div>

              <h4 className="font-bold text-sm text-[#0D3F6B] leading-snug">
                {ch.title}
              </h4>
              <p className="text-xs text-[#0D3F6B]/75 line-clamp-2">
                {ch.description}
              </p>

              <div className="pt-1 border-t border-[#E8E1D5] flex items-center justify-between text-xs">
                <span className="font-bold text-[#2E9E6B]">
                  جایزه: {ch.prize.title}
                </span>
                <span className="font-bold text-[#1E6FA8]">
                  مشاهده جزئیات
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
