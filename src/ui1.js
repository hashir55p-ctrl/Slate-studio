
/* ================= Blender-style interface ================= */
const svg=(d,extra)=>'<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" '+(extra||'')+'>'+d+'</svg>';
const stroke='fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
const IC={
  select:svg('<path d="M4 2l10 7-4.4 1.1 2.4 4.6-2 1-2.4-4.6L4 15z"/>'),
  move:svg('<path d="M9 1l3 3H10v4h4V6l3 3-3 3v-2h-4v4h2l-3 3-3-3h2v-4H4v2L1 9l3-3v2h4V4H6z"/>'),
  rotate:svg('<path d="M14.5 6A6 6 0 1 0 15 10" '+stroke+'/><path d="M10 1.5l5 .5-1 5z"/>'),
  scale:svg('<rect x="2" y="8" width="8" height="8" '+stroke+'/><path d="M8 10l8-8M11 2h5v5" '+stroke+'/>'),
  camera:svg('<path d="M1.5 5h10v8h-10zM11.5 8l5-3v8l-5-3z"/>'),
  start:svg('<rect x="3" y="3" width="2.4" height="12"/><path d="M15 3v12L7 9z"/>'),
  end:svg('<rect x="12.6" y="3" width="2.4" height="12"/><path d="M3 3v12l8-6z"/>'),
  prevKey:svg('<path d="M9 3v12L2 9z"/><path d="M15 5l3.5 4L15 13l-3.5-4z"/>'),
  nextKey:svg('<path d="M9 3v12l7-6z"/><path d="M3 5l3.5 4L3 13-.5 9z"/>'),
  play:svg('<path d="M4 2v14l12-7z"/>'),
  pause:svg('<rect x="3" y="2" width="4.4" height="14"/><rect x="10.6" y="2" width="4.4" height="14"/>'),
  rec:svg('<circle cx="9" cy="9" r="5"/>'),
  loop:svg('<path d="M3 8V7a3 3 0 0 1 3-3h7l-2-2M15 10v1a3 3 0 0 1-3 3H5l2 2" '+stroke+'/>'),
  eye:svg('<path d="M1 9s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" '+stroke+'/><circle cx="9" cy="9" r="2.3"/>'),
  eyeOff:svg('<path d="M1 9s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" '+stroke+' opacity=".5"/><path d="M3 15L15 3" '+stroke+'/>'),
  solid:svg('<circle cx="9" cy="9" r="6"/>'),
  matprev:svg('<circle cx="9" cy="9" r="6" '+stroke+'/><path d="M9 3a6 6 0 0 1 0 12z"/>'),
  tTool:svg('<path d="M3 15l7-7a4 4 0 0 1 5-5l-2.6 2.6.8 2 2 .8L18 3a4 4 0 0 1-5 5l-7 7a1.6 1.6 0 0 1-3 0z" '+stroke+'/>'),
  tRender:svg('<rect x="2" y="4" width="14" height="10" rx="1" '+stroke+'/><circle cx="9" cy="9" r="2.6" '+stroke+'/>'),
  tOutput:svg('<rect x="2.5" y="2.5" width="13" height="13" rx="1" '+stroke+'/><path d="M2.5 6.5h13M2.5 11.5h13M6.5 2.5v13M11.5 2.5v13" '+stroke+' opacity=".7"/>'),
  tWorld:svg('<circle cx="9" cy="9" r="6.5" '+stroke+'/><path d="M2.5 9h13M9 2.5c3 3 3 10 0 13M9 2.5c-3 3-3 10 0 13" '+stroke+'/>'),
  tObject:svg('<rect x="3.5" y="3.5" width="11" height="11" '+stroke+'/><path d="M3.5 7.5h11" '+stroke+' opacity=".6"/>'),
  tData:svg('<path d="M3 5h8v8H3zM11 8l4-2.5v7L11 10z" '+stroke+'/>'),
  tAI:svg('<path d="M7 1.5l1.7 4.8L13.5 8l-4.8 1.7L7 14.5 5.3 9.7.5 8l4.8-1.7z"/><path d="M14 10l.9 2.6L17.5 13.5l-2.6.9L14 17l-.9-2.6-2.6-.9 2.6-.9z"/>'),
  tMat:svg('<circle cx="9" cy="9" r="6.5" '+stroke+'/><path d="M5 6.5c1.5-2 4.5-2.5 7-1" '+stroke+' opacity=".7"/>')
};
const small=(d)=>'<svg width="13" height="13" viewBox="0 0 18 18" fill="currentColor" style="flex:none">'+d+'</svg>';
const TYPE_ICON={cam:small('<path d="M1.5 5h10v8h-10zM11.5 8l5-3v8l-5-3z"/>'),tgt:small('<path d="M9 2l7 7-7 7-7-7z" fill="none" stroke="currentColor" stroke-width="2"/>'),
  orb:small('<circle cx="9" cy="9" r="5.5"/>'),light:small('<circle cx="9" cy="9" r="5.5"/>'),
  mesh:small('<path d="M9 2l7 13H2z"/>')};
