
/* ---------- objects ---------- */
const TYPES={figure:'Figure',monolith:'Monolith',rock:'Rock',box:'Box',sphere:'Sphere',cylinder:'Pillar',orb:'Glow orb',light:'Point light',custom:'AI model',glb:'Imported model',creator:'Character'};
const ADDABLE=['figure','box','sphere','cylinder','rock','light'];
const std=(c,r,m)=>new THREE.MeshStandardMaterial({color:lin(c),roughness:r,metalness:m});
let idCounter=0;
function paintable(mesh){ mesh.castShadow=true; mesh.receiveShadow=true; mesh.userData.paint=true; return mesh; }

function makeFigure(c,r,m){
  const g=new THREE.Group(), mt=std(c,r,m);
  const torso=paintable(new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,.7,16),mt)); torso.position.y=1.15;
  const head=paintable(new THREE.Mesh(new THREE.SphereGeometry(.17,20,16),mt)); head.position.y=1.7;
  const limb=(len,rad,x,y)=>{ const p=new THREE.Group(); p.position.set(x,y,0);
    const mesh=paintable(new THREE.Mesh(new THREE.CylinderGeometry(rad,rad*.85,len,10),mt)); mesh.position.y=-len/2; p.add(mesh); return p; };
  const lL=limb(.8,.09,-.12,.8), lR=limb(.8,.09,.12,.8), aL=limb(.65,.065,-.3,1.45), aR=limb(.65,.065,.3,1.45);
  g.add(torso,head,lL,lR,aL,aR); g.userData.limbs={lL,lR,aL,aR}; g.userData.walk=true; return g;
}
function makeNode(spec){
  let node;
  const c=spec.color, r=spec.rough, m=spec.metal;
  switch(spec.type){
    case 'figure': node=makeFigure(c,r,m); break;
    case 'custom': node=buildParts(cleanParts(spec.parts)); break;
    case 'sculpt': node=buildSculpt(spec); break;
    case 'creator': node=new THREE.Group(); crBuild(node,spec); break;
    case 'glb': node=new THREE.Group(); if(spec.embed!=null) embedFill(node,spec); break;
    case 'monolith': node=new THREE.Group(); node.add(paintable(new THREE.Mesh(new THREE.BoxGeometry(1.6,5,.6).translate(0,2.5,0),std(c,r,m)))); break;
    case 'rock': node=new THREE.Group(); node.add(paintable(new THREE.Mesh(new THREE.DodecahedronGeometry(.8,0).translate(0,.55,0),std(c,r,m)))); break;
    case 'sphere': node=new THREE.Group(); node.add(paintable(new THREE.Mesh(new THREE.SphereGeometry(.6,32,20).translate(0,.6,0),std(c,r,m)))); break;
    case 'cylinder': node=new THREE.Group(); node.add(paintable(new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,3.2,28).translate(0,1.6,0),std(c,r,m)))); break;
    case 'orb':
    case 'light': {
      node=new THREE.Group();
      const em=new THREE.MeshStandardMaterial({color:lin('#000000'),emissive:lin(c),emissiveIntensity:4,roughness:1});
      const ball=new THREE.Mesh(new THREE.SphereGeometry(spec.type==='orb'?.32:.14,24,16),em); ball.userData.glow=true; node.add(ball);
      const pl=new THREE.PointLight(lin(c),spec.type==='orb'?3:6,spec.type==='orb'?22:30,2); pl.castShadow=false; pl.userData.glow=true; node.add(pl);
      break; }
    default: node=new THREE.Group();
  }
  if(spec.rig&&spec.type!=='glb'&&spec.type!=='figure'){ try{ rigAuto(node,spec); }catch(err){ toast('Rig failed: '+((err&&err.message)||'error')); } }
  node.userData.id=spec.id; node.userData.name=spec.name; node.userData.type=spec.type; node.userData.spec=spec;
  node.position.fromArray(spec.p); if(spec.ro) node.rotation.order=spec.ro; node.rotation.set(spec.r[0],spec.r[1],spec.r[2]); node.scale.fromArray(spec.s); node.visible=!spec.hidden;
  return node;
}
function mkSpec(type,over){
  idCounter++;
  const base={id:'o'+idCounter,type,name:TYPES[type]+' '+idCounter,p:[0,0,0],r:[0,0,0],s:[1,1,1],color:'#8a8478',rough:.7,metal:0};
  if(type==='figure'){base.color='#b9b2a3';base.rough=.6;}
  if(type==='monolith'){base.color='#25272b';base.rough=.3;base.metal=.15;}
  if(type==='rock'){base.color='#5a554e';base.rough=.9;}
  if(type==='orb'){base.color='#ffb46b';}
  if(type==='light'){base.color='#ffd9a8';base.p=[0,2.5,0];}
  if(type==='custom'){base.parts=[];}
  return Object.assign(base,over||{});
}
function addNode(spec){
  const node=makeNode(spec); scene.add(node); nodes.set(spec.id,node); order.push(spec.id); return node;
}
function removeNode(id){
  const node=nodes.get(id); if(!node||id==='cam'||id==='tgt') return;
  tc.detach(); scene.remove(node);
  node.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material) o.material.dispose(); });
  nodes.delete(id); order=order.filter(x=>x!==id); delete S.tracks[id];
  if(S.sel===id) S.sel=null; S.selKey=null;
}
function clearObjects(){ [...order].filter(i=>i!=='cam'&&i!=='tgt').forEach(removeNode); order=['cam','tgt']; S.sel=null; S.selKey=null; }

