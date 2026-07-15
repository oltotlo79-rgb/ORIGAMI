import type { LicensePolicyEvaluation } from './license-policy.mjs';

export type DependencyLicenseInventoryEntry = Readonly<{
  name: string;
  version: string;
  location: string;
  license: string | null;
}> &
  LicensePolicyEvaluation;

export function collectDependencyLicenses(
  lockPath: string,
): Promise<readonly DependencyLicenseInventoryEntry[]>;
