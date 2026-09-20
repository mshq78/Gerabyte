import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  FolderTree,
  UserCheck,
  Shield,
  Bell,
  Plus,
  Edit2,
  Trash2,
  Move,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { orgSettingsApi, OrgProfileSettings } from '../../../api/org/settings';
import { orgApi } from '../../../api/org/client';
import { OrgUnit, OrgReminderPolicy, OrgMember } from '../../../types/org';
import { useOrgScope } from '../context/ScopeContext';
import { toFa } from '../../../lib/format';
import { errorMessage } from '../../../lib/errors';

export const OrgSettingsScreen: React.FC = () => {
  const { userRole } = useOrgScope();
  const [profile, setProfile] = useState<OrgProfileSettings | null>(null);
  const [units, setUnits] = useState<OrgUnit[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [reminderPolicy, setReminderPolicy] = useState<OrgReminderPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals / Dialogs
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitParentId, setNewUnitParentId] = useState<string | null>(null);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetParentId, setTargetParentId] = useState<string | null>(null);

  const [showAssignManagerModal, setShowAssignManagerModal] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, u, r, m] = await Promise.all([
        orgSettingsApi.getProfile(),
        orgSettingsApi.getUnits(),
        orgSettingsApi.getReminderPolicy(),
        orgApi.getMembers(),
      ]);
      setProfile(p);
      setUnits(u);
      setReminderPolicy(r);
      setMembers(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (userRole === 'unit_manager') {
    return (
      <div className="p-8 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-domain-2-tint text-danger flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-title font-black text-ink">دسترسی محدود به مدیر کل سازمان</h2>
        <p className="text-body text-ink/70">
          ویرایش مشخصات سازمان، ویرایش درخت سلسله‌مراتب و تعیین خط‌مشی‌ها تنها توسط مدیر کل مجاز
          است.
        </p>
      </div>
    );
  }

  // Handle Unit Actions
  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;
    try {
      await orgSettingsApi.addUnit(newUnitName.trim(), newUnitParentId);
      setShowAddModal(false);
      setNewUnitName('');
      setMessage({ type: 'success', text: `واحد «${newUnitName}» با موفقیت افزوده شد.` });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) || 'خطای نامشخص رخ داد.' });
    }
  };

  const handleRenameUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit || !renameValue.trim()) return;
    try {
      await orgSettingsApi.renameUnit(selectedUnit.id, renameValue.trim());
      setShowRenameModal(false);
      setMessage({ type: 'success', text: 'نام واحد با موفقیت تغییر یافت.' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) || 'خطای نامشخص رخ داد.' });
    }
  };

  const handleMoveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    try {
      await orgSettingsApi.moveUnit(selectedUnit.id, targetParentId);
      setShowMoveModal(false);
      setMessage({ type: 'success', text: 'واحد با موفقیت در درخت سازمان جابجا شد.' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) || 'خطای نامشخص رخ داد.' });
    }
  };

  const handleDeleteUnit = async (unit: OrgUnit) => {
    if (!confirm(`آیا از حذف واحد «${unit.name}» اطمینان دارید؟`)) return;
    try {
      await orgSettingsApi.deleteUnit(unit.id);
      setMessage({ type: 'success', text: `واحد «${unit.name}» حذف گردید.` });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) || 'خطای نامشخص رخ داد.' });
    }
  };

  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit || !selectedManagerId) return;
    const member = members.find((m) => m.id === selectedManagerId);
    if (!member) return;

    try {
      await orgSettingsApi.assignManager(selectedUnit.id, member.id, member.fullName);
      setShowAssignManagerModal(false);
      setMessage({
        type: 'success',
        text: `همکار گرامی «${member.fullName}» به‌عنوان مدیر واحد «${selectedUnit.name}» منصوب شد و دسترسی unit_manager به ایشان تخصیص یافت.`,
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) || 'خطای نامشخص رخ داد.' });
    }
  };

  // Supervisors and above for manager picker
  const eligibleManagers = members.filter(
    (m) => m.rank === 'supervisor' || m.rank === 'middle_manager' || m.rank === 'senior_manager'
  );

  if (loading || !profile || !reminderPolicy) {
    return (
      <div className="text-center py-20 text-body font-bold text-ink/60">
        در حال بارگذاری تنظیمات سازمان...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 text-ink">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sunken pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-7 h-7 text-primary" />
            <h1 className="text-display font-black text-ink">تنظیمات و ساختار سازمان</h1>
          </div>
          <p className="text-body text-ink/70 mt-1">
            پیکربندی هویت سازمان، ویرایش درخت سلسله‌مراتب، تخصیص دسترسی مدیران و خط‌مشی‌های ارتباطی
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-tile border text-meta font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-domain-3-tint border-success/30 text-success'
              : 'bg-domain-2-tint border-danger/30 text-danger'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. Organization Profile Card */}
      <section className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
        <h2 className="text-title font-black text-ink flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <span>پروفایل و نشان سازمانی</span>
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-4 rounded-tile bg-canvas border border-sunken">
          <div className="w-20 h-20 rounded-sheet bg-primary text-white flex items-center justify-center text-display font-black shadow-sm shrink-0">
            {profile.initialsMark}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="text-title font-black text-ink">{profile.name}</div>
            <div className="text-meta text-ink/70">
              حوزه صنعتی: <strong>{profile.industry}</strong> | جمعیت تحت پوشش:{' '}
              <strong>{toFa(profile.workforceCount)} نفر</strong>
            </div>
            <div className="text-meta text-ink/50">
              * ویرایش عنوان و نشان رسمی نیازمند ارسال درخواست به پشتیبانی سازمانی گرا است.
            </div>
          </div>
        </div>
      </section>

      {/* 2. Hierarchy Tree Editor */}
      <section className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-title font-black text-ink flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" />
              <span>ساختار درختی و سلسله‌مراتب سازمانی</span>
            </h2>
            <p className="text-meta text-ink/60 mt-0.5">
              امکان ایجاد زیرمجموعه، تغییر نام، جابجایی والد (با پیشگیری هوشمند از چرخه‌های تودرتو)
              و انتصاب مدیران
            </p>
          </div>

          <button
            onClick={() => {
              setNewUnitParentId(null);
              setShowAddModal(true);
            }}
            className="min-h-[44px] px-4 py-2 rounded-tile bg-primary hover:bg-primary-hover text-white text-meta font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن واحد جدید</span>
          </button>
        </div>

        {/* Units Tree List */}
        <div className="space-y-2 pt-2">
          {units.map((unit) => {
            const parent = units.find((u) => u.id === unit.parentId);

            return (
              <div
                key={unit.id}
                style={{ marginRight: `${(unit.level || 0) * 20}px` }}
                className="p-4 rounded-tile bg-canvas border border-sunken hover:border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-meta text-ink/50">[{unit.code}]</span>
                    <strong className="text-body text-ink font-black">{unit.name}</strong>
                    {parent && (
                      <span className="text-meta text-ink/50">(زیرمجموعه: {parent.name})</span>
                    )}
                  </div>
                  <div className="text-meta text-ink/70 flex items-center gap-3">
                    <span>
                      تعداد پرسنل: <strong>{toFa(unit.memberCount)} نفر</strong>
                    </span>
                    <span>•</span>
                    <span className="text-primary font-bold">
                      مدیر واحد: {unit.managerName || 'تعیین نشده'}
                    </span>
                  </div>
                </div>

                {/* Tree Row Operations */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => {
                      setNewUnitParentId(unit.id);
                      setShowAddModal(true);
                    }}
                    className="min-h-[36px] px-2.5 py-1 rounded-tile bg-surface hover:bg-sunken border border-sunken text-ink text-meta font-bold flex items-center gap-1 cursor-pointer"
                    title="افزودن زیرمجموعه به این واحد"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>زیرشاخه</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedUnit(unit);
                      setRenameValue(unit.name);
                      setShowRenameModal(true);
                    }}
                    className="min-h-[36px] px-2.5 py-1 rounded-tile bg-surface hover:bg-sunken border border-sunken text-ink text-meta font-bold flex items-center gap-1 cursor-pointer"
                    title="تغییر نام واحد"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>ویرایش</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedUnit(unit);
                      setTargetParentId(unit.parentId);
                      setShowMoveModal(true);
                    }}
                    className="min-h-[36px] px-2.5 py-1 rounded-tile bg-surface hover:bg-sunken border border-sunken text-ink text-meta font-bold flex items-center gap-1 cursor-pointer"
                    title="جابجایی در درخت"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span>انتقال</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedUnit(unit);
                      setSelectedManagerId(unit.managerId || '');
                      setShowAssignManagerModal(true);
                    }}
                    className="min-h-[36px] px-2.5 py-1 rounded-tile bg-domain-1-tint hover:bg-primary hover:text-white border border-primary/30 text-primary text-meta font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="انتصاب مدیر به این واحد (unit_manager)"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>انتصاب مدیر</span>
                  </button>

                  <button
                    onClick={() => handleDeleteUnit(unit)}
                    className="min-h-[36px] p-2 rounded-tile bg-surface hover:bg-domain-2-tint border border-sunken text-danger transition-all cursor-pointer"
                    title="حذف واحد"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Managers and Roles Table */}
      <section className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
        <h2 className="text-title font-black text-ink flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span>مدیران و نقش‌های دسترسی فعال</span>
        </h2>

        <div className="overflow-x-auto rounded-tile border border-sunken">
          <table className="w-full text-right text-meta">
            <thead className="bg-canvas border-b border-sunken text-ink/70">
              <tr>
                <th className="p-3">نام و نام خانوادگی</th>
                <th className="p-3">واحد تحت مدیریت</th>
                <th className="p-3">سطح دسترسی (Role)</th>
                <th className="p-3">حیطه اختیارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sunken">
              <tr className="hover:bg-canvas">
                <td className="p-3 font-bold text-ink">مهندس محمدرضا صادقی</td>
                <td className="p-3 text-ink/80">ستاد مرکزی مجتمع</td>
                <td className="p-3">
                  <span className="px-2.5 py-0.5 rounded-pill bg-domain-1-tint text-primary font-black text-meta">
                    org_admin
                  </span>
                </td>
                <td className="p-3 text-ink/70">
                  مدیر کل (دسترسی به تمام واحدها، سهمیه‌ها و تنظیمات)
                </td>
              </tr>
              {units
                .filter((u) => u.managerName && u.managerName !== 'تعیین نشده')
                .map((u) => (
                  <tr key={u.id} className="hover:bg-canvas">
                    <td className="p-3 font-bold text-ink">{u.managerName}</td>
                    <td className="p-3 text-ink/80">{u.name}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-pill bg-domain-4-tint text-domain-4 font-black text-meta">
                        unit_manager
                      </span>
                    </td>
                    <td className="p-3 text-ink/70">
                      مدیریت اعضا، تکالیف و گواهینامه‌های زیرشاخه {u.name}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Manager Transparency Card (B8 Read-only in Settings) */}
      <section className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Shield className="w-6 h-6" />
          <h2 className="text-title font-black text-ink">
            چه چیزی برای مدیران قابل مشاهده است؟ (منشور شفافیت)
          </h2>
        </div>

        <p className="text-body text-ink/80 leading-relaxed">
          گرابایت داده‌های مربوط به دوره‌ها و تکالیف سازمانی را به مدیران گزارش می‌دهد، اما اطلاعات
          شخصی و مستقل یادگیرندگان را کاملاً محرمانه نگه می‌دارد:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-meta">
          <div className="p-4 rounded-tile bg-domain-3-tint/30 border border-success/30 space-y-2">
            <strong className="text-success block text-body">اطلاعات قابل مشاهده برای مدیر:</strong>
            <ul className="space-y-1 text-ink/80 list-disc pr-4">
              <li>پیشرفت و نمرات در مسیرهای سازمانی مصوب</li>
              <li>گواهینامه‌های صادرشده و تاریخ اخذ</li>
              <li>تعداد روزهای مطالعه مستمر و استمرار کلی</li>
            </ul>
          </div>

          <div className="p-4 rounded-tile bg-domain-2-tint/30 border border-danger/30 space-y-2">
            <strong className="text-danger block text-body">
              اطلاعات محرمانه و غیرقابل مشاهده:
            </strong>
            <ul className="space-y-1 text-ink/80 list-disc pr-4">
              <li>گرابایت‌ها، کتاب‌ها و حوزه‌های اختیاری شخصی</li>
              <li>موجودی سکه‌ها، پاداش‌ها و خریدهای فردی</li>
              <li>مسیرهای یادگیری مستقل خارج از وظایف سازمانی</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Reminder Policy */}
      <section className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
        <h2 className="text-title font-black text-ink flex items-center gap-2">
          <Bell className="w-5 h-5 text-coin" />
          <span>خط‌مشی پیامک‌ها و اعلان‌های یادآوری</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-tile bg-canvas border border-sunken space-y-2">
            <span className="text-meta font-bold text-ink block">سقف مجاز روزانه:</span>
            <div className="text-title font-black text-primary">
              حداکثر {toFa(reminderPolicy.maxRemindersPerDay)} پیامک در روز
            </div>
            <p className="text-meta text-ink/60">برای جلوگیری از خستگی ذهنی و مزاحمت پرسنل</p>
          </div>

          <div className="p-4 rounded-tile bg-canvas border border-sunken space-y-2">
            <span className="text-meta font-bold text-ink block">ساعات خاموشی و عدم ارسال:</span>
            <div className="text-title font-black text-ink font-mono">
              {reminderPolicy.quietHoursStart} الی {reminderPolicy.quietHoursEnd}
            </div>
            <p className="text-meta text-ink/60">در شیفت استراحت پیامکی ارسال نخواهد شد</p>
          </div>

          <div className="p-4 rounded-tile bg-canvas border border-sunken space-y-2">
            <span className="text-meta font-bold text-ink block">یادآوری خودکار عدم فعالیت:</span>
            <div className="text-title font-black text-ink">
              پس از {toFa(reminderPolicy.autoNudgeInactiveDays)} روز بی‌فعالیتی
            </div>
            <p className="text-meta text-ink/60">جهت حفظ انگیزه و بازگشت به چرخه یادگیری</p>
          </div>
        </div>
      </section>

      {/* MODAL: ADD CHILD UNIT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-sheet bg-surface border border-sunken shadow-xl space-y-4">
            <h3 className="text-title font-black text-ink">افزودن واحد جدید به درخت سازمان</h3>
            <form onSubmit={handleAddUnit} className="space-y-4">
              <div>
                <label
                  htmlFor="org-settings-f1"
                  className="block text-meta font-bold text-ink mb-1"
                >
                  نام واحد سازمانی:
                </label>
                <input
                  id="org-settings-f1"
                  type="text"
                  placeholder="مثال: کارگاه تراشکاری و سنگ‌زنی"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="min-h-[44px] w-full px-3 rounded-tile bg-canvas border border-sunken text-body font-bold text-ink"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="org-settings-f2"
                  className="block text-meta font-bold text-ink mb-1"
                >
                  موقعیت در درخت (واحد والد):
                </label>
                <select
                  id="org-settings-f2"
                  value={newUnitParentId || ''}
                  onChange={(e) => setNewUnitParentId(e.target.value || null)}
                  className="min-h-[44px] w-full px-3 rounded-tile bg-canvas border border-sunken text-meta font-bold text-ink"
                >
                  <option value="">شاخه اصلی سازمان (سطح اول)</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sunken">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[40px] px-4 rounded-tile bg-canvas border border-sunken text-meta font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 rounded-tile bg-primary text-white text-meta font-bold"
                >
                  افزودن واحد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RENAME UNIT */}
      {showRenameModal && selectedUnit && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-sheet bg-surface border border-sunken shadow-xl space-y-4">
            <h3 className="text-title font-black text-ink">تغییر نام واحد</h3>
            <form onSubmit={handleRenameUnit} className="space-y-4">
              <div>
                <label
                  htmlFor="org-settings-f3"
                  className="block text-meta font-bold text-ink mb-1"
                >
                  نام جدید واحد:
                </label>
                <input
                  id="org-settings-f3"
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="min-h-[44px] w-full px-3 rounded-tile bg-canvas border border-sunken text-body font-bold text-ink"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sunken">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="min-h-[40px] px-4 rounded-tile bg-canvas border border-sunken text-meta font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 rounded-tile bg-primary text-white text-meta font-bold"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVE UNIT (WITH CYCLE CHECK) */}
      {showMoveModal && selectedUnit && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-sheet bg-surface border border-sunken shadow-xl space-y-4">
            <h3 className="text-title font-black text-ink">
              انتقال واحد «{selectedUnit.name}» در درخت
            </h3>
            <form onSubmit={handleMoveUnit} className="space-y-4">
              <div>
                <label
                  htmlFor="org-settings-f4"
                  className="block text-meta font-bold text-ink mb-1"
                >
                  انتخاب واحد والد جدید:
                </label>
                <select
                  id="org-settings-f4"
                  value={targetParentId || ''}
                  onChange={(e) => setTargetParentId(e.target.value || null)}
                  className="min-h-[44px] w-full px-3 rounded-tile bg-canvas border border-sunken text-meta font-bold text-ink"
                >
                  <option value="">شاخه ریشه سازمان (سطح اول)</option>
                  {units
                    .filter((u) => u.id !== selectedUnit.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sunken">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(false)}
                  className="min-h-[40px] px-4 rounded-tile bg-canvas border border-sunken text-meta font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 rounded-tile bg-primary text-white text-meta font-bold"
                >
                  تأیید انتقال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN MANAGER */}
      {showAssignManagerModal && selectedUnit && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-sheet bg-surface border border-sunken shadow-xl space-y-4">
            <h3 className="text-title font-black text-ink">
              انتصاب مدیر برای «{selectedUnit.name}»
            </h3>
            <form onSubmit={handleAssignManager} className="space-y-4">
              <div>
                <label
                  htmlFor="org-settings-f5"
                  className="block text-meta font-bold text-ink mb-1"
                >
                  انتخاب از میان سرپرستان و مدیران:
                </label>
                <select
                  id="org-settings-f5"
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="min-h-[44px] w-full px-3 rounded-tile bg-canvas border border-sunken text-meta font-bold text-ink"
                  required
                >
                  <option value="">-- انتخاب همکار --</option>
                  {eligibleManagers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} (
                      {m.rank === 'supervisor'
                        ? 'سرپرست'
                        : m.rank === 'middle_manager'
                          ? 'مدیر میانی'
                          : 'مدیر ارشد'}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-tile bg-domain-1-tint/50 border border-primary/30 text-meta text-ink/80 flex items-start gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  با این انتخاب، دسترسی نقش <strong>unit_manager</strong> برای مشاهده گزارش‌ها و
                  تکالیف زیرمجموعه این واحد به ایشان اعطا می‌گردد.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sunken">
                <button
                  type="button"
                  onClick={() => setShowAssignManagerModal(false)}
                  className="min-h-[40px] px-4 rounded-tile bg-canvas border border-sunken text-meta font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 rounded-tile bg-primary text-white text-meta font-bold"
                >
                  تأیید انتصاب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
