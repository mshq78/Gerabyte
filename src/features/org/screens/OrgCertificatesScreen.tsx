import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Award, Search, Download, ExternalLink } from 'lucide-react';
import { certificatesApi } from '../../../api/org/certificates';
import { OrgCertificateItem } from '../../../types/org';
import { useOrgScope } from '../context/ScopeContext';
import { toFa } from '../../../lib/format';
import { formatJalaliDate } from '../../../lib/jalali';

export const OrgCertificatesScreen: React.FC = () => {
  const { userRole, units } = useOrgScope();
  const [certificates, setCertificates] = useState<OrgCertificateItem[]>([]);
  const [pathNames, setPathNames] = useState<string[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedPath, setSelectedPath] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, paths] = await Promise.all([
        certificatesApi.list({
          role: userRole,
          unitId: selectedUnit,
          pathName: selectedPath,
          search,
        }),
        certificatesApi.getPathNames(),
      ]);
      setCertificates(list);
      setPathNames(paths);
    } finally {
      setLoading(false);
    }
  }, [userRole, selectedUnit, selectedPath, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Totals by path
  const totalsByPath = certificates.reduce<Record<string, number>>((acc, item) => {
    acc[item.pathName] = (acc[item.pathName] || 0) + 1;
    return acc;
  }, {});

  // Export to CSV
  const handleExportCsv = () => {
    const bom = '\uFEFF';
    const headers = [
      'سریال گواهینامه',
      'عنوان گواهینامه',
      'مسیر آموزشی',
      'نام دارنده',
      'واحد سازمانی',
      'نمره آزمون',
      'تاریخ صدور',
    ];
    const rows = certificates.map((c) =>
      [
        `"${c.serial}"`,
        `"${c.title}"`,
        `"${c.pathName}"`,
        `"${c.holderName}"`,
        `"${c.unitName}"`,
        `"${c.scorePct}%"`,
        `"${formatJalaliDate(c.issuedAt)}"`,
      ].join(',')
    );
    const content = bom + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificates_export_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 text-ink">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sunken pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-7 h-7 text-coin" />
            <h1 className="text-display font-black text-ink">گواهینامه‌های رسمی سازمانی</h1>
          </div>
          <p className="text-body text-ink/70 mt-1">
            فهرست گواهینامه‌های تخصصی صادرشده برای کارکنان با قابلیت استعلام و راستی‌آزمایی برخط
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="min-h-[44px] px-4 py-2 rounded-tile bg-canvas hover:bg-sunken border border-sunken text-primary font-bold text-meta flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>خروجی اکسل و CSV</span>
        </button>
      </div>

      {/* Path Totals Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(totalsByPath).map(([name, count]) => (
          <div
            key={name}
            className="p-3.5 rounded-tile bg-surface border border-sunken shadow-xs space-y-1"
          >
            <span className="text-meta text-ink/60 line-clamp-1 block">{name}</span>
            <div className="text-title font-black text-primary">{toFa(count)} گواهینامه</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-sheet bg-surface border border-sunken shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Unit Filter */}
          {userRole === 'org_admin' ? (
            <div>
              <label
                htmlFor="org-certificates-f1"
                className="block text-meta font-bold text-ink mb-1"
              >
                واحد سازمانی:
              </label>
              <select
                id="org-certificates-f1"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="min-h-[44px] w-full px-3 py-1.5 rounded-tile bg-canvas border border-sunken text-meta font-bold text-ink cursor-pointer"
              >
                <option value="all">همه واحدها (کل سازمان)</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <p className="block text-meta font-bold text-ink mb-1">محدوده نمایش:</p>
              <div className="min-h-[44px] px-3 py-2 rounded-tile bg-canvas border border-sunken text-meta font-bold text-primary">
                واحد نورد گرم و مقاطع (زیرشاخه شما)
              </div>
            </div>
          )}

          {/* Path Filter */}
          <div>
            <label
              htmlFor="org-certificates-f3"
              className="block text-meta font-bold text-ink mb-1"
            >
              مسیر آموزشی:
            </label>
            <select
              id="org-certificates-f3"
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
              className="min-h-[44px] w-full px-3 py-1.5 rounded-tile bg-canvas border border-sunken text-meta font-bold text-ink cursor-pointer"
            >
              <option value="all">تمام مسیرهای یادگیری</option>
              {pathNames.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label
              htmlFor="org-certificates-f4"
              className="block text-meta font-bold text-ink mb-1"
            >
              جستجو:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-3.5 text-ink/40" />
              <input
                id="org-certificates-f4"
                type="text"
                placeholder="جستجوی نام همکار، سریال یا عنوان..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-[44px] w-full pl-3 pr-9 py-2 rounded-tile bg-canvas border border-sunken text-meta font-bold text-ink"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="rounded-sheet bg-surface border border-sunken shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-body font-bold text-ink/60">
            در حال بارگذاری گواهینامه‌ها...
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-16 text-ink/60 font-bold space-y-2">
            <Award className="w-12 h-12 text-ink/30 mx-auto" />
            <p>گواهینامه‌ای با این مشخصات یافت نشد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-meta">
              <thead className="bg-canvas border-b border-sunken text-ink/70">
                <tr>
                  <th className="p-3.5">نام و نام خانوادگی</th>
                  <th className="p-3.5">عنوان دوره / شایستگی</th>
                  <th className="p-3.5">مسیر آموزشی</th>
                  <th className="p-3.5">واحد سازمانی</th>
                  <th className="p-3.5">نمره</th>
                  <th className="p-3.5">سریال</th>
                  <th className="p-3.5">تاریخ صدور</th>
                  <th className="p-3.5 text-center">استعلام و اعتبار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sunken">
                {certificates.map((cert) => (
                  <tr key={cert.serial} className="hover:bg-canvas">
                    <td className="p-3.5 font-bold text-ink">{cert.holderName}</td>
                    <td className="p-3.5 font-medium text-ink">{cert.title}</td>
                    <td className="p-3.5 text-ink/70">{cert.pathName}</td>
                    <td className="p-3.5 text-ink/70">{cert.unitName}</td>
                    <td className="p-3.5 font-mono font-bold text-success">
                      {toFa(cert.scorePct)}٪
                    </td>
                    <td className="p-3.5 font-mono text-ink/80 text-meta">{cert.serial}</td>
                    <td className="p-3.5 font-mono text-ink/60">
                      {formatJalaliDate(cert.issuedAt)}
                    </td>
                    <td className="p-3.5 text-center">
                      <Link
                        to={`/verify/${cert.serial}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-tile bg-canvas hover:bg-sunken border border-sunken text-primary font-bold text-meta transition-all"
                        title="مشاهده صفحه اعتبارسنجی عمومی گواهینامه"
                      >
                        <span>استعلام</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
