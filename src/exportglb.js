/* ---------- export a rigged character (skeleton, face, fingers, keyframe animation) as .glb for Blender ---------- */
async function exportRigGLB(withAnim){
  const node=rigNode()||sculptTarget()||(S.sel&&S.sel!=='cam'&&S.sel!=='tgt'?nodes.get(S.sel):null); if(!node){ toast('Select a character or sculpt first.'); return; }
  try{ scEnd(); scMatcapSync(true); }catch(e){} const scs=[]; node.traverse(o=>{ if(o.userData&&o.userData.sc){ scs.push(o.userData.sc); if(o.userData.sc.mask) scColors(o.userData.sc,true); } });
  if(!THREE.GLTFExporter){ toast('The GLB exporter did not load. Check your connection and reload.'); return; }
  if(!downloads){ toast('Saving files only works when this page is opened from its card in the Claude app.'); return; }
  const id=node.userData.id, name=(node.userData.name||'character').replace(/[^\w\-]+/g,'_')||'character', t0=S.t, wasPlaying=S.playing; S.playing=false;
  const objs=[]; let ui=0; node.traverse(o=>{ if(o!==node&&!(o.isMesh&&!o.visible)){ objs.push(o); } });
  const named=[]; objs.forEach(o=>{ if(!o.name){ o.name='n'+(ui++); named.push(o); } });
  const seen=new Set(); objs.forEach(o=>{ let nm=o.name, k=1; while(seen.has(nm)) nm=o.name+'_'+(k++); if(nm!==o.name){ named.push(o); o.name=nm; } seen.add(o.name); });
  let clips=[];
  try{
    const ks=S.tracks[id]; const hasKeys=ks&&ks.length;
    if(withAnim&&(hasKeys||S.vo)){
      const dur=Math.max(.5,Math.min(S.duration,hasKeys?ks[ks.length-1].t:S.duration)), fps=S.fps, N=Math.floor(dur*fps)+1, times=[]; const rec=new Map(); objs.forEach(o=>rec.set(o,{q:[],p:[],s:[]}));
      for(let i=0;i<N;i++){ const t=i/fps; times.push(t); applyTracks(t); try{ crUpdate(t,true,1/fps); }catch(e){} try{ mfUpdate(t,true,1/fps); }catch(e){} node.updateMatrixWorld(true);
        objs.forEach(o=>{ const r=rec.get(o); r.q.push(o.quaternion.x,o.quaternion.y,o.quaternion.z,o.quaternion.w); r.p.push(o.position.x,o.position.y,o.position.z); r.s.push(o.scale.x,o.scale.y,o.scale.z); }); }
      const tracks=[], moved=(a,n)=>{ for(let i=n;i<a.length;i++) if(Math.abs(a[i]-a[i%n])>1e-5) return true; return false; };
      objs.forEach(o=>{ const r=rec.get(o);
        if(moved(r.q,4)) tracks.push(new THREE.QuaternionKeyframeTrack(o.name+'.quaternion',times,r.q));
        if(moved(r.p,3)) tracks.push(new THREE.VectorKeyframeTrack(o.name+'.position',times,r.p));
        if(moved(r.s,3)) tracks.push(new THREE.VectorKeyframeTrack(o.name+'.scale',times,r.s)); });
      if(tracks.length) clips=[new THREE.AnimationClip('Slate take',dur,tracks)];
    }
    S.t=t0; applyTracks(t0); try{ crUpdate(t0,false,.033); }catch(e){}
    const ud=new Map(); node.traverse(o=>{ ud.set(o,o.userData); o.userData={}; });
    let buf; try{ buf=await new Promise((res,rej)=>{ new THREE.GLTFExporter().parse(node,res,{binary:true,animations:clips,trs:true,onlyVisible:true,truncateDrawRange:true,embedImages:true,maxTextureSize:2048}); if(false) rej(); }); } finally { ud.forEach((v,o)=>{ o.userData=v; }); }
    await downloads.save({filename:name+'.glb',data:new Blob([buf],{type:'model/gltf-binary'})});
    toast('Saved '+name+'.glb'+(clips.length?' with '+clips[0].tracks.length+' animated parts.':'.')+' In Blender: File, Import, glTF 2.0.');
  }catch(err){ if(!err||err.code!=='declined') toast('Could not export: '+((err&&err.message)||'error')); }
  finally{ scs.forEach(sc=>scColors(sc)); named.forEach(o=>{ if(/^n\d+$/.test(o.name)||/_\d+$/.test(o.name)) o.name=''; }); S.t=t0; S.playing=wasPlaying; try{ applyTracks(t0); }catch(e){} }
}
