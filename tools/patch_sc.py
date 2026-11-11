s=open('sculpt.js').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt, (s.count(a), a[:80])
    s=s.replace(a,b)
rep("detail:'medium',stab:.4};","detail:'medium',stab:.4,dyn:false,dynk:'fine',symY:false,symZ:false,pres:true,presSize:false,matcap:false,pcol:'#c98e74',pjit:.25,dirt:.5};")
rep("{id:'mask',n:'Mask (protect an area)'}];","{id:'snake',n:'Snake hook (pull out horns, fingers)'},{id:'layer',n:'Layer (raise to an even height)'},{id:'nudge',n:'Nudge (push sideways)'},{id:'paint',n:'Paint color'},{id:'mask',n:'Mask (protect an area)'}];")
# adjacency: fast typed-array version
a=s.index('function scAdj(n,idx){'); b=s.index('function scEncode(arr){')
s=s[:a]+'''function scAdj(n,idx){
  const cnt=new Int32Array(n+1); for(let t=0;t<idx.length;t++) cnt[idx[t]]+=2;
  const st=new Int32Array(n+1); for(let i=0;i<n;i++) st[i+1]=st[i]+cnt[i];
  const fill=st.slice(0,n), raw=new Int32Array(st[n]);
  for(let t=0;t<idx.length;t+=3){ const a=idx[t],b=idx[t+1],c=idx[t+2]; raw[fill[a]++]=b; raw[fill[a]++]=c; raw[fill[b]++]=c; raw[fill[b]++]=a; raw[fill[c]++]=a; raw[fill[c]++]=b; }
  const start=new Int32Array(n+1), list=new Int32Array(st[n]); let w=0;
  for(let v=0;v<n;v++){ start[v]=w; const s0=w; for(let q=st[v];q<st[v+1];q++){ const u=raw[q]; let d=false; for(let k=s0;k<w;k++) if(list[k]===u){ d=true; break; } if(!d) list[w++]=u; } }
  start[n]=w; return {start:start,list:list.slice(0,w)};
}
'''+s[b:]
# scMake + buildSculpt + flush
a=s.index('function scMake(spec){'); b=s.index('function scUpdate(sc){')
core=open('sc_core.js').read()
s=s[:a]+core+'''function scMake(spec){
  const shape=SC_SHAPES[spec.shape]?spec.shape:'ball';
  const size=(Array.isArray(spec.size)&&spec.size.length>=3?spec.size:SC_SHAPES[shape].size).map(Number);
  const detail=SC_DETAIL[spec.detail]?spec.detail:'medium';
  const base=scBase(shape,size,detail), sc={base:base.pos,baseIdx:Uint32Array.from(base.idx),half:base.half,ref:Math.max(base.half[0],base.half[1],base.half[2]),flat:!!base.flat,undo:[],redo:[],dirty:false,specRef:spec};
  const ck=spec.dyn&&SC_CACHE[spec.dynKey||spec.id];
  if(ck){ scSetTopo(sc,new Float32Array(ck.pos),ck.idx,ck.paint?new Uint8Array(ck.paint):null,null); return sc; }
  const pos=new Float32Array(base.pos);
  if(spec.data){ try{ const q=scDecode(spec.data); if(q.length===pos.length) pos.set(q); }catch(e){} }
  let paint=null; if(spec.paint){ try{ const pb=scB64toU8(spec.paint); if(pb.length===pos.length) paint=pb; }catch(e){} }
  scSetTopo(sc,pos,sc.baseIdx,paint,null);
  return sc;
}
function buildSculpt(spec){
  const g=new THREE.Group(), sc=scMake(spec);
  const mat=std(spec.color||'#b9a68e',spec.rough==null?.85:spec.rough,spec.metal||0);
  if(spec.shape==='terrain') mat.side=THREE.DoubleSide;
  mat.vertexColors=true; const mesh=new THREE.Mesh(sc.geo,mat); mesh.castShadow=true; mesh.receiveShadow=true; mesh.userData.paint=true;
  sc.mesh=mesh; scMatSync(sc); g.add(mesh); g.userData.sc=sc;
  return g;
}
function sculptFlush(){
  order.forEach(id=>{ const n=nodes.get(id), sc=n&&n.userData&&n.userData.sc, sp=n&&n.userData&&n.userData.spec; if(!(sc&&sp&&sc.dirty)) return; sc.dirty=false; sc.specRef=sp;
    if(sc.idx!==sc.baseIdx){ const key=sp.id, v={pos:sc.pos.slice(),idx:sc.idx,paint:sc.paint?sc.paint.slice():null}; sp.dyn=true; sp.dynKey=key; delete sp.data; delete sp.paint; SC_CACHE[key]=v; scIdbPut(key,v); }
    else { delete sp.dyn; delete sp.dynKey; sp.data=scEncode(sc.pos); if(sc.paint) sp.paint=scU8toB64(sc.paint); else delete sp.paint; } });
}
'''+s[b:]
# masks
rep("function scMaskPaint(sc,ids,c,fn){ const col=sc.geo.attributes.color.array, mk=sc.mask; for(let q=0;q<c;q++){ const v=ids?ids[q]:q; if(fn) mk[v]=fn(v,q); const k=1-.8*mk[v]; col[v*3]=k; col[v*3+1]=k; col[v*3+2]=k*1.0; } sc.geo.attributes.color.needsUpdate=true; }",
    "function scMaskPaint(sc,ids,c,fn){ const mk=sc.mask; for(let q=0;q<c;q++){ const v=ids?ids[q]:q; if(fn) mk[v]=fn(v,q); scColor1(sc,v); } sc.geo.attributes.color.needsUpdate=true; }")
