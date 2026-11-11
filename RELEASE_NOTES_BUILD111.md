# Slate Studio — Build 111

## Lip-shape and mouth-animation refinement
- Added three keyable facial controls: lip pucker, upper-lip raise, and lower-lip drop.
- Applied the new controls to the procedural character creator's upper/lower lip meshes.
- Applied corresponding lip offsets to the imported/embedded mesh-rig facial lip controls where available.
- Updated the U (pucker), M (closed), and F/V mouth presets to use the new lip-shape channel.
- Reset Face now also clears the new `face.e` channel.
- Preserved existing facial pose channels and skeleton bone names; new controls are stored in an additive pose channel.

## Validation
- Build and JavaScript syntax validation run with `bash build.sh`.
- Generated `studio.html` and `index.html` checked for identical content.
- ZIP integrity checked.
- No browser or iPad visual test was performed for this release.

## Known limitations
- Lip controls deform simple lip meshes/bones; this is not phoneme-accurate facial blendshape animation or unified facial topology.
- Voice-driven lip sync remains based on the existing viseme/envelope system.
