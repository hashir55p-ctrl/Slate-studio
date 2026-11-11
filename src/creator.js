/* ---------- character creator: parametric humanoid with the studio skeleton + a real face rig ---------- */
const CR_DEF={name:'New character',bodyType:'masculine',height:1.75,build:1,shoulders:1,head:1,waist:1,hips:1,chest:1,bust:1,skin:'#c8946b',hair:'short',hairColor:'#1d1511',shirt:'#3f6fb0',pants:'#2b2f3a',shoes:'#1a1a1a',eyes:'#4a3020',brow:'#1d1511',beard:'none',glasses:'none',top:'tee',backpack:'no',fit:1,shoeStyle:'plain'};
const CR_VIS=[[0,1,0],[1,1.05,0],[.5,1.25,0],[.3,1.35,0],[.65,.9,.8],[.35,.8,1],[.12,1.2,0],[0,1,0]];   /* open, width, round per viseme code */
function crMat(c,r,m){ return new THREE.MeshStandardMaterial({color:lin(c),roughness:r==null?.7:r,metalness:m||0}); }
/* Build 127: subtle, tileable micro-surface for skin. The grayscale map is used
   only for bump/roughness, so it does not tint the chosen skin colour. */
function crSkinMat(c){
  const size=256, cv=document.createElement('canvas'); cv.width=cv.height=size;
  const cx=cv.getContext('2d'), im=cx.createImageData(size,size), d=im.data;
  let seed=127; const rnd=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){
    const i=(y*size+x)*4, n=(rnd()-.5)*13;
    const wave=Math.sin(x*.31+Math.sin(y*.17)*1.7)*1.8+Math.sin(y*.27+x*.09)*1.2;
    const v=Math.max(0,Math.min(255,226+n+wave)); d[i]=d[i+1]=d[i+2]=v; d[i+3]=255;
  }
  cx.putImageData(im,0,0);
  /* Tiny irregular pore marks, sparse enough to avoid a stippled appearance. */
  for(let i=0;i<760;i++){
    const x=rnd()*size,y=rnd()*size,r=.35+rnd()*.75;
    cx.fillStyle=rnd()>.48?'rgba(35,25,20,.20)':'rgba(255,255,255,.20)';
    cx.beginPath(); cx.ellipse(x,y,r,r*(.65+rnd()*.7),rnd()*Math.PI,0,Math.PI*2); cx.fill();
  }
  const tex=new THREE.CanvasTexture(cv); tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(2,2); tex.generateMipmaps=true; tex.minFilter=THREE.LinearMipmapLinearFilter;
  const mat=crMat(c,.7,0); mat.bumpMap=tex; mat.bumpScale=.00055; mat.roughnessMap=tex; mat.roughness=.72;
  mat.userData.skinMicroTexture=true; mat.needsUpdate=true; return mat;
}
function crMakeTorsoMesh(root,bones,boneList,H,B,SH,waistW,hipW,chestW,feminine,bust,mat){
  /* Build 106: denser torso rings and a softly shaped front/back profile.
     This improves the clothed silhouette without changing rig names or pose tracks. */
  const profiles=[
    [.485,.086,.064], [.495,.095,.068], [.505,.103*hipW,.071], [.520,.109*hipW,.074],
    [.535,.112*hipW,.076], [.550,.111*hipW,.075], [.565,.110*waistW,.073],
    [.585,.111*waistW,.073], [.605,.115*waistW,.076], [.625,.120*waistW,.080],
    [.645,.126*B*SH,.084], [.665,.132*B*SH,.087], [.685,.139*B*SH*chestW,.090],
    [.705,.145*B*SH*chestW,.093], [.725,.150*B*SH*chestW,.096],
    [.745,.151*B*SH*chestW,.095], [.760,.147*B*SH*chestW,.090],
    [.775,.137*B*SH*chestW,.082], [.790,.116*SH,.071], [.802,.088*SH,.057]
  ];
  const radial=48, positions=[],uvs=[],indices=[],skinIndices=[],skinWeights=[];
  const idx={hips:boneList.indexOf(bones.hips),spine:boneList.indexOf(bones.spine),chest:boneList.indexOf(bones.chest),neck:boneList.indexOf(bones.neck)};
  profiles.forEach((pr,ri)=>{
    const [y,rx,rz]=pr;
    for(let j=0;j<radial;j++){
      const a=j/radial*Math.PI*2, sn=Math.sin(a), cs=Math.cos(a);
      const front=Math.max(0,sn), back=Math.max(0,-sn);
      /* Subtle abdomen, chest and upper-back shaping; avoid a perfect capsule silhouette. */
      const abdomen=Math.exp(-Math.pow((y-.615)/.060,2))*front*.025;
      const pectoral=Math.exp(-Math.pow((y-.718)/.050,2))*front*(feminine? .018:.030)*(0.65+0.35*bust);
      const backShape=Math.exp(-Math.pow((y-.700)/.085,2))*back*.018;
      const zScale=1+abdomen+pectoral+backShape;
      const xScale=1+Math.exp(-Math.pow((y-.715)/.075,2))*.012;
      positions.push(cs*rx*H*xScale,y*H,sn*rz*H*zScale);
      uvs.push(j/radial,ri/(profiles.length-1));
      let aBone,bBone,t;
      if(y<.565){aBone='hips';bBone='spine';t=Math.max(0,Math.min(1,(y-.535)/.03));}
      else if(y<.70){aBone='spine';bBone='chest';t=Math.max(0,Math.min(1,(y-.615)/.085));}
      else {aBone='chest';bBone='neck';t=Math.max(0,Math.min(1,(y-.742)/.06));}
      const smooth=t*t*(3-2*t);
      skinIndices.push(idx[aBone],idx[bBone],0,0); skinWeights.push(1-smooth,smooth,0,0);
    }
  });
  for(let r=0;r<profiles.length-1;r++) for(let j=0;j<radial;j++){
    const a=r*radial+j,b=r*radial+(j+1)%radial,c=(r+1)*radial+(j+1)%radial,d=(r+1)*radial+j;
    indices.push(a,d,b,b,d,c);
  }
  const bottom=positions.length/3, top=bottom+1;
  positions.push(0,profiles[0][0]*H,0, 0,profiles[profiles.length-1][0]*H,0);
  uvs.push(.5,0,.5,1);
  skinIndices.push(idx.hips,idx.spine,0,0,idx.chest,idx.neck,0,0);
  skinWeights.push(1,0,0,0,1,0,0,0);
  for(let j=0;j<radial;j++){
    const a=j,b=(j+1)%radial,ta=(profiles.length-1)*radial+j,tb=(profiles.length-1)*radial+(j+1)%radial;
    indices.push(bottom,b,a,top,ta,tb);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));
  geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));
  geo.setIndex(indices); geo.computeVertexNormals();
  const mesh=new THREE.SkinnedMesh(geo,mat); mesh.name='Unified torso'; mesh.castShadow=true; mesh.receiveShadow=true; mesh.userData.paint=true; mesh.userData.rigOwned=true; mesh.userData.unifiedBodyPart='torso'; mesh.userData.torsoDetail='106-profile'; mesh.userData.build='108';
  root.add(mesh); root.updateMatrixWorld(true);
  const skeleton=new THREE.Skeleton(boneList); mesh.bind(skeleton); mesh.normalizeSkinWeights();
  return mesh;
}


/* Build 101: consolidated, skinned limb shell. The four limb pairs share one draw object
   and material groups; overlaps at joints are deliberate and remain separate surface islands. */
