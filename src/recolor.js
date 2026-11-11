/* outfit recolour so characters match the character sheets (runs once per character) */
const RC_RULES={
  1:(h,s,v,z)=>{ if(z==='head') return null; if(h>=28&&h<=64&&s>=.12&&s<=.8&&v>.35) return [356,Math.min(1,Math.max(.6,s*1.6)),v*.5]; return null; },
  3:()=>null,
  2:(h,s,v,z)=>{ if(z==='head') return null; if(h>=255&&h<=335&&s>.28) return [226,Math.min(1,s*.95),v*.72]; return null; }
};
function rcHsv(r,g,b){ const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn; let h=0; if(d){ if(mx===r) h=((g-b)/d)%6; else if(mx===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; if(h<0) h+=360; } return [h, mx?d/mx:0, mx]; }
function rcRgb(h,s,v){ const c=v*s, x=c*(1-Math.abs((h/60)%2-1)), m=v-c; let r=0,g=0,b=0; if(h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;} else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;} return [(r+m)*255,(g+m)*255,(b+m)*255]; }
function rcZones(g,t,w,h){ const P=g.attributes.position, U=g.attributes.uv, I=g.index, zone=new Uint8Array(w*h); if(!P||!U) return zone;
  let mn=1e9,mx=-1e9; for(let i=0;i<P.count;i++){ const y=P.getY(i); if(y<mn)mn=y; if(y>mx)mx=y; } const cut=mn+(mx-mn)*.875, N=I?I.count/3:P.count/3;
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const x=cv.getContext('2d',{willReadFrequently:true}); const fy=t.flipY;
  [1,2].forEach(zn=>{ x.clearRect(0,0,w,h); x.fillStyle=x.strokeStyle='#fff'; x.lineWidth=1.2; x.lineJoin='round';
    for(let f=0;f<N;f++){ const a=I?I.getX(f*3):f*3, b=I?I.getX(f*3+1):f*3+1, c2=I?I.getX(f*3+2):f*3+2; const cy=(P.getY(a)+P.getY(b)+P.getY(c2))/3; if((cy>=cut?2:1)!==zn) continue;
      x.beginPath(); [a,b,c2].forEach((q,k)=>{ const px=U.getX(q)*w, py=(fy?1-U.getY(q):U.getY(q))*h; if(k) x.lineTo(px,py); else x.moveTo(px,py); }); x.closePath(); x.fill(); x.stroke(); }
    const m=x.getImageData(0,0,w,h).data; for(let i=0;i<w*h;i++){ if(m[i*4+3]>40&&(zn===2||!zone[i])) zone[i]=zn; } });
  return zone; }
/* painted facial hair: region weight from mesh position (chin-relative), returns 0..1 */
const RC_BEARD={
  3:(dy,x,fz)=>{ const ax=Math.abs(x); if(fz<-.085) return 0; if(dy>-.012&&dy<.03&&ax<.07) return .8; if(dy>=.03&&dy<.052&&ax>.035&&ax<.07) return .4; if(dy>=.045&&dy<.062&&ax<.03&&dy>.052) return .0; return 0; },
  1:(dy,x,fz)=>{ const ax=Math.abs(x); if(fz<-.085) return 0; if(dy>-.012&&dy<.032&&ax<.022) return .95; if(dy>.058&&dy<.068&&ax<.032) return .95; return 0; }
};
function rcBeard(g,t,c,x,embed,cut,mn,mx){ const f=RC_BEARD[embed]; if(!f) return; const P=g.attributes.position,U=g.attributes.uv,I=g.index; if(!P||!U) return; const w=c.width,h=c.height,fy=t.flipY, N=I?I.count/3:P.count/3;
  const chinY=mn+(mx-mn)*.875-(mx-mn)*.0; let zmax=-1e9; for(let i=0;i<P.count;i++){ if(P.getY(i)>=cut&&P.getZ(i)>zmax) zmax=P.getZ(i); }
  const m=document.createElement('canvas'); m.width=w; m.height=h; const mx2=m.getContext('2d'); mx2.lineJoin='round'; mx2.lineWidth=1;
  for(let q=0;q<N;q++){ const a=I?I.getX(q*3):q*3,b=I?I.getX(q*3+1):q*3+1,d=I?I.getX(q*3+2):q*3+2; const cy=(P.getY(a)+P.getY(b)+P.getY(d))/3, cx=(P.getX(a)+P.getX(b)+P.getX(d))/3, cz=(P.getZ(a)+P.getZ(b)+P.getZ(d))/3;
    const wgt=f(cy-chinY,cx,cz-zmax); if(wgt<=0) continue; mx2.fillStyle=mx2.strokeStyle='rgba(255,255,255,'+wgt+')'; mx2.beginPath(); [a,b,d].forEach((v,k)=>{ const px=U.getX(v)*w, py=(fy?1-U.getY(v):U.getY(v))*h; if(k) mx2.lineTo(px,py); else mx2.moveTo(px,py); }); mx2.closePath(); mx2.fill(); mx2.stroke(); }
  const md=mx2.getImageData(0,0,w,h).data, id=x.getImageData(0,0,w,h), A=id.data; let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  for(let i=0;i<w*h;i++){ const al=md[i*4+3]/255; if(al<.02) continue; const k=al*(.3+.55*rnd()); A[i*4]=A[i*4]*(1-k)+28*k; A[i*4+1]=A[i*4+1]*(1-k)+20*k; A[i*4+2]=A[i*4+2]*(1-k)+16*k; }
  x.putImageData(id,0,0); }