rep("if(sc.mask){ sc.mask=null; sc.geo.attributes.color.array.fill(1); sc.geo.attributes.color.needsUpdate=true; } return; }","if(sc.mask){ sc.mask=null; scColors(sc); } return; }")
rep("function scPushUndo(sc){ const sn=sc.pos.slice(); sn.mask=scMaskSnap(sc); sc.undo.push(sn); if(sc.undo.length>25) sc.undo.shift(); sc.redo.length=0; sc.dirty=true; }","function scPushUndo(sc){ scPushSnap(sc,scSnap(sc)); }")
# brushes: layer + paint + move
rep("function scDab(sc,brush,px,py,pz,r,amt,carve){","function scDab(sc,brush,px,py,pz,r,amt,carve,lay){")
rep("""  } else if(brush==='flatten'){""","""  } else if(brush==='layer'&&lay){
    const f0=clamp(amt*.25,0,.9), nx=lay[3], ny=lay[4], nz=lay[5], h=lay[6];
    for(let k=0;k<c;k++){ const i=ids[k]*3, dist=(pos[i]-lay[0])*nx+(pos[i+1]-lay[1])*ny+(pos[i+2]-lay[2])*nz; if(h>=0?dist>=h:dist<=h) continue; const f=f0*ws[k]*(h-dist); pos[i]+=nx*f; pos[i+1]+=ny*f; pos[i+2]+=nz*f; }
  } else if(brush==='paint'){
    if(!sc.paint) scPaintInit(sc); const p=sc.paint, cc=scHexRgb(SCU.pcol), f0=clamp(amt*.3,0,1), jit=SCU.pjit;
    for(let k=0;k<c;k++){ const v=ids[k], j=v*3, f=Math.min(1,f0*ws[k]*1.6); let q=1;
      if(jit>0){ const hs=Math.sin(pos[j]*127.1+pos[j+1]*311.7+pos[j+2]*74.7)*43758.5453; q=1+(hs-Math.floor(hs)-.5)*jit*.6; }
      for(let e=0;e<3;e++){ const tg=clamp(cc[e]*q,0,255); let d=(tg-p[j+e])*f; if(d>0&&d<1) d=1; else if(d<0&&d>-1) d=-1; if(Math.abs(tg-p[j+e])<1) continue; p[j+e]=clamp(Math.round(p[j+e]+d),0,255); }
      scColor1(sc,v); }
    sc.geo.attributes.color.needsUpdate=true; return false;
  } else if(brush==='flatten'){""")
