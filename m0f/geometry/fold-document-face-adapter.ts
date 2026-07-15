import { deepFreezeOwned, tryCreateValidationSnapshot } from '../clone-and-freeze.js';
import {
  normalizeFoldFaceReconstructionInputV1,
  type FoldFaceInputIssue,
  type FoldFaceReconstructionInputV1,
} from './fold-face-input.js';

export type FoldDocumentFaceAdapterIssueCode =
  | FoldFaceInputIssue['code']
  | 'invalid-metadata'
  | 'unsupported-faces-present'
  | 'unsupported-file-frames'
  | 'unsupported-frame-class'
  | 'unsupported-frame-attribute'
  | 'internal-failure';

export type FoldDocumentFaceAdapterIssue = Readonly<{
  path: string;
  code: FoldDocumentFaceAdapterIssueCode;
  message: string;
}>;

export type FoldDocumentFaceAdapterResult =
  | Readonly<{ ok: true; value: FoldFaceReconstructionInputV1 }>
  | Readonly<{ ok: false; error: readonly FoldDocumentFaceAdapterIssue[] }>;

const REQUIRED_ROOT_KEYS = [
  'file_spec',
  'vertices_coords',
  'edges_vertices',
  'edges_assignment',
] as const;

const OPTIONAL_ROOT_KEYS = [
  'faces_vertices',
  'file_frames',
  'file_creator',
  'file_author',
  'file_title',
  'file_description',
  'file_classes',
  'frame_author',
  'frame_title',
  'frame_description',
  'frame_classes',
  'frame_attributes',
  'frame_unit',
] as const;

const STRING_METADATA_KEYS = [
  'file_creator',
  'file_author',
  'file_title',
  'file_description',
  'frame_author',
  'frame_title',
  'frame_description',
  'frame_unit',
] as const;

const STRING_ARRAY_METADATA_KEYS = ['file_classes', 'frame_classes', 'frame_attributes'] as const;

const UNSUPPORTED_FRAME_ATTRIBUTES = [
  '3D',
  'abstract',
  'nonManifold',
  'nonOrientable',
  'selfIntersecting',
  'cuts',
  'joins',
] as const;

const NORMALIZER_PATH_MAPPINGS = [
  ['$.verticesCoords', '$.vertices_coords'],
  ['$.edgesVertices', '$.edges_vertices'],
  ['$.edgesAssignment', '$.edges_assignment'],
  ['$.facesVertices', '$.faces_vertices'],
  ['$.specVersion', '$.file_spec'],
] as const;

function failure(issues: readonly FoldDocumentFaceAdapterIssue[]): FoldDocumentFaceAdapterResult {
  return deepFreezeOwned({
    ok: false,
    error: issues.map((issue) => ({ ...issue })),
  });
}

function addIssue(
  issues: FoldDocumentFaceAdapterIssue[],
  path: string,
  code: FoldDocumentFaceAdapterIssueCode,
  message: string,
): void {
  issues.push({ path, code, message });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Rejects class instances and exotic containers before structuredClone can
 * flatten them into apparently plain records. Accessors are intentionally not
 * invoked here; the validation snapshot is the sole read of their values.
 */
function containsNonPlainDataObject(value: unknown, seen: WeakSet<object>): boolean {
  if (typeof value !== 'object' || value === null || seen.has(value)) return false;
  seen.add(value);

  const prototype: unknown = Object.getPrototypeOf(value);
  if (Array.isArray(value)) {
    if (prototype !== Array.prototype) return true;
  } else if (prototype !== Object.prototype && prototype !== null) {
    return true;
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key === 'symbol') return true;
    const descriptor = descriptors[key];
    if (descriptor === undefined) return true;
    if (!descriptor.enumerable && !(Array.isArray(value) && key === 'length')) return true;
    if ('value' in descriptor && containsNonPlainDataObject(descriptor.value, seen)) return true;
  }
  return false;
}

function validateClosedRootKeys(
  raw: Record<string, unknown>,
  issues: FoldDocumentFaceAdapterIssue[],
): void {
  const allowed = new Set<string>([...REQUIRED_ROOT_KEYS, ...OPTIONAL_ROOT_KEYS]);
  for (const key of Object.keys(raw).sort()) {
    if (!allowed.has(key)) {
      addIssue(
        issues,
        `$.${key}`,
        'unknown-field',
        'field is not supported by the closed NOFACES candidate adapter',
      );
    }
  }
  for (const key of REQUIRED_ROOT_KEYS) {
    if (!Object.hasOwn(raw, key)) {
      addIssue(issues, `$.${key}`, 'missing-field', 'field is required');
    }
  }
}

function stringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function validateMetadataTypes(
  raw: Record<string, unknown>,
  issues: FoldDocumentFaceAdapterIssue[],
): void {
  for (const key of STRING_METADATA_KEYS) {
    if (Object.hasOwn(raw, key) && typeof raw[key] !== 'string') {
      addIssue(issues, `$.${key}`, 'invalid-metadata', 'metadata value must be a string');
    }
  }
  for (const key of STRING_ARRAY_METADATA_KEYS) {
    if (Object.hasOwn(raw, key) && !stringArray(raw[key])) {
      addIssue(
        issues,
        `$.${key}`,
        'invalid-metadata',
        'metadata value must be an array of strings',
      );
    }
  }
}

