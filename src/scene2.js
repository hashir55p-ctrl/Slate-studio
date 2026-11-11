/* ---------- Chapter 1, Scene 2: the jeep to Wayanad (page 5 of the comic) ---------- */
const S2={A0:3.4, DUR:12.64,   /* audio starts at A0 s; line times are seconds inside the audio file */
  L:[[0.15,2.75,'Hashir','Day one, Wayanad. Nothing can go wrong.'],[3.15,4.35,'Renjith','Da, don\'t say that.'],[4.85,6.75,'Jesvin','Too late. Now something will.'],[7.25,8.95,'Stany','No negativity in my jeep!'],[9.45,10.7,'Jesvin','It\'s my jeep.']]};
const S2_SEAT={Jesvin:{idx:0,x:-.42,z:-.2},Stany:{idx:1,x:.42,z:-.2},Renjith:{idx:2,x:-.45,z:-1.22},Hashir:{idx:3,x:.3,z:-1.22}};
const PO_CD=Object.assign({},PO_SEAT,{'spine':[0,0,0],'chest':[0,0,0],'upperArm.L':[-16,-10,-8],'upperArm.R':[-16,10,8],'foreArm.L':[-58,0,0],'foreArm.R':[-58,0,0]});
const PO_DR=Object.assign({},PO_CD,{'upperArm.L':[-52,-12,-10],'upperArm.R':[-52,12,10],'foreArm.L':[-48,0,0],'foreArm.R':[-48,0,0]});
Object.assign(PO_G,{
  selfie:{'upperArm.R':[-78,22,6],'foreArm.R':[-36,0,0],'head':[-2,0,0]},
  selfieL:{'upperArm.L':[-70,-30,-8],'foreArm.L':[-40,0,0]},
  groan:{'upperArm.R':[-84,55,8],'foreArm.R':[-142,0,0],'head':[10,0,-5],'spine':[3,0,0]},
  peace:{'upperArm.L':[-84,-35,-30],'foreArm.L':[-100,0,0],'head':[-2,0,5]},
  dry:{'head':[4,0,-6],'chest':[1,0,0]},
  flat:{'head':[0,0,-3]},
  hands:{'upperArm.L':[-40,-10,-10],'foreArm.L':[-70,0,0]}});
/* wayanad road, tea terraces, hills and trees as custom parts */
function s2Env(path){
  const R=A_rng(5), road=[], tea=[], far=[], tr=[]; const TEA=['#3f7a2c','#4a8a30','#36702a','#528f34'];
  const steps=Math.floor(path.len/3);
  for(let i=0;i<=steps;i++){ const q=jeepAt(path,i*3+1.5), c=Math.cos(q.h), s=Math.sin(q.h), hd=q.h*180/Math.PI;
    aB(road,q.x,.03,q.z,4.8,.06,3.4,'#3b3c3e',{rough:.92,r:[0,hd,0]});
    aB(road,q.x-c*2.6,.025,q.z+s*2.6,.9,.05,3.4,'#7c6c4c',{rough:1,r:[0,hd,0]}); aB(road,q.x+c*2.6,.025,q.z-s*2.6,.9,.05,3.4,'#7c6c4c',{rough:1,r:[0,hd,0]});
    if(i%2===0) aB(road,q.x,.065,q.z,.12,.02,1.4,'#e8e2c8',{rough:.8,r:[0,hd,0]});
    for(let side=-1;side<=1;side+=2) for(let j=0;j<15;j++){ const o=4.4+j*1.6+(j>6?R()*.5:0), h2=.42+(j>8?.18*R():0);
      aB(tea,q.x+c*side*o,h2/2,q.z-s*side*o,.95,h2,3.3,TEA[(i+j)%4],{rough:.95,r:[0,hd,0],tex:'leaf'}); }
    if(i%3===0) for(let side=-1;side<=1;side+=2){ if(R()<.7){ const o=7+R()*16, X=q.x+c*side*o, Z=q.z-s*side*o, H=7+R()*4;
      aC(tr,X,H/2,Z,.34,H,.34,'#4d3f30',{rough:.95}); for(let k=0;k<4;k++) aS(tr,X+(R()-.5)*2.4,H+.6+R()*1.4,Z+(R()-.5)*2.4,2.6+R()*1.2,1.9+R()*.8,2.6+R()*1.2,['#2f6a28','#3f7a2c','#2a5f26'][k%3],{rough:.9,tex:'leaf'}); } } }
  for(let i=0;i<26;i++){ const q=jeepAt(path,Math.min(path.len,i*path.len/24)), side=i%2?1:-1, d=70+R()*170, a=Math.cos(q.h)*side, b=-Math.sin(q.h)*side, f=Math.min(1,d/230);
    const col=['#8a7456','#977c5c','#a6876a','#b7977a'][Math.min(3,Math.floor(f*4))]; aS(far,q.x+a*d+Math.sin(q.h)*R()*60,6+R()*4,q.z+b*d+Math.cos(q.h)*R()*60,70+R()*50,13+R()*8,30+R()*20,col,{rough:1,r:[0,q.h*57.3+90+R()*30,0]}); }
  return {road:road,tea:tea,far:far,tr:tr};
}
function s2Sign(path,d){ const q=jeepAt(path,d), c=Math.cos(q.h), s=Math.sin(q.h), P=[], X=q.x+c*3.6, Z=q.z-s*3.6, hd=q.h*180/Math.PI+180;
  aC(P,0,1.2,0,.07,2.4,.07,'#5a5d60',{metal:.5}); aC(P,0,.9,.0,.07,1.8,.07,'#5a5d60',{metal:.5});
  aB(P,0,2.35,.04,1.9,.75,.05,'#1c6b3a',{rough:.5}); aB(P,0,2.35,.07,1.8,.65,.02,'#f4f4ee',{rough:.6,glow:false}); aB(P,0,2.35,.075,1.74,.6,.02,'#1c6b3a',{rough:.5});
  aB(P,-.55,2.35,.1,.52,.1,.02,'#f4f4ee'); aB(P,-.55,2.5,.1,.1,.28,.02,'#f4f4ee'); aB(P,.36,2.38,.1,.9,.08,.02,'#f4f4ee'); aB(P,.36,2.26,.1,.7,.07,.02,'#f4f4ee');
  const sp=mkSpec('custom',{name:'Wayanad sign',parts:cleanParts(P),p:[X,0,Z],r:[0,q.h+Math.PI-.35,0],s:[1,1,1]}); addNode(sp); }
