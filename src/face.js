/* ---------- procedural face rig: eyelids + blinks, brows, expressive mouth driven by the voice ---------- */
const FACE_ADJ={my:0,mx:0,ms:1,ey:0,es:1,by:0};     /* user nudges (fractions of body height) */
const EXPR={neutral:{},happy:{br:.15,sm:.65,lid:.2},laugh:{br:.3,sm:1,lid:.55,op:.35,pulse:1},surprised:{br:1,sm:0,lid:-.3,op:.55,wd:-.25},
  skeptic:{br:0,ba:.9,bt:-.35,sm:-.15,lid:.22},worried:{br:.35,bt:.85,sm:-.3},excited:{br:.45,sm:.8,op:.15},annoyed:{br:-.3,bt:-.75,sm:-.45,lid:.35},smug:{sm:.5,ba:.45,lid:.3}};
function faceSkin(sm,H,y0,zf){ try{
  const mat=[].concat(sm.material)[0], img=mat&&mat.map&&mat.map.image; if(!img) return '#c99a78';
  const uv=sm.geometry.attributes.uv, p=sm.geometry.attributes.position; if(!uv) return '#c99a78';
  let best=-1,bd=1e9; for(let v=0;v<p.count;v++){ const dx=p.array[v*3]-H*.045, dy=p.array[v*3+1]-(y0+H*.92), dz=p.array[v*3+2]-(zf-H*.03); const d=dx*dx+dy*dy+dz*dz; if(d<bd){ bd=d; best=v; } }
  const cv=document.createElement('canvas'), w=img.width||img.naturalWidth, h=img.height||img.naturalHeight; cv.width=w; cv.height=h; const cx=cv.getContext('2d'); cx.drawImage(img,0,0);
  const px=Math.max(3,Math.min(w-4,Math.round(uv.array[best*2]*w))), py=Math.max(3,Math.min(h-4,Math.round(uv.array[best*2+1]*h))), d=cx.getImageData(px-3,py-3,7,7).data; let r=0,g=0,b=0; for(let i=0;i<d.length;i+=4){ r+=d[i]; g+=d[i+1]; b+=d[i+2]; } const n=d.length/4;
  return 'rgb('+Math.round(r/n)+','+Math.round(g/n)+','+Math.round(b/n)+')'; }catch(e){ return '#c99a78'; } }
