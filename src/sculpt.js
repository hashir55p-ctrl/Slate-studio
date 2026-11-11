
/* ================= Sculpting ================= */
IC.tSculpt=svg('<path d="M2.5 15.5c0-3 1.5-4.6 4-4.6l1.2-1.2 5.6-6.2a2 2 0 0 1 2.9 2.8l-6.2 5.6-1 1.2c0 2.6-1.8 4.4-6.5 2.4z" '+stroke+'/>');
IC.sculpt=IC.tSculpt;
TYPES.sculpt='Sculpt';
TOOLS.push({id:'sculpt',ic:IC.sculpt,t:'Sculpt (clay brushes)'});
TABS.push({id:'sculpt',ic:IC.tSculpt,t:'Sculpt',pane:'pSculpt'});

const SCU={on:false,brush:'draw',size:.25,strength:.5,falloff:'soft',sym:true,carve:false,wire:false,detail:'medium',stab:.4,pressStab:.45,deformGuard:.7,jointProtect:.72,micro:false,dyn:false,dynk:'fine',symY:false,symZ:false,pres:true,presSize:false,presStrengthCurve:1,presSizeCurve:1,matcap:true,mcap:'clay',pcol:'#c98e74',pjit:.25,dirt:.5};
const SC_SHAPES={jesvin:{n:'Jesvin (sculpted from his sheet)',size:[.94,1.82,.58]},realhead:{n:'Realistic head (anatomy base)',size:[.2,.34,.27]},person:{n:'Person (rig-ready)',size:[1,1.75,.6]},ball:{n:'Ball',size:[1.6,1.6,1.6]},head:{n:'Head',size:[1.3,1.7,1.5]},body:{n:'Body',size:[1.1,2.6,.8]},block:{n:'Block',size:[1.6,1.6,1.6]},terrain:{n:'Terrain',size:[10,0,10]}};
const SC_DETAIL={low:14,medium:22,high:30,ultra:44};
const SC_GRID={low:48,medium:80,high:110,ultra:160}; const SC_PERSON_H={low:.032,medium:.021,high:.015,ultra:.011};
const SC_BRUSHES=[{id:'draw',n:'Draw'},{id:'grab',n:'Grab'},{id:'smooth',n:'Smooth'},{id:'relax',n:'Surface relax (preserve volume)'},{id:'inflate',n:'Inflate'},{id:'pinch',n:'Pinch'},{id:'knuckle',n:'Digit joint (ring crease)'},{id:'flatten',n:'Flatten'},{id:'clay',n:'Clay build-up'},{id:'crease',n:'Crease (cut lines)'},{id:'noise',n:'Skin and stone grain'},{id:'scrape',n:'Scrape (shave high spots)'},{id:'snake',n:'Snake hook (pull out horns, fingers)'},{id:'layer',n:'Layer (raise to an even height)'},{id:'nudge',n:'Nudge (push sideways)'},{id:'pores',n:'Skin pores'},{id:'wrinkle',n:'Wrinkles (fine lines: forehead, neck, eye bags)'},{id:'paint',n:'Paint color'},{id:'mask',n:'Mask (protect an area)'}];
const SC_REFS=[]; /* {name,data} reference images bundled into the page */
const scSstep=(a,b,x)=>{ const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };

/* ---------- base shapes ---------- */
function scWeld(g){
  const pa=g.attributes.position, n0=pa.count, ix=g.index, map=new Map(), remap=new Uint32Array(n0), out=[];
  for(let i=0;i<n0;i++){
    const x=pa.getX(i), y=pa.getY(i), z=pa.getZ(i), key=Math.round(x*10000)+'_'+Math.round(y*10000)+'_'+Math.round(z*10000);
    let k=map.get(key); if(k===undefined){ k=out.length/3; map.set(key,k); out.push(x,y,z); } remap[i]=k;
  }
  const idx=[], cnt=ix?ix.count:n0;
  for(let i=0;i<cnt;i+=3){
    const a=remap[ix?ix.getX(i):i], b=remap[ix?ix.getX(i+1):i+1], c=remap[ix?ix.getX(i+2):i+2];
    if(a!==b&&b!==c&&a!==c) idx.push(a,b,c);
  }
  return {pos:new Float32Array(out),idx:idx};
}

/* naive surface nets: turns a signed distance function into a watertight triangle mesh */
function scSurfaceNets(sdf,x0,y0,z0,nx,ny,nz,h){
  const F=new Float32Array(nx*ny*nz), id=(i,j,k)=>i+nx*(j+ny*k);
  for(let k=0;k<nz;k++) for(let j=0;j<ny;j++) for(let i=0;i<nx;i++) F[id(i,j,k)]=sdf(x0+i*h,y0+j*h,z0+k*h);
  const cx=nx-1, cy=ny-1, cz=nz-1, vid=new Int32Array(cx*cy*cz).fill(-1), pos=[], ci=(i,j,k)=>i+cx*(j+cy*k);
  const E=[[0,0,0,1,0,0],[0,1,0,1,1,0],[0,0,1,1,0,1],[0,1,1,1,1,1],[0,0,0,0,1,0],[1,0,0,1,1,0],[0,0,1,0,1,1],[1,0,1,1,1,1],[0,0,0,0,0,1],[1,0,0,1,0,1],[0,1,0,0,1,1],[1,1,0,1,1,1]];
  for(let k=0;k<cz;k++) for(let j=0;j<cy;j++) for(let i=0;i<cx;i++){
    let mx=0,my=0,mz=0,c=0;
    for(let e=0;e<12;e++){ const q=E[e], a=F[id(i+q[0],j+q[1],k+q[2])], b=F[id(i+q[3],j+q[4],k+q[5])];
      if((a<0)!==(b<0)){ const t=a/(a-b); mx+=q[0]+(q[3]-q[0])*t; my+=q[1]+(q[4]-q[1])*t; mz+=q[2]+(q[5]-q[2])*t; c++; } }
    if(c){ vid[ci(i,j,k)]=pos.length/3; pos.push(x0+(i+mx/c)*h,y0+(j+my/c)*h,z0+(k+mz/c)*h); }
  }
  const idx=[], quad=(a,b,c,d,flip)=>{ if(a<0||b<0||c<0||d<0) return; if(flip) idx.push(a,c,b,a,d,c); else idx.push(a,b,c,a,c,d); };
  for(let k=1;k<nz-1;k++) for(let j=1;j<ny-1;j++) for(let i=1;i<nx-1;i++){
    const f0=F[id(i,j,k)], neg=f0<0;
    if(i<nx-1&&(neg!==(F[id(i+1,j,k)]<0))) quad(vid[ci(i,j-1,k-1)],vid[ci(i,j,k-1)],vid[ci(i,j,k)],vid[ci(i,j-1,k)],!neg);
    if(j<ny-1&&(neg!==(F[id(i,j+1,k)]<0))) quad(vid[ci(i-1,j,k-1)],vid[ci(i-1,j,k)],vid[ci(i,j,k)],vid[ci(i,j,k-1)],!neg);
    if(k<nz-1&&(neg!==(F[id(i,j,k+1)]<0))) quad(vid[ci(i-1,j-1,k)],vid[ci(i,j-1,k)],vid[ci(i,j,k)],vid[ci(i-1,j,k)],!neg);
  }
  return {pos:new Float32Array(pos),idx:idx};
}
function scPersonSdf(){
  const cap=(px,py,pz,ax,ay,az,bx,by,bz,r)=>{ const pax=px-ax,pay=py-ay,paz=pz-az,bax=bx-ax,bay=by-ay,baz=bz-az; let t=(pax*bax+pay*bay+paz*baz)/(bax*bax+bay*bay+baz*baz); t=t<0?0:t>1?1:t; return Math.hypot(pax-bax*t,pay-bay*t,paz-baz*t)-r; };
  const ell=(px,py,pz,cx,cy,cz,rx,ry,rz)=>{ const q=Math.hypot((px-cx)/rx,(py-cy)/ry,(pz-cz)/rz); return (q-1)*Math.min(rx,ry,rz); };
  const smin=(a,b,k)=>{ const h=Math.max(k-Math.abs(a-b),0)/k; return Math.min(a,b)-h*h*k*.25; };
  return (x,y,z)=>{
    const sx=Math.abs(x), sgn=x<0?-1:1; let d=ell(x,y,z,0,1.63,.012,.092,.118,.108);
    d=smin(d,cap(sx,y,z,0,1.5,.0,0,1.57,.005,.05),.04);
    d=smin(d,ell(x,y,z,0,1.34,0,.165,.19,.105),.06); d=smin(d,ell(x,y,z,0,1.12,0,.14,.17,.095),.06); d=smin(d,ell(x,y,z,0,.94,.004,.158,.12,.108),.06);
    d=smin(d,cap(sx,y,z,.2,1.43,0,.285,1.16,0,.046),.035); d=smin(d,cap(sx,y,z,.285,1.16,0,.335,.91,.02,.038),.03); d=smin(d,ell(sx,y,z,.345,.83,.025,.032,.075,.022),.025);
    d=smin(d,cap(sx,y,z,.1,.93,0,.105,.5,.012,.07),.03); d=smin(d,cap(sx,y,z,.105,.5,.012,.1,.09,0,.05),.03); d=smin(d,ell(sx,y,z,.1,.045,.06,.048,.042,.115),.02);
    return d;
  };
}
function scPersonBase(size,detail){
  const h=SC_PERSON_H[detail]||.021, k=size[1]/1.75, x0=-.52, y0=-.03, z0=-.22, nx=Math.ceil(1.04/h)+1, ny=Math.ceil(1.84/h)+1, nz=Math.ceil(.52/h)+1;
  const m=scSurfaceNets(scPersonSdf(),x0,y0,z0,nx,ny,nz,h), p=m.pos;
  for(let i=0;i<p.length;i+=3){ p[i]*=k; p[i+1]=(p[i+1]-.875)*k; p[i+2]*=k; }
  return {pos:p,idx:m.idx,half:[.52*k,.875*k,.26*k],flat:false};
}
const SC_HEAD_F=[[0,-.12,1,.2,.26],[.38,.30,.9,.2,.08],[.38,.12,.93,.13,-.1],[.6,-.15,.75,.25,.06],[0,-.42,.9,.17,-.05],[0,-.78,.65,.22,.09],[1,0,-.1,.17,.22]]
  .reduce((a,f)=>{ const l=Math.hypot(f[0],f[1],f[2]); const c=[f[0]/l,f[1]/l,f[2]/l]; a.push([c[0],c[1],c[2],f[3],f[4]]); if(Math.abs(c[0])>.01) a.push([-c[0],c[1],c[2],f[3],f[4]]); return a; },[]);
