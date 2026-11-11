/* ================= Photo match: front/side photo slots + snap the clay outline to the photo outline ================= */
const SP={front:null,side:null,cur:null,str:.85,busy:false};
function spSlotSet(kind){
  if(!scGuide.blob){ toast('Set a reference photo first (paste, pick or drag one in).'); return; }
  SP[kind]={blob:scGuide.blob}; SP.cur=kind; toast((kind==='front'?'Front':'Side')+' photo saved. Front view and Side view will now show the matching photo.');
}
(function(){ const _a=scAlign; scAlign=function(kind){ _a(kind); if((kind==='front'||kind==='side')&&SP[kind]&&SP.cur!==kind){ SP.cur=kind; scGuideSet(SP[kind].blob); } }; })();
/* outline of the subject: rows of [left,right] in photo coordinates 0..1 */
function spMask(){
  const im=scGuide.img; if(!im||!im.naturalWidth||!scGuide.url) return null;
  const H=240, W=Math.max(16,Math.round(H*im.naturalWidth/im.naturalHeight)), cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  const cx=cv.getContext('2d',{willReadFrequently:true}); cx.drawImage(im,0,0,W,H); let d; try{ d=cx.getImageData(0,0,W,H).data; }catch(e){ return null; }
  const bd=[[],[],[]], put=(x,y)=>{ const i=(y*W+x)*4; bd[0].push(d[i]); bd[1].push(d[i+1]); bd[2].push(d[i+2]); };
  for(let x=0;x<W;x++){ for(let y=0;y<3;y++) put(x,y); } for(let y=3;y<H;y++){ for(let x=0;x<3;x++){ put(x,y); put(W-1-x,y); } }
  const med=a=>{ a.sort((p,q)=>p-q); return a[a.length>>1]; }, B=[med(bd[0]),med(bd[1]),med(bd[2])];
  const dist=new Float32Array(W*H), hist=new Float64Array(256);
  for(let i=0;i<W*H;i++){ const dr=d[i*4]-B[0], dg=d[i*4+1]-B[1], db=d[i*4+2]-B[2]; const v=Math.sqrt(dr*dr+dg*dg+db*db); dist[i]=v; hist[Math.min(255,Math.round(v/442*255))]++; }
  let tot=W*H, sum=0; for(let i=0;i<256;i++) sum+=i*hist[i]; let wB=0,sB=0,best=0,thr=40;
  for(let i=0;i<256;i++){ wB+=hist[i]; if(!wB) continue; const wF=tot-wB; if(!wF) break; sB+=i*hist[i]; const mB=sB/wB, mF=(sum-sB)/wF, v=wB*wF*(mB-mF)*(mB-mF); if(v>best){ best=v; thr=i; } }
  thr=Math.max(14,thr/255*442*.85);
  const xl=new Float32Array(H).fill(NaN), xr=new Float32Array(H).fill(NaN);
  for(let y=0;y<H;y++){ let L=-1,R=-1; for(let x=0;x<W-2;x++){ const i=y*W+x; if(dist[i]>thr&&dist[i+1]>thr&&dist[i+2]>thr){ if(L<0) L=x; R=x+2; } } if(L>=0&&R-L>=W*.04){ xl[y]=L/W; xr[y]=(R+1)/W; } }
  /* median over 5 rows, drop short blips */
  const ml=new Float32Array(H).fill(NaN), mr=new Float32Array(H).fill(NaN);
  for(let y=2;y<H-2;y++){ const a=[],b=[]; for(let k=-2;k<=2;k++){ if(!isNaN(xl[y+k])){ a.push(xl[y+k]); b.push(xr[y+k]); } } if(a.length>=3){ a.sort((p,q)=>p-q); b.sort((p,q)=>p-q); ml[y]=a[a.length>>1]; mr[y]=b[b.length>>1]; } }
  return {H:H,xl:ml,xr:mr,iw:im.naturalWidth,ih:im.naturalHeight};
}
/* photo (u,v) in 0..1 -> client px, matching the CSS of the floating reference image */
function spPhotoToClient(m){
  const st=scGuide.img.parentElement.getBoundingClientRect(), Wd=st.width, Hd=st.height, s=Math.min(Wd/m.iw,Hd/m.ih), rw=m.iw*s, rh=m.ih*s, rx=(Wd-rw)/2, ry=(Hd-rh)/2, k=scGuide.k;
  return {st:st,pt:(u,v)=>{ const px=rx+u*rw, py=ry+v*rh; return [st.left+Wd/2+k*(px-Wd/2)+scGuide.x/100*Wd, st.top+Hd/2+k*(py-Hd/2)+scGuide.y/100*Hd]; }};
}
function spMatch(){
  if(SP.busy) return; const n=sculptTarget(); if(!n){ toast('Select a sculpt object first.'); return; }
  if(!scGuide.url){ toast('Set a front or side photo first. Then tap Front view or Side view.'); return; }
  if(S.view!=='free'){ toast('Switch to the free view first.'); return; }
  const m=spMask(); if(!m){ toast('Could not read the outline of this photo. Try a photo with a plain background.'); return; }
  scEnd(); const sc=n.userData.sc, mesh=sc.mesh; n.updateMatrixWorld(true); mesh.updateMatrixWorld(true); edit.updateMatrixWorld(true);
  const rc=renderer.domElement.getBoundingClientRect(), M=spPhotoToClient(m), mw=mesh.matrixWorld, inv=mw.clone().invert();
  /* photo outline per client row */
  const BN=90, y0=rc.top, bh=rc.height/BN, pL=new Array(BN).fill(null), pR=new Array(BN).fill(null);
  const row0=M.pt(0,0)[1], row1=M.pt(0,1)[1];
  for(let b=0;b<BN;b++){ const cy=y0+(b+.5)*bh, v=(cy-row0)/(row1-row0); if(v<0||v>1) continue; const r=Math.min(m.H-1,Math.max(0,Math.round(v*(m.H-1)))); if(isNaN(m.xl[r])) continue; pL[b]=M.pt(m.xl[r],v)[0]; pR[b]=M.pt(m.xr[r],v)[0]; }
  /* clay outline per client row */
  const mL=new Array(BN).fill(1e9), mR=new Array(BN).fill(-1e9), V=new THREE.Vector3(), scr=new Float32Array(sc.n*3), pos=sc.pos;
  for(let i=0;i<sc.n;i++){ V.set(pos[i*3],pos[i*3+1],pos[i*3+2]).applyMatrix4(mw); const vz=V.clone().applyMatrix4(edit.matrixWorldInverse).z; V.project(edit);
    const x=rc.left+(V.x+1)/2*rc.width, y=rc.top+(1-V.y)/2*rc.height; scr[i*3]=x; scr[i*3+1]=y; scr[i*3+2]=-vz; const b=Math.floor((y-y0)/bh); if(b<0||b>=BN) continue; if(x<mL[b]) mL[b]=x; if(x>mR[b]) mR[b]=x; }
  const ok=b=>pL[b]!=null&&mL[b]<1e8&&(mR[b]-mL[b])>4; const A=new Array(BN).fill(null), O=new Array(BN).fill(0), Wt=new Array(BN).fill(0);
  let first=-1,last=-1; for(let b=0;b<BN;b++){ if(ok(b)){ if(first<0) first=b; last=b; A[b]=clamp((pR[b]-pL[b])/(mR[b]-mL[b]),.55,1.7); O[b]=pL[b]-mL[b]*A[b]; } }
  if(first<0||last-first<6){ toast('The photo and the clay do not overlap. Use Front view or Side view and line the photo up first (Scale, Move).'); return; }
  /* fill gaps, smooth */
  for(let b=0;b<BN;b++){ if(A[b]==null){ let q=-1; for(let k=1;k<BN&&q<0;k++){ if(b-k>=first&&A[b-k]!=null) q=b-k; else if(b+k<=last&&A[b+k]!=null) q=b+k; } if(q>=0){ A[b]=A[q]; O[b]=O[q]; } } }
  for(let pass=0;pass<3;pass++){ const a2=A.slice(), o2=O.slice(); for(let b=first+1;b<last;b++){ if(A[b]==null) continue; a2[b]=(A[b-1]+2*A[b]+A[b+1])/4; o2[b]=(O[b-1]+2*O[b]+O[b+1])/4; } for(let b=first;b<=last;b++){ A[b]=a2[b]; O[b]=o2[b]; } }
  for(let b=0;b<BN;b++){ const e=Math.min(b-first,last-b); Wt[b]=(b<first||b>last)?0:Math.min(1,(e+1)/4); }
  scPushUndo(sc);
  const camR=new THREE.Vector3().setFromMatrixColumn(edit.matrixWorld,0).normalize(), tan=Math.tan(edit.fov*Math.PI/360), pxw=2*tan/rc.height, T=new THREE.Vector3(), moved=[0,0];
  for(let i=0;i<sc.n;i++){ const y=scr[i*3+1], fb=(y-y0)/bh-.5, b0=Math.floor(fb), t=fb-b0, b1=b0+1; if(b0<first||b1>last){ if(!(b0>=first&&b0<=last)) continue; }
    const bb0=clamp(b0,first,last), bb1=clamp(b1,first,last); const a=A[bb0]+(A[bb1]-A[bb0])*t, o=O[bb0]+(O[bb1]-O[bb0])*t, w=(Wt[bb0]+(Wt[bb1]-Wt[bb0])*t)*SP.str; if(w<=0) continue;
    const x=scr[i*3], nx=a*x+o, dx=(nx-x)*w, dw=dx*pxw*scr[i*3+2]; if(Math.abs(dx)<.01) continue;
    T.set(pos[i*3],pos[i*3+1],pos[i*3+2]).applyMatrix4(mw).addScaledVector(camR,dw).applyMatrix4(inv); pos[i*3]=T.x; pos[i*3+1]=T.y; pos[i*3+2]=T.z; moved[0]++; }
  scUpdate(sc); sc.dirty=true; queueSave(); toast('Matched the outline to the photo ('+moved[0].toLocaleString()+' points moved). Undo works if it looks wrong.');
  return {first:first,last:last,moved:moved[0],mL:mL,mR:mR,pL:pL,pR:pR,BN:BN};
}
function scPhotoUI(){
  const w=document.createElement('div'), g=document.createElement('div'); g.className='g2';
  g.append(scBtn('Save as Front photo',()=>spSlotSet('front')),scBtn('Save as Side photo',()=>spSlotSet('side')));
  const strg=rangeField('Match strength',.2,1,.05,()=>SP.str,v=>{ SP.str=v; },f2,null);
  const go=scBtn('Match outline to photo',spMatch,'hi');
  const hb=scBtn('One tap: Jesvin head from his photos',spJesvin,'hi'); const pb=scBtn('Paint skin colour from this photo',()=>{ const c=spPaintPhoto(.92); if(c){ SCU.matcap=false; toast('Painted '+c.toLocaleString()+' points from the photo. Turn Studio view back on in Edit to see shape.'); } else toast('Nothing painted. Line the photo up with the head first.'); }); w.append(hb,g,strg,go,pb,noteEl('1) Set a front photo and tap Save as Front photo. 2) Same for a side photo. 3) Tap Front view, line the photo up with the clay using Scale and Move, then tap Match. Repeat for Side view. Works best with a plain background.'));
  return w;
}
/* fit the floating photo to the clay: head width, head top and centre */
function spAutoFit(){
  const n=sculptTarget(); const m=spMask(); if(!n||!m) return false; const sc=n.userData.sc, mesh=sc.mesh; n.updateMatrixWorld(true); mesh.updateMatrixWorld(true); edit.updateMatrixWorld(true);
  const rc=renderer.domElement.getBoundingClientRect(), mw=mesh.matrixWorld, V=new THREE.Vector3(); let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(let i=0;i<sc.n;i++){ V.set(sc.pos[i*3],sc.pos[i*3+1],sc.pos[i*3+2]).applyMatrix4(mw).project(edit); const x=rc.left+(V.x+1)/2*rc.width, y=rc.top+(1-V.y)/2*rc.height; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
  let r0=-1,rl=-1; for(let r=0;r<m.H;r++){ if(!isNaN(m.xl[r])){ if(r0<0) r0=r; rl=r; } } if(r0<0) return false;
  const rEnd=r0+Math.round((rl-r0)*.38); let bw=0,bc=.5; for(let r=r0;r<=rEnd;r++){ if(isNaN(m.xl[r])) continue; const w=m.xr[r]-m.xl[r]; if(w>bw){ bw=w; bc=(m.xl[r]+m.xr[r])/2; } }
  const st=scGuide.img.parentElement.getBoundingClientRect(), Wd=st.width, Hd=st.height, s=Math.min(Wd/m.iw,Hd/m.ih), rw=m.iw*s, rh=m.ih*s, rx=(Wd-rw)/2, ry=(Hd-rh)/2, cx=Wd/2, cy=Hd/2;
  const k=clamp((x1-x0)*1.12/(bw*rw),.3,3), bx=rx+bc*rw, by=ry+(r0/(m.H-1))*rh;
  const Xc=(x0+x1)/2-st.left, Yt=y0-st.top-(y1-y0)*.03;
  scGuide.k=k; scGuide.x=clamp((Xc-cx-k*(bx-cx))/Wd*100,-60,60); scGuide.y=clamp((Yt-cy-k*(by-cy))/Hd*100,-60,60); scGuideApply(); return true;
}
/* paint the photo's colours onto the clay surface that faces the camera */
function spPaintPhoto(str,mapFn){
  const n=sculptTarget(); if(!n||!scGuide.url){ toast('Select the head and set a photo first.'); return 0; }
  const im=scGuide.img; if(!im||!im.naturalWidth) return 0; const sc=n.userData.sc, mesh=sc.mesh; scEnd(); n.updateMatrixWorld(true); mesh.updateMatrixWorld(true); edit.updateMatrixWorld(true);
  const W=Math.min(1024,im.naturalWidth), H=Math.round(W*im.naturalHeight/im.naturalWidth), cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  const cx=cv.getContext('2d',{willReadFrequently:true}); cx.drawImage(im,0,0,W,H); let img; try{ img=cx.getImageData(0,0,W,H).data; }catch(e){ return 0; }
  scPushUndo(sc); if(!sc.paint) scPaintInit(sc);
  const rc=renderer.domElement.getBoundingClientRect(), st=im.parentElement.getBoundingClientRect(), Wd=st.width, Hd=st.height, s=Math.min(Wd/im.naturalWidth,Hd/im.naturalHeight), rw=im.naturalWidth*s, rh=im.naturalHeight*s, rx=(Wd-rw)/2, ry=(Hd-rh)/2, k=scGuide.k, tx=scGuide.x/100*Wd, ty=scGuide.y/100*Hd;
  const mw=mesh.matrixWorld, nmx=new THREE.Matrix3().getNormalMatrix(mw), nm=sc.geo.attributes.normal.array, P=sc.pos, paint=sc.paint, V=new THREE.Vector3(), Nn=new THREE.Vector3(), to=new THREE.Vector3(), cp=edit.position; let hit=0;
  for(let i=0;i<sc.n;i++){ V.set(P[i*3],P[i*3+1],P[i*3+2]).applyMatrix4(mw); Nn.set(nm[i*3],nm[i*3+1],nm[i*3+2]).applyMatrix3(nmx).normalize(); to.copy(cp).sub(V).normalize(); const f=Nn.dot(to); if(f<.2) continue;
    V.project(edit); const cX=rc.left+(V.x+1)/2*rc.width, cY=rc.top+(1-V.y)/2*rc.height; let u,v; if(mapFn){ const m=mapFn(cX,cY); u=m[0]/im.naturalWidth; v=m[1]/im.naturalHeight; } else { const X=cX-st.left, Y=cY-st.top; u=((X-Wd/2-tx)/k+Wd/2-rx)/rw; v=((Y-Hd/2-ty)/k+Hd/2-ry)/rh; } if(u<0||u>1||v<0||v>1) continue;
    const px=Math.min(W-1,Math.floor(u*W)), py=Math.min(H-1,Math.floor(v*H)), q=(py*W+px)*4, t=clamp((f-.2)/.5,0,1), w=t*t*(3-2*t)*(str==null?.9:str);
    for(let c=0;c<3;c++) paint[i*3+c]=Math.round(paint[i*3+c]*(1-w)+img[q+c]*w); hit++; }
  scColors(sc); scMatSync(sc); sc.dirty=true; queueSave(); return hit;
}
function spFrame(kind){
  const n=sculptTarget(); if(!n) return; const sc=n.userData.sc; sc.geo.computeBoundingBox(); const bb=sc.geo.boundingBox, c=bb.getCenter(new THREE.Vector3()); n.localToWorld(c);
  const h=(bb.max.y-bb.min.y)*Math.max(.01,n.scale.y), D=h/(.62*2*Math.tan(edit.fov*Math.PI/360));
  orbit.target.copy(c); if(kind==='side') edit.position.set(c.x+D,c.y,c.z); else edit.position.set(c.x,c.y,c.z+D);
  edit.near=Math.min(edit.near,D*.1); edit.updateProjectionMatrix(); edit.lookAt(c); orbit.update(); edit.updateMatrixWorld(true);
}
function spLoadGuide(blob){ return new Promise(res=>{ const im=scGuide.img, done=()=>{ im.removeEventListener('load',done); setTimeout(res,150); }; im.addEventListener('load',done); scGuideSet(blob); setTimeout(res,5000); }); }
async function spJesvinOld(){
  if(SP.busy) return; SP.busy=true;
  try{
    toast('Building Jesvin head from his photos...');
    const get=async u=>{ const r=await fetch(u); if(!r.ok) throw new Error('Photo not found: '+u); return r.blob(); };
    SP.front={blob:await get('assets/hashir_front.jpg')}; SP.side={blob:await get('assets/hashir_side.jpg')};
    scNew('realhead'); await new Promise(r=>setTimeout(r,500));
    for(const kind of ['front','side']){ SP.cur=kind; scAlign(kind); spFrame(kind); await new Promise(r=>setTimeout(r,300)); await spLoadGuide(SP[kind].blob); await new Promise(r=>setTimeout(r,300)); SP.busy=false; spAutoFit(); await new Promise(r=>setTimeout(r,200)); spMatch(); SP.busy=true; await new Promise(r=>setTimeout(r,200)); }
    SCU.matcap=false;
    for(const kind of ['front','side']){ SP.cur=kind; scAlign(kind); spFrame(kind); await new Promise(r=>setTimeout(r,300)); await spLoadGuide(SP[kind].blob); await new Promise(r=>setTimeout(r,300)); spAutoFit(); await new Promise(r=>setTimeout(r,200)); spPaintPhoto(.92); }
    SP.cur='front'; scAlign('front'); spFrame('front'); await spLoadGuide(SP.front.blob);
    toast('Jesvin head built from the front and side photos. Orbit around it and refine with the brushes. Undo steps back.');
  }catch(e){ toast(e&&e.message?e.message:'Could not build the head.'); }
  SP.busy=false;
}

/* ================= Feature alignment: eyes, nose, mouth, chin, jaw, ears move the clay to match the photo ================= */
const SPF={
  front:{names:['RIGHT eye (left side of the photo): middle of the pupil','LEFT eye (right side of the photo): middle of the pupil','Tip of the nose','Middle of the lips','Bottom of the chin','Jaw on the left side of the photo (level of the mouth)','Jaw on the right side of the photo (level of the mouth)'],
    tpl:[[-.036,.05],[.036,.05],[0,-.005],[0,-.047],[0,-.088],[-.068,-.045],[.068,-.045]]},
  side:{names:['Eye: middle of the pupil','Tip of the nose','Middle of the lips','Front of the chin','Ear: middle of the ear hole'],
    tpl:[[.036,.05],[0,-.005],[0,-.047],[0,-.088],[.082,.0435]]}
};
const SP_JESVIN={front:[[188,250],[298,228],[263,293],[273,338],[273,448],[152,345],[375,340]],side:[[39,97],[15,114],[19,126],[19,156],[80,117]]};
function spSurf(sc,x0,y0,dx,dy){ const P=sc.pos; let best=-1e9; for(let i=0;i<sc.n;i++){ const j=i*3; if(Math.abs(P[j]-x0)<dx&&Math.abs(P[j+1]-y0)<dy&&P[j+2]>best) best=P[j+2]; } return best>-1e8?best:0; }
/* Gaussian RBF warp of the local-space positions */
function spWarp(sc,S,D,sg){
  const m=S.length, A=[], g=(a,b)=>{ const x=a[0]-b[0], y=a[1]-b[1], z=a[2]-b[2]; return Math.exp(-(x*x+y*y+z*z)/(sg*sg)); };
  for(let i=0;i<m;i++){ A.push([]); for(let j=0;j<m;j++) A[i].push(g(S[i],S[j])+(i===j?1e-3:0)); }
  const W=[0,1,2].map(c=>{ const M=A.map((r,i)=>r.concat([D[i][c]])); for(let i=0;i<m;i++){ let p=i; for(let r=i+1;r<m;r++) if(Math.abs(M[r][i])>Math.abs(M[p][i])) p=r; [M[i],M[p]]=[M[p],M[i]]; for(let r=i+1;r<m;r++){ const f=M[r][i]/M[i][i]; for(let k=i;k<=m;k++) M[r][k]-=f*M[i][k]; } }
    const w=new Array(m).fill(0); for(let i=m-1;i>=0;i--){ let s=M[i][m]; for(let k=i+1;k<m;k++) s-=M[i][k]*w[k]; w[i]=s/M[i][i]; } return w; });
  const P=sc.pos, q=[0,0,0]; for(let i=0;i<sc.n;i++){ q[0]=P[i*3]; q[1]=P[i*3+1]; q[2]=P[i*3+2]; let dx=0,dy=0,dz=0; for(let k=0;k<m;k++){ const e=g(q,S[k]); dx+=W[0][k]*e; dy+=W[1][k]*e; dz+=W[2][k]*e; } P[i*3]+=dx; P[i*3+1]+=dy; P[i*3+2]+=dz; }
}
/* pts = photo pixels in the order of SPF[view].names. Moves the clay so its features sit where the photo's features are. */
function spFeatures(view,pts){
  const n=sculptTarget(); if(!n) return null; const sc=n.userData.sc, F=SPF[view]; scEnd(); scPushUndo(sc);
  const tpl=F.tpl, eyeT=.05, chinT=-.088; let T=[], S=[], D=[];
  if(view==='front'){
    const eR=pts[0], eL=pts[1], th=Math.atan2(eL[1]-eR[1],eL[0]-eR[0]), c=Math.cos(-th), s_=Math.sin(-th), mid=[(eR[0]+eL[0])/2,(eR[1]+eL[1])/2];
    const rot=p=>{ const x=p[0]-mid[0], y=p[1]-mid[1]; return [x*c-y*s_, x*s_+y*c]; }, R=pts.map(rot), sc_=(eyeT-chinT)/(R[4][1]);
    pts.forEach((p,i)=>{ const x=R[i][0]*sc_, y=eyeT-R[i][1]*sc_, sx=tpl[i][0], sy=tpl[i][1], sz=spSurf(sc,sx,sy,.007,.006); S.push([sx,sy,sz]); T.push([x,y,sz]); D.push([x-sx,y-sy,0]); });
    SP.lm=SP.lm||{}; SP.lm.front={pts:pts,T:T,th:th};
  } else {
    const e=pts[0], s=(eyeT-chinT)/(pts[3][1]-e[1]); let zE=spSurf(sc,.036,.05,.007,.006);
    const zt=[zE,spSurf(sc,0,-.005,.007,.006),spSurf(sc,0,-.047,.007,.006),spSurf(sc,0,-.088,.007,.006),-.012];
    const add=(x,y,i,dz)=>{ S.push([x,y,zt[i]]); D.push([0,0,dz]); };
    pts.forEach((p,i)=>{ const tz=zE-(p[0]-e[0])*s, dz=tz-zt[i]; const x=tpl[i][0], y=tpl[i][1]; add(x,y,i,dz); if(x!==0) add(-x,y,i,dz); T.push([x,y,tz]); });
    SP.lm=SP.lm||{}; SP.lm.side={pts:pts,T:T};
  }
  spWarp(sc,S,D,.05); scUpdate(sc); sc.dirty=true; queueSave(); return true;
}
/* paint colours using a similarity transform fitted between the clay's feature positions on screen and the photo's */
function spPaintFeatures(view,str){
  const n=sculptTarget(), L=SP.lm&&SP.lm[view], im=scGuide.img; if(!n||!L||!im||!im.naturalWidth) return 0;
  const sc=n.userData.sc, mesh=sc.mesh; n.updateMatrixWorld(true); mesh.updateMatrixWorld(true); edit.updateMatrixWorld(true);
  const rc=renderer.domElement.getBoundingClientRect(), mw=mesh.matrixWorld, V=new THREE.Vector3();
  const scr=(x,y,z)=>{ V.set(x,y,z).applyMatrix4(mw).project(edit); return [rc.left+(V.x+1)/2*rc.width, rc.top+(1-V.y)/2*rc.height]; };
  const C=[], Pp=[]; L.T.forEach((t,i)=>{ if(view==='front'){ const z=spSurf(sc,t[0],t[1],.007,.006); C.push(scr(t[0],t[1],z)); } else { if(i===4) C.push(scr(.082,t[1]||.0435,t[2])); else C.push(scr(t[0],t[1],spSurf(sc,t[0],t[1],.007,.006))); } Pp.push(L.pts[i]); });
  /* the side tpl y comes from SPF */ 
  if(view==='side'){ for(let i=0;i<C.length;i++){ const y=SPF.side.tpl[i][1], x=SPF.side.tpl[i][0]; C[i]=scr(x,y,L.T[i][2]); } }
  const cm=[0,0],pm=[0,0]; C.forEach((c,i)=>{ cm[0]+=c[0]/C.length; cm[1]+=c[1]/C.length; pm[0]+=Pp[i][0]/C.length; pm[1]+=Pp[i][1]/C.length; });
  let zr=0,zi=0,den=0; C.forEach((c,i)=>{ const a=c[0]-cm[0], b=c[1]-cm[1], p=Pp[i][0]-pm[0], q=Pp[i][1]-pm[1]; zr+=p*a+q*b; zi+=q*a-p*b; den+=a*a+b*b; }); zr/=den; zi/=den;
  const map=(X,Y)=>{ const a=X-cm[0], b=Y-cm[1]; return [zr*a-zi*b+pm[0], zi*a+zr*b+pm[1]]; };
  return spPaintPhoto(str,map);
}
async function spJesvin(){
  if(SP.busy) return; SP.busy=true;
  try{
    toast('Building Jesvin head from his photos...');
    const get=async u=>{ const r=await fetch(u); if(!r.ok) throw new Error('Photo not found: '+u); return r.blob(); };
    SP.front={blob:await get('assets/hashir_front.jpg')}; SP.side={blob:await get('assets/hashir_side.jpg')}; SP.lm={};
    scNew('realhead'); await new Promise(r=>setTimeout(r,500)); SCU.matcap=false;
    for(const kind of ['front','side']){ SP.cur=kind; scAlign(kind); spFrame(kind); await new Promise(r=>setTimeout(r,200)); spFeatures(kind,SP_JESVIN[kind]); await new Promise(r=>setTimeout(r,150)); }
    for(const kind of ['front','side']){ SP.cur=kind; scAlign(kind); spFrame(kind); await new Promise(r=>setTimeout(r,300)); await spLoadGuide(SP[kind].blob); await new Promise(r=>setTimeout(r,300)); spPaintFeatures(kind,.92); }
    SP.cur='front'; scAlign('front'); spFrame('front'); await spLoadGuide(SP.front.blob);
    toast('Jesvin head built: features moved to match both photos, colours painted. Orbit around it.');
  }catch(e){ toast(e&&e.message?e.message:'Could not build the head.'); }
  SP.busy=false;
}
/* tap mode: the user taps the features on the photo */
function spTapStart(view){
  if(!scGuide.url){ toast('Set the '+view+' photo first.'); return; } if(!sculptTarget()){ toast('Select the head first.'); return; }
  SP.tap={view:view,pts:[]}; spTapUI();
}
function spTapUI(){
  const T=SP.tap, stg=scGuide.img.parentElement; let box=document.getElementById('spTapBox');
  if(!T){ if(box) box.remove(); return; }
  if(!box){ box=document.createElement('div'); box.id='spTapBox'; box.style.cssText='position:absolute;left:8px;right:8px;top:8px;z-index:9;background:rgba(20,20,24,.92);color:#fff;padding:8px 10px;border-radius:8px;font:13px system-ui;display:flex;gap:8px;align-items:center;pointer-events:auto'; stg.appendChild(box); }
  const F=SPF[T.view]; box.innerHTML=''; const m=document.createElement('span'); m.style.flex='1'; m.textContent='Tap '+(T.pts.length+1)+'/'+F.names.length+': '+F.names[T.pts.length]; box.appendChild(m);
  const mk=(txt,fn)=>{ const b=document.createElement('button'); b.type='button'; b.textContent=txt; b.style.cssText='padding:6px 10px;border-radius:6px;border:0;background:#444;color:#fff'; b.addEventListener('pointerdown',e=>e.stopPropagation()); b.addEventListener('click',fn); box.appendChild(b); };
  mk('Undo',()=>{ T.pts.pop(); const d=stg.querySelectorAll('.spDot'); if(d.length) d[d.length-1].remove(); spTapUI(); }); mk('Cancel',()=>{ stg.querySelectorAll('.spDot').forEach(d=>d.remove()); SP.tap=null; spTapUI(); });
}
(function(){ const stg=()=>scGuide.img&&scGuide.img.parentElement; document.addEventListener('pointerdown',e=>{
  const T=SP.tap; if(!T||!stg()||!stg().contains(e.target)||e.target.closest('#spTapBox')) return; e.preventDefault(); e.stopPropagation();
  const im=scGuide.img, st=stg().getBoundingClientRect(), Wd=st.width, Hd=st.height, s=Math.min(Wd/im.naturalWidth,Hd/im.naturalHeight), rw=im.naturalWidth*s, rh=im.naturalHeight*s, rx=(Wd-rw)/2, ry=(Hd-rh)/2, k=scGuide.k, tx=scGuide.x/100*Wd, ty=scGuide.y/100*Hd;
  const X=e.clientX-st.left, Y=e.clientY-st.top, u=((X-Wd/2-tx)/k+Wd/2-rx)/rw*im.naturalWidth, v=((Y-Hd/2-ty)/k+Hd/2-ry)/rh*im.naturalHeight;
  T.pts.push([u,v]); const d=document.createElement('div'); d.className='spDot'; d.style.cssText='position:absolute;width:12px;height:12px;margin:-6px;border-radius:50%;background:#ff3b30;border:2px solid #fff;pointer-events:none;z-index:8;left:'+X+'px;top:'+Y+'px'; stg().appendChild(d);
  if(T.pts.length>=SPF[T.view].names.length){ const view=T.view, pts=T.pts.slice(); SP.tap=null; spTapUI(); stg().querySelectorAll('.spDot').forEach(x=>x.remove()); SP.lm=SP.lm||{}; spFeatures(view,pts); spPaintFeatures(view,.92); SCU.matcap=false; toast('Features matched and colours painted for the '+view+' view.'); } else spTapUI();
 },true); })();

SC_REFS.push({name:'Jesvin front photo',data:'assets/hashir_front.jpg'},{name:'Jesvin side photo',data:'assets/hashir_side.jpg'});
window.__sp={spFeatures:spFeatures,spPaintFeatures:spPaintFeatures,spPaintPhoto:spPaintPhoto,spFrame:spFrame,spJesvin:spJesvin,spAutoFit:spAutoFit,spMask:spMask,spMatch:spMatch,SP:SP,scNew:scNew,scAlign:scAlign,scGuideSet:scGuideSet,scGuide:scGuide};
window.__sp.baseInfo=function(){ const n=sculptTarget(), sc=n.userData.sc; sc.geo.computeBoundingBox(); const bb=sc.geo.boundingBox; return {n:sc.n,min:bb.min.toArray().map(v=>+v.toFixed(3)),max:bb.max.toArray().map(v=>+v.toFixed(3)),scale:n.scale.toArray(),pos:n.position.toArray(),rot:[n.rotation.x,n.rotation.y,n.rotation.z]}; };
window.__sp.project=function(x,y,z){ const n=sculptTarget(), sc=n.userData.sc; n.updateMatrixWorld(true); edit.updateMatrixWorld(true); const rc=renderer.domElement.getBoundingClientRect(), V=new THREE.Vector3(x,y,z).applyMatrix4(sc.mesh.matrixWorld).project(edit); return [rc.left+(V.x+1)/2*rc.width, rc.top+(1-V.y)/2*rc.height]; };
window.__sp.profile=function(){ const n=sculptTarget(), sc=n.userData.sc, P=sc.pos, out=[]; for(let y=.14;y>=-.15;y-=.005){ let zm=-9, zE=-9, ex=0; for(let i=0;i<sc.n;i++){ const j=i*3; if(Math.abs(P[j+1]-y)<.0025){ if(Math.abs(P[j])<.005&&P[j+2]>zm) zm=P[j+2]; if(Math.abs(Math.abs(P[j])-.036)<.006&&P[j+2]>zE) zE=P[j+2]; } } out.push([+y.toFixed(3),+zm.toFixed(3),+zE.toFixed(3)]); } return out; };
window.__sp.width=function(){ const n=sculptTarget(), sc=n.userData.sc, P=sc.pos, out=[]; for(let y=.14;y>=-.15;y-=.01){ let xm=0; for(let i=0;i<sc.n;i++){ const j=i*3; if(Math.abs(P[j+1]-y)<.005&&P[j+2]>-.02&&Math.abs(P[j])>xm) xm=Math.abs(P[j]); } out.push([+y.toFixed(2),+xm.toFixed(3)]); } return out; };
window.__sp.lineup=function(){ for(let i=0;i<4;i++){ addEmbedded(i,{p:[(i-1.5)*1.15,0,0]}); } refreshScene(); const t=orbit.target; t.set(0,1,0); edit.position.set(0,1.1,5.2); edit.lookAt(t); orbit.update(); return EMBED_GLB.slice(0,4).map(e=>e.name+':'+JSON.stringify(e.size)); };
window.__sp.charInfo=function(){ const out=[]; order.forEach(id=>{ const n=nodes.get(id), sp=n&&n.userData.spec; if(!sp||sp.type!=='glb'||sp.embed==null||sp.embed>3) return; let tris=0,mats=[]; n.traverse(o=>{ if(o.isMesh){ tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3; const m=o.material; mats.push([m.type,+(m.roughness||0).toFixed(2),+(m.metalness||0).toFixed(2),!!m.map,!!m.normalMap,!!m.roughnessMap]); } }); out.push({name:sp.name,tris:Math.round(tris),mats:mats.slice(0,4)}); }); return out; };
window.__sp.faceCam=function(i,d,y){ const x=(i-1.5)*1.15; orbit.target.set(x,y||1.6,0); edit.position.set(x,(y||1.6)+.02,d||.75); edit.near=.05; edit.updateProjectionMatrix(); edit.lookAt(orbit.target); orbit.update(); };
window.__sp.camDbg=function(){ const g=id=>{ const n=nodes.get(id); return n?n.position.toArray().map(v=>+v.toFixed(2)):null; }; const out={t:S.t,cam:g('cam'),tgt:g('tgt'),fov:look.fov,chars:[]}; order.forEach(id=>{ const n=nodes.get(id), sp=n&&n.userData.spec; if(sp&&sp.type==='glb'&&sp.embed!=null&&sp.embed<4){ const bb=new THREE.Box3().setFromObject(n); out.chars.push([sp.name,n.position.toArray().map(v=>+v.toFixed(2)),n.scale.x,+bb.min.y.toFixed(2),+bb.max.y.toFixed(2)]); } }); return out; };
window.__sp.faceOf=function(name,d,dy){ let found=null; order.forEach(id=>{ const n=nodes.get(id), sp=n&&n.userData.spec; if(sp&&sp.name===name&&sp.type==='glb') found=n; }); if(!found) return null; const bb=new THREE.Box3().setFromObject(found), y=bb.max.y-.11, p=found.position, yaw=found.rotation.y, fx=Math.sin(yaw), fz=Math.cos(yaw);
 setView('free'); orbit.target.set(p.x,y+(dy||0),p.z); edit.position.set(p.x+fx*(d||.55),y+(dy||0)+.01,p.z+fz*(d||.55)); edit.near=.05; edit.updateProjectionMatrix(); edit.lookAt(orbit.target); orbit.update(); return [p.x,y,p.z,yaw]; };
window.__sp.mouth=function(nm){ let r=null; nodes.forEach(n=>{ if(n.userData.name===nm){ const f=n.userData.fs; r=[f&&+f.open.toFixed(2), !!(S.vo&&VB[S.vo.id]&&VB[S.vo.id].vis), (S.caps||[]).length, S.view]; } }); return r; };
window.__sp.texDump=function(embed){ let r=[]; nodes.forEach(n=>{ const sp=n.userData.spec; if(!sp||sp.type!=='glb'||sp.embed!==embed) return; n.traverse(o=>{ if(o.isMesh){ const ms=Array.isArray(o.material)?o.material:[o.material]; ms.forEach(m=>{ if(m.map&&m.map.image){ const im=m.map.image, c=document.createElement('canvas'); c.width=im.width; c.height=im.height; c.getContext('2d').drawImage(im,0,0); r.push([o.name,m.name,im.width,im.height,c.toDataURL('image/png')]); } }); } }); }); return r; };
window.__sp.mats=function(embed){ const r=[]; nodes.forEach(n=>{ const sp=n.userData.spec; if(!sp||sp.type!=='glb'||sp.embed!==embed) return; n.traverse(o=>{ if(o.isMesh){ const ms=Array.isArray(o.material)?o.material:[o.material]; ms.forEach(m=>r.push([o.name,m.name,m.color&&m.color.getHexString(),m.transparent,+m.opacity.toFixed(2),!!m.map,m.type, o.geometry.attributes.position.count])); } }); }); return r; };
window.__sp.eyes=function(nm){ let r=null; nodes.forEach(n=>{ if(n.userData.name===nm){ const R=n.userData.rig, F=R&&R.mf&&R.mf.face; const ey=F&&F.lids&&F.lids.eyes; r=ey?ey.map(e=>[e.cen.toArray().map(v=>+v.toFixed(4)), e.dirF.toArray().map(v=>+v.toFixed(2)), e.RB]):'noeyes'; } }); return r; };
window.__sp.lensDrop=function(){ const r=[]; nodes.forEach(n=>n.traverse(o=>{ if(o.isMesh&&o.geometry.userData.lensCut!=null) r.push([n.userData.name,o.geometry.userData.lensCut]); })); return r; };
