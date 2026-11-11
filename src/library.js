/* ---------- grand library hall: assets and layout ---------- */
const LB_ST='#54463a', LB_ST2='#3e332a', LB_JOINT='#241c15', LB_WD='#24180f', LB_WD2='#38261a';
function lbRod(P,a,b,th,col,o){
  const dx=b[0]-a[0], dy=b[1]-a[1], dz=b[2]-a[2], len=Math.hypot(dx,dy,dz); if(len<1e-4) return;
  const x=dx/len, y=dy/len, z=dz/len; let ex,ey,ez;
  if(y<-.99999){ ex=Math.PI; ey=0; ez=0; }
  else {
    const vx=z, vy=0, vz=-x, k=1/(1+y);
    const m11=1+(-vz*vz-vy*vy)*k, m12=-vz+vx*vy*k, m13=vy+vx*vz*k, m22=1+(-vz*vz-vx*vx)*k, m23=-vx+vy*vz*k, m32=vx+vy*vz*k, m33=1+(-vy*vy-vx*vx)*k;
    ey=Math.asin(Math.max(-1,Math.min(1,m13)));
    if(Math.abs(m13)<.9999999){ ex=Math.atan2(-m23,m33); ez=Math.atan2(-m12,m11); } else { ex=Math.atan2(m32,m22); ez=0; }
  }
  const D=180/Math.PI; o=o||{};
  P.push({shape:'cylinder',p:[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],s:[th,len,th],r:[ex*D,ey*D,ez*D],color:col,rough:o.rough==null?.7:o.rough,metal:o.metal||0,glow:false,tex:o.tex||'',ns:false});
}
function lbArch(P,span,t,depth,n,col,cx,cy,cz,ns,tex){
  const rc=span/2+t/2, seg=Math.PI*rc/n*1.07;
  for(let i=0;i<n;i++){
    const th=(i+.5)*Math.PI/n, key=(n%2===1&&i===(n-1)/2), tt=key?t*1.3:t, rr=key?rc+t*.15:rc;
    P.push({shape:'box',p:[cx+rr*Math.cos(th),cy+rr*Math.sin(th),cz],s:[tt,seg*(key?1.2:1),depth],r:[0,0,th*180/Math.PI],color:col,rough:.9,metal:0,glow:false,tex:tex==null?'stone':tex,ns:!!ns});
  }
}
function A_lbPillar(p){
  const P=[], w=A_num(p.w,1.8,.5,4), h=A_num(p.h,8,3,20), c=A_hex(p.color,LB_ST), c2=A_hex(p.shade,LB_ST2);
  aB(P,0,.3,0,w+.5,.6,w+.5,c2,{tex:'stone'}); aB(P,0,.72,0,w+.25,.24,w+.25,c,{tex:'stone'});
  const y0=.84, y1=h-1.25, hs=y1-y0, nc=Math.max(2,Math.round(hs/1.15));
  aB(P,0,(y0+y1)/2,0,w,hs,w,c,{tex:'stone'});
  for(let i=1;i<nc;i++){ const y=y0+hs*i/nc; aB(P,0,y,w/2+.012,w+.02,.035,.03,LB_JOINT,{rough:1}); aB(P,w/2+.012,y,0,.03,.035,w+.02,LB_JOINT,{rough:1}); aB(P,-w/2-.012,y,0,.03,.035,w+.02,LB_JOINT,{rough:1}); }
  aB(P,0,(y0+y1)/2,w/2+.02,w*.5,hs*.6,.04,c2,{tex:'stone'});
  aB(P,0,h-1.1,0,w+.16,.3,w+.16,c,{tex:'stone'}); aB(P,0,h-.82,0,w+.5,.26,w+.5,c2,{tex:'stone'}); aB(P,0,h-.52,0,w+.85,.34,w+.85,c,{tex:'stone'}); aB(P,0,h-.2,0,w+1.1,.4,w+1.1,c2,{tex:'stone'});
  return {parts:P,k:1};
}
function A_lbArch(p){
  const P=[], span=A_num(p.span,6,1,30), t=A_num(p.t,.8,.2,2), d=A_num(p.depth,1.1,.1,4);
  lbArch(P,span,t,d,A_num(p.n,15,7,31)|1,A_hex(p.color,LB_ST),0,0,0,false);
  return {parts:P,k:1};
}
function A_lbFloor(p){
  const P=[], w=A_num(p.w,24,2,100), d=A_num(p.d,34,2,100);
  aB(P,0,.1,0,w,.2,d,'#2f2a26',{tex:'tile',rough:.2});
  aB(P,0,.205,0,w-.01,.01,2.4,'#3b312a',{tex:'tile',rough:.2});
  return {parts:P,k:1};
}
function A_lbWall(p){
  const P=[], w=A_num(p.w,30,1,100), h=A_num(p.h,13.5,2,30), d=A_num(p.d,.8,.2,3);
  aB(P,0,h/2,0,w,h,d,'#4a3d33',{tex:'stone'}); aB(P,0,.5,.06,w,1,d+.12,'#30271f',{tex:'stone'}); aB(P,0,h-.5,.12,w,.5,d+.3,LB_ST2,{tex:'stone'});
  return {parts:P,k:1};
}
function A_lbCeiling(p){
  const P=[], w=A_num(p.w,24,2,100), d=A_num(p.d,34,2,100), h=A_num(p.h,13.5,3,30);
  P.push({shape:'box',p:[0,h+.2,0],s:[w,.4,d],r:[0,0,0],color:'#1f1812',rough:1,metal:0,glow:false,tex:'plaster',ns:true});
  for(let x=-w/2+3;x<w/2;x+=4) P.push({shape:'box',p:[x,h-.15,0],s:[.45,.4,d],r:[0,0,0],color:'#2a211a',rough:1,metal:0,glow:false,tex:'stone',ns:true});
  for(let z=-d/2+3;z<d/2;z+=5) P.push({shape:'box',p:[0,h-.15,z],s:[w,.4,.45],r:[0,0,0],color:'#2a211a',rough:1,metal:0,glow:false,tex:'stone',ns:true});
  return {parts:P,k:1};
}
function A_lbStairs(p){
  const P=[], w=A_num(p.w,9.4,1,30), n=Math.round(A_num(p.n,6,2,14)), tr=A_num(p.tread,.5,.2,1.2), ri=A_num(p.rise,.2,.08,.4), top=n*ri, land=A_num(p.landing,1,0,4);
  for(let i=0;i<n;i++) aB(P,0,(i+1)*ri/2,-(i+.5)*tr,w,(i+1)*ri,tr+.01,i%2?'#3c3128':'#46392f',{tex:'stone',rough:.8});
  if(land>0) aB(P,0,top/2,-n*tr-land/2,w,top,land,'#3a2f26',{tex:'stone'});
  const ang=Math.atan2(ri,tr)*180/Math.PI, sl=Math.hypot(n*tr,top);
  [-1,1].forEach(sg=>{ aB(P,sg*(w/2+.3),top/2+.35,-n*tr/2,.6,.5,sl,LB_ST,{r:[ang,0,0],tex:'stone'}); aB(P,sg*(w/2+.3),top/2-.1,-n*tr/2-.5,.6,top,n*tr+1,LB_ST2,{tex:'stone'}); });
  return {parts:P,k:1};
}
function A_lbDoor(p){
  const P=[], w=A_num(p.w,6.4,3,12), h=A_num(p.h,5,2,10), r=w/2, R=A_rng(21), DK='#3b2a1d', MT='#8a6a3f', ST=LB_ST;
  aB(P,0,h/2,0,w,h,.3,DK,{metal:.1,rough:.6,tex:'wood'}); aC(P,0,h,0,w,.28,w,DK,{r:[90,0,0],metal:.5,rough:.45});
  aB(P,0,h/2,.16,.07,h,.03,'#0d0907'); aB(P,0,h+r/2,.15,.07,r,.03,'#0d0907');
  lbArch(P,w+.2,.55,.6,17,ST,0,h,.05,false);
  [-1,1].forEach(sg=>aB(P,sg*(r+.375),h/2,.05,.55,h,.6,ST,{tex:'stone'}));
  [1.1,h*.64].forEach(y=>{ aB(P,0,y,.17,w,.14,.05,'#2d2118',{metal:.5,rough:.45}); for(let x=-r+.3;x<r;x+=.6) aS(P,x,y,.2,.1,.1,.06,MT,{metal:.8,rough:.35}); });
  const gl=(a,b)=>{ lbRod(P,a,b,.035,'#e0a840'); P[P.length-1].glow=true; };
  for(let i=0;i<22;i++){ const a0=Math.PI*i/22, a1=Math.PI*(i+1)/22, q=a=>[(r-.1)*Math.cos(a),h+(r-.1)*Math.sin(a),.175]; gl(q(a0),q(a1)); }
  gl([-(r-.1),.3,.175],[-(r-.1),h,.175]); gl([r-.1,.3,.175],[r-.1,h,.175]); gl([-.05,.3,.175],[-.05,h+r-.1,.175]); gl([.05,.3,.175],[.05,h+r-.1,.175]);
  const root=(sg,pts,th)=>{ for(let i=0;i<pts.length-1;i++) lbRod(P,[sg*pts[i][0],pts[i][1],.22],[sg*pts[i+1][0],pts[i+1][1],.22],th*(1-i*.12),MT,{metal:.75,rough:.35}); };
  [-1,1].forEach(sg=>{
    root(sg,[[0,1.5],[.5,1.0],[1.2,.6],[2.0,.55],[2.7,.9],[2.95,1.6]],.2);
    root(sg,[[0,1.6],[.35,1.2],[.9,1.0],[1.5,1.25],[1.9,1.9]],.16);
    root(sg,[[.4,.95],[.7,.55],[1.1,.25]],.12);
  });
  lbRod(P,[0,1.3,.22],[0,2.3,.22],.62,MT,{metal:.75,rough:.35}); lbRod(P,[0,2.3,.22],[0,3.2,.22],.46,MT,{metal:.75,rough:.35});
  const leaf=(x,y)=>{ P.push({shape:'sphere',p:[x,y,.22],s:[.34,.2,.06],r:[0,0,Math.round(R()*180)],color:MT,rough:.35,metal:.75,glow:false,tex:'',ns:false}); };
  const br=(x,y,a,len,th,dep)=>{
    const ex=x+len*Math.sin(a), ey=y+len*Math.cos(a); lbRod(P,[x,y,.22],[ex,ey,.22],th,MT,{metal:.75,rough:.35});
    if(dep>0){ br(ex,ey,a-(.4+R()*.3),len*.72,th*.66,dep-1); br(ex,ey,a+(.4+R()*.3),len*.72,th*.66,dep-1); }
    else { leaf(ex,ey); leaf(ex+.18,ey+.1); leaf(ex-.18,ey+.06); }
    if(dep===2){ leaf(ex,ey); }
  };
  const crown=3.2;
  br(0,crown,0,1.7,.26,2);
  [-1,1].forEach(sg=>{ br(0,crown-.1,sg*.55,1.9,.24,2); br(0,crown-.2,sg*1.05,1.7,.2,2); br(0,crown-.3,sg*1.5,1.35,.16,1); });
  [-1,1].forEach(sg=>{ AP(P,'torus',sg*(r-.45),h-.55,.24,.7,.7,.4,MT,{metal:.8,rough:.35}); AP(P,'torus',sg*.5,1.95,.24,.55,.55,.4,MT,{metal:.8,rough:.35}); });
  return {parts:P,k:1};
}
function A_lbShelf(p){
  const P=[], w=A_num(p.w,2.8,1,6), h=A_num(p.h,5.2,2,9), d=A_num(p.d,.55,.2,1.2), hi=p.detail!=='low', R=A_rng(Math.round(w*13+h*7+(+p.seed||0)));
  aB(P,0,h/2,-d/2+.03,w,h,.06,'#120d09',{tex:'wood',rough:.8}); aB(P,0,.14,0,w+.1,.28,d+.1,LB_WD,{tex:'wood',rough:.6});
  [-1,1].forEach(sg=>aB(P,sg*(w/2-.04),h/2,0,.08,h,d,LB_WD2,{tex:'wood',rough:.6}));
  aB(P,0,h-.07,0,w+.06,.14,d+.1,LB_WD2,{tex:'wood',rough:.6}); aB(P,0,h+.12,0,w+.2,.1,d+.2,LB_WD,{tex:'wood',rough:.6});
  const rows=5, y0=.3, rh=(h-.5)/rows, cols=['#4a2a1f','#5a3a28','#2d2420','#6b4a32','#7a5a3e','#3a2a22','#8a6a4a','#241c18','#5e2f25','#3a3328'];
  for(let k=0;k<rows;k++){
    const yb=y0+k*rh; aB(P,0,yb,0,w-.04,.05,d,LB_WD2,{tex:'wood',rough:.6});
    let x=-w/2+.1; const end=w/2-.12, bw0=hi?.17:.6, bw1=hi?.28:.8;
    while(x<end-.08){
      const bw=Math.min(end-x,bw0+R()*(bw1-bw0)), bh=rh*(.62+R()*.3), lean=hi&&R()<.08;
      P.push({shape:'box',p:[x+bw/2,yb+.025+bh/2,.02],s:[bw*.95,bh,d*.78],r:[0,0,lean?10:0],color:cols[Math.floor(R()*cols.length)],rough:.8,metal:0,glow:false,tex:'',ns:false});
      x+=bw+(R()<.1?.1:.01);
    }
  }
  return {parts:P,k:1};
}
function A_lbRug(p){
  const P=[], w=A_num(p.w,7,2,20), d=A_num(p.d,12,2,40);
  aB(P,0,.03,0,w,.05,d,'#2a1a18',{rough:1}); aB(P,0,.06,0,w-.3,.03,d-.3,'#5a3a2e',{rough:1});
  aB(P,0,.075,0,w-.8,.03,d-.8,'#241614',{rough:1}); aB(P,0,.09,0,w-1.1,.03,d-1.1,'#3d2a24',{rough:1});
  const nx=Math.floor((w-1.5)/.85), nz=Math.floor((d-1.5)/.85);
  for(let i=0;i<nx;i++) for(let j=0;j<nz;j++){ const x=(i-(nx-1)/2)*.85, z=(j-(nz-1)/2)*.85, alt=(i+j)%2;
    P.push({shape:'box',p:[x,.115,z],s:[.5,.02,.5],r:[0,45,0],color:alt?'#6b4a3a':'#1c1210',rough:1,metal:0,glow:false,tex:'',ns:false});
    if(!alt) P.push({shape:'box',p:[x,.125,z],s:[.2,.02,.2],r:[0,45,0],color:'#4d3328',rough:1,metal:0,glow:false,tex:'',ns:false}); }
  return {parts:P,k:1};
}
function A_lbDesk(p){
  const P=[], w=A_num(p.w,3.2,1,6), d=A_num(p.d,1.4,.5,3), h=.95, WD='#2a1d14', WL='#40301f';
  aB(P,0,h-.06,0,w,.12,d,WL,{tex:'wood',rough:.45}); aB(P,0,h-.26,0,w-.2,.22,d-.2,WD,{tex:'wood',rough:.6});
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(q=>{ const x=q[0]*(w/2-.17), z=q[1]*(d/2-.17);
    aC(P,x,(h-.2)/2,z,.14,h-.2,.14,WD,{tex:'wood',rough:.55}); aS(P,x,.42,z,.2,.18,.2,WD,{tex:'wood'}); aB(P,x,.12,z,.2,.12,.2,WD,{tex:'wood'}); });
  aB(P,0,.28,0,w-.4,.07,.07,WD,{tex:'wood'}); aB(P,0,.28,d/2-.17,w-.4,.07,.07,WD,{tex:'wood'}); aB(P,0,.28,-d/2+.17,w-.4,.07,.07,WD,{tex:'wood'});
  [-.7,.7].forEach(x=>{ aB(P,x,h-.28,d/2-.09,1.1,.24,.04,WL,{tex:'wood'}); aS(P,x,h-.28,d/2-.05,.07,.07,.07,'#8a7a5a',{metal:.7,rough:.4}); });
  return {parts:P,k:1};
}
function A_lbChair(p){
  const P=[], WD='#2a1d14', CL='#5a2a24';
  aB(P,0,.5,0,.62,.1,.6,CL,{rough:1}); aB(P,0,.42,0,.7,.1,.66,WD,{tex:'wood'});
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(q=>aB(P,q[0]*.3,.2,q[1]*.28,.07,.4,.07,WD,{tex:'wood'}));
  aB(P,0,1.15,-.3,.66,1.1,.08,WD,{tex:'wood'}); aB(P,0,1.2,-.26,.5,.85,.07,CL,{rough:1});
  aB(P,0,1.78,-.3,.78,.1,.1,WD,{tex:'wood'});
  [-1,1].forEach(sg=>{ aB(P,sg*.34,.8,-.02,.06,.06,.5,WD,{tex:'wood'}); aB(P,sg*.34,.65,.18,.06,.3,.06,WD,{tex:'wood'}); });
  return {parts:P,k:1};
}
function A_lbGlobe(p){
  const P=[], r=A_num(p.r,.42,.1,2), BR='#8a6a3a';
  aC(P,0,.04,0,r*1.1,.08,r*1.1,'#3a2c20',{tex:'wood'}); aC(P,0,r*.7,0,.06,r*1.2,.06,'#3a2c20',{tex:'wood'});
  aS(P,0,r*1.45,0,r*1.7,r*1.7,r*1.7,'#8a7458',{rough:.5});
  lbRod(P,[-r*1.1,r*.65,0],[-r*.85,r*2.1,0],.045,BR,{metal:.7,rough:.35}); lbRod(P,[-r*.85,r*2.1,0],[0,r*2.5,0],.045,BR,{metal:.7,rough:.35}); lbRod(P,[0,r*2.5,0],[r*.85,r*2.1,0],.045,BR,{metal:.7,rough:.35}); lbRod(P,[r*.85,r*2.1,0],[r*1.1,r*.65,0],.045,BR,{metal:.7,rough:.35});
  return {parts:P,k:1};
}
function A_lbArmillary(p){
  const P=[], r=A_num(p.r,.5,.1,2), BR='#a88a4a', n=14; aC(P,0,.03,0,r*1.2,.06,r*1.2,'#3a2c20',{tex:'wood'}); aC(P,0,r*.55,0,.07,r*1.1,.07,BR,{metal:.7,rough:.4});
  const ring=(tx,ty)=>{ for(let i=0;i<n;i++){ const a0=i*2*Math.PI/n, a1=(i+1)*2*Math.PI/n, pt=a=>{ let x=r*Math.cos(a), y=r*Math.sin(a), z=0; const c=Math.cos(tx),s=Math.sin(tx); const y2=y*c-z*s, z2=y*s+z*c; const c2=Math.cos(ty),s2=Math.sin(ty); return [x*c2+z2*s2, r*1.55+y2, -x*s2+z2*c2]; }; lbRod(P,pt(a0),pt(a1),.035,BR,{metal:.8,rough:.35}); } };
  ring(0,0); ring(Math.PI/2,0); ring(Math.PI/2,Math.PI/2); ring(.4,.5);
  aS(P,0,r*1.55,0,.14,.14,.14,'#8a7458',{rough:.5});
  return {parts:P,k:1};
}
function A_lbCandles(p){
  const P=[], BR='#9b8a5a';
  aC(P,0,.04,0,.34,.08,.34,BR,{metal:.7,rough:.4}); aC(P,0,.3,0,.05,.5,.05,BR,{metal:.7,rough:.4});
  [[-.16,.42],[0,.52],[.16,.42]].forEach(q=>{ aC(P,q[0],.14+q[1]*.5,0,.05,.18,.05,BR,{metal:.7}); aC(P,q[0],q[1]+.12,0,.045,.2+(q[1]-.4)*.4,.045,'#e8e0cc',{rough:.9}); AP(P,'cone',q[0],q[1]+.28+(q[1]-.4)*.4,0,.05,.1,.05,'#ffcf7a',{glow:true}); });
  return {parts:P,k:1};
}
function A_lbBooks(p){
  const P=[], n=Math.round(A_num(p.n,4,1,8)), R=A_rng(5+n); let y=0;
  for(let i=0;i<n;i++){ const bh=.07+R()*.07; P.push({shape:'box',p:[R()*.04-.02,y+bh/2,0],s:[.34-R()*.07,bh,.24-R()*.04],r:[0,R()*20-10,0],color:['#3b2f27','#5a4636','#2b2f33','#7a6a52'][i%4],rough:.8,metal:0,glow:false,tex:'',ns:false}); y+=bh; }
  if(p.scroll) { aC(P,0,y+.05,0,.09,.5,.09,'#d8cfb6',{r:[0,0,90],rough:1}); }
  return {parts:P,k:1};
}
function A_lbDrape(p){
  const P=[], h=A_num(p.h,2.2,.5,5), R=A_rng(9);
  for(let i=0;i<6;i++){ const x=(i-2.5)*.28; P.push({shape:'box',p:[x,-h/2+(i%2?.1:0),R()*.08],s:[.3,h-(i%2?.2:0),.05],r:[0,R()*14-7,R()*5-2],color:'#a39b8e',rough:1,metal:0,glow:false,tex:'',ns:false}); }
  aB(P,0,.04,0,1.9,.1,.16,'#a39b8e',{rough:1});
  return {parts:P,k:1};
}
Object.assign(ASSETS,{lb_pillar:A_lbPillar,lb_arch:A_lbArch,lb_floor:A_lbFloor,lb_wall:A_lbWall,lb_ceiling:A_lbCeiling,lb_stairs:A_lbStairs,lb_door:A_lbDoor,lb_shelf:A_lbShelf,lb_rug:A_lbRug,lb_desk:A_lbDesk,lb_chair:A_lbChair,lb_globe:A_lbGlobe,lb_armillary:A_lbArmillary,lb_candles:A_lbCandles,lb_books:A_lbBooks,lb_drape:A_lbDrape});