function demoProject(){
  const fig=mkSpec('figure',{name:'Wanderer',p:[-5,0,3]});
  const mono=mkSpec('monolith',{name:'Monolith',p:[5,0,-4],r:[0,.35,0]});
  const orb=mkSpec('orb',{name:'Glow orb',p:[2.9,1.5,-3.4]});
  const pil1=mkSpec('cylinder',{name:'Pillar A',p:[-2,0,-6],color:'#6d675e',rough:.85});
  const pil2=mkSpec('cylinder',{name:'Pillar B',p:[0.5,0,-9],s:[1.2,1.5,1.2],color:'#6d675e',rough:.85});
  const rock=mkSpec('rock',{name:'Boulder',p:[-1.5,0,0.8],s:[1.4,1.1,1.2],color:'#4f4a44',rough:.92});
  const k=(t,p,extra)=>Object.assign({t:t,p:p},extra||{});
  return {
    objs:[fig,mono,orb,pil1,pil2,rock],
    duration:8,
    cam:{p:[-9,1.2,8]}, tgt:{p:[-5,1.1,3]},
    tracks:{
      cam:[k(0,[-9,1.2,8],{f:42}),k(4,[-3.2,1.1,5.8],{f:36}),k(8,[3.4,1.6,3.2],{f:28})],
      tgt:[k(0,[-5,1.1,3]),k(4,[-1.6,1.3,1]),k(8,[3.6,2.3,-3.4])],
      [fig.id]:[k(0,[-5,0,3],{r:[0,0,0],s:[1,1,1]}),k(8,[2.6,0,-1.8],{r:[0,0,0],s:[1,1,1]})]
    }
  };
}
function loadProject(pr){
  clearObjects(); idCounter=0;
  pr.objs.forEach(sp=>{ const n=parseInt(String(sp.id).replace(/\D/g,''),10); if(n>idCounter) idCounter=n; addNode(sp); });
  camNode.position.fromArray(pr.cam.p); tgtNode.position.fromArray(pr.tgt.p);
  S.tracks=pr.tracks||{}; S.duration=pr.duration||8; S.audio=(pr.audio&&Array.isArray(pr.audio.cues))?pr.audio:{beds:[],cues:[]};  S.caps=Array.isArray(pr.caps)?pr.caps:[]; S.vo=(pr.vo&&pr.vo.id)?pr.vo:null; S.exp=Array.isArray(pr.exp)?pr.exp:[];
  S.t=0; S.selKey=null; S.sel=null;
}