function scBase(shape,size,detail){
  if(shape==='person') return scPersonBase(size,detail);
  if(shape==='realhead') return scRealHeadBase(size,detail);
  if(shape==='jesvin') return scJesvinBase(detail);
  const sx=size[0]/2, sy=size[1]/2, sz=size[2]/2;
  if(shape==='terrain'){
    const seg=SC_GRID[detail]||80, g=new THREE.PlaneGeometry(size[0],size[2],seg,seg); g.rotateX(-Math.PI/2);
    const w=scWeld(g); return {pos:w.pos,idx:w.idx,half:[sx,Math.max(.5,Math.max(sx,sz)*.2),sz],flat:true};
  }
  const w=scWeld(new THREE.IcosahedronGeometry(1,SC_DETAIL[detail]||22)), p=w.pos;
  for(let i=0;i<p.length;i+=3){
    let x=p[i], y=p[i+1], z=p[i+2];
    if(shape==='block'){
      const e=.4; x=Math.sign(x)*Math.pow(Math.abs(x),e); y=Math.sign(y)*Math.pow(Math.abs(y),e); z=Math.sign(z)*Math.pow(Math.abs(z),e);
    } else if(shape==='body'){
      const sh=1+.35*scSstep(.1,.7,y);
      y=Math.sign(y)*Math.pow(Math.abs(y),.5); x*=sh;
    } else if(shape==='head'){
      const dx=x, dy=y, dz=z; let rr=1;
      for(let k=0;k<SC_HEAD_F.length;k++){
        const f=SC_HEAD_F[k], ex=dx-f[0], ey=dy-f[1], ez=dz-f[2];
        rr+=f[4]*Math.exp(-(ex*ex+ey*ey+ez*ez)/(2*f[3]*f[3]));
      }
      x*=rr; y*=rr; z*=rr;
      const t=clamp(-y,0,1);
      x*=1-.3*t*t; z*=1-.12*t; if(z>0) z+=.06*t*t;
    }
    p[i]=x*sx; p[i+1]=y*sy; p[i+2]=z*sz;
  }
  return {pos:p,idx:w.idx,half:[sx,sy,sz],flat:false};
}
function scAdj(n,idx){
  const cnt=new Int32Array(n+1); for(let t=0;t<idx.length;t++) cnt[idx[t]]+=2;
  const st=new Int32Array(n+1); for(let i=0;i<n;i++) st[i+1]=st[i]+cnt[i];
  const fill=st.slice(0,n), raw=new Int32Array(st[n]);
  for(let t=0;t<idx.length;t+=3){ const a=idx[t],b=idx[t+1],c=idx[t+2]; raw[fill[a]++]=b; raw[fill[a]++]=c; raw[fill[b]++]=c; raw[fill[b]++]=a; raw[fill[c]++]=a; raw[fill[c]++]=b; }
  const start=new Int32Array(n+1), list=new Int32Array(st[n]); let w=0;
  for(let v=0;v<n;v++){ start[v]=w; const s0=w; for(let q=st[v];q<st[v+1];q++){ const u=raw[q]; let d=false; for(let k=s0;k<w;k++) if(list[k]===u){ d=true; break; } if(!d) list[w++]=u; } }
  start[n]=w; return {start:start,list:list.slice(0,w)};
}
function scEncode(arr){
  const n=arr.length, b=new Uint8Array(n*2), dv=new DataView(b.buffer);
  for(let i=0;i<n;i++) dv.setInt16(i*2,clamp(Math.round(arr[i]*1000),-32767,32767),true);
  let s=''; for(let i=0;i<b.length;i+=8192) s+=String.fromCharCode.apply(null,b.subarray(i,i+8192));
  return btoa(s);
}
function scDecode(str){
  const s=atob(str), n=s.length>>1, out=new Float32Array(n);
  for(let i=0;i<n;i++){ let v=s.charCodeAt(2*i)|(s.charCodeAt(2*i+1)<<8); if(v>32767) v-=65536; out[i]=v/1000; }
  return out;
}
/* ---------- topology, paint, undo snapshots, detail refinement ---------- */
const SC_CACHE={}; const SC_MAXV=300000, SCK=67108864;
const SC_DYNK={coarse:.26,fine:.15,finest:.085};
const SC_L2S=new Float32Array(256); for(let i=0;i<256;i++){ const c=i/255; SC_L2S[i]=c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4); }
function scHexRgb(h){ const m=/^#?([0-9a-f]{6})$/i.exec(h||''); const v=m?parseInt(m[1],16):0xb9a68e; return [(v>>16)&255,(v>>8)&255,v&255]; }
function scU8toB64(u){ let s=''; for(let i=0;i<u.length;i+=8192) s+=String.fromCharCode.apply(null,u.subarray(i,i+8192)); return btoa(s); }
function scB64toU8(b){ const s=atob(b), u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u; }
function scColor1(sc,v){ const col=sc.geo.attributes.color.array, p=sc.paint, k=sc.mask?1-.8*sc.mask[v]:1, j=v*3;
  if(p){ col[j]=SC_L2S[p[j]]*k; col[j+1]=SC_L2S[p[j+1]]*k; col[j+2]=SC_L2S[p[j+2]]*k; } else { col[j]=k; col[j+1]=k; col[j+2]=k; } }
function scColors(sc,noMask){ const m=sc.mask; if(noMask) sc.mask=null; for(let v=0;v<sc.n;v++) scColor1(sc,v); sc.mask=m; sc.geo.attributes.color.needsUpdate=true; }
function scMatSync(sc){
  if(!sc.mesh) return; const m=sc.mesh.userData.mat0||sc.mesh.material;
  if(sc.paint){ if(!sc.white){ m.color.setRGB(1,1,1); sc.white=true; } }
  else if(sc.white){ m.color.copy(lin((sc.specRef&&sc.specRef.color)||'#b9a68e')); sc.white=false; }
}
function scSetTopo(sc,pos,idx,paint,mask){
  const n=pos.length/3, old=sc.geo;
  sc.pos=pos; sc.idx=idx; sc.n=n; sc.paint=paint||null; sc.mask=mask||null;
  const geo=new THREE.BufferGeometry(), pa=new THREE.BufferAttribute(pos,3); pa.setUsage(THREE.DynamicDrawUsage);
  const ca=new THREE.BufferAttribute(new Float32Array(n*3),3); ca.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position',pa); geo.setAttribute('color',ca);
  geo.setIndex(n>65535?new THREE.Uint32BufferAttribute(idx,1):new THREE.Uint16BufferAttribute(idx,1));
  geo.computeVertexNormals(); geo.getAttribute('normal').setUsage(THREE.DynamicDrawUsage); geo.computeBoundingSphere(); geo.computeBoundingBox();
  sc.geo=geo; sc.adj=scAdj(n,idx); sc.tmpI=new Int32Array(n); sc.tmpW=new Float32Array(n); sc.tmpP=new Float32Array(n*3); sc.tmpD=new Float32Array(n*3); sc.tmpMark=new Uint8Array(n); sc.candI=new Int32Array(n);
  scColors(sc);
  if(sc.mesh){ sc.mesh.geometry=geo; if(old&&old!==geo) old.dispose(); scMatSync(sc); }
  scCountSync(sc);
}
function scCountSync(sc){ const el=document.getElementById('scCount'); if(el&&sc) el.textContent='Points: '+sc.n.toLocaleString()+' of '+SC_MAXV.toLocaleString()+' max'+(sc.idx!==sc.baseIdx?' (detail added)':''); }
function scSnap(sc){ const s=sc.pos.slice(); s.mask=scMaskSnap(sc); s.idx=sc.idx; s.paint=sc.paint?sc.paint.slice():null; return s; }
function scUndoDepth(sc){ return clamp(Math.floor(2.4e7/(sc.n*3+1)),6,25); }
function scPushSnap(sc,s){ sc.undo.push(s); while(sc.undo.length>scUndoDepth(sc)) sc.undo.shift(); sc.redo.length=0; sc.dirty=true; }
function scRestore(sc,s){
  if(s.idx!==sc.idx||s.length!==sc.pos.length) scSetTopo(sc,s.slice(),s.idx,s.paint?s.paint.slice():null,s.mask?s.mask.slice():null);
  else { sc.pos.set(s); sc.paint=s.paint?s.paint.slice():null; if(s.mask!==undefined) sc.mask=s.mask?s.mask.slice():null; scColors(sc); scMatSync(sc); }
  scUpdate(sc); sc.dirty=true;
}
function scPaintInit(sc){ const c=scHexRgb((sc.specRef&&sc.specRef.color)||'#b9a68e'), p=new Uint8Array(sc.n*3); for(let i=0;i<p.length;i+=3){ p[i]=c[0]; p[i+1]=c[1]; p[i+2]=c[2]; } sc.paint=p; scMatSync(sc); }
let scCapWarned=false;
/* split long edges inside a sphere: new points sit on a smooth curve through the old ones */
function scRefine(sc,px,py,pz,r,L){
  const L2=L*L, r2=r*r, idx=sc.idx, T=idx.length/3, pos=sc.pos, n=sc.n, split=new Map(), ea=[]; let nn=n, capped=false;
  const d2=(A,B)=>{ const x=pos[A]-pos[B], y=pos[A+1]-pos[B+1], z=pos[A+2]-pos[B+2]; return x*x+y*y+z*z; };
  for(let t=0;t<T;t++){
    const a=idx[t*3], b=idx[t*3+1], c=idx[t*3+2], A=a*3, B=b*3, C=c*3;
    if(r2!==Infinity){ const cx=(pos[A]+pos[B]+pos[C])/3-px, cy=(pos[A+1]+pos[B+1]+pos[C+1])/3-py, cz=(pos[A+2]+pos[B+2]+pos[C+2])/3-pz; if(cx*cx+cy*cy+cz*cz>r2) continue; }
    // Refine every overlong edge, not just the longest edge of each face.
    // Shared-edge keys ensure adjacent triangles reuse the same midpoint, avoiding T-junctions.
    const edges=[[a,b,d2(A,B)],[b,c,d2(B,C)],[c,a,d2(C,A)]];
    for(let e=0;e<3;e++){
      const u=edges[e][0], v=edges[e][1], m=edges[e][2];
      if(m<L2) continue;
      const key=u<v?u*SCK+v:v*SCK+u; if(split.has(key)) continue;
      if(nn>=SC_MAXV){ capped=true; break; }
      split.set(key,nn++); ea.push(u,v);
    }
    if(capped) break;
  }
  if(capped&&!scCapWarned){ scCapWarned=true; toast('This sculpt reached '+SC_MAXV.toLocaleString()+' points, the most a phone handles smoothly. Detail stops growing here.'); }
  const add=nn-n; if(!add) return false;
  const P=new Float32Array(nn*3); P.set(pos); const nm=sc.geo.attributes.normal.array, touched=new Uint8Array(n);
  const op=sc.paint, PP=op?new Uint8Array(nn*3):null; if(PP) PP.set(op);
  const om=sc.mask, MK=om?new Float32Array(nn):null; if(MK) MK.set(om);
  for(let e=0;e<ea.length;e+=2){
    const ui=ea[e], vi=ea[e+1], u=ui*3, v=vi*3, w=(n+e/2)*3; touched[ui]=1; touched[vi]=1;
    const ex=pos[v]-pos[u], ey=pos[v+1]-pos[u+1], ez=pos[v+2]-pos[u+2];
    const da=nm[u]*ex+nm[u+1]*ey+nm[u+2]*ez, db=nm[v]*ex+nm[v+1]*ey+nm[v+2]*ez;
    let ox=(nm[v]*db-nm[u]*da)/8, oy=(nm[v+1]*db-nm[u+1]*da)/8, oz=(nm[v+2]*db-nm[u+2]*da)/8;
    const ol=Math.hypot(ox,oy,oz), el=Math.hypot(ex,ey,ez); if(ol>el*.2){ const s=el*.2/ol; ox*=s; oy*=s; oz*=s; }
    P[w]=(pos[u]+pos[v])/2+ox; P[w+1]=(pos[u+1]+pos[v+1])/2+oy; P[w+2]=(pos[u+2]+pos[v+2])/2+oz;
    if(PP){ PP[w]=(op[u]+op[v])>>1; PP[w+1]=(op[u+1]+op[v+1])>>1; PP[w+2]=(op[u+2]+op[v+2])>>1; }
    if(MK) MK[n+e/2]=(om[ui]+om[vi])/2;
  }
  const out=new Uint32Array((T+2*add)*3); let o=0;
  const g=(x,y)=>split.get(x<y?x*SCK+y:y*SCK+x);
  for(let t=0;t<T;t++){
    const a=idx[t*3], b=idx[t*3+1], c=idx[t*3+2];
    if(touched[a]+touched[b]+touched[c]<2){ out[o++]=a; out[o++]=b; out[o++]=c; continue; }
    const mab=g(a,b), mbc=g(b,c), mca=g(c,a), k=(mab!==undefined)+(mbc!==undefined)+(mca!==undefined);
    const put=(x,y,z)=>{ out[o++]=x; out[o++]=y; out[o++]=z; };
    if(!k) put(a,b,c);
    else if(k===3){ put(a,mab,mca); put(mab,b,mbc); put(mca,mbc,c); put(mab,mbc,mca); }
    else if(k===1){ if(mab!==undefined){ put(a,mab,c); put(mab,b,c); } else if(mbc!==undefined){ put(b,mbc,a); put(mbc,c,a); } else { put(c,mca,b); put(mca,a,b); } }
    else if(mca===undefined){ put(mab,b,mbc); put(a,mab,mbc); put(a,mbc,c); }
    else if(mab===undefined){ put(mbc,c,mca); put(b,mbc,mca); put(b,mca,a); }
    else { put(mca,a,mab); put(c,mca,mab); put(c,mab,b); }
  }
  scSetTopo(sc,P,out.slice(0,o),PP,MK);
  return true;
}
function scMeanEdge(sc){ const idx=sc.idx, pos=sc.pos, T=idx.length/3, step=Math.max(1,Math.floor(T/4000)); let s=0,c=0;
  for(let t=0;t<T;t+=step){ const a=idx[t*3]*3, b=idx[t*3+1]*3; s+=Math.hypot(pos[a]-pos[b],pos[a+1]-pos[b+1],pos[a+2]-pos[b+2]); c++; } return c?s/c:.01; }
function scDetailAll(){
  const n=sculptTarget(); if(!n){ toast('Select a sculpt object first.'); return; } const sc=n.userData.sc; scEnd();
  if(sc.n*3.6>SC_MAXV){ toast('Too many points already ('+sc.n.toLocaleString()+'). Use the Detail brush to add detail only where you need it.'); return; }
  scPushSnap(sc,scSnap(sc)); const L=scMeanEdge(sc)*.7; scRefine(sc,0,0,0,Infinity,L); scRefine(sc,0,0,0,Infinity,L);
  scUpdate(sc); sc.dirty=true; queueSave(); toast('Detail added everywhere: now '+sc.n.toLocaleString()+' points.');
}
/* ---------- paint helpers ---------- */
function scPaintTarget(){ const n=sculptTarget(); if(!n){ toast('Select a sculpt object first.'); return null; } scEnd(); return n.userData.sc; }
function scPaintFill(){ const sc=scPaintTarget(); if(!sc) return; scPushSnap(sc,scSnap(sc)); if(!sc.paint) scPaintInit(sc); const c=scHexRgb(SCU.pcol), p=sc.paint, pos=sc.pos, j0=SCU.pjit;
  for(let v=0;v<sc.n;v++){ const j=v*3; let q=1; if(j0>0){ const hs=Math.sin(pos[j]*127.1+pos[j+1]*311.7+pos[j+2]*74.7)*43758.5453; q=1+(hs-Math.floor(hs)-.5)*j0*.6; } p[j]=clamp(Math.round(c[0]*q),0,255); p[j+1]=clamp(Math.round(c[1]*q),0,255); p[j+2]=clamp(Math.round(c[2]*q),0,255); }
  scColors(sc); queueSave(); toast('Whole object painted.'); }
function scPaintClear(){ const sc=scPaintTarget(); if(!sc) return; if(!sc.paint){ toast('There is no paint on this object.'); return; } scPushSnap(sc,scSnap(sc)); sc.paint=null; scColors(sc); scMatSync(sc); queueSave(); toast('Paint removed. Undo brings it back.'); }
function scCavity(){
  const sc=scPaintTarget(); if(!sc) return; scPushSnap(sc,scSnap(sc)); if(!sc.paint) scPaintInit(sc);
  const n=sc.n, pos=sc.pos, nm=sc.geo.attributes.normal.array, st=sc.adj.start, ls=sc.adj.list; let cav=new Float32Array(n);
  for(let v=0;v<n;v++){ const a=st[v], b=st[v+1]; if(b<=a) continue; let x=0,y=0,z=0,l=0; const j=v*3;
    for(let q=a;q<b;q++){ const u=ls[q]*3; x+=pos[u]; y+=pos[u+1]; z+=pos[u+2]; l+=Math.hypot(pos[u]-pos[j],pos[u+1]-pos[j+1],pos[u+2]-pos[j+2]); }
    const m=b-a; cav[v]=((x/m-pos[j])*nm[j]+(y/m-pos[j+1])*nm[j+1]+(z/m-pos[j+2])*nm[j+2])/((l/m)||1); }
  for(let it=0;it<2;it++){ const o=cav.slice(); for(let v=0;v<n;v++){ let s=o[v],m=1; for(let q=st[v];q<st[v+1];q++){ s+=o[ls[q]]; m++; } cav[v]=s/m; } }
  const p=sc.paint, k=SCU.dirt; for(let v=0;v<n;v++){ const c=cav[v]*6, f=c>0?1-k*Math.min(1,c):1+k*.35*Math.min(1,-c); const j=v*3; p[j]=clamp(Math.round(p[j]*f),0,255); p[j+1]=clamp(Math.round(p[j+1]*f),0,255); p[j+2]=clamp(Math.round(p[j+2]*f),0,255); }
  scColors(sc); queueSave(); toast('Crevices darkened and edges lightened. Undo if it is too strong.');
}
/* ---------- clay view ---------- */
const SC_MATCAPS={clay:{n:'Clay',base:[.78,.66,.58],spec:.25,rim:.35,warm:.1},skin:{n:'Skin',base:[.86,.62,.5],spec:.35,rim:.45,warm:.35},grey:{n:'Studio grey',base:[.72,.72,.74],spec:.4,rim:.3,warm:0},wax:{n:'Red wax',base:[.62,.2,.16],spec:.55,rim:.4,warm:.2},white:{n:'White marble',base:[.9,.89,.86],spec:.5,rim:.25,warm:.05}};
const scMatcapCache={}; let scMatcapMat=null;
function scMatcap(kind){ kind=SC_MATCAPS[kind]?kind:'clay'; if(scMatcapCache[kind]) return (scMatcapMat=scMatcapCache[kind]); const M=SC_MATCAPS[kind], S2=256, c=document.createElement('canvas'); c.width=c.height=S2; const g=c.getContext('2d'), im=g.createImageData(S2,S2);
  const L1=[-.45,.55,.7], L2=[.65,.05,.55], nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2]); return v.map(x=>x/l); }; const l1=nrm(L1), l2=nrm(L2), H1=nrm([l1[0],l1[1],l1[2]+1]);
  for(let j=0;j<S2;j++) for(let i=0;i<S2;i++){ const x=(i+.5)/S2*2-1, y=1-(j+.5)/S2*2, rr=x*x+y*y, o=(j*S2+i)*4; if(rr>1){ im.data[o+3]=255; continue; } const z=Math.sqrt(1-rr);
    const d1=Math.max(0,x*l1[0]+y*l1[1]+z*l1[2]), d2=Math.max(0,x*l2[0]+y*l2[1]+z*l2[2]), wrap=Math.max(0,(x*l1[0]+y*l1[1]+z*l1[2]+.4)/1.4), sp=Math.pow(Math.max(0,x*H1[0]+y*H1[1]+z*H1[2]),40)*M.spec, rim=Math.pow(1-z,3)*M.rim, amb=.16+.1*y;
    for(let k=0;k<3;k++){ const w=k===0?M.warm:k===1?M.warm*.35:0, v=M.base[k]*(amb+d1*.78+d2*.22+(wrap-d1)*w)+sp+rim*(.6+.4*M.base[k]); im.data[o+k]=Math.max(0,Math.min(255,Math.pow(Math.max(0,v),1/1.15)*255)); } im.data[o+3]=255; }
  g.putImageData(im,0,0); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; const m=new THREE.MeshMatcapMaterial({matcap:t,vertexColors:true}); scMatcapCache[kind]=m; return (scMatcapMat=m); }
