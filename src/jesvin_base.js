/* ================= Jesvin built on the BodyKun base figure (Build 145) =================
   Dresses the bundled male base anatomy: human-textured skin, hoodie, jeans, sneakers,
   curly hair, full beard, round glasses, eyes and a backpack. Runs once per node from
   jbaseTick() (called from the render loop), after the auto-rig has produced the skinned parts. */
const JB={skin:'#6e4632',hair:'#18120e',hoodie:'#4d4a2c',jeans:'#4a6188',shoe:'#ebe7de',bag:'#5f7247',eye:'#2b1b12'};
function jbFabric(c,rough,kind){
  const S=128, cv=document.createElement('canvas'); cv.width=cv.height=S; const x=cv.getContext('2d'), im=x.createImageData(S,S), d=im.data; let sd=7; const rnd=()=>{ sd=(sd*1664525+1013904223)>>>0; return sd/4294967296; };
  for(let j=0;j<S;j++) for(let i=0;i<S;i++){ const k=(j*S+i)*4; let v;
    if(kind==='denim'){ const w=((i+j)%4<2?1:0); v=190+w*34+(rnd()-.5)*26+Math.sin(j*.9)*5; }
    else { v=206+((i%6<3)^(j%4<2)?14:0)+(rnd()-.5)*24; }
    v=Math.max(0,Math.min(255,v)); d[k]=d[k+1]=d[k+2]=v; d[k+3]=255; }
  x.putImageData(im,0,0);
  const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(6,6); t.anisotropy=4;
  const m=new THREE.MeshStandardMaterial({color:lin(c),roughness:rough,metalness:0}); m.bumpMap=t; m.bumpScale=.0016; m.roughnessMap=t; m.userData.fabric=kind; return m;
}
/* Cylindrical UVs (axis 'y' or 'x'); the seam sits at the back and the u wrap is an exact whole number of tiles. */
function jbUV(geo,axis){
  const P=geo.attributes.position, n=P.count; let mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
  for(let i=0;i<n;i++){ const a=[P.getX(i),P.getY(i),P.getZ(i)]; for(let k=0;k<3;k++){ if(a[k]<mn[k])mn[k]=a[k]; if(a[k]>mx[k])mx[k]=a[k]; } }
  const cx=(mn[0]+mx[0])/2, cy=(mn[1]+mx[1])/2, cz=(mn[2]+mx[2])/2, w=mx[0]-mn[0], h=mx[1]-mn[1], dz=mx[2]-mn[2];
  const rad=axis==='y'?(w+dz)/4:(h+dz)/4, circ=6.2832*Math.max(.02,rad), mult=Math.max(1,Math.round(circ/.3));
  const uv=new Float32Array(n*2);
  for(let i=0;i<n;i++){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i);
    if(axis==='y'){ uv[i*2]=Math.atan2(x-cx,z-cz)/6.2832*mult; uv[i*2+1]=y*3.3; }
    else { uv[i*2]=Math.atan2(y-cy,z-cz)/6.2832*mult; uv[i*2+1]=x*3.3; } }
  geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
}
const JB_AX={head:'y',neck:'y',trunk:'y',core:'y',bust:'y',thigh:'y',shins:'y',foot:'y',upperarms:'x',lowerarms:'x',hands:'x',fingers:'x'};
function jbShell(sm,mat,off){
  const c=new THREE.SkinnedMesh(sm.geometry.clone(),mat); const P=c.geometry.attributes.position, N=c.geometry.attributes.normal;
  for(let i=0;i<P.count;i++) P.setXYZ(i,P.getX(i)+N.getX(i)*off,P.getY(i)+N.getY(i)*off,P.getZ(i)+N.getZ(i)*off);
  P.needsUpdate=true; c.frustumCulled=false; c.castShadow=true; c.receiveShadow=true; c.userData.rigOwned=true; c.userData.jbCloth=true; c.bindMatrix.copy(sm.bindMatrix); c.bindMatrixInverse.copy(sm.bindMatrixInverse);
  c.bind(sm.skeleton,sm.bindMatrix); return c;
}
function jbLocal(bone,node,v){ node.updateMatrixWorld(true); bone.updateWorldMatrix(true,false); const w=new THREE.Vector3(v[0],v[1],v[2]).applyMatrix4(node.matrixWorld); return bone.worldToLocal(w); }
function jbDress(n){
  const R=n.userData.rig; if(!R||!R.bones||!R.bones.head) return false;
  const parts={}; n.traverse(o=>{ if(o.isSkinnedMesh&&o.userData.rigOwned&&o.userData.part&&!o.userData.jbCloth) parts[o.userData.part]=o; });
  if(!parts.head||!parts.trunk) return false;
  const skin=crSkinMat(JB.skin,.1,.1), hood=jbFabric(JB.hoodie,.92,'knit'), jean=jbFabric(JB.jeans,.85,'denim'), shoe=crMat(JB.shoe,.6);
  const sk=[].concat(R.skinned||[]);
  for(const nm in parts){ const sm=parts[nm]; jbUV(sm.geometry,JB_AX[nm]||'y'); sm.material=(nm==='foot')?shoe:skin; if(sm.material.skinning!==undefined) sm.material.skinning=true; sm.material.needsUpdate=true; sm.castShadow=true; }
  skin.skinning=true; shoe.skinning=true; hood.skinning=true; jean.skinning=true;
  const add=[]; const sh=(nm,m,o)=>{ if(parts[nm]){ const c=jbShell(parts[nm],m,o); c.userData.part=nm+'_cloth'; add.push(c); } };
  sh('trunk',jean,.02); sh('bust',hood,.032); sh('core',hood,.026); sh('upperarms',hood,.027); sh('lowerarms',hood,.022);
  sh('thigh',jean,.016); sh('shins',jean,.013);
  add.forEach(c=>n.add(c));
  n.userData.jbMats=[skin,hood,jean,shoe]; n.userData.jbParts=parts;
  return true;
}
function jbDetail(n){
  const m=crSkinMaps(.1,.1); let did=false;
  n.traverse(o=>{ if(!o.isSkinnedMesh||!o.userData.rigOwned||o.userData.jbUV) return; try{ jbUV(o.geometry,'y'); o.userData.jbUV=1;
    [].concat(o.material).forEach(mt=>{ if(mt.userData.jbBump) return; mt.bumpMap=m.bump; mt.bumpScale=.0016; mt.userData.jbBump=1; mt.needsUpdate=true; }); did=true; }catch(e){ console.warn('jbDetail',e); } });
  return did;
}
function jbaseTick(){
  nodes.forEach(n=>{ const sp=n.userData.spec; if(sp&&sp.jv2&&!n.userData.jbDone){ if(jbDetail(n)) n.userData.jbDone=1; return; } });
  nodes.forEach(n=>{ const sp=n.userData.spec; if(!sp||!sp.jb||n.userData.jbDone) return; let ok=false; try{ ok=jbDress(n); }catch(e){ console.warn('jbDress',e); n.userData.jbDone=1; return; } if(ok){ n.userData.jbDone=1; try{ jbAccessories(n); }catch(e){ console.warn('jbAccessories',e); } } });
}
function jbAccessories(n){
  const R=n.userData.rig, B=R.bones, parts=n.userData.jbParts, head=B.head, chest=B.chest;
  n.updateMatrixWorld(true); head.updateWorldMatrix(true,false); chest.updateWorldMatrix(true,false);
  const toBone=b=>new THREE.Matrix4().copy(b.matrixWorld).invert().multiply(n.matrixWorld);
  const MH=toBone(head), MC=toBone(chest);
  const mk=(col,r,m)=>new THREE.MeshStandardMaterial({color:lin(col),roughness:r,metalness:m||0});
  /* eyes from the face rig */
  const eyes=[]; head.children.forEach(c=>{ if(c.isGroup&&c.children[0]&&c.children[0].geometry&&c.children[0].geometry.type==='SphereGeometry') eyes.push(c); });
  /* head extents in node space */
  const HP=parts.head.geometry.attributes.position, HN=parts.head.geometry.attributes.normal; let mnY=1e9,mxY=-1e9,mnZ=1e9,mxZ=-1e9;
  for(let i=0;i<HP.count;i++){ const y=HP.getY(i), z=HP.getZ(i); if(y<mnY)mnY=y; if(y>mxY)mxY=y; if(z<mnZ)mnZ=z; if(z>mxZ)mxZ=z; }
  const hh=mxY-mnY, cz=(mnZ+mxZ)/2; let sd=31; const rnd=()=>{ sd=(sd*1664525+1013904223)>>>0; return sd/4294967296; };
  /* hair (curly, instanced) and beard (short, dense) conform to the real head surface */
  const hairInst=[], beardInst=[];
  for(let i=0;i<HP.count;i++){ const x=HP.getX(i), y=HP.getY(i), z=HP.getZ(i), t=(y-mnY)/hh, front=z>cz+.02, back=z<cz-.04, ax=Math.abs(x);
    const hair=front?(t>.84):back?(t>.46):(t>.64);
    if(hair&&!(ax>.07&&t<.66&&!back)) hairInst.push(i);
    const mouth=(t>.2&&t<.28&&ax<.026&&z>cz), mus=(t>.3&&t<.42&&ax<.04&&z>cz+.02);
    if(!hair&&z>cz-.035&&!mouth&&(t<.36||mus)) beardInst.push(i);
  }
  const mkInst=(geo,mat,idx,jit,sMin,sMax,off,reps)=>{
    const total=idx.length*reps, im=new THREE.InstancedMesh(geo,mat,total), m4=new THREE.Matrix4(), q=new THREE.Quaternion(), sc=new THREE.Vector3(), pp=new THREE.Vector3(); let k=0;
    idx.forEach(i=>{ for(let r=0;r<reps;r++){ const nx=HN.getX(i), ny=HN.getY(i), nz=HN.getZ(i), o=off*(.6+rnd()*.8);
      pp.set(HP.getX(i)+nx*o+(rnd()-.5)*jit, HP.getY(i)+ny*o+(rnd()-.5)*jit, HP.getZ(i)+nz*o+(rnd()-.5)*jit).applyMatrix4(MH);
      const s0=sMin+rnd()*(sMax-sMin); sc.set(s0,s0*(.7+rnd()*.5),s0); q.setFromEuler(new THREE.Euler(rnd()*6,rnd()*6,rnd()*6)); m4.compose(pp,q,sc); im.setMatrixAt(k++,m4); } });
    im.instanceMatrix.needsUpdate=true; im.frustumCulled=false; im.castShadow=true; im.userData.jbAcc=true; return im; };
  /* paint the beard and scalp into the skin (vertex colours) so no bare skin shows between the strands */
  { const col=new Float32Array(HP.count*3), dk=new THREE.Color(.075,.055,.045); const sm=(a,b,x)=>{ const q=Math.max(0,Math.min(1,(x-a)/(b-a))); return q*q*(3-2*q); };
    for(let i=0;i<HP.count;i++){ const x=HP.getX(i), y=HP.getY(i), z=HP.getZ(i), t=(y-mnY)/hh, ax=Math.abs(x), front=z>cz+.02, back=z<cz-.04;
      let w=0; const hl=front?.84:back?.46:.64; w=Math.max(w,sm(hl-.05,hl+.02,t)*(ax>.07&&t<.66&&!back?0:1));
      const jaw=sm(.44,.30,t)*sm(cz-.05,cz-.0,z); const mouth=(t>.2&&t<.28&&ax<.026&&z>cz)?0:1; w=Math.max(w,jaw*mouth*.92);
      const mus=(t>.3&&t<.42&&ax<.04&&z>cz+.02)?.9:0; w=Math.max(w,mus);
      const n=.8+.2*Math.sin(x*900)*Math.sin(y*870+z*300); w*=n; col[i*3]=1+(dk.r-1)*w; col[i*3+1]=1+(dk.g-1)*w; col[i*3+2]=1+(dk.b-1)*w; }
    parts.head.geometry.setAttribute('color',new THREE.BufferAttribute(col,3));
    const hm=parts.head.material.clone(); hm.vertexColors=true; hm.skinning=true; hm.needsUpdate=true; parts.head.material=hm; n.userData.jbMats.push(hm); }
  const hairM=mk(JB.hair,.5), hair=mkInst(new THREE.TorusGeometry(.0085,.0034,6,10),hairM,hairInst,.008,.8,1.5,.008,3); head.add(hair);
  const jawB=(R.faceBones&&R.faceBones.jaw)||null; const beardM=mk(JB.hair,.7);
  const beard=mkInst(new THREE.CylinderGeometry(.0009,.0005,.010,4),beardM,beardInst,.004,.8,1.6,.002,5); head.add(beard);
  /* glasses, brows from the eye positions */
  if(eyes.length>=2){ const e0=eyes[0], e1=eyes[1], mid=e0.position.clone().add(e1.position).multiplyScalar(.5), half=e0.position.distanceTo(e1.position)/2;
    const G=new THREE.Group(); G.position.copy(mid); G.quaternion.copy(e0.quaternion); head.add(G); G.userData.jbAcc=true;
    const frame=mk('#15110d',.35,.6);
    [1,-1].forEach(sx=>{ const ring=new THREE.Mesh(new THREE.TorusGeometry(.0235,.0017,8,40),frame); ring.position.set(sx*half,-.002,.0205); G.add(ring);
      const lens=new THREE.Mesh(new THREE.CircleGeometry(.0232,32),new THREE.MeshStandardMaterial({color:0xcfe0e8,roughness:.05,metalness:0,transparent:true,opacity:.1,depthWrite:false})); lens.position.set(sx*half,-.002,.0205); G.add(lens);
      const arm=new THREE.Mesh(new THREE.CylinderGeometry(.0013,.0013,.1,6),frame); arm.rotation.x=Math.PI/2; arm.position.set(sx*(half+.0235+.012),-.002,-.026); arm.rotation.z=0; G.add(arm);
      const brow=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),mk(JB.hair,.8)); brow.scale.set(.021,.0042,.005); brow.position.set(sx*(half+.002),.0285,.0105); brow.rotation.z=-sx*.12; G.add(brow); });
    const bridge=new THREE.Mesh(new THREE.CylinderGeometry(.0013,.0013,half*2-.047,6),frame); bridge.rotation.z=Math.PI/2; bridge.position.set(0,.006,.0205); G.add(bridge);
  }
  /* hood and backpack on the chest bone */
  const hoodM=n.userData.jbMats[1], hoodGeo=new THREE.SphereGeometry(1,24,16), hd=new THREE.Mesh(hoodGeo,hoodM.clone()); hd.material.skinning=false;
  const np=new THREE.Vector3(0,mnY-.075,cz-.065).applyMatrix4(MC); hd.position.copy(np); hd.scale.set(.115,.065,.082); hd.castShadow=true; hd.userData.jbAcc=true; chest.add(hd);
  const bagM=mk(JB.bag,.85), bag=new THREE.Mesh(new THREE.BoxGeometry(.3,.4,.13,4,4,2),bagM);
  bag.position.copy(new THREE.Vector3(0,mnY-.31,-.155).applyMatrix4(MC)); bag.castShadow=true; bag.userData.jbAcc=true; chest.add(bag);
  const pocket=new THREE.Mesh(new THREE.BoxGeometry(.22,.16,.05),bagM); pocket.position.copy(new THREE.Vector3(0,mnY-.40,-.235).applyMatrix4(MC)); pocket.userData.jbAcc=true; chest.add(pocket);
  [1,-1].forEach(sx=>{ const st=new THREE.Mesh(new THREE.BoxGeometry(.03,.3,.008),mk('#2f3a27',.9)); st.position.copy(new THREE.Vector3(sx*.085,mnY-.27,.142).applyMatrix4(MC)); st.userData.jbAcc=true; chest.add(st);
    const top=new THREE.Mesh(new THREE.BoxGeometry(.03,.008,.30),mk('#2f3a27',.9)); top.position.copy(new THREE.Vector3(sx*.085,mnY-.105,.01).applyMatrix4(MC)); top.userData.jbAcc=true; chest.add(top); });
  n.userData.jbInfo={mnY:mnY,mxY:mxY,cz:cz,hair:hairInst.length,beard:beardInst.length,eyes:eyes.length};
}

