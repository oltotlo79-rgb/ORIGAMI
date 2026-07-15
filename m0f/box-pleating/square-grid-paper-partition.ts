import { deepFreezeOwned } from '../clone-and-freeze.js';
import {
  exactRational,
  multiplyExactRational,
  type ExactRational,
} from '../model/exact-rational.js';
import { exactRationalToJsonV1, type ExactRationalJsonV1 } from '../model/exact-rational-json.js';
import { tryCreateStrictValidationSnapshot } from '../strict-validation-snapshot.js';
import {
  parseSquareGridLatticeInputV1,
  SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE,
  type SquareGridLatticeCandidateInputV1,
  type SquareGridLatticeInputIssue,
} from './square-grid-lattice.js';

export const SQUARE_GRID_PAPER_PARTITION_INPUT_RECORD_TYPE =
  'm0f-square-grid-paper-partition-input' as const;
export const SQUARE_GRID_PAPER_PARTITION_RESULT_RECORD_TYPE =
  'm0f-square-grid-paper-partition-result' as const;

export type SquareGridPaperPartitionInputV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof SQUARE_GRID_PAPER_PARTITION_INPUT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  squareGridCandidate: SquareGridLatticeCandidateInputV1;
}>;

export type SquareGridPaperPartitionInputParseResult =
  | Readonly<{ ok: true; value: SquareGridPaperPartitionInputV1 }>
  | Readonly<{ ok: false; error: readonly SquareGridLatticeInputIssue[] }>;

export type SquareGridPaperPartitionPointV1 = Readonly<{
  x: ExactRationalJsonV1;
  y: ExactRationalJsonV1;
}>;

export type SquareGridPaperBoundaryVertexV1 = Readonly<{
  vertexId: string;
  position: SquareGridPaperPartitionPointV1;
}>;

export type SquareGridPaperBoundarySegmentV1 = Readonly<{
  segmentId: string;
  boundarySide: 'negative-y' | 'positive-x' | 'positive-y' | 'negative-x';
  fromVertexId: string;
  toVertexId: string;
}>;

export type SquareGridPaperPartitionRegionV1 = Readonly<{
  regionId: string;
  regionClass: 'active-square-grid' | 'residual-strip';
  residualAxis: 'none' | 'x' | 'y';
  bounds: Readonly<{
    minimum: SquareGridPaperPartitionPointV1;
    maximum: SquareGridPaperPartitionPointV1;
  }>;
}>;

export type SquareGridPaperPartitionInterfaceV1 = Readonly<{
  interfaceId: string;
  orientation: 'vertical' | 'horizontal';
  from: SquareGridPaperPartitionPointV1;
  to: SquareGridPaperPartitionPointV1;
  separatesRegionIds: readonly [string, string];
  semantics: 'partition-interface-only';
}>;

export type SquareGridPaperPartitionResultV1 = Readonly<{
  schemaVersion: 1;
  recordType: typeof SQUARE_GRID_PAPER_PARTITION_RESULT_RECORD_TYPE;
  contractStatus: 'candidate';
  scientificClaim: false;
  scope: 'square-grid-paper-partition-only';
  isSupportProfile: false;
  candidateSelectionIncluded: false;
  creaseIncluded: false;
  foldAssignmentIncluded: false;
  savedCpIntegrationIncluded: false;
  branchPlacementIncluded: false;
  branchPackingIncluded: false;
  pleatRoutingIncluded: false;
  feasibilityDecisionIncluded: false;
  residualTreatment: 'retained-as-unassigned-paper-region';
  regionCoverageInvariant: 'entire-paper-with-pairwise-disjoint-interiors';
  squareGridCandidate: SquareGridLatticeCandidateInputV1;
  activeGridSubdivision: Readonly<{
    cellGeometry: 'square';
    cellSize: ExactRationalJsonV1;
    columns: number;
    rows: number;
  }>;
  paperBoundary: Readonly<{
    orientation: 'counterclockwise';
    vertexOrder: 'bottom-left-then-bottom-right-then-top-right-then-top-left';
    segmentOrder: 'negative-y-then-positive-x-then-positive-y-then-negative-x';
    vertices: readonly SquareGridPaperBoundaryVertexV1[];
    segments: readonly SquareGridPaperBoundarySegmentV1[];
  }>;
  regions: readonly SquareGridPaperPartitionRegionV1[];
  interfaces: readonly SquareGridPaperPartitionInterfaceV1[];
}>;

export type SquareGridPaperPartitionBuildResult =
  | Readonly<{ ok: true; value: SquareGridPaperPartitionResultV1 }>
  | Readonly<{ ok: false; error: readonly SquareGridLatticeInputIssue[] }>;