function scMatcapSync(force){ const want=!force&&SCU.on&&SCU.matcap&&S.view==='free'&&!S.recording;
  nodes.forEach(nd=>{ const sc=nd.userData&&nd.userData.sc; if(!sc||!sc.mesh) return; const m=sc.mesh;
    if(want){ const mc=scMatcap(SCU.mcap); if(!m.userData.mat0) m.userData.mat0=m.material; if(m.material!==mc){ m.material=mc; mc.wireframe=!!SCU.wire; } }
    else if(!want&&m.userData.mat0){ m.material=m.userData.mat0; delete m.userData.mat0; } }); }
/* ---------- saving big sculpts in the browser database ---------- */
let scDbP=null;
function scIdb(){ if(scDbP) return scDbP; scDbP=new Promise(res=>{ try{ const r=indexedDB.open('slate-sculpt',1); r.onupgradeneeded=()=>r.result.createObjectStore('m'); r.onsuccess=()=>res(r.result); r.onerror=()=>res(null); }catch(e){ res(null); } }); return scDbP; }
async function scIdbPut(k,v){ const db=await scIdb(); if(!db) return false; return new Promise(res=>{ try{ const tx=db.transaction('m','readwrite'); tx.objectStore('m').put(v,k); tx.oncomplete=()=>res(true); tx.onerror=()=>res(false); }catch(e){ res(false); } }); }
async function scIdbGet(k){ const db=await scIdb(); if(!db) return null; return new Promise(res=>{ try{ const q=db.transaction('m','readonly').objectStore('m').get(k); q.onsuccess=()=>res(q.result||null); q.onerror=()=>res(null); }catch(e){ res(null); } }); }
function scReplaceNode(id){ const old=nodes.get(id); if(!old) return; const was=S.sel===id; if(was) tc.detach();
  const nn=makeNode(old.userData.spec); scene.remove(old); old.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); scene.add(nn); nodes.set(id,nn); if(was) selectId(id); }
async function scIdbRestore(){
  const ids=order.filter(id=>{ const n=nodes.get(id), sp=n&&n.userData.spec; return sp&&sp.type==='sculpt'&&sp.dyn; });
  for(const id of ids){ const sp=nodes.get(id).userData.spec, key=sp.dynKey||id; if(SC_CACHE[key]) continue;
    const v=await scIdbGet(key); if(v&&v.pos&&v.idx){ SC_CACHE[key]=v; try{ scReplaceNode(id); }catch(e){} } }
}
/* ---------- anatomical head base (meters, +z = face, +y = up) ---------- */
function scHeadSdf(noCut){
  const cap=(px,py,pz,ax,ay,az,bx,by,bz,r)=>{ const pax=px-ax,pay=py-ay,paz=pz-az,bax=bx-ax,bay=by-ay,baz=bz-az; let t=(pax*bax+pay*bay+paz*baz)/(bax*bax+bay*bay+baz*baz); t=t<0?0:t>1?1:t; return Math.hypot(pax-bax*t,pay-bay*t,paz-baz*t)-r; };
  const ell=(px,py,pz,cx,cy,cz,rx,ry,rz)=>{ const q=Math.hypot((px-cx)/rx,(py-cy)/ry,(pz-cz)/rz); return (q-1)*Math.min(rx,ry,rz); };
  const smin=(a,b,k)=>{ const h=Math.max(k-Math.abs(a-b),0)/k; return Math.min(a,b)-h*h*k*.25; };
  const smax=(a,b,k)=>-smin(-a,-b,k);
  return (x,y,z)=>{
    const sx=Math.abs(x);
    let d=ell(x,y,z,0,.03,-.012,.074,.088,.097);                         /* cranium */
    d=smin(d,ell(x,y,z,0,.036,.032,.067,.068,.064),.025);                /* forehead */
    d=smin(d,ell(x,y,z,0,-.028,.038,.062,.06,.058),.03);                 /* mid face */
    d=smin(d,ell(sx,y,z,.044,-.04,.035,.028,.034,.038),.03);             /* cheeks */
    d=smin(d,ell(sx,y,z,.05,-.008,.05,.021,.014,.028),.03);              /* cheekbones */
    d=smin(d,cap(sx,y,z,.058,-.035,-.01,.036,-.09,.05,.016),.035);      /* jaw */
    d=smin(d,ell(x,y,z,0,-.1,.07,.024,.019,.02),.03);                    /* chin */
    d=smin(d,ell(x,y,z,0,-.06,.074,.033,.03,.031),.025);                 /* mouth mound */
    d=smin(d,cap(sx,y,z,.044,.022,.083,.012,.027,.095,.0075),.016);     /* brow ridge */
    d=smax(d,-ell(sx,y,z,.033,.006,.1,.02,.014,.02),.012);               /* eye sockets */
    d=smin(d,ell(sx,y,z,.033,.004,.086,.0122,.0122,.0122),.003);         /* eyeballs */
    d=smin(d,cap(sx,y,z,.024,.0135,.0935,.042,.0135,.0905,.0026),.005);  /* upper lids */
    d=smin(d,cap(sx,y,z,.025,-.0065,.0925,.041,-.006,.0895,.0022),.005); /* lower lids */
    d=smin(d,cap(x,y,z,0,.006,.097,0,-.033,.117,.0075),.014);             /* nose bridge */
    d=smin(d,ell(x,y,z,0,-.039,.116,.011,.0095,.011),.009);               /* nose tip */
    d=smin(d,ell(sx,y,z,.0135,-.043,.105,.0085,.0072,.009),.007);        /* nostril wings */
    d=smax(d,-ell(sx,y,z,.0075,-.049,.108,.0038,.002,.0048),.002);       /* nostrils */
    d=smin(d,ell(x,y,z,0,-.064,.101,.022,.006,.0095),.007);               /* upper lip */
    d=smin(d,ell(x,y,z,0,-.076,.098,.019,.007,.01),.007);                 /* lower lip */
    d=smax(d,-ell(x,y,z,0,-.0695,.106,.024,.0011,.012),.002);            /* mouth line */
    d=smax(d,-ell(x,y,z,0,-.053,.108,.0032,.0055,.0028),.004);           /* philtrum groove */
    d=smin(d,ell(sx,y,z,.077,-.004,-.006,.009,.031,.019),.008);          /* ears */
    d=smax(d,-ell(sx,y,z,.084,-.006,-.004,.004,.02,.011),.004);          /* ear bowl */
    d=smin(d,cap(x,y,z,0,-.06,-.03,0,-.15,-.012,.052),.035);             /* neck */
    d=smin(d,cap(x,y,z,0,-.095,.018,0,-.15,.012,.024),.03);               /* throat */
    if(!noCut) d=Math.max(d,-(y+.185));                                  /* flat cut under the neck */
    return d;
  };
}
function scRealHeadBase(size,detail){
  const H={low:.0042,medium:.0031,high:.0023,ultra:.0017}[detail]||.0031, B=[.2,.34,.27], x0=-.1, y0=-.2, z0=-.13;
  const m=scSurfaceNets(scHeadSdf(),x0,y0,z0,Math.ceil(B[0]/H)+1,Math.ceil(B[1]/H)+1,Math.ceil(B[2]/H)+1,H), p=m.pos, k=[size[0]/B[0],size[1]/B[1],size[2]/B[2]];
  for(let i=0;i<p.length;i+=3){ p[i]*=k[0]; p[i+1]=(p[i+1]+.03)*k[1]; p[i+2]*=k[2]; }
  return {pos:p,idx:m.idx,half:[.1*k[0],.17*k[1],.135*k[2]],flat:false};
}
/* ---------- sculpted Jesvin: one full-body mesh from his character sheet ---------- */
const SCJ_COL={skin:'#8e5f44',lip:'#80473f',hair:'#16100c',beard:'#1c140f',brow:'#140e0b',eyeW:'#d9d0c3',iris:'#2a1a12',hood:'#4d4a2c',hoodD:'#433f25',string:'#3a3720',jeans:'#4b628a',jeansD:'#3f5478',shoe:'#ebe7de',sole:'#d6ccb9',accent:'#4f5f3d',bag:'#5f7247',bagD:'#4f603a',zip:'#202020'};
function scJesvinSdf(){
  const head=scHeadSdf(true);
  const cap=(px,py,pz,ax,ay,az,bx,by,bz,r)=>{ const pax=px-ax,pay=py-ay,paz=pz-az,bax=bx-ax,bay=by-ay,baz=bz-az; let t=(pax*bax+pay*bay+paz*baz)/(bax*bax+bay*bay+baz*baz); t=t<0?0:t>1?1:t; return Math.hypot(pax-bax*t,pay-bay*t,paz-baz*t)-r; };
  const ell=(px,py,pz,cx,cy,cz,rx,ry,rz)=>{ const q=Math.hypot((px-cx)/rx,(py-cy)/ry,(pz-cz)/rz); return (q-1)*Math.min(rx,ry,rz); };
  const smin=(a,b,k)=>{ const h=Math.max(k-Math.abs(a-b),0)/k; return Math.min(a,b)-h*h*k*.25; };
  const smax=(a,b,k)=>-smin(-a,-b,k);
  const HY=1.6, HZ=.0;
  const parts=(x,y,z)=>{
    const sx=Math.abs(x), hx=x, hy=y-HY, hz=z-HZ, hsx=Math.abs(hx);
    /* skin: head, neck, hands */
    let skin=head(hx,hy,hz);
    skin=smin(skin,cap(x,y,z,0,1.42,-.015,0,1.5,-.02,.056),.03);
    skin=smin(skin,ell(sx,y,z,.345,.795,.028,.029,.068,.022),.012); skin=smin(skin,cap(sx,y,z,.328,.83,.045,.318,.78,.06,.011),.01);
    for(let f=0;f<4;f++){ skin=smin(skin,cap(sx,y,z,.343+f*.004-.006,.745,.03-f*.011+.017,.345+f*.004-.006,.705+f*.004,.033-f*.011+.017,.0075),.006); }
    /* hair: big curly volume above the hairline */
    let hair=ell(hx,hy,hz,0,.055,-.014,.108,.104,.12);
    hair=smax(hair,-(hy-.62*hz-.012),.015);
    const k1=170, cn=Math.sin(hx*k1)*Math.sin(hy*k1*1.13+1.7)*Math.sin(hz*k1*.91+.6)+.5*Math.sin(hx*k1*2.3+2)*Math.sin(hy*k1*2.1)*Math.sin(hz*k1*2.6+1);
    hair-=.0055*cn;
    /* beard and moustache: a shell over the lower face */
    const hd=skin;
    const line=hsx>.062?-.005:hsx>.045?-.03+(hsx-.045)/.017*.025:-.05-(.045-hsx)*.25;      /* beard top edge: sideburns high, cheeks clear */
    let beard=smax(hd-.0042,hy-line,.009); beard=smax(beard,-(hz+.01),.01); beard=smax(beard,-ell(hx,hy,hz,0,-.07,.106,.023,.0095,.03),.003);
    beard=Math.min(beard,ell(hx,hy,hz,0,-.0575,.1045,.026,.0045,.0085));
    beard-=.0006*Math.sin(hx*700)*Math.sin(hy*640+1)*Math.sin(hz*690+2)+.0004*Math.sin(hx*1300+1)*Math.sin(hy*1250);
    const brow=cap(hsx,hy,hz,.044,.025,.088,.014,.03,.099,.0042);
    /* hoodie */
    let hood=ell(x,y,z,0,1.22,0,.172,.25,.118);
    hood=smin(hood,cap(sx,y,z,.06,1.4,-.005,.165,1.375,0,.066),.06);
    hood=smin(hood,ell(x,y,z,0,.985,0,.172,.07,.12),.05);
    hood=smin(hood,cap(sx,y,z,.18,1.37,0,.27,1.12,.01,.06),.03); hood=smin(hood,cap(sx,y,z,.27,1.12,.01,.33,.875,.03,.052),.025);
    hood=smin(hood,ell(sx,y,z,.333,.865,.031,.043,.03,.042),.01);
    hood=smin(hood,cap(x,y,z,-.065,1.45,-.075,.065,1.45,-.075,.04),.04); hood=smin(hood,ell(x,y,z,0,1.43,-.04,.095,.04,.07),.03);
    hood=smax(hood,-cap(x,y,z,0,1.42,0,0,1.6,-.02,.062),.012);
    hood=Math.min(hood,ell(x,y,z,0,1.05,.122,.12,.065,.016));
    hood-=.0009*Math.sin(y*70+x*10)*Math.sin(x*45);   /* fabric folds */
    const strings=Math.min(cap(sx,y,z,.022,1.4,.112,.026,1.31,.128,.0032),ell(sx,y,z,.026,1.305,.128,.005,.008,.005));
    /* jeans */
    let jeans=ell(x,y,z,0,.93,0,.17,.1,.11);
    jeans=smin(jeans,cap(sx,y,z,.095,.9,0,.11,.5,.012,.086),.04); jeans=smin(jeans,cap(sx,y,z,.11,.5,.012,.114,.1,.0,.08),.03);
    jeans-=.0009*Math.sin(y*55+sx*20)*Math.sin(sx*60+z*30);
    /* sneakers */
    const shoe=ell(sx,y,z,.112,.055,.045,.056,.048,.128), sole=ell(sx,y,z,.112,.018,.05,.062,.02,.14);
    /* backpack and straps */
    let bag=ell(x,y,z,0,1.2,-.19,.15,.205,.072); bag=smin(bag,ell(x,y,z,0,1.1,-.255,.11,.085,.026),.015);
    const straps=Math.min(cap(sx,y,z,.085,1.4,-.13,.1,1.44,-.02,.016),Math.min(cap(sx,y,z,.1,1.44,-.02,.11,1.38,.12,.016),cap(sx,y,z,.11,1.38,.12,.115,1.16,.135,.016)));
    bag=Math.min(bag,straps);
    return {skin,hair,beard,brow,hood,strings,jeans,shoe,sole,bag};
  };
  const sdf=(x,y,z)=>{ const p=parts(x,y,z); let d=p.skin; d=smin(d,p.hair,.012); d=Math.min(d,p.beard); d=Math.min(d,p.brow); d=smin(d,p.hood,.012); d=Math.min(d,p.strings); d=smin(d,p.jeans,.015); d=Math.min(d,p.shoe); d=smin(d,p.sole,.006); d=Math.min(d,p.bag); return d; };
  return {sdf,parts,HY,HZ};
}
function scJesvinPaint(J,pos){
  const n=pos.length/3, out=new Uint8Array(n*3), C={}; Object.keys(SCJ_COL).forEach(k=>{ C[k]=scHexRgb(SCJ_COL[k]); });
  for(let v=0;v<n;v++){ const x=pos[v*3], y=pos[v*3+1], z=pos[v*3+2], p=J.parts(x,y,z); let best='skin', bd=1e9;
    for(const k in p){ if(p[k]<bd){ bd=p[k]; best=k; } }
    let c=C[best==='hood'?'hood':best==='strings'?'string':best==='bag'?'bag':best==='shoe'?'shoe':best];
    const hx=x, hy=y-J.HY, hz=z-J.HZ, sx=Math.abs(x);
    if(best==='skin'&&y>1.45){ const ex=Math.abs(hx)-.033, ey=hy-.004, ez=hz-.086, er=Math.hypot(ex,ey,ez);
      if(er<.0135&&hz>.0925){ const fr=Math.hypot(ex,ey); c=fr<.0062?C.iris:C.eyeW; }
      else if(Math.abs(hx)<.024&&hy<-.058&&hy>-.083&&hz>.092) c=C.lip; }
    if(best==='hood'&&Math.abs(y-1.05)<.07&&z>.1&&Math.abs(x)<.125) c=C.hoodD;
    if(best==='hood'&&Math.abs(y-.985)<.04) c=C.hoodD;
    if(best==='jeans'&&(Math.abs(y-.875)<.015||Math.abs(sx-.11)<.004&&z>0)) c=C.jeansD;
    if(best==='shoe'&&Math.abs(sx-.112)>.042&&y<.08&&y>.03) c=C.accent;
    if(best==='bag'&&z<-.255&&(Math.abs(y-1.14)<.004||Math.abs(y-1.07)<.004)) c=C.zip;
    if(best==='bag'&&z<-.24&&y<1.19) c=c===C.zip?c:C.bagD;
    let j=Math.sin(x*917+y*533+z*311)*43758.5453; j-=Math.floor(j); const q=1+(j-.5)*(best==='skin'?.025:.06);
    out[v*3]=Math.max(0,Math.min(255,c[0]*q)); out[v*3+1]=Math.max(0,Math.min(255,c[1]*q)); out[v*3+2]=Math.max(0,Math.min(255,c[2]*q)); }
  return out;
}
function scJesvinBase(detail){
  const J=scJesvinSdf(), h={low:.011,medium:.0085,high:.0072,ultra:.0062}[detail]||.0085, L={low:.0042,medium:.0032,high:.0026,ultra:.0021}[detail]||.0032;
  const x0=-.47, y0=-.012, z0=-.33, m=scSurfaceNets(J.sdf,x0,y0,z0,Math.ceil(.94/h)+1,Math.ceil(1.84/h)+1,Math.ceil(.58/h)+1,h);
  const t={}; scSetTopo(t,m.pos,Uint32Array.from(m.idx),null,null);
  const proj=()=>{ const p=t.pos, e=.0004; for(let v=0;v<t.n;v++){ const j=v*3; if(p[j+1]<1.42) continue;
    for(let it=0;it<2;it++){ const x=p[j],y=p[j+1],z=p[j+2], d=J.sdf(x,y,z); if(Math.abs(d)<1e-5) break; const gx=J.sdf(x+e,y,z)-J.sdf(x-e,y,z), gy=J.sdf(x,y+e,z)-J.sdf(x,y-e,z), gz=J.sdf(x,y,z+e)-J.sdf(x,y,z-e), gl=Math.hypot(gx,gy,gz)||1;
      const s=Math.max(-.004,Math.min(.004,d)); p[j]-=gx/gl*s; p[j+1]-=gy/gl*s; p[j+2]-=gz/gl*s; } } };
  for(let pass=0;pass<4;pass++){ if(!scRefine(t,0,J.HY+.02,.01,.17,L)) break; proj(); scUpdate(t); }
  const paint=scJesvinPaint(J,t.pos), pos=t.pos, idx=t.idx; t.geo.dispose();
  for(let i=1;i<pos.length;i+=3) pos[i]-=.91;
  return {pos:pos,idx:idx,half:[.47,.91,.29],flat:false,paint:paint};
}
function scJesvinGlasses(g){
  const fm=new THREE.MeshStandardMaterial({color:0x3a3a3c,roughness:.35,metalness:.8}), lm=new THREE.MeshStandardMaterial({color:0xddeeff,roughness:.05,transparent:true,opacity:.14,depthWrite:false});
  const y=1.604-.91, z=.106, r=.0165;
  [1,-1].forEach(s=>{ const x=s*.034; const rim=new THREE.Mesh(new THREE.TorusGeometry(r,.0011,6,32),fm); rim.position.set(x,y,z); g.add(rim);
    const ln=new THREE.Mesh(new THREE.CircleGeometry(r,24),lm); ln.position.set(x,y,z); g.add(ln);
    const a=new THREE.Vector3(x+s*r,y+.002,z-.002), b=new THREE.Vector3(s*.079,y+.004,.005), d=b.clone().sub(a), tp=new THREE.Mesh(new THREE.CylinderGeometry(.0011,.0011,d.length(),6),fm);
    tp.position.copy(a).add(b).multiplyScalar(.5); tp.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()); g.add(tp); });
  const br=new THREE.Mesh(new THREE.CylinderGeometry(.001,.001,.068-2*r,6),fm); br.rotation.z=Math.PI/2; br.position.set(0,y+.004,z+.002); g.add(br);
}
function scMake(spec){
  const shape=SC_SHAPES[spec.shape]?spec.shape:'ball';
  const size=(Array.isArray(spec.size)&&spec.size.length>=3?spec.size:SC_SHAPES[shape].size).map(Number);
  const detail=SC_DETAIL[spec.detail]?spec.detail:'medium';
  const base=scBase(shape,size,detail), sc={base:base.pos,baseIdx:Uint32Array.from(base.idx),half:base.half,ref:Math.max(base.half[0],base.half[1],base.half[2]),flat:!!base.flat,undo:[],redo:[],dirty:false,specRef:spec};
  const ck=spec.dyn&&SC_CACHE[spec.dynKey||spec.id];
  if(ck){ scSetTopo(sc,new Float32Array(ck.pos),ck.idx,ck.paint?new Uint8Array(ck.paint):null,null); return sc; }
  const pos=new Float32Array(base.pos);
  if(spec.data){ try{ const q=scDecode(spec.data); if(q.length===pos.length) pos.set(q); }catch(e){} }
  let paint=base.paint||null; if(spec.paint){ try{ const pb=scB64toU8(spec.paint); if(pb.length===pos.length) paint=pb; }catch(e){} }
  scSetTopo(sc,pos,sc.baseIdx,paint,null);
  return sc;
}
function buildSculpt(spec){
  const g=new THREE.Group(), sc=scMake(spec);
  const mat=std(spec.color||'#b9a68e',spec.rough==null?.85:spec.rough,spec.metal||0);
  if(spec.shape==='terrain') mat.side=THREE.DoubleSide;
  mat.vertexColors=true; const mesh=new THREE.Mesh(sc.geo,mat); mesh.castShadow=true; mesh.receiveShadow=true; mesh.userData.paint=true;
  sc.mesh=mesh; scMatSync(sc); g.add(mesh); g.userData.sc=sc; if(spec.shape==='jesvin'){ mat.roughness=.75; scJesvinGlasses(g); }
  return g;
}
function sculptFlush(){
  order.forEach(id=>{ const n=nodes.get(id), sc=n&&n.userData&&n.userData.sc, sp=n&&n.userData&&n.userData.spec; if(!(sc&&sp&&sc.dirty)) return; sc.dirty=false; sc.specRef=sp;
    if(sc.idx!==sc.baseIdx){ const key=sp.id, v={pos:sc.pos.slice(),idx:sc.idx,paint:sc.paint?sc.paint.slice():null}; sp.dyn=true; sp.dynKey=key; delete sp.data; delete sp.paint; SC_CACHE[key]=v; scIdbPut(key,v); }
    else { delete sp.dyn; delete sp.dynKey; sp.data=scEncode(sc.pos); if(sc.paint) sp.paint=scU8toB64(sc.paint); else delete sp.paint; } });
}
function scUpdate(sc){
  const g=sc.geo; g.attributes.position.needsUpdate=true; g.computeVertexNormals(); g.attributes.normal.needsUpdate=true; g.computeBoundingSphere(); g.computeBoundingBox();
}