function loadJesvinBase(){
  if(S.recording) return;
  S.playing=false; syncPlay(); scEnd();
  loadProject({objs:[],cam:{p:[0,1.3,4.6]},tgt:{p:[0,.95,0]},tracks:{},duration:8});
  kochiEnv(false); applyPreset('studio'); setAspect(1.78);
  const sp=addEmbedded(BASE_FIG.kun); if(!sp){ toast('Base figure is not bundled in this build.'); return; }
  sp.jb=1; sp.name='Jesvin';
  orbit.target.set(0,.95,0); edit.position.set(2.2,1.5,4.2); orbit.update();
  refreshScene(); selectId(sp.id); applyLook(); saveNow();
  toast('Jesvin (on the base male) is loading. Give it a second to dress.');
}
window.__jb={dress:jbDress,tick:jbaseTick,JB:JB,load:loadJesvinBase}; window.jbaseTick=jbaseTick; window.__jb.kun=function(){ loadBaseKun(); };
window.__jb.nodes=()=>nodes; window.__jb.cam=function(a,t){ orbit.target.set(t[0],t[1],t[2]); edit.position.set(a[0],a[1],a[2]); orbit.update(); };
window.__jb.scNew=function(s,d){ SCU.detail=d||"high"; scNew(s); };
window.__jb.rigSculpt=function(){ const id=S.sel, n=nodes.get(id); if(!n) return 'no sel'; const sp=n.userData.spec; sp.rig={rot:0}; const nn=rigRebuild(id); return Object.keys((nn.userData.rig||{}).bones||{}).length; };

