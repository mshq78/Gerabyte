/**
 * Mock API Client
 * Simulates network latency (300-700ms) and optional error simulation for testing.
 * Components NEVER import mock data directly; all communication flows through typed API functions.
 */

let errorSimulationEnabled = false;

export function setErrorSimulation(enabled: boolean) {
  errorSimulationEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('gerabyte:error_sim', enabled ? '1' : '0');
  }
}

export function isErrorSimulationEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('gerabyte:error_sim');
    if (saved !== null) return saved === '1';
  }
  return errorSimulationEnabled;
}

export async function mockRequest<T>(
  dataFetcher: () => T | Promise<T>,
  options?: { minDelay?: number; maxDelay?: number; endpoint?: string }
): Promise<T> {
  const min = options?.minDelay ?? 300;
  const max = options?.maxDelay ?? 600;
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;

  await new Promise((resolve) => setTimeout(resolve, delay));

  if (isErrorSimulationEnabled()) {
    throw new Error(
      `خطای شبیه‌سازی‌شده شبکه (۵۰۳): عدم دسترسی به سرور در نقطه ${options?.endpoint || 'API'}`
    );
  }

  return await dataFetcher();
}