/* ---------- brushes ---------- */
let _scCand=null, _scCandN=0;
function scCandidates(sc,px,py,pz,r){ const pos=sc.pos, out=sc.candI, r2=r*r; let c=0; for(let i=0,j=0;i<sc.n;i++,j+=3){ const dx=pos[j]-px, dy=pos[j+1]-py, dz=pos[j+2]-pz; if(dx*dx+dy*dy+dz*dz<r2) out[c++]=i; } _scCand=out; _scCandN=c; }
function scFalloff(d2,r2){
  const x=Math.sqrt(Math.max(0,d2/r2)), t=clamp(1-x,0,1);
  if(SCU.falloff==='linear') return t;
  if(SCU.falloff==='sharp') return t*t*t;
  if(SCU.falloff==='broad'){ const u=clamp((.38-x)/.38,0,1); return x<=.38?1:u*u*(3-2*u); }
  /* Soft: smooth cubic fade with a gentle shoulder, the default sculpt feel. */
  const q=t*t*(3-2*t); return q*(.35+.65*t);
}
function scGather(sc,px,py,pz,r,raw){
  const pos=sc.pos, ids=sc.tmpI, ws=sc.tmpW, r2=r*r, mk=raw?null:sc.mask; let c=0;
  if(_scCand){ for(let q=0;q<_scCandN;q++){ const i=_scCand[q], j=i*3, dx=pos[j]-px, dy=pos[j+1]-py, dz=pos[j+2]-pz, d2=dx*dx+dy*dy+dz*dz; if(d2<r2){ let t=scFalloff(d2,r2); if(mk) t*=1-mk[i]; if(t>.0005){ ids[c]=i; ws[c]=t; c++; } } } return c; }
  for(let i=0,j=0;i<sc.n;i++,j+=3){
    const dx=pos[j]-px, dy=pos[j+1]-py, dz=pos[j+2]-pz, d2=dx*dx+dy*dy+dz*dz;
    if(d2<r2){ let t=scFalloff(d2,r2); if(mk) t*=1-mk[i]; if(t>.0005){ ids[c]=i; ws[c]=t; c++; } }
  }
  return c;
}
function scMaskPaint(sc,ids,c,fn){ const mk=sc.mask; for(let q=0;q<c;q++){ const v=ids?ids[q]:q; if(fn) mk[v]=fn(v,q); scColor1(sc,v); } sc.geo.attributes.color.needsUpdate=true; }
function scMaskSnap(sc){ return sc.mask?sc.mask.slice():null; }
function scMaskSet(sc,m){ if(!m){ if(sc.mask){ sc.mask=null; scColors(sc); } return; } if(!sc.mask) sc.mask=new Float32Array(sc.n); sc.mask.set(m); scMaskPaint(sc,null,sc.n); }
function scPushUndo(sc){ scPushSnap(sc,scSnap(sc)); }
function scMaskClear(){ const n=sculptTarget(); if(!n){ toast('Select a sculpt object first.'); return; } const sc=n.userData.sc; scEnd(); if(!sc.mask){ toast('Nothing is masked.'); return; } scPushUndo(sc); scMaskSet(sc,null); toast('Mask cleared.'); }
function scMaskInvert(){ const n=sculptTarget(); if(!n){ toast('Select a sculpt object first.'); return; } const sc=n.userData.sc; scEnd(); scPushUndo(sc); if(!sc.mask) sc.mask=new Float32Array(sc.n); scMaskPaint(sc,null,sc.n,v=>1-sc.mask[v]); toast('Mask inverted.'); }
function scMaskBlur(){ const n=sculptTarget(); if(!n){ toast('Select a sculpt object first.'); return; } const sc=n.userData.sc; scEnd(); if(!sc.mask){ toast('Paint a mask first.'); return; } scPushUndo(sc); const st=sc.adj.start, ls=sc.adj.list, old=sc.mask.slice(); scMaskPaint(sc,null,sc.n,v=>{ let a=old[v],m=1; for(let q=st[v];q<st[v+1];q++){ a+=old[ls[q]]; m++; } return a/m; }); toast('Mask softened.'); }
const _scN=[0,0,0];
function scAreaNormal(sc,c){
  const nm=sc.geo.attributes.normal.array, ids=sc.tmpI, ws=sc.tmpW; let x=0,y=0,z=0;
  for(let k=0;k<c;k++){ const i=ids[k]*3, w=ws[k]; x+=nm[i]*w; y+=nm[i+1]*w; z+=nm[i+2]*w; }
  const l=Math.hypot(x,y,z)||1; _scN[0]=x/l; _scN[1]=y/l; _scN[2]=z/l;
}
/* Limit a single brush update against the local edge scale. This catches
   accidental spikes from fast/high-pressure strokes without preventing many
   small dabs from building a deliberate form. */
