/** Browser-safe fixed input shared by the CLI example and diagnostic UI. */
export const DEFAULT_FOLD_FACE_CANDIDATE_FLOW_INPUT = Object.freeze({
  file_spec: 1.2,
  frame_classes: Object.freeze(['creasePattern']),
  frame_attributes: Object.freeze(['2D']),
  vertices_coords: Object.freeze([
    Object.freeze([0, 0]),
    Object.freeze([3, 0]),
    Object.freeze([3, 1]),
    Object.freeze([1, 1]),
    Object.freeze([1, 3]),
    Object.freeze([0, 3]),
  ]),
  edges_vertices: Object.freeze([
    Object.freeze([0, 1]),
    Object.freeze([1, 2]),
    Object.freeze([2, 3]),
    Object.freeze([3, 4]),
    Object.freeze([4, 5]),
    Object.freeze([5, 0]),
  ]),
  edges_assignment: Object.freeze(['B', 'B', 'B', 'B', 'B', 'B']),
});
