# Slate Studio — Build 115

## Sculpt topology refinement
- Dynamic topology now splits every overlong edge in an affected triangle, rather than only its single longest edge.
- Shared-edge midpoint reuse keeps adjacent faces connected and avoids T-junctions during refinement.
- Preserves interpolated vertex paint and mask values for newly created points.
- Retains the existing mobile-oriented vertex cap and detail-size controls.

## Validation
- Run `bash build.sh` to regenerate `studio.html` and `index.html` and check JavaScript syntax.
- This release has not been visually tested in a browser or on iPad.
