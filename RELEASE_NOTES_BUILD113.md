# Slate Studio — Build 113

## Sculpting: volume-preserving surface relax

- Added a **Surface relax** sculpt brush alongside the existing Smooth brush.
- Uses one-ring vertex neighbourhoods to calculate a local average, then removes the displacement component along the current surface normal. This makes the relaxation primarily tangential and reduces the volume loss associated with ordinary Laplacian smoothing.
- Limits each vertex movement relative to its local average edge length to reduce abrupt changes on uneven meshes.
- Works through the existing brush pipeline, including mirror symmetry, masks, Apple Pencil pressure, stroke spacing, undo/redo, and optional dynamic detail refinement.
- Clarified the difference between ordinary Smooth and Surface relax in the sculpt panel.
- Bumped the application label to Build 113.

## Validation

- `bash build.sh` and `node --check` passed.
- Generated `studio.html` and `index.html` are identical.
- ZIP integrity checked.
- No browser or iPad visual/runtime test performed for this release.
