/* ================= Hair and cloth chains with spring and wind (Build 146) =================
   After a model is rigged, parts named hair_*, ponytail, braid, ribbon (head), cape, cloak, scarf (chest)
   and skirt, robe, tail, sash (hips) get a short chain of extra bones. The chain follows its parent bone
   with a spring and a wind force, so hair and cloth lag, swing and settle. Names containing cap, scalp,
   base or stiff stay rigid on the body. */
const CH={on:true,stiff:.16,damp:.94,wind:0,dir:0,grav:.6,gust:.5};
const CH_RE=/^(hair_|hair$|cape|cloak|skirt|scarf|ponytail|tail|ribbon|braid|robe|sash)/i, CH_SKIP=/(^|_)(cap|scalp|base|stiff)(_|$)/i;
function chParent(nm,B){ nm=nm.toLowerCase(); if(/skirt|robe|tail|sash/.test(nm)) return B.hips; if(/cape|cloak|scarf/.test(nm)) return B.chest; return B.head; }
function chBuild(node){
  const R=node.userData.rig; if(!R||!R.bones||!R.bones.head) return 0;
  const parts=[]; node.traverse(o=>{ if(o.isSkinnedMesh&&o.userData.rigOwned&&o.userData.part&&!o.userData.chain&&!o.userData.jbCloth&&CH_RE.test(o.userData.part)&&!CH_SKIP.test(o.userData.part)) parts.push(o); });
  node.userData.chains=node.userData.chains||[];
  node.updateMatrixWorld(true);
  parts.forEach(sm=>{ try{
    const g=sm.geometry, P=g.attributes.position, n=P.count; let mn=1e9,mx=-1e9; for(let i=0;i<n;i++){ const y=P.getY(i); if(y<mn)mn=y; if(y>mx)mx=y; }
    const h=mx-mn; if(h<.03) return; const N=Math.max(3,Math.min(8,Math.round(h/.07))), parent=chParent(sm.userData.part,R.bones);
    const pts=[]; let last=[0,0,0]; for(let s=0;s<=N;s++){ const y=mx-h*s/N, w=h/N*.7; let sx=0,sz=0,c=0; for(let i=0;i<n;i++){ if(Math.abs(P.getY(i)-y)<=w){ sx+=P.getX(i); sz+=P.getZ(i); c++; } } if(c){ last=[sx/c,y,sz/c]; } else last=[last[0],y,last[2]]; pts.push(last.slice()); }
    const W=node.matrixWorld, wp=pts.map(p=>new THREE.Vector3(p[0],p[1],p[2]).applyMatrix4(W));
    const bones=[]; let prev=parent;
    for(let i=0;i<N;i++){ const b=new THREE.Bone(); b.name='chain_'+sm.userData.part+'_'+i; b.position.copy(prev.worldToLocal(wp[i].clone())); prev.add(b); prev.updateMatrixWorld(true); bones.push(b); prev=b; }
    const tipLocal=bones[N-1].worldToLocal(wp[N].clone());
    const r=[]; for(let i=0;i<N-1;i++) r.push(bones[i+1].position.clone().normalize()); r.push(tipLocal.clone().normalize());
    const restLocal=wp.map(p=>parent.worldToLocal(p.clone())), L=[0]; for(let k=1;k<=N;k++) L.push(wp[k].distanceTo(wp[k-1]));
    const skel=new THREE.Skeleton([parent].concat(bones));
    const si=new Uint16Array(n*4), sw=new Float32Array(n*4);
    for(let v=0;v<n;v++){ const u=Math.max(0,Math.min(N,(mx-P.getY(v))/h*N)), wpar=Math.max(0,1-u*1.2); const hat=[]; let tot=0;
      for(let j=0;j<N;j++){ const q=j===N-1&&u>N-1?1:Math.max(0,1-Math.abs(u-j)); hat.push(q); tot+=q; }
      const ws=[[0,wpar]]; for(let j=0;j<N;j++) if(hat[j]>0) ws.push([j+1,(1-wpar)*hat[j]/(tot||1)]);
      ws.sort((a,b)=>b[1]-a[1]); const top=ws.slice(0,4), t2=top.reduce((a,e)=>a+e[1],0)||1;
      for(let k=0;k<4;k++){ si[v*4+k]=top[k]?top[k][0]:0; sw[v*4+k]=top[k]?top[k][1]/t2:0; } }
    g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4)); g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
    sm.bind(skel,sm.matrixWorld); sm.userData.chain=1;
    node.userData.chains.push({name:sm.userData.part,parent:parent,bones:bones,r:r,restLocal:restLocal,L:L,P:null,Pp:null,N:N});
  }catch(e){ console.warn('chain build',e); } });
  return node.userData.chains.length;
}
function chBuildAll(){ nodes.forEach(n=>{ if(n.userData.rig&&!n.userData.chBuilt){ let sk=0; n.traverse(o=>{ if(o.isSkinnedMesh) sk++; }); if(sk){ n.userData.chBuilt=1; try{ chBuild(n); }catch(e){ console.warn('chBuild',e); } } } }); }
const _chV=new THREE.Vector3(), _chQ=new THREE.Quaternion(), _chQi=new THREE.Quaternion();
function chStep(dt){
  if(!CH.on) return; dt=Math.max(1/120,Math.min(1/20,dt||1/60)); const f=dt*60, tm=performance.now()/1000;
  nodes.forEach(n=>{ const C=n.userData.chains; if(!C||!C.length) return;
    C.forEach(c=>{ const par=c.parent; par.updateWorldMatrix(true,false); const N=c.N, T=c.restLocal.map(p=>par.localToWorld(p.clone()));
      if(!c.P||c.P[0].distanceTo(T[0])>.6){ c.P=T.map(p=>p.clone()); c.Pp=T.map(p=>p.clone()); }
      const P=c.P, Pp=c.Pp, damp=Math.pow(CH.damp,f), st=1-Math.pow(1-CH.stiff,f), wd=CH.dir*Math.PI/180;
      P[0].copy(T[0]); Pp[0].copy(T[0]);
      for(let k=1;k<=N;k++){ const gust=1+CH.gust*(Math.sin(tm*1.7+k*.6)+Math.sin(tm*2.9+k))*.5, ax=Math.sin(wd)*CH.wind*3.5*gust, az=Math.cos(wd)*CH.wind*3.5*gust, ay=-9.8*CH.grav;
        const vx=(P[k].x-Pp[k].x)*damp, vy=(P[k].y-Pp[k].y)*damp, vz=(P[k].z-Pp[k].z)*damp; Pp[k].copy(P[k]);
        P[k].x+=vx+ax*dt*dt; P[k].y+=vy+ay*dt*dt; P[k].z+=vz+az*dt*dt;
        P[k].x+=(T[k].x-P[k].x)*st; P[k].y+=(T[k].y-P[k].y)*st; P[k].z+=(T[k].z-P[k].z)*st; }
      for(let it=0;it<3;it++) for(let k=1;k<=N;k++){ _chV.subVectors(P[k],P[k-1]); const l=_chV.length()||1e-6; P[k].copy(P[k-1]).addScaledVector(_chV,c.L[k]/l); }
      par.getWorldQuaternion(_chQ);
      for(let i=0;i<N;i++){ _chV.subVectors(P[i+1],P[i]).normalize(); _chQi.copy(_chQ).invert(); _chV.applyQuaternion(_chQi); const q=new THREE.Quaternion().setFromUnitVectors(c.r[i],_chV); c.bones[i].quaternion.copy(q); _chQ.multiply(q); }
    }); });
}
window.chStep=chStep; window.chBuildAll=chBuildAll; window.CH=CH;
/* Rig tab controls */
(function(){ const _b=buildRigPane; buildRigPane=function(){ _b(); try{
  const host=document.getElementById('pRig'); if(!host) return;
  const st=document.createElement('p'); st.className='note'; st.style.color='var(--fg)'; st.textContent='Parts named hair_*, ponytail, braid, cape, cloak, scarf, skirt, robe or tail get a bone chain when the model is rigged.';
  const sl=(label,min,max,step,key,fmt)=>rangeField(label,min,max,step,()=>CH[key],v=>{ CH[key]=v; },fmt||(v=>(+v).toFixed(2)));
  const tg=scBtn(CH.on?'Hair and cloth physics: on':'Hair and cloth physics: off',()=>{ CH.on=!CH.on; tg.textContent=CH.on?'Hair and cloth physics: on':'Hair and cloth physics: off'; },'hi');
  host.append(panel('Hair and cloth',[st,tg,sl('Spring (stiffness)',.02,.6,.01,'stiff'),sl('Swing (less = floppier)',.8,.99,.01,'damp'),sl('Wind strength',0,14,.1,'wind',v=>(+v).toFixed(1)),sl('Wind direction',-180,180,1,'dir',v=>Math.round(v)+'°'),sl('Gravity',0,1.5,.05,'grav')]));
  const note=document.createElement('p'); note.className='note'; host.lastChild.appendChild(note);
  setInterval(()=>{ try{ const n=rigNode(); const c=n&&n.userData.chains; note.textContent=c&&c.length?('Chains found: '+c.map(x=>x.name).join(', ')):'No hair or cloth chains on this model.'; }catch(e){} },800);
 }catch(e){ console.warn('chain ui',e); } }; })();
