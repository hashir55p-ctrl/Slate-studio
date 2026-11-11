/* ---------- full rig for imported models: fingers, thumbs, toes and a muscle-style face rig ---------- */
const MF_FIN=['thumb','index','middle','ring','pinky'];
function mfSmooth(a,b,x){ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); }
function mfFall(d,r){ const q=d/r; return q>=1?0:(1-q*q)*(1-q*q); }
function mfExtend(node,spec){
  const R=node.userData.rig; if(!R||!R.bones||!R.bones.head) return;
  const meshes=[]; node.traverse(o=>{ if(o.isSkinnedMesh&&o.userData.rigOwned) meshes.push(o); }); if(!meshes.length) return;
  node.updateMatrixWorld(true);
  const rot=(spec.rig&&spec.rig.rot)||0, c=Math.cos(rot), s=Math.sin(rot), toB=(x,z)=>[x*c+z*s,-x*s+z*c], fromB=(x,z)=>[x*c-z*s,x*s+z*c];
  const inv=new THREE.Matrix4().copy(node.matrixWorld).invert(), bp=n=>{ const v=new THREE.Vector3(); R.bones[n].getWorldPosition(v); v.applyMatrix4(inv); const b=toB(v.x,v.z); return [b[0],v.y,b[1]]; };
  /* all vertices in body space (x right, y up, z front) */
  const V=[]; meshes.forEach(m=>{ const a=m.geometry.attributes.position.array; for(let i=0;i<a.length;i+=3){ const b=toB(a[i],a[i+2]); V.push([b[0],a[i+1],b[1],m,i/3]); } });
  const H=R.H||1.75, meta=(spec.type==='glb'&&spec.embed!=null&&typeof EMBED_GLB!=='undefined'&&EMBED_GLB[spec.embed]&&EMBED_GLB[spec.embed].face)||null;
  const extra=[], E={};   /* name -> {bone, parent, p:[body], kind} */
  const mkBone=(name,parent,p)=>{ const b=new THREE.Bone(); b.name=name; const q=fromB(p[0],p[2]); const w=new THREE.Vector3(q[0],p[1],q[1]).applyMatrix4(node.matrixWorld); const par=R.bones[parent]||(E[parent]&&E[parent].bone); par.updateMatrixWorld(true); par.worldToLocal(w); b.position.copy(w); par.add(b); b.updateMatrixWorld(true); E[name]={bone:b,p:p.slice(),parent:parent}; extra.push(b); return b; };
  const W=new Map(); /* vertex key -> list of [boneName, w] overrides, replaces the old weights */
  const key=v=>v[3].id+':'+v[4];
  /* ---- hands ---- */
  const hands={};
  [['L',1],['R',-1]].forEach(([S1,sg])=>{ try{
    const wb=bp('hand.'+S1), el=bp('foreArm.'+S1); let d=[wb[0]-el[0],wb[1]-el[1],wb[2]-el[2]]; const dl=Math.hypot(d[0],d[1],d[2]); d=d.map(x=>x/dl);
    /* the real wrist sits one hand length back from the fingertips */
    const near=v=>{ const u=(v[0]-el[0])*d[0]+(v[1]-el[1])*d[1]+(v[2]-el[2])*d[2]; if(u<0) return null; const lx=v[0]-el[0]-d[0]*u, ly=v[1]-el[1]-d[1]*u, lz=v[2]-el[2]-d[2]*u; return Math.hypot(lx,ly,lz)<.13*H/1.75?u:null; };
    let tipU=0; V.forEach(v=>{ const u=near(v); if(u!=null&&u>tipU) tipU=u; });
    const HL=.19*H/1.75, wu=tipU-HL; let cy=0,cz=0,cn=0; V.forEach(v=>{ const u=near(v); if(u!=null&&Math.abs(u-wu)<.012){ cy+=v[1]; cz+=v[2]; cn++; } });
    const wr=[el[0]+d[0]*wu,cn?cy/cn:el[1]+d[1]*wu,cn?cz/cn:el[2]+d[2]*wu];
    { const hb=R.bones['hand.'+S1], fa=R.bones['foreArm.'+S1], q=fromB(wr[0],wr[2]), w=new THREE.Vector3(q[0],wr[1],q[1]).applyMatrix4(node.matrixWorld); fa.updateMatrixWorld(true); fa.worldToLocal(w); hb.position.copy(w); hb.updateMatrixWorld(true); }
    const HV=V.filter(v=>{ const u=(v[0]-wr[0])*d[0]+(v[1]-wr[1])*d[1]+(v[2]-wr[2])*d[2]; if(u<-.005) return false; const lx=v[0]-wr[0]-d[0]*u, ly=v[1]-wr[1]-d[1]*u, lz=v[2]-wr[2]-d[2]*u; return Math.hypot(lx,ly,lz)<.13*H/1.75; });
    if(HV.length<80) return;
    const U=v=>(v[0]-wr[0])*d[0]+(v[1]-wr[1])*d[1]+(v[2]-wr[2])*d[2], F=v=>v[2]-wr[2];
    let L=0; HV.forEach(v=>{ L=Math.max(L,U(v)); }); if(L<.06) return;
    const tipF=HV.filter(v=>U(v)>L*.82); let fMax=-1; tipF.forEach(v=>{ fMax=Math.max(fMax,F(v)); });
    const thumbV=HV.filter(v=>F(v)>fMax+.014&&U(v)<L*.8&&U(v)>L*.12), fingV=HV.filter(v=>U(v)>L*.56&&!(F(v)>fMax+.014));
    if(fingV.length<40) return;
    /* 1D k-means on the front axis: index, middle, ring, pinky */
    const fs=fingV.map(F).sort((a,b)=>a-b); let C=[0,1,2,3].map(i=>fs[Math.floor((i+.5)/4*fs.length)]);
    for(let it=0;it<12;it++){ const sum=[0,0,0,0], n=[0,0,0,0]; fingV.forEach(v=>{ const f=F(v); let bi=0; for(let k=1;k<4;k++) if(Math.abs(f-C[k])<Math.abs(f-C[bi])) bi=k; sum[bi]+=f; n[bi]++; }); C=C.map((x,k)=>n[k]?sum[k]/n[k]:x); }
    C.sort((a,b)=>b-a);
    const clus=[[],[],[],[]]; fingV.forEach(v=>{ const f=F(v); let bi=0; for(let k=1;k<4;k++) if(Math.abs(f-C[k])<Math.abs(f-C[bi])) bi=k; clus[bi].push(v); });
    const centre=(arr,u0,u1)=>{ const q=arr.filter(v=>{ const u=U(v); return u>=u0&&u<=u1; }); if(!q.length) return null; let x=0,y=0,z=0; q.forEach(v=>{ x+=v[0]; y+=v[1]; z+=v[2]; }); return [x/q.length,y/q.length,z/q.length]; };
    const chains={};
    clus.forEach((cl,ci)=>{ if(cl.length<8) return; let u0=1e9,u1=-1e9; cl.forEach(v=>{ const u=U(v); u0=Math.min(u0,u); u1=Math.max(u1,u); });
      const len=u1-u0, base0=centre(cl,u0,u0+len*.12)||centre(cl,u0,u1), tip=centre(cl,u1-len*.08,u1)||base0;
      const ax=[tip[0]-base0[0],tip[1]-base0[1],tip[2]-base0[2]], al=Math.hypot(ax[0],ax[1],ax[2])||1, dir=ax.map(x=>x/al), full=al+len*.33;
      const knuck=[base0[0]-dir[0]*len*.33,base0[1]-dir[1]*len*.33,base0[2]-dir[2]*len*.33];
      const pts=[0,.45,.74,1].map(f=>[knuck[0]+dir[0]*full*f,knuck[1]+dir[1]*full*f,knuck[2]+dir[2]*full*f]);
      const nm=MF_FIN[ci+1]+'.'+S1; let par='hand.'+S1; const segs=[];
      for(let k=0;k<3;k++){ const bn=nm+(k+1); mkBone(bn,par,pts[k]); par=bn; segs.push({n:bn,h:pts[k],t:pts[k+1]}); }
      chains[MF_FIN[ci+1]]={dir:dir,segs:segs,r:Math.max(.006,len*.16)}; });
    if(thumbV.length>12){ let best=null,bs=-1e9; thumbV.forEach(v=>{ const sc=U(v)+F(v)*1.2; if(sc>bs){ bs=sc; best=v; } });
      const tip=centre(thumbV,U(best)-.01,U(best)+.01)||[best[0],best[1],best[2]];
      const base=[wr[0]+d[0]*L*.12,wr[1]+d[1]*L*.12-.004,wr[2]+fMax*.6+.006];
      const ax=[tip[0]-base[0],tip[1]-base[1],tip[2]-base[2]], al=Math.hypot(ax[0],ax[1],ax[2])||1, dir=ax.map(x=>x/al);
      const pts=[0,.38,.7,1].map(f=>[base[0]+ax[0]*f,base[1]+ax[1]*f,base[2]+ax[2]*f]); let par='hand.'+S1; const segs=[];
      for(let k=0;k<3;k++){ const bn='thumb.'+S1+(k+1); mkBone(bn,par,pts[k]); par=bn; segs.push({n:bn,h:pts[k],t:pts[k+1]}); }
      chains.thumb={dir:dir,segs:segs,r:.011}; }
    /* weights inside the hand */
    const palm={n:'hand.'+S1,h:wr,t:[wr[0]+d[0]*L*.5,wr[1]+d[1]*L*.5,wr[2]+d[2]*L*.5],r:.032};
    const segD=(v,g)=>{ const hx=g.h[0],hy=g.h[1],hz=g.h[2], dx=g.t[0]-hx,dy=g.t[1]-hy,dz=g.t[2]-hz; let t=((v[0]-hx)*dx+(v[1]-hy)*dy+(v[2]-hz)*dz)/(dx*dx+dy*dy+dz*dz); t=t<0?0:t>1?1:t; return Math.hypot(v[0]-hx-dx*t,v[1]-hy-dy*t,v[2]-hz-dz*t); };
    HV.forEach(v=>{ if(U(v)<-.004) return; const blend=mfSmooth(-.004,.014,U(v)); let bestC=null,bd=1e9; for(const cn in chains){ const ch=chains[cn]; ch.segs.forEach(g=>{ const dd=segD(v,g)/ch.r; if(dd<bd){ bd=dd; bestC=cn; } }); }
      const dp=segD(v,palm)/palm.r; const L2=[[palm.n,dp]]; if(bestC) chains[bestC].segs.forEach(g=>L2.push([g.n,segD(v,g)/chains[bestC].r]));
      let mn=1e9; L2.forEach(q=>{ mn=Math.min(mn,q[1]); }); let ws=L2.map(q=>[q[0],Math.exp(-5*(q[1]-mn))]).filter(q=>q[1]>.03).sort((a,b)=>b[1]-a[1]).slice(0,3); let tt=0; ws.forEach(q=>{ tt+=q[1]; }); ws=ws.map(q=>[q[0],q[1]/tt*blend]); if(blend<1) ws.push(['foreArm.'+S1,1-blend]); W.set(key(v),ws); });
    hands[S1]={chains:chains,sg:sg};
  }catch(e){ console.warn('hand rig',e); } });
  /* ---- toes ---- */
  const toes={};
  ['L','R'].forEach(S1=>{ try{ const an=bp('foot.'+S1); const FV=V.filter(v=>v[1]<an[1]+.02&&Math.abs(v[0]-an[0])<.09&&v[2]>an[2]-.12); if(FV.length<30) return;
    let tz=-1e9; FV.forEach(v=>{ tz=Math.max(tz,v[2]); }); const ballZ=an[2]+(tz-an[2])*.62, ball=[an[0],Math.max(.025,an[1]*.35),ballZ], tip=[an[0],ball[1],tz];
    mkBone('toes.'+S1,'foot.'+S1,ball); toes[S1]={ballZ:ballZ,len:tz-ballZ};
    FV.forEach(v=>{ const w=mfSmooth(ballZ-.018,ballZ+.02,v[2]); if(w<=0) return; W.set(key(v),[['toes.'+S1,w],['foot.'+S1,1-w]].filter(q=>q[1]>0)); }); }catch(e){ console.warn('toe rig',e); } });
  /* ---- face ---- */
  let face=null;
  try{
    const hb=bp('head'); const HVv=V.filter(v=>v[1]>hb[1]-.06*H/1.75);
    let top=-1e9; HVv.forEach(v=>{ top=Math.max(top,v[1]); });
    let nose=null; HVv.forEach(v=>{ if(Math.abs(v[0])<.012&&v[1]<top-.12*H/1.75&&(!nose||v[2]>nose[2])) nose=v; });
    if(nose){
      const k=H/1.75, M=meta||{eye:[.030,.030],brow:[.036,.048],mouth:[.021,-.0185],chin:-.041,ear:-.1};
      const ny=nose[1], nz=nose[2];
      let eyeY=ny+M.eye[1]*k, browY=ny+M.brow[1]*k, mY=ny+M.mouth[1]*k, chinY=ny+M.chin*k, eX=M.eye[0]*k; const bX=M.brow[0]*k, mX=M.mouth[0]*k;
      /* painted eyes: the darkest spots (irises) in each eye window give the real eye centres */
      const tx=mfTexSampler(meshes);
      if(tx){ const found=[]; [1,-1].forEach(sx=>{ const c=HVv.filter(v=>v[0]*sx>.016*k&&v[0]*sx<.045*k&&v[1]>eyeY-.008*k&&v[1]<eyeY+.005*k&&v[2]>nz-.06*k).map(v=>{ const q=tx(v); return [v,q?(.3*q[0]+.59*q[1]+.11*q[2]):255]; }).sort((a,b)=>a[1]-b[1]);
          const n0=Math.max(3,Math.floor(c.length*.07)); if(c.length>20){ let x=0,y=0; for(let i=0;i<n0;i++){ x+=c[i][0][0]; y+=c[i][0][1]; } found.push([Math.abs(x/n0),y/n0]); } });
        if(found.length===2){ const fx=(found[0][0]+found[1][0])/2, ey=(found[0][1]+found[1][1])/2; if(Math.abs(fx-eX)<.008*k&&Math.abs(ey-eyeY)<.006*k){ eX=fx; browY+=ey-eyeY; eyeY=ey; } } }
      const surfZ=(x,y)=>{ let z=-1e9; HVv.forEach(v=>{ if(Math.abs(v[0]-x)<.006*k&&Math.abs(v[1]-y)<.006*k&&v[2]>z) z=v[2]; }); return z>-1e8?z:nz-.03*k; };
      const P={};
      P.jaw=[0,mY+.02*k,nz-.095*k]; mkBone('jaw','head',P.jaw);
      P.lipU=[0,mY+.0045*k,surfZ(0,mY+.0045*k)]; mkBone('lipU','head',P.lipU);
      P.lipL=[0,mY-.006*k,surfZ(0,mY-.006*k)]; mkBone('lipL','jaw',P.lipL);
      [['L',1],['R',-1]].forEach(([S1,sx])=>{
        P['corner.'+S1]=[sx*mX,mY,surfZ(sx*mX,mY)]; mkBone('corner.'+S1,'head',P['corner.'+S1]);
        P['cheek.'+S1]=[sx*(eX-.002*k),ny+.002*k,surfZ(sx*(eX-.002*k),ny+.002*k)]; mkBone('cheek.'+S1,'head',P['cheek.'+S1]);
        P['browIn.'+S1]=[sx*bX*.42,browY,surfZ(sx*bX*.42,browY)]; mkBone('browIn.'+S1,'head',P['browIn.'+S1]);
        P['browOut.'+S1]=[sx*bX*1.22,browY-.002*k,surfZ(sx*bX*1.22,browY-.002*k)]; mkBone('browOut.'+S1,'head',P['browOut.'+S1]);
        P['lidU.'+S1]=[sx*eX,eyeY+.004*k,surfZ(sx*eX,eyeY+.004*k)]; mkBone('lidU.'+S1,'head',P['lidU.'+S1]);
        P['lidL.'+S1]=[sx*eX,eyeY-.005*k,surfZ(sx*eX,eyeY-.005*k)]; mkBone('lidL.'+S1,'head',P['lidL.'+S1]); });
      const RAD={lipU:.012,lipL:.012,corner:.019,cheek:.022,browIn:.015,browOut:.017,lidU:.012,lidL:.0085};
      HVv.forEach(v=>{ if(v[2]<nz-.11*k) return; const x=v[0], y=v[1], z=v[2]; const L2=[];
        /* jaw: everything below the mouth line, fading toward the ears and the neck */
        const wj=mfSmooth(mY+.0015*k,mY-.007*k,y)*(1-mfSmooth(.045*k,.072*k,Math.abs(x)))*mfSmooth(nz-.1*k,nz-.07*k,z)*mfSmooth(chinY-.04*k,chinY-.012*k,y);
        if(wj>.01) L2.push(['jaw',wj]);
        for(const nm in P){ if(nm==='jaw') continue; const base=nm.split('.')[0], r=RAD[base]*k, p=P[nm]; let w=mfFall(Math.hypot(x-p[0],(y-p[1])*(base.indexOf('lid')===0?1.6:1),(z-p[2])*.7),r);
          if(base==='lidU') w*=mfSmooth(eyeY-.004*k,eyeY+.001*k,y); if(base==='lidL') w*=1-mfSmooth(eyeY-.002*k,eyeY+.002*k,y);
          if(base.indexOf('brow')===0) w*=1-mfSmooth(browY+.012*k,browY+.022*k,y);
          if(base==='lipL') w*=1-mfSmooth(mY-.002*k,mY+.0015*k,y); if(base==='lipU') w*=mfSmooth(mY-.0015*k,mY+.002*k,y);
          if(w>.02) L2.push([nm,w]); }
        if(!L2.length) return; L2.sort((a,b)=>b[1]-a[1]); const top3=L2.slice(0,3); let F=0; top3.forEach(q=>{ F+=q[1]; }); if(F>1){ top3.forEach(q=>{ q[1]/=F; }); F=1; }
        if(F<1) top3.push(['head',1-F]); W.set(key(v),top3); });
      face={P:P,k:k,eyeY:eyeY,mY:mY,lids:mfLids(node,R,meshes,HVv,surfZ,eX,eyeY,k,fromB,tx)};
    }
  }catch(e){ console.warn('face rig',e); }
  if(!extra.length) return;
  /* ---- rebuild the skeleton with the new bones and write the weights ---- */
  meshes.forEach(m=>{
    const old=m.skeleton, bones=old.bones.concat(extra), skel=new THREE.Skeleton(bones), idxOf={}; bones.forEach((b,i)=>{ idxOf[b.name]=i; });
    const si=m.geometry.attributes.skinIndex, sw=m.geometry.attributes.skinWeight, n=si.count, SI=new Uint16Array(n*4), SW=new Float32Array(n*4);
    for(let i=0;i<n;i++){ for(let j=0;j<4;j++){ SI[i*4+j]=si.getComponent?si.getComponent(i,j):si.array[i*4+j]; SW[i*4+j]=sw.getComponent?sw.getComponent(i,j):sw.array[i*4+j]; } }
    for(let i=0;i<n;i++){ const ov=W.get(m.id+':'+i); if(!ov) continue; for(let j=0;j<4;j++){ const q=ov[j]; SI[i*4+j]=q?(idxOf[q[0]]||0):0; SW[i*4+j]=q?q[1]:0; } let t=SW[i*4]+SW[i*4+1]+SW[i*4+2]+SW[i*4+3]; if(t>0) for(let j=0;j<4;j++) SW[i*4+j]/=t; }
    m.geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4)); m.geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4));
    m.bind(skel,m.matrixWorld); });
  R.mf={hands:hands,toes:toes,face:face,E:E,rot:rot,ph:(spec.name||'x').length*1.3};
}
const _mfQ=new THREE.Quaternion(), _mfQ2=new THREE.Quaternion(), _mfA=new THREE.Vector3();
function mfAxis(x,y,z,rot){ const c=Math.cos(rot), s=Math.sin(rot); return _mfA.set(x*c-z*s,y,x*s+z*c).normalize(); }
function mfUpdate(t,playing,dt){
  const vo=S.vo, vis=vo&&VB[vo.id]&&VB[vo.id].vis, caps=S.caps||[];
  let visA=null; if(vis){ const e=VB[vo.id]; if(!e.visA){ const b=atob(e.vis), a=new Uint8Array(b.length); for(let i=0;i<b.length;i++) a[i]=b.charCodeAt(i); e.visA=a; } visA=e.visA; }
  nodes.forEach(nd=>{ const R=nd.userData.rig, M=R&&R.mf; if(!M) return; const E=M.E, PZ=(nd.userData.spec&&nd.userData.spec.pose)||{}, Z=[0,0,0], rot=M.rot;
    /* hands */
    for(const S1 in M.hands){ const h=M.hands[S1], a=PZ['hand.'+S1+'.a']||Z, b=PZ['hand.'+S1+'.b']||Z, curl={thumb:a[0],index:a[1],middle:a[2],ring:b[0],pinky:b[1]}, spread=b[2], SPR={thumb:.35,index:.16,middle:.04,ring:-.07,pinky:-.18};
      for(const fn in h.chains){ const ch=h.chains[fn], dir=ch.dir, cu=Math.max(-.3,Math.min(1.2,curl[fn]||0));
        let ax; if(fn==='thumb'){ const n2=[-.0,-.6,-.8]; ax=[dir[1]*n2[2]-dir[2]*n2[1],dir[2]*n2[0]-dir[0]*n2[2],dir[0]*n2[1]-dir[1]*n2[0]]; } else ax=[dir[1]*0-dir[2]*-1, dir[2]*0-dir[0]*0, dir[0]*-1-dir[1]*0];
        const A=mfAxis(ax[0],ax[1],ax[2],rot).clone(), up=mfAxis(0,1,0,rot).clone(), AMT=fn==='thumb'?[.45,.7,.8]:[1.05,1.45,1.1];
        ch.segs.forEach((g,k)=>{ const bn=E[g.n]&&E[g.n].bone; if(!bn) return; _mfQ.setFromAxisAngle(A,cu*AMT[k]); if(k===0){ _mfQ2.setFromAxisAngle(up,-h.sg*spread*SPR[fn]); _mfQ.premultiply(_mfQ2); } bn.quaternion.copy(_mfQ); }); } }
    for(const S1 in M.toes){ const tb=E['toes.'+S1]&&E['toes.'+S1].bone, tv=(PZ['toe.'+S1]||Z)[0]; if(tb) tb.quaternion.setFromAxisAngle(mfAxis(1,0,0,rot),-tv*.6); }
    const F=M.face; if(!F) return; const k=F.k, nm=nd.userData.name, st=nd.userData.fs||(nd.userData.fs={open:0,wid:1,rnd:0});
    let tg=[0,1,0], spk=false;
    if(visA&&(playing||S.view==='cam'||S.recording)){ for(let i=0;i<caps.length;i++){ const cc=caps[i]; if(cc.who===nm&&t>=cc.t0-.06&&t<=cc.t1+.1){ const kk=Math.max(0,Math.min(visA.length-1,Math.round((t-(vo.t0||0))*30))), v=visA[kk], code=v>>5, it=(v&31)/31, VV=CR_VIS[code]||CR_VIS[0]; tg=[VV[0]*(.25+.75*it),VV[1],VV[2]]; spk=true; break; } } }
    const ex=faceExpr(nm,t), pul=ex.pulse*Math.abs(Math.sin(t*8.5+M.ph))*.5, al=Math.min(1,(dt||.033)*20);
    const fa=PZ['face.a']||Z, fb=PZ['face.b']||Z, fc=PZ['face.c']||Z, fd=PZ['face.d']||Z, fe=PZ['face.e']||Z;
    tg[2]=Math.max(tg[2],fb[2]); const sm=Math.max(-1,Math.min(1,ex.sm+fb[0])), bt=Math.max(-1,Math.min(1,ex.bt+fc[2]));
    /* only the speaker's mouth moves; listeners keep a still smile or gasp so nobody looks like they are talking */
    const open=Math.max(0,Math.min(1,Math.max(spk?tg[0]+ex.op*.35+pul*.25:Math.min(.1,ex.op*.2),fa[2])));
    st.open+=(open-st.open)*al; st.wid+=(tg[1]-st.wid)*al; st.rnd+=(tg[2]-st.rnd)*al;
    const set=(n,dx,dy,dz)=>{ const e=E[n]; if(!e) return; const b=e.bone; if(!b.userData.p0) b.userData.p0=b.position.clone(); const ax=mfAxis(1,0,0,rot), az=mfAxis(0,0,1,rot); b.position.copy(b.userData.p0); b.position.x+=(ax.x*dx+az.x*dz)*k; b.position.y+=dy*k; b.position.z+=(ax.z*dx+az.z*dz)*k; };
    if(E.jaw) E.jaw.bone.rotation.set(st.open*.38,0,0);
    const rd=st.rnd, wd=fb[1]+(st.wid-1)*.8, smp=Math.max(0,sm);
    ['L','R'].forEach((S1,i)=>{ const sx=i?-1:1;
      set('corner.'+S1,sx*(sm*.0035+wd*.004-rd*.0065),sm*.005-st.open*.0035,smp*.002-rd*.002+sm*-.0005);
      set('cheek.'+S1,sx*smp*.0012,smp*.0042+fd[2]*.0015,smp*.0018);
      const bu=ex.br*.006+(i?ex.ba*.005:0)+(i?fc[1]:fc[0])*.007+pul*.002;
      set('browIn.'+S1,sx*(bt<0?bt*-.0025:0)*-1,bu+bt*.005,0); set('browOut.'+S1,0,bu-Math.max(0,bt)*.0015+Math.min(0,bt)*.001,0);
      const tt=t+M.ph, bl=((tt/3.8)%1)<.05?Math.sin(((tt/3.8)%1)/.05*Math.PI):0, lc=Math.max(0,Math.min(1,Math.max(bl,ex.lid+pul*.15,i?fa[1]:fa[0],fd[2]*.55)));
      set('lidU.'+S1,0,-lc*.003+Math.max(0,bu)*.25,0); set('lidL.'+S1,0,lc*.0016+fd[2]*.0018+smp*.0012,0);
      const ld=F.lids&&F.lids[i]; if(ld){ ld.visible=lc>.03; ld.scale.y=Math.max(.001,lc); const cv1=lc<.45; if(ld.userData.cl) ld.userData.cl.visible=cv1; if(ld.userData.cl2) ld.userData.cl2.visible=cv1; } });
    const puck=Math.max(0,Math.min(1,fe[0]||0)), upper=Math.max(-1,Math.min(1,fe[1]||0)), lower=Math.max(-1,Math.min(1,fe[2]||0));
    set('lipU',0,smp*.0008+rd*.0006-Math.max(0,-sm)*.0006+upper*.0022,rd*.0045+puck*.0015);
    set('lipL',0,-rd*.0008+lower*.0022,rd*.004+puck*.0013);
    /* eyes: real eyeballs look at the speaker (or the one who spoke last when this character is talking) */
    const EY=F.lids&&F.lids.eyes; if(EY&&R.bones&&R.bones.head){ let tgtN=null, last=null;
      for(let i=0;i<caps.length;i++){ const cc=caps[i]; if(cc.t0-.06>t) break; if(cc.who!==nm) last=cc.who; if(t>=cc.t0-.06&&t<=cc.t1+.15&&cc.who!==nm){ tgtN=cc.who; } }
      if(!tgtN) tgtN=last; let tw=null; if(tgtN) nodes.forEach(n2=>{ if(n2.userData.name===tgtN&&n2.userData.rig&&n2.userData.rig.bones&&n2.userData.rig.bones.head){ tw=new THREE.Vector3(); n2.userData.rig.bones.head.getWorldPosition(tw); } });
      const hd=R.bones.head; hd.updateMatrixWorld(true); const tl=tw?hd.worldToLocal(tw.clone()):null, sac=Math.sin(t*2.7+M.ph)*.025, sac2=Math.cos(t*3.3+M.ph*2)*.018;
      EY.forEach(e=>{ let tx2=0,ty2=0; if(tl){ const dG=tl.clone().sub(e.cen).normalize().applyQuaternion(e.Q0.clone().invert()); const dz=Math.max(.35,dG.z); tx2=Math.max(-.6,Math.min(.6,dG.x/dz)); ty2=Math.max(-.4,Math.min(.4,dG.y/dz)); }
        tx2+=sac*1.6; ty2+=sac2*1.2; e.ox+=(tx2-e.ox)*Math.min(1,al*.9); e.oy+=(ty2-e.oy)*Math.min(1,al*.9);
        const px=e.ox*.0058*k, py=e.oy*.0032*k, RB=e.RB, r2=Math.min(RB*RB*.8,px*px+py*py+.0000001); e.iris.position.set(px,py,.3*Math.sqrt(Math.max(1e-10,RB*RB-r2-(.0070*k)*(.0070*k)*.35))+.0004*k); }); }
  });
}