function faceBuild(node){
  const R=node.userData.rig; if(!R) return null;
  let sm=null; node.traverse(o=>{ if(o.isSkinnedMesh&&!sm) sm=o; }); if(!sm||!sm.skeleton) return null;
  const hb=R.bones.head, bi=sm.skeleton.bones.indexOf(hb); if(bi<0) return null;
  const pos=sm.geometry.attributes.position, a=pos.array, n=pos.count; let y0=1e9,y1=-1e9;
  for(let v=0;v<n;v++){ const y=a[v*3+1]; if(y<y0) y0=y; if(y>y1) y1=y; }
  const H=y1-y0, A=FACE_ADJ;
  const surf=(x,y,tx,ty)=>{ let z=-1e9; for(let v=0;v<n;v++){ if(Math.abs(a[v*3]-x)<tx&&Math.abs(a[v*3+1]-y)<ty&&a[v*3+2]>z) z=a[v*3+2]; } return z; };
  const ym=y0+H*(.905+A.my), ye=y0+H*(.937+A.ey), yb=ye+H*(.021+A.by);
  let zm=surf(0,ym,H*.03,H*.008); if(zm<-1e8) return null;
  const ex=H*.019*A.es, zeL=surf(ex,ye,H*.008,H*.006), zeR=surf(-ex,ye,H*.008,H*.006), zbL=surf(ex,yb,H*.012,H*.006), zbR=surf(-ex,yb,H*.012,H*.006);
  const M=new THREE.Matrix4().multiplyMatrices(sm.skeleton.boneInverses[bi],sm.bindMatrix), q=new THREE.Quaternion(), sc=new THREE.Vector3(), tp=new THREE.Vector3(); M.decompose(tp,q,sc); const k=sc.x||1;
  const root=new THREE.Group(); root.userData.rigOwned=true; root.userData.face=true; root.userData.rigRef=R; hb.add(root);
  const place=(m,x,y,z)=>{ const P=new THREE.Vector3(x,y,z).applyMatrix4(M); m.position.copy(P); m.quaternion.copy(q); m.userData.rigOwned=true; m.raycast=()=>{}; m.frustumCulled=false; root.add(m); return m; };
  const skin=faceSkin(sm,H,y0,zm), mk=(c,off)=>new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:off,polygonOffsetUnits:off});
  const lw=H*.026*A.es*k, lh=H*.0125*A.es*k, F={root:root,H:H,k:k,lw:lw,lh:lh,ph:(node.userData.name||'x').length*1.37,details:[]};
  /* Fine facial folds are thin, low-contrast surface overlays. They are
     deliberately subtle: the skin microtexture handles pores, while these
     curves add eyelid, under-eye and nasolabial definition without baking
     detail into the skinned base mesh. */
  const detailMat=new THREE.MeshBasicMaterial({color:0x754d40,transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6});
  const addFold=(pts,radius,opacity)=>{
    const curve=new THREE.CatmullRomCurve3(pts.map(v=>new THREE.Vector3(v[0]*H*k,v[1]*H*k,v[2]*H*k)));
    const geo=new THREE.TubeGeometry(curve,18,radius*H*k,5,false);
    const mat=detailMat.clone(); mat.opacity=opacity;
    const mesh=place(new THREE.Mesh(geo,mat),0,0,0); mesh.frustumCulled=false; F.details.push(mesh); return mesh;
  };
  [-1,1].forEach(side=>{
    /* Under-eye fold and a short outer-corner crease. */
    addFold([[side*.008,.929,.006],[side*.014,.927,.006],[side*.021,.928,.005],[side*.027,.931,.003]],.00048,.16);
    addFold([[side*.024,.937,.005],[side*.028,.939,.004],[side*.031,.941,.002]],.00038,.13);
    /* Nasolabial fold: from the side of the nose toward the mouth corner. */
    addFold([[side*.009,.919,.008],[side*.013,.914,.008],[side*.017,.909,.007],[side*.022,.905,.005]],.00052,.17);
  });
  /* A very fine lower-lip border helps the mouth read clearly at close range. */
  addFold([[-.018,.900,.006],[-.010,.898,.007],[0,.897,.007],[.010,.898,.007],[.018,.900,.006]],.00035,.12);
  F.lid=[1,-1].map((s,i)=>{ const z=(i?zeR:zeL); const m=place(new THREE.Mesh(new THREE.CircleGeometry(.5,16),mk(skin,-3)),s*ex,ye,(z<-1e8?zm-H*.05:z)+H*.0025); m.scale.set(lw,.001,1); m.userData.p0=m.position.clone(); return m; });
  F.brow=[1,-1].map((s,i)=>{ const z=(i?zbR:zbL); const m=place(new THREE.Mesh(new THREE.PlaneGeometry(1,1),mk(0x1b130f,-4)),s*ex,yb,(z<-1e8?zm-H*.05:z)+H*.003); m.scale.set(H*.03*A.es*k,H*.0042*k,1); m.userData.y=yb; m.userData.x=s*ex; m.userData.side=s; return m; });
  const NP=11, g=new THREE.BufferGeometry(), P=new Float32Array(NP*2*3+3), I=[]; for(let i=0;i<NP*2;i++){ I.push(NP*2,i,(i+1)%(NP*2)); } g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setIndex(I);
  const mm=place(new THREE.Mesh(g,mk(0x2b0c0e,-5)),0,ym,zm+H*.003); mm.userData.NP=NP; mm.visible=false; F.mouth=mm; F.mw=H*.042*A.ms*k; F.mm=M; node.userData.faceInfo=F; return F;
}
function faceExpr(who,t){ const L=S.exp||[]; const o={br:0,ba:0,bt:0,sm:0,lid:0,op:0,wd:0,pulse:0}; const sm=x=>{ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); };
  for(let i=0;i<L.length;i++){ const e=L[i]; if(e.who!==who) continue; const w=sm((t-(e.t0-.3))/.3)*(1-sm((t-e.t1)/.35)); if(w<=0) continue; const p=EXPR[e.e]||{}; Object.keys(p).forEach(k=>{ o[k]=(o[k]||0)+p[k]*w; }); } return o; }
