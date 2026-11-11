#!/bin/bash
# Builds studio.html (and index.html for GitHub Pages) from src/. Needs: bash, node.
set -e
cd "$(dirname "$0")"
FILES="a.js b_top.js c_keep.js ui1.js ui2.js ui3a.js tex.js assets.js library.js props.js jeep.js audio.js captions.js voice.js face.js skin_photo.js creator.js embed_vo1.js scene.js ai.js kochi.js embed.js blender.js sculpt.js rig.js meshrig.js chainrig.js impmodel.js exportglb.js facepanel.js mocap.js sing.js embed_ref.js embed_jesvin.js embed_stany.js embed_renjith.js embed_hashir.js kochi_real.js embed_base.js jesvin_base.js char.js pixar.js recolor.js camfx.js scphoto.js scene1.js scene2.js twod_data.js twod.js welcome.js chatlink.js assetsp.js ui3b.js"
( cd src && cat $FILES > ../app3.js )
node --check app3.js
{ cat src/head2.html app3.js; echo '</script>'; } > studio.html
cp studio.html index.html
rm -f app3.js
ls -l studio.html