function scClampDab(sc,ids,c,before){
  const st=sc.adj.start, ls=sc.adj.list, pos=sc.pos, mark=sc.tmpMark, guard=clamp(SCU.deformGuard,0,1);
  const maxFactor=1.5-guard*1.0;
  for(let k=0;k<c;k++) mark[ids[k]]=1;
  for(let k=0;k<c;k++){
    const v=ids[k], i=v*3, a=st[v], b=st[v+1]; let edge=0,m=0;
    for(let q=a;q<b;q++){
      const u=ls[q], j=u*3, nx=mark[u]?before[j]:pos[j], ny=mark[u]?before[j+1]:pos[j+1], nz=mark[u]?before[j+2]:pos[j+2];
      edge+=Math.hypot(nx-before[i],ny-before[i+1],nz-before[i+2]); m++;
    }
    if(m){
      const lim=(edge/m)*maxFactor, dx=pos[i]-before[i], dy=pos[i+1]-before[i+1], dz=pos[i+2]-before[i+2], len=Math.hypot(dx,dy,dz);
      if(len>lim&&len>1e-10){ const f=lim/len; pos[i]=before[i]+dx*f; pos[i+1]=before[i+1]+dy*f; pos[i+2]=before[i+2]+dz*f; }
    }
  }
  for(let k=0;k<c;k++) mark[ids[k]]=0;
}
function scDab(sc,brush,px,py,pz,r,amt,carve,lay){
  if(brush==='mask'){ const c0=scGather(sc,px,py,pz,r,true); if(!c0) return false; if(!sc.mask) sc.mask=new Float32Array(sc.n); const ids=sc.tmpI, ws=sc.tmpW, k=amt*2, sg0=carve?-1:1; scMaskPaint(sc,ids,c0,(v,q)=>clamp(sc.mask[v]+sg0*k*ws[q],0,1)); return false; }
  const c=scGather(sc,px,py,pz,r); if(!c) return false;
  const pos=sc.pos, ids=sc.tmpI, ws=sc.tmpW, sg=carve?-1:1, before=sc.tmpD;
  for(let k=0;k<c;k++){ const j=ids[k]*3; before[j]=pos[j]; before[j+1]=pos[j+1]; before[j+2]=pos[j+2]; }
  if(brush==='draw'){
    scAreaNormal(sc,c); const d=sg*amt*r*.02, nx=_scN[0]*d, ny=_scN[1]*d, nz=_scN[2]*d;
    for(let k=0;k<c;k++){ const i=ids[k]*3, w=ws[k]; pos[i]+=nx*w; pos[i+1]+=ny*w; pos[i+2]+=nz*w; }
  } else if(brush==='inflate'){
    const nm=sc.geo.attributes.normal.array, d=sg*amt*r*.02;
    for(let k=0;k<c;k++){ const i=ids[k]*3, w=ws[k]*d; pos[i]+=nm[i]*w; pos[i+1]+=nm[i+1]*w; pos[i+2]+=nm[i+2]*w; }
  } else if(brush==='smooth'){
    /* Bilateral mesh smoothing: nearby neighbours contribute most, while
       neighbours across a sharp normal change contribute less. This reduces
       lumpy surfaces without washing out eyelids, lips, creases and other edges. */
    const kk=clamp(amt*.42,0,.82), tp=sc.tmpP, st=sc.adj.start, ls=sc.adj.list, nm=sc.geo.attributes.normal.array;
    for(let k=0;k<c;k++){
      const v=ids[k], a=st[v], b=st[v+1], i=v*3; let x=0,y=0,z=0, sw=0;
      for(let q=a;q<b;q++){
        const u=ls[q], j=u*3, dx=pos[j]-pos[i], dy=pos[j+1]-pos[i+1], dz=pos[j+2]-pos[i+2];
        const d=Math.hypot(dx,dy,dz)||1e-6;
        const nd=clamp(nm[i]*nm[j]+nm[i+1]*nm[j+1]+nm[i+2]*nm[j+2],0,1);
        const w=(1/d)*Math.pow(nd,1+SCU.jointProtect*7);
        x+=pos[j]*w; y+=pos[j+1]*w; z+=pos[j+2]*w; sw+=w;
      }
      if(sw>1e-8){ tp[k*3]=x/sw; tp[k*3+1]=y/sw; tp[k*3+2]=z/sw; }
      else { tp[k*3]=pos[i]; tp[k*3+1]=pos[i+1]; tp[k*3+2]=pos[i+2]; }
    }
    for(let k=0;k<c;k++){ const i=ids[k]*3, f=kk*ws[k]; pos[i]+=(tp[k*3]-pos[i])*f; pos[i+1]+=(tp[k*3+1]-pos[i+1])*f; pos[i+2]+=(tp[k*3+2]-pos[i+2])*f; }
  } else if(brush==='relax'){
    /* Tangential Laplacian relaxation: smooths uneven triangles while removing
       the normal component that causes ordinary Laplacian smoothing to shrink forms. */
    const kk=clamp(amt*.42,0,.72), tp=sc.tmpP, st=sc.adj.start, ls=sc.adj.list, nm=sc.geo.attributes.normal.array;
    for(let k=0;k<c;k++){
      const v=ids[k], a=st[v], b=st[v+1], i=v*3; let x=0,y=0,z=0, edge=0, m=0;
      for(let q=a;q<b;q++){ const v=ls[q], u=v*3, dx=pos[u]-pos[i], dy=pos[u+1]-pos[i+1], dz=pos[u+2]-pos[i+2];
        const nd=clamp(nm[i]*nm[u]+nm[i+1]*nm[u+1]+nm[i+2]*nm[u+2],0,1), w=.12+.88*Math.pow(nd,1+SCU.jointProtect*7);
        x+=pos[u]*w; y+=pos[u+1]*w; z+=pos[u+2]*w; sw+=w; edge+=Math.hypot(dx,dy,dz); m++; }
      if(!m||sw<1e-8){ tp[k*3]=tp[k*3+1]=tp[k*3+2]=0; continue; }
      x=x/sw-pos[i]; y=y/sw-pos[i+1]; z=z/sw-pos[i+2];
      const dn=x*nm[i]+y*nm[i+1]+z*nm[i+2]; x-=nm[i]*dn; y-=nm[i+1]*dn; z-=nm[i+2]*dn;
      const lim=(edge/m)*.22, len=Math.hypot(x,y,z); if(len>lim&&len>0){ const f=lim/len; x*=f; y*=f; z*=f; }
      tp[k*3]=x; tp[k*3+1]=y; tp[k*3+2]=z;
    }
    for(let k=0;k<c;k++){ const i=ids[k]*3, f=kk*ws[k]; pos[i]+=tp[k*3]*f; pos[i+1]+=tp[k*3+1]*f; pos[i+2]+=tp[k*3+2]*f; }
  } else if(brush==='pinch'){
    scAreaNormal(sc,c); const f0=clamp(sg*amt*.12,-.5,.5), nx=_scN[0], ny=_scN[1], nz=_scN[2];
    for(let k=0;k<c;k++){
      const i=ids[k]*3; let dx=px-pos[i], dy=py-pos[i+1], dz=pz-pos[i+2]; const dn=dx*nx+dy*ny+dz*nz; dx-=nx*dn; dy-=ny*dn; dz-=nz*dn;
      const f=f0*ws[k]; pos[i]+=dx*f; pos[i+1]+=dy*f; pos[i+2]+=dz*f;
    }
  } else if(brush==='clay'){
    scAreaNormal(sc,c); const d=sg*amt*r*.012, nx=_scN[0], ny=_scN[1], nz=_scN[2], f0=clamp(amt*.1,0,.5);
    for(let k=0;k<c;k++){ const i=ids[k]*3, w=ws[k], dist=(pos[i]-px)*nx+(pos[i+1]-py)*ny+(pos[i+2]-pz)*nz;
      pos[i]+=nx*(d*w-dist*f0*w); pos[i+1]+=ny*(d*w-dist*f0*w); pos[i+2]+=nz*(d*w-dist*f0*w); }
  } else if(brush==='knuckle'){
    /* A compact annular fold tool for finger/toe joints. It creates a shallow
       circumferential groove with a restrained raised lip on either side,
       unlike the ordinary crease brush which follows a narrow stroke. */
    scAreaNormal(sc,c); const nx=_scN[0], ny=_scN[1], nz=_scN[2], depth=sg*amt*r*.045;
    for(let k=0;k<c;k++){
      const i=ids[k]*3, dx=pos[i]-px, dy=pos[i+1]-py, dz=pos[i+2]-pz;
      const dn=dx*nx+dy*ny+dz*nz, tangent=Math.hypot(dx-nx*dn,dy-ny*dn,dz-nz*dn);
      const u=tangent/Math.max(r,1e-6), groove=Math.exp(-Math.pow((u-.43)/.105,2));
      const lip=Math.exp(-Math.pow((u-.61)/.13,2));
      const q=depth*ws[k]*(groove*.9-lip*.22);
      pos[i]+=nx*q; pos[i+1]+=ny*q; pos[i+2]+=nz*q;
    }
  } else if(brush==='crease'){
    scAreaNormal(sc,c); const d=-sg*amt*r*.055, f0=clamp(sg*amt*.12,-.45,.45), nx=_scN[0], ny=_scN[1], nz=_scN[2];
    for(let k=0;k<c;k++){ const i=ids[k]*3, w=ws[k]*ws[k]; pos[i]+=nx*d*w; pos[i+1]+=ny*d*w; pos[i+2]+=nz*d*w;
      let dx=px-pos[i], dy=py-pos[i+1], dz=pz-pos[i+2]; const dn=dx*nx+dy*ny+dz*nz; dx-=nx*dn; dy-=ny*dn; dz-=nz*dn; const f=f0*ws[k]; pos[i]+=dx*f; pos[i+1]+=dy*f; pos[i+2]+=dz*f; }
  } else if(brush==='noise'){
    const nm=sc.geo.attributes.normal.array, d=sg*amt*r*.012;
    for(let k=0;k<c;k++){ const v=ids[k], i=v*3, w=ws[k];
      const hs=Math.sin(pos[i]*91.7+pos[i+1]*37.3+pos[i+2]*63.1)*43758.5453, rr=hs-Math.floor(hs)-.5, q=d*w*rr*2;
      pos[i]+=nm[i]*q; pos[i+1]+=nm[i+1]*q; pos[i+2]+=nm[i+2]*q; }
  } else if(brush==='scrape'){
    scAreaNormal(sc,c); const f0=clamp(amt*.3,0,.9), nx=_scN[0], ny=_scN[1], nz=_scN[2];
    for(let k=0;k<c;k++){ const i=ids[k]*3, dist=(pos[i]-px)*nx+(pos[i+1]-py)*ny+(pos[i+2]-pz)*nz; if(dist<=0) continue; const f=f0*ws[k]*dist; pos[i]-=nx*f; pos[i+1]-=ny*f; pos[i+2]-=nz*f; }
  } else if(brush==='wrinkle'){
    const nm=sc.geo.attributes.normal.array, fr=1/(sc.ref*.028), d=sg*amt*sc.ref*.0021;
    for(let k=0;k<c;k++){ const i=ids[k]*3, y=pos[i+1]*fr+Math.sin(pos[i]*fr*.55+pos[i+2]*fr*.45)*.85+Math.sin(pos[i]*fr*1.7)*.12, s=Math.abs(Math.sin(y*Math.PI)), g=Math.pow(1-s,3.2), q=-d*ws[k]*g;
      pos[i]+=nm[i]*q; pos[i+1]+=nm[i+1]*q; pos[i+2]+=nm[i+2]*q; }
  } else if(brush==='pores'){
    const nm=sc.geo.attributes.normal.array, cs=sc.ref*.0095, d=sg*amt*cs*.14, hh=(a,b,c,k)=>{ const v=Math.sin(a*127.1+b*311.7+c*74.7+k*19.3)*43758.5453; return v-Math.floor(v); };
    for(let k=0;k<c;k++){ const i=ids[k]*3, X=pos[i]/cs, Y=pos[i+1]/cs, Z=pos[i+2]/cs, ix=Math.floor(X), iy=Math.floor(Y), iz=Math.floor(Z); let f1=9;
      for(let a=-1;a<=1;a++) for(let b=-1;b<=1;b++) for(let e=-1;e<=1;e++){ const cx=ix+a, cy=iy+b, cz=iz+e, fx=cx+hh(cx,cy,cz,1)-X, fy=cy+hh(cx,cy,cz,2)-Y, fz=cz+hh(cx,cy,cz,3)-Z, q=fx*fx+fy*fy+fz*fz; if(q<f1) f1=q; }
      const t=Math.max(0,1-Math.sqrt(f1)/.42), pit=t*t*(3-2*t), q=-d*ws[k]*pit; pos[i]+=nm[i]*q; pos[i+1]+=nm[i+1]*q; pos[i+2]+=nm[i+2]*q; }
  } else if(brush==='layer'&&lay){
    const f0=clamp(amt*.25,0,.9), nx=lay[3], ny=lay[4], nz=lay[5], h=lay[6];
    for(let k=0;k<c;k++){ const i=ids[k]*3, dist=(pos[i]-lay[0])*nx+(pos[i+1]-lay[1])*ny+(pos[i+2]-lay[2])*nz; if(h>=0?dist>=h:dist<=h) continue; const f=f0*ws[k]*(h-dist); pos[i]+=nx*f; pos[i+1]+=ny*f; pos[i+2]+=nz*f; }
  } else if(brush==='paint'){
    if(!sc.paint) scPaintInit(sc); const p=sc.paint, cc=scHexRgb(SCU.pcol), f0=clamp(amt*.3,0,1), jit=SCU.pjit;
    for(let k=0;k<c;k++){ const v=ids[k], j=v*3, f=Math.min(1,f0*ws[k]*1.6); let q=1;
      if(jit>0){ const hs=Math.sin(pos[j]*127.1+pos[j+1]*311.7+pos[j+2]*74.7)*43758.5453; q=1+(hs-Math.floor(hs)-.5)*jit*.6; }
      for(let e=0;e<3;e++){ const tg=clamp(cc[e]*q,0,255); let d=(tg-p[j+e])*f; if(d>0&&d<1) d=1; else if(d<0&&d>-1) d=-1; if(Math.abs(tg-p[j+e])<1) continue; p[j+e]=clamp(Math.round(p[j+e]+d),0,255); }
      scColor1(sc,v); }
    sc.geo.attributes.color.needsUpdate=true; return false;
  } else if(brush==='flatten'){
    scAreaNormal(sc,c); const f0=clamp(amt*.2,0,.8), nx=_scN[0], ny=_scN[1], nz=_scN[2];
    for(let k=0;k<c;k++){
      const i=ids[k]*3, dist=(pos[i]-px)*nx+(pos[i+1]-py)*ny+(pos[i+2]-pz)*nz, f=f0*ws[k]*dist;
      pos[i]-=nx*f; pos[i+1]-=ny*f; pos[i+2]-=nz*f;
    }
  }
  scClampDab(sc,ids,c,before);
  return true;
}
function scMove(sc,px,py,pz,r,dx,dy,dz,k,tangent){
  const c=scGather(sc,px,py,pz,r); if(!c) return false; const pos=sc.pos, ids=sc.tmpI, ws=sc.tmpW, before=sc.tmpD;
  for(let q=0;q<c;q++){ const j=ids[q]*3; before[j]=pos[j]; before[j+1]=pos[j+1]; before[j+2]=pos[j+2]; }
  if(tangent){ scAreaNormal(sc,c); const d=dx*_scN[0]+dy*_scN[1]+dz*_scN[2]; dx-=_scN[0]*d; dy-=_scN[1]*d; dz-=_scN[2]*d; }
  for(let q=0;q<c;q++){ const i=ids[q]*3, w=ws[q]*k; pos[i]+=dx*w; pos[i+1]+=dy*w; pos[i+2]+=dz*w; }
  scClampDab(sc,ids,c,before);
  return true;
}
function scMirrors(x,y,z){ const out=[[1,1,1]]; if(SCU.sym&&Math.abs(x)>1e-4) out.push([-1,1,1]); if(SCU.symY&&Math.abs(y)>1e-4) out.slice().forEach(m=>out.push([m[0],-1,m[2]])); if(SCU.symZ&&Math.abs(z)>1e-4) out.slice().forEach(m=>out.push([m[0],m[1],-1])); return out; }
function scGrabBegin(sc,px,py,pz,r){
  /* Use the same reflection set as every other brush. Previously Grab only
     mirrored left/right, so top/bottom and front/back symmetry silently failed. */
  const sets=[];
  scMirrors(px,py,pz).forEach(m=>{
    const c=scGather(sc,px*m[0],py*m[1],pz*m[2],r);
    if(c) sets.push({ids:sc.tmpI.slice(0,c),w:sc.tmpW.slice(0,c),mirror:m});
  });
  return {sets:sets,snap:sc.pos.slice()};
}
function scGrabMove(sc,g,dx,dy,dz){
  sc.pos.set(g.snap); const pos=sc.pos;
  g.sets.forEach(s=>{ const m=s.mirror; for(let k=0;k<s.ids.length;k++){ const i=s.ids[k]*3, w=s.w[k]; pos[i]+=dx*m[0]*w; pos[i+1]+=dy*m[1]*w; pos[i+2]+=dz*m[2]*w; } });
}