function libraryLayout(){
  const O=[], add=(asset,p,ry,params,s)=>O.push({asset:asset,p:p,ry:ry||0,params:params||{},s:s||1}), H=8, CH=14.5;
  add('lb_floor',[0,0,-7],0,{w:24,d:34});
  add('lb_ceiling',[0,0,-7],0,{w:24,d:34,h:CH});
  add('lb_wall',[0,0,-24],0,{w:24.8,h:CH}); add('lb_wall',[0,0,10],180,{w:24.8,h:CH});
  add('lb_wall',[-12,0,-7],90,{w:34,h:CH}); add('lb_wall',[12,0,-7],-90,{w:34,h:CH});
  [-1,1].forEach(sg=>{
    [0,-6,-12,-18].forEach(z=>add('lb_pillar',[sg*8,0,z],0,{w:1.8,h:H}));
    [-3,-9,-15].forEach(z=>add('lb_arch',[sg*8,H,z],90,{span:4.2,t:.8,depth:1.1}));
    [-3,-9,-15].forEach(z=>add('lb_arch',[sg*11.5,H+.5,z],sg>0?-90:90,{span:4.4,t:.55,depth:.5}));
    add('lb_pillar',[sg*5.4,0,-21.2],0,{w:1.4,h:H});
    for(let z=-2.5;z>-23;z-=2.9) add('lb_shelf',[sg*11.33,0,z],sg>0?-90:90,{detail:z<-9?'low':'high',seed:Math.round(-z*3)});
    [-6.6,-9.6].forEach((z,i)=>add('lb_shelf',[sg*5.9,0,z],sg>0?-90:90,{detail:'high',seed:i+sg*7,h:5.6}));
  });
  add('lb_arch',[0,H,-21.2],0,{span:9.4,t:.9,depth:1.2,n:21});
  add('lb_stairs',[0,0,-19.8],0,{w:7.6,n:6,tread:.5,rise:.2,landing:.6});
  add('lb_door',[0,1.2,-23.05],0,{w:6.4,h:5});
  add('lb_rug',[0,0,-4],0,{w:7,d:13});
  add('lb_desk',[-4.3,0,-2.8],90,{w:3.2,d:1.4}); add('lb_chair',[-5.7,0,-1.6],55);
  add('lb_globe',[-4.3,.95,-3.6],0,{r:.42}); add('lb_books',[-4.4,.95,-1.9],20,{n:5,scroll:true});
  add('lb_desk',[4.6,0,-3.6],-90,{w:3.4,d:1.4});
  add('lb_armillary',[4.6,.95,-4.4],0,{r:.5}); add('lb_candles',[4.6,.95,-2.7],0,{}); add('lb_candles',[4.6,.95,-3.3],0,{}); add('lb_books',[4.6,.95,-2.0],-15,{n:4});
  add('lb_drape',[10.95,5.6,-2.6],-90,{h:2.4});
  return {environment:'hall',camera:{p:[0,1.65,3],target:[0,4,-23],fov:40},objects:O,clear:true};
}
function loadLibrary(){
  if(S.recording) return;
  const r=buildScene(libraryLayout());
  look.az=25; look.el=52; look.sun=.7; look.exposure=1.45; look.fog=.012; look.bloom=.5; look.vignette=.55; look.grain=.05;
  let who=null; try{ who=addEmbedded(0,{p:[0,0,-1],r:[0,Math.PI,0]}); }catch(e){}
  [[ -3.9,2.2,-21.3,'#ffa94d'],[3.9,2.2,-21.3,'#ffa94d'],[4.6,1.9,-3.0,'#ff9f45'],[-4.3,1.8,-3.2,'#ffb066'],[0,7.5,-12,'#ff9a4a']].forEach((q,i)=>{ try{ addNode(mkSpec('light',{name:'Warm light '+(i+1),p:[q[0],q[1],q[2]],color:q[3]})); }catch(e){} });
  applyLook(); refreshLook(); kochiEnv(true,false);
  edit.position.set(0,2.6,6.5); orbit.target.set(0,3.2,-14); orbit.update();
  refreshScene(); if(who) selectId(who.id); saveNow();
  toast('Library hall built ('+r.built+' objects)'+(who?' with the character walking toward the door':'')+'. Orbit with one finger, or press play for a slow push-in.');
}