function crMakeLimbShell(root,bones,boneList,H,B,SH,feminine,hood,fit,cloth,skin,pants,shoes,bare){
  /* Shared skinned limb surface with longitudinal rings and blended joint weights.
     Segment endpoints retain the existing rig names; weights transition into the
     child bone near each joint to reduce hard deformation seams. */
  const pos=[],uv=[],idx=[],sw=[],si=[],groups=[]; let vert=0;
  function tube(a,b,r0,r1,bone,nextBone,mi,shape,radial=20){
    const A=new THREE.Vector3(a[0]*H,a[1]*H,a[2]*H), Bv=new THREE.Vector3(b[0]*H,b[1]*H,b[2]*H);
    const axis=Bv.clone().sub(A).normalize(), ref=Math.abs(axis.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0);
    const u=new THREE.Vector3().crossVectors(axis,ref).normalize(), v=new THREE.Vector3().crossVectors(axis,u).normalize();
    const start=vert, bi=boneList.indexOf(bones[bone]), ci=boneList.indexOf(bones[nextBone]);
    const rings=13;
    for(let ring=0;ring<rings;ring++){
      const t=ring/(rings-1), C=A.clone().lerp(Bv,t);
      const smooth=Math.max(0,Math.min(1,(t-.52)/.48)); const blend=smooth*smooth*(3-2*smooth);
      let anatomy=1;
      if(shape==='upperArm') anatomy=1+.13*Math.exp(-Math.pow((t-.43)/.25,2));
      else if(shape==='foreArm') anatomy=1+.10*Math.exp(-Math.pow((t-.28)/.30,2));
      else if(shape==='thigh') anatomy=1+.16*Math.exp(-Math.pow((t-.30)/.28,2));
      else if(shape==='calf') anatomy=1+.19*Math.exp(-Math.pow((t-.43)/.24,2));
      const radius=(r0+(r1-r0)*t)*H*anatomy;
      for(let j=0;j<radial;j++){
        const ang=j/radial*Math.PI*2;
        const p=C.clone().addScaledVector(u,Math.cos(ang)*radius).addScaledVector(v,Math.sin(ang)*radius);
        pos.push(p.x,p.y,p.z); uv.push(j/radial,t);
        si.push(bi,ci,0,0); sw.push(1-blend,blend,0,0); vert++;
      }
    }
    for(let ring=0;ring<rings-1;ring++) for(let j=0;j<radial;j++){
      const a0=start+ring*radial+j,b0=start+ring*radial+(j+1)%radial;
      const c0=start+(ring+1)*radial+(j+1)%radial,d0=start+(ring+1)*radial+j;
      idx.push(a0,b0,d0,b0,c0,d0);
    }
    const ca=vert++, cb=vert++; pos.push(A.x,A.y,A.z,Bv.x,Bv.y,Bv.z); uv.push(.5,0,.5,1);
    si.push(bi,0,0,0,ci,0,0,0); sw.push(1,0,0,0,1,0,0,0);
    for(let j=0;j<radial;j++){
      idx.push(ca,start+(j+1)%radial,start+j,cb,start+(rings-1)*radial+j,start+(rings-1)*radial+(j+1)%radial);
    }
    groups.push({start:groups._last||0,count:idx.length-(groups._last||0),materialIndex:mi}); groups._last=idx.length;
  }
  function ellipsoid(center,radii,bone,mi,segments=16,rings=12){
    const geo=new THREE.SphereGeometry(1,segments,rings), pa=geo.getAttribute('position');
    const start=vert, base=idx.length, bi=boneList.indexOf(bones[bone]);
    for(let i=0;i<pa.count;i++){
      pos.push((center[0]+pa.getX(i)*radii[0])*H,(center[1]+pa.getY(i)*radii[1])*H,(center[2]+pa.getZ(i)*radii[2])*H);
      uv.push(geo.getAttribute('uv').getX(i),geo.getAttribute('uv').getY(i));
      si.push(bi,0,0,0); sw.push(1,0,0,0); vert++;
    }
    const ar=geo.getIndex().array;
    for(let i=0;i<ar.length;i++) idx.push(start+ar[i]);
    groups.push({start:base,count:idx.length-base,materialIndex:mi});
    geo.dispose();
  }
  [['.L',1],['.R',-1]].forEach(([k,s])=>{
    const sx=.14*SH*s, ex=.155*SH*s, wx=.165*SH*s, lx=(feminine?.058:.055)*s, F=fit;
    tube([sx,.795,0],[ex,.64,0],.034*B,hood?.036*B:.029*B,'upperArm'+k,'foreArm'+k,0,'upperArm');
    tube([ex,.64,0],[wx,.5,0],hood?.035*B:.027*B,hood?.025*B:.02*B,'foreArm'+k,'hand'+k,hood?0:1,'foreArm');
    tube([lx,.505,0],[lx,.27,0],.054*B*F,.042*B*F,'upperLeg'+k,'lowerLeg'+k,2,'thigh');
    tube([lx,.27,0],[lx,.06,0],.042*B*F,.03*B*F,'lowerLeg'+k,'foot'+k,2,'calf');
    /* Build 126: transition volumes at the major limb junctions. These are
       deliberately small and overlap the adjacent shells to soften visible
       pinching at shoulder, elbow, wrist, hip, knee and ankle bends. */
    ellipsoid([sx,.785,0],[.036*SH,.043*B,.032*B],'upperArm'+k,0,24,16);
    ellipsoid([ex,.642,0],[.031*B,.034*B,.031*B],'foreArm'+k,hood?0:1,18,12);
    ellipsoid([wx,.505,0],[.022*B,.021*B,.022*B],'hand'+k,1,16,12);
    ellipsoid([lx,.505,0],[.050*B*F,.044*B*F,.047*B*F],'upperLeg'+k,2,20,14);
    ellipsoid([lx,.270,0],[.044*B*F,.040*B*F,.043*B*F],'lowerLeg'+k,2,20,14);
    ellipsoid([lx,.060,.005],[.033*B*F,.027*B*F,.034*B*F],'foot'+k,bare?1:3,18,12);
    /* Shoulder cap above is the transition volume for the deltoid/torso join. */
    /* Build 108: fuller palm, a distinct knuckle transition and a thumb-base pad.
       These remain overlapping islands in the shared skinned mesh, not welded topology. */
    ellipsoid([wx*.99,.458,0],[.0185,.035,.027],'hand'+k,1,24,16);
    ellipsoid([wx*.99,.426,0],[.0155,.0115,.0275],'hand'+k,1,20,12);
    ellipsoid([wx*.99-.009*s,.455,.013*s],[.010,.019,.010],'hand'+k,1,16,12);
    /* Build 125: layered heel, arch and forefoot volumes create a clearer foot
       silhouette while remaining bound to the existing foot bone. */
    ellipsoid([lx,.043,.018],[.029,.024,.040],'foot'+k,bare?1:3,20,14);
    ellipsoid([lx,.034,.058],[.030,.018,.047],'foot'+k,bare?1:3,22,14);
    ellipsoid([lx,.031,.091],[.034,.014,.025],'foot'+k,bare?1:3,20,12);
  });
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4)); g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
  g.setIndex(idx); groups.forEach(x=>g.addGroup(x.start,x.count,x.materialIndex)); g.computeVertexNormals();
  const mesh=new THREE.SkinnedMesh(g,[cloth,skin,pants,shoes]); mesh.name='Unified limb shell'; mesh.castShadow=true; mesh.receiveShadow=true;
  mesh.userData.paint=true; mesh.userData.rigOwned=true; mesh.userData.unifiedBodyPart='limbs'; mesh.userData.jointWeighted=true; mesh.userData.anatomyProfile='107'; mesh.userData.handDetail='124-thumb-opposition-tapered-digits-rounded-tips'; mesh.userData.footDetail='125-heel-arch-forefoot-medial-toe-fan'; mesh.userData.transitionDetail='126-joint-overlap-volumes-13-ring-limbs-wide-skin-weight-blends';
  root.add(mesh); root.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(boneList)); mesh.normalizeSkinWeights();
  return mesh;
}
/* ---- fingers: chains of segments under each hand, curled by pose keys hand.L.a / hand.L.b ---- */
const CR_FDEF=[
  /* Thumb is set farther out from the palm and angled across it for a more useful opposition silhouette. */
  {n:'thumb',b:[-.014,.458,.018],L:[.018,.014],r:.0052,rx:-.78,rz:.24},
  {n:'index',b:[.001,.421,.0132],L:[.018,.012,.009],r:.00435,rz:.035},
  {n:'middle',b:[.001,.421,.0045],L:[.020,.013,.010],r:.0045},
  {n:'ring',b:[0,.421,-.0047],L:[.018,.012,.009],r:.00425,rz:-.025},
  {n:'pinky',b:[-.001,.422,-.0132],L:[.014,.010,.008],r:.0038,rz:-.06}
];
function crFingerChains(hb,hp,H,wxc,s,mat){
  const lp=w=>[w[0]*H-hp[0],w[1]*H-hp[1],w[2]*H-hp[2]], out=[];
  CR_FDEF.forEach(d=>{ const root=new THREE.Group(); root.userData.rigOwned=true; hb.add(root); const p0=lp([wxc+d.b[0]*s,d.b[1],d.b[2]]); root.position.set(p0[0],p0[1],p0[2]); if(d.rx) root.rotation.x=d.rx; root.userData.rx0=d.rx||0;
    root.userData.rz0=(d.rz||0)*s; root.rotation.z=root.userData.rz0;
    const segs=[]; let par=root;
    d.L.forEach((len,i)=>{ const g=new THREE.Group(); g.userData.rigOwned=true; if(i) g.position.y=-d.L[i-1]*H; par.add(g);
      /* Taper each phalanx and keep a rounded knuckle at its base. */
      const r0=d.r*H*(1-i*.105), r1=d.r*H*(1-(i+1)*.13), cm=new THREE.Mesh(new THREE.CylinderGeometry(r1,r0,len*H,14,3),mat); cm.position.y=-len*H/2; cm.castShadow=true; cm.userData.paint=true; cm.userData.rigOwned=true; g.add(cm);
      const jm=new THREE.Mesh(new THREE.SphereGeometry(r0*.98,14,10),mat); jm.userData.paint=true; jm.userData.rigOwned=true; g.add(jm); segs.push(g); par=g; });
    /* Rounded fingertip pad beyond the final phalanx; attached to the last joint so curls remain coherent. */
    const tipLen=d.L[d.L.length-1]*H, tipR=d.r*H*.72;
    const tip=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),mat); tip.scale.set(tipR*.9,tipR*1.08,tipR*.9); tip.position.y=-tipLen; tip.castShadow=true; tip.userData.paint=true; tip.userData.rigOwned=true; par.add(tip);
    out.push({n:d.n,root:root,segs:segs}); });
  return out;
}
const CR_Z=[0,0,0], CR_CURL=[1.15,1.5,1.25], CR_SPREAD=[0,.2,.07,-.07,-.2];
function crFingers(R,pose){
  const C=R.creator; if(!C||!C.fingers) return; pose=pose||{};
  ['L','R'].forEach(side=>{ const F=C.fingers[side]; if(!F) return; const a=pose['hand.'+side+'.a']||CR_Z, b=pose['hand.'+side+'.b']||CR_Z, cu=[a[0],a[1],a[2],b[0],b[1]], sg=side==='L'?-1:1;
    F.forEach((f,i)=>{ f.segs.forEach((g,j)=>{ g.rotation.z=sg*cu[i]*CR_CURL[j]*(i===0?.75:1); }); if(i>0) f.root.rotation.x=b[2]*CR_SPREAD[i]; else f.root.rotation.z=sg*(-b[2])*.35+(f.root.userData.rz0||0); });
  });
}
function crBuild(node,spec){
  const o=Object.assign({},CR_DEF,spec.creator||{}); spec.creator=o; const H=Math.max(1.2,Math.min(2.3,+o.height||1.75)), B=Math.max(.7,Math.min(1.5,+o.build||1)), SH=Math.max(.8,Math.min(1.3,+o.shoulders||1)), HD=Math.max(.85,Math.min(1.25,+o.head||1));
  /* Proportion controls are deliberately independent of the rig: changing a silhouette never changes bone names or animation tracks. */
  const feminine=o.bodyType==='feminine', waistW=(feminine?.9:1)*Math.max(.75,Math.min(1.3,+o.waist||1)), hipW=(feminine?1.1:1)*Math.max(.75,Math.min(1.35,+o.hips||1)), chestW=(feminine?.96:1)*Math.max(.75,Math.min(1.3,+o.chest||1));
  const root=new THREE.Object3D(); root.name='rigRoot'; root.userData.rigOwned=true; node.add(root);
  const P={}; RIG_DEF.forEach(d=>{ P[d[0]]=[d[2].slice(),d[3].slice()]; });
  RIG_DEF.forEach(d=>{ if(d[0].indexOf('upperArm')===0){ const s=d[0].endsWith('.L')?1:-1; P[d[0]][0][0]=.14*SH*s; P['foreArm'+d[0].slice(8)][0][0]=P[d[0]][1][0]=.155*SH*s; P['hand'+d[0].slice(8)][0][0]=P['foreArm'+d[0].slice(8)][1][0]=.165*SH*s; } });
  const skin=crSkinMat(o.skin), cloth=crMat(o.shirt,.85), pants=crMat(o.pants,.85), shoes=crMat(o.shoes,.6), hairM=crMat(o.hairColor,.55), lipM=crMat('#a2524f',.5);
  const bones={}, list=[], markers=[], lines=[], head={};
  const mkMat=new THREE.MeshBasicMaterial({color:0xffcc33,depthTest:false,transparent:true,opacity:.95}), lnMat=new THREE.LineBasicMaterial({color:0xffffff,depthTest:false,transparent:true,opacity:.8});
  RIG_DEF.forEach(d=>{ const b=new THREE.Bone(); b.name=d[0]; const hp=P[d[0]][0].map(v=>v*H), tp=P[d[0]][1].map(v=>v*H); head[d[0]]=hp;
    if(d[1]){ const pp=head[d[1]]; b.position.set(hp[0]-pp[0],hp[1]-pp[1],hp[2]-pp[2]); bones[d[1]].add(b); } else { b.position.set(hp[0],hp[1],hp[2]); root.add(b); }
    bones[d[0]]=b; list.push(b);
    const mk=new THREE.Mesh(new THREE.SphereGeometry(H*.017,10,8),mkMat.clone()); mk.userData.bone=d[0]; mk.userData.rigOwned=true; mk.renderOrder=999; mk.raycast=()=>{}; b.add(mk); markers.push(mk);
    const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(tp[0]-hp[0],tp[1]-hp[1],tp[2]-hp[2])]),lnMat); ln.userData.rigOwned=true; ln.renderOrder=998; ln.raycast=()=>{}; b.add(ln); lines.push(ln); });
  /* articulated toe chains are attached to the existing foot bones */
  const toeBones={L:[],R:[]};
  [['.L',1],['.R',-1]].forEach(([k,side])=>{
    /* Toe roots fan outward from the midline: the big toe is medial on both feet.
       Lengths and radii taper anatomically from hallux to little toe. */
    const medial=-side, widths=[-.018,-.009,0,.010,.020].map(v=>v*medial);
    const lengths=[.031,.027,.029,.024,.020], radii=[.0072,.0057,.0059,.0052,.0045];
    const heights=[-.004,-.003,-.002,-.001,0], names=['big','second','middle','fourth','little'];
    widths.forEach((dx,i)=>{
      const bn='toe.'+names[i]+k, tb=new THREE.Bone(); tb.name=bn;
      tb.position.set(dx*H,heights[i]*H,.088*H); bones['foot'+k].add(tb); bones[bn]=tb; list.push(tb);
      tb.userData.toeIndex=i; tb.userData.toeSide=k;
      const toeMat=skin;
      /* A fuller proximal phalanx tapers into a rounded distal pad. Both pieces
         follow the toe bone so the existing toe pose channel remains compatible. */
      const base=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),toeMat);
      base.scale.set(radii[i]*H,.0068*H,lengths[i]*H*.72);
      base.position.z=lengths[i]*H*.34; base.castShadow=true; base.receiveShadow=true;
      base.userData.paint=true; base.userData.rigOwned=true; base.userData.toe=true; base.visible=(o.shoeStyle==='bare'); tb.add(base);
      const tip=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),toeMat);
      tip.scale.set(radii[i]*H*.78,.0062*H,lengths[i]*H*.36);
      tip.position.z=lengths[i]*H*.78; tip.castShadow=true; tip.receiveShadow=true;
      tip.userData.paint=true; tip.userData.rigOwned=true; tip.userData.toe=true; tip.visible=(o.shoeStyle==='bare'); tb.add(tip);
      toeBones[k.slice(1)].push(tb);
    });
  });
  /* idle holders: breathing and head sway live here so they never fight the pose keys */
  const holder={}; ['hips','spine','chest','head'].forEach(n=>{ const g=new THREE.Group(); g.userData.rigOwned=true; bones[n].add(g); holder[n]=g; });
  const add=(par,mesh)=>{ mesh.castShadow=true; mesh.receiveShadow=true; mesh.userData.paint=true; mesh.userData.rigOwned=true; (par.isBone?par:par).add(mesh); return mesh; };
  const loc=(bn,w)=>[w[0]*H-head[bn][0],w[1]*H-head[bn][1],w[2]*H-head[bn][2]];
  const seg=(par,bn,a,b,r0,r1,m)=>{ const A=new THREE.Vector3(...a.map(v=>v*H)), Bv=new THREE.Vector3(...b.map(v=>v*H)), dir=Bv.clone().sub(A), len=dir.length(), g=new THREE.CylinderGeometry(r1*H,r0*H,len,14,1); const me=new THREE.Mesh(g,m); me.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize()); const mid=A.add(Bv).multiplyScalar(.5); me.position.set(mid.x-head[bn][0],mid.y-head[bn][1],mid.z-head[bn][2]); return add(par,me); };
  const ell=(par,bn,w,r,m,seg1)=>{ const me=new THREE.Mesh(new THREE.SphereGeometry(1,seg1||18,14),m); me.scale.set(r[0]*H,r[1]*H,r[2]*H); const l=loc(bn,w); me.position.set(l[0],l[1],l[2]); return add(par,me); };
  /* unified torso: a single skinned surface replaces the disconnected hip, waist and chest ellipsoids */
  const bust=Math.max(.55,Math.min(1.45,+o.bust||1));
  const torsoMesh=crMakeTorsoMesh(root,bones,list,H,B,SH,waistW,hipW,chestW,feminine,bust,cloth);
  seg(bones.neck,'neck',[0,.795,0],[0,.88,.008],.03,.026,skin);
  const fingers={L:null,R:null};
  /* legs, arms (shirt sleeves to the elbow, skin below) */
  [['.L',1],['.R',-1]].forEach(q=>{ const k=q[0], s=q[1], sx=.14*SH*s, ex=.155*SH*s, wx=.165*SH*s, lx=(feminine?.058:.055)*s;
    const hood=o.top==='hoodie', fm=hood?cloth:skin, F=Math.max(.9,Math.min(1.4,+o.fit||1));
    fingers[s>0?'L':'R']=crFingerChains(bones['hand'+k],head['hand'+k],H,wx*.99,s,skin);
    if(o.shoeStyle==='sneaker'){ ell(bones['foot'+k],'foot'+k,[lx,.016,.037],[.036,.011,.088],crMat('#d9d0bd',.7),14); ell(bones['foot'+k],'foot'+k,[lx+s*.027,.038,.03],[.006,.011,.045],crMat(o.shoeAccent||'#4e6040',.6),10); ell(bones['foot'+k],'foot'+k,[lx-s*.027,.038,.03],[.006,.011,.045],crMat(o.shoeAccent||'#4e6040',.6),10); } });
  const limbShell=crMakeLimbShell(root,bones,list,H,B,SH,feminine,o.top==='hoodie',Math.max(.9,Math.min(1.4,+o.fit||1)),cloth,skin,pants,shoes,o.shoeStyle==='bare');
  /* head: cranium above the mouth line, jaw below it */
  const HC=[0,.935,.005], R3=[.05*HD,.07*HD,.058*HD], ym=.903, th=Math.acos(Math.max(-.95,Math.min(.95,(ym-HC[1])/R3[1])));
  const capMat=skin.clone(); capMat.side=THREE.DoubleSide;
  const cr=new THREE.Mesh(new THREE.SphereGeometry(1,28,20,0,Math.PI*2,0,th),capMat); cr.scale.set(R3[0]*H,R3[1]*H,R3[2]*H); let l=loc('head',HC); cr.position.set(l[0],l[1],l[2]); add(holder.head,cr);
  const jaw=new THREE.Bone(); jaw.name='jaw'; const jh=[0,ym,-.004]; jaw.position.set(...loc('head',jh)); holder.head.add(jaw);
  const jm=new THREE.Mesh(new THREE.SphereGeometry(1,28,16,0,Math.PI*2,th,Math.PI-th),capMat); jm.scale.set(R3[0]*H,R3[1]*H,R3[2]*H); jm.position.set(HC[0]*H-jh[0]*H,HC[1]*H-jh[1]*H,HC[2]*H-jh[2]*H); add(jaw,jm);
  const dark=new THREE.MeshStandardMaterial({color:0x2a0b0d,roughness:.9,side:THREE.DoubleSide}), pink=new THREE.MeshStandardMaterial({color:0x8e3a3c,roughness:.7,side:THREE.DoubleSide});
  const rimR=Math.sin(th);   /* ellipse of the cut: semi-axes R3x*rimR, R3z*rimR */
  const roof=new THREE.Mesh(new THREE.CircleGeometry(1,20),dark); roof.rotation.x=Math.PI/2; roof.scale.set(R3[0]*H*rimR*.97,R3[2]*H*rimR*.97,1); l=loc('head',[0,ym+.0005,HC[2]]); roof.position.set(l[0],l[1],l[2]); add(holder.head,roof);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(1,20),pink); floor.rotation.x=-Math.PI/2; floor.scale.set(R3[0]*H*rimR*.97,R3[2]*H*rimR*.97,1); floor.position.set(0,(-.0005)*H,(HC[2]-jh[2])*H); add(jaw,floor);
  const tex=new THREE.MeshStandardMaterial({color:0xf0ece2,roughness:.4});
  const tu=new THREE.Mesh(new THREE.BoxGeometry(.03*H,.006*H,.004*H),tex); l=loc('head',[0,ym-.003,.044]); tu.position.set(l[0],l[1],l[2]); add(holder.head,tu);
  const tl=new THREE.Mesh(new THREE.BoxGeometry(.026*H,.005*H,.004*H),tex); tl.position.set(0,.003*H,(.044-jh[2])*H); add(jaw,tl);
  const tongue=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),new THREE.MeshStandardMaterial({color:0xb0524f,roughness:.6})); tongue.scale.set(.012*H,.005*H,.022*H); tongue.position.set(0,.001*H,(.02-jh[2])*H); add(jaw,tongue);
  /* lips */
  const zS=y=>R3[2]*Math.sqrt(Math.max(.05,1-Math.pow((y-HC[1])/R3[1],2)));
  const upL=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),lipM); upL.scale.set(.018*H,.0045*H,.006*H); l=loc('head',[0,ym+.002,zS(ym)+.0005]); upL.position.set(l[0],l[1],l[2]); add(holder.head,upL);
  const loL=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),lipM); loL.scale.set(.017*H,.0048*H,.006*H); loL.position.set(0,-.003*H,(zS(ym)-jh[2])*H); add(jaw,loL);
  const corner=[1,-1].map(s=>{ const c=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),lipM); c.scale.set(.004*H,.004*H,.004*H); l=loc('head',[s*.019,ym,zS(ym)-.002]); c.position.set(l[0],l[1],l[2]); c.userData.p0=c.position.clone(); c.userData.s=s; add(holder.head,c); return c; });

  /* Build 139: subtle mandibular transition and neck-base shaping.
     These low-profile forms soften the spherical head/jaw and straight-neck join. */
  ell(holder.head,'head',[0,.900,zS(.900)-.002],[.027,.010,.009],skin,24);
  ell(holder.head,'head',[0,.868,-.002],[.034,.018,.030],skin,24);

  /* Build 109: layered nose and cheek/chin forms refine the front silhouette. */
  ell(holder.head,'head',[0,.936,zS(.936)+.004],[.0062,.020,.0072],skin,16);       /* bridge */
  ell(holder.head,'head',[0,.918,zS(.918)+.010],[.009,.0075,.009],skin,16);       /* tip */
  const noseWingMat=skin;
  [1,-1].forEach(s=>{
    ell(holder.head,'head',[s*.0072,.916,zS(.916)+.006],[.0046,.0038,.0050],noseWingMat,16);
    ell(holder.head,'head',[s*.0052,.9125,zS(.9125)+.010],[.0019,.0012,.0011],dark,10);
    ell(holder.head,'head',[s*.0275,.922,zS(.922)-.001],[.0105,.0085,.0058],skin,20); /* softened cheek plane */
  });
  { const w=[0,.893,zS(.893)+.002], me=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),skin); me.scale.set(.015*H,.0065*H,.0065*H); me.position.set((w[0]-jh[0])*H,(w[1]-jh[1])*H,(w[2]-jh[2])*H); add(jaw,me); }            /* blended chin plane */
  [1,-1].forEach(s=>ell(holder.head,'head',[s*.0505*HD,.935,0],[.006,.016,.011],skin,12));

  /* Build 138: refine the nose silhouette with subtle bridge highlights,
     alar rims, nostril shadows and a small columella transition. */
  const noseRimMat=new THREE.MeshStandardMaterial({color:o.skin,roughness:.78});
  const noseShadowMat=new THREE.MeshStandardMaterial({color:0x49352f,roughness:.95});
  const noseHighlightMat=new THREE.MeshStandardMaterial({color:0xe5c2a7,roughness:.72});
  for(const side of [-1,1]){
    ell(holder.head,'head',[side*.0028,.932,zS(.932)+.010],
      [.00115,.012,.0010],noseHighlightMat,10);
    ell(holder.head,'head',[side*.0074,.9148,zS(.9148)+.0102],
      [.0035,.0020,.00145],noseRimMat,12);
    ell(holder.head,'head',[side*.0063,.9136,zS(.9136)+.0108],
      [.00215,.00078,.00062],noseShadowMat,12);
  }
  ell(holder.head,'head',[0,.9138,zS(.9138)+.0112],
    [.0019,.0025,.0012],noseRimMat,10);
  ell(holder.head,'head',[0,.9225,zS(.9225)+.014],
    [.0020,.0055,.0010],noseHighlightMat,10);


  /* Build 143: facial topology guide surfaces.
     These shallow edge-loop contours sit close to the face surface and clarify
     orbital and perioral transitions while remaining attached to the head rig. */
  const faceLoopMat=new THREE.MeshStandardMaterial({color:o.skin,roughness:.82});
  const lipEdgeMat=new THREE.MeshStandardMaterial({color:0x9b5550,roughness:.72});
  const addFaceLoop=(points,radius,material)=>{
    const pts=points.map(v=>{const q=loc('head',v);return new THREE.Vector3(q[0],q[1],q[2]);});
    const curve=new THREE.CatmullRomCurve3(pts,true);
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(32,points.length*4),radius*H,5,true),material);
    mesh.castShadow=true; mesh.receiveShadow=true; mesh.userData.rigOwned=true; holder.head.add(mesh);
  };
  /* Orbital loops follow the upper cheek and brow region, not the eyeball. */
  for(const side of [-1,1]){
    const cx=side*.020*HD, cy=.946;
    const orbit=[];
    for(let k=0;k<24;k++){
      const a=k/24*Math.PI*2;
      const x=cx+Math.cos(a)*.0130;
      const y=cy+Math.sin(a)*.0092;
      orbit.push([x,y,zS(y)+.0018]);
    }
    addFaceLoop(orbit,.00042,faceLoopMat);
  }
  /* Perioral loop defines the transition around the mouth; a second curve
     traces the vermilion border without replacing the existing lip rig. */
  const mouthOuter=[], mouthInner=[];
  for(let k=0;k<24;k++){
    const a=k/24*Math.PI*2;
    const x=Math.cos(a)*.020;
    const y=ym+Math.sin(a)*.010;
    mouthOuter.push([x,y,zS(y)+.0018]);
    const xi=Math.cos(a)*.0175, yi=ym+Math.sin(a)*.0054;
    mouthInner.push([xi,yi,zS(yi)+.0042]);
  }
  addFaceLoop(mouthOuter,.00036,faceLoopMat);
  addFaceLoop(mouthInner,.00025,lipEdgeMat);

  /* eyes, lids, brows */
  const eyeW=new THREE.MeshStandardMaterial({color:0xece8e0,roughness:.19}), iris=crMat(o.eyes,.3), pup=new THREE.MeshBasicMaterial({color:0x050505});
  const limbal=new THREE.MeshBasicMaterial({color:0x24170f}), pupilRim=new THREE.MeshBasicMaterial({color:0x39251b});
  const glint=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.92,depthWrite:false,toneMapped:false});
  const eyes=[], lids=[], brows=[];
  [1,-1].forEach(s=>{ const ex=s*.02*HD, ey=.946, ez=zS(ey)-.003+0;
    const eb=new THREE.Bone(); eb.name='eye'+(s>0?'.L':'.R'); eb.position.set(...loc('head',[ex,ey,ez])); holder.head.add(eb); eyes.push(eb);
    const ball=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),eyeW); ball.scale.set(.0105*H,.0105*H,.0105*H); add(eb,ball);
    const ir=new THREE.Mesh(new THREE.CircleGeometry(1,40),iris); ir.scale.set(.0066*H,.0066*H,1); ir.position.z=.0103*H; add(eb,ir);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.00635*H,.00034*H,6,40),limbal); ring.position.z=.01034*H; add(eb,ring);
    const puRing=new THREE.Mesh(new THREE.TorusGeometry(.00272*H,.00018*H,5,28),pupilRim); puRing.position.z=.01048*H; add(eb,puRing);
    const pu=new THREE.Mesh(new THREE.CircleGeometry(1,24),pup); pu.scale.set(.00255*H,.00255*H,1); pu.position.z=.0105*H; add(eb,pu);
    const hi=new THREE.Mesh(new THREE.CircleGeometry(1,16),glint); hi.scale.set(.00135*H,.00135*H,1); hi.position.set(-.00205*H,.00235*H,.01062*H); add(eb,hi);
    const hi2=new THREE.Mesh(new THREE.CircleGeometry(1,12),glint); hi2.scale.set(.00055*H,.00055*H,1); hi2.position.set(.0020*H,-.0018*H,.01061*H); add(eb,hi2);
    const lb=new THREE.Bone(); lb.name='lid'+(s>0?'.L':'.R'); lb.position.copy(eb.position); holder.head.add(lb); lids.push(lb);
    const lm=new THREE.Mesh(new THREE.SphereGeometry(1,16,10,0,Math.PI*2,0,Math.PI*.52),capMat); lm.scale.set(.0122*H,.0122*H,.0122*H); add(lb,lm);
    /* Build 137: fine upper/lower eyelid rims and restrained upper lashes.
       These details are parented to the eye bone so eye direction stays aligned. */
    const lidRim=new THREE.MeshStandardMaterial({color:0x765044,roughness:.82});
    const lashMat=new THREE.MeshStandardMaterial({color:o.brow,roughness:.88});
    const lidPoint=(x,y,offset)=>{
      const xx=x*H, yy=y*H, rr=.0105*H;
      const zz=Math.sqrt(Math.max(.000001,rr*rr-xx*xx-yy*yy))+offset*H;
      return new THREE.Vector3(xx,yy,zz);
    };
    const upperPts=[], lowerPts=[];
    for(let k=0;k<=16;k++){
      const u=-1+k/8, x=u*.0090;
      const arch=Math.sqrt(Math.max(0,1-u*u));
      upperPts.push(lidPoint(x,.0010*arch+.0011*(1-Math.abs(u)),.00022));
      lowerPts.push(lidPoint(x,-.00045*arch-.0010*(1-Math.abs(u)),.00018));
    }
    const upperCurve=new THREE.CatmullRomCurve3(upperPts);
    const lowerCurve=new THREE.CatmullRomCurve3(lowerPts);
    const upperRim=new THREE.Mesh(new THREE.TubeGeometry(upperCurve,36,.00034*H,5,false),lidRim);
    const lowerRim=new THREE.Mesh(new THREE.TubeGeometry(lowerCurve,36,.00024*H,5,false),lidRim);
    upperRim.castShadow=true; lowerRim.castShadow=true; add(eb,upperRim); add(eb,lowerRim);
    /* Short individual lash strokes, concentrated along the outer half. */
    for(let k=0;k<7;k++){
      const u=.05+k*.135, x=u*.0090, y=.0010*Math.sqrt(Math.max(0,1-u*u))+.0011*(1-Math.abs(u));
      const a=lidPoint(x,y,.00028), b=lidPoint(x+.00055,y+.00072,.00034);
      const lash=new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a,b),4,.00013*H,4,false),lashMat);
      add(eb,lash);
    }
    const bb=new THREE.Bone(); bb.name='brow'+(s>0?'.L':'.R'); bb.position.set(...loc('head',[ex,ey+.0178,zS(ey+.0178)])); bb.userData.p0=bb.position.clone(); holder.head.add(bb); brows.push(bb);
    /* Arched brow volume follows the brow bone, with tapered ends and
       fine directional strokes for a less block-like facial silhouette. */
    const browMat=crMat(o.brow,.86), browHi=new THREE.MeshStandardMaterial({color:o.brow,roughness:.92});
    const browPts=[
      new THREE.Vector3(-.0145*H,-.0010*H,.00045*H),
      new THREE.Vector3(-.0090*H,.0020*H,.0011*H),
      new THREE.Vector3(-.0020*H,.0032*H,.00145*H),
      new THREE.Vector3(.0060*H,.0025*H,.0011*H),
      new THREE.Vector3(.0135*H,-.0010*H,.00035*H)
    ];
    const browCurve=new THREE.CatmullRomCurve3(browPts);
    const browMesh=new THREE.Mesh(new THREE.TubeGeometry(browCurve,28,.00135*H,7,false),browMat);
    browMesh.castShadow=true; browMesh.receiveShadow=true; add(bb,browMesh);
    for(let k=0;k<7;k++){
      const u=.12+k*.125, a=browCurve.getPoint(u), b=browCurve.getPoint(Math.min(.98,u+.055));
      a.z+=.00035*H; b.z+=.0004*H;
      const strand=new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a,b),4,.00020*H,4,false),browHi);
      add(bb,strand);
    }
  });
  /* hair */
  if(o.hair!=='none'){ const hr=new THREE.Mesh(new THREE.SphereGeometry(1,28,16,0,Math.PI*2,0,Math.PI*(o.hair==='cap'?.34:.42)),hairM); hr.scale.set(R3[0]*H*1.06,R3[1]*H*1.04,R3[2]*H*1.07); l=loc('head',[0,HC[1]+.002,HC[2]-.003]); hr.position.set(l[0],l[1],l[2]); hr.rotation.x=-.12; add(holder.head,hr);
    if(o.hair==='long'||o.hair==='ponytail'){ const lg=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),hairM); lg.scale.set(R3[0]*H*1.05,.095*H,R3[2]*H*.8); l=loc('head',[0,.89,-.028]); lg.position.set(l[0],l[1],l[2]); add(holder.head,lg); }
    if(o.hair==='short'||o.hair==='cap'||o.hair==='fade'||o.hair==='sidepart'||o.hair==='braids'||o.hair==='ponytail'){ const fr=new THREE.Mesh(new THREE.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI*.22),hairM); fr.scale.set(R3[0]*H*1.02,R3[1]*H*1.0,R3[2]*H*1.03); l=loc('head',[0,HC[1]+.006,HC[2]+.004]); fr.position.set(l[0],l[1],l[2]); fr.rotation.x=.32; add(holder.head,fr); } }
  /* ---- extras: curly hair, beard, glasses, hoodie, backpack, sneakers ---- */
  let sd=1234567; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
  const merge=list=>{ let tot=0; list.forEach(g=>{ tot+=g.attributes.position.count; }); const P=new Float32Array(tot*3), N=new Float32Array(tot*3); let off=0;
    list.forEach(g=>{ P.set(g.attributes.position.array,off*3); N.set(g.attributes.normal.array,off*3); off+=g.attributes.position.count; g.dispose(); });
    const out=new THREE.BufferGeometry(); out.setAttribute('position',new THREE.BufferAttribute(P,3)); out.setAttribute('normal',new THREE.BufferAttribute(N,3)); return out; };
  const _m=new THREE.Matrix4(), _q=new THREE.Quaternion(), _e=new THREE.Euler(), _s=new THREE.Vector3(), _p=new THREE.Vector3();
  const piece=(base,p,s,rot)=>{ _e.set(rot[0],rot[1],rot[2]); _q.setFromEuler(_e); _m.compose(_p.set(p[0],p[1],p[2]),_q,_s.set(s[0],s[1],s[2])); const g=base.clone(); g.applyMatrix4(_m); return g; };
  const ico0=new THREE.IcosahedronGeometry(1,0), ico1=new THREE.IcosahedronGeometry(1,1), tor=new THREE.TorusGeometry(1,.4,3,7).toNonIndexed();
  const surf=(th,ph,k)=>[HC[0]+R3[0]*k*Math.sin(th)*Math.sin(ph),HC[1]+R3[1]*k*Math.cos(th),HC[2]+R3[2]*k*Math.sin(th)*Math.cos(ph)];
  const hd=w=>loc('head',w), jw=w=>[(w[0]-jh[0])*H,(w[1]-jh[1])*H,(w[2]-jh[2])*H];
  /* Build 130: fine directional strand grooves and a shaped hairline. These
     lightweight curves sit just above the cap surface and follow the head
     coordinate system, so they move with the existing head bone. */
  if(o.hair!=='none' && o.hair!=='curly'){
    const strandA=new THREE.MeshStandardMaterial({color:o.hairColor,roughness:.72,metalness:0});
    const strandB=new THREE.MeshStandardMaterial({color:0x3b2b22,roughness:.68,metalness:0});
    const toV=w=>{ const q=hd(w); return new THREE.Vector3(q[0],q[1],q[2]); };
    const addHairCurve=(pts,rad,mat)=>{
      const curve=new THREE.CatmullRomCurve3(pts.map(toV));
      const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,18,rad*H,5,false),mat);
      mesh.castShadow=true; mesh.receiveShadow=true; mesh.userData.rigOwned=true; add(holder.head,mesh);
    };
    /* Continuous front hairline arc: slightly irregular to avoid a helmet edge. */
    const hairline=[];
    for(let j=0;j<=16;j++){
      const ph=-1.02+j*(2.04/16), th=1.03+.035*Math.cos(ph*2.1);
      hairline.push(surf(th,ph,1.045));
    }
    addHairCurve(hairline,.00048,strandB);
    /* Directional swept strands from crown toward the forehead. */
    const count=o.hair==='long'?26:20;
    for(let j=0;j<count;j++){
      const ph=-.92+j*(1.84/(count-1)), drift=(j%2?1:-1)*.045;
      const pts=[];
      for(let k=0;k<=5;k++){
        const u=k/5, th=.16+u*.82, p2=ph+drift*u;
        const scale=1.045+.012*Math.sin(u*Math.PI);
        pts.push(surf(th,p2,scale));
      }
      addHairCurve(pts,.00034,j%3===0?strandB:strandA);
    }
    /* Longer temple locks frame the face for long styles. */
    if(o.hair==='long'){
      /* Back curtain adds a fuller, tapered long-hair silhouette behind the neck. */
      const backHair=piece(ico1,hd([0,.884,-.038]),[.038*H,.105*H,.018*H],[0,0,0]);
      backHair.castShadow=true; backHair.receiveShadow=true; add(holder.head,new THREE.Mesh(backHair,hairM));
      [-1,1].forEach(side=>{
        const pts=[
          [side*.034,.963,.034],[side*.039,.941,.036],
          [side*.041,.914,.032],[side*.039,.882,.020],
          [side*.035,.856,.004]
        ];
        addHairCurve(pts,.0020,strandA);
      });
    }
  } else if(o.hair==='curly'){
    /* A few fine highlight arcs reinforce curl direction without adding
       thousands of additional particles to the curly hairstyle. */
    const curlLine=new THREE.MeshStandardMaterial({color:0x49352a,roughness:.82});
    for(let j=0;j<9;j++){
      const ph=-.82+j*.205, pts=[];
      for(let k=0;k<=5;k++){
        const th=.22+k*.145, p2=ph+.055*Math.sin(k*.65+j);
        pts.push(surf(th,p2,1.135));
      }
      const curve=new THREE.CatmullRomCurve3(pts.map(w=>{const q=hd(w);return new THREE.Vector3(q[0],q[1],q[2]);}));
      const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,14,.00042*H,4,false),curlLine);
      mesh.castShadow=true; mesh.userData.rigOwned=true; add(holder.head,mesh);
    }
  }
  if(o.hair==='curly'){
    const gl=[], N=900, hm=crMat(o.hairColor,.8);
    for(let i=0;i<N;i++){ const z=1-2*(i+.5)/N, th=Math.acos(z), ph=Math.PI*(3-Math.sqrt(5))*i, cf=Math.cos(ph), tmax=Math.PI*(.31+.2*(1-cf)*.95);
      if(th>tmax) continue; const edge=th/tmax;
      if(i%2===0){ const w=surf(th,ph,1.04+rnd()*.05), rr=.017*H*HD; gl.push(piece(ico0,hd(w),[rr,rr,rr],[rnd()*6,rnd()*6,rnd()*6])); }
      const lay=edge>.85?1:2;
      for(let L=0;L<lay;L++){ const k=1.1+rnd()*(.26-.1*edge)+L*.06, w=surf(th+(rnd()-.5)*.05,ph+(rnd()-.5)*.08,k), tr=(.0058+rnd()*.0035)*H*HD;
        gl.push(piece(tor,hd(w),[tr,tr,tr*1.2],[rnd()*6,rnd()*6,rnd()*6])); } }
    const hm2=new THREE.Mesh(merge(gl),hm); add(holder.head,hm2);
  }
  /* Build 131: additional selectable silhouettes. These are lightweight
     head-bone-owned meshes/curves, not a strand simulation or grooming system. */

  /* Build 132: soften the cap-to-skin boundary with a layered, irregular
     hairline and short temple transitions. These are lightweight details,
     not individual hair strands or a grooming simulation. */
  if(o.hair!=='none' && o.hair!=='curly'){
    const edgeMat=new THREE.MeshStandardMaterial({color:o.hairColor,roughness:.78});
    const edgeDark=new THREE.MeshStandardMaterial({color:0x241913,roughness:.84});
    const addEdgeCurve=(coords,rad,mat)=>{
      const pts=coords.map(w=>{const q=hd(w);return new THREE.Vector3(q[0],q[1],q[2]);});
      const curve=new THREE.CatmullRomCurve3(pts);
      const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(10,coords.length*2),rad*H,5,false),mat);
      mesh.castShadow=true; mesh.receiveShadow=true; mesh.userData.rigOwned=true; add(holder.head,mesh);
    };
    const inner=[];
    for(let j=0;j<=20;j++){
      const ph=-1.04+j*(2.08/20), wav=.006*Math.sin(ph*8)+.0025*Math.sin(ph*17);
      const th=1.055+wav;
      inner.push([R3[0]*Math.sin(th)*Math.sin(ph),
                  HC[1]+R3[1]*Math.cos(th),
                  HC[2]+R3[2]*Math.sin(th)*Math.cos(ph)]);
    }
    addEdgeCurve(inner,.00024,edgeMat);
    /* Sparse tapered wisps blend the front edge into the cap. */
    for(let j=0;j<13;j++){
      const ph=-.91+j*(1.82/12), th=1.01+.018*Math.sin(j*1.7);
      const a=surf(th,ph,1.047), b=surf(th+.055,ph+.018*Math.sin(j),1.052);
      addEdgeCurve([a,b,[b[0]*.998,b[1]-.002*H,b[2]]],.00019,j%4===0?edgeDark:edgeMat);
    }
    if(o.hair==='fade'||o.hair==='short'||o.hair==='sidepart'||o.hair==='braids'){
      for(const side of [-1,1]){
        const h=o.hair==='fade'?.046:.032;
        addEdgeCurve([[side*.041,.928,.004],[side*.043,.928-h*.45,.006],
                      [side*.042,.928-h,.004]],o.hair==='fade'?.00042:.00058,edgeMat);
      }
    }
  }

  if(o.hair==='fade'){
    const fadeMat=new THREE.MeshStandardMaterial({color:o.hairColor,roughness:.86});
    for(let side of [-1,1]) for(let j=0;j<5;j++){
      const pts=[]; for(let k=0;k<=5;k++){ const u=k/5, y=.895-u*.085, x=side*(.036+j*.0012+u*.001), z=.012+u*.004;
        pts.push([x,y,z]); }
      const curve=new THREE.CatmullRomCurve3(pts.map(hd).map(q=>new THREE.Vector3(q[0],q[1],q[2])));
      const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,12,.00022*H,4,false),fadeMat); add(holder.head,mesh);
    }
  }
  if(o.hair==='sidepart'){
    const partMat=new THREE.MeshStandardMaterial({color:0x120e0b,roughness:.8});
    const pts=[]; for(let k=0;k<=10;k++){const u=k/10;pts.push([-.004+u*.012,.982-u*.025,.038+u*.003]);}
    const curve=new THREE.CatmullRomCurve3(pts.map(hd).map(q=>new THREE.Vector3(q[0],q[1],q[2])));
    add(holder.head,new THREE.Mesh(new THREE.TubeGeometry(curve,20,.00055*H,5,false),partMat));
  }
  if(o.hair==='braids'){
    const braidMat=crMat(o.hairColor,.82), braidParts=[];
    /* Each hanging braid is built from three alternating lobes, giving a
       readable woven silhouette instead of a straight bead-like chain. */
    for(let side of [-1,1]){
      const strandMats=[braidMat,crMat(o.hairColor,.74),crMat(o.hairColor,.9)];
      for(let strand=0;strand<3;strand++){
        const pts=[];
        for(let n=0;n<=30;n++){
          const u=n/30, y=.958-u*.145;
          const phase=u* Math.PI*11 + strand*2*Math.PI/3;
          const x=side*(.035+Math.cos(phase)*(.0022*(1-u*.35)));
          const z=.008+Math.sin(phase)*(.0020*(1-u*.35))-u*.006;
          pts.push(hd([x,y,z]));
        }
        const curve=new THREE.CatmullRomCurve3(pts.map(q=>new THREE.Vector3(q[0],q[1],q[2])));
        const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,72,.00135*H,5,false),strandMats[strand]);
        mesh.castShadow=true; mesh.receiveShadow=true; mesh.userData.rigOwned=true; add(holder.head,mesh);
      }
      for(let n=0;n<17;n++){
        const u=n/17, y=.955-u*.145, x=side*(.035+Math.sin(u*Math.PI*22)*.0012), z=.008-u*.006;
        const r=.0034*H*(1-u*.35);
        braidParts.push(piece(ico1,hd([x,y,z]),[r,r*1.18,r],[0,0,side*.2]));
      }
    }
    add(holder.head,new THREE.Mesh(merge(braidParts),braidMat));
  }
  if(o.hair==='ponytail'){
    const tailMat=crMat(o.hairColor,.78), parts=[];
    /* A fuller tapered tail with a gentle outward sweep and a gathered tie. */
    for(let n=0;n<27;n++){
      const u=n/26, y=.914-u*.205, z=-.031-u*.024, x=Math.sin(u*2.4)*.009;
      const r=.0115*H*(1-u*.68);
      parts.push(piece(ico1,hd([x,y,z]),[r*.92,r*1.18,r*.82],[.12,0,Math.sin(u*2.4)*.16]));
    }
    const tieMat=new THREE.MeshStandardMaterial({color:0x30231e,roughness:.7});
    parts.push(piece(ico1,hd([0,.907,-.034]),[.012*H,.004*H,.010*H],[0,0,0]));
    add(holder.head,new THREE.Mesh(merge(parts),tailMat));
  }

  /* Build 134: soften the side and rear hair silhouette around the temples,
     ears and nape. Details are kept behind the ear position to avoid hiding it. */
  if(o.hair!=='none'){
    const sideHairMat=crMat(o.hairColor,.82);
    const sideDarkMat=new THREE.MeshStandardMaterial({color:0x241913,roughness:.88});
    const addSideLine=(coords,rad,mat)=>{
      const pts=coords.map(w=>{const q=hd(w);return new THREE.Vector3(q[0],q[1],q[2]);});
      const curve=new THREE.CatmullRomCurve3(pts);
      const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,24,rad*H,5,false),mat);
      mesh.castShadow=true; mesh.receiveShadow=true; mesh.userData.rigOwned=true; add(holder.head,mesh);
    };
    /* Slim temple panels bridge the cap toward the side hair without
       extending across the visible ear. */
    for(const side of [-1,1]){
      const temple=piece(ico1,hd([side*.036,.944,-.004]),
        [.010*H,.027*H,.008*H],[0,0,side*.10]);
      temple.castShadow=true; temple.receiveShadow=true; add(holder.head,new THREE.Mesh(temple,hairM));
      addSideLine([
        [side*.033,.967,.022],[side*.039,.948,.014],
        [side*.041,.927,-.004],[side*.039,.907,-.018]
      ],.00048,sideHairMat);
      /* A short rear contour gives the hair a continuous edge behind the ear. */
      addSideLine([
        [side*.043,.916,-.018],[side*.041,.895,-.026],
        [side*.034,.878,-.030]
      ],.00055,sideHairMat);
      if(o.hair==='long'||o.hair==='braids'||o.hair==='ponytail'){
        addSideLine([
          [side*.036,.906,-.024],[side*.039,.883,-.029],
          [side*.036,.858,-.032],[side*.030,.841,-.029]
        ],.0010,sideHairMat);
      }
    }
    if(o.hair==='long'||o.hair==='braids'||o.hair==='ponytail'){
      /* Small nape mass blends the side panels into the rear hair silhouette. */
      const nape=piece(ico1,hd([0,.858,-.031]),
        [.031*H,.030*H,.012*H],[0,0,0]);
      nape.castShadow=true; nape.receiveShadow=true; add(holder.head,new THREE.Mesh(nape,hairM));
      for(let j=-2;j<=2;j++){
        const x=j*.010;
        addSideLine([[x,.884,-.037],[x*.92,.864,-.044],[x*.72,.846,-.040]],
          .00042, j===0?sideDarkMat:sideHairMat);
      }
    }
  }

  if(o.beard==='full'||o.beard==='stubble'){
    const full=o.beard==='full', bm=crMat(o.hairColor,.9), gh=[], gj=[], N=full?5200:2400;
    for(let i=0;i<N;i++){ const z=1-2*(i+.5)/N, th=Math.acos(z), ph=Math.PI*(3-Math.sqrt(5))*i, w0=surf(th,ph,1), y=w0[1], x=w0[0], cf=Math.cos(ph);
      if(cf<-.05||y>.927) continue;
      if(y>.913&&Math.abs(x)<.034) continue;                       /* eyes, nose, upper cheeks */
      const lip=Math.abs(x)<.024&&y>ym-.009&&y<ym+.0045; if(lip) continue;
      const must=Math.abs(x)<.026&&y>=ym+.0045&&y<ym+.013;
      if(y>ym+.004&&!must&&Math.abs(x)<.03&&cf>.8) continue;        /* bare skin above the moustache line, beside the nose */
      const k=full?1.02+rnd()*.03:1.008, w=surf(th,ph,k), rr=(full?.0026+rnd()*.0018:.0018)*H;
      const g=piece(ico0,[0,0,0],[rr,rr*(full?.8:.5),rr],[rnd()*6,rnd()*6,rnd()*6]);
      if(y<ym-.002){ const p=jw(w); g.translate(p[0],p[1],p[2]); gj.push(g); } else { const p=hd(w); g.translate(p[0],p[1],p[2]); gh.push(g); } }
    if(full){ for(let i=0;i<70;i++){ const a=(rnd()-.5)*2.2, w=[Math.sin(a)*.036,ym-.034+rnd()*.012,HC[2]+Math.cos(a)*.03], rr=(.006+rnd()*.004)*H, p=jw(w); gj.push(piece(ico0,p,[rr,rr*.8,rr],[rnd()*6,rnd()*6,rnd()*6])); } }
    if(gh.length) add(holder.head,new THREE.Mesh(merge(gh),bm)); if(gj.length) add(jaw,new THREE.Mesh(merge(gj),bm));
  }

  /* Build 135: sharpen facial-hair styling with shaped moustache borders,
     cheek/neck outlines and blended sideburns. */
  if(o.beard==='full'||o.beard==='stubble'){
    const fullBeard=o.beard==='full';
    const beardEdge=new THREE.MeshStandardMaterial({color:o.hairColor,roughness:.9});
    const beardShade=new THREE.MeshStandardMaterial({color:0x251b16,roughness:.92});
    const faceCurve=(coords,rad,mat,owner,mapper)=>{
      const pts=coords.map(w=>{const q=mapper(w);return new THREE.Vector3(q[0],q[1],q[2]);});
      const curve=new THREE.CatmullRomCurve3(pts);
      const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(16,coords.length*3),rad*H,5,false),mat);
      mesh.castShadow=true; mesh.receiveShadow=true; mesh.userData.rigOwned=true; add(owner,mesh);
    };
    /* Moustache follows the upper-lip arc, leaving a clear central philtrum. */
    if(fullBeard){
      for(const side of [-1,1]){
        faceCurve([
          [side*.003,ym+.014,.043],[side*.010,ym+.017,.046],
          [side*.019,ym+.015,.044],[side*.027,ym+.010,.038]
        ],.00115,beardEdge,holder.head,hd);
        faceCurve([
          [side*.004,ym+.006,.045],[side*.014,ym+.007,.045],
          [side*.024,ym+.004,.039]
        ],.00048,beardShade,holder.head,hd);
      }
      /* Fine lower boundary makes the beard edge read as a shaped silhouette. */
      for(const side of [-1,1]){
        faceCurve([
          [side*.048,.900,.012],[side*.043,.878,.024],
          [side*.030,.855,.032],[side*.012,.844,.035]
        ],.00062,beardEdge,jaw,jw);
      }
      faceCurve([[-.012,.844,.035],[0,.842,.036],[.012,.844,.035]],
        .00058,beardEdge,jaw,jw);
    }
    /* Sideburn roots visually connect facial hair to the hair at the temples. */
    for(const side of [-1,1]){
      const len=fullBeard?.052:.024;
      faceCurve([
        [side*.040,.925,.004],[side*.043,.925-len*.38,.010],
        [side*.041,.925-len,.018]
      ],fullBeard?.0015:.0009,beardEdge,holder.head,hd);
    }
  }

  if(o.glasses==='round'){
    const fm=new THREE.MeshStandardMaterial({color:0x3a3a3c,roughness:.35,metalness:.8}), lm=new THREE.MeshStandardMaterial({color:0xddeeff,roughness:.05,metalness:0,transparent:true,opacity:.14,depthWrite:false});
    const ey=.946, gz=zS(ey)+.011, rr=.0142*HD;
    [1,-1].forEach(s=>{ const ex=s*.0215*HD, rim=new THREE.Mesh(new THREE.TorusGeometry(rr*H,.0009*H,6,28),fm), p=hd([ex,ey,gz]); rim.position.set(p[0],p[1],p[2]); add(holder.head,rim);
      const ln=new THREE.Mesh(new THREE.CircleGeometry(rr*H,24),lm); ln.position.set(p[0],p[1],p[2]); ln.castShadow=false; add(holder.head,ln);
      const t0=[ex+s*rr,ey+.002,gz-.002], t1=[s*R3[0]*1.02,ey-.002,HC[2]-.012]; seg(holder.head,'head',t0,t1,.0009,.0009,fm); });
    seg(holder.head,'head',[-.0215*HD+rr,ey+.003,gz+.001],[.0215*HD-rr,ey+.003,gz+.001],.0008,.0008,fm);
  }
  if(o.top==='hoodie'){
    const cm=cloth, dk=crMat(o.shirt,.95); dk.color.multiplyScalar(.82);
    const arc=Math.PI*1.25, hood=new THREE.Mesh(new THREE.TorusGeometry(.058*H,.022*H,10,24,arc),cm), mid=arc/2;
    hood.geometry.rotateX(-Math.PI/2); hood.geometry.rotateY(Math.atan2(Math.cos(mid),Math.sin(mid))); let p=loc('chest',[0,.81,-.01]); hood.position.set(p[0],p[1],p[2]); hood.scale.set(1.05*B,1,1.0*B); add(holder.chest,hood);
    ell(holder.chest,'chest',[0,.795,-.06],[.075,.04,.04],cm,14); ell(holder.chest,'chest',[0,.802,.004],[.058*B,.016,.056*B],cm,16);
    ell(holder.chest,'chest',[0,.735,-.012],[.165*B*SH*chestW,.095,.1*B],cm,20);
    ell(holder.spine,'spine',[0,.64,0],[.13*B*SH*waistW,.088,.088*B],cm,20);
    ell(holder.hips,'hips',[0,.567,0],[.124*B*SH*hipW,.028,.088*B],dk,18);
    const pk=new THREE.Mesh(new THREE.BoxGeometry(.13*H*B,.055*H,.012*H),dk); p=loc('spine',[0,.62,.083*B]); pk.position.set(p[0],p[1],p[2]); pk.rotation.x=-.08; add(holder.spine,pk);
    [1,-1].forEach(s=>{ seg(holder.chest,'chest',[s*.014,.79,.072],[s*.016,.725,.094*B],.0016,.0016,dk); ell(holder.chest,'chest',[s*.016,.722,.094*B],[.0028,.005,.0028],crMat('#c9c2b0',.5),8); });
  }
  if(o.backpack==='yes'){
    const bp=crMat(o.bagColor||'#5f7247',.8), bd=crMat(o.bagColor||'#5f7247',.85); bd.color.multiplyScalar(.85);
    ell(holder.chest,'chest',[0,.705,-.132*B],[.12,.15,.05],bp,22);
    ell(holder.chest,'chest',[0,.655,-.176*B],[.085,.065,.02],bd,16);
    seg(holder.chest,'chest',[-.06,.69,-.2*B],[.06,.69,-.2*B],.0012,.0012,crMat('#222222',.5));
    seg(holder.chest,'chest',[-.065,.64,-.196*B],[.065,.64,-.196*B],.0012,.0012,crMat('#222222',.5));
    [1,-1].forEach(s=>{ const x=s*.072*SH; seg(holder.chest,'chest',[x,.80,-.1*B],[x*1.05,.825,-.01],.009,.009,bp); seg(holder.chest,'chest',[x*1.05,.825,-.01],[x*1.02,.775,.095*B],.009,.009,bp); seg(holder.chest,'chest',[x*1.02,.775,.095*B],[x*.98,.675,.1*B],.009,.009,bp);
      ell(holder.chest,'chest',[x*.98,.7,.104*B],[.012,.008,.004],crMat('#2a2a2a',.4),8); });
  }
  root.updateMatrixWorld(true);
  node.userData.rig={bones:bones,markers:markers,showObjs:markers.concat(lines),H:H,L:null,creator:{fingers:fingers,toes:toeBones,jaw:jaw,eyes:eyes,lids:lids,brows:brows,corners:corner,upL:upL,loL:loL,holder:holder,torso:torsoMesh,limbs:limbShell,jawMax:.42,ph:(spec.name||'x').length*1.7}};
  markers.concat(lines).forEach(m=>{ m.visible=false; });
  node.userData.spec=spec; if(spec.pose) rigApply(node); else crFingers(node.userData.rig,{});
}
/* ---- driver: visemes, expressions, blinks, eye contact, breathing ---- */
function crUpdate(t,playing,dt){
  const vo=S.vo, vis=vo&&VB[vo.id]&&VB[vo.id].vis, caps=S.caps||[];
  let visA=null; if(vis){ const e=VB[vo.id]; if(!e.visA){ const b=atob(e.vis), a=new Uint8Array(b.length); for(let i=0;i<b.length;i++) a[i]=b.charCodeAt(i); e.visA=a; } visA=e.visA; }
  nodes.forEach(nd=>{ const R=nd.userData.rig, C=R&&R.creator; if(!C) return; const nm=nd.userData.name, st=nd.userData.fs||(nd.userData.fs={open:0,wid:1,rnd:0,gx:0,gy:0,sm:0,pucker:0,upper:0,lower:0}), ph=C.ph;
    let tg=[0,1,0], act=false;
    if(visA&&(playing||S.view==='cam'||S.recording)){ for(let i=0;i<caps.length;i++){ const c=caps[i]; if(c.who===nm&&t>=c.t0-.06&&t<=c.t1+.1){ const k=Math.max(0,Math.min(visA.length-1,Math.round((t-(vo.t0||0))*30))), v=visA[k], code=v>>5, it=(v&31)/31, V=CR_VIS[code]||CR_VIS[0]; tg=[V[0]*(.25+.75*it),V[1],V[2]]; act=true; break; } } }
    const ex=faceExpr(nm,t), pul=ex.pulse*Math.abs(Math.sin(t*8.5+ph))*.5, a=Math.min(1,(dt||.033)*20);
    const PZ=(nd.userData.spec&&nd.userData.spec.pose)||{}, fa=PZ['face.a']||CR_Z, fb=PZ['face.b']||CR_Z, fc=PZ['face.c']||CR_Z, fd=PZ['face.d']||CR_Z, fe=PZ['face.e']||CR_Z;
    tg[2]=Math.max(tg[2],fb[2]); ex.sm+=fb[0]; ex.bt+=fc[2];
    const open=Math.max(0,Math.min(1,Math.max(tg[0]+ex.op*.5+pul*.5,fa[2])));
    st.open+=(open-st.open)*a; st.wid+=(tg[1]-st.wid)*a; st.rnd+=(tg[2]-st.rnd)*a;
    C.jaw.rotation.x=st.open*C.jawMax;
    const smTarget=Math.max(-1,Math.min(1,ex.sm)), puckerTarget=Math.max(0,Math.min(1,fe[0]||0)), upperTarget=Math.max(-1,Math.min(1,fe[1]||0)), lowerTarget=Math.max(-1,Math.min(1,fe[2]||0));
    st.sm+=(smTarget-st.sm)*a; st.pucker+=(puckerTarget-st.pucker)*a; st.upper+=(upperTarget-st.upper)*a; st.lower+=(lowerTarget-st.lower)*a;
    const sm=st.sm, pucker=st.pucker, upper=st.upper, lower=st.lower, wd=(1+sm*.12+fb[1]*.25)*(1-.32*st.rnd)*(.9+.1*st.wid);
    C.upL.scale.x=.018*R.H*wd*(1-.24*pucker); C.loL.scale.x=.017*R.H*wd*(1-.18*pucker);
    C.upL.scale.y=.0045*R.H*(1+.4*st.rnd+.22*pucker); C.loL.scale.y=.0048*R.H*(1+.4*st.rnd+.22*pucker);
    C.upL.scale.z=.006*R.H*(1+1.15*pucker); C.loL.scale.z=.006*R.H*(1+1.05*pucker);
    if(!C.upL.userData.p0) C.upL.userData.p0=C.upL.position.clone(); if(!C.loL.userData.p0) C.loL.userData.p0=C.loL.position.clone();
    C.upL.position.copy(C.upL.userData.p0); C.upL.position.y+=(upper*.0022+sm*.0008)*R.H; C.upL.position.z+=pucker*.0015*R.H;
    C.loL.position.copy(C.loL.userData.p0); C.loL.position.y+=(lower*.0022-st.rnd*.0008)*R.H; C.loL.position.z+=pucker*.0013*R.H;
    C.corners.forEach(c=>{ c.position.copy(c.userData.p0); c.position.y+=sm*.007*R.H; c.position.x+=c.userData.s*(sm*.003-.006*st.rnd)*R.H; c.position.y-=st.open*.002*R.H; });
    /* blink + squint, brows */
    const tt=t+ph, bl=((tt/3.6)%1)<.05?Math.sin(((tt/3.6)%1)/.05*Math.PI):0, lidC=Math.max(bl,Math.max(0,ex.lid+pul*.15));
    C.lids.forEach((l,i)=>{ const lc=Math.max(0,Math.min(1,Math.max(lidC,(i?fa[1]:fa[0]),fd[2]))); l.rotation.x=-1.25+lc*1.18; });
    C.brows.forEach((b,i)=>{ const s=i?-1:1, up=ex.br*.01+(i?ex.ba*.008:0)-lidC*.002+pul*.003+(i?fc[1]:fc[0])*.012, tilt=(i?-1:1)*(-ex.bt*.3)+(i?ex.ba*.1:0); b.position.copy(b.userData.p0); b.position.y+=up*R.H; b.rotation.z=tilt; });
    /* eyes: look at whoever speaks, with small saccades */
    let tgt=null; for(let i=0;i<caps.length;i++){ const c=caps[i]; if(t>=c.t0-.25&&t<=c.t1+.4&&c.who&&c.who!==nm){ tgt=c.who; break; } }
    let gx=0,gy=0; if(tgt){ let other=null; nodes.forEach(n2=>{ if(n2.userData.name===tgt) other=n2; }); if(other){ const oh=other.userData.rig?other.userData.rig.H:1.75, v=other.localToWorld(new THREE.Vector3(0,oh*.935,0)), hb=R.bones.head; hb.updateWorldMatrix(true,false); const lp=hb.worldToLocal(v); gx=Math.atan2(lp.x,lp.z); gy=Math.atan2(-(lp.y-R.H*.081),Math.hypot(lp.x,lp.z)); gy=Math.max(-.3,Math.min(.3,gy)); } }
    const sc=Math.floor((tt*.9)), n1=Math.sin(sc*12.9898+ph)*43758.5453, n2=Math.sin(sc*78.233+ph)*12345.678; const rx=(n1-Math.floor(n1)-.5)*.07, ry=(n2-Math.floor(n2)-.5)*.04;
    st.gx+=(Math.max(-.55,Math.min(.55,gx))+rx+Math.max(-1,Math.min(1,fd[0]))*.55-st.gx)*Math.min(1,(dt||.033)*16); st.gy+=(Math.max(-.38,Math.min(.38,gy))+ry+Math.max(-1,Math.min(1,fd[1]))*.38-st.gy)*Math.min(1,(dt||.033)*16);
    C.eyes.forEach(e=>{ e.rotation.y=st.gx; e.rotation.x=st.gy; });
    /* breathing and a hint of head sway in the holders */
    const br=Math.sin(t*2*Math.PI*.27+ph), sw=Math.sin(t*2*Math.PI*.11+ph*1.3);
    C.holder.chest.scale.set(1+.008*br,1+.012*br,1+.01*br); C.holder.spine.scale.set(1,1+.006*br,1); C.holder.head.rotation.set(.012*Math.sin(t*2*Math.PI*.19+ph),.02*sw,.01*sw*.7);
  });
}
/* ---- add / edit UI ---- */
function crAddNode(o){ const spec=mkSpec('creator',{name:(o&&o.name)||'Character',creator:Object.assign({},CR_DEF,o||{}),p:[0,0,0],r:[0,0,0],s:[1,1,1]}); const n=addNode(spec); refreshScene&&refreshScene(); selectId&&selectId(spec.id); queueSave&&queueSave(); return spec; }
function crRebuild(id,o){ const n=nodes.get(id); if(!n) return; const sp=n.userData.spec; sp.creator=Object.assign({},sp.creator,o); const p=n.position.toArray(), r=[n.rotation.x,n.rotation.y,n.rotation.z], s=n.scale.toArray(), vis=n.visible; sp.p=p; sp.r=r; sp.s=s;
  tc.detach&&tc.detach(); scene.remove(n); const nn=makeNode(sp); nn.visible=vis; scene.add(nn); nodes.set(id,nn); nn.userData.fs=null; queueSave&&queueSave(); }
