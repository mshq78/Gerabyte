import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  X,
  Trophy,
  Calendar,
  Users,
  CheckCircle2,
  Lock,
  ChevronLeft,
  Gift,
} from 'lucide-react';
import { challengesApi } from '../../api/challenges';
import { Challenge } from '../../types/domain';
import { Button } from '../../components/ui/Button';
import { ByteRow } from '../../components/ui/ByteRow';
import { Avatar } from '../../components/ui/Avatar';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';

export const ChallengeDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, entitlements, showToast } = useApp();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await challengesApi.get(id);
        setChallenge(data);
      } catch (err: any) {
        showToast(err.message || 'خطا در دریافت چالش', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, showToast]);

  if (loading || !challenge) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-[#0D3F6B]">
        <div className="w-10 h-10 border-4 border-[#1E6FA8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isLockedForPlan = challenge.requiresFullPlan && !entitlements.canJoinPrizeChallenges;

  const handleJoin = async () => {
    if (isLockedForPlan) {
      navigate('/subscription');
      return;
    }
    try {
      setIsJoining(true);
      const updated = await challengesApi.join(challenge.id);
      setChallenge(updated);
      showToast('با موفقیت به چالش ملحق شدید!', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در پیوستن به چالش', 'error');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2EDE4] flex flex-col justify-between p-4 text-[#0D3F6B]">
      {/* Top Bar */}
      <header className="flex items-center justify-between py-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-[#0D3F6B]/60 hover:text-[#0D3F6B] hover:bg-white"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-[#E58A1F] bg-[#FEF6EC] px-3 py-1 rounded-full border border-[#F2A93B]/30">
          {challenge.origin === 'org_requested'
            ? 'پیشنهاد مدیر · تأییدشده توسط گرا'
            : 'چالش رسمی گرا'}
        </span>
      </header>

      {/* Main Details */}
      <div className="flex-1 py-4 space-y-4 max-w-sm mx-auto w-full">
        <div>
          <h2 className="text-xl font-black text-[#0D3F6B] leading-snug">
            {challenge.title}
          </h2>
          <p className="text-xs text-[#0D3F6B]/80 mt-1 leading-relaxed">
            {challenge.description}
          </p>
        </div>

        {/* Prize Banner */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#FEF6EC] text-[#F2A93B] flex items-center justify-center shrink-0 border border-[#F2A93B]/30">
            <Gift className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#E58A1F]">جایزه نهایی چالش:</span>
            <h4 className="font-bold text-sm text-[#0D3F6B] mt-0.5">{challenge.prize.title}</h4>
            <p className="text-[11px] text-[#0D3F6B]/70">{challenge.prize.description}</p>
          </div>
        </div>

        {/* Progress Byte Row if Joined */}
        {challenge.state === 'joined' && (
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0D3F6B]">میزان پیشرفت شما در چالش</span>
              <span className="font-bold text-[#1E6FA8]">
                {toFa(challenge.progress)} از {toFa(challenge.goal.target)} روز
              </span>
            </div>
            <div className="flex justify-center py-1">
              <ByteRow
                total={challenge.goal.target}
                completed={challenge.progress}
                size="md"
                activeColor="#E58A1F"
              />
            </div>
          </div>
        )}

        {/* Rules Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs space-y-2.5 text-xs">
          <h4 className="font-bold text-sm text-[#0D3F6B]">قوانین و اهداف چالش:</h4>
          <div className="flex items-center gap-2 text-[#0D3F6B]/80">
            <Users className="w-4 h-4 text-[#1E6FA8] shrink-0" />
            <span>تعداد حاضرین: {toFa(challenge.participants)} شرکت‌کننده فعال</span>
          </div>
          <div className="flex items-start gap-2 text-[#0D3F6B]/80">
            <CheckCircle2 className="w-4 h-4 text-[#2E9E6B] shrink-0 mt-0.5" />
            <span>
              هدف: ثبت {toFa(challenge.goal.target)}{' '}
              {challenge.goal.type === 'streak'
                ? 'روز زنجیره متوالی'
                : challenge.goal.type === 'lessons'
                ? 'درس تکمیل شده'
                : 'امتیاز شایستگی'}
            </span>
          </div>
        </div>

        {/* Top Participants List */}
        {challenge.top && challenge.top.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-[#0D3F6B] px-1">
              برترین‌های چالش در حال حاضر:
            </h4>
            <div className="rounded-2xl bg-white border border-[#E8E1D5] overflow-hidden divide-y divide-[#E8E1D5]">
              {challenge.top.slice(0, 5).map((p, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 font-bold text-[#0D3F6B]/60 text-center">
                      {toFa(idx + 1)}
                    </span>
                    <Avatar seed={p.avatarSeed} size={30} />
                    <span className="font-bold text-[#0D3F6B]">{p.displayName}</span>
                  </div>
                  <span className="font-bold text-[#1E6FA8]">
                    {toFa(p.weeklyXp)} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action CTA */}
      <div className="pt-3 max-w-sm mx-auto w-full">
        {challenge.state === 'joined' ? (
          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={() => navigate('/path')}
          >
            ادامه گرابایت‌های چالش
          </Button>
        ) : isLockedForPlan ? (
          <Button
            fullWidth
            size="lg"
            variant="accent"
            onClick={() => navigate('/subscription')}
            leftIcon={<Lock className="w-5 h-5" />}
          >
            ارتقا به اشتراک کامل برای شرکت
          </Button>
        ) : (
          <Button
            fullWidth
            size="lg"
            variant="primary"
            isLoading={isJoining}
            onClick={handleJoin}
          >
            پیوستن به چالش
          </Button>
        )}
      </div>
    </div>
  );
};
