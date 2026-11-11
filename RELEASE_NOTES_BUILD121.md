# Slate Studio Build 121

## Joint- and crease-aware sculpting

- Added an adjustable Joint / crease preservation control.
- Smooth and Surface Relax now weight neighboring vertices by surface-normal similarity, reducing smoothing across sharp changes in surface direction.
- Surface Relax uses a weighted local neighborhood while retaining its tangential movement and edge-length displacement limit.
- The control is adjustable from 0 (more uniform smoothing) to 1 (stronger crease preservation); default is 0.72.
- Existing brush names, skeletons, symmetry, pressure handling and saved project formats remain unchanged.

## Validation

- Run `bash build.sh` to regenerate the HTML and run `node --check app3.js`.
- This release has not been visually tested in a browser or on an iPad. The feature is crease-aware mesh smoothing, not a biomechanical joint solver or automatic skinning system.