const ROOT_KEYS = [
  'schemaVersion',
  'recordType',
  'contractStatus',
  'scientificClaim',
  'squareGridCandidate',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function issue(
  path: string,
  code: SquareGridLatticeInputIssue['code'],
  message: string,
): SquareGridLatticeInputIssue {
  return { path, code, message };
}

/**
 * Reuses the independently checked lattice-candidate boundary after closing
 * this operation's own root record. The candidate is cloned again by that
 * boundary, so the accepted result owns all data it exposes.
 */
export function parseSquareGridPaperPartitionInputV1(
  supplied: unknown,
): SquareGridPaperPartitionInputParseResult {
  const snapshot = tryCreateStrictValidationSnapshot(supplied, {
    maxArrayLength: 0,
    maxContainerCount: 16,
    maxDepth: 4,
    maxObjectPropertyCount: 8,
    maxPropertyNameCodeUnits: 64,
    maxStringCodeUnits: 1_088,
    maxTotalStringCodeUnits: 32_768,
    maxTotalPropertyCount: 64,
  });
  if (!snapshot.ok) {
    return {
      ok: false,
      error: [
        issue(
          '$',
          'invalid-snapshot',
          'input must be one acyclic plain JSON-data snapshot without accessors',
        ),
      ],
    };
  }
  const raw = snapshot.value;
  if (!isRecord(raw)) {
    return {
      ok: false,
      error: [issue('$', 'invalid-object', 'input must be an object')],
    };
  }

  const issues: SquareGridLatticeInputIssue[] = [];
  const allowed = new Set<string>(ROOT_KEYS);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      issues.push(issue(`$.${key}`, 'unknown-field', 'field is not declared by input v1'));
    }
  }
  for (const key of ROOT_KEYS) {
    if (!Object.hasOwn(raw, key)) {
      issues.push(issue(`$.${key}`, 'missing-field', 'required field is missing'));
    }
  }
  if (raw.schemaVersion !== 1) {
    issues.push(issue('$.schemaVersion', 'invalid-literal', 'must equal 1'));
  }
  if (raw.recordType !== SQUARE_GRID_PAPER_PARTITION_INPUT_RECORD_TYPE) {
    issues.push(
      issue(
        '$.recordType',
        'invalid-literal',
        `must equal ${SQUARE_GRID_PAPER_PARTITION_INPUT_RECORD_TYPE}`,
      ),
    );
  }
  if (raw.contractStatus !== 'candidate') {
    issues.push(issue('$.contractStatus', 'claim-boundary', 'must equal candidate'));
  }
  if (raw.scientificClaim !== false) {
    issues.push(issue('$.scientificClaim', 'claim-boundary', 'must equal false'));
  }

  const candidateParse = parseSquareGridLatticeInputV1({
    schemaVersion: 1,
    recordType: SQUARE_GRID_LATTICE_INPUT_RECORD_TYPE,
    contractStatus: 'candidate',
    scientificClaim: false,
    squareGridCandidate: raw.squareGridCandidate,
  });
  if (!candidateParse.ok) issues.push(...candidateParse.error);
  if (issues.length > 0 || !candidateParse.ok) {
    return { ok: false, error: deepFreezeOwned(issues) };
  }

  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: SQUARE_GRID_PAPER_PARTITION_INPUT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      squareGridCandidate: candidateParse.value.squareGridCandidate,
    }),
  };
}

function fromJson(value: ExactRationalJsonV1): ExactRational {
  return exactRational(BigInt(value.numerator), BigInt(value.denominator));
}

function point(x: ExactRational, y: ExactRational): SquareGridPaperPartitionPointV1 {
  return { x: exactRationalToJsonV1(x), y: exactRationalToJsonV1(y) };
}

/**
 * Partitions the entire rectangular paper into the active square-grid region
 * and, when present, one positive-boundary residual strip. The interface is
 * geometry only: it is not emitted or implied as a crease.
 */