/* ---------- input ---------- */
function sculptTarget(){ const n=S.sel&&nodes.get(S.sel); return n&&n.userData&&n.userData.sc?n:null; }
function sculptActive(){ return SCU.on&&S.view==='free'&&!S.recording&&!!sculptTarget(); }
const scPtrs=new Map(); let scS=null, scHover=null, scOrbitHeld=false;
function scPick(cx,cy,node){
  const rc=renderer.domElement.getBoundingClientRect();
  ndc.set(((cx-rc.left)/rc.width)*2-1,-((cy-rc.top)/rc.height)*2+1);
  ray.setFromCamera(ndc,edit);
  const sc=node.userData.sc; node.updateMatrixWorld(true);
  const h=ray.intersectObject(sc.mesh,false)[0]; if(!h) return null;
  return {l:sc.mesh.worldToLocal(h.point.clone()),w:h.point.clone(),n:h.face.normal.clone().transformDirection(sc.mesh.matrixWorld)};
}
stage.addEventListener('pointerdown',e=>{
  if(!sculptActive()||e.target!==renderer.domElement) return;
  scPtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(scPtrs.size>1){ scEnd(); orbit.enabled=true; return; }
  const node=sculptTarget(), hit=scPick(e.clientX,e.clientY,node);
  if(!hit){ orbit.enabled=true; return; }
  const sc=node.userData.sc, r=SCU.size*sc.ref;
  scS={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,node:node,sc:sc,snap:scSnap(sc),changed:false,grab:null,pr:e.pointerType==='pen'?(e.pressure||.5):1,prTarget:e.pointerType==='pen'?(e.pressure||.5):1,prSmooth:e.pointerType==='pen'?(e.pressure||.5):1,tRef:0,layer:null,cur:hit.l.clone()};
  if(SCU.brush==='snake'||SCU.brush==='nudge') scS.plane=new THREE.Plane().setFromNormalAndCoplanarPoint(edit.getWorldDirection(new THREE.Vector3()).negate(),hit.w);
  if(SCU.brush==='grab'){
    scS.grab=scGrabBegin(sc,hit.l.x,hit.l.y,hit.l.z,r); scS.l0=hit.l.clone();
    scS.plane=new THREE.Plane().setFromNormalAndCoplanarPoint(edit.getWorldDirection(new THREE.Vector3()).negate(),hit.w);
  }
  orbit.enabled=false; scOrbitHeld=true;
},true);
addEventListener('pointermove',e=>{
  const p=scPtrs.get(e.pointerId); if(p){ p.x=e.clientX; p.y=e.clientY; }
  if(scS&&e.pointerId===scS.id){ scS.x=e.clientX; scS.y=e.clientY; if(e.pointerType==='pen'&&e.pressure>0){ scS.pr=e.pressure; scS.prTarget=e.pressure; } }
  if(e.pointerType==='mouse') scHover=(e.target===renderer.domElement)?{x:e.clientX,y:e.clientY}:null;
});
function scUp(e){
  scPtrs.delete(e.pointerId);
  if(scS&&e.pointerId===scS.id) scEnd();
  if(scOrbitHeld&&scPtrs.size===0){ orbit.enabled=(S.view==='free'); scOrbitHeld=false; }
}
addEventListener('pointerup',scUp); addEventListener('pointercancel',scUp);
function scEnd(){
  if(!scS) return; const s=scS; scS=null;
  if(s.changed){ scPushSnap(s.sc,s.snap); queueSave(); }
}
const scRing=new THREE.Mesh(new THREE.RingGeometry(.94,1,56),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,depthTest:false,depthWrite:false,side:THREE.DoubleSide,fog:false,toneMapped:false}));
scRing.renderOrder=999; scRing.visible=false; scene.add(scRing);
const _scZ=new THREE.Vector3(0,0,1), _scT=new THREE.Vector3();
let scLast=performance.now(), scWarned=false;
function scLoop(now){
  requestAnimationFrame(scLoop);
  const dt=Math.min(.1,Math.max(0,(now-scLast)/1000)); scLast=now;
  try{ sculptFrame(dt); }catch(err){ if(scS){ scS=null; } scRing.visible=false; if(!scWarned){ scWarned=true; toast('Sculpt error: '+((err&&err.message)||'unknown')); } }
}
requestAnimationFrame(scLoop);
function sculptFrame(dt){
  const node=sculptTarget(), act=SCU.on&&node&&S.view==='free'&&!S.recording;
  scRing.visible=false; scGuideSync(); scSyncStatus(node); scMatcapSync();
  if(scOrbitHeld&&!scS&&scPtrs.size===0){ orbit.enabled=(S.view==='free'); scOrbitHeld=false; }
  if(!act){ if(scS) scEnd(); return; }
  const sc=node.userData.sc; let rawPr=1; if(scS){ const tau=.012+clamp(SCU.pressStab,0,.95)*.16, pf=1-Math.exp(-dt/Math.max(.001,tau)); scS.prSmooth+=(scS.prTarget-scS.prSmooth)*pf; rawPr=clamp(scS.prSmooth,0,1); } const pr=scS&&SCU.pres?Math.pow(rawPr,SCU.presStrengthCurve):1, sizePr=scS&&SCU.presSize?Math.pow(rawPr,SCU.presSizeCurve):1, r=SCU.size*sc.ref*(scS&&SCU.presSize?.35+.65*sizePr:1); let src=scS||scHover; if(!src) return;
  if(scS){ const tau=.012+clamp(SCU.stab,0,.95)*.18, f=1-Math.exp(-dt/Math.max(.001,tau)); scS.sx+=(scS.x-scS.sx)*f; scS.sy+=(scS.y-scS.sy)*f; src={x:scS.sx,y:scS.sy}; }
  const hit=scPick(src.x,src.y,node);
  if(hit){ scRing.position.copy(hit.w).addScaledVector(hit.n,.004); scRing.quaternion.setFromUnitVectors(_scZ,hit.n); scRing.scale.setScalar(Math.max(.001,r*node.scale.x)); scRing.visible=true; }
  if(!scS) return;
  const dtf=clamp(dt*60,.3,3), B=SCU.brush;
  if(scS.grab){
    if(!hit&&!scS.grab) return; if(!ray.ray.intersectPlane(scS.plane,_scT)) return;
    const l=sc.mesh.worldToLocal(_scT.clone());
    scGrabMove(sc,scS.grab,(l.x-scS.l0.x)*pr,(l.y-scS.l0.y)*pr,(l.z-scS.l0.z)*pr); scS.changed=true; scUpdate(sc); return;
  }
  if(B==='snake'){
    if(!ray.ray.intersectPlane(scS.plane,_scT)) return; const l=sc.mesh.worldToLocal(_scT.clone()), d=l.clone().sub(scS.cur); if(d.lengthSq()<1e-10) return;
    const c0=scS.cur; let did=false;
    if(SCU.dyn){ const now=performance.now(); if(now-scS.tRef>(sc.n>100000?170:90)){ scS.tRef=now; scMirrors(c0.x,c0.y,c0.z).forEach(m=>{ scRefine(sc,c0.x*m[0],c0.y*m[1],c0.z*m[2],r*1.1,Math.max(r*SC_DYNK[SCU.dynk],sc.ref*.0025)); }); } }
    scMirrors(c0.x,c0.y,c0.z).forEach(m=>{ did=scMove(sc,c0.x*m[0],c0.y*m[1],c0.z*m[2],r,d.x*m[0],d.y*m[1],d.z*m[2],clamp(.55+SCU.strength*.45,0,1)*pr,false)||did; });
    scS.cur.copy(l); scS.plane.setFromNormalAndCoplanarPoint(scS.plane.normal,_scT); if(did){ scS.changed=true; scUpdate(sc); } return;
  }
  if(!hit) return;
  if(B==='nudge'){
    const d=hit.l.clone().sub(scS.cur); scS.cur.copy(hit.l); if(d.lengthSq()<1e-10) return; let did=false;
    scMirrors(hit.l.x,hit.l.y,hit.l.z).forEach(m=>{ did=scMove(sc,hit.l.x*m[0],hit.l.y*m[1],hit.l.z*m[2],r,d.x*m[0],d.y*m[1],d.z*m[2],SCU.strength*.8*pr,true)||did; });
    if(did){ scS.changed=true; scUpdate(sc); } return;
  }
  const mir=scMirrors(hit.l.x,hit.l.y,hit.l.z);
  if(((SCU.dyn||SCU.micro)&&B!=='mask'&&B!=='paint')||B==='pores'||B==='wrinkle'){ const now=performance.now(); if(now-scS.tRef>(sc.n>100000?170:90)){ scS.tRef=now; const L=B==='pores'?sc.ref*.005:B==='wrinkle'?sc.ref*.007:SCU.micro?Math.max(r*.10,sc.ref*.0012):Math.max(r*SC_DYNK[SCU.dynk],sc.ref*.0025); let ch=false; mir.forEach(m=>{ ch=scRefine(sc,hit.l.x*m[0],hit.l.y*m[1],hit.l.z*m[2],r,L)||ch; }); if(ch) scS.changed=true; } }
  if(B==='layer'&&!scS.layer){ const c=scGather(sc,hit.l.x,hit.l.y,hit.l.z,r,true); if(!c) return; scAreaNormal(sc,c); scS.layer=[hit.l.x,hit.l.y,hit.l.z,_scN[0],_scN[1],_scN[2],(SCU.carve?-1:1)*r*(.04+.14*SCU.strength)]; }
  /* spaced dabs along the path, like Blender: even strokes at any speed, no build-up while holding still */
  const amt=SCU.strength*pr*.9; let did=false, pts=[];
  if(!scS.lastL){ pts.push(hit.l.clone()); }
  else { const seg=hit.l.clone().sub(scS.lastL), d=seg.length(), sp=Math.max(r*.12,d/8); if(d>=sp){ const nst=Math.floor(d/sp); for(let i=1;i<=nst;i++) pts.push(scS.lastL.clone().addScaledVector(seg,i*sp/d)); } }
  if(!pts.length) return;
  const a0=scS.lastL||pts[0], a1=pts[pts.length-1], mid=a0.clone().add(a1).multiplyScalar(.5), rad=a0.distanceTo(a1)/2+r*1.02;
  mir.forEach(m=>{ const L0=scS.layer; const lay=L0?[L0[0]*m[0],L0[1]*m[1],L0[2]*m[2],L0[3]*m[0],L0[4]*m[1],L0[5]*m[2],L0[6]]:null;
    scCandidates(sc,mid.x*m[0],mid.y*m[1],mid.z*m[2],rad);
    pts.forEach(q=>{ did=scDab(sc,B,q.x*m[0],q.y*m[1],q.z*m[2],r,amt,SCU.carve,lay)||did; }); _scCand=null; });
  scS.lastL=a1.clone();
  if(B==='mask'||B==='paint') scS.changed=true;
  if(did){ scS.changed=true; scUpdate(sc); }
}
function scUndo(){
  scEnd(); const n=sculptTarget(); if(!n){ toast('Select a sculpt object first.'); return; }
  const sc=n.userData.sc; if(!sc.undo.length){ toast('Nothing to undo.'); return; }
  sc.redo.push(scSnap(sc)); scRestore(sc,sc.undo.pop()); queueSave();
}
function scRedo(){
  scEnd(); const n=sculptTarget(); if(!n){ toast('Select a sculpt object first.'); return; }
  const sc=n.userData.sc; if(!sc.redo.length){ toast('Nothing to redo.'); return; }
  sc.undo.push(scSnap(sc)); scRestore(sc,sc.redo.pop()); queueSave();
}
function scReset(){
  scEnd(); const n=sculptTarget(); if(!n){ toast('Select a sculpt object first.'); return; }
  const sc=n.userData.sc; scPushUndo(sc); const keep=sc.idx===sc.baseIdx?sc.paint:null; scSetTopo(sc,new Float32Array(sc.base),sc.baseIdx,keep,null); scUpdate(sc); sc.dirty=true; queueSave(); toast('Back to the starting shape. Undo brings your work back.');
}
function sculptMode(m){
  SCU.on=(m==='sculpt');
  if(!SCU.on){ scEnd(); return; }
  if(!sculptTarget()){ let last=null; order.forEach(id=>{ const n=nodes.get(id); if(n&&n.userData.sc) last=id; }); if(last) selectId(last); }
  showTab('sculpt');
  if(!sculptTarget()) toast('Pick a shape in the Sculpt tab to start.');
}
let scStatKey='';
function scSyncStatus(node){
  const el=$('#scStat'); if(!el) return;
  const key=(S.sel||'')+'|'+(node?1:0)+'|'+SCU.on; if(key===scStatKey) return; scStatKey=key; if(node) scCountSync(node.userData.sc);
  el.textContent=node?('Sculpting: '+node.userData.name+(SCU.on?'. One finger on the model sculpts. Two fingers, or one finger off the model, move the view.':'. Tap the Sculpt tool in the toolbar to start.')):'No sculpt object selected. Tap a shape below to make one, or pick one in the Outliner.';
}

