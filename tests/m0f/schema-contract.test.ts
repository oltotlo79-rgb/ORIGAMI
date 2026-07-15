import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import { ARTIFACT_CONTRACT_SCHEMA_ID } from '../../m0f/artifacts/contract.js';
import {
  CANONICALIZATION_VERSION,
  M0F_CONVENTIONS_ID,
  REFERENCE_MODEL_SCHEMA_ID,
} from '../../m0f/model/reference-model.js';
import { RUNTIME_LIMITS_SCHEMA_ID } from '../../m0f/profiles/runtime-limits.js';
import { SUPPORT_PROFILE_CANDIDATES_SCHEMA_ID } from '../../m0f/profiles/support-profiles.js';
import { FOLD_FACE_RECONSTRUCTION_RESULT_SCHEMA_ID } from '../../m0f/geometry/reconstruct-fold-faces.js';

async function schemaDocument(name: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(resolve(`m0f/schemas/${name}`), 'utf8')) as Record<
    string,
    unknown
  >;
}

function expectEveryObjectSchemaClosed(value: unknown, path = '$'): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => expectEveryObjectSchemaClosed(entry, `${path}[${index}]`));
    return;
  }
  if (typeof value !== 'object' || value === null) return;
  const record = value as Record<string, unknown>;
  if (record.type === 'object') {
    expect(record.additionalProperties, `${path} must reject unknown fields`).toBe(false);
  }
  for (const [key, entry] of Object.entries(record)) {
    expectEveryObjectSchemaClosed(entry, `${path}.${key}`);
  }
}

describe('M0F-0 reference-model JSON Schema contract', () => {
  it('uses the same fixed identifiers and claim boundary as the runtime parser', async () => {
    const schema = JSON.parse(
      await readFile(resolve('m0f/schemas/reference-model-v1.schema.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.$id).toBe(REFERENCE_MODEL_SCHEMA_ID);
    expect(schema.additionalProperties).toBe(false);

    const properties = schema.properties;
    if (typeof properties !== 'object' || properties === null || Array.isArray(properties)) {
      throw new Error('schema properties are missing');
    }
    const records = properties as Record<string, Record<string, unknown>>;
    expect(records.conventionsId?.const).toBe(M0F_CONVENTIONS_ID);
    expect(records.canonicalizationVersion?.const).toBe(CANONICALIZATION_VERSION);
    expect(records.scope?.const).toBe('conventions-only');
    expect(records.scientificClaim?.const).toBe(false);
  });
});

describe('M0F-0B candidate JSON Schema identifiers', () => {
  it.each([
    ['artifact-contract-v1.schema.json', ARTIFACT_CONTRACT_SCHEMA_ID],
    ['fold-face-reconstruction-result-v1.schema.json', FOLD_FACE_RECONSTRUCTION_RESULT_SCHEMA_ID],
    ['support-profile-candidates-v1.schema.json', SUPPORT_PROFILE_CANDIDATES_SCHEMA_ID],
  ])('%s matches its fail-closed runtime parser', async (name, schemaId) => {
    const schema = await schemaDocument(name);
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.$id).toBe(schemaId);
    expect(schema.additionalProperties).toBe(false);
    expectEveryObjectSchemaClosed(schema);
  });

  it('keeps the artifact schema outside the scientific-claim state space', async () => {
    const schema = await schemaDocument('artifact-contract-v1.schema.json');
    const properties = schema.properties as Record<string, Record<string, unknown>>;
    expect(properties.contractStatus?.const).toBe('candidate');
    expect(properties.scientificClaim?.const).toBe(false);
    expect(properties).not.toHaveProperty('verified');
    expect(properties).not.toHaveProperty('result');
  });

  it('compiles in strict Draft 2020-12 mode and validates every artifact vector', async () => {
    const schema = await schemaDocument('artifact-contract-v1.schema.json');
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    for (const name of ['design', 'fold']) {
      const document = JSON.parse(
        await readFile(resolve(`tests/vectors/m0f-0/artifact-contract-${name}-v1.json`), 'utf8'),
      ) as unknown;
      expect(validate(document), JSON.stringify(validate.errors)).toBe(true);
    }
  });

  it.each([
    ['reference-model-v1.schema.json', 'tests/vectors/m0f-0/convention-two-face-v1.json'],
    ['runtime-limits-v1.schema.json', 'm0f/profiles/runtime-limits-v1.candidates.json'],
  ])('strictly validates %s against its checked-in vector', async (schemaName, vectorPath) => {
    const schema = await schemaDocument(schemaName);
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    const document = JSON.parse(await readFile(resolve(vectorPath), 'utf8')) as unknown;
    expect(validate(document), JSON.stringify(validate.errors)).toBe(true);
  });
});

describe('M0F-0 runtime-limit JSON Schema contract', () => {
  it('shares its identifier with the fail-closed runtime parser', async () => {
    const schema = JSON.parse(
      await readFile(resolve('m0f/schemas/runtime-limits-v1.schema.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.$id).toBe(RUNTIME_LIMITS_SCHEMA_ID);
    expect(schema.additionalProperties).toBe(false);
  });
});
