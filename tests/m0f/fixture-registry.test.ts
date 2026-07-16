import { describe, expect, it } from 'vitest';
import { loadFixtureRegistry, parseFixtureRegistry } from '../../m0f/fixtures/fixture-registry.js';
describe('fixture registry', () => {
  it('loads five pending records without canonical promotion', () => { const registry = loadFixtureRegistry(); expect(registry.fixtures).toHaveLength(5); expect(registry.fixtures.every((f) => f.status === 'pending-approval')).toBe(true); });
  it('rejects canonical status and approval metadata', () => { expect(() => parseFixtureRegistry({ schemaVersion: 1, registryStatus: 'candidate-only', fixtures: [{ id: 'x', title: 'x', description: 'x', status: 'canonical', source: 'x', inputPath: 'x', expectedPath: 'x', approvedBy: null, approvedAt: null }] })).toThrow(); });
});
