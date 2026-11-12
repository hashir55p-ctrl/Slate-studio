/* ---------- Equipment: attach imported models (chain, cross, glasses, hat, watch, backpack) to a rigged character ----------
   The model stays a normal node in the outliner; its meshes are copied into a carrier that rides on a bone.
   A straight chain is bent into a necklace around the neck. A pendant hangs from the front of the necklace and swings. */
const EQ_SLOTS={
  necklace:{t:'Necklace (chain)',bone:'chest'},
  pendant:{t:'Pendant (cross) on the necklace',bone:'chest'},
  glasses:{t:'Glasses',bone:'head',a:[0,.054,.066],dim:'x',size:.085,al:'c'},
  hat:{t:'Hat or cap',bone:'head',a:[0,.066,.0],dim:'x',size:.118,al:'b'},
  watchL:{t:'Watch, left wrist',bone:'foreArm.L',a:[0,-.112,0],dim:'m',size:.034,al:'c'},
  watchR:{t:'Watch, right wrist',bone:'foreArm.R',a:[0,-.112,0],dim:'m',size:.034,al:'c'},
  backpack:{t:'Backpack',bone:'chest',a:[0,.04,-.075],dim:'y',size:.22,al:'c'},
  belt:{t:'Belt or waist item',bone:'hips',a:[0,.045,0],dim:'x',size:.15,al:'c'}};