function crPanel(){
  let ov=document.getElementById('crOv'); if(ov){ ov.remove(); return; }
  const sel=S.sel&&nodes.get(S.sel), edit=sel&&sel.userData.type==='creator'?sel:null, cur=Object.assign({},CR_DEF,edit?edit.userData.spec.creator:{});
  ov=document.createElement('div'); ov.id='crOv'; ov.style.cssText='position:fixed;right:10px;top:56px;bottom:10px;width:min(330px,92vw);z-index:60;background:var(--panel,#1d1f24);color:var(--fg,#e8e8ea);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:12px;overflow:auto;font:13px system-ui;box-shadow:0 8px 30px rgba(0,0,0,.5)';
  const rows=[['name','Name','text'],['bodyType','Body shape',['masculine','feminine']],['height','Height (m)',[1.4,2.1,.01]],['build','Build',[.75,1.4,.01]],['shoulders','Shoulders',[.85,1.25,.01]],['waist','Waist',[.75,1.3,.01]],['hips','Hips',[.75,1.35,.01]],['chest','Chest width',[.75,1.3,.01]],['bust','Bust volume',[.55,1.45,.01]],['head','Head size',[.9,1.2,.01]],['skin','Skin','color'],['hair','Hair',['short','fade','sidepart','curly','long','braids','ponytail','cap','none']],['beard','Beard',['none','stubble','full']],['glasses','Glasses',['none','round']],['top','Top style',['tee','hoodie']],['backpack','Backpack',['no','yes']],['fit','Trouser fit',[.9,1.4,.01]],['shoeStyle','Shoes style',['plain','sneaker','bare']],['hairColor','Hair colour','color'],['brow','Brow colour','color'],['eyes','Eye colour','color'],['shirt','Top','color'],['pants','Trousers','color'],['shoes','Shoes','color']];
  const val={}; Object.keys(cur).forEach(k=>{ val[k]=cur[k]; });
  let h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>Character creator</b><button id="crX" style="background:none;border:0;color:inherit;font-size:18px">✕</button></div><div style="opacity:.7;margin-bottom:8px">Full skeleton, jaw, eyes, eyelids and brows. Poses, tracks and the voice lip sync all work on it.</div>';
  ov.innerHTML=h; const box=document.createElement('div'); ov.appendChild(box);
  rows.forEach(r=>{ const w=document.createElement('label'); w.style.cssText='display:flex;align-items:center;gap:8px;margin:6px 0'; const sp=document.createElement('span'); sp.style.cssText='width:96px;flex:none'; sp.textContent=r[1]; w.appendChild(sp); let inp;
    if(r[2]==='text'){ inp=document.createElement('input'); inp.type='text'; inp.style.cssText='flex:1;min-width:0'; } else if(r[2]==='color'){ inp=document.createElement('input'); inp.type='color'; inp.style.cssText='flex:1;height:30px'; } else if(Array.isArray(r[2])&&typeof r[2][0]==='string'){ inp=document.createElement('select'); r[2].forEach(v=>{ const op=document.createElement('option'); op.value=v; op.textContent=v; inp.appendChild(op); }); inp.style.cssText='flex:1'; } else { inp=document.createElement('input'); inp.type='range'; inp.min=r[2][0]; inp.max=r[2][1]; inp.step=r[2][2]; inp.style.cssText='flex:1;min-width:0'; }
    inp.value=val[r[0]]; inp.addEventListener('input',()=>{ val[r[0]]=(inp.type==='range')?+inp.value:inp.value; if(edit&&r[0]!=='name'){ clearTimeout(ov._t); ov._t=setTimeout(()=>{ crRebuild(edit.userData.id,val); },120); } }); w.appendChild(inp); box.appendChild(w); });
  const bar=document.createElement('div'); bar.style.cssText='display:flex;gap:8px;margin-top:12px'; const mk=(t,fn)=>{ const b=document.createElement('button'); b.textContent=t; b.style.cssText='flex:1;padding:9px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:#2f6feb;color:#fff;font:600 13px system-ui'; b.onclick=fn; bar.appendChild(b); };
  mk('Add to scene',()=>{ crAddNode(val); toast('Character added at the centre. Use Rig and pose to move the joints.'); });
  if(edit){ const n=document.createElement('div'); n.style.cssText='margin-top:8px;opacity:.7'; n.textContent='Editing "'+edit.userData.name+'": changes apply live.'; ov.appendChild(n); }
  ov.appendChild(bar); document.body.appendChild(ov); ov.querySelector('#crX').onclick=()=>ov.remove();
}

const CR_JESVIN={name:'Jesvin',height:1.74,build:.92,shoulders:1,head:1.04,skin:'#94654a',hair:'curly',hairColor:'#18120e',brow:'#140e0b',eyes:'#2b1b12',beard:'full',glasses:'round',top:'hoodie',shirt:'#4d4a2c',pants:'#4a6188',fit:1.28,shoes:'#ebe7de',shoeStyle:'sneaker',shoeAccent:'#4f5f3d',backpack:'yes',bagColor:'#5f7247'};
function loadJesvinRig(){ const sp=crAddNode(CR_JESVIN); toast('Jesvin added with a full body, finger and face rig. Pose him in Rig and pose, or Face and hands.'); return sp; }

window.__cr={add:crAddNode,rebuild:crRebuild,def:CR_DEF};
window.__cr.frame=function(nm,d,hh){ hh=hh||.95; nodes.forEach(n=>{ if(n.userData.name===nm){ const p=n.position; orbit.target.set(p.x,p.y+hh,p.z); edit.position.set(p.x+.25*d,p.y+hh+.12,p.z+d); orbit.update(); } }); };