function faceUpdate(t,playing){
  const vo=S.vo, env=vo&&vbEnv(vo.id), caps=S.caps||[];
  nodes.forEach(nd=>{ const R=nd.userData.rig; if(!R||!(nd.userData.spec&&nd.userData.spec.embed!=null)) return; const nm=nd.userData.name;
    let F=nd.userData.faceInfo; if(F&&F.root.userData.rigRef!==R){ if(F.root.parent) F.root.parent.remove(F.root); F=nd.userData.faceInfo=null; nd.userData.faceTried=null; }
    if(!F){ if(nd.userData.faceTried===R) return; nd.userData.faceTried=R; try{ F=faceBuild(nd); }catch(e){ F=null; } if(!F) return; }
    const ex=faceExpr(nm,t), ph=F.ph, tt=t+ph;
    let v=0; if(env&&(playing||S.view==='cam'||S.recording)){ for(let i=0;i<caps.length;i++){ const c=caps[i]; if(c.who===nm&&t>=c.t0-.05&&t<=c.t1+.12){ const k=Math.max(0,Math.min(env.length-1,Math.round((t-(vo.t0||0))*30))); v=env[k]/255; break; } } }
    const bl=((tt/3.6)%1)<.045?Math.sin(((tt/3.6)%1)/.045*Math.PI):0, pul=ex.pulse*Math.abs(Math.sin(t*8.5+ph))*.5;
    const lidC=Math.max(0,Math.min(1,Math.max(bl,ex.lid+pul*.2)));
    F.lid.forEach(m=>{ m.visible=lidC>.04; const h=Math.max(.0004*F.H,F.lh*lidC); m.scale.set(F.lw,h,1); const up=new THREE.Vector3(0,1,0).applyQuaternion(m.quaternion); m.position.copy(m.userData.p0).addScaledVector(up,(F.lh-h)/2); });
    const bu=ex.br*F.H*.008*F.k, bt=ex.bt;
    F.brow.forEach(m=>{ if(!m.userData.p0){ m.userData.p0=m.position.clone(); m.userData.q0=m.quaternion.clone(); } const up=new THREE.Vector3(0,1,0).applyQuaternion(m.userData.q0), s=m.userData.side, asym=(s<0?ex.ba:0)*F.H*.007*F.k;
      m.position.copy(m.userData.p0).addScaledVector(up,bu+asym-lidC*F.H*.002*F.k+pul*F.H*.003*F.k);
      const zq=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),s*(-bt*.28)+(s<0?ex.ba*.1:0)); m.quaternion.copy(m.userData.q0).multiply(zq); });
    if(!F.mouth.visible) return;
    /* mouth polygon */
    const NP=F.mouth.userData.NP, pa=F.mouth.geometry.attributes.position.array, ph2=Math.sin(t*13+ph), smile=Math.max(-1,Math.min(1,ex.sm)), op=Math.max(0,Math.min(1,v*.85+ex.op*.5+pul*.5));
    const pk=v*Math.max(0,-ph2)*.5, wid=F.mw*(1+(ex.wd||0)+smile*.18+.15*v*Math.max(0,ph2)-pk*.35), oh=F.H*.026*F.k*op+F.H*.0032*F.k, cl=F.H*.011*F.k*smile;
    for(let i=0;i<NP;i++){ const u=-1+2*i/(NP-1), x=u*wid/2, cy=cl*u*u*(smile>0?1:1), yt=cy; pa[i*3]=x; pa[i*3+1]=yt; pa[i*3+2]=0; const uu=1-2*i/(NP-1), xb=uu*wid/2, cyb=cl*uu*uu, j=NP+i, yb=cyb-oh*(1-uu*uu)-F.H*.0016*F.k; pa[j*3]=xb; pa[j*3+1]=yb; pa[j*3+2]=0; }
    pa[NP*2*3]=0; pa[NP*2*3+1]=-oh*.4; pa[NP*2*3+2]=0; F.mouth.geometry.attributes.position.needsUpdate=true;
    if(!F.mouth.userData.p0) F.mouth.userData.p0=F.mouth.position.clone();
    /* polygon lives in the mesh plane; orientation = bind quaternion */
  });
}
function faceNudge(key,d){ FACE_ADJ[key]=Math.round((FACE_ADJ[key]+d)*10000)/10000; nodes.forEach(nd=>{ const F=nd.userData.faceInfo; if(F){ if(F.root.parent) F.root.parent.remove(F.root); nd.userData.faceInfo=null; nd.userData.faceTried=null; } }); toast('Face adjusted. Press play or scrub to see it.'); }
function faceMenu(){ return [
  {l:'Face: mouth up',fn:()=>faceNudge('my',.004)},{l:'Face: mouth down',fn:()=>faceNudge('my',-.004)},
  {l:'Face: mouth bigger',fn:()=>faceNudge('ms',.15)},{l:'Face: mouth smaller',fn:()=>faceNudge('ms',-.15)},
  {l:'Face: eyes and brows up',fn:()=>{ faceNudge('ey',.004); }},{l:'Face: eyes and brows down',fn:()=>{ faceNudge('ey',-.004); }},
  {l:'Face: eyes wider apart',fn:()=>faceNudge('es',.15)},{l:'Face: eyes closer',fn:()=>faceNudge('es',-.15)}]; }
