# Slate Studio Build 127

## Procedural skin micro-surface

- Added a deterministic, tileable grayscale microtexture for skin materials.
- Uses subtle pore-like marks and low-amplitude surface variation for bump and roughness response.
- Applied to the shared skin material used by procedural head details, hands, feet and exposed limb regions.
- Texture is grayscale and does not alter the selected skin colour.
- Kept bump intensity deliberately subtle to avoid a visibly noisy or rocky appearance at normal viewing distance.
- Existing skin colour controls, character proportions and rig names remain unchanged.

## Limitations

- This is a procedural surface microtexture, not physically based subsurface scattering or a high-resolution scanned skin texture.
- Procedural face overlays that use basic materials do not receive this bump map.
- No browser or iPad visual testing has been completed.

## Validation

- `bash build.sh` runs the project's JavaScript syntax check and regenerates `studio.html` and `index.html`.
