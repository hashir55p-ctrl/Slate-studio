/* ================= Camera move presets (push, pull, crane, dolly-orbit, orbit loop, whip, vertigo, handheld) ================= */
const CM={dur:4};
const CM_LIST=[['push','Push in'],['pull','Pull back'],['crane','Crane reveal'],['dolly','Dolly + orbit'],['orbit','Orbit 360 loop'],['whip','Whip pan'],['vertigo','Dolly zoom'],['hand','Handheld']];
function camMove(kind){
  const cam=nodes.get('cam'), tgt=nodes.get('tgt'); if(!cam||!tgt) return;
  const D=Math.max(1,CM.dur), t0=+S.t.toFixed(3), t1=+(t0+D).toFixed(3);
  const C=cam.position.clone(), T=tgt.position.clone(), v=C.clone().sub(T);
  const r=Math.max(.8,v.length()), az=Math.atan2(v.x,v.z), el=Math.asin(clamp(v.y/r,-.98,.98)), f0=look.fov;
  const P=(rr,a,e,b)=>{ b=b||T; return [b.x+rr*Math.cos(e)*Math.sin(a), b.y+rr*Math.sin(e), b.z+rr*Math.cos(e)*Math.cos(a)]; };
  const ck=[], tk=[], tp=T.toArray();
  const K=(t,c,tg,f)=>{ t=+t.toFixed(3); ck.push({t:t,p:c,f:f!=null?f:f0}); tk.push({t:t,p:tg||tp}); };
  const up=y=>[T.x,T.y+y,T.z];
  if(kind==='push'){ K(t0,C.toArray()); K(t0+D*.5,P(r*.78,az,el)); K(t1,P(r*.55,az,el)); }
  else if(kind==='pull'){ K(t0,C.toArray()); K(t0+D*.5,P(r*1.3,az,el+.03)); K(t1,P(r*1.8,az,el+.08)); }
  else if(kind==='crane'){ const e0=.03, e1=Math.max(el+.4,.62); K(t0,P(r,az,e0),up(0)); K(t0+D*.5,P(r*1.05,az,(e0+e1)/2),up(.15)); K(t1,P(r*1.1,az,e1),up(.3)); }
  else if(kind==='dolly'){ const A=.75; for(let i=0;i<=4;i++){ const u=i/4; K(t0+D*u,P(r*(1-.35*u),az+A*u,el),null); } }
  else if(kind==='orbit'){ for(let i=0;i<=8;i++){ K(t0+D*i/8,P(r,az+Math.PI*2*i/8,el)); } }
  else if(kind==='whip'){ K(t0,C.toArray()); K(t0+D*.62,P(r*.97,az+.03,el)); K(t0+D*.8,P(r,az+.55,el)); K(t1,P(r,az+.95,el)); }
  else if(kind==='vertigo'){ const k=1.9, f1=2*Math.atan(Math.tan(f0*Math.PI/360)/k)*180/Math.PI; for(let i=0;i<=3;i++){ const u=i/3; const kk=1+(k-1)*u; K(t0+D*u,P(r*kk,az,el),null,2*Math.atan(Math.tan(f0*Math.PI/360)/kk)*180/Math.PI); } }
  else if(kind==='hand'){ let s=1337; const rnd=()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296-.5; }; const n=Math.max(2,Math.round(D*2));
    for(let i=0;i<=n;i++){ const e=(i===0||i===n)?0:1; K(t0+D*i/n,[C.x+rnd()*.07*e,C.y+rnd()*.05*e,C.z+rnd()*.07*e],[T.x+rnd()*.05*e,T.y+rnd()*.04*e,T.z+rnd()*.05*e]); } }
  else return;
  const strip=(id,add)=>{ const keep=(S.tracks[id]||[]).filter(k=>k.t<t0-1e-3||k.t>t1+1e-3); S.tracks[id]=keep.concat(add).sort((a,b)=>a.t-b.t); };
  strip('cam',ck); strip('tgt',tk);
  if(t1>S.duration) S.duration=Math.ceil(t1);
  S.t=t0; setView('cam'); applyTracks(S.t); renderTimeline(); queueSave();
  toast((CM_LIST.find(x=>x[0]===kind)||[0,kind])[1]+' added: '+t0.toFixed(1)+' s to '+t1.toFixed(1)+' s. Press play to watch it.');
}
function camMoveUI(){
  const wrap=document.createElement('div');
  const dur=lookFieldPlain('Length (seconds)',CM.dur,1,12,.5,v=>{ CM.dur=v; });
  const g=document.createElement('div'); g.className='g2';
  CM_LIST.forEach(([k,l])=>{ const b=document.createElement('button'); b.type='button'; b.className='pbtn'; b.dataset.cm=k; b.textContent=l; b.addEventListener('click',()=>camMove(k)); g.appendChild(b); });
  wrap.append(dur,g,noteEl('A move starts at the playhead, from where the camera is now, aimed at the Camera Target. It replaces camera keys inside that time range.'));
  return wrap;
}
function lookFieldPlain(label,val,min,max,step,on){
  const d=document.createElement('label'); d.style.cssText='display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:12px'; d.append(document.createTextNode(label));
  const i=document.createElement('input'); i.type='number'; i.min=min; i.max=max; i.step=step; i.value=val; i.style.cssText='width:70px;margin-left:auto'; i.addEventListener('change',()=>{ const v=clamp(+i.value||val,min,max); i.value=v; on(v); }); d.appendChild(i); return d;
}
window.__camMove=camMove;
