# Slate Studio Build 120

## Mesh deformation protection

- Added an adjustable Deformation protection control to the sculpting brush panel.
- Each positional brush dab is checked against the average incident edge length at each affected vertex.
- Excessive single-dab displacement is limited relative to local mesh scale, reducing sudden spikes and stretched triangles.
- Applied the same local edge-scale guard to Snake and Nudge movement.
- The guard is adjustable from 0 (least protection) to 1 (strongest protection); default is 0.7.
- Existing brushes, pressure response, symmetry, undo/redo and topology workflows remain in place.

## Validation
- `bash build.sh` runs the project's JavaScript syntax check and regenerates `studio.html` and `index.html`.
- This release has not been visually tested in a browser or on an iPad. Deformation protection is a per-dab safeguard, not a full cloth/volume solver or remeshing system.
