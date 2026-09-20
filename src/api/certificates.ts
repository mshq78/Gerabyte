import { mockRequest } from './client';
import { Certificate } from '../types/domain';
import { MOCK_CERTIFICATES } from '../mock/data';

const STORAGE_CERTS_KEY = 'gerabyte:certs';

function getStoredCerts(): Certificate[] {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_CERTS_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
  }
  return MOCK_CERTIFICATES;
}

function saveCerts(certs: Certificate[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_CERTS_KEY, JSON.stringify(certs));
  }
}

export const certificatesApi = {
  // TODO(backend): GET /api/v1/certificates
  async list(): Promise<Certificate[]> {
    return mockRequest(() => getStoredCerts(), { endpoint: '/api/v1/certificates' });
  },

  async getBySerial(serial: string): Promise<Certificate | null> {
    const certs = getStoredCerts();
    const found = certs.find((c) => c.serial === serial);
    return found || null;
  },

  // TODO(backend): GET /api/v1/certificates/verify/:serial
  async verify(
    serial: string
  ): Promise<{ valid: boolean; certificate?: Certificate; maskedHolder?: string }> {
    return mockRequest(
      () => {
        const certs = getStoredCerts();
        const normalized = serial
          .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
          .toLowerCase();

        const found = certs.find((c) => {
          const cNorm = c.serial
            .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
            .toLowerCase();
          return cNorm === normalized || c.serial === serial;
        });

        if (!found) {
          return { valid: false };
        }

        // Mask holder name e.g. ع*** ر*****
        const parts = found.holderName.split(' ');
        const masked = parts.map((p) => (p.length > 1 ? p[0] + '***' : p)).join(' ');

        return {
          valid: true,
          certificate: found,
          maskedHolder: masked,
        };
      },
      { endpoint: `/api/v1/certificates/verify/${serial}` }
    );
  },

  // Internal issuance helper
  async issueCertificate(payload: {
    title: string;
    domainTitle: string;
    scorePct: number;
    holderName: string;
    examId: string;
  }): Promise<Certificate> {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const serial = `GB-۱۴۰۵-${randomDigits}`;
    const newCert: Certificate = {
      serial,
      title: payload.title,
      domainTitle: payload.domainTitle,
      issuedAt: new Date().toISOString(),
      scorePct: payload.scorePct,
      holderName: payload.holderName,
      verifyPath: `/verify/${serial}`,
      examId: payload.examId,
    };

    const current = getStoredCerts();
    saveCerts([newCert, ...current]);
    return newCert;
  },
};
