export const HARNESS_SMOKE_FIXTURE_ID = '_harness-smoke' as const;

export const FIXTURE_COVERAGE_TAGS = [
  'harness:manifest-runtime',
  'harness:hashes',
  'harness:jsonl',
  'harness:cli',
  'cp:topology',
  'cp:mountain-valley',
  'generation:tree',
  'generation:box-pleating',
  'generation:internal-width',
  'paper:rectangular',
  'grid:minimum',
  'symmetry:rotation-order',
  'scale:leaf-20',
  'fold:face-reconstruction',
  'target:flat',
  'path:rigid-continuous',
  'collision:ccd',
  'contact:legal-overlap',
  'layer:acyclic-order',
  'support:boundary',
  'no-solution:certificate',
  'rigidity:um-negative',
  'topology:invalid',
  'path:mutation',
  'fold:unsupported',
] as const;
export type FixtureCoverageTag = (typeof FIXTURE_COVERAGE_TAGS)[number];

export type CanonicalFixtureRule = Readonly<{
  pattern: string;
  description: string;
  cardinality: 'exactly-one' | 'one-or-more';
  requiredCoverageTags: readonly FixtureCoverageTag[];
}>;

/** The normative fixture IDs and families from docs/05 section 9. */
export const CANONICAL_FIXTURE_RULES: readonly CanonicalFixtureRule[] = Object.freeze([
  {
    pattern: 'REF-RABBIT-EAR',
    description: 'rabbit ear reference',
    cardinality: 'exactly-one',
    requiredCoverageTags: [
      'cp:topology',
      'cp:mountain-valley',
      'target:flat',
      'path:rigid-continuous',
    ],
  },
  {
    pattern: 'REF-WATERBOMB',
    description: 'waterbomb reference',
    cardinality: 'exactly-one',
    requiredCoverageTags: [
      'cp:topology',
      'cp:mountain-valley',
      'target:flat',
      'path:rigid-continuous',
    ],
  },
  {
    pattern: 'GEN-TM-BIRD-4',
    description: 'tree-method four-leaf bird',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['generation:tree', 'path:rigid-continuous', 'collision:ccd'],
  },
  {
    pattern: 'GEN-BP-BIRD-4',
    description: 'box-pleating four-leaf bird',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['generation:box-pleating', 'path:rigid-continuous', 'collision:ccd'],
  },
  {
    pattern: 'GEN-TM-INSECT-8',
    description: 'tree-method eight-leaf insect',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['generation:tree', 'path:rigid-continuous', 'collision:ccd'],
  },
  {
    pattern: 'GEN-BP-INSECT-8',
    description: 'box-pleating eight-leaf insect',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['generation:box-pleating', 'path:rigid-continuous', 'collision:ccd'],
  },
  {
    pattern: 'GEN-TM-20',
    description: 'tree-method twenty-leaf case',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['generation:tree', 'scale:leaf-20'],
  },
  {
    pattern: 'GEN-BP-20',
    description: 'box-pleating twenty-leaf case',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['generation:box-pleating', 'scale:leaf-20'],
  },
  {
    pattern: 'GEN-TM-WIDTH-INTERNAL',
    description: 'tree-method internal width case',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['generation:tree', 'generation:internal-width'],
  },
  {
    pattern: 'GEN-BP-WIDTH-INTERNAL',
    description: 'box-pleating internal width case',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['generation:box-pleating', 'generation:internal-width'],
  },
  {
    pattern: 'GEN-BP-RECT',
    description: 'rectangular box-pleating case',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['generation:box-pleating', 'paper:rectangular'],
  },
  {
    pattern: 'GEN-BP-GRID-4',
    description: 'minimum supported grid case',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['generation:box-pleating', 'grid:minimum'],
  },
  {
    pattern: 'GEN-SYMMETRY',
    description: 'symmetry and rotation-order case',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['symmetry:rotation-order'],
  },
  {
    pattern: 'REF-CONTACT-STACK',
    description: 'legal contact and layer order',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['contact:legal-overlap', 'layer:acyclic-order'],
  },
  {
    pattern: 'REF-FOLD-NOFACES',
    description: 'FOLD face reconstruction',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['fold:face-reconstruction', 'cp:topology'],
  },
  {
    pattern: 'REF-FOLD-FLAT-VERIFIABLE',
    description: 'flat-verifiable FOLD reference',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['target:flat', 'path:rigid-continuous', 'collision:ccd'],
  },
  {
    pattern: 'NEG-TREE-*',
    description: 'invalid tree family',
    cardinality: 'one-or-more',
    requiredCoverageTags: ['generation:tree', 'topology:invalid'],
  },
  {
    pattern: 'NEG-SUPPORT-BOUNDARY-*',
    description: 'support boundary family',
    cardinality: 'one-or-more',
    requiredCoverageTags: ['support:boundary'],
  },
  {
    pattern: 'NEG-GRID-ERROR-*',
    description: 'grid error family',
    cardinality: 'one-or-more',
    requiredCoverageTags: ['generation:box-pleating', 'support:boundary'],
  },
  {
    pattern: 'NEG-NO-SOLUTION-*',
    description: 'certified no-solution family',
    cardinality: 'one-or-more',
    requiredCoverageTags: ['no-solution:certificate'],
  },
  {
    pattern: 'NEG-UM-RIGID-*',
    description: 'rigid universal-molecule family',
    cardinality: 'one-or-more',
    requiredCoverageTags: ['rigidity:um-negative'],
  },
  {
    pattern: 'NEG-MIDSTEP-CROSS',
    description: 'mid-segment CCD crossing',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['path:rigid-continuous', 'collision:ccd'],
  },
  {
    pattern: 'NEG-ORDER-REVERSAL',
    description: 'layer-order reversal',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['layer:acyclic-order'],
  },
  {
    pattern: 'NEG-LAYER-CYCLE',
    description: 'cyclic layer order',
    cardinality: 'exactly-one',
    requiredCoverageTags: ['layer:acyclic-order'],
  },
  {
    pattern: 'NEG-TOPOLOGY-*',
    description: 'invalid topology family',
    cardinality: 'one-or-more',
    requiredCoverageTags: ['topology:invalid'],
  },
  {
    pattern: 'NEG-PATH-MUTATION-*',
    description: 'path mutation family',
    cardinality: 'one-or-more',
    requiredCoverageTags: ['path:mutation', 'path:rigid-continuous'],
  },
  {
    pattern: 'NEG-FOLD-UNSUPPORTED-*',
    description: 'unsupported FOLD family',
    cardinality: 'one-or-more',
    requiredCoverageTags: ['fold:unsupported'],
  },
]);

