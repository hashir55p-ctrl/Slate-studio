# Slate Studio: guide for AI assistants (ChatGPT, Claude, Codex)

Slate Studio is a Blender-like 3D animation/sculpting app that runs in one web page (Three.js r128, plain JavaScript, no framework). It is built on an iPad, so everything must work in mobile Safari with touch and Apple Pencil. Its job: block scenes, cameras and character acting for the comic/animation "The Bungalow Between Worlds" (cast: Stany, Jesvin, Hashir, Renjith), then export reference renders for Google Flow.

## How it is built
- Source is in `src/` as many small `.js` files plus `src/head2.html` (page shell + CSS).
- `bash build.sh` concatenates the files in a fixed order, runs `node --check`, and writes `studio.html` (and a copy `index.html` for GitHub Pages). **The order of files is in `build.sh` and matters** (later files use globals from earlier ones). Add a new file by adding it to `FILES` in `build.sh`.
- Never edit `studio.html`/`index.html` by hand; edit `src/` then rebuild.
- The page loads a few things from `assets/` at runtime (`hashir_front.jpg`, `hashir_side.jpg`, `s1.mp3`, ...). Keep `assets/` next to `studio.html` when hosting.
- Build label: `Build N` appears in `src/ui3b.js` and `src/head2.html`; bump both on each release.

## Map of the source (what to open for what)
- `a.js`, `b_top.js`, `c_keep.js`: renderer, scene, `look` object (grade/bloom/DOF/pixar), `applyLook`.
- `ui1.js`, `ui2.js`, `ui3a.js`, `ui3b.js`: panels, toolbar, timeline, main frame loop.
- `sculpt.js`: sculpt mode (brushes, masks, undo, dynamic detail). `scphoto.js`: photo guides and photo-to-head.
- `rig.js`, `meshrig.js`: skeleton rig and face rig (jaw, lids, **real eyeballs with gaze**, catchlights). `face.js`, `facepanel.js`, `voice.js`, `captions.js`: lip-sync and dialogue.
- `char.js`, `embed_*.js`: the four characters (embedded GLB data; `spec.embed` 0 Jesvin, 1 Stany, 2 Renjith, 3 Hashir).
- `recolor.js`: outfit recolour, facial hair painting, Stany's clear-glasses fix (runs once per character).
- `pixar.js`: the "Pixar look" shader patches (characters only). `camfx.js`: camera move presets.
- `scene1.js`, `scene2.js`, `kochi*.js`: the scenes (shots array `SH`, camera/target tracks).
- `exportglb.js`, `mocap.js`, `sing.js`, `ai.js`, `blender.js`, `library.js`, `props.js`, `jeep.js`, `audio.js`: export, mocap, singing, AI helpers, Blender-style tools, asset library.

## Rules of the road
1. Single page, no build tools beyond `build.sh` + node. No npm packages at runtime. Three.js r128 comes from a CDN `<script>` tag in `head2.html`; do not use APIs newer than r128 (e.g. `texture.userData` does not exist on textures).
2. iPad Safari first: touch/pencil input, modest GPU memory. Avoid huge textures and per-frame allocations.
3. The full render pipeline (bloom/DOF/grade) only runs in "final" quality or while recording; draft uses the plain renderer.
4. Characters are single skinned meshes with painted textures; clothes, hair and glasses are baked in. Changing their look means editing texture pixels or mesh triangles at load time (see `recolor.js`), not swapping parts. Splitting them into parts is a planned future step.
5. Keep large base64 data in the `embed_*.js` files; do not paste them into a chat. Open only the small file you need.

## Testing
- No test framework. `tools/hs.js` starts headless Chromium (Playwright, software GL) against a local server (`python3 -m http.server 8765` in the repo root, page `http://localhost:8765/studio.html#dev`). It expects a local copy of three.js r128 at the path set at the top of `hs.js`.
- Debug hooks exist on `window` in dev mode (`__S`, `__look`, `__sp`, `__camMove`, `__rc`, `__pxsync`). Example scripts: `tools/heads.js` (face close-ups), `tools/scenechk.js` (Scene 1 stills), `tools/lipchk.js` (mouth openness).
- Always run `bash build.sh` (syntax check) and check the page for console errors before committing.

## Known gaps / ideas
- Hair shapes differ from the character sheets (baked in the mesh). Hands have no individual fingers. Hashir/Stany/Renjith/Jesvin outfits only recoloured, not remodelled.
- Planned: modular characters (separate eyes, brows, hands, clothes, hair), path-traced "final still" mode, Apple Pencil pressure and faster dynamic-detail sculpting.
- Scene 2 (jeep drive) is waiting for the final dialogue audio (`assets/s2.mp3`, built with `tools/mkvb.py` into `src/embed_vo2.js`, then added before `scene2.js` in `build.sh`).
- Build 143 still had these creator bugs after they were fixed once (the fixes were lost when the zip replaced the files). If you work from an older copy, pull the latest `main` first. `piece()` in `creator.js` returns a geometry, not a mesh: wrap it in `new THREE.Mesh(geo, material)` before `add(...)`.


## Build 146 notes
- `src/chainrig.js`: after rigging, parts named hair_*, ponytail, braid, ribbon (head), cape, cloak, scarf (chest) and skirt, robe, tail, sash (hips) get bone chains with spring and wind (settings `CH`, Rig tab > Hair and cloth). Names with cap/scalp/base/stiff stay rigid. Per-frame hook: `chStep(dt)` in ui3a.js; build hook in the 45-frame block.
- `src/jesvin_base.js`: Jesvin on the base male, Jesvin v2 (sculpted, rigged), `window.__jb` test hooks.
- Chains are not yet keyframable, not collision-aware, and wind is real-time (not frame-deterministic for export).

## Build 147 notes
- `src/impmodel.js`: Import model (GLB or OBJ+MTL). OBJ is converted to GLB in memory (o/g names become mesh names, `v x y z r g b` vertex colours kept). Imported bytes are stored in IndexedDB key `imp:<key>`; the node is a normal `glb` spec with `imp` and an `EMBED_GLB` entry (`impKey`). `impRestore()` runs from `scIdbRestore()` at startup.
- `src/chainrig.js` additions: chain keyframes (`spec.chk`, Rig tab > Hair and cloth > Key at playhead) and capsule collision against body bones (`chColliders`, `chCollide`; head/neck skipped for hair chains).
- Textures are not imported from OBJ/MTL yet (only Kd colours and vertex colours).

## Build 148 - Blender-style face controls
- `src/meshrig.js`: new `nose.L/R` face bones; extra pose channels `face.f` (smile L, smile R, jaw sideways), `face.g` (mouth sideways, lips press, cheek puff), `face.h` (eye wide L/R, nose wrinkle), `face.i` (inner brow L/R), `face.j` (outer brow L/R), applied after the base pose in `mfUpdate`. Fixed shared-vector bug (`mfAxis` result must be cloned) so sideways bone moves actually happen.
- `src/facepanel.js`: 13 new sliders, new presets (Angry, Sad, Disgust, Fear, Smirk, Pout). All are keyable via the existing Set key.
- Works on rigged meshes with the mesh face rig (`rig.mf.face`); the older Character creator rig ignores the new channels.
