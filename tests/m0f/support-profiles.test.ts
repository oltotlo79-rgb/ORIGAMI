import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import {
  SUPPORT_CONSTRAINT_SCHEMA_IDS,
  SUPPORT_PROFILE_CANDIDATE_CATALOG_ID,
  SUPPORT_PROFILE_CANDIDATES_SCHEMA_ID,
  parseSupportProfileCandidatesV1,
  type SupportProfileCandidate,
} from '../../m0f/profiles/support-profiles.js';

async function candidateDocument(): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(resolve('m0f/profiles/support-profile-v1.candidates.json'), 'utf8'),
  ) as Record<string, unknown>;
}

function expectIssue(raw: unknown, code: string): void {
  const result = parseSupportProfileCandidatesV1(raw);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`expected support-profile candidate issue ${code}`);
  expect(result.error.some((entry) => entry.code === code)).toBe(true);
}

function workflow(profile: SupportProfileCandidate): string {
  if (profile.kind === 'fold-verification') return profile.kind;
  return `${profile.kind}:${profile.method}`;
}

function profilesOf(raw: Record<string, unknown>): Record<string, unknown>[] {
  if (!Array.isArray(raw.profiles)) throw new Error('profiles fixture must be an array');
  for (const profile of raw.profiles) {
    if (typeof profile !== 'object' || profile === null || Array.isArray(profile)) {
      throw new Error('profile fixture must be an object');
    }
  }
  return raw.profiles as Record<string, unknown>[];
}

function profileAt(raw: Record<string, unknown>, index: number): Record<string, unknown> {
  const profile = profilesOf(raw)[index];
  if (profile === undefined) throw new Error(`profile fixture ${index} is missing`);
  return profile;
}

function constraintsOf(
  raw: Record<string, unknown>,
  profileIndex: number,
): Record<string, unknown> {
  const constraints = profileAt(raw, profileIndex).constraints;
  if (typeof constraints !== 'object' || constraints === null || Array.isArray(constraints)) {
    throw new Error(`profile fixture ${profileIndex} constraints are missing`);
  }
  return constraints as Record<string, unknown>;
}

function selectionOf(
  raw: Record<string, unknown>,
  profileIndex: number,
  key: string,
): Record<string, unknown> {
  const selection = constraintsOf(raw, profileIndex)[key];
  if (typeof selection !== 'object' || selection === null || Array.isArray(selection)) {
    throw new Error(`profile fixture ${profileIndex} selection ${key} is missing`);
  }
  return selection as Record<string, unknown>;
}