const EQ_FIN={silver:{c:0xd8dbe0,m:.3,r:.3},gold:{c:0xe2b13c,m:.3,r:.32},black:{c:0x222121,m:.1,r:.4},white:{c:0xf0eeea,m:0,r:.5}};
const EQ_DEF={sz:1,dx:0,dy:0,dz:0,rx:0,ry:0,rz:0,nw:1,dr:1,fw:1,th:1};
const DEG=Math.PI/180;
function eqChars(){ const o=[]; nodes.forEach(n=>{ const R=n.userData.rig; if(R&&R.bones&&R.bones.chest&&R.bones.neck&&R.bones.head) o.push(n); }); return o; }
function eqBoneOf(C,slot){ const s=EQ_SLOTS[slot]; return s&&C.userData.rig.bones[s.bone]; }
function eqNeckQ(C){ let q=null; nodes.forEach(n=>{ const e=n.userData.spec&&n.userData.spec.eq; if(e&&e.slot==='necklace'&&e.to===C.userData.spec.id) q=e; }); return q; }
/* body surface points in chest-bone space (from the skinned body meshes), cached per rig */
function eqBodyPts(C){
  const R=C.userData.rig, chest=R.bones.chest, c=C.userData.eqPts; if(c&&c.key===chest.uuid) return c.pts;
  C.updateMatrixWorld(true); const H=R.H, nk=R.bones.neck.position, y0=nk.y-.28*H, y1=nk.y+.28*H, out=[], v=new THREE.Vector3(), M=new THREE.Matrix4();
  C.traverse(o=>{ if(!o.isSkinnedMesh||o.userData.chain||o.userData.eqCar) return; if(/hair|ponytail|braid|beard|brow|lash|eye|cap|scalp/i.test(o.userData.part||'')) return;
    const bi=o.skeleton.bones.indexOf(chest); if(bi<0) return; M.multiplyMatrices(o.skeleton.boneInverses[bi],o.bindMatrix); const P=o.geometry.attributes.position;
    for(let i=0;i<P.count;i++){ v.fromBufferAttribute(P,i).applyMatrix4(M); if(v.y>y0&&v.y<y1&&Math.abs(v.x)<.5*H) out.push(v.x,v.y,v.z); } });
  const pts=new Float32Array(out); C.userData.eqPts={key:chest.uuid,pts:pts}; return pts;
}
/* the necklace path in chest-bone space: hugs the neck, then dips into a V that rests on the chest surface */
function eqNeckShape(C,q){
  q=Object.assign({},EQ_DEF,q||{}); const R=C.userData.rig, H=R.H, nk=R.bones.neck.position, P=eqBodyPts(C), drop=.085*H*q.dr, K=96, p=2.4;
  let cx=0, cz=nk.z, cy=nk.y+.012*H, r0=.04*H;
  const wf=th=>Math.pow((1+Math.cos(th))/2,p);
  if(P.length>300){
    /* neck height = lowest height where the body is narrowest */
    const hw=.006*H, ys=[]; for(let y=nk.y-.02*H;y<=nk.y+.14*H;y+=.004*H){ let mn=1e9,mx=-1e9,zn=1e9,zx=-1e9,c=0;
      for(let i=0;i<P.length;i+=3){ if(Math.abs(P[i+1]-y)<hw&&Math.abs(P[i])<.13*H){ c++; if(P[i]<mn)mn=P[i]; if(P[i]>mx)mx=P[i]; if(P[i+2]<zn)zn=P[i+2]; if(P[i+2]>zx)zx=P[i+2]; } }
      if(c>8) ys.push({y:y,w:mx-mn,cx:(mn+mx)/2,cz:(zn+zx)/2}); }
    if(ys.length){ let best=1e9; ys.forEach(e=>{ if(e.w<best) best=e.w; }); const e=ys.find(e=>e.w<=best*1.1)||ys[0]; cx=e.cx; cz=e.cz; cy=e.y-.004*H; r0=e.w/2; }
  }
  cx+=q.dx*H; cy+=q.dy*H; cz+=q.dz*H;
  const Rk=[]; for(let k=0;k<K;k++){ const th=-Math.PI+2*Math.PI*k/K, y=cy-drop*wf(th); let m=-1;
    if(P.length>300){ for(let i=0;i<P.length;i+=3){ if(Math.abs(P[i+1]-y)>.01*H) continue; const dx=P[i]-cx, dz=P[i+2]-cz, d=Math.atan2(dx,dz)-th, dd=Math.atan2(Math.sin(d),Math.cos(d)); if(Math.abs(dd)>.3) continue; const rp=Math.hypot(dx,dz)*Math.cos(dd); if(rp>m) m=rp; } }
    Rk.push(m>0?m:r0); }
  for(let it=0;it<3;it++){ const c=Rk.slice(); for(let k=0;k<K;k++) Rk[k]=.25*c[(k+K-1)%K]+.5*c[k]+.25*c[(k+1)%K]; }
  const clear=.007*H*q.fw, Rof=th=>{ let f=(th+Math.PI)/(2*Math.PI)*K; f=((f%K)+K)%K; const i=Math.floor(f), t=f-i; return (Rk[i%K]*(1-t)+Rk[(i+1)%K]*t+clear)*q.nw; };
  const pt=th=>{ const r=Rof(th); return new THREE.Vector3(cx+r*Math.sin(th),cy-drop*wf(th),cz+r*Math.cos(th)); };
  return {pt:pt,r:r0,drop:drop,low:pt(0)};
}
function eqBend(geo,C,q){
  const S=eqNeckShape(C,q), pos=geo.attributes.position, n=pos.count, bb=new THREE.Box3().setFromBufferAttribute(pos), sz=bb.getSize(new THREE.Vector3());
  const ax=sz.x>=sz.y&&sz.x>=sz.z?0:sz.y>=sz.z?1:2, a1=(ax+1)%3, a2=(ax+2)%3, cn=bb.getCenter(new THREE.Vector3()), CA=[cn.x,cn.y,cn.z], MN=[bb.min.x,bb.min.y,bb.min.z], Lc=[sz.x,sz.y,sz.z][ax]||1;
  const M=640, th=[], cum=[0]; const gap=.16; for(let i=0;i<=M;i++) th.push(-Math.PI+gap+(2*Math.PI-2*gap)*i/M); /* the two ends stop short of each other at the back, like a clasp */
  const P=th.map(S.pt); for(let i=1;i<=M;i++) cum.push(cum[i-1]+P[i].distanceTo(P[i-1])); const Lp=cum[M];
  /* uniform arc-length table of points and frames */
  const TP=[],TT=[],TN=[],TB=[]; let j=0;
  for(let i=0;i<=M;i++){ const s=Lp*i/M; while(j<M-1&&cum[j+1]<s) j++; const f=(s-cum[j])/((cum[j+1]-cum[j])||1), t=th[j]+(th[j+1]-th[j])*f;
    const p0=S.pt(t), p1=S.pt(t+.002), T=p1.clone().sub(S.pt(t-.002)).normalize(), n0=new THREE.Vector3(Math.sin(t),0,Math.cos(t));
    const N=n0.clone().addScaledVector(T,-n0.dot(T)).normalize(), B=new THREE.Vector3().crossVectors(T,N);
    TP.push(p0); TT.push(T); TN.push(N); TB.push(B); }
  const fit=Lp/Lc, out=new Float32Array(n*3), v=[0,0,0];
  for(let i=0;i<n;i++){ v[0]=pos.getX(i); v[1]=pos.getY(i); v[2]=pos.getZ(i);
    const u=Math.max(0,Math.min(1,(v[ax]-MN[ax])/Lc)), f=u*M, k=Math.min(M-1,Math.floor(f)), t=f-k, p1=(v[a1]-CA[a1])*fit*q.th, p2=(v[a2]-CA[a2])*fit*q.th;
    const px=TP[k].x+(TP[k+1].x-TP[k].x)*t, py=TP[k].y+(TP[k+1].y-TP[k].y)*t, pz=TP[k].z+(TP[k+1].z-TP[k].z)*t;
    const N=TN[k], B=TB[k];
    out[i*3]=px+N.x*p1+B.x*p2; out[i*3+1]=py+N.y*p1+B.y*p2; out[i*3+2]=pz+N.z*p1+B.z*p2; }
  geo.setAttribute('position',new THREE.BufferAttribute(out,3)); geo.computeVertexNormals(); geo.computeBoundingSphere(); geo.computeBoundingBox();
  return {fit:fit};
}
/* heavy sculpt exports (hundreds of thousands of points) are simplified by vertex clustering before they ride on a character */
function eqDecimate(g,target){
  const P=g.attributes.position, n=P.count; if(n<=target) return g;
  const bb=new THREE.Box3().setFromBufferAttribute(P), sz=bb.getSize(new THREE.Vector3()), mx=Math.max(sz.x,sz.y,sz.z)||1, idx=g.index?g.index.array:null, col=g.attributes.color||g.attributes.COLOR_0;
  let cell=mx/4000, cid=new Int32Array(n), cnt;
  for(let it=0;it<30;it++){ const m=new Map(); cnt=0; const A=Math.ceil(sz.x/cell)+2, B=Math.ceil(sz.y/cell)+2;
    for(let i=0;i<n;i++){ const k=Math.floor((P.getX(i)-bb.min.x)/cell)+A*(Math.floor((P.getY(i)-bb.min.y)/cell)+B*Math.floor((P.getZ(i)-bb.min.z)/cell)); let c=m.get(k); if(c===undefined){ c=cnt++; m.set(k,c); } cid[i]=c; }
    if(cnt<=target) break; cell*=Math.max(1.04,Math.sqrt(cnt/target)*1.01); }
  const sum=new Float64Array(cnt*3), num=new Uint32Array(cnt), cs=col?new Float64Array(cnt*3):null;
  for(let i=0;i<n;i++){ const c=cid[i]; sum[c*3]+=P.getX(i); sum[c*3+1]+=P.getY(i); sum[c*3+2]+=P.getZ(i); num[c]++; if(cs){ cs[c*3]+=col.getX(i); cs[c*3+1]+=col.getY(i); cs[c*3+2]+=col.getZ(i); } }
  const pos=new Float32Array(cnt*3); for(let c=0;c<cnt;c++){ const k=num[c]||1; pos[c*3]=sum[c*3]/k; pos[c*3+1]=sum[c*3+1]/k; pos[c*3+2]=sum[c*3+2]/k; }
  const tri=[], T=idx?idx.length:n; for(let t=0;t<T;t+=3){ const a=cid[idx?idx[t]:t], b=cid[idx?idx[t+1]:t+1], c=cid[idx?idx[t+2]:t+2]; if(a!==b&&b!==c&&a!==c) tri.push(a,b,c); }
  const o=new THREE.BufferGeometry(); o.setAttribute('position',new THREE.BufferAttribute(pos,3)); o.setIndex(new THREE.BufferAttribute(cnt>65535?new Uint32Array(tri):new Uint16Array(tri),1));
  if(cs){ const cc=new Float32Array(cnt*3); for(let c=0;c<cnt;c++){ const k=num[c]||1; cc[c*3]=cs[c*3]/k; cc[c*3+1]=cs[c*3+1]/k; cc[c*3+2]=cs[c*3+2]/k; } o.setAttribute('color',new THREE.BufferAttribute(cc,3)); }
  o.computeVertexNormals(); return o;
}
function eqBuild(n){
  const sp=n.userData.spec, q=Object.assign({},EQ_DEF,sp.eq), C=nodes.get(q.to), R=C&&C.userData.rig; if(!R||!R.bones) return false;
  const slot=EQ_SLOTS[q.slot], bone=slot&&R.bones[slot.bone]; if(!bone) return false;
  if(!n.userData.eqSrc){ const src=[]; n.updateMatrixWorld(true); const gi=new THREE.Matrix4().copy(n.matrixWorld).invert();
    n.traverse(o=>{ if(o.isMesh) src.push({g:o.geometry,m:o.material,M:new THREE.Matrix4().multiplyMatrices(gi,o.matrixWorld)}); });
    if(!src.length) return false; n.userData.eqSrc=src; }
  n.children.forEach(c=>{ if(!c.userData.eqCar) c.visible=false; });
  if(n.userData.eqCar){ const old=n.userData.eqCar; if(old.parent) old.parent.remove(old); old.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); n.userData.eqCar=null; n.userData.eqPend=null; }
  const H=R.H, geos=n.userData.eqSrc.map(s=>{ if(!s.dec) s.dec=eqDecimate(s.g,90000); const g=s.dec===s.g?s.g.clone():s.dec.clone(); if(!g.attributes.normal) g.computeVertexNormals(); g.applyMatrix4(s.M); return g; });
  const bb=new THREE.Box3(); geos.forEach(g=>{ g.computeBoundingBox(); bb.union(g.boundingBox); });
  const size=bb.getSize(new THREE.Vector3()), c=bb.getCenter(new THREE.Vector3()), car=new THREE.Group(); car.name='equip_'+q.slot; car.userData.eqCar=1;
  const fin=q.mat||((q.slot==='necklace'||q.slot==='pendant')?'silver':'keep'), F=EQ_FIN[fin], fm=F?new THREE.MeshStandardMaterial({color:F.c,metalness:F.m,roughness:F.r,emissive:F.c,emissiveIntensity:.1}):null;
  const mk=(g,m)=>{ const me=new THREE.Mesh(g,fm||m); me.castShadow=true; me.receiveShadow=true; me.name='equip'; return me; };
  if(q.slot==='necklace'){
    let fit=1; geos.forEach(g=>{ fit=eqBend(g,C,q).fit; }); /* all parts share the chain axis only when the chain is one mesh; extra parts follow the same bend */
    sp.eq.fit=fit; geos.forEach((g,i)=>car.add(mk(g,n.userData.eqSrc[i].m)));
  } else if(q.slot==='pendant'){
    const nq=eqNeckQ(C), S=eqNeckShape(C,nq), k=(.06*H*q.sz)/(size.y||1), M=new THREE.Matrix4(), E=new THREE.Euler(q.rx*DEG,q.ry*DEG,q.rz*DEG);
    M.makeRotationFromEuler(E).multiply(new THREE.Matrix4().makeScale(k,k,k)).multiply(new THREE.Matrix4().makeTranslation(-c.x,-bb.max.y,-c.z));
    const pend=new THREE.Group(); pend.position.set(0,0,0); geos.forEach((g,i)=>{ g.applyMatrix4(M); pend.add(mk(g,n.userData.eqSrc[i].m)); });
    pend.position.set(q.dx*H,q.dy*H,(q.dz+.004)*H); car.add(pend); car.position.copy(S.low); n.userData.eqPend={L:size.y*k*.5,st:null};
  } else {
    const dm=slot.dim==='x'?size.x:slot.dim==='y'?size.y:Math.max(size.x,size.y,size.z), k=(slot.size*H*q.sz)/(dm||1), base=new THREE.Vector3(c.x,slot.al==='b'?bb.min.y:c.y,c.z);
    const M=new THREE.Matrix4().makeTranslation(slot.a[0]*H+q.dx*H,slot.a[1]*H+q.dy*H,slot.a[2]*H+q.dz*H);
    M.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(q.rx*DEG,q.ry*DEG,q.rz*DEG))).multiply(new THREE.Matrix4().makeScale(k,k,k)).multiply(new THREE.Matrix4().makeTranslation(-base.x,-base.y,-base.z));
    geos.forEach((g,i)=>{ g.applyMatrix4(M); car.add(mk(g,n.userData.eqSrc[i].m)); });
  }
  bone.add(car); n.userData.eqCar=car; n.userData.eqBone=bone; return true;
}
function eqKey(n){ const sp=n.userData.spec, q=sp.eq, C=nodes.get(q.to), nq=q.slot==='pendant'&&C?eqNeckQ(C):null, b=C&&C.userData.rig&&C.userData.rig.bones&&EQ_SLOTS[q.slot]&&C.userData.rig.bones[EQ_SLOTS[q.slot].bone];
  return JSON.stringify(q)+'|'+(nq?JSON.stringify(nq):'')+'|'+(b?b.uuid:'')+'|'+(C?C.userData.rig&&C.userData.rig.H:''); }
