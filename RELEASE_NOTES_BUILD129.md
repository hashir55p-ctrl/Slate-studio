# Slate Studio Build 129

## Eye detail refinement

- Increased procedural eyeball geometry resolution and refined the sclera material.
- Added a subtle dark limbal ring around the iris.
- Added a fine inner pupil border.
- Added two restrained catchlights to improve eye readability under lighting.
- Upgraded mesh-rig iris canvas with radial fibre detail and a clearer outer limbal edge.
- Added matching catchlights to mesh-rig eyes; highlights follow the existing eye group and gaze movement.
- Existing eye direction controls, face rig, blink controls and bone names are unchanged.

## Limitations

- Eye highlights are static surface catchlights, not reflections sampled from the scene.
- Iris colour remains driven by the existing character eye-colour setting for procedural characters; mesh-rig eye texture retains its current brown base palette.
- No browser or iPad visual testing has been completed.

## Validation

- `bash build.sh` runs the project's JavaScript syntax check and regenerates `studio.html` and `index.html`.
