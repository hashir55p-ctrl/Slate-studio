# Slate Studio Build 122

## Micro-detail sculpting for small anatomy

- Reduced the minimum sculpt brush size from 0.03 to 0.008 of the sculpt reference scale.
- Added Micro detail mode, with a small-brush starting size and automatic local triangle refinement around the active stroke.
- Micro refinement works with sculpting brushes (excluding mask and paint), including fine work around fingertips, toes, eyelids and narrow creases.
- Local refinement respects the existing 300,000-vertex safety cap and the existing mask/paint interpolation performed by the topology refinement system.
- Existing manual Detail brush mode remains available separately.

## Validation

- `bash build.sh` runs the project's JavaScript syntax check and regenerates `studio.html` and `index.html`.
- ZIP integrity and generated HTML consistency are checked for this release.
- Browser and iPad / Apple Pencil visual testing have not been performed. Micro detail can grow polygon counts quickly; use it selectively and monitor the point counter.
