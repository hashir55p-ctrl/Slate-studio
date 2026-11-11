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
/* keyframes: spec.chk = [{t,wind,dir,stiff,damp,grav}] on the character; between keys the values blend linearly */
function chSettings(n){ const K=n.userData.spec&&n.userData.spec.chk; if(!K||!K.length||CH.follow===false) return CH; const t=S.t, a=K.slice().sort((x,y)=>x.t-y.t);
  const mix=(u,v,f)=>u+(v-u)*f; let k0=a[0], k1=a[a.length-1], f=0; if(t<=a[0].t){ k1=a[0]; } else if(t>=a[a.length-1].t){ k0=a[a.length-1]; } else { for(let i=0;i<a.length-1;i++){ if(t>=a[i].t&&t<=a[i+1].t){ k0=a[i]; k1=a[i+1]; f=(t-k0.t)/Math.max(1e-6,k1.t-k0.t); break; } } }
  let dd=((k1.dir-k0.dir+540)%360)-180; return {on:CH.on,wind:mix(k0.wind,k1.wind,f),dir:k0.dir+dd*f,stiff:mix(k0.stiff,k1.stiff,f),damp:mix(k0.damp,k1.damp,f),grav:mix(k0.grav,k1.grav,f),gust:CH.gust}; }
function chKeyHere(){ const n=rigNode(); if(!n||!n.userData.chains||!n.userData.chains.length){ toast('Select a rigged character that has hair or cloth chains.'); return; }
  const sp=n.userData.spec, K=sp.chk||(sp.chk=[]), t=+S.t.toFixed(2), e={t:t,wind:CH.wind,dir:CH.dir,stiff:CH.stiff,damp:CH.damp,grav:CH.grav}; const i=K.findIndex(q=>Math.abs(q.t-t)<.05); if(i>=0) K[i]=e; else K.push(e);
  K.sort((x,y)=>x.t-y.t); queueSave(); toast('Hair and cloth keyed at '+t.toFixed(2)+' s ('+K.length+' key'+(K.length>1?'s':'')+').'); }
function chClearKeys(){ const n=rigNode(); if(!n) return; delete n.userData.spec.chk; queueSave(); toast('Hair and cloth keys cleared.'); }
function chColliders(n){ const R=n.userData.rig; if(!R||!R.bones) return []; const B=R.bones, H=(R.H||1.75)*n.getWorldScale(new THREE.Vector3()).y, out=[];
  const wp=nm=>B[nm]?B[nm].getWorldPosition(new THREE.Vector3()):null;
  const seg=(a,b,r,tag)=>{ const A=wp(a), Bq=wp(b); if(A&&Bq) out.push({A:A,B:Bq,r:r*H,tag:tag}); };
  seg('hips','spine',.058,'torso'); seg('spine','chest',.056,'torso'); seg('chest','neck',.054,'torso'); seg('neck','head',.032,'neck');
  if(B.head){ const hp=B.head.getWorldPosition(new THREE.Vector3()), hq=B.head.getWorldQuaternion(new THREE.Quaternion()), up=new THREE.Vector3(0,1,0).applyQuaternion(hq).multiplyScalar(.055*H), c=hp.add(up); out.push({A:c,B:c.clone(),r:.058*H,tag:'head'}); }
  ['L','R'].forEach(sd=>{ seg('upperArm.'+sd,'foreArm.'+sd,.03,'arm'); seg('foreArm.'+sd,'hand.'+sd,.026,'arm'); seg('upperLeg.'+sd,'lowerLeg.'+sd,.048,'leg'); seg('lowerLeg.'+sd,'foot.'+sd,.036,'leg'); });
  return out; }
const _chC=new THREE.Vector3(), _chD=new THREE.Vector3();
function chCollide(P,N,cols,skip){ for(let k=2;k<=N;k++) for(let c=0;c<cols.length;c++){ const o=cols[c]; if(skip.indexOf(o.tag)>=0) continue;
    _chD.subVectors(o.B,o.A); const l2=_chD.lengthSq(); let u=l2>1e-9?_chC.subVectors(P[k],o.A).dot(_chD)/l2:0; u=u<0?0:u>1?1:u; _chC.copy(o.A).addScaledVector(_chD,u);
    _chD.subVectors(P[k],_chC); const d=_chD.length(); if(d<o.r){ if(d<1e-6) _chD.set(0,0,-1); else _chD.multiplyScalar(1/d); P[k].copy(_chC).addScaledVector(_chD,o.r); } } }
