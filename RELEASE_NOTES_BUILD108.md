# Slate Studio — Build 108

## Hand and wrist refinement
- Increased palm volume and width to create a more readable hand silhouette.
- Added a separate knuckle-transition pad and thumb-base pad to improve the palm-to-finger and thumb-root shapes.
- Increased finger segment cylinder radial resolution from 8 to 12 and added a second height subdivision for smoother shading.
- Kept existing hand and finger pose keys and skeleton bone names unchanged.

## Limitations
- Palm, knuckle and thumb-base forms are overlapping geometry islands inside the skinned limb mesh; they are not welded into a single watertight hand surface.
- Finger chains remain separate articulated meshes. This is a visual refinement, not a finished anatomical hand or production-ready topology.
- Build and syntax validation are not substitutes for browser and iPad visual testing; those tests have not been performed for this release.
