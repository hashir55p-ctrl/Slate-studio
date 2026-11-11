
/* ---------- toast + persistence ---------- */
let toastTimer=0;
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>{t.hidden=true;},2600); }
let saveTimer=0;
function queueSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(saveNow,400); renderOutlinerSafe(); }
function renderOutlinerSafe(){ renderOutliner(); }
function saveNow(){
  try{
    sculptFlush();
    const objs=order.filter(i=>i!=='cam'&&i!=='tgt'&&!nodes.get(i).userData.spec.transient).map(id=>{ const n=nodes.get(id), sp=n.userData.spec;
      sp.p=n.position.toArray(); sp.r=[n.rotation.x,n.rotation.y,n.rotation.z]; sp.s=n.scale.toArray(); sp.name=n.userData.name; return sp; });
    const keep=Object.keys(S.tracks).filter(k=>k==='cam'||k==='tgt'||objs.some(o=>o.id===k)), tr={}; keep.forEach(k=>{ tr[k]=S.tracks[k]; });
    localStorage.setItem(STORE,JSON.stringify({objs:objs,tracks:tr,duration:S.duration,aspect:S.aspect,look:look,audio:S.audio,caps:S.caps||[],vo:S.vo||null,exp:S.exp||[],
      cam:{p:camNode.position.toArray()},tgt:{p:tgtNode.position.toArray()}}));
  }catch(err){}
}
function readSaved(){
  try{
    const raw=localStorage.getItem(STORE); if(!raw) return null;
    const d=JSON.parse(raw); if(!d||!Array.isArray(d.objs)||!d.objs.length||!d.cam||!d.tgt) return null; return d;
  }catch(err){ return null; }
}

/* ---------- look ---------- */
const dirAzEl=(az,el)=>{ const a=az*Math.PI/180,e=el*Math.PI/180; return new THREE.Vector3(Math.cos(e)*Math.sin(a),Math.sin(e),Math.cos(e)*Math.cos(a)); };
function applyLook(){
  const P=PRESETS[look.preset]||PRESETS.golden, dir=dirAzEl(look.az,look.el);
  sun.position.copy(dir).multiplyScalar(45); sun.intensity=look.sun; sun.color.copy(lin(P.sunColor));
  skyU.sunDir.value.copy(dir); skyU.sunCol.value.copy(lin(P.sunColor)); skyU.sunPow.value=clamp(look.sun/3.4,.2,1.4)*P.disc;
  skyU.top.value.copy(lin(P.top)); skyU.hor.value.copy(lin(P.hor)); skyU.gnd.value.copy(lin(P.gnd));
  scene.fog.color.copy(lin(P.fogC)); scene.fog.density=look.fog; ground.material.color.copy(lin(P.gnd).multiplyScalar(1.5));
  grade.uniforms.exposure.value=look.exposure; grade.uniforms.vignette.value=look.vignette; grade.uniforms.grain.value=look.grain;
  grade.uniforms.pix.value=look.pixar||0; pixarSync(); bloom.strength=look.bloom; bloom.enabled=look.bloom>.01;
  bokeh.uniforms.focus.value=look.focus; bokeh.uniforms.aperture.value=look.dof*.0006; bokeh.uniforms.maxblur.value=.004+look.dof*.018;
  bokeh.enabled=S.quality==='final'&&look.dof>.01;
  cinema.fov=look.fov; cinema.updateProjectionMatrix();
  scheduleEnv();
}
/* ---------- sizing + quality ---------- */
function setRenderSize(w,h){
  renderer.setSize(w,h,false); composer.setSize(w,h);
  edit.aspect=w/h; edit.updateProjectionMatrix(); cinema.aspect=w/h; cinema.updateProjectionMatrix();
  grade.uniforms.aspect.value=w/h; grade.uniforms.res.value.set(w,h);
}
function fit(){
  if(S.recording) return;
  const dpr=S.quality==='final'?Math.min(window.devicePixelRatio||1,2):1;
  const w=Math.max(2,Math.round(stage.clientWidth*dpr)), h=Math.max(2,Math.round(stage.clientHeight*dpr));
  setRenderSize(w,h);
}
function applyQuality(){
  const fin=S.quality==='final'||S.recording;
  const sz=fin?2048:1024;
  if(sun.shadow.mapSize.x!==sz){ sun.shadow.mapSize.set(sz,sz); if(sun.shadow.map){sun.shadow.map.dispose(); sun.shadow.map=null;} }
  bokeh.enabled=fin&&look.dof>.01;
  $$('#segQ button').forEach(b=>b.classList.toggle('on',b.dataset.q===S.quality));
}
function setAspect(a){
  S.aspect=a; stage.style.setProperty('--ar',String(a)); $('#selAspect').value=String(a);
  requestAnimationFrame(fit);
}
new ResizeObserver(()=>fit()).observe(stage);

