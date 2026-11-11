/* ---------- rigging: skeleton, auto-skin, pose, keyframes ---------- */
IC.tRig=svg('<circle cx="10" cy="3.5" r="2" '+stroke+'/><path d="M10 6v5M5 8l5-1.5L15 8M10 11l-3 6M10 11l3 6" '+stroke+'/>');
TABS.push({id:'rig',ic:IC.tRig,t:'Rig and pose',pane:'pRig',needSel:true});
/* name, parent, head, tail, radius. Fractions of body height; x is sideways (character's left is +x), y up, z forward. */
const RIG_L=[
  ['upperArm','chest',[.14,.795,0],[.155,.64,0],.05],
  ['foreArm','upperArm',[.155,.64,0],[.165,.50,0],.045],
  ['hand','foreArm',[.165,.50,0],[.16,.42,0],.05],
  ['upperLeg','hips',[.055,.505,0],[.055,.27,0],.075],
  ['lowerLeg','upperLeg',[.055,.27,0],[.06,.055,0],.06],
  ['foot','lowerLeg',[.06,.055,0],[.06,.02,.11],.05]];
const RIG_DEF=[
  ['hips',null,[0,.515,0],[0,.585,0],.13],
  ['spine','hips',[0,.585,0],[0,.70,0],.125],
  ['chest','spine',[0,.70,0],[0,.80,0],.135],
  ['neck','chest',[0,.80,0],[0,.865,.01],.04],
  ['head','neck',[0,.865,.01],[0,.995,.01],.10]];
RIG_L.forEach(b=>{ [['.L',1],['.R',-1]].forEach(s=>{
  const m=a=>[a[0]*s[1],a[1],a[2]], par=b[1]==='chest'||b[1]==='hips'?b[1]:b[1]+s[0];
  RIG_DEF.push([b[0]+s[0],par,m(b[2]),m(b[3]),b[4]]); }); });
const RIG_NAMES=RIG_DEF.map(b=>b[0]);
const RIG_LABEL=n=>n.replace('upperArm','Upper arm').replace('foreArm','Forearm').replace('upperLeg','Thigh').replace('lowerLeg','Shin').replace(/^([a-z])/,c=>c.toUpperCase()).replace('.L',' (left)').replace('.R',' (right)');
const RIG_PRESETS={
  'Rest pose':{},
  'T-pose':{'upperArm.L':[0,0,82],'upperArm.R':[0,0,-82]},
  'Arms forward':{'upperArm.L':[-85,0,0],'upperArm.R':[-85,0,0]},
  'Hands up':{'upperArm.L':[0,0,165],'upperArm.R':[0,0,-165]},
  'Wave':{'upperArm.R':[0,0,-150],'foreArm.R':[0,0,-35],'head':[0,12,-5]},
  'Walk step':{'upperLeg.L':[-28,0,0],'lowerLeg.L':[8,0,0],'upperLeg.R':[22,0,0],'lowerLeg.R':[35,0,0],'upperArm.L':[24,0,0],'upperArm.R':[-24,0,0],'foreArm.R':[-25,0,0],'spine':[4,0,0]},
  'Lean and look':{'spine':[10,0,0],'chest':[8,0,0],'neck':[-6,0,0],'head':[0,-30,0]}};
