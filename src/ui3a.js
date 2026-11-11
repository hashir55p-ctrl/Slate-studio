
/* ---------- tools, views, workspaces ---------- */
const root=$('#app');
const TOOLS=[{id:'select',ic:IC.select,t:'Select (no gizmo)'},{id:'translate',ic:IC.move,t:'Move'},{id:'rotate',ic:IC.rotate,t:'Rotate'},{id:'scale',ic:IC.scale,t:'Scale'}];
function buildTools(){
  const box=$('#tools');
  TOOLS.forEach(t=>{
    const b=document.createElement('button'); b.type='button'; b.className='tbtn'; b.dataset.tool=t.id; b.innerHTML=t.ic; b.title=t.t; b.setAttribute('aria-label',t.t);
    b.addEventListener('click',()=>setMode(t.id)); box.appendChild(b);
  });
  const sp=document.createElement('div'); sp.className='sepv'; box.appendChild(sp);
  const cb=document.createElement('button'); cb.type='button'; cb.className='tbtn'; cb.id='toolCam'; cb.innerHTML=IC.camera; cb.title='Toggle camera view'; cb.setAttribute('aria-label','Toggle camera view');
  cb.addEventListener('click',()=>{ if(!S.recording) setView(S.view==='free'?'cam':'free'); }); box.appendChild(cb);
}
function applyStageClass(){ stage.className=S.view==='free'?'free':'cam'; }
function syncShading(){ $('#shD').classList.toggle('on',S.quality==='draft'); $('#shF').classList.toggle('on',S.quality==='final'); }
function setView(v){
  S.view=v; applyStageClass(); orbit.enabled=(v==='free'); attachGizmo();
  $('#hudA').textContent=v==='free'?'User Perspective':'Camera Perspective';
  $('#toolCam').classList.toggle('on',v==='cam');
  $$('#tools [data-tool]').forEach(b=>{ b.disabled=v==='cam'; });
  syncShading(); requestAnimationFrame(fit);
}
function setMode(m){
  S.mode=m; $$('#tools [data-tool]').forEach(b=>b.classList.toggle('on',b.dataset.tool===m));
  const t=TOOLS.find(x=>x.id===m); const tn=$('#toolName'); if(tn) tn.textContent=t?t.t.replace(' (no gizmo)',''):m;
  attachGizmo(); sculptMode(m);
}
function setWorkspace(ws){
  root.dataset.ws=ws; $$('#wsp button').forEach(b=>b.classList.toggle('on',b.dataset.ws===ws));
  if(S.recording) return;
  if(ws==='render'){ setView('cam'); showTab('output'); } else setView('free');
  requestAnimationFrame(fit);
}
function resetView(){ edit.position.set(10,6.5,12); orbit.target.set(0,1.2,0); orbit.update(); }
function resetScene(){
  if(S.recording) return;
  S.playing=false; syncPlay();
  loadProject(demoProject()); kochiEnv(false);
  Object.assign(look,{preset:'golden',az:48,el:9,sun:3.6,exposure:1.05,bloom:.45,dof:0,focus:9,vignette:.45,grain:.05,pixar:0,fog:.022,fov:40});
  setAspect(2.39); applyTracks(0); applyLook(); refreshLook(); markPreset();
  renderTimeline(); renderOutliner(); renderProps(); queueSave(); toast('Scene reset to the demo shot.');
}
function addType(t){
  const sp=mkSpec(t,{p:[orbit.target.x+(Math.random()-.5)*2,t==='light'?2.5:0,orbit.target.z+(Math.random()-.5)*2]});
  addNode(sp); selectId(sp.id); renderTimeline(); queueSave();
}
function renderAnim(){ showTab('output'); setWorkspaceKeep(); startExport(); }
function setWorkspaceKeep(){ /* stay in the current workspace while rendering */ }

/* ---------- playback ---------- */
function syncPlay(){ const b=$('#tPlay'); b.innerHTML=S.playing?IC.pause:IC.play; b.setAttribute('aria-label',S.playing?'Pause':'Play'); b.classList.toggle('on',S.playing); }
function togglePlay(){
  if(S.recording) return;
  if(!S.playing&&S.t>=S.duration-1e-3) S.t=0;
  S.playing=!S.playing; syncPlay();
}

