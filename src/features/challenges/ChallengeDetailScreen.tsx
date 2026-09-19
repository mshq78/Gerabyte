import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  X,
  Users,
  CheckCircle2,
  Lock,
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
  const { entitlements, showToast } = useApp();

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
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-ink">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-pill animate-spin" />
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
    <div className="min-h-screen bg-canvas flex flex-col justify-between p-4 text-ink">
      {/* Top Bar */}
      <header className="flex items-center justify-between py-2">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-tile text-ink/60 hover:text-ink hover:bg-surface flex items-center justify-center cursor-pointer"
          aria-label="بستن"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
        <span className="text-meta font-bold text-coin bg-domain-5-tint px-3 py-1 rounded-pill border border-coin/30">
          {challenge.origin === 'org_requested'
            ? 'پیشنهاد مدیر · تأییدشده توسط گرا'
            : 'چالش رسمی گرا'}
        </span>
      </header>

      {/* Main Details */}
      <div className="flex-1 py-4 space-y-4 max-w-sm mx-auto w-full">
        <div>
          <h2 className="text-headline font-black text-ink leading-snug">
            {challenge.title}
          </h2>
          <p className="text-meta text-ink/80 mt-1 leading-relaxed">
            {challenge.description}
          </p>
        </div>

        {/* Prize Banner */}
        <div className="p-4 rounded-tile bg-surface border border-sunken shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-tile bg-domain-5-tint text-coin flex items-center justify-center shrink-0 border border-coin/30">
            <Gift className="w-6 h-6 stroke-[2.2]" aria-hidden="true" />
          </div>
          <div>
            <span className="text-meta font-bold text-coin">جایزه نهایی چالش:</span>
            <h4 className="font-bold text-body text-ink mt-0.5">{challenge.prize.title}</h4>
            <p className="text-meta text-ink/70">{challenge.prize.description}</p>
          </div>
        </div>

        {/* Progress Byte Row if Joined */}
        {challenge.state === 'joined' && (
          <div className="p-4 rounded-tile bg-surface border border-sunken shadow-xs space-y-2">
            <div className="flex items-center justify-between text-meta">
              <span className="font-bold text-ink">میزان پیشرفت شما در چالش</span>
              <span className="font-bold text-primary">
                {toFa(challenge.progress)} از {toFa(challenge.goal.target)} روز
              </span>
            </div>
            <div className="flex justify-center py-1">
              <ByteRow
                total={challenge.goal.target}
                completed={challenge.progress}
                size="md"
                activeColor="var(--color-coin)"
              />
            </div>
          </div>
        )}

        {/* Rules Card */}
        <div className="p-4 rounded-tile bg-surface border border-sunken shadow-xs space-y-2.5 text-body">
          <h4 className="font-bold text-title text-ink">قوانین و اهداف چالش:</h4>
          <div className="flex items-center gap-2 text-ink/80">
            <Users className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span className="text-meta">تعداد حاضرین: {toFa(challenge.participants)} شرکت‌کننده فعال</span>
          </div>
          <div className="flex items-start gap-2 text-ink/80">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-meta">
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
            <h4 className="font-bold text-meta text-ink px-1">
              برترین‌های چالش در حال حاضر:
            </h4>
            <div className="rounded-tile bg-surface border border-sunken overflow-hidden divide-y divide-sunken">
              {challenge.top.slice(0, 5).map((p, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-meta min-h-[48px]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 font-bold text-ink/60 text-center">
                      {toFa(idx + 1)}
                    </span>
                    <Avatar seed={p.avatarSeed} size={32} />
                    <span className="font-bold text-ink">{p.displayName}</span>
                  </div>
                  <span className="font-bold text-primary">
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
            leftIcon={<Lock className="w-5 h-5" aria-hidden="true" />}
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