/* ---------- tracks ---------- */
const EASE={linear:u=>u,inout:u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2,in:u=>u*u*u,out:u=>1-Math.pow(1-u,3)};
function catmull(p0,p1,p2,p3,u){
  const u2=u*u,u3=u2*u;
  return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u2+(-p0+3*p1-3*p2+p3)*u3);
}
function sampleTrack(id,t){
  const ks=S.tracks[id]; if(!ks||!ks.length) return null;
  if(t<=ks[0].t) return {p:ks[0].p,r:ks[0].r,s:ks[0].s,f:ks[0].f,b:ks[0].b};
  const last=ks[ks.length-1]; if(t>=last.t) return {p:last.p,r:last.r,s:last.s,f:last.f,b:last.b};
  let i=0; while(i<ks.length-2&&ks[i+1].t<=t) i++;
  const a=ks[i], b=ks[i+1], u=EASE[S.ease]((t-a.t)/(b.t-a.t));
  const mix=(x,y)=>x&&y?x.map((v,j)=>v+(y[j]-v)*u):(x||y);
  let p;
  if(id==='cam'||id==='tgt'){
    const p0=(ks[i-1]||a).p, p3=(ks[i+2]||b).p;
    p=[0,1,2].map(j=>catmull(p0[j],a.p[j],b.p[j],p3[j],u));
  } else p=mix(a.p,b.p);
  return {p:p,b:rigMixB(a.b,b.b,u),r:mix(a.r,b.r),s:mix(a.s,b.s),f:(a.f!=null&&b.f!=null)?a.f+(b.f-a.f)*u:(a.f!=null?a.f:b.f)};
}
const yawState={};
function applyTracks(t){
  for(const id of Object.keys(S.tracks)){
    const node=nodes.get(id); const sm=sampleTrack(id,t); if(!node||!sm) continue;
    node.position.fromArray(sm.p);
    if(id==='cam'){ if(sm.f!=null&&Math.abs(sm.f-look.fov)>1e-4){ look.fov=sm.f; cinema.fov=sm.f; cinema.updateProjectionMatrix(); syncFov(); } }
    else if(id!=='tgt'){ if(sm.r) node.rotation.set(sm.r[0],sm.r[1],sm.r[2]); if(sm.s) node.scale.fromArray(sm.s); if(sm.b&&node.userData.rig) rigPoseSet(node,sm.b); }
  }
}
function walkPose(){
  for(const id of order){
    const node=nodes.get(id); if(!node||!node.userData.walk) continue;
    const now=sampleTrack(id,S.t), prev=sampleTrack(id,S.t-.1); let speed=0;
    if(now&&prev){
      const dx=now.p[0]-prev.p[0], dz=now.p[2]-prev.p[2], len=Math.hypot(dx,dz); speed=len/.1;
      if(len>.003) yawState[id]=Math.atan2(dx,dz);
      if(yawState[id]!=null) node.rotation.y=yawState[id];
    }
    const amt=clamp(speed/1.3,0,1), sw=Math.sin(S.t*7.5)*.65*amt, L=node.userData.limbs;
    L.lL.rotation.x=sw; L.lR.rotation.x=-sw; L.aL.rotation.x=-sw*.8; L.aR.rotation.x=sw*.8;
  }
}
function updateRig(){
  cinema.position.copy(camNode.position);
  if(camNode.position.distanceToSquared(tgtNode.position)>1e-6) cinema.lookAt(tgtNode.position);
  cinema.updateMatrixWorld();
  if(camNode.position.distanceToSquared(tgtNode.position)>1e-6) camNode.lookAt(tgtNode.position);
  const a=linkGeo.attributes.position; a.setXYZ(0,camNode.position.x,camNode.position.y,camNode.position.z); a.setXYZ(1,tgtNode.position.x,tgtNode.position.y,tgtNode.position.z); a.needsUpdate=true;
}
function snap(id){
  const n=nodes.get(id), k={t:+S.t.toFixed(3),p:n.position.toArray()};
  if(id==='cam') k.f=look.fov;
  else if(id!=='tgt'){ k.r=[n.rotation.x,n.rotation.y,n.rotation.z]; k.s=n.scale.toArray(); if(n.userData.rig) k.b=rigClone(n.userData.spec.pose); }
  return k;
}
function addKey(id){
  if(!id||!nodes.has(id)) return;
  const ks=S.tracks[id]||(S.tracks[id]=[]), k=snap(id), tol=.5/S.fps;
  const ex=ks.findIndex(x=>Math.abs(x.t-k.t)<tol);
  if(ex>=0){ k.t=ks[ex].t; ks[ex]=k; S.selKey={id:id,k:ks[ex]}; } else { ks.push(k); ks.sort((a,b)=>a.t-b.t); S.selKey={id:id,k:k}; }
  renderTimeline(); queueSave();
}
function deleteKey(){
  if(!S.selKey){ toast('Tap a keyframe diamond first.'); return; }
  const ks=S.tracks[S.selKey.id]; if(!ks) return;
  const i=ks.indexOf(S.selKey.k); if(i>=0) ks.splice(i,1);
  if(!ks.length) delete S.tracks[S.selKey.id];
  S.selKey=null; renderTimeline(); queueSave();
}

