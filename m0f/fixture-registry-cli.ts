import { formatFixtureRegistry, loadFixtureRegistry } from './fixtures/fixture-registry.js';
const registry = loadFixtureRegistry();
if (process.argv.includes('--json')) console.log(JSON.stringify(registry, null, 2));
else console.log(formatFixtureRegistry(registry));
