# Slate Studio Build 128

## Facial surface detail

- Added subtle under-eye folds and outer-corner creases.
- Added soft nasolabial fold overlays to help define the transition from nose to mouth.
- Added a very fine lower-lip border for close-up facial definition.
- Detail curves use low-opacity, warm skin-shaded materials to avoid harsh painted lines.
- Existing skin microtexture, facial expressions, mouth animation, face rig and skeleton names are unchanged.

## Limitations

- Facial folds are lightweight surface overlays, not sculpted anatomical topology or dynamic wrinkle simulation.
- Overlay placement is procedural and may vary with custom head proportions; visual inspection is still needed.
- No browser or iPad visual testing has been completed.

## Validation

- `bash build.sh` runs the project's JavaScript syntax check and regenerates `studio.html` and `index.html`.
