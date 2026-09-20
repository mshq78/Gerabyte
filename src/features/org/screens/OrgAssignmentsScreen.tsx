import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  X,
  Filter,
  Layers,
  ChevronLeft,
} from 'lucide-react';
import { useOrgScope } from '../context/ScopeContext';
import { orgApi } from '../../../api/org/client';
import { PathAssignment } from '../../../types/org';
import { toFa } from '../../../lib/format';
import { useApp } from '../../../state/AppContext';

export const OrgAssignmentsScreen: React.FC = () => {
  const { currentOrg, canManageAllUnits, effectiveUnitId, units } = useOrgScope();
  const { showToast } = useApp();

  const [assignments, setAssignments] = useState<PathAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDomainId, setNewDomainId] = useState('domain-5');
  const [newTargetType, setNewTargetType] = useState<'all' | 'unit'>('all');
  const [newTargetId, setNewTargetId] = useState(
    effectiveUnitId === 'all' ? 'u-top' : effectiveUnitId
  );
  const [newMandatory, setNewMandatory] = useState(true);
  const [newDueDate, setNewDueDate] = useState('۱۴۰۳/۰۸/۱۵');

  const domainOptions = [
    { id: 'domain-1', title: 'شایستگی‌های فردی و سازمانی' },
    { id: 'domain-2', title: 'خانواده و تعادل کار و زندگی' },
    { id: 'domain-3', title: 'اخلاق حرفه‌ای و تعهد کاری' },
    { id: 'domain-4', title: 'توسعه فردی و خودرهبری' },
    { id: 'domain-5', title: 'فرهنگ ایمنی و سلامت کار' },
  ];

  const fetchAssignments = async () => {
    setLoading(true);
    const data = await orgApi.getAssignments(effectiveUnitId);
    setAssignments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, [effectiveUnitId]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('لطفاً عنوان مأموریت را وارد کنید.', 'error');
      return;
    }

    const domain = domainOptions.find((d) => d.id === newDomainId);
    const targetUnit = units.find((u) => u.id === newTargetId);

    try {
      await orgApi.createAssignment({
        title: newTitle.trim(),
        description: newDesc.trim() || 'دوره آموزشی هدفمند جهت ارتقای شایستگی‌های پرسنل',
        domainId: newDomainId,
        domainTitle: domain?.title || 'فرهنگ سازمانی',
        targetType: newTargetType,
        targetId: newTargetType === 'all' ? 'u-top' : newTargetId,
        targetName: newTargetType === 'all' ? 'تمام سازمان' : targetUnit?.name || 'واحد انتخابی',
        mandatory: newMandatory,
        dueDate: newDueDate,
      });

      showToast('مأموریت یادگیری با موفقیت تخصیص یافت.', 'success');
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      fetchAssignments();
    } catch {
      showToast('خطا در تخصیص مأموریت', 'error');
    }
  };

  const filteredAssignments =
    filterStatus === 'all' ? assignments : assignments.filter((a) => a.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-title font-black text-ink">مأموریت‌ها و مسیرهای یادگیری هدفمند</h2>
          <p className="text-body text-ink/70 mt-1">
            تعریف سرفصل‌های اجباری یا اختیاری، تعیین مهلت انجام و پایش نرخ پیشرفت دوره‌ها در{' '}
            {currentOrg.name}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="min-h-[48px] px-5 py-2.5 rounded-tile bg-primary hover:bg-primary/90 text-white text-meta font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>تعریف مأموریت جدید</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-sunken pb-3">
        <button
          onClick={() => setFilterStatus('all')}
          className={`min-h-[40px] px-4 py-1.5 rounded-pill text-meta font-bold transition-all cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-primary text-white'
              : 'bg-canvas text-ink/70 hover:bg-sunken'
          }`}
        >
          تمام دوره‌ها ({toFa(assignments.length)})
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`min-h-[40px] px-4 py-1.5 rounded-pill text-meta font-bold transition-all cursor-pointer ${
            filterStatus === 'active'
              ? 'bg-primary text-white'
              : 'bg-canvas text-ink/70 hover:bg-sunken'
          }`}
        >
          دوره‌های در جریان
        </button>
      </div>

      {/* Assignment Cards List */}
      {loading ? (
        <div className="p-12 text-center text-ink/60 font-bold">
          در حال بارگذاری دوره‌های سازمان...
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-tile border border-sunken">
          <GraduationCap className="w-12 h-12 text-ink/30 mx-auto mb-3" />
          <p className="text-body font-bold text-ink/70">
            هیچ مأموریت یادگیری فعالی تعریف نشده است.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssignments.map((asg) => {
            const progressPercent =
              asg.totalAssigned > 0
                ? Math.round((asg.completedCount / asg.totalAssigned) * 100)
                : 0;

            return (
              <div
                key={asg.id}
                className="p-6 rounded-tile bg-surface border border-sunken shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-meta px-2.5 py-0.5 rounded-pill bg-domain-1-tint text-primary font-bold">
                      {asg.domainTitle}
                    </span>
                    <span
                      className={`text-meta px-2.5 py-0.5 rounded-pill font-bold ${
                        asg.mandatory
                          ? 'bg-domain-2-tint text-danger'
                          : 'bg-canvas border border-sunken text-ink/70'
                      }`}
                    >
                      {asg.mandatory ? 'الزامی سازمانی' : 'اختیاری'}
                    </span>
                  </div>

                  <h3 className="text-headline font-black text-ink mb-1">{asg.title}</h3>
                  <p className="text-body text-ink/70 line-clamp-2">{asg.description}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-sunken">
                  <div className="flex items-center justify-between text-meta text-ink/70">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-ink/40" />
                      <span>جامعه هدف: {asg.targetName}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-bold">
                      <Calendar className="w-4 h-4 text-ink/40" />
                      <span>مهلت: {asg.dueDate}</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-meta font-bold">
                      <span className="text-ink/80">
                        {toFa(asg.completedCount)} از {toFa(asg.totalAssigned)} نفر تکمیل کرده‌اند
                      </span>
                      <span className="text-primary">{toFa(progressPercent)}٪</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-sunken overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Assignment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-tile bg-surface p-6 border border-sunken shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sunken pb-3">
              <h3 className="text-headline font-black text-ink">تخصیص مأموریت یادگیری جدید</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-tile hover:bg-canvas text-ink/60 hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-meta font-bold text-ink mb-1">
                  عنوان دوره یا مأموریت *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: آموزش اصول ایمنی کار در ارتفاع و پیشگیری از حوادث"
                  className="w-full min-h-[48px] px-3.5 py-2 text-body bg-canvas rounded-tile border border-sunken focus:outline-none focus:border-primary text-ink"
                />
              </div>

              <div>
                <label className="block text-meta font-bold text-ink mb-1">
                  توضیحات و اهداف یادگیری
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="توضیح کوتاه درباره لزوم گذراندن این سرفصل برای پرسنل..."
                  className="w-full p-3.5 text-body bg-canvas rounded-tile border border-sunken focus:outline-none focus:border-primary text-ink resize-none"
                />
              </div>

              <div>
                <label className="block text-meta font-bold text-ink mb-1">
                  حوزه مهارتی گرابایت
                </label>
                <select
                  value={newDomainId}
                  onChange={(e) => setNewDomainId(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2 text-body bg-canvas rounded-tile border border-sunken focus:outline-none focus:border-primary text-ink"
                >
                  {domainOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-meta font-bold text-ink mb-1">مخاطبان هدف</label>
                  <select
                    value={newTargetType}
                    onChange={(e) => setNewTargetType(e.target.value as any)}
                    className="w-full min-h-[48px] px-3.5 py-2 text-body bg-canvas rounded-tile border border-sunken focus:outline-none focus:border-primary text-ink"
                  >
                    <option value="all">تمام پرسنل سازمان</option>
                    <option value="unit">واحد سازمانی خاص</option>
                  </select>
                </div>

                {newTargetType === 'unit' && (
                  <div>
                    <label className="block text-meta font-bold text-ink mb-1">انتخاب واحد</label>
                    <select
                      value={newTargetId}
                      onChange={(e) => setNewTargetId(e.target.value)}
                      className="w-full min-h-[48px] px-3.5 py-2 text-body bg-canvas rounded-tile border border-sunken focus:outline-none focus:border-primary text-ink"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-meta font-bold text-ink mb-1">
                    مهلت انجام (سررسید)
                  </label>
                  <input
                    type="text"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    placeholder="۱۴۰۳/۰۸/۱۵"
                    className="w-full min-h-[48px] px-3.5 py-2 text-body bg-canvas rounded-tile border border-sunken focus:outline-none focus:border-primary text-ink"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="mandatorySwitch"
                    checked={newMandatory}
                    onChange={(e) => setNewMandatory(e.target.checked)}
                    className="w-5 h-5 rounded border-sunken text-primary focus:ring-primary cursor-pointer"
                  />
                  <label
                    htmlFor="mandatorySwitch"
                    className="text-meta font-bold text-ink cursor-pointer"
                  >
                    الزامی برای انطباق سالانه
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-sunken">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[48px] px-4 py-2 rounded-tile bg-canvas hover:bg-sunken text-ink text-meta font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="min-h-[48px] px-5 py-2 rounded-tile bg-primary hover:bg-primary/90 text-white text-meta font-bold cursor-pointer"
                >
                  ثبت و ابلاغ به پرسنل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