rep("""function scGrabBegin(sc,px,py,pz,r){""","""function scMove(sc,px,py,pz,r,dx,dy,dz,k,tangent){
  const c=scGather(sc,px,py,pz,r); if(!c) return false; const pos=sc.pos, ids=sc.tmpI, ws=sc.tmpW;
  if(tangent){ scAreaNormal(sc,c); const d=dx*_scN[0]+dy*_scN[1]+dz*_scN[2]; dx-=_scN[0]*d; dy-=_scN[1]*d; dz-=_scN[2]*d; }
  for(let q=0;q<c;q++){ const i=ids[q]*3, w=ws[q]*k; pos[i]+=dx*w; pos[i+1]+=dy*w; pos[i+2]+=dz*w; }
  return true;
}
function scMirrors(x,y,z){ const out=[[1,1,1]]; if(SCU.sym&&Math.abs(x)>1e-4) out.push([-1,1,1]); if(SCU.symY&&Math.abs(y)>1e-4) out.slice().forEach(m=>out.push([m[0],-1,m[2]])); if(SCU.symZ&&Math.abs(z)>1e-4) out.slice().forEach(m=>out.push([m[0],m[1],-1])); return out; }
function scGrabBegin(sc,px,py,pz,r){""")
# pointer down / move / end
rep("scS={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,node:node,sc:sc,snap:sc.pos.slice(),msnap:scMaskSnap(sc),changed:false,grab:null};",
    "scS={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,node:node,sc:sc,snap:scSnap(sc),changed:false,grab:null,pr:e.pointerType==='pen'?(e.pressure||.5):1,tRef:0,layer:null,cur:hit.l.clone()};\n  if(SCU.brush==='snake'||SCU.brush==='nudge') scS.plane=new THREE.Plane().setFromNormalAndCoplanarPoint(edit.getWorldDirection(new THREE.Vector3()).negate(),hit.w);")
