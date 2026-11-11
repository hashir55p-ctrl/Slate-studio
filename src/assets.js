/* ---------- realistic asset library for scene-from-image ---------- */
/* Local space: origin at the base centre, the front of every asset faces +Z, Y is up, 1 unit = 1 metre. */
const A_hex=(v,d)=>(typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v))?v:d;
const A_num=(v,d,lo,hi)=>{ v=+v; return isFinite(v)?Math.min(hi,Math.max(lo,v)):d; };
function A_rng(seed){ let s=(seed|0)||7; return ()=>{ s=(s*16807)%2147483647; return s/2147483647; }; }
const AP=(P,sh,x,y,z,sx,sy,sz,col,o)=>{ o=o||{}; P.push({shape:sh,p:[x,y,z],s:[sx,sy,sz],r:o.r||[0,0,0],color:col,rough:o.rough==null?.9:o.rough,metal:o.metal||0,glow:!!o.glow,tex:o.tex||'',ns:!!o.ns}); };
const aB=(P,x,y,z,sx,sy,sz,c,o)=>AP(P,'box',x,y,z,sx,sy,sz,c,o);
const aC=(P,x,y,z,sx,sy,sz,c,o)=>AP(P,'cylinder',x,y,z,sx,sy,sz,c,o);
const aS=(P,x,y,z,sx,sy,sz,c,o)=>AP(P,'sphere',x,y,z,sx,sy,sz,c,o);
const aCone=(P,x,y,z,sx,sy,sz,c,o)=>AP(P,'cone',x,y,z,sx,sy,sz,c,o);
const aPrism=(P,x,y,z,sx,sy,sz,c,o)=>AP(P,'prism',x,y,z,sx,sy,sz,c,o);
function aRod(P,a,b,th,col,o){
  const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]), len=d.length(); if(len<1e-4) return; d.normalize();
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d), e=new THREE.Euler().setFromQuaternion(q,'XYZ'), D=180/Math.PI;
  o=o||{}; P.push({shape:'cylinder',p:[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],s:[th,len,th],r:[e.x*D,e.y*D,e.z*D],color:col,rough:o.rough==null?.85:o.rough,metal:o.metal||0,glow:false,tex:o.tex||''});
}
const LEAFS=['#5d8c28','#76a238','#4a7a22','#8cb94a','#69992f','#3f6c1e'];

