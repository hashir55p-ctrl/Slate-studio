# Slate Studio — Build 110

## Facial expression and eye-control refinements
- Added quick eye-direction presets to the Face and hands panel: center, left, right, up, down, soft squint and tight squint.
- Presets write to the existing keyable `face.d` pose channel, so users can set keys with the existing timeline workflow.
- Increased the character creator's manual gaze range and response while retaining speech-directed eye contact and subtle saccades.
- Kept existing facial pose channel names and skeleton bone names unchanged for compatibility.

## Validation
- `bash build.sh` passed, including `node --check app3.js`.
- Generated `studio.html` and `index.html` are identical.
- ZIP integrity checked.
- No browser/iPad visual test was performed for this release.

## Known limitations
- Eye presets are pose controls, not physically constrained eyeball tracking.
- Facial parts remain separate meshes; this is not a unified facial sculpt topology.
