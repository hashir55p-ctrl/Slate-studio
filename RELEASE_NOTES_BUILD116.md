# Slate Studio Build 116

## Sculpt surface smoothing
- Reworked the Smooth brush into a bilateral, edge-aware mesh smoother.
- Neighbour influence now accounts for edge length and normal similarity, reducing the tendency to blur across sharp surface transitions.
- Keeps the existing Surface Relax brush separate for tangential, volume-conscious relaxation.
- Respects existing brush falloff and masking through the shared sculpt candidate weights.

## Validation
- `bash build.sh` passed, including `node --check app3.js`.
- Generated `studio.html` and `index.html` match.
- ZIP archive integrity verified.
- No browser or iPad visual test performed for this release.
