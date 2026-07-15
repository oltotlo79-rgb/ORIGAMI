import { CANONICAL_FIXTURE_RULES } from '../../m0f/canonical-fixtures.js';
import {
  evaluateM0fProductHandoffDiagnosticV1,
  M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE,
} from '../../m0f/m0f-product-handoff-diagnostic.js';

/**
 * Browser-safe snapshot of the repository-backed CLI input for this build.
 * A unit test keeps this snapshot aligned with the filesystem diagnostic.
 */
export const BUNDLED_M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT = {
  schemaVersion: 1,
  recordType: M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT_RECORD_TYPE,
  contractStatus: 'candidate',
  scientificClaim: false,
  catalog: {
    complete: false,
    errorCount: CANONICAL_FIXTURE_RULES.length,
    missingCanonicalPatterns: CANONICAL_FIXTURE_RULES.map((rule) => rule.pattern),
  },
} as const;

const evaluation = evaluateM0fProductHandoffDiagnosticV1(
  BUNDLED_M0F_PRODUCT_HANDOFF_DIAGNOSTIC_INPUT,
);

if (!evaluation.ok) {
  throw new Error('The bundled M0F product-handoff diagnostic input is invalid.');
}

/** Read-only candidate diagnostic. This is not a product capability or final decision. */
export const bundledM0fProductHandoffDiagnostic = evaluation.value;
