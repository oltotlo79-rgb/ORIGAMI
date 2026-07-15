import { bench, describe } from 'vitest';

import { stableStringify } from '../../m0f/stable-json.js';

const harnessRecord = {
  recordType: 'm0f-benchmark',
  scientificClaim: false,
  fixtureId: '_harness-smoke',
  measurements: { serializationOnly: true },
};

describe('M0F harness plumbing (non-scientific)', () => {
  bench('deterministic JSON serialization', () => {
    stableStringify(harnessRecord);
  });
});
