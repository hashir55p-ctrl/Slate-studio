/* ---------- olive-green 4x4 jeep: body, doors and four separate wheels, driven by distance ---------- */
const JEEP={WR:.38, X:.84, ZF:1.22, ZR:-1.22, WB:2.44};
function jeepBodyParts(){
  const P=[], OL='#4f5c2c', OD='#3d4822', BK='#15171a', GL='#1b2a3a', CH='#b9bcc0';
  /* lower body, tub and floor */
  aB(P,0,.62,-.05,1.74,.52,3.5,OL,{rough:.55});
  aB(P,0,.3,-.05,1.5,.14,3.6,BK,{rough:.9});                           /* chassis rail */
  aB(P,0,1.02,1.18,1.6,.14,1.12,OL,{rough:.5});                         /* bonnet */
  aB(P,0,.9,1.78,1.52,.5,.1,OD,{rough:.6});                             /* front panel */
  aB(P,0,.82,1.84,1.16,.36,.04,BK,{rough:.6});                          /* grille plate */
  for(let i=-3;i<=3;i++) aB(P,i*.16,.82,1.87,.07,.3,.02,'#262a2e',{rough:.5});  /* seven slots */
  [-1,1].forEach(s=>{
    aC(P,s*.6,.98,1.84,.26,.07,.26,CH,{r:[90,0,0],metal:.8,rough:.3});     /* headlight rim */
    aC(P,s*.6,.98,1.88,.2,.05,.2,'#ffe9b0',{r:[90,0,0],glow:true});        /* lamp */
    aB(P,s*.94,.74,1.4,.16,.12,.95,BK,{rough:.7});                         /* flared arch front */
    aB(P,s*.94,.74,-1.5,.16,.12,.95,BK,{rough:.7});                        /* flared arch rear */
    aB(P,s*.9,1.08,.68,.07,.07,.5,BK,{rough:.5});                          /* mirror arm */
    aB(P,s*1.0,1.18,.68,.05,.2,.14,BK,{rough:.5});                         /* mirror */
    aB(P,s*.72,.96,-1.79,.14,.22,.05,'#a52a22',{glow:true});               /* tail light */
    aB(P,s*.78,1.45,.66,.06,.66,.07,OD,{rough:.6});                        /* A pillar */
    aB(P,s*.8,1.35,-1.55,.06,.9,.07,OD,{rough:.6});                        /* rear pillar */
  });
  /* bumpers, plate */
  aB(P,0,.4,1.98,1.82,.2,.2,BK,{rough:.8}); aB(P,0,.4,-1.98,1.82,.2,.2,BK,{rough:.8});
  aB(P,0,.62,-1.86,.4,.14,.02,'#e8e4d0',{rough:.7});
  /* windscreen and frame */
  aB(P,0,1.5,.64,1.5,.58,.04,GL,{metal:.7,rough:.1});
  aB(P,0,1.82,.58,1.62,.06,.12,OD,{rough:.6}); aB(P,0,1.19,.66,1.62,.07,.1,OD,{rough:.6});
  /* rear tub sides + hardtop roof */
  aB(P,0,.98,-.9,1.74,.6,1.7,OL,{rough:.55});
  aB(P,0,1.86,-.5,1.66,.07,2.1,OL,{rough:.55});
  [-1,1].forEach(s=>{ aB(P,s*.86,1.45,-.55,.03,.52,1.4,GL,{metal:.7,rough:.1}); aB(P,s*.86,1.45,-1.45,.03,.5,.42,GL,{metal:.7,rough:.1}); });
  aB(P,0,1.45,-1.9,1.5,.5,.03,GL,{metal:.7,rough:.1});
  /* roll bar inside */
  aRod(P,[-.7,1.0,-.2],[-.7,1.82,-.2],.05,BK); aRod(P,[.7,1.0,-.2],[.7,1.82,-.2],.05,BK);
  /* interior: dash, seats, steering wheel (right-hand drive, driver on the car's right = -X) */
  aB(P,0,1.08,.46,1.5,.2,.28,'#23262a',{rough:.8});
  [-.42,.42].forEach(x=>{ aB(P,x,.86,-.15,.52,.12,.52,'#2a2d31',{rough:.9}); aB(P,x,1.18,-.4,.52,.62,.12,'#2a2d31',{rough:.9}); });
  aB(P,0,.86,-1.1,1.4,.12,.6,'#2a2d31',{rough:.9});
  aC(P,-.42,1.14,.3,.34,.03,.34,BK,{r:[70,0,0],rough:.6}); aC(P,-.42,1.1,.38,.04,.2,.04,BK,{r:[70,0,0]});
  /* tailgate and spare wheel */
  aB(P,0,.96,-1.82,1.5,.74,.06,OD,{rough:.6});
  aC(P,0,1.02,-2.1,.76,.26,.76,'#111214',{r:[90,0,0],rough:.95}); aC(P,0,1.02,-2.24,.44,.04,.44,'#9a9b96',{r:[90,0,0],metal:.7,rough:.4});
  /* roof rack with luggage */
  [[-.74],[.74]].forEach(q=>aRod(P,[q[0],1.9,-1.4],[q[0],1.9,.4],.035,BK,{metal:.4}));
  [-1.3,-.6,.1,.4].forEach(z=>aRod(P,[-.74,1.9,z],[.74,1.9,z],.035,BK,{metal:.4}));
  aB(P,-.2,2.12,-.8,.86,.36,.46,'#6b4a2b',{rough:.95}); aB(P,-.2,2.32,-.8,.8,.05,.4,'#5a3d22',{rough:.95});
  aB(P,.38,2.08,-.15,.5,.3,.46,'#3f5a2e',{rough:.95});
  aRod(P,[-.6,2.0,-1.04],[-.6,2.0,-.56],.025,'#2a2018'); aRod(P,[.1,2.0,-1.04],[.1,2.0,-.56],.025,'#2a2018');
  return P;
}
function jeepWheelParts(){
  const P=[], R=JEEP.WR;
  aC(P,0,0,0,R*2,.27,R*2,'#121315',{r:[0,0,90],rough:.95});             /* tyre */
  aC(P,0,0,0,R*1.18,.285,R*1.18,'#8d8f8a',{r:[0,0,90],metal:.7,rough:.4}); /* rim */
  aC(P,0,0,0,R*.34,.3,R*.34,'#3a3c3a',{r:[0,0,90],metal:.6,rough:.5});   /* hub */
  for(let i=0;i<14;i++){ const a=i*Math.PI*2/14; P.push({shape:'box',p:[0,Math.cos(a)*R*.99,Math.sin(a)*R*.99],s:[.27,.07,.12],r:[a*180/Math.PI,0,0],color:'#0b0c0d',rough:.95,metal:0,glow:false,tex:'',ns:false}); }
  for(let i=0;i<5;i++){ const a=i*Math.PI*2/5; P.push({shape:'box',p:[.1,0,0],s:[.03,R*1.0,.07],r:[a*180/Math.PI,0,0],color:'#b4b6b0',rough:.35,metal:.8,glow:false,tex:'',ns:false}); }
  return P;
}
function jeepDoorParts(side){ /* origin at the hinge (front edge of the door) */
  const P=[], s=side, OL='#4f5c2c';
  aB(P,s*.0,.0,-.46,.05,.6,.92,OL,{rough:.55}); aB(P,s*.015,.38,-.46,.03,.38,.8,'#1b2a3a',{metal:.7,rough:.1});
  aB(P,s*.04,.04,-.8,.04,.05,.14,'#15171a');
  return P;
}
function jeepFind(name){ for(const [id,n] of nodes){ if(n.userData.spec&&n.userData.spec.name===name) return {id:id,node:n}; } return null; }
function jeepAdd(o){
  o=o||{}; const p=o.p||[0,0,0], ry=o.ry||0;
  ['Jeep body','Jeep wheel FL','Jeep wheel FR','Jeep wheel RL','Jeep wheel RR','Jeep door L','Jeep door R'].forEach(n=>{ const f=jeepFind(n); if(f) removeNode(f.id); });
  const mk=(name,parts,pp,r)=>{ const sp=mkSpec('custom',{name:name,parts:cleanParts(parts),p:pp,r:r,s:[1,1,1],ro:'YXZ'}); addNode(sp); return sp; };
  const c=Math.cos(ry), s=Math.sin(ry), at=(x,y,z)=>[p[0]+x*c+z*s,p[1]+y,p[2]-x*s+z*c];
  mk('Jeep body',jeepBodyParts(),at(0,0,0),[0,ry,0]);
  const W=jeepWheelParts(), R=JEEP.WR;
  mk('Jeep wheel FL',W,at(JEEP.X,R,JEEP.ZF),[0,ry,0]); mk('Jeep wheel FR',W,at(-JEEP.X,R,JEEP.ZF),[0,ry,0]);
  mk('Jeep wheel RL',W,at(JEEP.X,R,JEEP.ZR),[0,ry,0]); mk('Jeep wheel RR',W,at(-JEEP.X,R,JEEP.ZR),[0,ry,0]);
  mk('Jeep door L',jeepDoorParts(1),at(.87,.9,.62),[0,ry,0]); mk('Jeep door R',jeepDoorParts(-1),at(-.87,.9,.62),[0,ry,0]);
  refreshScene(); saveNow(); return true;
}
/* Catmull-Rom through points [[x,z],...], sampled by distance */
function jeepPath(pts){
  const P=pts.map(q=>[+q[0]||0,+q[1]||0]); if(P.length<2) throw new Error('need at least 2 points');
  const cr=(a,b,c,d,u)=>.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u), out=[];
  for(let i=0;i<P.length-1;i++){ const a=P[Math.max(0,i-1)], b=P[i], c=P[i+1], d=P[Math.min(P.length-1,i+2)]; for(let k=0;k<24;k++){ const u=k/24; out.push([cr(a[0],b[0],c[0],d[0],u),cr(a[1],b[1],c[1],d[1],u)]); } }
  out.push(P[P.length-1].slice()); const cum=[0]; for(let i=1;i<out.length;i++) cum.push(cum[i-1]+Math.hypot(out[i][0]-out[i-1][0],out[i][1]-out[i-1][1]));
  return {pts:out,cum:cum,len:cum[cum.length-1]};
}
function jeepAt(path,d){
  d=Math.max(0,Math.min(path.len,d)); let i=1; while(i<path.cum.length-1&&path.cum[i]<d) i++;
  const a=path.pts[i-1], b=path.pts[i], seg=(path.cum[i]-path.cum[i-1])||1, u=(d-path.cum[i-1])/seg;
  return {x:a[0]+(b[0]-a[0])*u, z:a[1]+(b[1]-a[1])*u, h:Math.atan2(b[0]-a[0],b[1]-a[1])};
}
/* o: {pts:[[x,z],...], speed:m/s (default 6), follow:'chase'|'side'|'front'|'none', doorOpen:{L:[t0,t1],R:[t0,t1]}} */
function jeepDrive(o){
  const body=jeepFind('Jeep body'); if(!body) throw new Error('Add the jeep first.');
  const names=['Jeep wheel FL','Jeep wheel FR','Jeep wheel RL','Jeep wheel RR','Jeep door L','Jeep door R'], F={}; names.forEach(n=>{ F[n]=jeepFind(n); if(!F[n]) throw new Error('Missing '+n); });
  const path=jeepPath(o.pts||[[0,0],[0,20]]), V=Math.max(.5,Math.min(30,+o.speed||6)), T=path.len/V, DT=.1, N=Math.ceil(T/DT), R=JEEP.WR, tr={};
  names.concat(['Jeep body']).forEach(n=>{ tr[n]=[]; });
  let prevH=jeepAt(path,0).h, unwrapH=prevH, steer=0, cam=[], tgt=[];
  const doorAng=(side,t)=>{ const w=o.doorOpen&&o.doorOpen[side]; if(!w) return 0; const a=w[0], b=w[1], r=.35; if(t<a||t>b+r) return 0; if(t<a+r) return (t-a)/r*1.1; if(t>b) return (1-(t-b)/r)*1.1; return 1.1; };
  for(let k=0;k<=N;k++){
    const t=Math.min(T,k*DT), d=t*V, q=jeepAt(path,d), q2=jeepAt(path,Math.min(path.len,d+.6));
    let h=q.h; while(h-unwrapH>Math.PI) h-=2*Math.PI; while(h-unwrapH<-Math.PI) h+=2*Math.PI; unwrapH=h;
    let dh=q2.h-q.h; while(dh>Math.PI) dh-=2*Math.PI; while(dh<-Math.PI) dh+=2*Math.PI;
    const kap=dh/.6, st=Math.max(-.55,Math.min(.55,Math.atan(JEEP.WB*kap))); steer+=(st-steer)*.5;
    const c=Math.cos(h), s=Math.sin(h), at=(x,y,zz)=>[q.x+x*c+zz*s,y,q.z-x*s+zz*c], spin=d/R, roll=Math.max(-.05,Math.min(.05,-kap*V*.01));
    tr['Jeep body'].push({t:t,p:[q.x,0,q.z],r:[0,h,roll],s:[1,1,1]});
    tr['Jeep wheel FL'].push({t:t,p:at(JEEP.X,R,JEEP.ZF),r:[spin,h+steer,0],s:[1,1,1]}); tr['Jeep wheel FR'].push({t:t,p:at(-JEEP.X,R,JEEP.ZF),r:[spin,h+steer,0],s:[1,1,1]});
    tr['Jeep wheel RL'].push({t:t,p:at(JEEP.X,R,JEEP.ZR),r:[spin,h,0],s:[1,1,1]}); tr['Jeep wheel RR'].push({t:t,p:at(-JEEP.X,R,JEEP.ZR),r:[spin,h,0],s:[1,1,1]});
    tr['Jeep door L'].push({t:t,p:at(.87,.9,.62),r:[0,h+doorAng('L',t),0],s:[1,1,1]}); tr['Jeep door R'].push({t:t,p:at(-.87,.9,.62),r:[0,h-doorAng('R',t),0],s:[1,1,1]});
    const f=o.follow||'chase', fw=(x,y,zz)=>[q.x+x*c+zz*s,y,q.z-x*s+zz*c];
    if(f==='chase'){ cam.push({t:t,p:fw(0,2.3,-7),f:50}); tgt.push({t:t,p:fw(0,1.1,3)}); }
    else if(f==='side'){ cam.push({t:t,p:fw(-6.5,1.5,1.5),f:42}); tgt.push({t:t,p:fw(0,1.0,1.2)}); }
    else if(f==='front'){ cam.push({t:t,p:fw(1.8,1.1,6),f:46}); tgt.push({t:t,p:fw(0,1.0,0)}); }
    else if(f==='dash'){ cam.push({t:t,p:fw(-.42,1.45,.1),f:60}); tgt.push({t:t,p:fw(-.42,1.35,6)}); }
  }
  names.concat(['Jeep body']).forEach(n=>{ const id=(n==='Jeep body'?body:F[n]).id; S.tracks[id]=tr[n]; });
  if(cam.length){ S.tracks.cam=cam; S.tracks.tgt=tgt; }
  S.ease='linear'; S.duration=Math.max(S.duration||0,Math.ceil(T)+1); S.t=0; applyTracks(0); renderTimeline&&renderTimeline(); refreshScene(); saveNow();
  return {seconds:+T.toFixed(2),meters:+path.len.toFixed(1)};
}
function jeepDemo(){
  if(S.recording) return; S.playing=false; syncPlay();
  loadProject({objs:[],cam:{p:[0,2.3,-7]},tgt:{p:[0,1,3]},tracks:{},duration:10}); kochiEnv(false); applyPreset('studio'); setAspect(1.78);
  jeepAdd({p:[0,0,0]}); const r=jeepDrive({pts:[[0,0],[0,14],[6,24],[14,28],[24,28]],speed:6,follow:'chase'});
  S.playing=false; syncPlay(); refreshScene(); toast('Jeep demo ready: '+r.seconds+' s. Press play to watch the wheels turn.');
}
