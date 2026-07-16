import fs from 'node:fs';

export type FixtureStatus = 'pending-approval' | 'canonical';

export interface FixtureRecord {
  id: string;
  title: string;
  description: string;
  status: FixtureStatus;
  source: string;
  inputPath: string;
  expectedPath: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface FixtureRegistry {
  schemaVersion: 1;
  registryStatus: 'candidate-only';
  fixtures: FixtureRecord[];
}

export const REGISTRY_PATH = new URL('./registry.candidates.json', import.meta.url);

export function parseFixtureRegistry(raw: unknown): FixtureRegistry {
  if (!raw || typeof raw !== 'object') throw new Error('registry must be an object');
  const value = raw as Record<string, unknown>;
  if (value.schemaVersion !== 1 || value.registryStatus !== 'candidate-only')
    throw new Error('registry must remain schemaVersion 1 and candidate-only');
  if (!Array.isArray(value.fixtures)) throw new Error('fixtures must be an array');
  const fixtures = value.fixtures.map((item, index) => {
    if (!item || typeof item !== 'object') throw new Error(`fixtures[${index}] must be an object`);
    const record = item as Record<string, unknown>;
    const required = [
      'id',
      'title',
      'description',
      'status',
      'source',
      'inputPath',
      'expectedPath',
    ];
    for (const key of required)
      if (typeof record[key] !== 'string' || record[key] === '')
        throw new Error(`fixtures[${index}].${key} is required`);
    if (record.status !== 'pending-approval')
      throw new Error(`fixtures[${index}].status must be pending-approval`);
    if (record.approvedBy !== null || record.approvedAt !== null)
      throw new Error(`fixtures[${index}] cannot contain approval metadata`);
    return record as unknown as FixtureRecord;
  });
  const ids = new Set<string>();
  for (const fixture of fixtures) {
    if (ids.has(fixture.id)) throw new Error(`duplicate fixture id: ${fixture.id}`);
    ids.add(fixture.id);
  }
  return { schemaVersion: 1, registryStatus: 'candidate-only', fixtures };
}

export function loadFixtureRegistry(path = REGISTRY_PATH): FixtureRegistry {
  return parseFixtureRegistry(JSON.parse(fs.readFileSync(path, 'utf8')) as unknown);
}

export function formatFixtureRegistry(registry: FixtureRegistry): string {
  return registry.fixtures
    .map((fixture) => `${fixture.id}\t${fixture.title}\tpending-approval`)
    .join('\n');
}