/* clear glasses: drop triangles whose texture is the blue-grey lens (head only) */
function rcLensCut(g,t,a,w,h){ const P=g.attributes.position,U=g.attributes.uv,I=g.index; if(!P||!U||!I||g.userData.lensCut) return; let mn=1e9,mx=-1e9; for(let i=0;i<P.count;i++){ const y=P.getY(i); if(y<mn)mn=y; if(y>mx)mx=y; } const cut=mn+(mx-mn)*.875, N=I.count/3, keep=[], cand=[]; let drop=0;
  for(let f=0;f<N;f++){ const i0=I.getX(f*3),i1=I.getX(f*3+1),i2=I.getX(f*3+2); const cy=(P.getY(i0)+P.getY(i1)+P.getY(i2))/3; let isL=false;
    if(cy>=cut){ const hit=(u,v)=>{ const px=Math.min(w-1,Math.max(0,Math.floor(u*w))), py=Math.min(h-1,Math.max(0,Math.floor((t.flipY?1-v:v)*h))), o=(py*w+px)*4, hv=rcHsv(a[o]/255,a[o+1]/255,a[o+2]/255); return hv[0]>=12&&hv[0]<=46&&hv[1]>.68&&hv[2]>.45; };
      let n=0; [i0,i1,i2].forEach(q=>{ if(hit(U.getX(q),U.getY(q))) n++; }); if(hit((U.getX(i0)+U.getX(i1)+U.getX(i2))/3,(U.getY(i0)+U.getY(i1)+U.getY(i2))/3)) n++; if(n>=2) isL=true; }
    if(isL){ cand.push([f,cy,Math.abs((P.getX(i0)+P.getX(i1)+P.getX(i2))/3)]); } keep.push(i0,i1,i2); }
  let xm=0; for(let i=0;i<P.count;i++){ if(P.getY(i)>=cut) xm=Math.max(xm,Math.abs(P.getX(i))); } const ys=cand.map(c=>c[1]).sort((a,b)=>a-b), my=ys.length?ys[ys.length>>1]:0, H=mx-mn, dropSet=new Set(); cand.forEach(c=>{ if(c[2]>xm*.12&&Math.abs(c[1]-my)<H*.024) dropSet.add(c[0]); }); drop=dropSet.size; const kp=[]; for(let f=0;f<N;f++){ if(!dropSet.has(f)) kp.push(I.getX(f*3),I.getX(f*3+1),I.getX(f*3+2)); } keep.length=0; kp.forEach(v=>keep.push(v));
  if(drop>0&&drop<N*.05){ g.setIndex(new THREE.BufferAttribute(new Uint32Array(keep),1)); } g.userData.lensCut=drop; }
function recolorChars(){
  nodes.forEach(n=>{ const sp=n.userData.spec; if(!sp||sp.type!=='glb'||sp.embed==null) return; const rule=RC_RULES[sp.embed]; if(!rule||n.userData.rcDone) return;
    let did=false;
    n.traverse(o=>{ if(!o.isMesh) return; const ms=Array.isArray(o.material)?o.material:[o.material];
      ms.forEach(m=>{ const t=m.map; if(!t||!t.image||t.image.width<1024||t.__rc) return;
        const im=t.image, c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0);
        if(sp.embed===1) rcLensCut(o.geometry,t,x.getImageData(0,0,c.width,c.height).data,c.width,c.height);
        { const P=o.geometry.attributes.position; if(P){ let mn=1e9,mx=-1e9; for(let i=0;i<P.count;i++){ const y=P.getY(i); if(y<mn)mn=y; if(y>mx)mx=y; } rcBeard(o.geometry,t,c,x,sp.embed,mn+(mx-mn)*.875,mn,mx); } }
        const d=x.getImageData(0,0,c.width,c.height), a=d.data, zm=rcZones(o.geometry,t,c.width,c.height);
        let sr=0,sg=0,sb=0,sn=0; for(let i=0;i<a.length;i+=16){ if(zm[i>>2]!==2) continue; const hv=rcHsv(a[i]/255,a[i+1]/255,a[i+2]/255); if(hv[0]>=12&&hv[0]<=42&&hv[1]>=.18&&hv[1]<=.6&&hv[2]>.6){ sr+=a[i]; sg+=a[i+1]; sb+=a[i+2]; sn++; } } if(sn){ sr/=sn; sg/=sn; sb/=sn; }
        for(let i=0;i<a.length;i+=4){ if(sn&&zm[i>>2]===1){ const dr=a[i]-sr,dg=a[i+1]-sg,db=a[i+2]-sb; if(dr*dr+dg*dg+db*db<450) continue; } const hv=rcHsv(a[i]/255,a[i+1]/255,a[i+2]/255), q=rule(hv[0],hv[1],hv[2],zm[i>>2]===1?'body':'head'); if(!q&&sp.embed===1&&sn&&zm[i>>2]!==1&&hv[0]>=8&&hv[0]<=46&&hv[1]>.62&&hv[2]>.4){ a[i]=sr; a[i+1]=sg; a[i+2]=sb; continue; } if(q){ const r=rcRgb(q[0],q[1],q[2]); a[i]=r[0]; a[i+1]=r[1]; a[i+2]=r[2]; } }
        x.putImageData(d,0,0);
        const nt=new THREE.CanvasTexture(c); nt.flipY=t.flipY; nt.encoding=t.encoding; nt.wrapS=t.wrapS; nt.wrapT=t.wrapT; nt.anisotropy=t.anisotropy; nt.__rc=1; nt.needsUpdate=true;
        m.map=nt; m.needsUpdate=true; did=true; }); });
    if(did) n.userData.rcDone=1; });
}
window.__rc=recolorChars;