function jeepBody2(){ return jeepBodyParts().filter(p=>p.color!=='#1b2a3a'&&p.p[1]<1.85&&!(p.shape==='cylinder'&&p.s[0]<.06&&p.s[1]>.7)); }
function scene2(){ if(window.__peace) PO_G.peace=window.__peace;
  if(S.recording) return;
  S.playing=false; syncPlay(); scEnd();
  loadProject({objs:[],cam:{p:[0,2.3,-7]},tgt:{p:[0,1,3]},tracks:{},duration:20}); kochiEnv(false);
  applyPreset('golden'); Object.assign(look,{az:196,el:7,sun:4.2,exposure:1.08,bloom:.5,fog:.011,dof:0,vignette:.4,pixar:.65,fov:40}); applyLook(); refreshLook();
  ground.material.color.copy(lin('#4d7a2e'));
  const D2=Math.PI/180, PT=[[0,-30],[0,25],[5,50],[14,72],[18,98],[14,125],[6,150],[2,175]], path=jeepPath(PT), V=7, D0=30, A0=S2.A0, DUR=Math.round((A0+S2.DUR+2.0)*10)/10;
  const E=s2Env(path); const addP=(nm,parts)=>{ for(let i=0;i<parts.length;i+=2800) addNode(mkSpec('custom',{name:nm+(i?' '+(i/2800+1):''),parts:cleanParts(parts.slice(i,i+2800)),p:[0,0,0],r:[0,0,0],s:[1,1,1]})); };
  addP('Wayanad road',E.road); addP('Wayanad tea',E.tea); addP('Wayanad hills',E.far); addP('Wayanad trees',E.tr); s2Sign(path,D0+V*(A0+S2.DUR+.9));
  /* jeep without roof and side glass, so the camera can see the four friends */
  ['Jeep body','Jeep wheel FL','Jeep wheel FR','Jeep wheel RL','Jeep wheel RR'].forEach(n=>{ const f=jeepFind(n); if(f) removeNode(f.id); });
  const mk=(name,parts)=>{ const sp=mkSpec('custom',{name:name,parts:cleanParts(parts),p:[0,0,0],r:[0,0,0],s:[1,1,1],ro:'YXZ'}); addNode(sp); return sp; };
  const bodyN=mk('Jeep body',jeepBody2()), W=jeepWheelParts(), wh={FL:mk('Jeep wheel FL',W),FR:mk('Jeep wheel FR',W),RL:mk('Jeep wheel RL',W),RR:mk('Jeep wheel RR',W)};
  const gp=[]; aB(gp,0,0,0,.07,.05,.035,'#16181a',{rough:.5}); aB(gp,0,0,.02,.025,.025,.02,'#2b6cd0',{glow:true}); aRod(gp,[0,-.02,0],[0,-.3,.05],.012,'#2a2d31',{metal:.4});
  const gpN=mkSpec('custom',{name:'GoPro',parts:cleanParts(gp),p:[0,0,0],r:[0,0,0],s:[1,1,1]}); addNode(gpN);
  const chars={}, names=Object.keys(S2_SEAT);
  names.forEach(n=>{ const q=S2_SEAT[n], sp=addEmbedded(q.idx,{p:[q.x,0,q.z],r:[0,0,0]}); sp.name=n; sp.pose=poRad(n==='Jesvin'?PO_DR:PO_CD); q.id=sp.id; chars[n]=q; });
  const LN=S2.L.map(a=>({t0:A0+a[0],t1:A0+a[1],who:a[2],text:a[3]}));
  const GE={Hashir:['selfie','none','none','none','none'],Renjith:['none','groan','none','none','none'],Jesvin:['none','none','dry','none','flat'],Stany:['none','none','none','peace','none']};
  const EX=[{Hashir:'excited',Renjith:'happy',Jesvin:'neutral',Stany:'happy'},{Hashir:'happy',Renjith:'annoyed',Jesvin:'neutral',Stany:'happy'},{Hashir:'laugh',Renjith:'neutral',Jesvin:'smug',Stany:'worried'},{Hashir:'happy',Renjith:'neutral',Jesvin:'annoyed',Stany:'excited'},{Hashir:'laugh',Renjith:'happy',Jesvin:'smug',Stany:'smug'}];
  LN.forEach((L,i)=>{ L.e=EX[i]; L.g={}; names.forEach(n=>{ L.g[n]=GE[n][i]; }); });
  const sm=x=>{ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); }, env=(t,L)=>sm((t-(L.t0-.35))/.35)*(1-sm((t-L.t1)/.3));
  const ENV=vbEnv('s2')||new Uint8Array(0), ev=t=>{ t-=A0; if(!ENV.length||t<0) return 0; const k=Math.max(0,Math.min(ENV.length-1,t*30)), i=Math.floor(k), f=k-i; return ((ENV[i]||0)*(1-f)+(ENV[Math.min(ENV.length-1,i+1)]||0)*f)/255; };
  const slow=t=>{ let z=0; for(let i=0;i<7;i++) z+=ev(t-i*.05); return z/7; };
  const PH={Stany:0,Jesvin:1.7,Renjith:3.1,Hashir:4.6};
  const bump=t=>.011*Math.sin(t*8.2)+.006*Math.sin(t*13.7+1)+.004*Math.sin(t*3.1);
  const roll=t=>.012*Math.sin(t*1.9);
  const rr=o=>{ const r={}; Object.keys(o).forEach(k=>{ r[k]=o[k].map(v=>Math.round(v*10000)/10000); }); return r; };
  const poseAt=(n,t)=>{ const q=S2_SEAT[n], ph=PH[n], base=n==='Jesvin'?PO_DR:PO_CD, parts=[base];
    const dyn={'head':[0,0,0],'neck':[0,0,0],'chest':[0,0,0],'spine':[0,0,0],'upperArm.R':[0,0,0],'foreArm.R':[0,0,0]}, add=(k,x,y,z)=>{ const d=dyn[k]; d[0]+=x; d[1]+=y; d[2]+=z; };
    let spkNow=null; LN.forEach(L=>{ if(L.who!==n&&t>=L.t0-.3&&t<=L.t1+.3) spkNow=L.who; });
    LN.forEach(L=>{ const w=env(t,L), mine=L.who===n; if(w>0){ const g=L.g[n]; if(g&&PO_G[g]) parts.push(poGest(base,g,w));
        if(!mine){ const sp=S2_SEAT[L.who]; if(n!=='Jesvin'||L.who==='Stany'){ const lk=poLook({x:q.x,z:q.z,yaw:0},[sp.x,sp.z]); parts.push((function(o,k){ const r={}; Object.keys(o).forEach(a=>{ r[a]=[o[a][0]*k,o[a][1]*k,o[a][2]*k]; }); return r; })(lk,w*(n==='Jesvin'?.55:.8))); } } }
      if(mine&&t>=L.t0-.05&&t<=L.t1+.12){ const v=ev(t), pk=Math.max(0,v-slow(t)*1.05)*2.2; add('head',3*v+5*pk,3*Math.sin(t*2.3+ph)*v,1.2*Math.sin(t*1.7+ph)*v); add('neck',1.2*v,0,0); add('chest',1.2*v+.8*pk,0,0); if(n!=='Jesvin') add('foreArm.R',-8*pk,0,0); }
      if(!mine){ const ex=L.e[n]; if(ex==='laugh'&&w>0){ const sh=Math.sin(2*Math.PI*4.6*t+ph); add('chest',2.4*Math.abs(sh)*w,0,0); add('head',-6*w+2*sh*w,0,0); } } });
    const br=Math.sin(t*2*Math.PI*.27+ph), sw=Math.sin(t*2*Math.PI*.09+ph*1.3), rb=Math.sin(t*8.2+ph)*.6+Math.sin(t*13.7)*.4;
    parts.push({'chest':[1*br+.5*rb,.8*sw,0],'spine':[.6*br,1*sw,.8*roll(t)*60],'neck':[.6*rb,.5*sw,0],'head':[.7*rb,.7*Math.sin(t*2*Math.PI*.17+ph),.6*sw],'upperArm.L':[0,0,.7*br],'upperArm.R':[0,0,-.7*br]},dyn);
    if(n==='Jesvin'){ const fw=Math.sin(t*.55)*2; parts.push({'head':[0,fw,0]}); }
    const out=rr(poRad(poMerge.apply(null,parts))), c=x=>+x.toFixed(3);
    let pe=0, gr=0; LN.forEach(L=>{ const w=env(t,L), g=L.g[n]; if(w>0&&g==='peace') pe=Math.max(pe,w); if(w>0&&g==='selfie') gr=Math.max(gr,w); });
    out['hand.R.a']=[c(.3+.5*gr),c(.35+.4*gr),c(.4+.4*gr)]; out['hand.R.b']=[c(.45+.4*gr),c(.5+.4*gr),.05];
    const drv=n==='Jesvin'?1:0;
    out['hand.L.a']=[c(.3+.5*drv+.5*pe),c(.35+.5*drv-.45*pe),c(.4+.5*drv-.5*pe)]; out['hand.L.b']=[c(.45+.4*drv+.5*pe),c(.5+.4*drv+.5*pe),c(.05+.7*pe)];
    if(n==='Jesvin'){ out['hand.R.a']=[.8,.85,.9]; out['hand.R.b']=[.9,.9,.05]; }
    return out; };
  /* motion: path distance d(t); jeep world frame */
  const st=t=>{ const d=D0+V*t, q=jeepAt(path,d), q2=jeepAt(path,d+.6); let dh=q2.h-q.h; while(dh>Math.PI) dh-=2*Math.PI; while(dh<-Math.PI) dh+=2*Math.PI; return {d:d,x:q.x,z:q.z,h:q.h,kap:dh/.6,c:Math.cos(q.h),s:Math.sin(q.h)}; };
  const at=(q,x,y,z)=>[+(q.x+x*q.c+z*q.s).toFixed(4),+y.toFixed(4),+(q.z-x*q.s+z*q.c).toFixed(4)];
  const tr={}; const ids={body:bodyN.id,FL:wh.FL.id,FR:wh.FR.id,RL:wh.RL.id,RR:wh.RR.id,gp:gpN.id}; Object.keys(ids).forEach(k=>{ tr[ids[k]]=[]; }); names.forEach(n=>{ tr[chars[n].id]=[]; });
  let steer=0, unw=null; const R=JEEP.WR;
  for(let t=0;t<=DUR+.0001;t+=.1){ const q=st(t); let h=q.h; if(unw!=null){ while(h-unw>Math.PI) h-=2*Math.PI; while(h-unw<-Math.PI) h+=2*Math.PI; } unw=h; const spin=q.d/R, bp=bump(t), rl=roll(t)+Math.max(-.05,Math.min(.05,-q.kap*V*.01)), sg=Math.max(-.55,Math.min(.55,Math.atan(JEEP.WB*q.kap))); steer+=(sg-steer)*.5; const T=+t.toFixed(3);
    tr[ids.body].push({t:T,p:at(q,0,bp,0),r:[0,h,rl],s:[1,1,1]});
    tr[ids.FL].push({t:T,p:at(q,JEEP.X,R,JEEP.ZF),r:[spin,h+steer,0],s:[1,1,1]}); tr[ids.FR].push({t:T,p:at(q,-JEEP.X,R,JEEP.ZF),r:[spin,h+steer,0],s:[1,1,1]});
    tr[ids.RL].push({t:T,p:at(q,JEEP.X,R,JEEP.ZR),r:[spin,h,0],s:[1,1,1]}); tr[ids.RR].push({t:T,p:at(q,-JEEP.X,R,JEEP.ZR),r:[spin,h,0],s:[1,1,1]});
    tr[ids.gp].push({t:T,p:at(q,.12+.01*Math.sin(t*2),1.6+bp,-.62),r:[0,h+Math.PI,0],s:[1,1,1]});
    names.forEach(n=>{ const s=S2_SEAT[n]; tr[s.id].push({t:T,p:at(q,s.x,.0+bp,s.z),r:[0,h,rl*.6],s:[1,1,1],b:poseAt(n,t)}); }); }
  /* camera */
  const cm=(t,x,y,z)=>{ const q=st(t); return at(q,x,y+bump(t)*.5,z); }, hh=(t,a)=>.012*Math.sin(t*1.3+a);
  const SH=[
    [0,A0+.0,'w'],
    [A0+0,A0+3.0,[.1,1.5,-.58],[.3,1.55,-1.15],56,[.12,1.52,-.6],[.3,1.57,-1.15],52],
    [A0+3.0,A0+4.7,[.2,1.48,-.45],[-.45,1.55,-1.18],34,[.15,1.5,-.45],[-.45,1.56,-1.18],30],
    [A0+4.7,A0+7.15,[-.62,1.55,1.35],[-.42,1.57,-.15],32,[-.55,1.55,1.1],[-.42,1.58,-.15],29],
    [A0+7.15,A0+9.3,[1.95,1.62,.75],[.45,1.58,-.12],34,[1.7,1.6,.55],[.45,1.6,-.1],31],
    [A0+9.3,A0+10.9,[-.6,1.58,1.25],[-.42,1.57,-.15],30,[-.5,1.58,1.0],[-.42,1.57,-.15],27],
    [A0+10.9,DUR,'x']];
  const cam=[], tgt=[], key=(t,p,tp,f)=>{ cam.push({t:+t.toFixed(3),p:p,f:f}); tgt.push({t:+t.toFixed(3),p:tp}); };
  for(const s of SH){ const a=s[0], b=s[1]; for(let t=a+(a>0?.04:0);t<=b-.001;t+=.1){ const u=Math.max(0,Math.min(1,(t-a)/(b-a))), e=u*u*(3-2*u); let P,Tt,F;
      if(s[2]==='w'){ /* opening: jeep from the front quarter, low sun behind the hills */ const q=st(t); P=at(q,3.4-u*1.2,1.25+u*.2,11.5-u*2.4+ (a+u*(b-a))*0); Tt=at(q,0,1.15,0); F=34; P[1]+=.0; }
      else if(s[2]==='x'){ const q=st(t), u2=(t-a)/(b-a); P=at(q,3.8-u2*.6,1.4,5.5-u2*3.8); Tt=at(q,0,1.25,.8-u2*.5); F=34; }
      else { const A=s[2], B=s[5], TA=s[3], TB=s[6]; P=cm(t,A[0]+(B[0]-A[0])*e+hh(t,0),A[1]+(B[1]-A[1])*e+hh(t,1),A[2]+(B[2]-A[2])*e); Tt=cm(t,TA[0]+(TB[0]-TA[0])*e,TA[1]+(TB[1]-TA[1])*e,TA[2]+(TB[2]-TA[2])*e); F=s[4]+(s[7]-s[4])*e; }
      key(t,P.map(v=>+v.toFixed(4)),Tt.map(v=>+v.toFixed(4)),F); } }
  S.tracks=tr; S.tracks.cam=cam; S.tracks.tgt=tgt; S.duration=DUR; S.ease='linear'; S.fps=24;
  S.caps=[]; setCaptions({lines:LN.map(L=>({t0:L.t0,t1:L.t1,who:L.who,text:L.text}))},true); CAP.show=false;
  setAudio({beds:[{k:'engine',t0:0,t1:DUR,v:.22,f:1.5},{k:'wind',t0:0,t1:DUR,v:.16,f:1.5},{k:'forest',t0:0,t1:DUR,v:.12,f:1.5}],cues:[{t:A0+4.4,k:'tick',v:.15}]},true);
  S.exp=[]; LN.forEach(L=>{ Object.keys(L.e).forEach(n=>S.exp.push({t0:L.t0,t1:L.t1,who:n,e:L.e[n]})); });
  voiceSet('s2',A0);
  setTimeout(()=>{ try{ faceReport(); }catch(e){} },3500);
  S.t=0; setAspect(2.39); setView('cam'); applyTracks(0); renderTimeline(); refreshScene(); saveNow();
  toast('Scene 2 ready. Tap once, then play.');
}
