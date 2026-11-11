# Slate Studio Build 123

## Digit joint sculpting brush

- Added a dedicated **Digit joint (ring crease)** brush for fingertip, finger-joint and toe-joint detailing.
- The brush creates a compact circumferential groove with a subtle raised lip, designed for small-scale surface folds.
- Works with the existing brush falloff, pressure response, symmetry, masking and undo workflow.
- Recommended with Micro Detail Mode and a small brush radius.
- Existing ordinary Crease brush remains unchanged.

## Limitations
- This is a surface sculpting aid; it does not add individual finger/toe bones, change rigging, or generate anatomically separated digits.
- It has not been visually tested in a browser or on an iPad.

## Validation
- `bash build.sh` syntax-checks the concatenated JavaScript and regenerates `studio.html` and `index.html`.
