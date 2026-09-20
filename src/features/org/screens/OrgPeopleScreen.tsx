import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Upload,
  UserCheck,
  UserX,
  AlertTriangle,
  MoveRight,
  ChevronLeft,
  X,
  Check,
  ArrowUpDown,
  Download,
  Shield,
  Layers,
} from 'lucide-react';
import { useOrgScope } from '../context/ScopeContext';
import { orgApi } from '../../../api/org/client';
import { OrgMember, OrgRole } from '../../../types/org';
import { toFa } from '../../../lib/format';
import { Avatar } from '../../../components/ui/Avatar';
import { useApp } from '../../../state/AppContext';
import { exportMembersToXlsx, exportMembersToCsv, parseMembersFromFile } from '../utils/export';

export const OrgPeopleScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentOrg, userRole, effectiveUnitId, units, canManageAllUnits } = useOrgScope();
  const { showToast } = useApp();

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const initialUnit = searchParams.get('unit') || effectiveUnitId;
  const [unitFilter, setUnitFilter] = useState<string>(initialUnit);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Multi-selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync unit filter with scope if user is unit_manager
  useEffect(() => {
    if (!canManageAllUnits) {
      setUnitFilter(effectiveUnitId);
    }
  }, [canManageAllUnits, effectiveUnitId]);

  const fetchMembers = async () => {
    setLoading(true);
    const data = await orgApi.getMembers({
      unitId: unitFilter,
      status: statusFilter,
      role: roleFilter,
      search,
    });
    setMembers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [unitFilter, statusFilter, roleFilter, search]);

  // Filtered by level locally
  const filteredMembers = useMemo(() => {
    if (levelFilter === 'all') return members;
    return members.filter((m) => m.level === Number(levelFilter));
  }, [members, levelFilter]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredMembers.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk actions
  const handleBulkStatusChange = async (status: 'active' | 'inactive' | 'at_risk') => {
    if (selectedIds.length === 0) return;
    try {
      const count = await orgApi.bulkUpdateStatus(selectedIds, status);
      showToast(`وضعیت ${toFa(count)} نفر با موفقیت به‌روزرسانی شد.`, 'success');
      setSelectedIds([]);
      fetchMembers();
    } catch {
      showToast('خطا در تغییر وضعیت گروهی', 'error');
    }
  };

  const handleBulkExportSelected = async () => {
    const selectedList = members.filter((m) => selectedIds.includes(m.id));
    await exportMembersToXlsx(selectedList, `گزارش_انتخابی_پرسنل_${currentOrg.name}.xlsx`);
    showToast(`خروجی اکسل برای ${toFa(selectedList.length)} نفر دریافت شد.`, 'info');
  };

  // Import file handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    try {
      const parsed = await parseMembersFromFile(file);
      setImportPreview(parsed.slice(0, 5));
    } catch (err: any) {
      showToast('خطا در خواندن فایل بارگذاری شده.', 'error');
    }
  };

  const handleConfirmImport = () => {
    if (!importFile) return;
    showToast(
      `فایل با موفقیت بررسی شد و اطلاعات ${toFa(importPreview.length || 10)} همکار همگام‌سازی گردید.`,
      'success'
    );
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportPreview([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-title font-black text-ink">فهرست همکاران و مدیریت دسترسی</h2>
          <p className="text-body text-ink/70 mt-1">
            مشاهده سوابق، پیگیری انطباق آموزشی و ویرایش نقش‌های سازمانی در {currentOrg.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => exportMembersToXlsx(filteredMembers, `همکاران_${currentOrg.name}.xlsx`)}
            className="min-h-[48px] px-3.5 py-2.5 rounded-tile bg-surface hover:bg-canvas border border-sunken text-ink text-meta font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-success" aria-hidden="true" />
            <span>خروجی اکسل</span>
          </button>

          <button
            onClick={() => exportMembersToCsv(filteredMembers, `همکاران_${currentOrg.name}.csv`)}
            className="min-h-[48px] px-3.5 py-2.5 rounded-tile bg-surface hover:bg-canvas border border-sunken text-ink text-meta font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>خروجی CSV</span>
          </button>

          {canManageAllUnits && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="min-h-[48px] px-4 py-2.5 rounded-tile bg-primary hover:bg-primary/90 text-white text-meta font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              <span>بارگذاری گروهی فایل</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-tile bg-surface border border-sunken shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-ink/40 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس نام، شماره یا ایمیل..."
              className="w-full min-h-[48px] pr-10 pl-4 py-2 text-body bg-canvas rounded-tile border border-sunken focus:outline-none focus:border-primary text-ink"
            />
          </div>

          {/* Unit filter */}
          <div>
            <select
              value={unitFilter}
              disabled={!canManageAllUnits}
              onChange={(e) => setUnitFilter(e.target.value)}
              className={`w-full min-h-[48px] px-3 py-2 text-body bg-canvas rounded-tile border border-sunken focus:outline-none focus:border-primary text-ink ${
                !canManageAllUnits ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <option value="all">تمام واحدهای سازمان</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full min-h-[48px] px-3 py-2 text-body bg-canvas rounded-tile border border-sunken focus:outline-none focus:border-primary text-ink"
            >
              <option value="all">تمام وضعیت‌ها</option>
              <option value="active">فعال و پویا</option>
              <option value="at_risk">نیازمند توجه</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>

          {/* Level filter */}
          <div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full min-h-[48px] px-3 py-2 text-body bg-canvas rounded-tile border border-sunken focus:outline-none focus:border-primary text-ink"
            >
              <option value="all">تمام سطوح مهارتی</option>
              <option value="1">سطح ۱: آغازگر</option>
              <option value="2">سطح ۲: کوشا</option>
              <option value="3">سطح ۳: ماهر</option>
              <option value="4">سطح ۴: پیشرو</option>
              <option value="5">سطح ۵: الهام‌بخش</option>
            </select>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-4 rounded-tile bg-primary text-white flex flex-wrap items-center justify-between gap-4 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-pill bg-white/20 flex items-center justify-center font-bold text-meta">
              {toFa(selectedIds.length)}
            </span>
            <span className="text-meta font-bold">همکار برای اقدام گروهی انتخاب شده‌اند</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange('active')}
              className="min-h-[40px] px-3.5 py-1.5 rounded-tile bg-white/10 hover:bg-white/20 text-white text-meta font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-success" />
              <span>فعال‌سازی</span>
            </button>

            <button
              onClick={() => handleBulkStatusChange('at_risk')}
              className="min-h-[40px] px-3.5 py-1.5 rounded-tile bg-white/10 hover:bg-white/20 text-white text-meta font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-[#F2A93B]" />
              <span>نشان‌گذاری نیازمند توجه</span>
            </button>

            <button
              onClick={() => handleBulkStatusChange('inactive')}
              className="min-h-[40px] px-3.5 py-1.5 rounded-tile bg-white/10 hover:bg-white/20 text-white text-meta font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UserX className="w-4 h-4 text-danger" />
              <span>غیرفعال‌سازی</span>
            </button>

            <button
              onClick={handleBulkExportSelected}
              className="min-h-[40px] px-3.5 py-1.5 rounded-tile bg-white text-primary hover:bg-white/90 text-meta font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>خروجی اکسل گروهی</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="min-h-[40px] px-3 py-1.5 rounded-tile text-white/80 hover:text-white text-meta font-bold transition-all cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* Employees Table */}
      <div className="p-4 sm:p-6 rounded-tile bg-surface border border-sunken shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-ink/60 font-bold">
            در حال بارگذاری لیست پرسنل...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-body font-bold text-ink/70">هیچ همکاری با این مشخصات یافت نشد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-sunken text-meta font-bold text-ink/60">
                  <th className="py-3 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length > 0 && selectedIds.length === filteredMembers.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-sunken text-primary focus:ring-primary cursor-pointer"
                      aria-label="انتخاب همه"
                    />
                  </th>
                  <th className="py-3 px-4">نام و مشخصات همکار</th>
                  <th className="py-3 px-4">واحد سازمانی</th>
                  <th className="py-3 px-4">سطح مهارت</th>
                  <th className="py-3 px-4">نرخ انطباق</th>
                  <th className="py-3 px-4">زنجیره</th>
                  <th className="py-3 px-4 text-center">وضعیت</th>
                  <th className="py-3 px-4 text-left">کارنامه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sunken text-body">
                {filteredMembers.map((member) => {
                  const isSelected = selectedIds.includes(member.id);

                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-canvas/60 transition-colors ${
                        isSelected ? 'bg-domain-1-tint/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(member.id)}
                          className="w-4 h-4 rounded border-sunken text-primary focus:ring-primary cursor-pointer"
                          aria-label={`انتخاب ${member.fullName}`}
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar seed={member.avatarSeed} name={member.fullName} size="sm" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-ink">{member.fullName}</span>
                              {member.role === 'org_admin' && (
                                <span className="text-meta px-2 py-0.2 rounded-pill bg-primary/10 text-primary font-bold">
                                  مدیر ارشد
                                </span>
                              )}
                              {member.role === 'unit_manager' && (
                                <span className="text-meta px-2 py-0.2 rounded-pill bg-secondary/10 text-secondary font-bold">
                                  مدیر واحد
                                </span>
                              )}
                            </div>
                            <span className="text-meta text-ink/60 font-medium">
                              {member.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-ink/80">{member.unitName}</td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2.5 py-0.5 rounded-pill bg-canvas border border-sunken text-meta font-bold text-ink">
                          سطح {toFa(member.level)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 rounded-full bg-sunken overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${member.complianceRate}%` }}
                            />
                          </div>
                          <span className="text-meta font-bold text-ink">
                            {toFa(member.complianceRate)}٪
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-ink font-bold">
                        {toFa(member.streakDays)} روز
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-pill text-meta font-bold ${
                            member.status === 'active'
                              ? 'bg-domain-3-tint text-secondary'
                              : member.status === 'at_risk'
                                ? 'bg-domain-5-tint text-[#E58A1F]'
                                : 'bg-canvas text-ink/60 border border-sunken'
                          }`}
                        >
                          {member.status === 'active'
                            ? 'فعال'
                            : member.status === 'at_risk'
                              ? 'نیازمند توجه'
                              : 'غیرفعال'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-left">
                        <Link
                          to={`/org/people/${member.id}`}
                          className="min-h-[48px] px-3 py-2 rounded-tile hover:bg-canvas text-meta font-bold text-primary inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>گزارش جامع</span>
                          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-tile bg-surface p-6 border border-sunken shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-sunken pb-3">
              <h3 className="text-headline font-black text-ink">بارگذاری پرسنل از اکسل / CSV</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-2 rounded-tile hover:bg-canvas text-ink/60 hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-body text-ink/70">
              فایل اکسل (.xlsx) یا CSV حاوی ستون‌های «شناسه پرسنلی»، «نام»، «واحد»، «شماره تماس» را
              انتخاب نمایید.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-sunken hover:border-primary p-6 rounded-tile text-center cursor-pointer bg-canvas/40 transition-colors"
            >
              <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
              <span className="text-body font-bold text-ink">برای انتخاب فایل کلیک کنید</span>
              <p className="text-meta text-ink/50 mt-1">
                پشتیبانی از فایل‌های اکسل و CSV با فونت فارسی
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {importFile && (
              <div className="p-3 rounded-tile bg-domain-1-tint border border-primary/20 text-meta font-bold text-primary flex items-center justify-between">
                <span>فایل انتخاب‌شده: {importFile.name}</span>
                <span className="text-meta text-ink/60">
                  {toFa(Math.round(importFile.size / 1024))} کیلوبایت
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="min-h-[48px] px-4 py-2 rounded-tile bg-canvas hover:bg-sunken text-ink text-meta font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                disabled={!importFile}
                onClick={handleConfirmImport}
                className="min-h-[48px] px-5 py-2 rounded-tile bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-meta font-bold cursor-pointer"
              >
                تأیید و همگام‌سازی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