export function buildSquareGridPaperPartitionV1(
  supplied: unknown,
): SquareGridPaperPartitionBuildResult {
  const parsed = parseSquareGridPaperPartitionInputV1(supplied);
  if (!parsed.ok) return parsed;

  const candidate = parsed.value.squareGridCandidate;
  const zero = exactRational(0n);
  const paperWidth = fromJson(candidate.paper.width);
  const paperHeight = fromJson(candidate.paper.height);
  const cellSize = fromJson(candidate.cellSize);
  const gridWidth = multiplyExactRational(cellSize, exactRational(BigInt(candidate.columns)));
  const gridHeight = multiplyExactRational(cellSize, exactRational(BigInt(candidate.rows)));
  const residualX = fromJson(candidate.residualStrips.xAxis);
  const residualY = fromJson(candidate.residualStrips.yAxis);

  const bottomLeft = point(zero, zero);
  const bottomRight = point(paperWidth, zero);
  const topRight = point(paperWidth, paperHeight);
  const topLeft = point(zero, paperHeight);
  const gridRegionId = 'paper-region:active-square-grid';

  const regions: SquareGridPaperPartitionRegionV1[] = [
    {
      regionId: gridRegionId,
      regionClass: 'active-square-grid',
      residualAxis: 'none',
      bounds: { minimum: point(zero, zero), maximum: point(gridWidth, gridHeight) },
    },
  ];
  const interfaces: SquareGridPaperPartitionInterfaceV1[] = [];

  if (residualX.numerator > 0n) {
    const residualRegionId = 'paper-region:residual-positive-x';
    regions.push({
      regionId: residualRegionId,
      regionClass: 'residual-strip',
      residualAxis: 'x',
      bounds: { minimum: point(gridWidth, zero), maximum: point(paperWidth, paperHeight) },
    });
    interfaces.push({
      interfaceId: 'paper-interface:residual-positive-x',
      orientation: 'vertical',
      from: point(gridWidth, zero),
      to: point(gridWidth, paperHeight),
      separatesRegionIds: [gridRegionId, residualRegionId],
      semantics: 'partition-interface-only',
    });
  } else if (residualY.numerator > 0n) {
    const residualRegionId = 'paper-region:residual-positive-y';
    regions.push({
      regionId: residualRegionId,
      regionClass: 'residual-strip',
      residualAxis: 'y',
      bounds: { minimum: point(zero, gridHeight), maximum: point(paperWidth, paperHeight) },
    });
    interfaces.push({
      interfaceId: 'paper-interface:residual-positive-y',
      orientation: 'horizontal',
      from: point(zero, gridHeight),
      to: point(paperWidth, gridHeight),
      separatesRegionIds: [gridRegionId, residualRegionId],
      semantics: 'partition-interface-only',
    });
  }

  return {
    ok: true,
    value: deepFreezeOwned({
      schemaVersion: 1,
      recordType: SQUARE_GRID_PAPER_PARTITION_RESULT_RECORD_TYPE,
      contractStatus: 'candidate',
      scientificClaim: false,
      scope: 'square-grid-paper-partition-only',
      isSupportProfile: false,
      candidateSelectionIncluded: false,
      creaseIncluded: false,
      foldAssignmentIncluded: false,
      savedCpIntegrationIncluded: false,
      branchPlacementIncluded: false,
      branchPackingIncluded: false,
      pleatRoutingIncluded: false,
      feasibilityDecisionIncluded: false,
      residualTreatment: 'retained-as-unassigned-paper-region',
      regionCoverageInvariant: 'entire-paper-with-pairwise-disjoint-interiors',
      squareGridCandidate: candidate,
      activeGridSubdivision: {
        cellGeometry: 'square',
        cellSize: candidate.cellSize,
        columns: candidate.columns,
        rows: candidate.rows,
      },
      paperBoundary: {
        orientation: 'counterclockwise',
        vertexOrder: 'bottom-left-then-bottom-right-then-top-right-then-top-left',
        segmentOrder: 'negative-y-then-positive-x-then-positive-y-then-negative-x',
        vertices: [
          { vertexId: 'paper-corner:bottom-left', position: bottomLeft },
          { vertexId: 'paper-corner:bottom-right', position: bottomRight },
          { vertexId: 'paper-corner:top-right', position: topRight },
          { vertexId: 'paper-corner:top-left', position: topLeft },
        ],
        segments: [
          {
            segmentId: 'paper-boundary:negative-y',
            boundarySide: 'negative-y',
            fromVertexId: 'paper-corner:bottom-left',
            toVertexId: 'paper-corner:bottom-right',
          },
          {
            segmentId: 'paper-boundary:positive-x',
            boundarySide: 'positive-x',
            fromVertexId: 'paper-corner:bottom-right',
            toVertexId: 'paper-corner:top-right',
          },
          {
            segmentId: 'paper-boundary:positive-y',
            boundarySide: 'positive-y',
            fromVertexId: 'paper-corner:top-right',
            toVertexId: 'paper-corner:top-left',
          },
          {
            segmentId: 'paper-boundary:negative-x',
            boundarySide: 'negative-x',
            fromVertexId: 'paper-corner:top-left',
            toVertexId: 'paper-corner:bottom-left',
          },
        ],
      },
      regions,
      interfaces,
    }),
  };
}
