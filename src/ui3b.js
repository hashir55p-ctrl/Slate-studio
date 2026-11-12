/* ---------- boot ---------- */
(function boot(){
  const saved=readSaved();
  if(saved){
    try{
      loadProject(saved);
      if(saved.look) Object.assign(look,saved.look);
      if(!PRESETS[look.preset]) look.preset='golden';
      if(saved.aspect) S.aspect=saved.aspect;
    }catch(err){ loadProject(demoProject()); }
  } else loadProject(demoProject());
  try{ scIdbRestore(); }catch(e){}
  kochiEnv(isKochi(),false);
  $('#shD').innerHTML=IC.solid; $('#shF').innerHTML=IC.matprev;
  $('#tStart').innerHTML=IC.start; $('#tPrevKey').innerHTML=IC.prevKey; $('#tNextKey').innerHTML=IC.nextKey; $('#tEnd').innerHTML=IC.end;
  $('#tRec').innerHTML=IC.rec; $('#tLoop').innerHTML=IC.loop;
  buildTools(); buildTabs(); buildStaticPanes(); buildAiPane(); buildSculptPane(); buildRigPane(); buildFacePane(); try{ buildMocapPanel(); }catch(e){ console.warn(e); } buildBlenderPanel(); wire(); syncPlay(); setAuto(S.autokey); setLoop(S.loop);
  stage.style.setProperty('--ar',String(S.aspect)); $('#selAspect').value=String(S.aspect);
  if($('#selAspect').value!==String(S.aspect)) $('#selAspect').value='2.39';
  applyLook(); refreshLook(); applyQuality(); setView('free'); setMode('translate');
  applyTracks(0); renderTimeline(); renderOutliner(); renderProps(); showTab('render'); fit(); rebuildEnv();
  $('#stL').textContent='Build 150 \u00b7 '+(renderer.capabilities.isWebGL2?'WebGL2':'WebGL1')+(half?' \u00b7 HDR':'')+' \u00b7 Select: tap an object. Orbit: drag. Pan and zoom: two fingers.';
  try{ if(location.hash==='#dev') window.__dev={S,nodes,scene,edit,cinema,orbit,renderer,THREE,get:id=>nodes.get(id),sc:{scRefine,scSetTopo,scAdj,scUpdate}}; }catch(e){}
  try{ loadEmbedded(); }catch(e){}
  try{ if(!saved&&!localStorage.getItem('slate-welcome-v1')){ localStorage.setItem('slate-welcome-v1','1'); setTimeout(showWelcome,500); } }catch(e){ if(!saved) setTimeout(showWelcome,500); }
  try{ chatLinkStart(); }catch(e){}
  requestAnimationFrame(tick);
  try{
    if(window.claude&&window.claude.use) window.claude.use('downloads').then(d=>{ downloads=d; }).catch(()=>{});
  }catch(err){}
})();
})();
