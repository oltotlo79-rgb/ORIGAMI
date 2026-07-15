import { describe, expect, it } from 'vitest';

import { ALLOWED_LICENSE_IDS, evaluateLicense } from '../../scripts/license-policy.mjs';

describe('dependency license policy', () => {
  it.each(ALLOWED_LICENSE_IDS)('allows %s', (license) => {
    expect(evaluateLicense(license)).toMatchObject({ allowed: true });
  });

  it('allows expressions composed only of allowlisted identifiers', () => {
    expect(evaluateLicense('(MIT OR Apache-2.0)')).toMatchObject({ allowed: true });
  });

  it.each(['GPL-2.0-only', 'GPL-3.0-or-later', 'AGPL-3.0-only', 'LGPL-2.1-only'])(
    'rejects copyleft license %s',
    (license) => {
      expect(evaluateLicense(license)).toMatchObject({
        allowed: false,
        reason: 'forbidden-copyleft-license',
      });
    },
  );

  it.each([undefined, '', 'UNKNOWN', 'SEE LICENSE IN LICENSE.txt', 'BlueOak-1.0.0'])(
    'rejects unknown or non-allowlisted license %s',
    (license) => {
      expect(evaluateLicense(license).allowed).toBe(false);
    },
  );

  it('rejects an expression when even one branch is not allowlisted', () => {
    expect(evaluateLicense('MIT OR GPL-3.0-only')).toMatchObject({
      allowed: false,
      reason: 'forbidden-copyleft-license',
    });
  });

  it('uses a closed reason code and separate rejected identifier list', () => {
    expect(evaluateLicense('MIT OR BlueOak-1.0.0')).toEqual({
      allowed: false,
      identifiers: ['MIT', 'BlueOak-1.0.0'],
      rejectedIdentifiers: ['BlueOak-1.0.0'],
      reasonCode: 'license-not-allowlisted',
      reason: 'license-not-allowlisted',
    });
  });

  it.each(['MIT OR () ISC', 'MIT Apache-2.0', '(MIT OR ISC', 'MIT OR', '()'])(
    'rejects malformed SPDX expression %s',
    (license) => {
      expect(evaluateLicense(license)).toMatchObject({
        allowed: false,
        reason: 'invalid-spdx-expression',
      });
    },
  );
});
