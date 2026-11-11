# Slate Studio — Build 101

## Character creator: consolidated skinned limb shell

- Added a single skinned mesh object for both upper arms, forearms, thighs and lower legs.
- Uses the existing upper-arm, forearm, upper-leg and lower-leg bones; bone names and animation-track compatibility are preserved.
- Keeps shirt/hoodie, skin and trouser materials in separate geometry groups.
- Preserves separate hands, finger chains and feet so existing finger posing and footwear remain intact.
- Retains the Build 100 unified torso.

## Important scope note

The torso and limb shell are separate skinned mesh objects. The limb shell contains overlapping tube surfaces at joints, not a watertight anatomical manifold. Hands, fingers, feet, head, hair, clothes and accessories still include separate meshes. This is an intermediate character-mesh consolidation step, not a finished full-body sculpt topology.

## Validation

- `bash build.sh`: passed; this runs `node --check app3.js` before generating the HTML.
- Generated `studio.html` and `index.html` are byte-identical.
- ZIP integrity: verified.
- Browser visual/interaction testing: not performed.