/* eyelids that slide over painted eyes: skin colour taken from the model's own texture */
function mfTexSampler(meshes){
  try{ const m=meshes[0], mp=m.material&&m.material.map, img=mp&&mp.image, uv=m.geometry.attributes.uv; if(!img||!uv) return null;
    const W0=img.width||img.naturalWidth, H0=img.height||img.naturalHeight, cv=document.createElement('canvas'); cv.width=W0; cv.height=H0; const g=cv.getContext('2d'); g.drawImage(img,0,0); const D=g.getImageData(0,0,W0,H0).data;
    return v=>{ if(v[3]!==m) return null; const u=uv.getX(v[4]), vv=uv.getY(v[4]), px=Math.max(0,Math.min(W0-1,Math.round(u*(W0-1)))), py=Math.max(0,Math.min(H0-1,Math.round((mp.flipY?1-vv:vv)*(H0-1)))), o=(py*W0+px)*4; return [D[o],D[o+1],D[o+2]]; }; }catch(e){ return null; }
}
/* eyelids that slide over painted eyes: skin colour taken from the model's own cheek */
function mfLids(node,R,meshes,HVv,surfZ,eX,eyeY,k,fromB,tx){
  let col='#c99a7c'; if(tx){ const c=HVv.filter(v=>Math.abs(Math.abs(v[0])-eX)<.012*k&&v[1]<eyeY-.016*k&&v[1]>eyeY-.03*k).map(tx).filter(q=>q&&q[0]>q[2]+15).sort((a,b)=>(b[0]+b[1])-(a[0]+a[1]));
    if(c.length){ const q=c[Math.floor(c.length*.3)]; col='rgb('+q[0]+','+q[1]+','+q[2]+')'; } }
  const cv=document.createElement('canvas'); cv.width=128; cv.height=64; const g=cv.getContext('2d');
  const gr=g.createRadialGradient(64,20,6,64,26,62); gr.addColorStop(0,col); gr.addColorStop(.72,col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.beginPath(); g.ellipse(64,26,62,30,0,0,Math.PI*2); g.fill();
  g.strokeStyle='rgba(35,22,16,.9)'; g.lineWidth=4; g.beginPath(); g.ellipse(64,8,54,46,0,Math.PI*.18,Math.PI*.82); g.stroke();
  const tex=new THREE.CanvasTexture(cv); tex.encoding=THREE.sRGBEncoding;
  const mat=new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:.75,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
  const cc=document.createElement('canvas'); cc.width=cc.height=64; const cg=cc.getContext('2d'); const rg=cg.createRadialGradient(32,32,2,32,32,30); rg.addColorStop(0,'rgba(255,255,255,1)'); rg.addColorStop(.55,'rgba(255,255,255,.95)'); rg.addColorStop(1,'rgba(255,255,255,0)'); cg.fillStyle=rg; cg.fillRect(0,0,64,64);
  const clMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cc),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6,toneMapped:false});
  const ic=document.createElement('canvas'); ic.width=ic.height=128; const ig=ic.getContext('2d');
  ig.fillStyle='#20130d'; ig.beginPath(); ig.arc(64,64,64,0,Math.PI*2); ig.fill();
  const irg=ig.createRadialGradient(64,64,15,64,64,57); irg.addColorStop(0,'#4b2a17'); irg.addColorStop(.42,'#80502a'); irg.addColorStop(.78,'#69401f'); irg.addColorStop(1,'#24160f');
  ig.fillStyle=irg; ig.beginPath(); ig.arc(64,64,59,0,Math.PI*2); ig.fill();
  /* Fine radial iris fibres, kept low contrast so the eye remains natural. */
  for(let a=0;a<360;a+=3){
    const ang=a*Math.PI/180, inner=27+(a%5)*1.1, outer=54+(a%7)*.45;
    ig.strokeStyle=(a%2)?'rgba(214,158,91,.20)':'rgba(28,16,10,.24)'; ig.lineWidth=(a%4===0)?1.35:.75;
    ig.beginPath(); ig.moveTo(64+Math.cos(ang)*inner,64+Math.sin(ang)*inner);
    ig.lineTo(64+Math.cos(ang)*outer,64+Math.sin(ang)*outer); ig.stroke();
  }
  ig.strokeStyle='rgba(19,11,7,.9)'; ig.lineWidth=4; ig.beginPath(); ig.arc(64,64,57,0,Math.PI*2); ig.stroke();
  ig.fillStyle='#090605'; ig.beginPath(); ig.arc(64,64,22,0,Math.PI*2); ig.fill();
  const irisMat=new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(ic),roughness:.25,metalness:0,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}); irisMat.map.encoding=THREE.sRGBEncoding;
  const eyeMat=new THREE.MeshStandardMaterial({color:0xf2eee8,roughness:.22,metalness:0});
  const head=R.bones.head, out=[];
  [1,-1].forEach(sx=>{ const x=sx*eX, top=eyeY+.006*k, z=surfZ(x,eyeY)+.0022*k, q=fromB(x,z), w=new THREE.Vector3(q[0],top,q[1]).applyMatrix4(node.matrixWorld); head.updateMatrixWorld(true); head.worldToLocal(w);
    const wS=new THREE.Vector3(q[0],eyeY,fromB(x,surfZ(x,eyeY))[1]); /* placeholder, replaced below */
    const dyE=(node.userData.spec&&node.userData.spec.embed===0)?.0048*k:0, q0=fromB(x,surfZ(x,eyeY)), q1=fromB(x,surfZ(x,eyeY)-.0155*k+.0085*k*0); 
    const pF=new THREE.Vector3(q0[0],eyeY-dyE,q0[1]).applyMatrix4(node.matrixWorld), pB=new THREE.Vector3(q0[0],eyeY-dyE,fromB(x,surfZ(x,eyeY)-.016*k)[1]).applyMatrix4(node.matrixWorld);
    head.worldToLocal(pF); head.worldToLocal(pB); const dirF=pF.clone().sub(pB).normalize(), RB=.0136*k, cen=pF.clone().addScaledVector(dirF,-.0020*k);
    const eg=new THREE.Group(); eg.position.copy(cen); eg.userData.rigOwned=true; const Q0=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),dirF); eg.quaternion.copy(Q0); head.add(eg);
    const ball=new THREE.Mesh(new THREE.SphereGeometry(RB,24,16),eyeMat); ball.scale.set(1,.74,.3); ball.userData.rigOwned=true; eg.add(ball);
    const IR=.0070*k, iris=new THREE.Mesh(new THREE.CircleGeometry(IR,40),irisMat); iris.position.z=.3*Math.sqrt(RB*RB-IR*IR)+.0004*k; iris.userData.rigOwned=true; eg.add(iris);
    const limbal=new THREE.Mesh(new THREE.TorusGeometry(IR*.96,.00032*k,6,40),new THREE.MeshBasicMaterial({color:0x21150e})); limbal.position.z=iris.position.z+.000025*k; limbal.userData.rigOwned=true; eg.add(limbal);
    const glintMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false,toneMapped:false});
    const glint=new THREE.Mesh(new THREE.CircleGeometry(.00125*k,16),glintMat); glint.position.set(-.0020*k,.0022*k,iris.position.z+.00008*k); glint.userData.rigOwned=true; eg.add(glint);
    const glint2=new THREE.Mesh(new THREE.CircleGeometry(.00048*k,12),glintMat); glint2.position.set(.0020*k,-.0018*k,iris.position.z+.00008*k); glint2.userData.rigOwned=true; eg.add(glint2);
    out.eyes=out.eyes||[]; out.eyes.push({g:eg,Q0:Q0,dirF:dirF,cen:cen,sx:sx,iris:iris,RB:RB,ox:0,oy:0});
    const piv=new THREE.Group(); piv.position.copy(w).addScaledVector(dirF,.0046*k); piv.userData.rigOwned=true; head.add(piv);
    const lid=new THREE.Mesh(new THREE.PlaneGeometry(.028*k,.016*k).translate(0,-.008*k,0),mat); lid.userData.rigOwned=true; lid.renderOrder=5; lid.scale.y=.001; lid.visible=false; piv.add(lid); out.push(lid);
    const cl=new THREE.Mesh(new THREE.PlaneGeometry(.0105*k,.0105*k),clMat); cl.position.set(-sx*.0022*k,-.0072*k,.0012*k); cl.userData.rigOwned=true; cl.renderOrder=6; piv.add(cl); lid.userData.cl=cl;
    const c2=new THREE.Mesh(new THREE.PlaneGeometry(.0052*k,.0052*k),clMat); c2.position.set(sx*.0024*k,-.0112*k,.0012*k); c2.userData.rigOwned=true; c2.renderOrder=6; piv.add(c2); lid.userData.cl2=c2; });
  return out;
}