const _eqW=new THREE.Vector3(), _eqD=new THREE.Vector3(), _eqQ=new THREE.Quaternion(), _eqS=new THREE.Vector3(), _eqDn=new THREE.Vector3(0,-1,0);
function equipStep(dt){
  nodes.forEach(n=>{ const sp=n.userData.spec; if(!sp||!sp.eq) return;
    const key=eqKey(n); if(n.userData.eqKey!==key){ if(eqBuild(n)) n.userData.eqKey=key; else return; }
    const pd=n.userData.eqPend, car=n.userData.eqCar; if(!pd||!car) return; dt=Math.min(.05,dt||.033);
    const bone=n.userData.eqBone; bone.updateMatrixWorld(true); car.getWorldPosition(_eqW); bone.getWorldQuaternion(_eqQ); bone.getWorldScale(_eqS); const L=Math.max(1e-4,pd.L*_eqS.y);
    if(!pd.st){ pd.st={q:_eqW.clone().add(new THREE.Vector3(0,-L,0)),p:null}; pd.st.p=pd.st.q.clone(); }
    const st=pd.st; _eqD.subVectors(st.q,st.p).multiplyScalar(.965); st.p.copy(st.q); st.q.add(_eqD); st.q.y-=9.8*dt*dt*.5;
    _eqD.subVectors(st.q,_eqW).normalize(); const inv=_eqQ.clone().invert(); _eqD.applyQuaternion(inv);
    if(_eqD.z<.12){ _eqD.z=.12; } if(_eqD.y>-.2){ _eqD.y=-.2; } _eqD.normalize(); /* rests against the chest, never swings over the shoulder */
    car.quaternion.setFromUnitVectors(_eqDn,_eqD); _eqD.applyQuaternion(_eqQ); st.q.copy(_eqW).addScaledVector(_eqD,L);
  });
}
function equipSet(id,slot,toId){
  const n=nodes.get(id); if(!n||!n.userData.spec||n.userData.spec.type!=='glb'){ toast('Select an imported model first (use Import model).'); return false; }
  const chars=eqChars(); const C=toId?nodes.get(toId):chars[0]; if(!C){ toast('There is no rigged character in the scene. Rig a character first.'); return false; }
  n.userData.spec.eq=Object.assign({},EQ_DEF,{to:C.userData.spec.id,slot:slot}); n.userData.eqKey=null; queueSave(); toast('Equipped '+n.userData.spec.name+' on '+C.userData.name+': '+EQ_SLOTS[slot].t+'.'); return true;
}
function equipOff(id){
  const n=nodes.get(id); if(!n||!n.userData.spec||!n.userData.spec.eq) return;
  const car=n.userData.eqCar; if(car){ if(car.parent) car.parent.remove(car); car.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
  n.userData.eqCar=null; n.userData.eqPend=null; n.userData.eqKey=null; n.userData.eqSrc=null; delete n.userData.spec.eq; n.children.forEach(c=>{ c.visible=true; }); queueSave(); toast('Taken off.');
}
window.equipStep=equipStep; window.equipSet=equipSet; window.equipOff=equipOff; window.EQ_SLOTS=EQ_SLOTS;
/* Equip tab */
IC.tEquip=svg('<path d="M4 6c0 7 2.5 10 6 10s6-3 6-10" '+stroke+'/><circle cx="10" cy="16.5" r="1.6" '+stroke+'/>');
TABS.push({id:'equip',ic:IC.tEquip,t:'Equip: chain, glasses, watch',pane:'pEquip'});
(function(){ const _b=buildFacePane; buildFacePane=function(){ _b(); try{
  const host=document.createElement('div'); host.className='pane'; host.id='pEquip'; host.hidden=true; $('#pAi').parentNode.appendChild(host);
  const st=document.createElement('p'); st.className='note'; st.style.color='var(--fg)';
  const cur=()=>{ const n=S.sel&&nodes.get(S.sel); return n&&n.userData.spec&&n.userData.spec.type==='glb'?n:null; };
  const who=()=>{ const ch=eqChars(); const n=cur(); const e=n&&n.userData.spec.eq; if(e&&nodes.get(e.to)) return e.to; if(EQ.pick&&nodes.get(EQ.pick)) return EQ.pick; return ch[0]?ch[0].userData.spec.id:null; };
  const EQ={pick:null};
  const g=document.createElement('div'); g.className='g2'; Object.keys(EQ_SLOTS).forEach(k=>g.appendChild(scBtn(EQ_SLOTS[k].t,()=>{ const n=cur(); if(!n){ toast('Select an imported model first.'); return; } equipSet(n.userData.spec.id,k,who()); })));
  const sw=scBtn('Character to equip: none',()=>{ const ch=eqChars(); if(!ch.length) return; const i=ch.findIndex(c=>c.userData.spec.id===who()); EQ.pick=ch[(i+1)%ch.length].userData.spec.id; },'');
  const fg=document.createElement('div'); fg.className='g2'; [['Keep original colour','keep'],['Silver','silver'],['Gold','gold'],['Black','black'],['White','white']].forEach(f=>fg.appendChild(scBtn(f[0],()=>{ const n=cur(), e=n&&n.userData.spec.eq; if(e){ e.mat=f[1]; queueSave(); } else toast('Equip the model first.'); })));
  const off=scBtn('Take off',()=>{ const n=cur(); if(n) equipOff(n.userData.spec.id); });
  const sl=(label,min,max,step,key,fmt)=>rangeField(label,min,max,step,()=>{ const n=cur(), e=n&&n.userData.spec.eq; return e&&e[key]!=null?e[key]:EQ_DEF[key]; },v=>{ const n=cur(), e=n&&n.userData.spec.eq; if(e){ e[key]=v; queueSave(); } },fmt||(v=>(+v).toFixed(2)));
  const common=[sl('Size',.3,3,.01,'sz'),sl('Left or right',-.12,.12,.001,'dx',v=>(+v).toFixed(3)),sl('Up or down',-.12,.12,.001,'dy',v=>(+v).toFixed(3)),sl('Forward or back',-.12,.12,.001,'dz',v=>(+v).toFixed(3)),sl('Tilt',-180,180,1,'rx',v=>Math.round(v)+'°'),sl('Turn',-180,180,1,'ry',v=>Math.round(v)+'°'),sl('Roll',-180,180,1,'rz',v=>Math.round(v)+'°')];
  const neck=[sl('Neck width',.6,1.6,.01,'nw'),sl('Chain drop (how low it hangs)',.3,3,.01,'dr'),sl('Away from the body',0,3,.01,'fw'),sl('Chain thickness',.3,4,.01,'th')];
  host.append(panel('Equipment',[st,sw,g,noteEl('Finish (metal or colour):'),fg,off,noteEl('Import the chain and the cross as two models. Select the chain, tap Necklace; select the cross, tap Pendant. The chain is bent around the neck and the pendant swings with the body.')].concat(common,neck),true));
  setInterval(()=>{ try{ const n=cur(), e=n&&n.userData.spec.eq, w=who(), wn=w&&nodes.get(w); sw.textContent='Character to equip: '+(wn?wn.userData.name:'none (rig a character first)');
    st.textContent=!n?'Select an imported model to equip it.':e?(n.userData.spec.name+' is equipped: '+EQ_SLOTS[e.slot].t+'.'):(n.userData.spec.name+' is not equipped. Pick where it goes.');
    common.concat(neck).forEach(f=>{ f.update&&f.update(); f.style.display=e?'':'none'; }); neck.forEach(f=>{ f.style.display=e&&(e.slot==='necklace')?'':'none'; }); }catch(x){} },300);
 }catch(e){ console.warn('equip ui',e); } }; })();
