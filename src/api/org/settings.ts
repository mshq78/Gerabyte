import { OrgUnit, OrgReminderPolicy } from '../../types/org';
import { MOCK_ORG_UNITS } from '../../mock/org/data';

const STORAGE_KEY_UNITS = 'gerabyte_org_units_v2';
const STORAGE_KEY_SETTINGS = 'gerabyte_org_settings_v2';
const STORAGE_KEY_REMINDER_POLICY = 'gerabyte_org_reminder_policy_v1';

export interface OrgProfileSettings {
  name: string;
  initialsMark: string;
  industry: string;
  workforceCount: number;
}

const DEFAULT_PROFILE: OrgProfileSettings = {
  name: 'مجتمع فولاد نمونه',
  initialsMark: 'ف‌ن',
  industry: 'صنایع فلزی و متالورژی',
  workforceCount: 5000,
};

const DEFAULT_REMINDER_POLICY: OrgReminderPolicy = {
  maxRemindersPerDay: 2,
  quietHoursStart: '۲۲:۰۰',
  quietHoursEnd: '۰۷:۰۰',
  autoNudgeInactiveDays: 3,
};

function getStoredUnits(): OrgUnit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNITS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return MOCK_ORG_UNITS;
}

function saveStoredUnits(units: OrgUnit[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(units));
  } catch {
    // fallback
  }
}

export const orgSettingsApi = {
  // TODO(backend): GET /api/v1/org/settings/profile
  async getProfile(): Promise<OrgProfileSettings> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return DEFAULT_PROFILE;
  },

  // TODO(backend): PUT /api/v1/org/settings/profile
  async updateProfile(updates: Partial<OrgProfileSettings>): Promise<OrgProfileSettings> {
    const current = await this.getProfile();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    return updated;
  },

  // TODO(backend): GET /api/v1/org/settings/units
  async getUnits(): Promise<OrgUnit[]> {
    return getStoredUnits();
  },

  // TODO(backend): POST /api/v1/org/settings/units
  async addUnit(name: string, parentId: string | null): Promise<OrgUnit> {
    const units = getStoredUnits();
    const parent = parentId ? units.find((u) => u.id === parentId) : null;
    const newUnit: OrgUnit = {
      id: `u-${Date.now()}`,
      name,
      code: `FN-${Math.floor(100 + Math.random() * 900)}`,
      parentId,
      memberCount: 0,
      managerName: 'تعیین نشده',
      managerId: '',
      level: parent ? parent.level + 1 : 1,
    };
    units.push(newUnit);
    saveStoredUnits(units);
    return newUnit;
  },

  // TODO(backend): PUT /api/v1/org/settings/units/:id/rename
  async renameUnit(id: string, name: string): Promise<OrgUnit> {
    const units = getStoredUnits();
    const unit = units.find((u) => u.id === id);
    if (!unit) throw new Error('واحد سازمانی یافت نشد.');
    unit.name = name;
    saveStoredUnits(units);
    return unit;
  },

  // TODO(backend): PUT /api/v1/org/settings/units/:id/move
  async moveUnit(id: string, newParentId: string | null): Promise<OrgUnit> {
    const units = getStoredUnits();
    const unit = units.find((u) => u.id === id);
    if (!unit) throw new Error('واحد سازمانی یافت نشد.');

    // Cycle check: verify newParentId is not a descendant of id
    if (newParentId === id) {
      throw new Error('یک واحد نمی‌تواند زیرمجموعه خود باشد.');
    }
    let cur = newParentId ? units.find((u) => u.id === newParentId) : null;
    while (cur) {
      if (cur.id === id) {
        throw new Error('انتقال نامعتبر است؛ ایجاد حلقه (چرخه سلسله‌مراتبی) ممکن نیست.');
      }
      cur = cur.parentId ? units.find((u) => u.id === cur!.parentId) : null;
    }

    unit.parentId = newParentId;
    const parent = newParentId ? units.find((u) => u.id === newParentId) : null;
    unit.level = parent ? parent.level + 1 : 0;
    saveStoredUnits(units);
    return unit;
  },

  // TODO(backend): DELETE /api/v1/org/settings/units/:id
  async deleteUnit(id: string): Promise<{ success: boolean; message?: string }> {
    const units = getStoredUnits();
    const unit = units.find((u) => u.id === id);
    if (!unit) throw new Error('واحد یافت نشد.');

    if (unit.memberCount > 0) {
      throw new Error(
        `حذف این واحد ممکن نیست، زیرا ${unit.memberCount} نفر از کارکنان عضو آن هستند. لطفاً ابتدا افراد را جابجا کنید.`
      );
    }

    const hasChildren = units.some((u) => u.parentId === id);
    if (hasChildren) {
      throw new Error('این واحد دارای زیرشاخه‌های فعال است و نمی‌تواند حذف شود.');
    }

    const filtered = units.filter((u) => u.id !== id);
    saveStoredUnits(filtered);
    return { success: true };
  },

  // TODO(backend): PUT /api/v1/org/settings/units/:id/manager
  async assignManager(unitId: string, managerId: string, managerName: string): Promise<OrgUnit> {
    const units = getStoredUnits();
    const unit = units.find((u) => u.id === unitId);
    if (!unit) throw new Error('واحد سازمانی یافت نشد.');
    unit.managerId = managerId;
    unit.managerName = managerName;
    saveStoredUnits(units);
    return unit;
  },

  // TODO(backend): GET /api/v1/org/settings/reminder-policy
  async getReminderPolicy(): Promise<OrgReminderPolicy> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REMINDER_POLICY);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return DEFAULT_REMINDER_POLICY;
  },

  // TODO(backend): PUT /api/v1/org/settings/reminder-policy
  async updateReminderPolicy(policy: Partial<OrgReminderPolicy>): Promise<OrgReminderPolicy> {
    const current = await this.getReminderPolicy();
    const updated = { ...current, ...policy };
    localStorage.setItem(STORAGE_KEY_REMINDER_POLICY, JSON.stringify(updated));
    return updated;
  },
};
