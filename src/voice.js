/* ---------- recorded dialogue track + lip sync ---------- */
const VB={};   /* VB[id]={dur,b64,env(b64 uint8 @30Hz),buf,envA} filled by embed_vo*.js */
const VBS={src:null,ctx0:0,t0:0,id:'',busy:{}};
function vbDecode(id){
  const e=VB[id]; if(!e||e.buf||VBS.busy[id]) return; const c=AU.ctx; if(!c) return; VBS.busy[id]=1;
  const dec=ab=>{ try{ const p=c.decodeAudioData(ab,b=>{ e.buf=b; },()=>{ VBS.busy[id]=0; toast('Could not decode the dialogue audio.'); }); if(p&&p.catch) p.catch(()=>{}); }catch(err){ VBS.busy[id]=0; } };
  try{ if(e.url){ fetch(e.url).then(r=>{ if(!r.ok) throw 0; return r.arrayBuffer(); }).then(dec,()=>{ VBS.busy[id]=0; toast('Could not load the dialogue audio from the assets folder.'); }); }
  else{ const bin=atob(e.b64), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); dec(u.buffer); } }catch(err){ VBS.busy[id]=0; }
}
function vbEnv(id){ const e=VB[id]; if(!e) return null; if(!e.envA){ const b=atob(e.env), a=new Uint8Array(b.length); for(let i=0;i<b.length;i++) a[i]=b.charCodeAt(i); e.envA=a; } return e.envA; }
function vbStop(){ if(VBS.src){ try{ VBS.src.stop(); VBS.src.disconnect(); }catch(e){} VBS.src=null; } }
function voiceUpdate(t,playing){
  const vo=S.vo; if(!vo||!vo.id||!VB[vo.id]){ vbStop(); return; }
  try{ faceUpdate(t,playing); }catch(e){ if(!VBS.err){ VBS.err=1; console.warn("face",e); } }
  const c=AU.ctx; if(playing&&(!c||c.state!=='running')){ const n=Date.now(); if(!VBS.nag||n-VBS.nag>4000){ VBS.nag=n; toast('Tap anywhere on the screen once to switch the sound on, then press play again.'); } auEnsure(); }
  if(!c||!AU.on) return; vbDecode(vo.id);
  if(playing&&!VB[vo.id].buf){ const n=Date.now(); if(!VBS.nag2||n-VBS.nag2>4000){ VBS.nag2=n; toast('Loading the dialogue audio...'); } }
  const e=VB[vo.id], off=t-(vo.t0||0);
  if(!playing||off<0||off>=e.dur||!e.buf||c.state!=='running'){ vbStop(); return; }
  if(VBS.src){ const drift=(c.currentTime-VBS.ctx0)-(off-VBS.off0); if(Math.abs(drift)>.5||VBS.id!==vo.id) vbStop(); }
  if(!VBS.src){ const s=c.createBufferSource(), g=c.createGain(); g.gain.value=1.25; s.buffer=e.buf; s.connect(g); g.connect(AU.master); s.start(0,off); s.onended=()=>{ if(VBS.src===s) VBS.src=null; };
    VBS.src=s; VBS.ctx0=c.currentTime; VBS.off0=off; VBS.id=vo.id; }
}
function voiceSet(id,t0){ S.vo=VB[id]?{id:id,t0:+t0||0}:null; if(!S.vo) vbStop(); VO.on=false; }

function vbTest(){ const c=auEnsure(); auUnlock(); if(!c){ toast('This browser cannot play sound.'); return; } if(!VB.s1){ toast('No dialogue audio in this build.'); return; }
  c.resume&&c.resume(); vbDecode('s1'); let tries=0; const go=()=>{ const e=VB.s1; if(!e.buf){ if(++tries<40) return setTimeout(go,150); toast('Dialogue audio failed to decode.'); return; }
    const s=c.createBufferSource(), g=c.createGain(); g.gain.value=1.25; s.buffer=e.buf; s.connect(g); g.connect(c.destination); s.start(0,1.9); s.stop(c.currentTime+5); toast('Playing 5 seconds of dialogue. Context: '+c.state); }; go(); }
function faceReport(){ let ok=0,tot=0,bad=[]; nodes.forEach(nd=>{ if(nd.userData.spec&&nd.userData.spec.embed!=null){ tot++; if(nd.userData.faceInfo) ok++; else bad.push(nd.userData.name+(nd.userData.rig?'':' (no rig)')); } }); toast('Face rig on '+ok+' of '+tot+' characters'+(bad.length?'. Missing: '+bad.join(', '):'.')); }

/* the dialogue clip is the master clock while it plays, so slow frames never push picture and sound apart */
function vbClock(){ const vo=S.vo; if(!vo||!VBS.src||!AU.ctx||VBS.id!==vo.id) return null; return (vo.t0||0)+VBS.off0+(AU.ctx.currentTime-VBS.ctx0)-((AU.ctx.outputLatency||0)+(AU.ctx.baseLatency||0)); }

function voNudge(d){ if(!S.vo){ toast('This scene has no recorded dialogue.'); return; } S.vo.t0=Math.round(((S.vo.t0||0)+d)*1000)/1000; vbStop(); queueSave&&queueSave(); toast('Voice offset '+(S.vo.t0>0?'+':'')+S.vo.t0.toFixed(2)+' s ('+(S.vo.t0>0?'later':S.vo.t0<0?'earlier':'original')+'). Press play.'); }
