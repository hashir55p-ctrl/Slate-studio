# Slate Studio Build 107

## Character anatomy update
- Added a smoother, higher-resolution shoulder/deltoid cap that overlaps the torso and upper-arm sleeve to soften the shoulder silhouette.
- Added longitudinal anatomical radius profiles to the upper arms, forearms, thighs and calves, creating more natural volume transitions than straight tapered tubes.
- Increased limb-shell radial resolution from 16 to 20 segments.
- Kept the existing skeleton bone names and pose-track structure unchanged.
- Fixed the torso builder's missing `feminine` parameter so its masculine/feminine chest shaping uses the creator's actual body-type setting rather than an undefined variable.

## Validation
- `bash build.sh` completed successfully, including the generated JavaScript syntax check.
- `studio.html` and `index.html` are generated from the same build output.
- ZIP archive integrity checked after packaging.
- No browser or iPad visual test is claimed for this release.

## Limitations
- Shoulder caps and limb tubes remain overlapping geometry islands inside a shared skinned mesh; this is not yet a single watertight anatomical surface.
- Anatomy profiles are procedural approximations and need visual review across body types, poses and clothing options.