/* --- buildings --- */
function A_building(p){
  const P=[], L=A_num(p.w,15,4,60), D=A_num(p.d,8,3,30), F=Math.round(A_num(p.floors,2,1,5)), H=A_num(p.floorH,3.1,2.4,5);
  const wall=A_hex(p.wall,'#ece2cf'), roof=A_hex(p.roof,'#b4512e'), shut=A_hex(p.shutter,'#2c6a93'), trim=A_hex(p.trim,'#f3ecde');
  const hi=p.detail!=='low', door=p.door!==false, balc=p.balcony!==false&&F>1, awn=p.awning!==false, flat=p.roof_style==='flat';
  const R=A_rng(Math.round(L*7+D*3+F)), base=.6, top=base+H*F, n=Math.max(2,Math.round(L/3.7)), bw=L/n, mid=Math.floor(n/2), DK='#1d2328', IR='#15181b';
  aB(P,0,(base+top)/2,-D/2,L,top-base,D,wall,{rough:.95,tex:'plaster'});
  aB(P,0,.3,-D/2,L+.25,.6,D+.25,'#c8bda8',{rough:1,tex:'plaster'});
  aB(P,0,.64,.05,L+.35,.1,.3,trim,{tex:'plaster'});
  [-1,1].forEach(sg=>{ const x=sg*(L/2-.25); aB(P,x,(base+top)/2,.06,.5,top-base,.18,trim,{tex:'plaster'}); });
  for(let i=1;i<n;i++) aB(P,-L/2+i*bw,(base+top)/2,.04,.28,top-base,.1,trim,{tex:'plaster'});
  for(let f=1;f<F;f++){ aB(P,0,base+H*f,.06,L,.28,.16,trim,{tex:'plaster'}); }
  aB(P,0,top+.1,.16,L+.4,.26,.55,trim,{tex:'plaster'}); aB(P,0,top+.32,.12,L+.5,.14,.7,trim,{tex:'plaster'});
  if(hi) for(let x=-L/2+.6;x<L/2;x+=1.25) aB(P,x,top-.12,.12,.2,.22,.3,'#e2d6bf',{tex:'plaster'});
  const wh=Math.min(2.1,H*.68);
  for(let f=0;f<F;f++){
    const y=base+H*(f+.5)-.1;
    for(let i=0;i<n;i++){
      const x=-L/2+(i+.5)*bw;
      if(f===0&&door&&i===mid){
        aB(P,x,1.95,.05,1.9,3.0,.14,trim,{tex:'plaster'}); aB(P,x,1.8,.1,1.5,2.55,.1,'#1b2024');
        [-1,1].forEach(sg=>{ aB(P,x+sg*.38,1.7,.16,.66,2.35,.08,shut,{rough:.65,tex:'wood'}); aB(P,x+sg*.38,1.25,.2,.46,.7,.03,'#2a5a7c',{rough:.65}); aB(P,x+sg*.38,2.15,.2,.46,.7,.03,'#2a5a7c',{rough:.65}); });
        aC(P,x,3.0,.1,1.4,.08,1.4,'#1b2024',{r:[90,0,0]});
        aB(P,x,.12,.7,2.1,.24,1.0,'#bdb09a',{rough:1,tex:'stone'}); aB(P,x,.3,.55,1.8,.12,.7,'#c8bda8',{rough:1,tex:'stone'});
        continue;
      }
      if(hi){ aB(P,x,y,.04,1.35,wh+.3,.12,trim,{tex:'plaster'}); aC(P,x,y+(wh+.3)/2,.04,1.35,.12,1.35,trim,{r:[90,0,0],tex:'plaster'}); }
      aB(P,x,y,.08,.98,wh,.1,DK); aC(P,x,y+wh/2,.08,.98,.1,.98,DK,{r:[90,0,0]});
      [-1,1].forEach(sg=>{ const sx=x+sg*.78; aB(P,sx,y,.12,.5,wh+.1,.06,shut,{rough:.65,tex:'wood'});
        if(hi) for(let k=0;k<4;k++) aB(P,sx,y-wh*.38+k*wh*.26,.16,.42,.1,.03,shut,{rough:.6,r:[-25,0,0]}); });
      if(hi){ if(f===0) for(let k=-2;k<=2;k++) aB(P,x+k*.2,y,.15,.025,wh,.025,IR,{rough:.5,metal:.4});
        aB(P,x,y-wh/2-.15,.16,1.6,.1,.34,trim,{tex:'plaster'}); aB(P,x,y+wh/2+.3,.12,1.7,.12,.16,trim,{tex:'plaster'}); }
      if(f>0&&balc&&i===mid){ const by=base+H*f; aB(P,x,by,.55,2.9,.14,1.1,trim,{tex:'plaster'});
        for(let k=-5;k<=5;k++) aC(P,x+k*.26,by+.5,1.0,.07,.72,.07,trim,{tex:'plaster'});
        aB(P,x,by+.9,1.05,2.9,.08,.1,trim,{tex:'plaster'}); }
    }
  }
  if(awn){ aB(P,0,base+H-.5,1.0,L+.6,.12,2.3,roof,{r:[14,0,0],rough:.75,tex:'tile'}); if(hi) for(let i=0;i<=n*2;i++) aB(P,-L/2+i*bw/2,base+H-.72,.52,.1,.14,1.2,'#4a3524',{r:[14,0,0],rough:1}); }
  if(flat){ aB(P,0,top+.7,-D/2,L+.2,.7,D+.2,wall,{tex:'plaster'}); aB(P,0,top+1.08,-D/2,L+.35,.1,D+.35,trim,{tex:'plaster'}); }
  else {
    const rise=D*.28, ang=Math.atan(rise/(D/2)), a=ang*180/Math.PI, run=D/2+.8, len=run/Math.cos(ang), cy=top+rise-(run*Math.tan(ang))/2+.1;
    aB(P,0,cy,-D/2+run/2,L+1.2,.22,len,roof,{r:[a,0,0],rough:.8,tex:'tile'});
    aB(P,0,cy,-D/2-run/2,L+1.2,.22,len,roof,{r:[-a,0,0],rough:.8,tex:'tile'});
    aB(P,0,top+rise+.1,-D/2,L+1.2,.3,.45,roof,{rough:.85,tex:'tile'});
    [-1,1].forEach(sg=>{ aPrism(P,sg*L/2,top+rise/2,-D/2,D-.1,rise,.35,wall,{r:[0,90,0],rough:.95,tex:'plaster'}); aC(P,sg*(L/2+.2),top+rise*.45,-D/2,.8,.06,.8,DK,{r:[0,0,90]}); });
    aB(P,L/2-3,top+rise+.2,-D*.65,.9,rise,.9,wall,{tex:'plaster'}); aB(P,L/2-3,top+rise+1.3,-D*.65,1.15,.18,1.15,'#cdbf9f');
  }
  if(hi){ for(let i=0;i<10;i++) aB(P,-L/2+(i*1.37)%L,base+.9+((i*37)%50)/50*(top-base-1.5),.02,.9+(i%3)*.5,.5+(i%4)*.4,.01,i%3?'#d6c9ae':'#bfae8c',{rough:1});
    [-1,1].forEach(sg=>aC(P,sg*(L/2-.5),(base+top)/2,.28,.16,top-base,.16,'#4f5a52',{rough:.5,metal:.3})); }
  return {parts:P};
}

