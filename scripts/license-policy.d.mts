export type LicensePolicyEvaluation =
  | Readonly<{ allowed: true; identifiers: readonly string[]; reason: 'allowlisted' }>
  | Readonly<{ allowed: false; identifiers: readonly string[]; reason: string }>;

export const ALLOWED_LICENSE_IDS: readonly string[];
export function evaluateLicense(rawLicense: unknown): LicensePolicyEvaluation;