describe('M0F support-profile candidate boundaries', () => {
  it('keeps tree, box-pleating, and FOLD verification as three discriminated workflows', async () => {
    const result = parseSupportProfileCandidatesV1(await candidateDocument());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('candidate catalog must parse');

    expect(result.value.schemaId).toBe(SUPPORT_PROFILE_CANDIDATES_SCHEMA_ID);
    expect(result.value.catalogId).toBe(SUPPORT_PROFILE_CANDIDATE_CATALOG_ID);
    expect(result.value.status).toBe('candidate');
    expect(result.value.profiles.map(workflow)).toEqual([
      'design-generation:treeMethod',
      'design-generation:boxPleating',
      'fold-verification',
    ]);
    expect(result.value.profiles.map((profile) => profile.constraintsSchemaId)).toEqual([
      SUPPORT_CONSTRAINT_SCHEMA_IDS.treeMethod,
      SUPPORT_CONSTRAINT_SCHEMA_IDS.boxPleating,
      SUPPORT_CONSTRAINT_SCHEMA_IDS.foldVerification,
    ]);
  });

  it('makes no profile hash, selected-boundary, evidence, or product-support claim', async () => {
    const result = parseSupportProfileCandidatesV1(await candidateDocument());
    if (!result.ok) throw new Error('candidate catalog must parse');

    for (const profile of result.value.profiles) {
      expect(profile.profileHash).toBeNull();
      expect(profile.evidence).toEqual({ status: 'pending', ref: null });
      const selections = Object.values(profile.constraints) as {
        readonly selected: null;
        readonly candidates: readonly unknown[];
      }[];
      for (const selection of selections) {
        expect(selection.selected).toBeNull();
        expect(selection.candidates.length).toBeGreaterThan(0);
      }
    }
  });

  it('returns an owned deeply frozen candidate catalog', async () => {
    const raw = await candidateDocument();
    const result = parseSupportProfileCandidatesV1(raw);
    if (!result.ok) throw new Error('candidate catalog must parse');

    raw.status = 'frozen';
    profileAt(raw, 0).profileHash = `sha256:${'0'.repeat(64)}`;
    selectionOf(raw, 0, 'leafCountMaximum').selected = 20;

    const firstProfile = result.value.profiles[0];
    expect(result.value.status).toBe('candidate');
    expect(firstProfile.profileHash).toBeNull();
    expect(firstProfile.constraints.leafCountMaximum.selected).toBeNull();
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(firstProfile.constraints.leafCountMaximum)).toBe(true);
    expect(() => {
      (result.value as unknown as { status: string }).status = 'frozen';
    }).toThrow(TypeError);
  });

  it('validates one getter-consistent candidate snapshot', async () => {
    const raw = await candidateDocument();
    let reads = 0;
    Object.defineProperty(raw, 'status', {
      configurable: true,
      enumerable: true,
      get: () => {
        reads += 1;
        return reads === 1 ? 'candidate' : 'frozen';
      },
    });
    const result = parseSupportProfileCandidatesV1(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('snapshot must parse');
    expect(result.value.status).toBe('candidate');
    expect(reads).toBe(1);
  });

  it('records workflow-specific boundary dimensions instead of a generic constraints bag', async () => {
    const result = parseSupportProfileCandidatesV1(await candidateDocument());
    if (!result.ok) throw new Error('candidate catalog must parse');
    const [tree, box, fold] = result.value.profiles;

    expect(tree.constraints).toHaveProperty('packingCondition');
    expect(tree.constraints).toHaveProperty('moleculeFamily');
    expect(tree.constraints).not.toHaveProperty('maxGridColumns');
    expect(box.constraints).toHaveProperty('maxGridColumns');
    expect(box.constraints).toHaveProperty('junctionGadgetFamily');
    expect(box.constraints).not.toHaveProperty('packingCondition');
    expect(fold.constraints).toHaveProperty('assignmentPolicy');
    expect(fold.constraints).toHaveProperty('facesPolicy');
    expect(fold.constraints).toHaveProperty('treeDependencyPolicy');
    expect(fold.constraints).not.toHaveProperty('leafCountMaximum');
  });

  it('retains the required inclusive one-percent box-grid quantization boundary candidate', async () => {
    const result = parseSupportProfileCandidatesV1(await candidateDocument());
    if (!result.ok) throw new Error('candidate catalog must parse');
    const box = result.value.profiles[1];
    expect(box.kind).toBe('design-generation');
    expect(box.method).toBe('boxPleating');
    expect(box.constraints.maxNormalizedQuantizationError).toEqual({
      candidates: [1e-8, 0.000001, 0.0001, 0.01],
      selected: null,
    });
  });

  it('rejects any attempt to freeze, select, hash, or attach evidence to candidates', async () => {
    const frozen = await candidateDocument();
    frozen.status = 'frozen';
    expectIssue(frozen, 'premature-frozen-profile');

    const hashed = await candidateDocument();
    profileAt(hashed, 0).profileHash = `sha256:${'0'.repeat(64)}`;
    expectIssue(hashed, 'premature-profile-hash');

    const selected = await candidateDocument();
    selectionOf(selected, 1, 'maxGridColumns').selected = 64;
    expectIssue(selected, 'premature-selection');

    const evidenced = await candidateDocument();
    profileAt(evidenced, 2).evidence = {
      status: 'measured',
      ref: 'benchmark/fold-profile.json',
    };
    expectIssue(evidenced, 'premature-evidence');
  });

  it('rejects workflow mixing, unknown constraints, and invalid candidate sequences', async () => {
    const mixed = await candidateDocument();
    profileAt(mixed, 0).method = 'boxPleating';
    expectIssue(mixed, 'profile-method-mismatch');

    const unknown = await candidateDocument();
    constraintsOf(unknown, 0).solverSucceeded = { candidates: [true], selected: null };
    expectIssue(unknown, 'unknown-key');

    const unsorted = await candidateDocument();
    selectionOf(unsorted, 0, 'leafCountMaximum').candidates = [20, 8];
    expectIssue(unsorted, 'invalid-candidates');

    const inventedPolicy = await candidateDocument();
    selectionOf(inventedPolicy, 2, 'assignmentPolicy').candidates = ['accept-anything'];
    expectIssue(inventedPolicy, 'invalid-candidates');
  });

  it('rejects incomplete or reordered workflow catalogs', async () => {
    const incomplete = await candidateDocument();
    profilesOf(incomplete).pop();
    expectIssue(incomplete, 'incomplete-profile-catalog');

    const reordered = await candidateDocument();
    profilesOf(reordered).reverse();
    expectIssue(reordered, 'profile-order-mismatch');
  });
});

describe('M0F support-profile candidate JSON Schema contract', () => {
  it('is candidate-only and gives every workflow a closed, distinct constraints schema', async () => {
    const schema = JSON.parse(
      await readFile(resolve('m0f/schemas/support-profile-candidates-v1.schema.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.$id).toBe(SUPPORT_PROFILE_CANDIDATES_SCHEMA_ID);
    expect(schema.additionalProperties).toBe(false);

    const properties = schema.properties as Record<string, Record<string, unknown>>;
    expect(properties.status?.const).toBe('candidate');

    const definitions = schema.$defs as Record<string, Record<string, unknown>>;
    for (const key of [
      'treeMethodConstraints',
      'boxPleatingConstraints',
      'foldVerificationConstraints',
    ]) {
      expect(definitions[key]?.additionalProperties).toBe(false);
      expect(definitions[key]?.required).toBeInstanceOf(Array);
    }
    expect(definitions.numericSelection?.properties).toMatchObject({
      selected: { type: 'null' },
    });
    expect(definitions.pendingEvidence?.properties).toMatchObject({
      status: { const: 'pending' },
      ref: { type: 'null' },
    });

    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    const document = await candidateDocument();
    expect(validate(document), JSON.stringify(validate.errors)).toBe(true);
  });
});