/* --- trees --- */
function A_tree(p){
  const kind=['rain','palm','round','pine'].indexOf(p.kind)>=0?p.kind:'rain', h=A_num(p.h,kind==='rain'?11:8,2,40), P=[], R=A_rng(Math.round(h*13)+kind.length);
  const bark=A_hex(p.bark,'#6b4f38'), bark2='#5a4230', pal=p.leaf?[A_hex(p.leaf,'#5d8c28'),A_hex(p.leaf,'#5d8c28')]:LEAFS;
  const rnd=R, pick=()=>pal[Math.floor(rnd()*pal.length)];
  if(kind==='rain'){
    [[0,.55,1.95],[.05,1.5,1.8],[.12,2.5,1.65],[.2,3.4,1.5]].forEach((t,i)=>aC(P,t[0],t[1],-.02*i,t[2],1.15,t[2]*.97,i%2?bark2:bark,{rough:1,tex:'bark',r:[0,i*40,i%2?2:-2]}));
    AP(P,'cone',0,.45,0,3.4,.9,3.4,bark,{rough:1,tex:'bark'});
    for(let i=0;i<8;i++){ const a=i*.785+.2+rnd()*.2, r1=1.1+rnd()*.3, r2=2.6+rnd()*1.4;
      aRod(P,[Math.cos(a)*.7,1.3,Math.sin(a)*.7],[Math.cos(a)*r1,.45,Math.sin(a)*r1],.5,bark,{rough:1,tex:'bark'});
      aRod(P,[Math.cos(a)*r1,.45,Math.sin(a)*r1],[Math.cos(a)*r2,.04,Math.sin(a)*r2],.32,bark2,{rough:1,tex:'bark'}); }
    for(let i=0;i<6;i++){ const a=rnd()*6.28; aS(P,Math.cos(a)*.85,.6+rnd()*2.4,Math.sin(a)*.85,.5+rnd()*.5,.3+rnd()*.5,.25,'#6e7c3b',{rough:1}); }
    const V=(x,y,z)=>new THREE.Vector3(x,y,z), tips=[];
    const grow=(st,dir,len,th,depth)=>{
      const en=st.clone().addScaledVector(dir,len); aRod(P,[st.x,st.y,st.z],[en.x,en.y,en.z],th,depth%2?bark2:bark,{rough:1,tex:'bark'});
      if(depth>0){ for(let k=0;k<3;k++){ const az=rnd()*6.283, sp=.5+rnd()*.5;
        const d=dir.clone().multiplyScalar(.75).add(V(Math.cos(az)*sp,.25+rnd()*.35,Math.sin(az)*sp*.9+.12)).normalize(); grow(en,d,len*(.66+rnd()*.12),th*.6,depth-1); } }
      else tips.push(en);
    };
    [[3.4,.9,3.6],[-3.2,.8,2.4],[4.6,.8,-.6],[-4.2,.9,-1.8],[.8,.8,-3.8],[2.2,1.0,2.0]].forEach(q=>grow(V(0,3.9,0),V(q[0],q[1],q[2]).normalize(),4.3,.78,2));
    tips.forEach(t=>{ for(let k=0;k<2;k++) aS(P,t.x+(rnd()-.5)*2.2,t.y+.3+rnd()*1.1,t.z+(rnd()-.5)*2.2,3.8+rnd()*2.4,1.5+rnd()*1.1,3.8+rnd()*2.4,pick(),{rough:.95,tex:'leaf'}); });
    for(let i=0;i<24;i++){ const a=rnd()*6.283, r=Math.sqrt(rnd())*8.5; aS(P,Math.cos(a)*r,8.3+rnd()*2-r*.05,Math.sin(a)*r*.9,3.5+rnd()*2.5,1.3+rnd()*.9,3.5+rnd()*2.5,pick(),{rough:.95,tex:'leaf'}); }
    for(let i=0;i<8;i++){ const t=tips[Math.floor(rnd()*tips.length)]; aS(P,t.x*.6,t.y*.7,t.z*.6,.8,.5,.8,'#4d7d2e',{rough:1}); }
    return {parts:P,k:h/10.5};
  }
  if(kind==='palm'){
    const seg=12; let px=0,py=0,pz=0;
    for(let i=0;i<seg;i++){ const t=i/seg, nx=Math.sin(t*1.0)*1.4, ny=(i+1)*.62, th=.5-.18*t; aRod(P,[px,py,pz],[nx,ny,0],th,'#8a7358',{rough:1,tex:'bark'}); px=nx; py=ny; }
    for(let i=0;i<14;i++){ const a=i*.449+rnd()*.2, ln=2.6+rnd()*1.2, droop=.5+rnd()*.5, ex=px+Math.cos(a)*ln, ez=Math.sin(a)*ln, ey=py+.7-droop*ln*.55;
      aRod(P,[px,py+.1,0],[ex,ey,ez],.07,'#6a8a3a',{rough:.9});
      for(let k=1;k<=5;k++){ const t=k/6, fx=px+(ex-px)*t, fy=py+.1+(ey-py-.1)*t, fz=ez*t; aB(P,fx,fy,fz,.08,.03,.7*(1-t*.5),pick(),{r:[0,(a*57.3)+90,0],tex:'leaf'}); } }
    for(let i=0;i<4;i++) aS(P,px+(rnd()-.5)*.4,py-.1,(rnd()-.5)*.4,.28,.28,.28,'#7a5a2a',{rough:.9});
    return {parts:P,k:h/8};
  }
  if(kind==='pine'){
    aC(P,0,1.2,0,.45,2.4,.45,bark,{rough:1,tex:'bark'});
    for(let i=0;i<6;i++){ const w=4.2-i*.62; aCone(P,0,2.3+i*1.15,0,w,2.0-i*.12,w,i%2?'#2f5d34':'#3a6d3c',{rough:.95,tex:'leaf'}); }
    return {parts:P,k:h/9};
  }
  aC(P,0,1.7,0,.7,3.4,.7,bark,{rough:1,tex:'bark'}); aRod(P,[0,3,0],[1.2,4.4,.4],.28,bark,{tex:'bark'}); aRod(P,[0,3,0],[-1.1,4.2,-.5],.26,bark,{tex:'bark'});
  for(let i=0;i<16;i++){ const a=rnd()*6.28, r=Math.sqrt(rnd())*2.8; aS(P,Math.cos(a)*r,4.6+rnd()*2.4,Math.sin(a)*r,2.2+rnd()*1.6,1.6+rnd()*1.2,2.2+rnd()*1.6,pick(),{rough:.95,tex:'leaf'}); }
  return {parts:P,k:h/7.6};
}

