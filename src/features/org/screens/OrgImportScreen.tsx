import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Clock,
  Send,
  HelpCircle,
} from 'lucide-react';
import {
  importApi,
  CSV_TEMPLATE_HEADERS,
  CSV_TEMPLATE_SAMPLE_ROWS,
  ParsedRawRow,
  ValidationResult,
  normalizePhone,
} from '../../../api/org/import';
import { subscriptionsApi } from '../../../api/org/subscriptions';
import { orgApi } from '../../../api/org/client';
import { ImportJob, ImportRowError, OrgMember } from '../../../types/org';
import { useOrgScope } from '../context/ScopeContext';
import { toFa } from '../../../lib/format';
import { OrgDemoPanel } from '../components/OrgDemoPanel';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export const OrgImportScreen: React.FC = () => {
  const { userRole, units } = useOrgScope();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Wizard state
  const [step, setStep] = useState<WizardStep>(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRawRow[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  // Column Mappings (standard keys -> column index or header name)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    fullName: 'نام و نام خانوادگی',
    phone: 'شماره موبایل',
    personnelCode: 'کد پرسنلی',
    depName: 'معاونت',
    unitName: 'واحد',
    groupName: 'گروه',
    rankText: 'رده سازمانی',
    levelText: 'سطح',
    email: 'ایمیل',
  });

  // Options
  const [sponsorshipMonths, setSponsorshipMonths] = useState<number>(6);
  const [enableSponsorship, setEnableSponsorship] = useState<boolean>(true);
  const [sendInviteSms, setSendInviteSms] = useState<boolean>(true);
  const [autoCreateNodes, setAutoCreateNodes] = useState<boolean>(true);

  // Seat check
  const [unassignedSeats, setUnassignedSeats] = useState<number>(280);
  const [seatExceeded, setSeatExceeded] = useState<boolean>(false);

  // Progress & Execution
  const [progressPct, setProgressPct] = useState<number>(0);
  const [importing, setImporting] = useState<boolean>(false);
  const [importDone, setImportDone] = useState<boolean>(false);
  const [cancelled, setCancelled] = useState<boolean>(false);
  const [importResultSummary, setImportResultSummary] = useState<{
    added: number;
    updated: number;
    skipped: number;
    failed: number;
  }>({ added: 0, updated: 0, skipped: 0, failed: 0 });

  // History
  const [history, setHistory] = useState<ImportJob[]>([]);

  // Load history and seats
  const loadInitial = async () => {
    const hist = await importApi.getHistory();
    setHistory(hist);
    const summary = await subscriptionsApi.getSummary();
    setUnassignedSeats(summary.unassigned);
  };

  useEffect(() => {
    loadInitial();
  }, []);

  // Access check: org_admin only
  if (userRole === 'unit_manager') {
    return (
      <div className="p-8 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-domain-2-tint text-danger flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-title font-black text-ink">دسترسی محدود به مدیر کل سازمان</h2>
        <p className="text-body text-ink/70">
          امکان بارگذاری گروهی پرسنل (Bulk Import) صرفاً در اختیار مدیر ارشد آموزش یا مدیر کل سازمان است.
          مدیران واحدها می‌توانند فهرست اعضای واحد خود را در بخش «اعضا و دسترسی‌ها» مدیریت نمایند.
        </p>
      </div>
    );
  }

  // 1. Download CSV Template
  const handleDownloadTemplate = () => {
    const csvContent = importApi.generateTemplateCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'gerabyte_members_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Parse sample demo file (instant test)
  const handleLoadDemoFile = async () => {
    const sampleRows: ParsedRawRow[] = [
      {
        rowNumber: 2,
        fullName: 'کامران نادری',
        phone: '09121112233',
        personnelCode: '10811',
        depName: 'معاونت تولید و عملیات',
        unitName: 'واحد نورد گرم و مقاطع',
        rankText: 'کارشناس',
        levelText: '2',
      },
      {
        rowNumber: 3,
        fullName: 'پریسا جلالی',
        phone: '09354445566',
        personnelCode: '10812',
        depName: 'معاونت فنی و مهندسی',
        unitName: 'آزمایشگاه متالورژی و کنترل کیفی',
        rankText: 'سرپرست',
        levelText: '3',
      },
      {
        rowNumber: 4,
        fullName: 'حسین فراهانی',
        phone: '۰۹۱۹۷۷۷۸۸۹۹', // Persian digits test
        personnelCode: '10813',
        depName: 'معاونت تولید و عملیات',
        unitName: 'واحد نورد گرم و مقاطع',
        rankText: 'اپراتور',
        levelText: '1',
      },
      {
        rowNumber: 5,
        fullName: 'مهسا بهرامی',
        phone: '09120000000',
        personnelCode: '10814',
        depName: 'توسعه سرمایه انسانی',
        unitName: 'مدیریت آموزش و استعداد', // will test auto-create node!
        rankText: 'کارشناس',
        levelText: '2',
      },
      {
        rowNumber: 6,
        fullName: 'بهرام صبوری',
        phone: '09121111111', // intentional duplicate of existing member
        personnelCode: '10815',
        depName: 'معاونت فنی و مهندسی',
        unitName: 'واحد نورد گرم و مقاطع',
        rankText: 'کارشناس نامعتبر', // intentional invalid rank
        levelText: '2',
      },
    ];

    setFile(null);
    setFileName('فایل_نمونه_آزمایشی_پرسنل_جدید.csv');
    setParsedRows(sampleRows);
    setStep(3); // go to mapping
  };

  // Handle client-side file upload (CSV text reading)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFileName(f.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) return;

      const rows: ParsedRawRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 3) {
          rows.push({
            rowNumber: i + 1,
            fullName: parts[0] || '',
            phone: parts[1] || '',
            personnelCode: parts[2] || '',
            depName: parts[3] || '',
            unitName: parts[4] || '',
            groupName: parts[5] || '',
            rankText: parts[6] || '',
            levelText: parts[7] || '',
            email: parts[8] || '',
          });
        }
      }
      setParsedRows(rows);
      setStep(3);
    };
    reader.readAsText(f);
  };

  // Step 3 -> 4: Validate Rows
  const runValidation = async () => {
    const existing = await orgApi.getMembers({ role: 'org_admin' });
    const result = await importApi.validateRows(parsedRows, existing, units);
    setValidationResult(result);

    // Check seat availability
    const needed = result.validRows.length;
    const { available, unassigned } = await importApi.checkSeatAvailability(needed);
    setUnassignedSeats(unassigned);
    setSeatExceeded(enableSponsorship && !available);

    setStep(4);
  };

  // Step 5: Options confirmation and seat check
  const proceedToOptions = async () => {
    if (!validationResult) return;
    const needed = validationResult.validRows.length;
    const { available, unassigned } = await importApi.checkSeatAvailability(needed);
    setUnassignedSeats(unassigned);
    setSeatExceeded(enableSponsorship && !available);
    setStep(5);
  };

  // Step 6: Start chunked simulated import
  const startImport = async () => {
    if (!validationResult) return;
    if (enableSponsorship && seatExceeded) return;

    setStep(6);
    setImporting(true);
    setProgressPct(0);
    setCancelled(false);

    const total = validationResult.validRows.length;
    let processed = 0;
    const interval = setInterval(() => {
      processed += Math.max(1, Math.ceil(total / 5));
      const pct = Math.min(100, Math.round((processed / total) * 100));
      setProgressPct(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setImporting(false);
        setImportDone(true);

        const summary = {
          added: validationResult.validRows.length,
          updated: 0,
          skipped: validationResult.errors.length,
          failed: 0,
        };
        setImportResultSummary(summary);

        // Record into history
        const newJob: ImportJob = {
          id: `job-${Date.now()}`,
          fileName: fileName || 'فایل_بارگذاری.csv',
          rowCount: parsedRows.length,
          validRows: validationResult.validRows.length,
          errorRows: validationResult.errors.length,
          status: 'done',
          errors: validationResult.errors,
          options: {
            autoCreateNodes,
            sponsorship: enableSponsorship ? { months: sponsorshipMonths, startsAt: 'امروز' } : undefined,
            sendInviteSms,
          },
          result: summary,
        };
        importApi.addJob(newJob);
        loadInitial();
      }
    }, 400);
  };

  const handleDownloadErrorReport = () => {
    if (!validationResult || validationResult.errors.length === 0) return;
    const bom = '\uFEFF';
    const headers = ['شماره ردیف', 'ستون', 'پیام خطا', 'راهنما'];
    const lines = [
      headers.join(','),
      ...validationResult.errors.map((e) =>
        [`"${e.row}"`, `"${e.column}"`, `"${e.message}"`, `"${e.hint || ''}"`].join(',')
      ),
    ];
    const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error_report_${fileName || 'import'}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 text-ink">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sunken pb-4">
        <div>
          <h1 className="text-display font-black text-ink">بارگذاری گروهی پرسنل (Bulk Import)</h1>
          <p className="text-meta text-ink/70 mt-1">
            ورود سریع اطلاعات کارکنان از طریق فایل CSV یا اکسل با تحلیل ۱۰۰٪ درون‌مرورگری و بدون ارسال فایل به سرور
          </p>
        </div>
      </div>

      {/* Stepper Wizard Indicator */}
      <div className="p-4 rounded-sheet bg-surface border border-sunken shadow-xs">
        <div className="flex items-center justify-between overflow-x-auto gap-2">
          {[
            { num: 1, label: 'قالب و راهنما' },
            { num: 2, label: 'انتخاب فایل' },
            { num: 3, label: 'تطبیق ستون‌ها' },
            { num: 4, label: 'گزارش اعتبارسنجی' },
            { num: 5, label: 'تنظیمات و سهمیه‌ها' },
            { num: 6, label: 'پیشرفت و نتایج' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-meta transition-all ${
                  step === s.num
                    ? 'bg-primary text-white shadow-xs'
                    : step > s.num
                    ? 'bg-domain-3-tint text-success border border-success/40'
                    : 'bg-canvas text-ink/40'
                }`}
              >
                {step > s.num ? '✓' : toFa(s.num)}
              </div>
              <span
                className={`text-meta font-bold hidden md:inline ${
                  step === s.num ? 'text-primary font-black' : 'text-ink/60'
                }`}
              >
                {s.label}
              </span>
              {s.num < 6 && <div className="w-4 sm:w-8 h-[2px] bg-sunken mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Wizard Content Panels */}
      {/* STEP 1: Template & Rules */}
      {step === 1 && (
        <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-title font-black text-ink flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <span>مرحله ۱: دریافت قالب استاندارد و مشخصات فیلدها</span>
            </h2>

            <button
              onClick={handleDownloadTemplate}
              className="min-h-[44px] px-4 py-2 rounded-tile bg-domain-1-tint text-primary hover:bg-primary hover:text-white border border-primary/30 text-meta font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>دانلود فایل نمونه (CSV با UTF-8 BOM)</span>
            </button>
          </div>

          <div className="p-4 rounded-tile bg-paper border border-sunken space-y-2 text-meta">
            <h3 className="font-bold text-ink text-body">ستون‌های الزامی و قواعد ورودی:</h3>
            <ul className="space-y-1.5 text-ink/80 list-disc pr-5 leading-relaxed">
              <li>
                <strong>نام و نام خانوادگی:</strong> نام کامل همکار به زبان فارسی.
              </li>
              <li>
                <strong>شماره موبایل:</strong> با ارقام فارسی یا انگلیسی، با یا بدون پیش‌شماره کشور (سامانه به‌صورت
                خودکار شماره‌ها را به فرمت استاندار ۰۹۱۲۳۴۵۶۷۸۹ نرمال‌سازی می‌کند).
              </li>
              <li>
                <strong>کد پرسنلی:</strong> کد یکتای سازمانی کارمند.
              </li>
              <li>
                <strong>معاونت و واحد:</strong> موقعیت پرسنل در ساختار سازمانی. در صورت عدم وجود واحد، امکان ساخت
                خودکار گره‌ها وجود دارد.
              </li>
              <li>
                <strong>رده سازمانی:</strong> یکی از مقادیر «اپراتور»، «کارشناس»، «سرپرست»، «مدیر میانی»، «مدیر ارشد».
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-sunken">
            <button
              onClick={handleLoadDemoFile}
              className="min-h-[44px] px-4 py-2 rounded-tile bg-canvas hover:bg-sunken border border-sunken text-ink text-meta font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-coin" />
              <span>آزمایش سریع با داده‌های نمونه تستی</span>
            </button>

            <button
              onClick={() => setStep(2)}
              className="min-h-[48px] px-6 py-2 rounded-tile bg-primary hover:bg-primary-hover text-white text-meta font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <span>مرحله بعد: انتخاب فایل</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: File Upload */}
      {step === 2 && (
        <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-6">
          <h2 className="text-title font-black text-ink flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            <span>مرحله ۲: بارگذاری فایل CSV یا اکسل</span>
          </h2>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-10 border-2 border-dashed border-primary/40 hover:border-primary rounded-sheet bg-canvas hover:bg-primary/5 transition-all text-center cursor-pointer space-y-3"
          >
            <UploadCloud className="w-12 h-12 text-primary mx-auto" />
            <div className="text-body font-black text-ink">
              فایل CSV یا اکسل را اینجا بکشید یا برای انتخاب کلیک کنید
            </div>
            <p className="text-meta text-ink/60">پشتیبانی از حجم تا ۱۰ مگابایت و تا ۲۰،۰۰۰ ردیف</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-sunken">
            <button
              onClick={() => setStep(1)}
              className="min-h-[44px] px-4 py-2 rounded-tile bg-surface hover:bg-canvas border border-sunken text-ink text-meta font-bold cursor-pointer"
            >
              مرحله قبل
            </button>

            <button
              onClick={handleLoadDemoFile}
              className="min-h-[44px] px-4 py-2 rounded-tile bg-domain-1-tint hover:bg-primary hover:text-white text-primary text-meta font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>استفاده از فایل آزمایشی آماده (Demo)</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Column Mapping */}
      {step === 3 && (
        <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-title font-black text-ink">مرحله ۳: تطبیق ستون‌ها (Column Mapping)</h2>
            <span className="text-meta text-ink/70 font-mono">
              فایل: <strong>{fileName}</strong> ({toFa(parsedRows.length)} ردیف)
            </span>
          </div>

          <p className="text-meta text-ink/80">
            سرستون‌های فایل شما به‌طور خودکار شناسایی شده است. در صورت نیاز می‌توانید ستون‌های مرتبط را تغییر دهید:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(columnMapping).map((key) => (
              <div key={key} className="p-3.5 rounded-tile bg-canvas border border-sunken space-y-1">
                <span className="text-meta text-ink/60 block font-bold">فیلد سامانه:</span>
                <div className="text-body font-black text-ink">{columnMapping[key]}</div>
                <span className="text-meta text-success font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> شناسایی خودکار از هدر فایل
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-sunken">
            <button
              onClick={() => setStep(2)}
              className="min-h-[44px] px-4 py-2 rounded-tile bg-surface hover:bg-canvas border border-sunken text-ink text-meta font-bold cursor-pointer"
            >
              مرحله قبل
            </button>

            <button
              onClick={runValidation}
              className="min-h-[48px] px-6 py-2 rounded-tile bg-primary hover:bg-primary-hover text-white text-meta font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <span>مرحله بعد: اعتبارسنجی داده‌ها</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Validation Report */}
      {step === 4 && validationResult && (
        <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-title font-black text-ink">مرحله ۴: گزارش اعتبارسنجی داده‌ها</h2>
              <p className="text-meta text-ink/70">بررسی ساختار شماره‌ها، کدهای پرسنلی تکراری و رده‌های سازمانی</p>
            </div>

            {validationResult.errors.length > 0 && (
              <button
                onClick={handleDownloadErrorReport}
                className="min-h-[44px] px-4 py-2 rounded-tile bg-canvas hover:bg-sunken border border-sunken text-danger text-meta font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود گزارش خطاها (CSV)</span>
              </button>
            )}
          </div>

          {/* Validation Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-tile bg-domain-3-tint/40 border border-success/30">
              <span className="text-meta text-success font-bold block">ردیف‌های معتبر:</span>
              <div className="text-display font-black text-success">
                {toFa(validationResult.validRows.length)}
              </div>
            </div>

            <div className="p-4 rounded-tile bg-domain-2-tint/40 border border-danger/30">
              <span className="text-meta text-danger font-bold block">تعداد خطاها:</span>
              <div className="text-display font-black text-danger">
                {toFa(validationResult.errors.length)}
              </div>
            </div>

            <div className="p-4 rounded-tile bg-canvas border border-sunken">
              <span className="text-meta text-ink/70 font-bold block">واحدهای جدید (ساخت خودکار):</span>
              <div className="text-display font-black text-primary">
                {toFa(validationResult.autoNodesToCreate.length)}
              </div>
            </div>
          </div>

          {/* Unknown units auto create notice */}
          {validationResult.autoNodesToCreate.length > 0 && (
            <div className="p-3.5 rounded-tile bg-domain-1-tint/50 border border-primary/30 flex items-start gap-2.5 text-meta">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>ساخت خودکار گره‌های درختی جدید:</strong> واحدهای سازمانی روبرو در سامانه یافت نشدند و در صورت
                تأیید به‌طور خودکار به ساختار اضافه خواهند شد:{' '}
                <span className="font-bold text-primary">
                  {validationResult.autoNodesToCreate.join('، ')}
                </span>
              </div>
            </div>
          )}

          {/* Errors Table */}
          {validationResult.errors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-body text-ink">فهرست خطاهای کشف‌شده:</h3>
                <label className="flex items-center gap-2 text-meta text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyErrors}
                    onChange={(e) => setShowOnlyErrors(e.target.checked)}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span>فقط ردیف‌های خطا دار نمایش داده شود</span>
                </label>
              </div>

              <div className="overflow-x-auto rounded-tile border border-sunken max-h-60 overflow-y-auto">
                <table className="w-full text-right text-meta">
                  <thead className="bg-canvas border-b border-sunken text-ink/70 sticky top-0">
                    <tr>
                      <th className="p-2.5">ردیف</th>
                      <th className="p-2.5">ستون</th>
                      <th className="p-2.5">شرح خطا</th>
                      <th className="p-2.5">راهنمای رفع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sunken">
                    {validationResult.errors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-canvas">
                        <td className="p-2.5 font-mono font-bold text-ink">{toFa(err.row)}</td>
                        <td className="p-2.5 font-bold text-danger">{err.column}</td>
                        <td className="p-2.5 text-ink">{err.message}</td>
                        <td className="p-2.5 text-ink/60">{err.hint || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-sunken">
            <button
              onClick={() => setStep(3)}
              className="min-h-[44px] px-4 py-2 rounded-tile bg-surface hover:bg-canvas border border-sunken text-ink text-meta font-bold cursor-pointer"
            >
              مرحله قبل
            </button>

            <button
              onClick={proceedToOptions}
              disabled={validationResult.validRows.length === 0}
              className="min-h-[48px] px-6 py-2 rounded-tile bg-primary hover:bg-primary-hover text-white text-meta font-black flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <span>مرحله بعد: تنظیمات سهمیه و اشتراک</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Options & Seat Limit Check */}
      {step === 5 && validationResult && (
        <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-6">
          <h2 className="text-title font-black text-ink">مرحله ۵: تنظیمات اشتراک و تخصیص سهمیه‌ها</h2>

          {/* Seat Limit Warning / Blocker */}
          {seatExceeded && (
            <div className="p-4 rounded-tile bg-domain-2-tint border border-danger/40 text-danger text-meta space-y-2">
              <div className="flex items-center gap-2 font-black text-body">
                <XCircle className="w-5 h-5" />
                <span>خطای محدودیت سهمیه سازمانی (Seat Limit Exceeded)</span>
              </div>
              <p className="leading-relaxed">
                تعداد سهمیه‌های مورد نیاز برای این بارگذاری (
                <strong>{toFa(validationResult.validRows.length)} سهمیه</strong>) بیشتر از سهمیه‌های آزاد و تخصیص‌نیافته
                سازمان (<strong>{toFa(unassignedSeats)} سهمیه خالی</strong>) است.
              </p>
              <p className="font-bold">
                لطفاً ابتدا از بخش «اشتراک‌ها» اقدام به خرید یا درخواست سهمیه جدید نمایید یا تیک تخصیص اشتراک سازمانی
                را برای این گروه موقتاً غیرفعال کنید.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* Sponsorship Toggle */}
            <div className="p-4 rounded-tile bg-canvas border border-sunken space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <strong className="text-body text-ink block">تخصیص اشتراک سازمانی (اسپانسرشیپ)</strong>
                  <span className="text-meta text-ink/70">
                    پرسنل پس از ورود، بدون نیاز به پرداخت به تمام محتواها دسترسی کامل خواهند داشت.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enableSponsorship}
                  onChange={(e) => {
                    setEnableSponsorship(e.target.checked);
                    if (!e.target.checked) setSeatExceeded(false);
                    else setSeatExceeded(validationResult.validRows.length > unassignedSeats);
                  }}
                  className="w-5 h-5 rounded text-primary"
                />
              </label>

              {enableSponsorship && (
                <div className="pt-2 border-t border-sunken flex items-center gap-4">
                  <span className="text-meta font-bold text-ink">مدت اعتبار اشتراک:</span>
                  <select
                    value={sponsorshipMonths}
                    onChange={(e) => setSponsorshipMonths(Number(e.target.value))}
                    className="min-h-[40px] px-3 py-1 rounded-tile bg-surface border border-sunken text-meta font-bold text-ink"
                  >
                    <option value={3}>۳ ماهه</option>
                    <option value={6}>۶ ماهه (پیش‌فرض)</option>
                    <option value={12}>۱۲ ماهه (یک‌ساله)</option>
                  </select>
                </div>
              )}
            </div>

            {/* SMS invite toggle */}
            <div className="p-4 rounded-tile bg-canvas border border-sunken">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <strong className="text-body text-ink block">ارسال پیامک دعوت به ورود</strong>
                  <span className="text-meta text-ink/70">
                    پیامک خوش‌آمدگویی و لینک ورود به اپلیکیشن به شماره موبایل پرسنل ارسال می‌گردد.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={sendInviteSms}
                  onChange={(e) => setSendInviteSms(e.target.checked)}
                  className="w-5 h-5 rounded text-primary"
                />
              </label>
            </div>

            {/* Auto-create nodes toggle */}
            <div className="p-4 rounded-tile bg-canvas border border-sunken">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <strong className="text-body text-ink block">ساخت خودکار ساختارهای ناشناخته</strong>
                  <span className="text-meta text-ink/70">
                    واحدهایی که در درخت سازمان وجود ندارند به‌طور اتوماتیک ایجاد شوند.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoCreateNodes}
                  onChange={(e) => setAutoCreateNodes(e.target.checked)}
                  className="w-5 h-5 rounded text-primary"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-sunken">
            <button
              onClick={() => setStep(4)}
              className="min-h-[44px] px-4 py-2 rounded-tile bg-surface hover:bg-canvas border border-sunken text-ink text-meta font-bold cursor-pointer"
            >
              مرحله قبل
            </button>

            <button
              disabled={seatExceeded}
              onClick={startImport}
              className="min-h-[48px] px-6 py-2 rounded-tile bg-primary hover:bg-primary-hover text-white text-meta font-black flex items-center gap-2 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <span>تأیید نهایی و اجرای بارگذاری</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Execution Progress & Final Summary */}
      {step === 6 && (
        <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-6">
          <h2 className="text-title font-black text-ink">
            {importDone ? 'عملیات بارگذاری با موفقیت تکمیل شد' : 'در حال پردازش و ثبت کارکنان...'}
          </h2>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-meta font-mono font-bold">
              <span>پیشرفت پردازش بسته‌های داده:</span>
              <span className="text-primary">{toFa(progressPct)}٪</span>
            </div>
            <div className="w-full h-3 rounded-full bg-sunken overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {importing && !cancelled && (
            <div className="flex items-center justify-between">
              <span className="text-meta text-ink/70">لطفاً تا پایان عملیات مرورگر را نبندید...</span>
              <button
                onClick={() => {
                  setCancelled(true);
                  setImporting(false);
                }}
                className="min-h-[40px] px-4 rounded-tile bg-canvas hover:bg-sunken border border-sunken text-danger text-meta font-bold"
              >
                توقف و انصراف
              </button>
            </div>
          )}

          {/* Completion Summary */}
          {importDone && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-tile bg-domain-3-tint/30 border border-success/30 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-body font-black text-ink">
                    تعداد {toFa(importResultSummary.added)} نفر با موفقیت به سازمان افزوده شدند.
                  </div>
                  <p className="text-meta text-ink/80 leading-relaxed">
                    پرسنل جدید با وضعیت «دعوت‌شده» ثبت شدند و پس از اولین ورود به اپلیکیشن، وضعیت آن‌ها به «فعال» تغییر
                    می‌یابد.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setStep(1);
                    setFile(null);
                    setParsedRows([]);
                    setValidationResult(null);
                    setImportDone(false);
                  }}
                  className="min-h-[44px] px-5 rounded-tile bg-primary hover:bg-primary-hover text-white text-meta font-bold cursor-pointer"
                >
                  بارگذاری فایل دیگر
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import History Table */}
      <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
        <h3 className="text-title font-black text-ink flex items-center gap-2">
          <Clock className="w-5 h-5 text-ink/60" />
          <span>تاریخچه بارگذاری‌های قبلی سازمان</span>
        </h3>

        <div className="overflow-x-auto rounded-tile border border-sunken">
          <table className="w-full text-right text-meta">
            <thead className="bg-canvas border-b border-sunken text-ink/70">
              <tr>
                <th className="p-3">نام فایل</th>
                <th className="p-3">تعداد ردیف</th>
                <th className="p-3">افزوده شده</th>
                <th className="p-3">خطاها</th>
                <th className="p-3">اشتراک</th>
                <th className="p-3">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sunken">
              {history.map((job) => (
                <tr key={job.id} className="hover:bg-canvas">
                  <td className="p-3 font-bold text-ink">{job.fileName}</td>
                  <td className="p-3 font-mono">{toFa(job.rowCount)}</td>
                  <td className="p-3 font-mono text-success font-bold">{toFa(job.result?.added ?? 0)}</td>
                  <td className="p-3 font-mono text-danger">{toFa(job.errorRows)}</td>
                  <td className="p-3">
                    {job.options.sponsorship ? `${toFa(job.options.sponsorship.months)} ماهه` : 'بدون اشتراک'}
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-pill bg-domain-3-tint text-success font-bold text-meta">
                      موفق
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <OrgDemoPanel />
    </div>
  );
};
