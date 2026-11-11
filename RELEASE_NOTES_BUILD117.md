# Slate Studio Build 117

## Apple Pencil pressure precision
- Added independent pressure-response curves for brush strength and brush size.
- Linear response remains the default (1.0); lower curve values make light touches more responsive, while higher values reserve stronger effects for firmer pressure.
- Pressure-sensitive Grab now scales the drag displacement as well as other pressure-aware sculpt brushes.
- Mouse and finger sculpting continue to use full-strength input.
- Added controls and explanatory guidance to the Sculpt > Brush panel.

## Validation
- `bash build.sh` passed, including `node --check app3.js`.
- Generated `studio.html` and `index.html` match.
- ZIP archive integrity verified.
- No browser or iPad visual test performed for this release.
