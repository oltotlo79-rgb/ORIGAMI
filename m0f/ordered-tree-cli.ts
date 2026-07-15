import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  analyzeOrderedTreeInputV1,
  ORDERED_TREE_INPUT_RECORD_TYPE,
} from './box-pleating/ordered-tree-input.js';
import { serializeJsonLine } from './stable-json.js';

export const DEFAULT_ORDERED_TREE_INPUT = Object.freeze({
  schemaVersion: 1,
  recordType: ORDERED_TREE_INPUT_RECORD_TYPE,
  contractStatus: 'candidate',
  scientificClaim: false,
  nodes: Object.freeze([
    Object.freeze({
      id: 'node-a',
      pos: Object.freeze({ x: 0, y: 0 }),
      label: 'A',
      mirrorOf: null,
      onSymmetryAxis: false,
    }),
    Object.freeze({
      id: 'node-b',
      pos: Object.freeze({ x: 1, y: 0 }),
      label: 'B',
      mirrorOf: null,
      onSymmetryAxis: false,
    }),
    Object.freeze({
      id: 'node-c',
      pos: Object.freeze({ x: 2, y: 0 }),
      label: 'C',
      mirrorOf: null,
      onSymmetryAxis: false,
    }),
    Object.freeze({
      id: 'node-d',
      pos: Object.freeze({ x: 3, y: 0 }),
      label: 'D',
      mirrorOf: null,
      onSymmetryAxis: false,
    }),
  ]),
  edges: Object.freeze([
    Object.freeze({
      id: 'edge-terminal-a',
      from: 'node-a',
      to: 'node-b',
      length: 1,
      width: 0,
      label: 'terminal A',
      mirrorOf: null,
    }),
    Object.freeze({
      id: 'edge-internal',
      from: 'node-b',
      to: 'node-c',
      length: 1.5,
      width: 0.25,
      label: 'internal width',
      mirrorOf: null,
    }),
    Object.freeze({
      id: 'edge-terminal-d',
      from: 'node-c',
      to: 'node-d',
      length: 1,
      width: 0.125,
      label: 'terminal D',
      mirrorOf: null,
    }),
  ]),
  rotation: Object.freeze([
    Object.freeze({ nodeId: 'node-a', edgeIds: Object.freeze(['edge-terminal-a']) }),
    Object.freeze({
      nodeId: 'node-b',
      edgeIds: Object.freeze(['edge-internal', 'edge-terminal-a']),
    }),
    Object.freeze({
      nodeId: 'node-c',
      edgeIds: Object.freeze(['edge-terminal-d', 'edge-internal']),
    }),
    Object.freeze({ nodeId: 'node-d', edgeIds: Object.freeze(['edge-terminal-d']) }),
  ]),
});

export type OrderedTreeCliIo = Readonly<{
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}>;

function defaultIo(): OrderedTreeCliIo {
  return {
    stdout: (text: string) => process.stdout.write(text),
    stderr: (text: string) => process.stderr.write(text),
  };
}

/** Emits one fixed width-aware ordered-tree validation result. */
export function runDefaultOrderedTreeCli(io: OrderedTreeCliIo = defaultIo()): number {
  try {
    const result = analyzeOrderedTreeInputV1(DEFAULT_ORDERED_TREE_INPUT);
    if (!result.ok) {
      io.stderr('ordered-tree input validation rejected its fixed example\n');
      return 1;
    }
    io.stdout(serializeJsonLine(result.value));
    return 0;
  } catch {
    io.stderr('ordered-tree input validation failed before producing a record\n');
    return 1;
  }
}

export function runOrderedTreeCli(
  arguments_: readonly string[],
  io: OrderedTreeCliIo = defaultIo(),
): number {
  if (arguments_.length === 0) return runDefaultOrderedTreeCli(io);
  io.stderr('usage: npm run m0f:ordered-tree\n');
  return 2;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  process.exitCode = runOrderedTreeCli(process.argv.slice(2));
}