rep("if(scS&&e.pointerId===scS.id){ scS.x=e.clientX; scS.y=e.clientY; }","if(scS&&e.pointerId===scS.id){ scS.x=e.clientX; scS.y=e.clientY; if(e.pointerType==='pen'&&e.pressure>0) scS.pr=e.pressure; }")
rep("if(s.changed){ s.snap.mask=s.msnap; s.sc.undo.push(s.snap); if(s.sc.undo.length>25) s.sc.undo.shift(); s.sc.redo.length=0; s.sc.dirty=true; queueSave(); }","if(s.changed){ scPushSnap(s.sc,s.snap); queueSave(); }")
# frame
a=s.index('function sculptFrame(dt){'); b=s.index('function scUndo(){')
s=s[:a]+'''function sculptFrame(dt){
  const node=sculptTarget(), act=SCU.on&&node&&S.view==='free'&&!S.recording;
  scRing.visible=false; scGuideSync(); scSyncStatus(node); scMatcapSync();
  if(scOrbitHeld&&!scS&&scPtrs.size===0){ orbit.enabled=(S.view==='free'); scOrbitHeld=false; }
  if(!act){ if(scS) scEnd(); return; }
  const sc=node.userData.sc, pr=scS&&SCU.pres?scS.pr:1, r=SCU.size*sc.ref*(scS&&SCU.presSize?.35+.65*scS.pr:1); let src=scS||scHover; if(!src) return;
  if(scS){ const f=1-Math.pow(clamp(SCU.stab,0,.95),clamp(dt*60,.3,3)); scS.sx+=(scS.x-scS.sx)*f; scS.sy+=(scS.y-scS.sy)*f; src={x:scS.sx,y:scS.sy}; }
  const hit=scPick(src.x,src.y,node);
  if(hit){ scRing.position.copy(hit.w).addScaledVector(hit.n,.004); scRing.quaternion.setFromUnitVectors(_scZ,hit.n); scRing.scale.setScalar(Math.max(.001,r*node.scale.x)); scRing.visible=true; }
  if(!scS) return;
  const dtf=clamp(dt*60,.3,3), B=SCU.brush;
  if(scS.grab){
    if(!hit&&!scS.grab) return; if(!ray.ray.intersectPlane(scS.plane,_scT)) return;
    const l=sc.mesh.worldToLocal(_scT.clone());
    scGrabMove(sc,scS.grab,l.x-scS.l0.x,l.y-scS.l0.y,l.z-scS.l0.z); scS.changed=true; scUpdate(sc); return;
  }
  if(B==='snake'){
    if(!ray.ray.intersectPlane(scS.plane,_scT)) return; const l=sc.mesh.worldToLocal(_scT.clone()), d=l.clone().sub(scS.cur); if(d.lengthSq()<1e-10) return;
    const c0=scS.cur; let did=false;
    if(SCU.dyn){ const now=performance.now(); if(now-scS.tRef>90){ scS.tRef=now; scMirrors(c0.x,c0.y,c0.z).forEach(m=>{ scRefine(sc,c0.x*m[0],c0.y*m[1],c0.z*m[2],r*1.1,Math.max(r*SC_DYNK[SCU.dynk],sc.ref*.0025)); }); } }
    scMirrors(c0.x,c0.y,c0.z).forEach(m=>{ did=scMove(sc,c0.x*m[0],c0.y*m[1],c0.z*m[2],r,d.x*m[0],d.y*m[1],d.z*m[2],clamp(.55+SCU.strength*.45,0,1)*pr,false)||did; });
    scS.cur.copy(l); scS.plane.setFromNormalAndCoplanarPoint(scS.plane.normal,_scT); if(did){ scS.changed=true; scUpdate(sc); } return;
  }
  if(!hit) return;
  if(B==='nudge'){
    const d=hit.l.clone().sub(scS.cur); scS.cur.copy(hit.l); if(d.lengthSq()<1e-10) return; let did=false;
    scMirrors(hit.l.x,hit.l.y,hit.l.z).forEach(m=>{ did=scMove(sc,hit.l.x*m[0],hit.l.y*m[1],hit.l.z*m[2],r,d.x*m[0],d.y*m[1],d.z*m[2],SCU.strength*.8*pr,true)||did; });
    if(did){ scS.changed=true; scUpdate(sc); } return;
  }
  const mir=scMirrors(hit.l.x,hit.l.y,hit.l.z);
  if(SCU.dyn&&B!=='mask'){ const now=performance.now(); if(now-scS.tRef>90){ scS.tRef=now; const L=Math.max(r*SC_DYNK[SCU.dynk],sc.ref*.0025); let ch=false; mir.forEach(m=>{ ch=scRefine(sc,hit.l.x*m[0],hit.l.y*m[1],hit.l.z*m[2],r,L)||ch; }); if(ch) scS.changed=true; } }
  if(B==='layer'&&!scS.layer){ const c=scGather(sc,hit.l.x,hit.l.y,hit.l.z,r,true); if(!c) return; scAreaNormal(sc,c); scS.layer=[hit.l.x,hit.l.y,hit.l.z,_scN[0],_scN[1],_scN[2],(SCU.carve?-1:1)*r*(.04+.14*SCU.strength)]; }
  const amt=SCU.strength*dtf*pr; let did=false;
  mir.forEach(m=>{ const L0=scS.layer; const lay=L0?[L0[0]*m[0],L0[1]*m[1],L0[2]*m[2],L0[3]*m[0],L0[4]*m[1],L0[5]*m[2],L0[6]]:null;
    did=scDab(sc,B,hit.l.x*m[0],hit.l.y*m[1],hit.l.z*m[2],r,amt,SCU.carve,lay)||did; });
  if(B==='mask'||B==='paint') scS.changed=true;
  if(did){ scS.changed=true; scUpdate(sc); }
}
'''+s[b:]
a=s.index('function scUndo(){'); b=s.index('function sculptMode(m){')
s=s[:a]+'''function scUndo(){
  scEnd(); const n=sculptTarget(); if(!n){ toast('Select a sculpt object first.'); return; }
  const sc=n.userData.sc; if(!sc.undo.length){ toast('Nothing to undo.'); return; }
  sc.redo.push(scSnap(sc)); scRestore(sc,sc.undo.pop()); queueSave();
}
function scRedo(){
  scEnd(); const n=sculptTarget(); if(!n){ toast('Select a sculpt object first.'); return; }
  const sc=n.userData.sc; if(!sc.redo.length){ toast('Nothing to redo.'); return; }
  sc.undo.push(scSnap(sc)); scRestore(sc,sc.redo.pop()); queueSave();
}
function scReset(){
  scEnd(); const n=sculptTarget(); if(!n){ toast('Select a sculpt object first.'); return; }
  const sc=n.userData.sc; scPushUndo(sc); const keep=sc.idx===sc.baseIdx?sc.paint:null; scSetTopo(sc,new Float32Array(sc.base),sc.baseIdx,keep,null); scUpdate(sc); sc.dirty=true; queueSave(); toast('Back to the starting shape. Undo brings your work back.');
}
'''+s[b:]
rep("const cw=chk('Show wireframe',()=>SCU.wire,v=>{ SCU.wire=v; const n=sculptTarget(); if(n) n.userData.sc.mesh.material.wireframe=v; });",
"""const cw=chk('Show wireframe',()=>SCU.wire,v=>{ SCU.wire=v; const n=sculptTarget(); if(n) n.userData.sc.mesh.material.wireframe=v; if(scMatcapMat) scMatcapMat.wireframe=v; });
  const dk=document.createElement('select'); dk.className='sel2'; dk.setAttribute('aria-label','Detail size'); dk.innerHTML='<option value="coarse">Coarse</option><option value="fine" selected>Fine</option><option value="finest">Finest (wrinkles, pores)</option>'; dk.addEventListener('change',()=>{ SCU.dynk=dk.value; });
  const cnt=document.createElement('p'); cnt.className='note'; cnt.id='scCount';
  const pcol=document.createElement('input'); pcol.type='color'; pcol.value=SCU.pcol; pcol.setAttribute('aria-label','Paint color'); pcol.addEventListener('input',()=>{ SCU.pcol=pcol.value; if(SCU.brush!=='paint'){ SCU.brush='paint'; mark(); } });
  const pg=document.createElement('div'); pg.className='g2'; pg.append(scBtn('Fill whole object',scPaintFill),scBtn('Dirt in crevices',scCavity,'hi'),scBtn('Remove paint',scPaintClear),scBtn('Export as .glb (shape and paint)',()=>exportRigGLB(false)));
  const sw=document.createElement('div'); sw.className='g2'; ['#e0b8a0','#c98e74','#a8694f','#7a4a36','#4b2e22','#d8cfc4','#7d8a5a','#5d6a7a'].forEach(h=>{ const b=scBtn('',()=>{ SCU.pcol=h; pcol.value=h; SCU.brush='paint'; mark(); }); b.style.background=h; b.style.minHeight='28px'; b.setAttribute('aria-label','Paint color '+h); sw.appendChild(b); });""")
