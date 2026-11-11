# Slate Studio — Build 118

## Sculpt brush falloff presets

- Added four brush falloff profiles: Soft (balanced), Linear, Sharp and Broad.
- Applied the selected profile consistently to sculpt vertex gathering, including the accelerated candidate path.
- Existing mask protection, brush pressure, symmetry, stroke spacing and undo behavior remain in place.
- Soft is the default to retain a gentle, predictable sculpting response.

## Validation

- `bash build.sh` (includes `node --check app3.js`)
- Generated `studio.html` and `index.html` are byte-identical.
- ZIP archive integrity check.

Browser and Apple Pencil device testing have not yet been performed.
