# Slate Studio — Build 119

## Sculpt stroke stabilization
- Reworked screen-space stroke stabilization to use a time-based exponential filter, making its response less dependent on frame rate.
- Added an independent Apple Pencil pressure smoothing control to reduce abrupt pressure changes during a stroke.
- Kept position stabilization and pressure smoothing independently adjustable, including zero-lag settings.
- Updated sculpt panel guidance and release/build labels.

## Validation
- Run `bash build.sh` to regenerate the page and run the JavaScript syntax check.
- Compare generated `studio.html` and `index.html`.
- Verify ZIP integrity.
- Browser and Apple Pencil hardware testing have not been performed for this release.