/* ---------- picking in the viewport ---------- */
const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
let down=null, gizmoHit=false;
renderer.domElement.addEventListener('pointerdown',e=>{ down={x:e.clientX,y:e.clientY,t:performance.now()}; gizmoHit=tc.axis!==null; });
renderer.domElement.addEventListener('pointerup',e=>{
  if(!down||S.view!=='free'||S.recording||gizmoHit||tc.dragging||sculptActive()){ down=null; return; }
  const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y), dt=performance.now()-down.t; down=null;
  if(moved>6||dt>450) return;
  const r=renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
  if(rigPick(e.clientX,e.clientY)) return;
  ray.setFromCamera(ndc,edit);
  const hits=ray.intersectObjects([...nodes.values()],true);
  if(!hits.length){ if(S.sel) selectId(null); return; }
  let o=hits[0].object; while(o&&!(o.userData&&o.userData.id&&nodes.has(o.userData.id))) o=o.parent;
  if(o) selectId(o.userData.id);
});

/* ---------- export ---------- */
let downloads=null, rec=null, chunks=[], recMime='', prevState=null, cancelled=false, lastBlob=null, lastExt='webm';
function exportDims(){
  const short=+$('#selRes').value, a=S.aspect;
  let w=a>=1?Math.round(short*a):short, h=a>=1?short:Math.round(short/a);
  return {w:w-(w%2),h:h-(h%2),short:short};
}
function startExport(){
  if(S.recording){ cancelled=true; finishRecording(); return; }
  if(!window.MediaRecorder||!renderer.domElement.captureStream){ $('#expMsg').textContent='This browser cannot record video from the page.'; return; }
  const types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
  recMime=types.find(t=>MediaRecorder.isTypeSupported(t))||'';
  if(!recMime){ $('#expMsg').textContent='No supported video format found in this browser.'; return; }
  lastExt=recMime.indexOf('mp4')>=0?'mp4':'webm';
  const d=exportDims();
  prevState={view:S.view,q:S.quality,sel:S.sel};
  S.playing=false; S.recording=true; S.view='cam'; S.quality='final'; cancelled=false; applyStageClass();
  tc.detach(); applyQuality(); setRenderSize(d.w,d.h);
  $('#expVideo').hidden=true; $('#bSave').hidden=true; lastBlob=null;
  $('#bRender').textContent='Cancel recording'; $('#hudRec').hidden=false;
  $('#expMsg').textContent='Recording '+d.w+'×'+d.h+' in real time. Keep this tab open.';
  S.t=0; applyTracks(0); updatePlayhead();
  chunks=[];
  try{
    const stream=renderer.domElement.captureStream(S.fps);
    try{ if(auEnsure()&&AU.dest) AU.dest.stream.getAudioTracks().forEach(tk=>stream.addTrack(tk)); }catch(e){}
    rec=new MediaRecorder(stream,{mimeType:recMime,videoBitsPerSecond:d.short>=1080?14000000:8000000});
  }catch(err){ endRecordingState(); $('#expMsg').textContent='Recording could not start: '+(err&&err.message||'unknown error'); return; }
  rec.ondataavailable=ev=>{ if(ev.data&&ev.data.size) chunks.push(ev.data); };
  rec.onstop=()=>{
    const blob=new Blob(chunks,{type:recMime.split(';')[0]});
    endRecordingState();
    if(cancelled||!blob.size){ $('#expMsg').textContent=cancelled?'Recording cancelled.':'Nothing was recorded. Try again.'; return; }
    lastBlob=blob; const v=$('#expVideo');
    try{ v.src=URL.createObjectURL(blob); v.hidden=false; }catch(err){}
    $('#expMsg').textContent='Done. '+(blob.size/1048576).toFixed(1)+' MB '+lastExt.toUpperCase()+'.';
    $('#bSave').hidden=!downloads;
    if(!downloads) $('#expMsg').textContent+=' Saving files works when this page is open in Claude.';
  };
  S.playing=true; syncPlay();
  rec.start(500);
}
function finishRecording(){
  S.playing=false; syncPlay();
  if(rec&&rec.state!=='inactive'){ try{rec.stop();}catch(err){ endRecordingState(); } } else endRecordingState();
}
function endRecordingState(){
  if(!S.recording) return;
  S.recording=false; S.playing=false; syncPlay();
  S.view=prevState.view; S.quality=prevState.q; $('#hudRec').hidden=true;
  $('#bRender').textContent='Render Animation'; $('#expBar').style.width='0';
  applyQuality(); fit(); setView(S.view); if(prevState.sel&&nodes.has(prevState.sel)) selectId(prevState.sel);
}
async function saveVideo(){
  if(!lastBlob||!downloads) return;
  try{ await downloads.save({filename:'slate-studio-scene.'+lastExt,data:lastBlob}); toast('Video saved.'); }
  catch(err){ if(err&&err.code==='declined') return; toast('Could not save the video ('+((err&&err.code)||'error')+').'); }
}

