
/* ---------- properties editor ---------- */
const ui={};
const TABS=[
  {id:'tool',ic:IC.tTool,t:'Tool',pane:'pTool'},
  {id:'render',ic:IC.tRender,t:'Render',pane:'pRender'},
  {id:'output',ic:IC.tOutput,t:'Output',pane:'pOutput'},
  {id:'world',ic:IC.tWorld,t:'World',pane:'pWorld'},
  {id:'object',ic:IC.tObject,t:'Object',pane:'pObject',needSel:true},
  {id:'data',ic:IC.tData,t:'Data',pane:'pData',needSel:true},
  {id:'mat',ic:IC.tMat,t:'Material',pane:'pMat',needSel:true},
  {id:'ai',ic:IC.tAI,t:'AI and Import',pane:'pAi'}
];
let ptab='render';
function buildTabs(){
  const box=$('#ptabs');
  TABS.forEach(t=>{
    const b=document.createElement('button'); b.type='button'; b.dataset.tab=t.id; b.innerHTML=t.ic; b.title=t.t; b.setAttribute('aria-label',t.t+' properties');
    b.addEventListener('click',()=>showTab(t.id)); box.appendChild(b);
  });
}
function showTab(id){
  const t=TABS.find(x=>x.id===id); if(!t) return;
  if(t.needSel&&!S.sel) id='render';
  ptab=id;
  $$('#ptabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===id));
  TABS.forEach(x=>{ $('#'+x.pane).hidden=x.id!==id; });
}
function syncTabs(){
  $$('#ptabs button').forEach(b=>{ const t=TABS.find(x=>x.id===b.dataset.tab); b.disabled=!!(t.needSel&&!S.sel); });
  showTab(ptab);
}

/* look fields */
const lookFields={};
const fovFmt=v=>Math.round(v)+'° · '+Math.round(24/(2*Math.tan(v*Math.PI/360)))+' mm';
function lookField(k,label,min,max,step,fmt){
  const f=rangeField(label,min,max,step,()=>look[k],v=>{ look[k]=v; applyLook(); },fmt,()=>{ if(k==='fov'&&S.autokey) addKey('cam'); queueSave(); });
  lookFields[k]=f; return f;
}
function refreshLook(){ Object.keys(lookFields).forEach(k=>{ const f=lookFields[k]; if(f&&f.isConnected) f.update(); }); }
function syncFov(){ const f=lookFields.fov; if(f&&f.isConnected) f.update(); }
function applyPreset(k){
  const P=PRESETS[k]; if(!P) return;
  look.preset=k; ['az','el','sun','exposure','bloom','fog'].forEach(x=>{ look[x]=P[x]; });
  applyLook(); refreshLook(); markPreset(); queueSave();
}
function markPreset(){ $$('#pWorld .pbtn[data-p]').forEach(b=>b.classList.toggle('on',b.dataset.p===look.preset)); }
function setAuto(v){ S.autokey=!!v; $('#tRec').classList.toggle('on',S.autokey); $('#tRec').style.color=S.autokey?'#ff5a4a':''; if(ui.chkAuto) ui.chkAuto.checked=S.autokey; }
function setLoop(v){ S.loop=!!v; $('#tLoop').classList.toggle('on',S.loop); if(ui.chkLoop) ui.chkLoop.checked=S.loop; }
function chk(label,get,set){
  const l=document.createElement('label'); l.className='chkr'; const i=document.createElement('input'); i.type='checkbox'; i.checked=get();
  i.addEventListener('change',()=>set(i.checked)); l.append(i,document.createTextNode(label)); l.input=i; return l;
}
function buildStaticPanes(){
  /* Tool */
  const tn=document.createElement('p'); tn.id='toolName'; tn.className='note'; tn.style.color='var(--fg)'; tn.textContent='Move';
  const ca=chk('Auto Keying',()=>S.autokey,setAuto), cl=chk('Loop Playback',()=>S.loop,setLoop); ui.chkAuto=ca.input; ui.chkLoop=cl.input;
  $('#pTool').append(panel('Active Tool',[tn,noteEl('Tools act on the selected object in Free view. Pick them in the toolbar.')]),
    panel('Options',[ca,cl,noteEl('With Auto Keying on, each move at the playhead writes a keyframe.')]));
  /* Render */
  $('#pRender').append(
    panel('Render Engine',[noteEl('Real-time (WebGL). Material Preview adds shadows and depth of field in the viewport and in the render.')]),
    panel('Depth of Field',[lookField('dof','Aperture',0,1,.05,f2),lookField('focus','Focus Distance',1,40,.5,v=>v.toFixed(1)+' m')]),
    panel('Bloom',[lookField('bloom','Intensity',0,1.5,.05,f2)]),
    panel('Color Management',[lookField('exposure','Exposure',.3,2.5,.05,f2)]),
    panel('Post Processing',[lookField('vignette','Vignette',0,1,.05,f2),lookField('grain','Film Grain',0,.25,.01,f2),lookField('pixar','Pixar look',0,1,.05,f2)]));
  /* World */
  const pg=document.createElement('div'); pg.className='g2';
  Object.keys(PRESETS).forEach(k=>{ const b=document.createElement('button'); b.type='button'; b.className='pbtn'; b.dataset.p=k; b.textContent=PRESETS[k].label; b.addEventListener('click',()=>applyPreset(k)); pg.appendChild(b); });
  $('#pWorld').append(
    panel('Sky Preset',[pg]),
    panel('Sun',[lookField('az','Rotation',0,360,1,v=>Math.round(v)+'°'),lookField('el','Elevation',-5,70,1,v=>Math.round(v)+'°'),lookField('sun','Strength',0,8,.1,f1)]),
    panel('Mist',[lookField('fog','Haze',0,.08,.002,f3)]));
  markPreset();
}

/* object, data, material panes */
const paintNode=(node,fn)=>{ node.traverse(o=>{ if(o.isMesh&&o.userData.paint) fn(o.material); }); };
let xyzLive=[];
function xyz(label,vals,commit,step){
  const wrap=document.createElement('div'); wrap.className='xyz'; const ins=[];
  ['X','Y','Z'].forEach((ax,i)=>{
    const l=document.createElement('label'), s=document.createElement('span'), inp=document.createElement('input');
    s.textContent=ax; inp.type='number'; inp.step=step; inp.inputMode='decimal'; inp.setAttribute('aria-label',label+' '+ax);
    inp.addEventListener('change',()=>{ const v=parseFloat(inp.value); if(isFinite(v)) commit(i,v); });
    l.append(s,inp); wrap.appendChild(l); ins.push(inp);
  });
  wrap.refresh=()=>{ const v=vals(); ins.forEach((inp,k)=>{ if(document.activeElement!==inp) inp.value=String(+v[k].toFixed(3)); }); };
  wrap.refresh(); xyzLive.push(wrap); return row(label,wrap);
}
function refreshTransform(){ xyzLive.forEach(w=>{ if(w.isConnected) w.refresh(); }); }
function keyAfterEdit(){ if(S.autokey&&S.sel) addKey(S.sel); queueSave(); }
function colorInput(get,set){
  const i=document.createElement('input'); i.type='color'; i.value=get(); i.setAttribute('aria-label','Color');
  i.style.cssText='width:100%;height:24px;padding:0;border:0;border-radius:4px;background:var(--btn)';
  i.addEventListener('input',()=>set(i.value)); i.addEventListener('change',queueSave); return i;
}
function renderProps(){
  xyzLive=[];
  const po=$('#pObject'), pd=$('#pData'), pm=$('#pMat'); po.innerHTML=''; pd.innerHTML=''; pm.innerHTML='';
  const n=S.sel&&nodes.get(S.sel);
  if(!n){ po.appendChild(noteEl('Select an object to edit it.')); syncTabs(); return; }
  const sp=n.userData.spec, fixed=!sp;
  /* Object */
  const nm=document.createElement('input'); nm.type='text'; nm.className='txt'; nm.value=n.userData.name; nm.setAttribute('aria-label','Object name'); nm.disabled=fixed;
  nm.addEventListener('change',()=>{ const v=nm.value.trim()||n.userData.name; n.userData.name=v; if(sp) sp.name=v; renderOutliner(); renderTimeline(); queueSave(); });
  const tf=[xyz('Location',()=>n.position.toArray(),(i,v)=>{ n.position.setComponent(i,v); keyAfterEdit(); },.1)];
  if(!fixed){
    tf.push(xyz('Rotation',()=>[n.rotation.x,n.rotation.y,n.rotation.z].map(r=>r*180/Math.PI),(i,v)=>{ n.rotation['xyz'[i]]=v*Math.PI/180; keyAfterEdit(); },1));
    tf.push(xyz('Scale',()=>n.scale.toArray(),(i,v)=>{ n.scale.setComponent(i,Math.max(.01,v)); keyAfterEdit(); },.1));
  }
  po.append(panel('Name',[nm]),panel('Transform',tf));
  /* Data */
  if(S.sel==='cam'){
    pd.append(panel('Lens',[lookField('fov','Field of View',12,90,1,fovFmt),noteEl('Focal length is shown for a 36 × 24 mm sensor.')]),
      panel('Camera',[noteEl('The camera always aims at Camera Target. Key both to design a move.')]),panel('Camera Moves',[camMoveUI()],true));
  } else if(S.sel==='tgt'){
    pd.appendChild(noteEl('Camera Target has no extra data. Move it to change where the camera looks.'));
  } else if(sp.type==='orb'||sp.type==='light'){
    pd.appendChild(panel('Light',[row('Color',colorInput(()=>sp.color,v=>{
      sp.color=v; n.traverse(o=>{ if(o.userData.glow){ if(o.isMesh) o.material.emissive.copy(lin(v)); if(o.isLight) o.color.copy(lin(v)); } });
    }))]));
  } else pd.appendChild(noteEl('Mesh objects use the Material tab for their look.'));
  /* Material */
  if(sp&&sp.type!=='orb'&&sp.type!=='light'&&sp.type!=='custom'&&sp.type!=='glb'){
    pm.appendChild(panel('Surface',[
      row('Base Color',colorInput(()=>sp.color,v=>{ sp.color=v; paintNode(n,m=>m.color.copy(lin(v))); })),
      rangeField('Roughness',0,1,.01,()=>sp.rough,v=>{ sp.rough=v; paintNode(n,m=>{ m.roughness=v; }); },f2,queueSave),
      rangeField('Metallic',0,1,.01,()=>sp.metal,v=>{ sp.metal=v; paintNode(n,m=>{ m.metalness=v; }); },f2,queueSave)]));
  } else pm.appendChild(noteEl(!sp?'This object has no material.':(sp.type==='custom'||sp.type==='glb')?'Models keep the colors of their own parts and materials.':'Lights use the Data tab for color.'));
  syncTabs();
}
function duplicateSel(){
  const n=S.sel&&nodes.get(S.sel), sp=n&&n.userData.spec;
  if(!sp){ toast('Select an object first.'); return; }
  if(sp.transient){ toast('Imported models cannot be duplicated yet.'); return; }
  sculptFlush();
  const s2=mkSpec(sp.type,{embed:sp.embed,gsize:sp.gsize,shape:sp.shape,size:sp.size&&sp.size.slice(),detail:sp.detail,data:sp.data,pose:rigClone(sp.pose),parts:sp.parts,name:sp.name.replace(/\.\d+$/,'')+'.001',color:sp.color,rough:sp.rough,metal:sp.metal,
    p:[n.position.x+1.2,n.position.y,n.position.z+1.2],r:[n.rotation.x,n.rotation.y,n.rotation.z],s:n.scale.toArray()});
  addNode(s2); selectId(s2.id); renderTimeline(); queueSave();
}
function deleteSel(){
  const n=S.sel&&nodes.get(S.sel);
  if(!n||!n.userData.spec){ toast('Select an object first. The camera cannot be deleted.'); return; }
  removeNode(S.sel); renderTimeline(); renderOutliner(); renderProps(); queueSave();
}