/* ---------- menus ---------- */
const keyHere=()=>{ if(S.sel) addKey(S.sel); else toast('Select the camera or an object first.'); };
const MENUS={
  file:()=>[{l:'Welcome and how to start',fn:showWelcome},{l:()=>(typeof chatLink!=='undefined'&&chatLink.on?'\u2713 ':'')+'Chat link (Claude in chat edits this studio)',fn:()=>chatLinkToggle()},...(window.slateKeyDialog?[{l:'Claude API key...',fn:()=>window.slateKeyDialog()}]:[]),{l:'New empty scene',fn:newEmptyScene},{sep:1},{l:'Copy project (text)',fn:projectCopy},{l:'Open project from pasted text...',fn:()=>showProjectPaste()},{sep:1},{l:'New (reset to demo scene)',fn:resetScene},{sep:1},{l:'Render Animation',k:'Render tab',fn:renderAnim},{l:'Export for Blender (.txt)',fn:exportBlender},{info:1,l:'Your scene saves to this browser automatically.'}],
  edit:()=>[{l:'Rig and pose (open)',fn:openRigTab},{sep:1},{l:'Duplicate Object',fn:duplicateSel},{l:'Delete Object',k:'X',fn:deleteSel},{sep:1},{l:'Insert Keyframe',k:'K',fn:keyHere},{l:'Delete Keyframe',k:'Delete',fn:deleteKey},{sep:1},{l:()=>(S.autokey?'✓ ':'')+'Auto Keying',fn:()=>setAuto(!S.autokey)}],
  render:()=>[{l:'Render Animation',fn:renderAnim},{l:'View Camera',k:'Numpad 0',fn:()=>setView('cam')}],
  window:()=>[{l:()=>(root.classList.contains('hide-side')?'Show':'Hide')+' Outliner and Properties',fn:()=>{ root.classList.toggle('hide-side'); requestAnimationFrame(fit); }},
    {l:()=>(root.classList.contains('hide-tl')?'Show':'Hide')+' Timeline',fn:()=>{ root.classList.toggle('hide-tl'); requestAnimationFrame(fit); }}],
  help:()=>[{info:1,l:'Space: play or pause'},{info:1,l:'K: insert keyframe on the selection'},{info:1,l:'Delete: remove the selected keyframe'},{info:1,l:'Drag keyframe diamonds to retime them'},{info:1,l:'Two fingers: pan and zoom the viewport'},{info:1,l:'Sculpt tool: one finger on the model sculpts'}],
  vview:()=>[{l:'Free View',fn:()=>setView('free')},{l:'Camera View',k:'Numpad 0',fn:()=>setView('cam')},{sep:1},{l:'Reset View',fn:resetView}],
  vadd:()=>ADDABLE.map(t=>({l:TYPES[t],fn:()=>addType(t)})).concat([{sep:1},{l:'Sculpt (clay)...',fn:()=>{ showTab('sculpt'); toast('Pick a shape in the Sculpt tab.'); }},{l:'Import GLB model...',fn:openGlb},{l:'Ask Claude to model...',fn:()=>showTab('ai')}]),
  vobj:()=>[{l:'Duplicate',fn:duplicateSel},{l:'Delete',k:'X',fn:deleteSel},{sep:1},{l:'Insert Keyframe',k:'K',fn:keyHere}]
};

/* ---------- navigation gizmo + hud ---------- */
const ng=$('#navG'), ngx=ng.getContext('2d'), _q=new THREE.Quaternion(), _v=new THREE.Vector3();
const AXES=[['X',1,0,0,'#e8505b'],['Y',0,1,0,'#7bc043'],['Z',0,0,1,'#4c8bf5']];
function drawNav(act){
  const w=ng.width, c=w/2, R=w*.33; ngx.clearRect(0,0,w,w); _q.copy(act.quaternion).invert();
  const items=[];
  AXES.forEach(a=>[1,-1].forEach(sg=>{ _v.set(a[1]*sg,a[2]*sg,a[3]*sg).applyQuaternion(_q); items.push({l:a[0],c:a[4],x:_v.x,y:_v.y,z:_v.z,sg:sg}); }));
  items.sort((p,q)=>p.z-q.z);
  ngx.textAlign='center'; ngx.textBaseline='middle'; ngx.font='bold 22px Inter,sans-serif';
  items.forEach(it=>{
    const px=c+it.x*R, py=c-it.y*R;
    if(it.sg>0){ ngx.strokeStyle=it.c; ngx.lineWidth=5; ngx.beginPath(); ngx.moveTo(c,c); ngx.lineTo(px,py); ngx.stroke(); }
    ngx.globalAlpha=it.sg>0?1:.45; ngx.fillStyle=it.c; ngx.beginPath(); ngx.arc(px,py,it.sg>0?17:13,0,Math.PI*2); ngx.fill(); ngx.globalAlpha=1;
    if(it.sg>0){ ngx.fillStyle='#101010'; ngx.fillText(it.l,px,py+1); }
  });
}
let hudCache='', frameN=0;
function updateHud(){
  const n=S.sel&&nodes.get(S.sel), s='('+frameOf(S.t)+') Collection'+(n?' | '+n.userData.name:'');
  if(s!==hudCache){ hudCache=s; $('#hudB').textContent=s; }
}

