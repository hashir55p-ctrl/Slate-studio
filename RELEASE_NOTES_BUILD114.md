# Slate Studio — Build 114

## Sculpt symmetry improvements
- Fixed the Grab brush so it uses the same enabled mirror axes as the other sculpt brushes.
- Grab now mirrors displacement direction correctly on X, Y and Z, including combined-axis symmetry.
- Clarified symmetry axis labels in the sculpt panel (X: left/right, Y: top/bottom, Z: front/back).
- Added guidance that symmetry planes are centered on the sculpt object's local origin.
- Preserved existing sculpt data, brush behavior and project format.

## Validation
- `bash build.sh` passed, including `node --check app3.js`.
- Generated `studio.html` and `index.html` are identical.
- ZIP archive integrity checked.
- Browser/iPad visual testing has not yet been performed.