function validateNoFacesSlice(
  raw: Record<string, unknown>,
  issues: FoldDocumentFaceAdapterIssue[],
): void {
  if (Object.hasOwn(raw, 'faces_vertices')) {
    addIssue(
      issues,
      '$.faces_vertices',
      'unsupported-faces-present',
      'faces_vertices must be absent; this adapter reconstructs faces',
    );
  }

  if (Object.hasOwn(raw, 'file_frames')) {
    if (!Array.isArray(raw.file_frames)) {
      addIssue(issues, '$.file_frames', 'invalid-array', 'must be an empty array when present');
    } else if (raw.file_frames.length !== 0) {
      addIssue(
        issues,
        '$.file_frames',
        'unsupported-file-frames',
        'nested or additional frames are unsupported; file_frames must be empty',
      );
    }
  }
}

function validateFrameSemantics(
  raw: Record<string, unknown>,
  issues: FoldDocumentFaceAdapterIssue[],
): void {
  if (stringArray(raw.frame_classes) && !raw.frame_classes.includes('creasePattern')) {
    addIssue(
      issues,
      '$.frame_classes',
      'unsupported-frame-class',
      'frame_classes must include creasePattern when present',
    );
  }

  if (!stringArray(raw.frame_attributes)) return;
  if (!raw.frame_attributes.includes('2D')) {
    addIssue(
      issues,
      '$.frame_attributes',
      'unsupported-frame-attribute',
      'frame_attributes must include 2D when present',
    );
  }
  raw.frame_attributes.forEach((attribute, index) => {
    if ((UNSUPPORTED_FRAME_ATTRIBUTES as readonly string[]).includes(attribute)) {
      addIssue(
        issues,
        `$.frame_attributes[${index}]`,
        'unsupported-frame-attribute',
        `${attribute} is outside the supported top-level 2D crease-pattern slice`,
      );
    }
  });
}

function mapNormalizerText(text: string): string {
  let mapped = text;
  for (const [internalPath, foldPath] of NORMALIZER_PATH_MAPPINGS) {
    mapped = mapped.replaceAll(internalPath, foldPath);
  }
  return mapped;
}

function mapNormalizerIssues(
  issues: readonly FoldFaceInputIssue[],
): FoldDocumentFaceAdapterIssue[] {
  return issues.map((issue) => ({
    path: mapNormalizerText(issue.path),
    code: issue.code,
    message: mapNormalizerText(issue.message),
  }));
}

/**
 * Adapts the closed, top-level FOLD 1.1/1.2 NOFACES subset to the internal
 * face-reconstruction input. The returned DTO is owned and deeply frozen.
 */
export function adaptFoldDocumentToFaceReconstructionInputV1(
  supplied: unknown,
): FoldDocumentFaceAdapterResult {
  try {
    if (containsNonPlainDataObject(supplied, new WeakSet<object>())) {
      return failure([
        {
          path: '$',
          code: 'invalid-snapshot',
          message: 'input must be one cloneable plain JSON-data snapshot',
        },
      ]);
    }

    const snapshot = tryCreateValidationSnapshot(supplied);
    if (!snapshot.ok) {
      return failure([
        {
          path: '$',
          code: 'invalid-snapshot',
          message: 'input must be one cloneable plain JSON-data snapshot',
        },
      ]);
    }
    const raw = snapshot.value;
    if (!isRecord(raw)) {
      return failure([
        { path: '$', code: 'invalid-object', message: 'FOLD document must be an object' },
      ]);
    }

    const issues: FoldDocumentFaceAdapterIssue[] = [];
    validateClosedRootKeys(raw, issues);
    validateMetadataTypes(raw, issues);
    validateNoFacesSlice(raw, issues);
    validateFrameSemantics(raw, issues);

    let specVersion: FoldFaceReconstructionInputV1['specVersion'] | undefined;
    if (Object.hasOwn(raw, 'file_spec')) {
      if (raw.file_spec === 1.1) specVersion = '1.1';
      else if (raw.file_spec === 1.2) specVersion = '1.2';
      else {
        addIssue(issues, '$.file_spec', 'invalid-literal', 'must be the number 1.1 or 1.2');
      }
    }
    if (issues.length > 0 || specVersion === undefined) return failure(issues);

    const candidate = {
      specVersion,
      verticesCoords: raw.vertices_coords,
      edgesVertices: raw.edges_vertices,
      edgesAssignment: raw.edges_assignment,
      facesVertices: null,
    };
    const normalized = normalizeFoldFaceReconstructionInputV1(candidate);
    if (!normalized.ok) return failure(mapNormalizerIssues(normalized.error));

    return deepFreezeOwned({
      ok: true,
      value: candidate as FoldFaceReconstructionInputV1,
    });
  } catch {
    return failure([
      {
        path: '$',
        code: 'internal-failure',
        message: 'adapter failed closed without exposing partial output',
      },
    ]);
  }
}