/* --- ground, water, walls --- */
function A_tiles(P,w,d,y,th,col,o){
  const nx=Math.min(4,Math.max(1,Math.ceil(w/100))), nz=Math.min(4,Math.max(1,Math.ceil(d/100))), sw=w/nx, sd=d/nz;
  for(let i=0;i<nx;i++) for(let j=0;j<nz;j++) aB(P,-w/2+sw*(i+.5),y,-d/2+sd*(j+.5),sw,th,sd,col,o);
}
function A_ground(p){
  const P=[], w=A_num(p.w,20,1,400), d=A_num(p.d,20,1,400), kind=['cobble','grass','sand','dirt','stone','asphalt'].indexOf(p.kind)>=0?p.kind:'cobble', R=A_rng(Math.round(w+d));
  const base={cobble:['#b79a78','cobble'],grass:['#5e8a38',''],sand:['#d8c08e',''],dirt:['#7a6347',''],stone:['#9a948a','stone'],asphalt:['#47474a','']}[kind];
  A_tiles(P,w,d,.1,.2,A_hex(p.color,base[0]),{rough:1,tex:base[1]});
  if(kind==='grass'){ for(let i=0;i<30;i++) aB(P,(R()-.5)*w,.205,(R()-.5)*d,2+R()*5,.01,2+R()*5,R()<.5?'#4c7a2c':'#74a047',{rough:1}); }
  return {parts:P};
}
function A_water(p){
  const P=[], w=A_num(p.w,60,1,400), d=A_num(p.d,60,1,400);
  A_tiles(P,w,d,.02,.04,A_hex(p.color,'#2f8da8'),{rough:.1,metal:.25,tex:'water'});
  return {parts:P};
}
function A_seawall(p){
  const P=[], len=A_num(p.len,30,1,200), h=A_num(p.h,.95,.3,3), col=A_hex(p.color,'#d9c5ae'), R=A_rng(Math.round(len)), nx=Math.ceil(len/100), sl=len/nx;
  for(let i=0;i<nx;i++){ const x=-len/2+sl*(i+.5); aB(P,x,h/2,0,sl,h,.7,col,{rough:.95,tex:'stone'}); aB(P,x,h+.07,0,sl,.14,.95,'#cdb99f',{rough:.95,tex:'stone'}); }
  for(let i=0;i<Math.min(24,Math.round(len/4));i++) aB(P,(R()-.5)*len,h*.3+R()*h*.4,.37,1+R()*2.4,.2+R()*.3,.03,R()<.6?'#74804c':'#b88a76',{rough:1});
  return {parts:P};
}
function A_hill(p){
  const P=[], w=A_num(p.w,80,5,400), h=A_num(p.h,12,1,100), col=A_hex(p.color,'#4d7a5a');
  aS(P,0,0,0,w,h*2,w*.55,col,{rough:1}); aS(P,w*.28,0,w*.05,w*.6,h*1.5,w*.4,'#456f50',{rough:1}); aS(P,-w*.3,0,-w*.04,w*.55,h*1.3,w*.38,'#55855f',{rough:1});
  return {parts:P};
}