/* Jesvin v2: the sculpted one-piece body, auto-rigged with the face rig */
window.SC_NOEYE=false;
function loadJesvinSculpt(){
  if(S.recording) return;
  S.playing=false; syncPlay(); scEnd();
  loadProject({objs:[],cam:{p:[0,1.3,4.6]},tgt:{p:[0,.95,0]},tracks:{},duration:8});
  kochiEnv(false); applyPreset('studio'); setAspect(1.78);
  toast('Building Jesvin as one smooth body...');
  window.SC_NOEYE=true; SCU.detail='high';
  setTimeout(()=>{ try{
    const sp=sculptCreate({shape:'jesvin',detail:'high',name:'Jesvin'}); refreshScene(); selectId(sp.id);
    sp.rig={rot:0}; sp.jv2=1; rigRebuild(sp.id);
    orbit.target.set(0,.95,0); edit.position.set(2.2,1.5,4.2); orbit.update(); applyLook(); saveNow();
    toast('Jesvin is ready: one smooth body, rigged with the face rig. Open the Rig tab to pose him.');
  }catch(e){ toast('Jesvin build error: '+((e&&e.message)||e)); } finally{ window.SC_NOEYE=false; } },60);
}
window.__jb.loadSculpt=loadJesvinSculpt;
window.__jb.bbox=function(){ const o=[]; nodes.forEach(n=>{ if(n.userData.spec){ n.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(n); let c=0,sk=0,vis=0; n.traverse(m=>{ if(m.isMesh){ c++; if(m.isSkinnedMesh) sk++; if(m.visible) vis++; } }); o.push([n.userData.spec.name,bb.min.toArray().map(v=>+v.toFixed(2)),bb.max.toArray().map(v=>+v.toFixed(2)),c,sk,vis]); } }); o.push(edit.position.toArray().map(v=>+v.toFixed(1))); return JSON.stringify(o); };
window.__jb.nodesMap=nodes;
window.__jb.importGlb=importGlb; window.__jb.rigDo=rigDo;
window.__jb.sel=function(n){ selectId(n.userData.id); };