const RIG={sel:'chest',show:false};
const rigClone=p=>{ const o={}; if(p) Object.keys(p).forEach(k=>{ o[k]=p[k].slice(); }); return o; };
const rigMixB=(a,b,u)=>{ if(!a||!b) return a||b; const o={}; new Set(Object.keys(a).concat(Object.keys(b))).forEach(k=>{ const x=a[k]||[0,0,0], y=b[k]||[0,0,0]; o[k]=[x[0]+(y[0]-x[0])*u,x[1]+(y[1]-x[1])*u,x[2]+(y[2]-x[2])*u]; }); return o; };
const _rgE=new THREE.Euler(), _rgB=new THREE.Quaternion(), _rgBi=new THREE.Quaternion(), _rgC=new THREE.Quaternion();
function rigApply(node){
  const R=node.userData.rig; if(!R) return; const pose=node.userData.spec.pose||{}, sr=node.userData.spec.rig, base=(sr&&sr.base)||{};
  RIG_NAMES.forEach(n=>{ const e=pose[n]||[0,0,0], b=base[n]||[0,0,0]; R.bones[n].rotation.set(e[0]+b[0],e[1]+b[1],e[2]+b[2]); });
  /* T-pose models: elbow and wrist bends are authored for arms hanging down, so turn them into the bone's own frame (C = B^-1 C' B) */
  ['L','R'].forEach(sd=>{ const ub=base['upperArm.'+sd]; if(!ub||(!ub[0]&&!ub[1]&&!ub[2])) return; _rgE.set(ub[0],ub[1],ub[2]); _rgB.setFromEuler(_rgE); _rgBi.copy(_rgB).invert();
    ['foreArm.'+sd,'hand.'+sd].forEach(n=>{ const e=pose[n]; if(!e||base[n]) return; _rgE.set(e[0],e[1],e[2]); _rgC.setFromEuler(_rgE); R.bones[n].quaternion.copy(_rgBi).multiply(_rgC).multiply(_rgB); }); });
  if(R.creator&&R.creator.fingers) crFingers(R,pose);
  node.updateMatrixWorld(true);
}
function rigPoseSet(node,pose){ node.userData.spec.pose=rigClone(pose); rigApply(node); }
function rigNode(){ const n=S.sel&&nodes.get(S.sel); return n&&n.userData.rig?n:null; }
function rigRel(o,node){ const m=new THREE.Matrix4(); let c=o; while(c&&c!==node){ c.updateMatrix(); m.premultiply(c.matrix); c=c.parent; } return m; }
function rigLandmarks(BX,BY,BZ){
  const n=BX.length; let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
  for(let i=0;i<n;i++){ if(BX[i]<minX)minX=BX[i]; if(BX[i]>maxX)maxX=BX[i]; if(BY[i]<minY)minY=BY[i]; if(BY[i]>maxY)maxY=BY[i]; }
  const H=maxY-minY||1, cx=(minX+maxX)/2; let sz=0,nz=0;
  for(let i=0;i<n;i++){ const f=(BY[i]-minY)/H; if(f>.12&&f<.45){ sz+=BZ[i]; nz++; } }
  const cz=nz?sz/nz:0, NS=24, lo=new Float32Array(NS).fill(1e9), hi=new Float32Array(NS).fill(-1e9);
  for(let i=0;i<n;i++){ const f=(BY[i]-minY)/H, s=Math.floor((f-.72)/.01); if(s>=0&&s<NS){ if(BX[i]<lo[s])lo[s]=BX[i]; if(BX[i]>hi[s])hi[s]=BX[i]; } }
  let best=-1,bw=1e9; for(let s=1;s<NS-1;s++){ if(hi[s]<lo[s]||hi[s-1]<lo[s-1]||hi[s+1]<lo[s+1]) continue; const w=((hi[s-1]-lo[s-1])+(hi[s]-lo[s])+(hi[s+1]-lo[s+1]))/3; if(w<bw){ bw=w; best=s; } }
  let neckF=best>=0?.72+.01*best+.005:.86; neckF=Math.max(.78,Math.min(.9,neckF));
  const shF=neckF-.075; let armX=0,tip=1,sl=0,nl=0;
  for(let i=0;i<n;i++){ const f=(BY[i]-minY)/H, x=Math.abs(BX[i]-cx)/H; if(f>.34&&f<shF+.03&&x>armX) armX=x; if(f>.12&&f<.2){ sl+=x; nl++; } }
  armX=Math.max(.12,Math.min(.6,armX));
  for(let i=0;i<n;i++){ const f=(BY[i]-minY)/H, x=Math.abs(BX[i]-cx)/H; if(f>.25&&f<shF+.03&&x>armX*.82&&f<tip) tip=f; }
  if(tip>=1) tip=.42;
  const legX=nl?Math.max(.03,Math.min(.12,sl/nl)):.062; let tz=-1e9; for(let i=0;i<n;i++){ if((BY[i]-minY)/H<.08&&BZ[i]>tz) tz=BZ[i]; }
  const toe=Math.max(.04,Math.min(.18,(tz-cz)/H));
  return {H:H,minY:minY,cx:cx,cz:cz,neckF:neckF,shF:shF,armX:armX,tip:tip,legX:legX,toe:toe};
}
function rigJoints(L){
  const sh=L.shF, sx=Math.min(.14,L.armX*.75), wrX=L.armX*.92, wrF=Math.min(L.tip+.065,sh-.01), elX=sx+(wrX-sx)*.52, elF=sh+(wrF-sh)*.52, hipF=sh-.295, kneeF=.055+(hipF-.055)*.5, lx=L.legX, J={};
  J.hips=[[0,hipF+.01,0],[0,hipF+.08,0]]; J.spine=[[0,hipF+.08,0],[0,hipF+.195,0]]; J.chest=[[0,hipF+.195,0],[0,sh+.005,0]];
  J.neck=[[0,sh+.005,0],[0,L.neckF+.005,.01]]; J.head=[[0,L.neckF+.005,.01],[0,.995,.01]];
  [['.L',1],['.R',-1]].forEach(q=>{ const s=q[1], k=q[0];
    J['upperArm'+k]=[[sx*s,sh,0],[elX*s,elF,0]]; J['foreArm'+k]=[[elX*s,elF,0],[wrX*s,wrF,0]]; J['hand'+k]=[[wrX*s,wrF,0],[L.armX*.9*s,L.tip,0]];
    J['upperLeg'+k]=[[lx*.9*s,hipF,0],[lx*s,kneeF,0]]; J['lowerLeg'+k]=[[lx*s,kneeF,0],[lx*1.05*s,.055,0]]; J['foot'+k]=[[lx*1.05*s,.055,0],[lx*1.05*s,.02,L.toe]]; });
  return J;
}
/* Fit a humanoid skeleton to any mesh in a node and skin it. spec.rig={rot} turns the model so it faces +Z (0 = already faces +Z, -PI/2 = faces +X). */
function rigAuto(node,spec){
  const rot=(spec.rig&&spec.rig.rot)||0, c=Math.cos(rot), s=Math.sin(rot), body=(x,z)=>[x*c+z*s,-x*s+z*c], parts=[];
  node.traverse(o=>{ if(o.isMesh&&!o.isSkinnedMesh&&!o.userData.rigOwned&&!o.userData.glow&&o.geometry&&o.geometry.attributes.position) parts.push(o); });
  if(!parts.length) throw new Error('nothing to rig');
  const items=parts.map(o=>{ const g=o.geometry.clone(); g.applyMatrix4(rigRel(o,node)); return {o:o,g:g,m:o.material,paint:!!o.userData.paint}; });
  let tot=0; items.forEach(it=>{ tot+=it.g.attributes.position.count; });
  const BX=new Float32Array(tot), BY=new Float32Array(tot), BZ=new Float32Array(tot); let k=0;
  items.forEach(it=>{ const a=it.g.attributes.position.array; for(let i=0;i<a.length;i+=3){ const b=body(a[i],a[i+2]); BX[k]=b[0]; BY[k]=a[i+1]; BZ[k]=b[1]; k++; } });
  const L=rigLandmarks(BX,BY,BZ), H=L.H, J=rigJoints(L), pos=f=>[L.cx+f[0]*H,L.minY+f[1]*H,L.cz+f[2]*H];
  const root=new THREE.Object3D(); root.name='rigRoot'; root.rotation.y=-rot; root.userData.rigOwned=true; node.add(root);
  const bones={}, list=[], seg=[], markers=[], lines=[];
  const mkMat=new THREE.MeshBasicMaterial({color:0xffcc33,depthTest:false,transparent:true,opacity:.95}), lnMat=new THREE.LineBasicMaterial({color:0xffffff,depthTest:false,transparent:true,opacity:.8});
  RIG_DEF.forEach(d=>{
    const b=new THREE.Bone(); b.name=d[0]; const hp=pos(J[d[0]][0]), tp=pos(J[d[0]][1]);
    if(d[1]){ const pp=seg[RIG_NAMES.indexOf(d[1])].h; b.position.set(hp[0]-pp[0],hp[1]-pp[1],hp[2]-pp[2]); bones[d[1]].add(b); } else { b.position.set(hp[0],hp[1],hp[2]); root.add(b); }
    bones[d[0]]=b; list.push(b); seg.push({h:hp,t:tp,r:d[4]*H});
    const mk=new THREE.Mesh(new THREE.SphereGeometry(H*.017,10,8),mkMat.clone()); mk.userData.bone=d[0]; mk.userData.rigOwned=true; mk.renderOrder=999; mk.raycast=()=>{}; b.add(mk); markers.push(mk);
    const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(tp[0]-hp[0],tp[1]-hp[1],tp[2]-hp[2])]),lnMat); ln.userData.rigOwned=true; ln.renderOrder=998; ln.raycast=()=>{}; b.add(ln); lines.push(ln);
  });
  const showObjs=markers.concat(lines);
  node.updateMatrixWorld(true);
  const skel=new THREE.Skeleton(list);
  const W=new Float32Array(RIG_DEF.length), TY=RIG_NAMES.map(n=>/^(upperArm|foreArm|hand)/.test(n)?1:/^(upperLeg|lowerLeg|foot)/.test(n)?2:0), SD=RIG_NAMES.map(n=>n.endsWith('.L')?1:n.endsWith('.R')?2:0), CHEST=RIG_NAMES.indexOf('chest'), HIPS=RIG_NAMES.indexOf('hips');
  const allow=(k0,kk)=>{ if(kk===k0) return true; if(TY[k0]===1) return (TY[kk]===1&&SD[kk]===SD[k0])||kk===CHEST; if(TY[k0]===2) return (TY[kk]===2&&SD[kk]===SD[k0])||kk===HIPS; return TY[kk]===0||(kk>=5&&RIG_NAMES[kk].indexOf('upper')===0); };
  const dnAt=(px,py,pz)=>{ let mn=1e9,k0=0; for(let kk=0;kk<seg.length;kk++){ const S0=seg[kk], hx=S0.h[0],hy=S0.h[1],hz=S0.h[2], dx=S0.t[0]-hx,dy=S0.t[1]-hy,dz=S0.t[2]-hz;
      let t=((px-hx)*dx+(py-hy)*dy+(pz-hz)*dz)/(dx*dx+dy*dy+dz*dz); t=t<0?0:t>1?1:t; const ex=px-(hx+dx*t), ey=py-(hy+dy*t), ez=pz-(hz+dz*t), dn=Math.sqrt(ex*ex+ey*ey+ez*ez)/S0.r; W[kk]=dn; if(dn<mn){ mn=dn; k0=kk; } } return k0; };
  items.forEach(it=>{
    const a=it.g.attributes.position.array, n=a.length/3, si=new Uint16Array(n*4), sw=new Float32Array(n*4), rigid=n<400;
    let rb=0; if(rigid){ let mx=0,my=0,mz=0; for(let v=0;v<n;v++){ const bz=body(a[v*3],a[v*3+2]); mx+=bz[0]; my+=a[v*3+1]; mz+=bz[1]; } rb=dnAt(mx/n,my/n,mz/n); }
    for(let v=0;v<n;v++){
      if(rigid){ si[v*4]=rb; sw[v*4]=1; continue; }
      const bz=body(a[v*3],a[v*3+2]), k0=dnAt(bz[0],a[v*3+1],bz[1]); let mn=W[k0];
      let i1=-1,i2=-1,i3=-1,i4=-1,w1=0,w2=0,w3=0,w4=0;
      for(let kk=0;kk<seg.length;kk++){
        if(!allow(k0,kk)) continue; const w=Math.exp(-6*(W[kk]-mn)); if(w<.04) continue;
        if(w>w1){ i4=i3;w4=w3;i3=i2;w3=w2;i2=i1;w2=w1;i1=kk;w1=w; } else if(w>w2){ i4=i3;w4=w3;i3=i2;w3=w2;i2=kk;w2=w; } else if(w>w3){ i4=i3;w4=w3;i3=kk;w3=w; } else if(w>w4){ i4=kk;w4=w; }
      }
      const tt=w1+w2+w3+w4||1; si[v*4]=Math.max(i1,0); si[v*4+1]=Math.max(i2,0); si[v*4+2]=Math.max(i3,0); si[v*4+3]=Math.max(i4,0); sw[v*4]=w1/tt; sw[v*4+1]=w2/tt; sw[v*4+2]=w3/tt; sw[v*4+3]=w4/tt;
    }
    it.g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4)); it.g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
    [].concat(it.m).forEach(m=>{ m.skinning=true; m.needsUpdate=true; });
    const sm=new THREE.SkinnedMesh(it.g,it.m); sm.castShadow=true; sm.receiveShadow=true; sm.frustumCulled=false; sm.userData.rigOwned=true; sm.userData.paint=it.paint; node.add(sm);
    node.updateMatrixWorld(true); sm.bind(skel,sm.matrixWorld);
  });
  items.forEach(it=>{ if(it.o.parent) it.o.parent.remove(it.o); it.o.geometry.dispose(); });
  showObjs.forEach(o=>{ o.visible=false; });
  node.userData.rig={bones:bones,markers:markers,showObjs:showObjs,H:H,L:L};
  try{ if(!(spec.rig&&spec.rig.full===false)) mfExtend(node,spec); }catch(e){ console.warn('full rig',e); }
  if(node.userData.sc) delete node.userData.sc;
  node.userData.spec=spec; if(spec.pose) rigApply(node);
  return L;
}
/* ---- viewport: joint dots and tapping ---- */
function rigVisibleSync(){
  const n=rigNode(), want=!!n&&ptab==='rig'&&S.view==='free'&&!S.recording;
  nodes.forEach(nd=>{ const R=nd.userData.rig; if(!R) return; const on=want&&nd===n; if(R.on!==on){ R.on=on; R.showObjs.forEach(o=>{ o.visible=on; }); } });
  RIG.show=want;
  if(n){ const R=n.userData.rig; R.markers.forEach(m=>{ const sel=m.userData.bone===RIG.sel; m.material.color.setHex(sel?0xff4a3a:0xffcc33); m.scale.setScalar(sel?1.6:1); }); }
}
function rigPick(cx,cy){
  const n=rigNode(); if(!n||!RIG.show) return false;
  const r=renderer.domElement.getBoundingClientRect(), v=new THREE.Vector3(); let best=null,bd=30;
  n.userData.rig.markers.forEach(m=>{ m.getWorldPosition(v); v.project(edit); if(v.z>1) return;
    const d=Math.hypot((v.x*.5+.5)*r.width+r.left-cx,(-v.y*.5+.5)*r.height+r.top-cy); if(d<bd){ bd=d; best=m.userData.bone; } });
  if(!best) return false; rigSelectBone(best); return true;
}
/* ---- pane ---- */
let rigUi={};
function rigSelectBone(b){ RIG.sel=b; rigPaneSync(); rigVisibleSync(); }
function rigCommit(){ const n=rigNode(); if(!n) return; if(S.autokey) addKey(n.userData.id); queueSave(); }
function rigAxis(i){ return (v)=>{ const n=rigNode(); if(!n) return; const p=n.userData.spec.pose||(n.userData.spec.pose={}); const e=p[RIG.sel]||(p[RIG.sel]=[0,0,0]); e[i]=v*Math.PI/180; rigApply(n); }; }
function rigPaneSync(){
  const n=rigNode(), st=rigUi.stat; if(!st) return; const sel=S.sel&&nodes.get(S.sel);
  st.textContent=n?('Skeleton ready on '+n.userData.name+'. Tap a yellow joint, or pick a bone below.'):(sel&&sel.userData&&sel.userData.type?('"'+sel.userData.name+'" has no skeleton yet. Choose which way it faces, then tap Auto-rig.'):'Select a model first. Any standing person-shaped model can be rigged.');
  if(rigUi.bn) rigUi.bn.textContent=n?('Bone: '+RIG_LABEL(RIG.sel)):'';
  if(rigUi.fields) rigUi.fields.forEach(f=>f.update());
  if(rigUi.btns) rigUi.btns.forEach(b=>b.classList.toggle('on',b.dataset.b===RIG.sel));
}
function rigDo(){
  const node=S.sel&&nodes.get(S.sel); if(!node||S.sel==='cam'||S.sel==='tgt'){ toast('Select a model first.'); return; }
  const sp=node.userData.spec; if(node.userData.rig){ toast('Already rigged. Use Remove rig first to fit it again.'); return; }
  if(sp.type==='figure'){ toast('The built-in Figure already walks without a rig.'); return; }
  if(sp.type==='light'||sp.type==='orb'){ toast('Lights cannot be rigged.'); return; }
  try{ sculptFlush(); scEnd(); scMatcapSync(true); sp.rig={rot:+rigUi.face.value||0}; rigAuto(node,sp); }
  catch(err){ delete sp.rig; toast('Could not rig this model: '+((err&&err.message)||'error')); return; }
  selectId(S.sel); rigPaneSync(); rigVisibleSync(); queueSave();
  toast('Rigged. Check the yellow joints sit on the shoulders, hips and knees. If not, Remove rig and pick another facing direction.'+(sp.transient?' This imported model is not saved when you reload.':''));
}
function rigRebuild(id){
  const old=nodes.get(id), sp=old.userData.spec; sp.p=old.position.toArray(); sp.r=[old.rotation.x,old.rotation.y,old.rotation.z]; sp.s=old.scale.toArray();
  tc.detach(); scene.remove(old); old.traverse(o=>{ if(o.geometry) o.geometry.dispose(); });
  const nn=makeNode(sp); scene.add(nn); nodes.set(id,nn); selectId(id); return nn;
}
function rigUndo(){
  const node=rigNode(); if(!node){ toast('This model has no rig.'); return; }
  const sp=node.userData.spec;
  if(!(sp.type==='sculpt'||sp.type==='custom'||(sp.type==='glb'&&sp.embed!=null))){ toast('Re-import the model to remove its rig.'); return; }
  delete sp.rig; delete sp.pose; if(sp.type==='glb'&&EMBED_GLB[sp.embed]&&EMBED_GLB[sp.embed].humanoid){ toast('This bundled character always has its skeleton.'); sp.rig=embedRigSpec(EMBED_GLB[sp.embed]); return; }
  rigRebuild(S.sel); rigPaneSync(); rigVisibleSync(); queueSave(); toast('Rig removed.');
}
function rigPoseApply(name){
  const n=rigNode(); if(!n){ toast('Select the realistic character first.'); return; }
  const o={}; Object.keys(RIG_PRESETS[name]).forEach(k=>{ const e=RIG_PRESETS[name][k]; o[k]=[e[0]*Math.PI/180,e[1]*Math.PI/180,e[2]*Math.PI/180]; }); rigPoseSet(n,o);
  rigPaneSync(); rigCommit(); toast(name+' applied'+(S.autokey?' and keyed.':'. Press Set key to keep it in the timeline.'));
}
function rigMirror(fromL){
  const n=rigNode(); if(!n) return; const p=n.userData.spec.pose||(n.userData.spec.pose={}), a=fromL?'.L':'.R', b=fromL?'.R':'.L';
  RIG_NAMES.filter(x=>x.endsWith(a)).forEach(x=>{ const e=p[x]||[0,0,0]; p[x.slice(0,-2)+b]=[e[0],-e[1],-e[2]]; });
  rigApply(n); rigPaneSync(); rigCommit();
}
function buildRigPane(){
  const host=document.createElement('div'); host.className='pane'; host.id='pRig'; host.hidden=true; $('#pAi').parentNode.appendChild(host);
  const stat=document.createElement('p'); stat.className='note'; stat.style.color='var(--fg)'; rigUi.stat=stat;
  const face=document.createElement('select'); face.className='sel2'; face.setAttribute('aria-label','Which way the model faces'); face.innerHTML='<option value="0">Faces the front (toward you in the default view)</option><option value="-1.5708">Faces the right</option><option value="1.5708">Faces the left</option><option value="3.1416">Faces away</option>'; rigUi.face=face;
  const arow=document.createElement('div'); arow.className='g2'; arow.append(scBtn('Auto-rig selected model',rigDo,'hi'),scBtn('Remove rig',rigUndo));
  const bn=document.createElement('p'); bn.className='note'; bn.style.color='var(--fg)'; bn.style.fontWeight='600'; rigUi.bn=bn;
  const fl=(label,i)=>rangeField(label,-170,170,1,()=>{ const n=rigNode(),e=n&&n.userData.spec.pose&&n.userData.spec.pose[RIG.sel]; return e?e[i]*180/Math.PI:0; },rigAxis(i),v=>Math.round(v)+'°',rigCommit);
  rigUi.fields=[fl('Bend forward or back',0),fl('Turn (twist)',1),fl('Swing sideways',2)];
  const groups=[['Body',['hips','spine','chest','neck','head']],['Left side',RIG_NAMES.filter(x=>x.endsWith('.L'))],['Right side',RIG_NAMES.filter(x=>x.endsWith('.R'))]];
  rigUi.btns=[]; const pickers=groups.map(g=>{ const d=document.createElement('div'); d.className='g2'; g[1].forEach(nm=>{ const b=scBtn(RIG_LABEL(nm).replace(' (left)','').replace(' (right)',''),()=>rigSelectBone(nm)); b.dataset.b=nm; rigUi.btns.push(b); d.appendChild(b); }); return panel(g[0],[d],g[0]==='Body'); });
  const pre=document.createElement('div'); pre.className='g2'; Object.keys(RIG_PRESETS).forEach(k=>pre.appendChild(scBtn(k,()=>rigPoseApply(k))));
  const act=document.createElement('div'); act.className='g2';
  act.append(scBtn('Reset this bone',()=>{ const n=rigNode(); if(!n) return; const p=n.userData.spec.pose; if(p) delete p[RIG.sel]; rigApply(n); rigPaneSync(); rigCommit(); }),
    scBtn('Reset whole pose',()=>rigPoseApply('Rest pose')),
    scBtn('Copy left to right',()=>rigMirror(true)),scBtn('Copy right to left',()=>rigMirror(false)),
    scBtn('Make it walk',()=>rigWalkUi(false),'hi'),scBtn('Walk with tracking camera',()=>rigWalkUi(true),'hi'),
    scBtn('Set key at playhead',()=>{ const n=rigNode(); if(n){ addKey(n.userData.id); toast('Pose keyed at '+S.t.toFixed(2)+' s.'); } },'hi'));
  host.append(panel('Auto-rig any model',[stat,row('Facing',face),arow,noteEl('Works on a standing, person-shaped model with arms and legs apart: a sculpt, an imported .glb, or an AI-built model. The studio finds the shoulders, hips and knees, fits 17 bones and skins the mesh to them. Sculpting is locked while a model is rigged.')]),
    panel('Poses',[pre]),
    panel('Selected bone',[bn].concat(rigUi.fields,[act,noteEl('Move the playhead, change the pose, then Set key. Turn on auto key (the red dot) to key every change. Playback blends between poses.')])),
    panel('Walk',[(()=>{ const sl=document.createElement('select'); sl.className='sel2'; sl.setAttribute('aria-label','Tracking camera angle'); [['34','Front three-quarter'],['front','Front (walks toward camera)'],['side','Side (profile)'],['back','Behind (follow)']].forEach(q=>{ const op=document.createElement('option'); op.value=q[0]; op.textContent=q[1]; sl.appendChild(op); }); sl.value=rigWalkCam; sl.addEventListener('change',()=>{ rigWalkCam=sl.value; }); return row('Tracking camera',sl); })(),noteEl('Make it walk fills the whole timeline with a walking loop in the direction the character faces. Walk with tracking camera also moves the camera to follow from the angle you pick here. Side gives a profile shot, so he crosses the frame sideways. It replaces the character\u2019s existing keys.')]),
    panel('Choose a bone',pickers,true));
  rigPaneSync(); setInterval(()=>{ try{ rigVisibleSync(); if(ptab==='rig'&&rigUi.last!==S.sel){ rigUi.last=S.sel; rigPaneSync(); } }catch(e){} },250);
}
/* ---- Ask Claude ---- */
function rigModelToolDef(){
  return {name:'auto_rig_model',description:'Fit a humanoid skeleton to a standing, person-shaped model (sculpt, imported or AI-built) so it can be posed and walked. facing is the direction the model faces: front (toward the viewer), right, left or away.',
    inputSchema:ob({name:{type:'string'},facing:{type:'string',enum:['front','right','left','away']}},['name']),
    execute:i=>{ const id=findId(i.name), n=id&&nodes.get(id); if(!n) throw new Error('No object with that name.'); selectId(id); rigUi.face.value=({front:'0',right:'-1.5708',left:'1.5708',away:'3.1416'})[i.facing||'front']; rigDo(); return {rigged:!!n.userData.rig}; }};
}
function walkToolDef(){
  return {name:'walk_character',description:'Make the realistic character walk forward in the direction it faces for the whole timeline, with a full walk cycle. Replaces its keyframes. follow_camera also keys the camera to track it; camera_angle picks where the camera sits: 34 (front three-quarter, default), front, side or back.',
    inputSchema:ob({name:{type:'string'},speed_m_per_s:{type:'number'},follow_camera:{type:'boolean'},camera_angle:{type:'string',enum:['34','front','side','back']}},['name']),
    execute:i=>{ const id=findId(i.name); const r=rigWalk(id,{speed:i.speed_m_per_s,follow:!!i.follow_camera,cam:i.camera_angle}); logAi('~ walk: '+i.name); return r; }};
}
function rigToolDef(){
  return {name:'pose_character',description:'Pose the realistic character’s skeleton, optionally as a keyframe. Bones: '+RIG_NAMES.join(', ')+'. Each value is [bend, twist, swing] in degrees: bend (x) rotates forward or back (arms and legs swing forward with negative x, a head or spine leans forward with positive x), twist (y) turns around the bone, swing (z) tilts sideways (left arm raises outward with positive z, right arm with negative z). Bones not listed keep their value. Use time_seconds to place the pose on the timeline; blends between poses are automatic.',
    inputSchema:ob({name:{type:'string'},time_seconds:{type:'number'},pose:{type:'object',additionalProperties:{type:'array',items:{type:'number'},minItems:3,maxItems:3}}},['name','pose']),
    execute:i=>{
      const id=findId(i.name), n=id&&nodes.get(id); if(!n||!n.userData.rig) throw new Error('That object has no skeleton. Use the realistic character.');
      const add={}; Object.keys(i.pose||{}).forEach(k=>{ if(RIG_NAMES.indexOf(k)<0) return; const e=i.pose[k]; if(Array.isArray(e)&&e.length>=3) add[k]=e.slice(0,3).map(d=>clamp(+d||0,-170,170)*Math.PI/180); });
      if(i.time_seconds==null){ rigPoseSet(n,Object.assign(rigClone(n.userData.spec.pose),add)); }
      else { const tt=clamp(+i.time_seconds||0,0,S.duration), sm=sampleTrack(id,tt), k=keyAt(id,tt,{}); k.b=Object.assign(rigClone(sm&&sm.b?sm.b:n.userData.spec.pose),add); }
      refreshScene(); logAi('~ pose: '+n.userData.name+(i.time_seconds!=null?' at '+(+i.time_seconds).toFixed(1)+'s':'')); return {posed:n.userData.name,bones:Object.keys(add)};
    }};
}
/* ---- walk cycle ---- */
function rigWalkPose(ph){
  const r=Math.PI/180, sL=Math.sin(ph), sR=-sL, cL=Math.cos(ph), cR=-cL, A=28*r, K=38*r;
  return {
    'upperLeg.L':[-A*sL,0,0],'upperLeg.R':[-A*sR,0,0],
    'lowerLeg.L':[6*r+K*Math.max(0,cL),0,0],'lowerLeg.R':[6*r+K*Math.max(0,cR),0,0],
    'foot.L':[-6*r*cL,0,0],'foot.R':[-6*r*cR,0,0],
    'upperArm.L':[22*r*sL,0,6*r],'upperArm.R':[22*r*sR,0,-6*r],
    'foreArm.L':[-(14*r+10*r*Math.max(0,-sL)),0,0],'foreArm.R':[-(14*r+10*r*Math.max(0,-sR)),0,0],
    'hips':[0,-5*r*sL,0],'spine':[3*r,6*r*sL,0],'chest':[2*r,3*r*sL,0],'head':[-4*r,-6*r*sL,0]};
}
const RIG_WALK_CAM={front:[0,3.4,1.45],'34':[1.9,2.9,1.45],side:[3.6,.4,1.35],back:[.35,-3.3,1.55]};   /* [to the side, ahead (+) or behind (-), height] */
let rigWalkCam='34';
function rigWalk(id,o){
  o=o||{}; const n=nodes.get(id); if(!n||!n.userData.rig) throw new Error('Select the realistic character first.');
  const dur=S.duration, speed=clamp(+o.speed||1.3,.4,3), T=1.2*1.3/speed, step=T/8;
  const sr=n.userData.spec&&n.userData.spec.rig, rr=(sr&&sr.rot)||0, th=n.rotation.y-rr, fwd=new THREE.Vector3(Math.sin(th),0,Math.cos(th)), side=new THREE.Vector3(fwd.z,0,-fwd.x);   /* models face +z; rig.rot turns models built facing another way */
  const p0=(S.tracks[id]&&S.tracks[id].length?sampleTrack(id,0).p:n.position.toArray()), rot=[n.rotation.x,n.rotation.y,n.rotation.z], sc=n.scale.toArray();
  const ks=[], ck=[], tk=[];
  for(let t=0;t<=dur+1e-6;t+=step){
    const tt=+Math.min(t,dur).toFixed(3), ph=2*Math.PI*tt/T, d=speed*tt;
    const p=[p0[0]+fwd.x*d,p0[1]+.022*Math.cos(2*ph),p0[2]+fwd.z*d];
    ks.push({t:tt,p:p,r:rot.slice(),s:sc.slice(),b:rigWalkPose(ph)});
    if(o.follow){ const c=[p0[0]+fwd.x*d,0,p0[2]+fwd.z*d];
      const V=RIG_WALK_CAM[o.cam]||RIG_WALK_CAM['34'];
      ck.push({t:tt,p:[c[0]+side.x*V[0]+fwd.x*V[1],V[2],c[2]+side.z*V[0]+fwd.z*V[1]],f:look.fov});
      tk.push({t:tt,p:[c[0],1.05,c[2]]}); }
  }
  S.ease='linear'; S.tracks[id]=ks;
  if(o.follow){ S.tracks.cam=ck; S.tracks.tgt=tk; }
  S.t=0; refreshScene(); return {keys:ks.length,seconds:dur};
}
function rigWalkUi(follow){
  const n=rigNode(); if(!n){ toast('Select the realistic character first.'); return; }
  try{ const r=rigWalk(n.userData.id,{follow:follow,cam:rigWalkCam}); toast('Walk made: '+r.seconds+' s. Press play.'); }catch(err){ toast(err.message||'Could not make the walk.'); }
}

function openRigTab(){
  let id=rigNode()?S.sel:null; if(!id){ for(const [k,n] of nodes){ if(n.userData.rig){ id=k; break; } } }
  if(!id){ toast('Load the realistic character first (File menu).'); return; }
  if(root.classList.contains('hide-side')){ root.classList.remove('hide-side'); requestAnimationFrame(fit); }
  selectId(id); showTab('rig');
}
