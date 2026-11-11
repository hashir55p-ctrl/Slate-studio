/* Base anatomy figures: BodyKun (male) and BodyChan (female) posable drawing figures by vinchau, CC0 (public domain), from BlendSwap #23521. Converted to GLB (metres, parts kept separate). */
const BASE_FIG={};
BASE_FIG.kun=EMBED_GLB.length; EMBED_GLB.push({name:'Base anatomy: male (BodyKun)',size:1.75,humanoid:true,tpose:false,r:[0,0,0],url:'assets/base_kun.txt'});
BASE_FIG.chan=EMBED_GLB.length; EMBED_GLB.push({name:'Base anatomy: female (BodyChan)',size:1.75,humanoid:true,tpose:false,r:[0,0,0],url:'assets/base_chan.txt'});
function loadBaseKun(){ loadBundledCharacter(BASE_FIG.kun,'Base anatomy (male)'); }
function loadBaseChan(){ loadBundledCharacter(BASE_FIG.chan,'Base anatomy (female)'); }