const _chV=new THREE.Vector3(), _chQ=new THREE.Quaternion(), _chQi=new THREE.Quaternion();
function chStep(dt){
  if(!CH.on) return; dt=Math.max(1/120,Math.min(1/20,dt||1/60)); const f=dt*60, tm=performance.now()/1000;
  nodes.forEach(n=>{ const C=n.userData.chains; if(!C||!C.length) return; const SET=chSettings(n), COL=CH.collide===false?[]:chColliders(n);
    C.forEach(c=>{ const par=c.parent; par.updateWorldMatrix(true,false); const N=c.N, T=c.restLocal.map(p=>par.localToWorld(p.clone()));
      if(!c.P||c.P[0].distanceTo(T[0])>.6){ c.P=T.map(p=>p.clone()); c.Pp=T.map(p=>p.clone()); }
      const P=c.P, Pp=c.Pp, damp=Math.pow(SET.damp,f), st=1-Math.pow(1-SET.stiff,f), wd=SET.dir*Math.PI/180;
      P[0].copy(T[0]); Pp[0].copy(T[0]);
      for(let k=1;k<=N;k++){ const gust=1+CH.gust*(Math.sin(tm*1.7+k*.6)+Math.sin(tm*2.9+k))*.5, ax=Math.sin(wd)*SET.wind*3.5*gust, az=Math.cos(wd)*SET.wind*3.5*gust, ay=-9.8*SET.grav;
        const vx=(P[k].x-Pp[k].x)*damp, vy=(P[k].y-Pp[k].y)*damp, vz=(P[k].z-Pp[k].z)*damp; Pp[k].copy(P[k]);
        P[k].x+=vx+ax*dt*dt; P[k].y+=vy+ay*dt*dt; P[k].z+=vz+az*dt*dt;
        P[k].x+=(T[k].x-P[k].x)*st; P[k].y+=(T[k].y-P[k].y)*st; P[k].z+=(T[k].z-P[k].z)*st; }
      for(let it=0;it<3;it++) for(let k=1;k<=N;k++){ _chV.subVectors(P[k],P[k-1]); const l=_chV.length()||1e-6; P[k].copy(P[k-1]).addScaledVector(_chV,c.L[k]/l); }
      if(COL.length){ const skip=par===n.userData.rig.bones.head?['head','neck']:par===n.userData.rig.bones.hips?[]:[]; chCollide(P,N,COL,skip); for(let k=1;k<=N;k++){ _chV.subVectors(P[k],P[k-1]); const l=_chV.length()||1e-6; P[k].copy(P[k-1]).addScaledVector(_chV,c.L[k]/l); } }
      par.getWorldQuaternion(_chQ);
      for(let i=0;i<N;i++){ _chV.subVectors(P[i+1],P[i]).normalize(); _chQi.copy(_chQ).invert(); _chV.applyQuaternion(_chQi); const q=new THREE.Quaternion().setFromUnitVectors(c.r[i],_chV); c.bones[i].quaternion.copy(q); _chQ.multiply(q); }
    }); });
}
window.chStep=chStep; window.chKeyHere=chKeyHere; window.chColliders=chColliders; window.chCollide=chCollide; window.chSettings=chSettings; window.chBuildAll=chBuildAll; window.CH=CH;
/* Rig tab controls */
(function(){ const _b=buildRigPane; buildRigPane=function(){ _b(); try{
  const host=document.getElementById('pRig'); if(!host) return;
  const st=document.createElement('p'); st.className='note'; st.style.color='var(--fg)'; st.textContent='Parts named hair_*, ponytail, braid, cape, cloak, scarf, skirt, robe or tail get a bone chain when the model is rigged.';
  const sl=(label,min,max,step,key,fmt)=>rangeField(label,min,max,step,()=>CH[key],v=>{ CH[key]=v; },fmt||(v=>(+v).toFixed(2)));
  const tg=scBtn(CH.on?'Hair and cloth physics: on':'Hair and cloth physics: off',()=>{ CH.on=!CH.on; tg.textContent=CH.on?'Hair and cloth physics: on':'Hair and cloth physics: off'; },'hi');
  host.append(panel('Hair and cloth',[st,tg,sl('Spring (stiffness)',.02,.6,.01,'stiff'),sl('Swing (less = floppier)',.8,.99,.01,'damp'),sl('Wind strength',0,14,.1,'wind',v=>(+v).toFixed(1)),sl('Wind direction',-180,180,1,'dir',v=>Math.round(v)+'°'),sl('Gravity',0,1.5,.05,'grav')]));
  const ck=scBtn('Collide with body: '+(CH.collide===false?'off':'on'),()=>{ CH.collide=CH.collide===false; ck.textContent='Collide with body: '+(CH.collide===false?'off':'on'); });
  const kb=scBtn('Key hair and cloth at playhead',chKeyHere,'hi'), kc=scBtn('Clear hair and cloth keys',chClearKeys), kf=scBtn('Follow keys: on',()=>{ CH.follow=CH.follow===false; kf.textContent='Follow keys: '+(CH.follow===false?'off':'on'); });
  host.lastChild.append(ck,kb,kf,kc);
  const note=document.createElement('p'); note.className='note'; host.lastChild.appendChild(note);
  setInterval(()=>{ try{ const n=rigNode(); const c=n&&n.userData.chains; const kk=n&&n.userData.spec&&n.userData.spec.chk; note.textContent=(c&&c.length?('Chains found: '+c.map(x=>x.name).join(', ')):'No hair or cloth chains on this model.')+(kk&&kk.length?' Keys at: '+kk.map(q=>q.t.toFixed(1)+'s').join(', ')+'.':' No keys yet.'); }catch(e){} },800);
 }catch(e){ console.warn('chain ui',e); } }; })();
