# Slate Studio — Build 112

## Facial animation blending and stability
- Smoothed smile/frown, lip pucker, upper-lip raise and lower-lip drop values using the existing frame-time easing used by jaw and viseme motion.
- Combined the keyed `face.e` controls with expression animation without abrupt per-frame jumps.
- Fixed missing face-pose and round-mouth state references in the procedural facial update path, which could throw during character updates.
- Preserved the existing rig bone names, pose keys and voice-viseme data format.

## Validation
- `bash build.sh` (includes `node --check app3.js`)
- Generated `studio.html` and `index.html` are identical.
- ZIP integrity checked.
- Browser/iPad visual testing has not been completed.