/* ---------- create + AI strokes ---------- */
function sculptCreate(o){
  const shape=SC_SHAPES[o.shape]?o.shape:'ball';
  const size=(Array.isArray(o.size)&&o.size.length>=3&&o.size.every(v=>isFinite(+v)))?o.size.slice(0,3).map(v=>clamp(+v,0,60)):SC_SHAPES[shape].size.slice();
  if(shape==='terrain'){ size[1]=0; size[0]=Math.max(1,size[0]); size[2]=Math.max(1,size[2]); } else for(let i=0;i<3;i++) size[i]=Math.max(.1,size[i]);
  const detail=SC_DETAIL[o.detail]?o.detail:'medium';
  const pos=(Array.isArray(o.position)&&o.position.length>=3&&o.position.every(v=>isFinite(+v)))?o.position.slice(0,3).map(Number):[orbit.target.x,shape==='terrain'?.02:size[1]/2,orbit.target.z];
  const col=shape==='jesvin'?'#ffffff':/^#[0-9a-f]{6}$/i.test(o.color||'')?o.color:(shape==='terrain'?'#7d8a5a':(shape==='head'||shape==='body'||shape==='realhead'||shape==='jesvin')?'#c9a58a':'#b9a68e');
  const sp=mkSpec('sculpt',{name:String(o.name||SC_SHAPES[shape].n).slice(0,40),shape:shape,size:size,detail:detail,color:col,rough:.85,p:pos});
  addNode(sp); return sp;
}
const SC_AMT={draw:6.25,inflate:6.25,smooth:1.4,pinch:2.5,flatten:2.5,clay:6,crease:5,noise:5};
function scAiStrokes(node,strokes,mirrorDefault){
  const sc=node.userData.sc, pos=sc.pos; let applied=0;
  sc.undo.push(pos.slice()); if(sc.undo.length>10) sc.undo.shift(); sc.redo.length=0;
  scUpdate(sc);
  (Array.isArray(strokes)?strokes:[]).slice(0,120).forEach(s=>{
    if(!s||!Array.isArray(s.at)||s.at.length<3) return;
    const br=SC_AMT[s.brush]?s.brush:'draw';
    const px=clamp(+s.at[0]||0,-1.5,1.5)*sc.half[0], py=clamp(+s.at[1]||0,-1.5,1.5)*sc.half[1], pz=clamp(+s.at[2]||0,-1.5,1.5)*sc.half[2];
    let bi=-1, bd=1e30;
    for(let i=0,j=0;i<sc.n;i++,j+=3){ const dx=pos[j]-px, dy=sc.flat?0:pos[j+1]-py, dz=pos[j+2]-pz, d=dx*dx+dy*dy+dz*dz; if(d<bd){ bd=d; bi=i; } }
    if(bi<0) return;
    const sx=pos[bi*3], sy=pos[bi*3+1], sz=pos[bi*3+2], r=clamp(+s.radius||.2,.03,1)*sc.ref;
    let st=clamp(+s.strength||0,-1,1); if((br==='smooth'||br==='flatten')&&!st) st=.6; if(!st) return;
    const carve=st<0&&(br==='draw'||br==='inflate'||br==='pinch'||br==='clay'||br==='crease'||br==='noise'), amt=SC_AMT[br]*Math.abs(st), mir=s.mirror!=null?!!s.mirror:!!mirrorDefault;
    for(let p=0;p<(br==='smooth'?3:4);p++){
      scDab(sc,br,sx,sy,sz,r,amt,carve);
      if(mir&&Math.abs(sx)>1e-4) scDab(sc,br,-sx,sy,sz,r,amt,carve);
    }
    scUpdate(sc); applied++;
  });
  scUpdate(sc); sc.dirty=true; return applied;
}
function sculptFromSpec(o){
  o=o||{}; let node=null;
  if(o.edit_existing){
    const q=String(o.name||'').toLowerCase();
    order.forEach(id=>{ const n=nodes.get(id); if(!node&&n&&n.userData.sc&&n.userData.name.toLowerCase()===q) node=n; });
    if(!node) throw new Error('No sculpt object named "'+o.name+'". Leave edit_existing off to create it.');
  }
  let created=false;
  if(!node){ const sp=sculptCreate(o); node=nodes.get(sp.id); created=true; }
  const k=scAiStrokes(node,o.strokes,false);
  return {id:node.userData.id,name:node.userData.name,created:created,vertices:node.userData.sc.n,strokes_applied:k};
}
function sculptParseJson(text){
  const t=String(text||'').trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim(); let o;
  try{ o=JSON.parse(t); }catch(e){ const a=t.indexOf('{'), b=t.lastIndexOf('}'); if(a>=0&&b>a){ try{ o=JSON.parse(t.slice(a,b+1)); }catch(e2){} } }
  if(!o||typeof o!=='object') throw new Error('That is not valid JSON.');
  if(Array.isArray(o)) o={strokes:o};
  return o;
}
const SC_JSON_SHAPE='{"name":"...","shape":"ball|head|body|block|terrain","size":[x,y,z],"detail":"low|medium|high","color":"#rrggbb","strokes":[{"brush":"draw|inflate|smooth|pinch|flatten","at":[x,y,z],"radius":0.2,"strength":0.5,"mirror":true}]}';
const SC_RULES='Sculpting works like clay: pick a base shape (ball, head, body, block or terrain), give its size in meters [x,y,z], then add brush strokes. Axes: +Y is up, +Z is the front of the subject (a face looks toward +Z), +X is the right side of the screen when you look at the front. Base shapes: "head" is a skull ellipsoid with a rough nose, brow, cheeks, chin and ears already pushed out; "body" is a standing capsule torso (head end at +Y); "ball" and "block" are plain; "terrain" is a flat square grid on the ground (size [width,0,depth]). Every stroke has "brush", "at" [x,y,z], "radius" and "strength". "at" is relative to the half size of the shape: [0,0,1] is the front-most point, [0,1,0] the top, [1,0,0] the right side, [0,-1,0] the bottom (for terrain only x and z matter). It snaps to the nearest surface point. "radius" is a fraction of the largest half size: 0.5 is a big area, 0.2 a feature, 0.08 a fine detail. Brushes: "draw" pushes the surface outward when strength is positive and carves inward when negative (-1 to 1; 0.3 gentle, 0.7 strong); "inflate" swells an area; "smooth" relaxes bumps (strength 0 to 1); "pinch" pulls the surface toward the stroke center to make ridges and creases; "flatten" levels an area. "mirror": true repeats the stroke on the opposite side (x becomes -x): use it for anything symmetrical such as eyes, ears, cheeks, shoulders, arms, legs and wings. Work from big forms to small: first large strokes (radius 0.4 to 0.7) for the overall mass, then medium features (0.15 to 0.3), then small details (0.05 to 0.12), and finish with a few smooth strokes. Use 15 to 60 strokes. For a head, typical spots: eyes [0.38,0.15,0.9], brow [0.4,0.32,0.92], nose [0,-0.1,1], cheeks [0.6,-0.2,0.75], mouth [0,-0.42,0.9], chin [0,-0.8,0.65], ears [1,0,-0.1] (use mirror for the paired ones). Use detail "high" for heads and figures so small features show. ';
const SC_PROMPT='You are a 3D sculpting assistant. Look at the image I attach (and my note) and reply with ONLY JSON (no prose, no code fences) in this shape: '+SC_JSON_SHAPE+'. '+SC_RULES+'The subject I want: ';
const SC_AI_HEAD='You are the sculpting assistant inside Slate Studio. Use the sculpt_model tool to make the subject. '+SC_RULES+'Call sculpt_model once to create the object with its first strokes (up to 60 strokes per call). If it needs more work, call it again with edit_existing true and the same name to add more strokes. When finished, reply with one or two plain sentences. The request: ';
function sculptToolDef(){
  return {name:'sculpt_model',description:'Create or refine a clay-like sculpt (organic shapes: heads, figures, creatures, rocks, terrain). '+SC_RULES,
    inputSchema:ob({name:{type:'string'},edit_existing:{type:'boolean'},shape:{type:'string',enum:Object.keys(SC_SHAPES)},size:V3,detail:{type:'string',enum:['low','medium','high']},color:{type:'string'},position:V3,
      strokes:{type:'array',items:ob({brush:{type:'string',enum:['draw','inflate','smooth','pinch','flatten']},at:V3,radius:{type:'number'},strength:{type:'number'},mirror:{type:'boolean'}},['brush','at'])}},['name']),
    execute:i=>{
      const r=sculptFromSpec(i); selectId(r.id); refreshScene();
      const line=(r.created?'+ sculpt: ':'~ sculpt edited: ')+r.name+' ('+r.strokes_applied+' strokes)'; logAi(line); scLog(line);
      return {sculpt:r.name,created:r.created,vertices:r.vertices,strokes_applied:r.strokes_applied};
    }};
}
let scLines=[];
function scLog(l){ scLines.push(l); const el=$('#scLog'); if(el){ el.textContent=scLines.slice(-12).join('\n'); el.scrollTop=el.scrollHeight; } }

/* ---------- reference image ---------- */
const scGuide={url:'',blob:null,op:.45,k:1,x:0,y:0,img:null,shown:null};
(function(){ const st=document.createElement('style'); st.textContent='#refGuide{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;pointer-events:none;z-index:3;transform-origin:50% 50%;-webkit-user-select:none;user-select:none}'; document.head.appendChild(st); })();
function scGuideApply(){
  const im=scGuide.img; if(!im) return;
  im.style.opacity=String(scGuide.op); im.style.transform='translate('+scGuide.x+'%,'+scGuide.y+'%) scale('+scGuide.k+')';
}
function scGuideSync(){
  const im=scGuide.img; if(!im) return;
  const show=!!scGuide.url&&S.view==='free'&&!S.recording;
  if(show!==scGuide.shown){ scGuide.shown=show; im.style.display=show?'block':'none'; }
}
function scGuideSet(file){
  toast('Preparing reference...');
  toJpeg(file).then(b=>{
    if(scGuide.url){ try{ URL.revokeObjectURL(scGuide.url); }catch(e){} }
    scGuide.blob=b; scGuide.url=URL.createObjectURL(b); scGuide.img.src=scGuide.url; scGuide.shown=null; scGuideApply();
    toast('Reference set. It floats over the viewport. Use the sliders to fade and move it.');
  }).catch(()=>toast('This image could not be read. Try a screenshot or a JPG or PNG.'));
}
function scGuideClear(){
  if(scGuide.url){ try{ URL.revokeObjectURL(scGuide.url); }catch(e){} }
  scGuide.url=''; scGuide.blob=null; if(scGuide.img) scGuide.img.removeAttribute('src'); scGuide.shown=null; toast('Reference removed.');
}
function scGuideFromUrl(url,name){
  try{
    if(url.indexOf('data:')!==0){ fetch(url).then(r=>{ if(!r.ok) throw 0; return r.blob(); }).then(b=>scGuideSet(b),()=>toast('Could not load '+(name||'that reference')+' from the assets folder.')); return; }
    const i=url.indexOf(','), bin=atob(url.slice(i+1)), u=new Uint8Array(bin.length); for(let k=0;k<bin.length;k++) u[k]=bin.charCodeAt(k);
    scGuideSet(new Blob([u],{type:'image/jpeg'}));
  }catch(e){ toast('Could not load '+(name||'that reference')+'.'); }
}
function scAlign(kind){
  const n=sculptTarget(), t=n?n.position.clone():orbit.target.clone();
  const D=(n?n.userData.sc.ref*Math.max(.01,n.scale.x):2)*3.4+.8;
  orbit.target.copy(t);
  if(kind==='front') edit.position.set(t.x,t.y,t.z+D); else if(kind==='side') edit.position.set(t.x+D,t.y,t.z); else edit.position.set(t.x,t.y+D,t.z+.01);
  edit.lookAt(t); orbit.update(); if(S.view!=='free') setView('free');
}

/* ---------- Claude route ---------- */
let scBusy=false, scAbort=null;
async function sculptAsk(){
  const btn=$('#scGo'), st=$('#scAiStat'), setSt=t=>{ if(st) st.textContent=t||''; };
  if(scBusy){ if(scAbort) scAbort.abort(); return; }
  const text=$('#scPrompt').value.trim();
  if(!text&&!scGuide.blob){ toast('Describe what to sculpt, or set a reference image first.'); return; }
  scBusy=true; scAbort=new AbortController(); btn.textContent='Stop'; setSt('Connecting to Claude...');
  try{
    const sample=await getSample(); if(!sample) throw {code:'no_claude'};
    if(scAbort.signal.aborted) throw {code:'cancelled'};
    let lim={}; try{ lim=await sample.limits(); }catch(e){ lim={}; }
    if(!(lim&&lim.tools)) throw new Error('This Claude app cannot let Claude edit the scene directly. Use the ChatGPT route below instead: copy the prompt, then paste the JSON it gives you.');
    const tierEl=$('#aiTier'), opts={signal:scAbort.signal,modelTier:tierEl?tierEl.value:'default',onText:o=>{ setSt('Writing...'); }};
    let note='';
    if(scGuide.blob){
      const L=lim.images; if(!L) throw new Error('This Claude app cannot send images yet. Update the app, or clear the reference image.');
      const use=[scGuide.blob].filter(f=>L.mediaTypes.indexOf(f.type)>=0&&f.size<=L.maxInputBytes);
      if(!use.length) throw new Error('The reference image is too large or the wrong type for Claude.');
      opts.images=use; note='The attached reference image shows the subject. Match its proportions, silhouette and main features: choose the closest base shape and size, then sculpt the forms you see. ';
    }
    setSt('Thinking... Claude may ask for your permission the first time.');
    await sample(SC_AI_HEAD.replace(/The request: $/,'')+note+'The request: '+(text||'Sculpt what is shown in the reference image.'),Object.assign({tools:[sculptToolDef()]},opts));
    setSt('Done. Refine it with the brushes.'); toast('Claude finished.'); setMode('sculpt');
  }catch(err){
    if((scAbort&&scAbort.signal.aborted)||(err&&err.code==='cancelled')){ setSt('Stopped.'); }
    else { const msg=aiErrorText(err); setSt(msg); scLog(msg); toast(msg); }
  }finally{ scBusy=false; scAbort=null; btn.textContent='Block out with Claude'; }
}

/* ---------- panel ---------- */
function scBtn(text,fn,cls){ const b=document.createElement('button'); b.type='button'; b.className='pbtn'+(cls?' '+cls:''); b.textContent=text; b.addEventListener('click',fn); return b; }
function scNew(shape){
  scEnd(); const sp=sculptCreate({shape:shape,detail:SCU.detail});
  refreshScene(); selectId(sp.id); setMode('sculpt'); scFrame(); toast('Added '+sp.name+'. Drag on it with one finger to sculpt.');
}
function scFrame(){ const n=sculptTarget(); if(!n) return; const sc=n.userData.sc; sc.geo.computeBoundingBox(); const c=sc.geo.boundingBox.getCenter(new THREE.Vector3()); n.localToWorld(c);
  const R=sc.ref*Math.max(n.scale.x,n.scale.y,n.scale.z), dir=edit.position.clone().sub(orbit.target); if(dir.lengthSq()<1e-6) dir.set(0,0,1); dir.y=Math.max(dir.y,0); dir.normalize();
  orbit.target.copy(c); edit.position.copy(c).addScaledVector(dir,R*3.2); edit.near=Math.min(edit.near,R*.02); edit.updateProjectionMatrix(); orbit.update(); }
