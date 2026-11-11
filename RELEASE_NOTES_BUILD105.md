# Slate Studio — Build 105

## Articulated toe rig
- Added five toe bones per foot, parented to the existing left/right foot bones.
- Added individual toe geometry for bare-foot characters.
- Toe meshes inherit foot movement and can bend independently using pose keys `toes.L` and `toes.R` (five numeric bend values per side).
- Toe bones are added to the character's runtime skeleton while preserving existing standard bone names and tracks.
- Toe meshes are hidden for plain-shoe and sneaker styles.

## Validation
- `bash build.sh` passed, including JavaScript syntax validation.
- Generated `studio.html` and `index.html` match.
- ZIP integrity verified.
- No browser or iPad runtime testing has been completed.

## Known limitations
- Toe posing currently supports direct per-toe bend values in the pose data; a dedicated UI control and keyframe workflow still need to be added.
- Bare toe geometry is simple procedural geometry and is not welded to the foot surface.
- Finger joints, torso-to-limb connections, and complete watertight topology remain future work.