const iconFor=n=>TYPE_ICON[n.userData.type]||TYPE_ICON.mesh;

/* ---------- popup menus ---------- */
const popup=$('#popup'); let popBtn=null;
function closePopup(){ popup.hidden=true; if(popBtn){ popBtn.classList.remove('open'); popBtn=null; } }
function openPopup(btn,items){
  if(popBtn===btn){ closePopup(); return; }
  closePopup(); popup.innerHTML='';
  items.forEach(it=>{
    if(it.sep){ const s=document.createElement('div'); s.className='sep'; popup.appendChild(s); return; }
    if(it.info){ const d=document.createElement('div'); d.className='info'; d.textContent=it.l; popup.appendChild(d); return; }
    const b=document.createElement('button'); b.type='button';
    const l=document.createElement('span'); l.textContent=typeof it.l==='function'?it.l():it.l; b.appendChild(l);
    if(it.k){ const k=document.createElement('span'); k.className='k'; k.textContent=it.k; b.appendChild(k); }
    b.addEventListener('click',()=>{ closePopup(); if(it.fn) it.fn(); });
    popup.appendChild(b);
  });
  popup.hidden=false; popBtn=btn; btn.classList.add('open');
  const r=btn.getBoundingClientRect(), pw=popup.offsetWidth, ph=popup.offsetHeight;
  popup.style.left=clamp(r.left,8,Math.max(8,innerWidth-pw-8))+'px';
  popup.style.top=Math.max(8,Math.min(r.bottom+2,innerHeight-ph-8))+'px';
}
addEventListener('pointerdown',e=>{ if(!popup.hidden&&!popup.contains(e.target)&&!(e.target.closest&&e.target.closest('[data-menu]'))) closePopup(); });
addEventListener('keydown',e=>{ if(e.key==='Escape') closePopup(); });

/* ---------- widgets ---------- */
const f0=v=>String(Math.round(v)), f1=v=>v.toFixed(1), f2=v=>v.toFixed(2), f3=v=>v.toFixed(3);
function rangeField(label,min,max,step,get,set,fmt,onCommit){
  const wrap=document.createElement('label'); wrap.className='fld';
  const fill=document.createElement('i'), l=document.createElement('span'), out=document.createElement('output'), inp=document.createElement('input');
  l.textContent=label; inp.type='range'; inp.min=min; inp.max=max; inp.step=step; inp.setAttribute('aria-label',label);
  const upd=()=>{ const v=get(); inp.value=v; out.textContent=fmt(v); fill.style.width=(clamp((v-min)/(max-min),0,1)*100)+'%'; };
  inp.addEventListener('input',()=>{ set(+inp.value); upd(); });
  if(onCommit) inp.addEventListener('change',onCommit);
  wrap.append(fill,l,out,inp); upd(); wrap.update=upd; return wrap;
}
function panel(title,children,open){
  const d=document.createElement('details'); d.className='pnl'; if(open!==false) d.open=true;
  const s=document.createElement('summary'); s.textContent=title; const c=document.createElement('div'); c.className='pc';
  children.forEach(x=>c.appendChild(x)); d.append(s,c); return d;
}
function row(label,el){ const r=document.createElement('div'); r.className='prow'; const l=document.createElement('label'); l.textContent=label; r.append(l,el); return r; }
function noteEl(t){ const p=document.createElement('p'); p.className='note'; p.textContent=t; return p; }