/* ---------- wiring ---------- */
function wire(){
  $$('[data-menu]').forEach(b=>b.addEventListener('click',()=>openPopup(b,MENUS[b.dataset.menu]())));
  $('#wsp').addEventListener('click',e=>{ const b=e.target.closest('button'); if(b) setWorkspace(b.dataset.ws); });
  $('#shD').addEventListener('click',()=>{ if(S.recording) return; S.quality='draft'; applyQuality(); syncShading(); fit(); });
  $('#shF').addEventListener('click',()=>{ if(S.recording) return; S.quality='final'; applyQuality(); syncShading(); fit(); });
  $('#tPlay').addEventListener('click',togglePlay);
  $('#tStart').addEventListener('click',()=>{ if(S.recording) return; S.playing=false; syncPlay(); seek(0); });
  $('#tEnd').addEventListener('click',()=>{ if(S.recording) return; S.playing=false; syncPlay(); seek(S.duration); });
  $('#tPrevKey').addEventListener('click',()=>jumpKey(-1));
  $('#tNextKey').addEventListener('click',()=>jumpKey(1));
  $('#tRec').addEventListener('click',()=>setAuto(!S.autokey));
  $('#tLoop').addEventListener('click',()=>setLoop(!S.loop));
  $('#tCur').addEventListener('change',e=>{ const v=parseFloat(e.target.value); if(!isFinite(v)||S.recording) return; S.playing=false; syncPlay(); seek(v/S.fps); });
  $('#tEndF').addEventListener('change',e=>{
    const v=Math.round(parseFloat(e.target.value)); if(!isFinite(v)||S.recording) return;
    S.duration=clamp(v,S.fps,S.fps*60)/S.fps; S.t=Math.min(S.t,S.duration); renderTimeline(); queueSave();
  });
  $('#selFps').addEventListener('change',e=>{ if(S.recording) return; S.fps=+e.target.value; renderTimeline(); });
  $('#selEase').addEventListener('change',e=>{ S.ease=e.target.value; applyTracks(S.t); });
  $('#selAspect').addEventListener('change',e=>{ setAspect(+e.target.value); queueSave(); });
  $('#bKey').addEventListener('click',keyHere);
  $('#bDelKey').addEventListener('click',deleteKey);
  $('#bRender').addEventListener('click',startExport);
  $('#bSave').addEventListener('click',saveVideo);
  addEventListener('keydown',e=>{
    const tag=(e.target&&e.target.tagName)||''; if(/INPUT|SELECT|TEXTAREA/.test(tag)) return;
    if(e.code==='Space'){ e.preventDefault(); togglePlay(); }
    else if(e.key==='k'||e.key==='K') keyHere();
    else if(e.key==='Delete') deleteKey();
    else if(e.key==='x'||e.key==='X') deleteSel();
    else if(e.code==='Numpad0') setView(S.view==='free'?'cam':'free');
  });
  addEventListener('pagehide',saveNow);
}

/* ---------- main loop ---------- */
let last=performance.now();
function tick(now){
  requestAnimationFrame(tick);
  const dt=Math.min(S.vo?0.6:0.1,(now-last)/1000); last=now;
  if(S.playing){
    S.t+=dt; try{ const vc=vbClock(); if(vc!=null&&Math.abs(vc-S.t)<2) S.t=vc; }catch(e){}
    if(S.t>=S.duration){
      if(S.recording){ S.t=S.duration; applyTracks(S.t); updatePlayhead(); finishRecording(); }
      else if(S.loop) S.t=0; else { S.t=S.duration; S.playing=false; syncPlay(); }
    }
    applyTracks(S.t); updatePlayhead();
    if(S.recording) $('#expBar').style.width=(S.t/S.duration*100)+'%';
  }
  try{ auUpdate(S.t,S.playing); }catch(e){} try{ capUpdate(S.t); }catch(e){} try{ voiceUpdate(S.t,S.playing); }catch(e){} try{ crUpdate(S.t,S.playing,dt); }catch(e){ if(!window._crE){ window._crE=1; console.warn('creator',e); } } try{ mfUpdate(S.t,S.playing,dt); }catch(e){ if(!window._mfE){ window._mfE=1; console.warn('meshface',e); } }
  WT.value=now/1000; if(kochiOn) kochiAnim(now/1000);
  walkPose(); updateRig();
  order.forEach(id=>{ const n=nodes.get(id); if(n&&n.userData.mixer) n.userData.mixer.setTime(S.t); });
  const act=S.view==='cam'?cinema:edit;
  renderPass.camera=act; bokeh.camera=act; bokeh.uniforms.nearClip.value=act.near; bokeh.uniforms.farClip.value=act.far;
  sky.position.copy(act.position);
  const showRig=S.view==='free'&&!S.recording;
  camNode.visible=showRig; tgtNode.visible=showRig; link.visible=showRig; grid.visible=showRig&&!kochiOn; tc.visible=showRig;
  if(S.view==='free'&&orbit.enabled) orbit.update();
  grade.uniforms.time.value=(now%997)/997; if(!(frameN%45)){ pixarSync(); if(typeof recolorChars==="function") recolorChars(); if(window.jbaseTick) jbaseTick(); }
  const useComposer=(S.quality==='final'||S.recording)&&!S.composerBroken;
  try{
    if(useComposer){ renderer.toneMapping=THREE.NoToneMapping; renderer.outputEncoding=THREE.LinearEncoding; composer.render(dt); }
    else { renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=look.exposure; renderer.outputEncoding=THREE.sRGBEncoding; renderer.render(scene,act); }
  }catch(err){
    if(useComposer){ S.composerBroken=true; toast('Final effects are not supported on this device. Using Solid preview.'); }
  }
  if(!(++frameN%3)){ drawNav(act); updateHud(); if(!S.playing) refreshTransform(); }
  $('#hudRec').hidden=!S.recording;
}