/* --- props --- */
function A_lamp(p){
  const P=[], K='#1b1d1f', o={rough:.45,metal:.6}, h=A_num(p.h,5.3,1,15), x=0, z=0;
  aB(P,x,.09,z,.7,.18,.7,K,o); aB(P,x,.42,z,.5,.5,.5,K,o); aB(P,x,.74,z,.36,.16,.36,K,o);
  aC(P,x,2.35,z,.15,3.2,.15,K,o); aC(P,x,1.2,z,.26,.1,.26,K,o); aC(P,x,2.3,z,.22,.08,.22,K,o); aC(P,x,3.55,z,.24,.1,.24,K,o);
  aRod(P,[x,3.1,z],[x-.38,3.5,z],.035,K,o); aRod(P,[x,3.1,z],[x+.38,3.5,z],.035,K,o);
  aB(P,x,3.98,z,.54,.08,.54,K,o); aB(P,x,4.28,z,.34,.52,.34,'#ffd9a0',{glow:true});
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(q=>aC(P,x+q[0]*.2,4.3,z+q[1]*.2,.05,.64,.05,K,o));
  aB(P,x,4.64,z,.56,.06,.56,K,o); aCone(P,x,4.88,z,.78,.34,.78,K,o); aCone(P,x,5.12,z,.3,.14,.3,K,o); aS(P,x,5.24,z,.12,.12,.12,K,o);
  return {parts:P,k:h/5.3};
}
function A_bench(p){
  const P=[], len=A_num(p.len,2.3,.6,8), col=A_hex(p.color,'#cbbca5');
  aB(P,0,.55,0,2.3,.2,.65,col,{rough:1,tex:'stone'}); aB(P,-.85,.27,0,.4,.45,.55,'#bfb09a',{rough:1,tex:'stone'}); aB(P,.85,.27,0,.4,.45,.55,'#bfb09a',{rough:1,tex:'stone'});
  aB(P,.2,.66,.05,.8,.02,.3,'#7d8a4d',{rough:1});
  return {parts:P,k:len/2.3};
}
function A_boat(p){
  const P=[], hull=A_hex(p.color,'#2b6e9c'), R='#b5382c', wd='#a58660', len=A_num(p.len,5.4,1,30);
  aS(P,0,.05,0,1.7,.95,5.4,hull,{rough:.5,tex:'wood'}); aS(P,0,.46,0,1.5,.1,5.0,'#8a6a45',{rough:.9,tex:'wood'});
  for(let k=0;k<2;k++){ const sg=k?-1:1; for(let z=-2.3;z<=2.31;z+=.46){
    const w=.84*Math.sqrt(Math.max(.05,1-Math.pow(z/2.75,2))), w2=.84*Math.sqrt(Math.max(.05,1-Math.pow((z+.46)/2.75,2)));
    aB(P,sg*w,.5,z+.23,.07,.1,.5,R,{r:[0,-sg*Math.atan((w2-w)/.46)*57.3,0],rough:.6}); } }
  [-1.9,-1.45,-.95,-.45,.05,.55,1.05,1.55,2.0].forEach(z=>aB(P,0,.5,z,1.25,.035,.07,'#6e5233',{rough:1}));
  [-1.25,0,1.25].forEach(z=>aB(P,0,.58,z,1.4,.06,.2,wd,{tex:'wood'}));
  aB(P,0,.58,2.5,.12,.5,.14,R,{r:[-22,0,0],rough:.6}); aB(P,0,.9,2.74,.12,.5,.14,R,{r:[-48,0,0],rough:.6});
  aB(P,0,.58,-2.5,.12,.5,.14,R,{r:[22,0,0],rough:.6}); aB(P,0,.9,-2.74,.12,.5,.14,R,{r:[48,0,0],rough:.6});
  AP(P,'torus',0,.72,-1.8,.5,.5,.5,'#cbb88a',{r:[90,0,0],rough:1}); aS(P,.1,.6,-1.5,.8,.3,.6,'#9fb3c2',{rough:1});
  aRod(P,[.55,.75,-.4],[1.9,.15,1.5],.05,'#7b5a3a',{tex:'wood'}); aB(P,2.05,.12,1.7,.12,.04,.5,'#8b6b3e',{r:[0,-20,0]});
  aC(P,0,1.2,.9,.07,1.8,.07,'#7b5a3a'); aC(P,.3,.9,-.9,.07,1.2,.07,'#7b5a3a');
  return {parts:P,k:len/5.4};
}
function A_pier(p){
  const P=[], len=A_num(p.len,16,3,80), w=A_num(p.w,2.6,1,8), wd='#6b5238', pl='#4a3a2a';
  aB(P,0,.7,len/2,w,.2,len,wd,{rough:.9,tex:'wood'});
  for(let z=.4;z<len;z+=1) aB(P,0,.805,z,w,.01,.05,'#4f3c28',{rough:1});
  for(let z=1;z<=len;z+=3){ aC(P,-w/2+.1,.1,z,.22,2.3,.22,pl,{rough:1,tex:'wood'}); aC(P,w/2-.1,.1,z,.22,2.3,.22,pl,{rough:1,tex:'wood'}); }
  for(let z=2;z<=len;z+=3.6){ aC(P,-w/2,1.3,z,.1,1.2,.1,pl,{rough:1}); aC(P,w/2,1.3,z,.1,1.2,.1,pl,{rough:1}); }
  aRod(P,[-w/2,1.85,2],[-w/2,1.85,len],.05,'#8a7050',{rough:1}); aRod(P,[w/2,1.85,2],[w/2,1.85,len],.05,'#8a7050',{rough:1});
  return {parts:P};
}
function A_net(p){
  const P=[], bam='#8b6b3e', wd='#6b5238', rope='#3a3026', sc=A_num(p.size,1,.3,3);
  aB(P,0,.7,0,4,.18,4.5,wd,{tex:'wood'});
  [[-1.7,-1.9],[1.7,-1.9],[-1.7,1.9],[1.7,1.9]].forEach(a=>aC(P,a[0],-.2,a[1],.22,2.2,.22,'#4a3a2a',{rough:1,tex:'wood'}));
  aRod(P,[-1.4,.8,-1.2],[-.3,5.2,.2],.17,bam,{tex:'wood'}); aRod(P,[1.4,.8,-1.2],[.3,5.2,.2],.17,bam,{tex:'wood'});
  aRod(P,[0,3.2,-2.8],[0,9.4,7.4],.15,bam,{tex:'wood'}); aS(P,0,2.9,-2.9,.9,.9,.9,'#6a665e',{rough:1,tex:'stone'});
  aRod(P,[0,3.1,-2.8],[0,1.0,-1.8],.04,rope,{rough:1}); aRod(P,[0,5.2,.2],[-1.0,2.0,-1.8],.04,rope,{rough:1});
  const H=[0,8.8,6.6], cs=[[-3.4,4.2,3.5],[3.4,4.2,3.5],[-3.4,3.7,9.8],[3.4,3.7,9.8]];
  cs.forEach(c=>aRod(P,H,c,.075,bam,{tex:'wood'}));
  [[0,1],[1,3],[3,2],[2,0]].forEach(e=>aRod(P,cs[e[0]],cs[e[1]],.05,rope,{rough:1})); aRod(P,cs[0],cs[3],.04,rope,{rough:1}); aRod(P,cs[1],cs[2],.04,rope,{rough:1});
  aB(P,0,4.0,6.65,6.6,.04,6.4,'#c4d3de',{r:[-3,0,0],rough:1}); aS(P,0,3.7,6.65,6.0,1.7,5.8,'#b7c8d6',{rough:1});
  for(let i=-2;i<=2;i++){ aRod(P,[i*1.2,4.05,3.6],[i*1.2,3.4,9.7],.02,'#7f93a3',{rough:1}); aRod(P,[-3.2,4.05,6.65+i*1.2],[3.2,3.5,6.65+i*1.2],.02,'#7f93a3',{rough:1}); }
  aB(P,1.2,1.0,-1.2,.8,.4,.6,'#7b5a3a',{tex:'wood'}); aC(P,-1.3,1.05,1.0,.3,.34,.3,'#2f5d86',{rough:.5,metal:.2});
  return {parts:P,k:sc};
}
function A_planter(p){
  const P=[], R=A_rng(5), n=Math.round(A_num(p.n,1,1,6));
  for(let j=0;j<n;j++){ const x=j*.9; aC(P,x,.45,0,.6,.5,.6,'#b2543a',{rough:.9});
    for(let k=0;k<4;k++) aS(P,x+(R()-.5)*.4,.95+R()*.5,(R()-.5)*.3,.7+R()*.3,.7+R()*.4,.7,['#3f7a2c','#58922f','#2f6a28'][k%3],{rough:.9,tex:'leaf'}); }
  return {parts:P};
}
function A_bush(p){
  const P=[], R=A_rng(9), s=A_num(p.size,1.4,.3,6), col=A_hex(p.color,'#4c7a2c');
  for(let i=0;i<7;i++) aS(P,(R()-.5)*s,s*.35+R()*s*.3,(R()-.5)*s,s*.7*(.7+R()*.5),s*.55,s*.7*(.7+R()*.5),i%2?col:'#5f8f33',{rough:.95,tex:'leaf'});
  return {parts:P};
}
function A_vines(p){
  const P=[], R=A_rng(3), w=A_num(p.w,5,1,30), h=A_num(p.h,7,1,20), pk=['#d9408c','#c0286f','#e8559a','#b01e62','#f06aa8'], base=A_hex(p.color,'');
  for(let i=0;i<60;i++){ const y=1+Math.pow(R(),.8)*h, ww=.5+(y/h)*w; aS(P,(R()-.5)*ww*1.6,y,.45+R()*.5,.7+R()*1.3,.6+R()*1.0,.6+R()*.7,base||pk[Math.floor(R()*pk.length)],{rough:.9,tex:'leaf'}); }
  for(let i=0;i<20;i++) aS(P,(R()-.5)*w,1+R()*h,.3+R()*.3,.5+R()*.6,.5+R()*.6,.5,'#4f7d2b',{rough:.95,tex:'leaf'});
  return {parts:P};
}
function A_rock(p){
  const P=[], R=A_rng(11), s=A_num(p.size,1.2,.2,10), col=A_hex(p.color,'#7a746a');
  for(let i=0;i<4;i++) aS(P,(R()-.5)*s,s*.25,(R()-.5)*s,s*(.6+R()*.5),s*(.4+R()*.3),s*(.6+R()*.5),i%2?col:'#6a655c',{rough:1,tex:'stone'});
  return {parts:P};
}
function A_ship(p){
  const P=[], len=A_num(p.len,30,5,200);
  aB(P,0,1.4,0,30,2.8,7,'#59626a',{rough:.6,metal:.3}); aB(P,-6,3.8,0,10,2.4,5.5,'#d8d6d0',{rough:.7}); aB(P,-6,5.6,0,6,1.4,4,'#c9c6bf',{rough:.7});
  aB(P,8,3.6,0,3,.6,3,'#8a3a2e'); aC(P,8,5.4,0,.35,3,.35,'#44484c');
  return {parts:P,k:len/30};
}
const ASSETS={building:A_building,tree:A_tree,ground:A_ground,water:A_water,seawall:A_seawall,hill:A_hill,lamp:A_lamp,bench:A_bench,boat:A_boat,pier:A_pier,fishing_net:A_net,planter:A_planter,bush:A_bush,vines:A_vines,rock:A_rock,ship:A_ship};