/* ---------- time + timeline ---------- */
const tlbody=$('#tlbody');
const frameOf=t=>Math.round(t*S.fps);
let phEl=null, lastStat='';
function statusUpdate(){
  const objs=order.filter(i=>i!=='cam'&&i!=='tgt').length;
  const s='Collection | Objects '+objs+' | Frame '+frameOf(S.t)+' / '+Math.round(S.duration*S.fps)+' | '+S.fps+' fps';
  if(s!==lastStat){ lastStat=s; $('#stR').textContent=s; }
}
function updatePlayhead(){
  tlbody.style.setProperty('--p',String(clamp(S.t/S.duration,0,1)));
  const f=frameOf(S.t); if(phEl) phEl.dataset.f=String(f);
  const cur=$('#tCur'); if(document.activeElement!==cur) cur.value=f;
  const ef=$('#tEndF'); if(document.activeElement!==ef) ef.value=Math.round(S.duration*S.fps);
  statusUpdate();
}
function seek(t){ S.t=clamp(t,0,S.duration); applyTracks(S.t); updatePlayhead(); }
function laneTime(e,lane){ const r=lane.getBoundingClientRect(); return clamp((e.clientX-r.left)/r.width,0,1)*S.duration; }
function scrubStart(e,lane){
  e.preventDefault(); if(S.recording) return;
  S.playing=false; syncPlay(); seek(laneTime(e,lane));
  const mv=ev=>seek(laneTime(ev,lane)), up=()=>{ removeEventListener('pointermove',mv); removeEventListener('pointerup',up); removeEventListener('pointercancel',up); };
  addEventListener('pointermove',mv); addEventListener('pointerup',up); addEventListener('pointercancel',up);
}
function renderTimeline(){
  tlbody.innerHTML='';
  const rule=document.createElement('div'); rule.className='row rule';
  const rl=document.createElement('div'); rl.className='lab'; rl.textContent='Frames';
  const rln=document.createElement('div'); rln.className='lane';
  const stepS=S.duration>20?5:(S.duration>10?2:1);
  for(let s=0;s<=S.duration+1e-6;s+=stepS){
    const tk=document.createElement('div'); tk.className='tick'; tk.style.left=(s/S.duration*100)+'%';
    const sp=document.createElement('span'); sp.textContent=String(Math.round(s*S.fps)); tk.appendChild(sp); rln.appendChild(tk);
  }
  rln.addEventListener('pointerdown',e=>scrubStart(e,rln));
  rule.append(rl,rln); tlbody.appendChild(rule);
  order.forEach(id=>{
    const node=nodes.get(id); if(!node) return;
    const r=document.createElement('div'); r.className='row'+(S.sel===id?' on':''); r.dataset.id=id;
    const lab=document.createElement('button'); lab.type='button'; lab.className='lab'; lab.innerHTML=iconFor(node);
    const nm=document.createElement('span'); nm.textContent=node.userData.name; nm.style.overflow='hidden'; nm.style.textOverflow='ellipsis'; lab.appendChild(nm);
    lab.addEventListener('click',()=>selectId(id));
    const lane=document.createElement('div'); lane.className='lane';
    lane.addEventListener('pointerdown',e=>scrubStart(e,lane));
    (S.tracks[id]||[]).forEach(k=>{
      const kb=document.createElement('button'); kb.type='button'; kb.className='key'+(S.selKey&&S.selKey.k===k?' sel':'');
      kb.style.left=(k.t/S.duration*100)+'%'; kb.setAttribute('aria-label','Keyframe at frame '+frameOf(k.t));
      kb.addEventListener('pointerdown',e=>keyDown(e,id,k,lane,kb));
      lane.appendChild(kb);
    });
    r.append(lab,lane); tlbody.appendChild(r);
  });
  phEl=document.createElement('div'); phEl.className='ph'; tlbody.appendChild(phEl);
  updatePlayhead();
}
function keyDown(e,id,k,lane,kb){
  e.preventDefault(); e.stopPropagation(); if(S.recording) return;
  S.selKey={id:id,k:k}; S.playing=false; syncPlay();
  $$('.key.sel',tlbody).forEach(x=>x.classList.remove('sel')); kb.classList.add('sel');
  if(id!==S.sel) selectId(id,true);
  seek(k.t); let moved=false;
  const mv=ev=>{ moved=true; k.t=+laneTime(ev,lane).toFixed(3); kb.style.left=(k.t/S.duration*100)+'%'; seek(k.t); };
  const up=()=>{ removeEventListener('pointermove',mv); removeEventListener('pointerup',up); removeEventListener('pointercancel',up);
    if(moved){ S.tracks[id].sort((a,b)=>a.t-b.t); queueSave(); } };
  addEventListener('pointermove',mv); addEventListener('pointerup',up); addEventListener('pointercancel',up);
}
function allKeyTimes(){ const s=new Set(); Object.values(S.tracks).forEach(ks=>ks.forEach(k=>s.add(+k.t.toFixed(3)))); return [...s].sort((a,b)=>a-b); }
function jumpKey(dir){
  if(S.recording) return;
  const ts=allKeyTimes(), eps=.5/S.fps; let t;
  if(dir>0) t=ts.find(x=>x>S.t+eps); else t=[...ts].reverse().find(x=>x<S.t-eps);
  if(t==null){ toast(dir>0?'No later keyframe.':'No earlier keyframe.'); return; }
  S.playing=false; syncPlay(); seek(t);
}