function buildSculptPane(){
  const host=document.createElement('div'); host.className='pane'; host.id='pSculpt'; host.hidden=true; $('#pAi').parentNode.appendChild(host);
  const im=document.createElement('img'); im.id='refGuide'; im.alt=''; im.style.display='none'; stage.appendChild(im); scGuide.img=im;
  const stat=document.createElement('p'); stat.className='note'; stat.id='scStat'; stat.style.color='var(--fg)';
  const shapes=document.createElement('div'); shapes.className='g2'; const chBtn=scBtn('Load character from reference sheet',()=>loadCharacter(),'hi');
  Object.keys(SC_SHAPES).forEach(k=>shapes.appendChild(scBtn(SC_SHAPES[k].n,()=>scNew(k))));
  const det=document.createElement('select'); det.className='sel2'; det.setAttribute('aria-label','Resolution');
  det.innerHTML='<option value="low">Low (fast)</option><option value="medium" selected>Medium</option><option value="high">High (fine detail, slower)</option><option value="ultra">Ultra (sculpt pores and wrinkles, needs a fast device)</option>';
  det.addEventListener('change',()=>{ SCU.detail=det.value; });
  const grid=document.createElement('div'); grid.className='g2';
  const mark=()=>Array.from(grid.children).forEach(x=>x.classList.toggle('on',x.dataset.b===SCU.brush));
  SC_BRUSHES.forEach(b=>{ const x=scBtn(b.n,()=>{ SCU.brush=b.id; mark(); setMode('sculpt'); }); x.dataset.b=b.id; grid.appendChild(x); }); mark();
  const fall=document.createElement('select'); fall.className='sel2'; fall.setAttribute('aria-label','Brush falloff');
  [['soft','Soft (balanced)'],['linear','Linear (even fade)'],['sharp','Sharp (concentrated)'],['broad','Broad (flat center)']].forEach(([v,t])=>{ const o=document.createElement('option'); o.value=v; o.textContent=t; fall.appendChild(o); });
  fall.value=SCU.falloff; fall.addEventListener('change',()=>{ SCU.falloff=fall.value; });
  const cs=chk('Mirror left and right (X)',()=>SCU.sym,v=>{ SCU.sym=v; }), cc=chk('Carve (reverse the brush)',()=>SCU.carve,v=>{ SCU.carve=v; });
  const cw=chk('Show wireframe',()=>SCU.wire,v=>{ SCU.wire=v; const n=sculptTarget(); if(n) n.userData.sc.mesh.material.wireframe=v; if(scMatcapMat) scMatcapMat.wireframe=v; });
  const dk=document.createElement('select'); dk.className='sel2'; dk.setAttribute('aria-label','Detail size'); dk.innerHTML='<option value="coarse">Coarse</option><option value="fine" selected>Fine</option><option value="finest">Finest (wrinkles, pores)</option>'; dk.addEventListener('change',()=>{ SCU.dynk=dk.value; });
  const cnt=document.createElement('p'); cnt.className='note'; cnt.id='scCount';
  const pcol=document.createElement('input'); pcol.type='color'; pcol.value=SCU.pcol; pcol.setAttribute('aria-label','Paint color'); pcol.addEventListener('input',()=>{ SCU.pcol=pcol.value; if(SCU.brush!=='paint'){ SCU.brush='paint'; mark(); } });
  const pg=document.createElement('div'); pg.className='g2'; pg.append(scBtn('Fill whole object',scPaintFill),scBtn('Dirt in crevices',scCavity,'hi'),scBtn('Remove paint',scPaintClear),scBtn('Export as .glb (shape and paint)',()=>exportRigGLB(false)));
  const sw=document.createElement('div'); sw.className='g2'; ['#e0b8a0','#c98e74','#a8694f','#7a4a36','#4b2e22','#d8cfc4','#7d8a5a','#5d6a7a'].forEach(h=>{ const b=scBtn('',()=>{ SCU.pcol=h; pcol.value=h; SCU.brush='paint'; mark(); }); b.style.background=h; b.style.minHeight='28px'; b.setAttribute('aria-label','Paint color '+h); sw.appendChild(b); });
  const ed=document.createElement('div'); ed.className='g2'; ed.append(scBtn('Undo',scUndo),scBtn('Redo',scRedo));
  const rs=scBtn('Back to starting shape',scReset);
  /* reference */
  const paste=document.createElement('textarea'); paste.className='ta'; paste.rows=2; paste.placeholder='Touch and hold here, then Paste an image'; paste.setAttribute('aria-label','Paste reference image');
  paste.addEventListener('paste',e=>{ const fs=e.clipboardData&&e.clipboardData.files; if(fs&&fs.length){ e.preventDefault(); scGuideSet(fs[0]); } });
  paste.addEventListener('input',()=>{ paste.value=''; });
  addEventListener('paste',e=>{ if(ptab!=='sculpt'||e.target===paste) return; const fs=e.clipboardData&&e.clipboardData.files; if(fs&&fs.length&&/^image\//.test(fs[0].type)){ e.preventDefault(); scGuideSet(fs[0]); } });
  stage.addEventListener('dragover',e=>e.preventDefault());
  stage.addEventListener('drop',e=>{ const fs=e.dataTransfer&&e.dataTransfer.files; if(fs&&fs.length&&/^image\//.test(fs[0].type)){ e.preventDefault(); scGuideSet(fs[0]); } });
  const pick=filePick('Choose reference image...','image/*',false,fs=>scGuideSet(fs[0]));
  const fromAi=scBtn('Use image from Ask Claude tab',()=>{ const a=aiAtt.find(x=>x.kind==='image'); if(!a){ toast('No image attached in the AI and Import tab.'); return; } scGuideSet(a.file); });
  const refs=document.createElement('div'); refs.className='g2'; SC_REFS.forEach(r=>refs.appendChild(scBtn(r.name,()=>scGuideFromUrl(r.data,r.name))));
  const al=document.createElement('div'); al.className='g2'; al.append(scBtn('Front view',()=>scAlign('front')),scBtn('Side view',()=>scAlign('side')),scBtn('Top view',()=>scAlign('top')),scBtn('Remove reference',scGuideClear));
  const gf=(label,min,max,step,key,fmt)=>rangeField(label,min,max,step,()=>scGuide[key],v=>{ scGuide[key]=v; scGuideApply(); },fmt,null);
  /* AI */
  const pr=document.createElement('textarea'); pr.className='ta'; pr.id='scPrompt'; pr.placeholder='What to sculpt, for example: a tired old fisherman head'; pr.setAttribute('aria-label','Sculpt request');
  const go=scBtn('Block out with Claude',sculptAsk,'hi'); go.id='scGo';
  const ast=document.createElement('p'); ast.className='note'; ast.id='scAiStat'; ast.style.color='var(--fg)';
  const log=document.createElement('div'); log.className='log'; log.id='scLog'; log.setAttribute('aria-live','polite'); log.textContent='Claude sets a base shape and brush strokes from your reference image, then you refine by hand.';
  const js=document.createElement('textarea'); js.className='ta'; js.placeholder='Paste sculpt JSON here'; js.setAttribute('aria-label','Sculpt JSON');
  const bj=scBtn('Build sculpt from JSON',()=>{
    try{ const o=sculptParseJson(js.value); o.edit_existing=false; const r=sculptFromSpec(o); selectId(r.id); refreshScene(); setMode('sculpt'); js.value=''; toast('Built '+r.name+' ('+r.strokes_applied+' strokes).'); }
    catch(err){ toast(err.message||'Could not read that JSON.'); }
  },'hi');
  const cp=scBtn('Copy prompt for ChatGPT',()=>copyText(SC_PROMPT));
  const g3=document.createElement('div'); g3.className='g2'; g3.append(bj,cp);
  host.append(
    panel('Sculpt',[stat,chBtn,shapes,row('Resolution',det),noteEl('Tap a shape to add it, then drag on it with one finger. Use Low if the iPad feels slow, High for faces.')]),
    panel('Brush',[grid,row('Falloff',fall),rangeField('Size',.008,.7,.002,()=>SCU.size,v=>{ SCU.size=v; },f2,null),rangeField('Strength',.05,1,.01,()=>SCU.strength,v=>{ SCU.strength=v; },f2,null),rangeField('Stroke stabilizer',0,.95,.01,()=>SCU.stab,v=>{ SCU.stab=v; },f2,null),rangeField('Pressure smoothing',0,.95,.01,()=>SCU.pressStab,v=>{ SCU.pressStab=v; },f2,null),rangeField('Deformation protection',0,1,.01,()=>SCU.deformGuard,v=>{ SCU.deformGuard=v; },f2,null),rangeField('Joint / crease preservation',0,1,.01,()=>SCU.jointProtect,v=>{ SCU.jointProtect=v; },f2,null),cs,chk('Mirror top and bottom (Y)',()=>SCU.symY,v=>{ SCU.symY=v; }),chk('Mirror front and back (Z)',()=>SCU.symZ,v=>{ SCU.symZ=v; }),cc,chk('Apple Pencil pressure changes strength',()=>SCU.pres,v=>{ SCU.pres=v; }),rangeField('Pressure-to-strength response',.5,2.5,.05,()=>SCU.presStrengthCurve,v=>{ SCU.presStrengthCurve=v; },f2,null),chk('Apple Pencil pressure changes size',()=>SCU.presSize,v=>{ SCU.presSize=v; }),rangeField('Pressure-to-size response',.5,2.5,.05,()=>SCU.presSizeCurve,v=>{ SCU.presSizeCurve=v; },f2,null),noteEl('Pressure response: 1.0 is linear. Lower values make light touches more effective; higher values reserve stronger effects for firmer pressure. Strength and brush size have independent curves. Brush falloff controls how force fades from the center to the edge: Soft is balanced, Linear fades evenly, Sharp concentrates force near the center, and Broad keeps a flatter center for larger forms. Mouse and finger input use full pressure. Symmetry is measured from the sculpt object local center. X mirrors left/right, Y mirrors top/bottom and Z mirrors front/back. Draw, Grab, Snake, Nudge and other brushes use the enabled axes. Stroke stabilizer steadies shaky lines with a time-based filter, so its response stays consistent across frame rates. Pressure smoothing filters sudden Apple Pencil pressure jumps independently of position. Deformation protection limits unusually large per-dab vertex movement relative to nearby edge lengths, reducing spikes and stretched triangles; lower it when you want more aggressive shaping. Joint / crease preservation makes Smooth and Surface Relax respect sharp changes in surface direction, helping retain folds and bend contours around elbows, knees and other curved areas. Increase either setting for steadier results; lower position/pressure smoothing for faster response. Surface relax smooths uneven triangles while helping preserve the overall volume; ordinary Smooth is stronger but can shrink forms. Carve also erases the Mask brush.')]),
    panel('Detail',[chk('Micro detail mode (fingers, toes, eyelids)',()=>SCU.micro,v=>{ SCU.micro=v; if(v&&SCU.size>.035) SCU.size=.025; }),chk('Detail brush: add detail where you sculpt',()=>SCU.dyn,v=>{ SCU.dyn=v; }),row('Detail size',dk),scBtn('Add detail everywhere (about 4x)',scDetailAll),cnt,noteEl('Micro detail mode enables very small brush sizes and automatically refines triangles locally under the stroke, making it easier to work on fingertips, toes, eyelids and narrow creases. It can increase polygon count quickly; use it only where needed and watch the point counter. Detail brush separately adds local resolution while sculpting. Both stop at the device safety limit. Paint also gets sharper where there is more detail. Digit joint (ring crease) makes a compact circumferential fold with a subtle raised lip; use a small brush on finger or toe joints, preferably with Micro detail mode enabled. It is a surface-detail aid and does not create separate finger bones or change the hand rig.')]),
    panel('Paint',[row('Color',pcol),sw,rangeField('Skin mottling',0,1,.01,()=>SCU.pjit,v=>{ SCU.pjit=v; },f2,null),rangeField('Dirt strength',0,1,.01,()=>SCU.dirt,v=>{ SCU.dirt=v; },f2,null),pg,noteEl('Pick Paint color in the brushes, or tap a color, then paint on the model. Skin mottling adds natural unevenness. Dirt in crevices darkens folds and lightens edges, like a weathered texture. Turn on the Detail brush for sharper paint.')]),
    panel('Mask',[(()=>{ const r=document.createElement('div'); r.className='g2'; r.append(scBtn('Clear mask',scMaskClear),scBtn('Invert mask',scMaskInvert),scBtn('Soften mask edge',scMaskBlur)); return r; })(),noteEl('Pick the Mask brush and paint the parts you want to protect. They turn dark and no other brush can change them. Undo works on masks too.')]),
    panel('Edit',[ed,rs,cw,chk('Studio view while sculpting (shows form clearly)',()=>SCU.matcap,v=>{ SCU.matcap=v; }),(()=>{ const sl=document.createElement('select'); sl.className='sel2'; sl.setAttribute('aria-label','Studio material'); Object.keys(SC_MATCAPS).forEach(k=>{ const op=document.createElement('option'); op.value=k; op.textContent=SC_MATCAPS[k].n; sl.appendChild(op); }); sl.value=SCU.mcap; sl.addEventListener('change',()=>{ SCU.mcap=sl.value; SCU.matcap=true; }); return row('Studio material',sl); })(),chk('Photo texture from reference (character)',()=>PHOTO.on,v=>photoSet(v))]),
    panel('Reference image',[paste,pick,fromAi,refs,rangeField('Opacity',.1,1,.05,()=>scGuide.op,v=>{ scGuide.op=v; scGuideApply(); },f2,null),gf('Scale',.3,3,.05,'k',f2),gf('Move left or right',-60,60,1,'x',f0),gf('Move up or down',-60,60,1,'y',f0),al,
      noteEl('The image floats over the viewport so you can sculpt along it. Front, Side and Top line the camera up with a front, side or top reference. No file picker? Paste the image, or send it to me in chat and I will bundle it into the page.')]),
    panel('Photo match',[scPhotoUI()]),
    panel('Block out from the image',[pr,go,ast,log,noteEl('Claude looks at the reference image and sets the starting shape with brush strokes. ChatGPT: copy the prompt, add your image and note there, then paste the JSON it returns.'),js,g3],false));
  scSyncStatus(sculptTarget()); const t0=sculptTarget(); if(t0) scCountSync(t0.userData.sc);
}