rep("cs,cc,noteEl('Stroke smoothing steadies shaky lines: the brush follows your finger a little behind it. Carve also erases the Mask brush.')]),",
"""cs,chk('Mirror top and bottom',()=>SCU.symY,v=>{ SCU.symY=v; }),chk('Mirror front and back',()=>SCU.symZ,v=>{ SCU.symZ=v; }),cc,chk('Apple Pencil pressure changes strength',()=>SCU.pres,v=>{ SCU.pres=v; }),chk('Apple Pencil pressure changes size',()=>SCU.presSize,v=>{ SCU.presSize=v; }),noteEl('Stroke smoothing steadies shaky lines: the brush follows your finger a little behind it. Carve also erases the Mask brush.')]),
    panel('Detail',[chk('Detail brush: add detail where you sculpt',()=>SCU.dyn,v=>{ SCU.dyn=v; }),row('Detail size',dk),scBtn('Add detail everywhere (about 4x)',scDetailAll),cnt,noteEl('With the Detail brush on, every stroke splits the mesh into smaller triangles under the brush, so fine lines, wrinkles and sharp edges stay crisp. Smaller brushes give finer detail. Paint also gets sharper where there is more detail.')]),
    panel('Paint',[row('Color',pcol),sw,rangeField('Skin mottling',0,1,.01,()=>SCU.pjit,v=>{ SCU.pjit=v; },f2,null),rangeField('Dirt strength',0,1,.01,()=>SCU.dirt,v=>{ SCU.dirt=v; },f2,null),pg,noteEl('Pick Paint color in the brushes, or tap a color, then paint on the model. Skin mottling adds natural unevenness. Dirt in crevices darkens folds and lightens edges, like a weathered texture. Turn on the Detail brush for sharper paint.')]),""")
rep("panel('Edit',[ed,rs,cw,","panel('Edit',[ed,rs,cw,chk('Clay view while sculpting (shows form clearly)',()=>SCU.matcap,v=>{ SCU.matcap=v; }),")
rep("  scSyncStatus(sculptTarget());\n}","  scSyncStatus(sculptTarget()); const t0=sculptTarget(); if(t0) scCountSync(t0.userData.sc);\n}")
rep("const key=(S.sel||'')+'|'+(node?1:0)+'|'+SCU.on; if(key===scStatKey) return; scStatKey=key;","const key=(S.sel||'')+'|'+(node?1:0)+'|'+SCU.on; if(key===scStatKey) return; scStatKey=key; if(node) scCountSync(node.userData.sc);")
open('sculpt.js','w').write(s)