/* ---------- controls, selection, outliner ---------- */
const tc=new THREE.TransformControls(edit,renderer.domElement);
tc.setSize(.85); scene.add(tc);
const orbit=new THREE.OrbitControls(edit,renderer.domElement);
orbit.target.set(0,1.2,0); orbit.enableDamping=true; orbit.dampingFactor=.08; orbit.maxPolarAngle=Math.PI*.495; orbit.update();
renderer.domElement.style.touchAction='none';
tc.addEventListener('dragging-changed',e=>{
  orbit.enabled=!e.value;
  if(!e.value&&S.autokey&&S.sel) addKey(S.sel);
  if(!e.value) queueSave();
});
function attachGizmo(){
  tc.detach();
  const n=S.sel&&nodes.get(S.sel);
  if(!n||S.view!=='free'||S.recording||S.mode==='select'||S.mode==='sculpt') return;
  const fixed=(S.sel==='cam'||S.sel==='tgt');
  tc.setMode(fixed?'translate':S.mode); tc.attach(n);
}
function selectId(id,keepKey){
  S.sel=id; if(!keepKey) S.selKey=null; attachGizmo(); renderOutliner(); renderProps();
  $$('.row[data-id]',tlbody).forEach(r=>r.classList.toggle('on',r.dataset.id===id));
}
function renderOutliner(){
  const box=$('#outliner'); box.innerHTML='';
  const head=(t,cls)=>{ const d=document.createElement('div'); d.className='orow '+cls; d.style.color='var(--mute)'; d.textContent=t; box.appendChild(d); };
  head('Scene Collection','indent0'); head('Collection','indent1');
  order.forEach(id=>{
    const n=nodes.get(id); if(!n) return;
    const b=document.createElement('div'); b.className='orow indent2'+(S.sel===id?' on':''); b.setAttribute('role','button'); b.tabIndex=0;
    const nm=document.createElement('span'); nm.className='oname'; nm.innerHTML=iconFor(n);
    const t=document.createElement('span'); t.textContent=n.userData.name; t.style.overflow='hidden'; t.style.textOverflow='ellipsis'; nm.appendChild(t);
    b.appendChild(nm);
    const sp=n.userData.spec;
    if(sp){
      const eye=document.createElement('button'); eye.type='button'; eye.className='eye'; eye.innerHTML=n.visible?IC.eye:IC.eyeOff;
      eye.setAttribute('aria-label',(n.visible?'Hide ':'Show ')+n.userData.name);
      eye.addEventListener('click',ev=>{ ev.stopPropagation(); n.visible=!n.visible; sp.hidden=!n.visible; if(!n.visible&&S.sel===id) tc.detach(); else if(S.sel===id) attachGizmo(); renderOutliner(); queueSave(); });
      b.appendChild(eye);
    }
    b.addEventListener('click',()=>selectId(id));
    b.addEventListener('keydown',ev=>{ if(ev.key==='Enter') selectId(id); });
    box.appendChild(b);
  });
  statusUpdate();
}