export type FixtureIdIssue = Readonly<{
  severity: 'error' | 'warning';
  code: 'duplicate-id' | 'unknown-id' | 'missing-canonical-fixture';
  fixtureId?: string;
  canonicalPattern?: string;
  message: string;
}>;

function matchesRule(fixtureId: string, rule: CanonicalFixtureRule): boolean {
  if (!rule.pattern.endsWith('*')) {
    return fixtureId === rule.pattern;
  }
  const prefix = rule.pattern.slice(0, -1);
  if (!fixtureId.startsWith(prefix)) {
    return false;
  }
  const suffix = fixtureId.slice(prefix.length);
  return /^[A-Z0-9][A-Z0-9-]*$/.test(suffix);
}

export function findCanonicalFixtureRule(fixtureId: string): CanonicalFixtureRule | undefined {
  return CANONICAL_FIXTURE_RULES.find((rule) => matchesRule(fixtureId, rule));
}

export function auditCanonicalFixtureIds(
  fixtureIds: readonly string[],
  completeness: 'harness' | 'm0f',
): readonly FixtureIdIssue[] {
  const issues: FixtureIdIssue[] = [];
  const counts = new Map<string, number>();

  for (const fixtureId of fixtureIds) {
    counts.set(fixtureId, (counts.get(fixtureId) ?? 0) + 1);
    if (
      fixtureId !== HARNESS_SMOKE_FIXTURE_ID &&
      findCanonicalFixtureRule(fixtureId) === undefined
    ) {
      issues.push({
        severity: 'error',
        code: 'unknown-id',
        fixtureId,
        message: `fixture ID is not declared by docs/05 section 9: ${fixtureId}`,
      });
    }
  }

  for (const [fixtureId, count] of counts) {
    if (count > 1) {
      issues.push({
        severity: 'error',
        code: 'duplicate-id',
        fixtureId,
        message: `fixture ID appears ${count} times: ${fixtureId}`,
      });
    }
  }

  for (const rule of CANONICAL_FIXTURE_RULES) {
    if (!fixtureIds.some((fixtureId) => matchesRule(fixtureId, rule))) {
      issues.push({
        severity: completeness === 'm0f' ? 'error' : 'warning',
        code: 'missing-canonical-fixture',
        canonicalPattern: rule.pattern,
        message: `canonical fixture is not populated yet: ${rule.pattern}`,
      });
    }
  }

  return issues;
}
