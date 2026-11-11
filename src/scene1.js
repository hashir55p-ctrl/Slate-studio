/* ---------- Chapter 1, Scene 1: Fort Kochi cafe (pages 1 to 4 of the comic) ---------- */
const D2R=Math.PI/180;
const PO_SEAT={'upperLeg.L':[-88,0,-4],'upperLeg.R':[-88,0,4],'lowerLeg.L':[90,0,0],'lowerLeg.R':[90,0,0],'foot.L':[-2,0,0],'foot.R':[-2,0,0],'spine':[10,0,0],'chest':[5,0,0],
  'upperArm.L':[-60,-10,-12],'upperArm.R':[-60,10,12],'foreArm.L':[-60,0,0],'foreArm.R':[-60,0,0]};   /* forearms resting on the table */
const PO_STAND={'upperArm.L':[4,0,-4],'upperArm.R':[4,0,4],'foreArm.L':[-12,0,0],'foreArm.R':[-12,0,0]};
/* gesture library, tuned on the real models: arm bones are absolute targets, the rest (head, spine, chest) is added on top */
const PO_G={none:{},rest:{},srest:{},
  talkR:{'upperArm.R':[-46,30,15],'foreArm.R':[-104,0,0],'head':[-2,0,0]},
  palms:{'upperArm.L':[-45,15,-20],'upperArm.R':[-45,-15,20],'foreArm.L':[-95,50,0],'foreArm.R':[-95,-50,0],'head':[0,0,6]},
  chin:{'upperArm.R':[-84,55,8],'foreArm.R':[-142,0,0],'head':[8,0,-4]},
  sip:{'upperArm.R':[-65,55,10],'foreArm.R':[-145,0,0],'head':[-6,0,0]},
  point:{'upperArm.R':[-84,25,5],'foreArm.R':[-22,0,0],'head':[-3,0,0]},
  phone:{'upperArm.L':[-40,-55,-15],'upperArm.R':[-40,55,15],'foreArm.L':[-110,0,0],'foreArm.R':[-110,0,0],'head':[20,0,0]},
  laugh:{'upperArm.L':[-20,-60,-10],'upperArm.R':[-20,60,10],'foreArm.L':[-80,0,0],'foreArm.R':[-80,0,0],'spine':[-8,0,0],'chest':[-6,0,0],'head':[-12,0,0]},
  lean:{'spine':[8,0,0],'chest':[5,0,0],'head':[-4,0,0]},
  stalk:{'upperArm.R':[-30,30,15],'foreArm.R':[-95,0,0],'head':[-3,0,0]},
  schop:{'upperArm.L':[-35,-40,-12],'upperArm.R':[-35,40,12],'foreArm.L':[-80,0,0],'foreArm.R':[-80,0,0],'spine':[4,0,0]},
  sshrug:{'upperArm.L':[-38,15,-18],'upperArm.R':[-38,-15,18],'foreArm.L':[-75,40,0],'foreArm.R':[-75,-40,0],'head':[0,0,7]},
  sphone:{'upperArm.R':[-55,50,10],'foreArm.R':[-100,0,0],'head':[15,0,0]},
  slaugh:{'head':[-10,0,0],'chest':[-4,0,0]}};
const PO_ARM=k=>k.indexOf('Arm.')>0;
/* weight w of gesture g on top of base pose: arms move toward the gesture's targets, other bones add */
function poGest(base,g,w){ const G=PO_G[g]; if(!G||w<=0) return null; const o={}; Object.keys(G).forEach(k=>{ const v=G[k], b0=PO_ARM(k)?(base[k]||[0,0,0]):[0,0,0]; o[k]=[(v[0]-b0[0])*w,(v[1]-b0[1])*w,(v[2]-b0[2])*w]; }); return o; }
function poMerge(){ const o={}; for(let i=0;i<arguments.length;i++){ const s=arguments[i]; if(!s) continue; Object.keys(s).forEach(k=>{ const a=o[k]||[0,0,0]; o[k]=[a[0]+s[k][0],a[1]+s[k][1],a[2]+s[k][2]]; }); } return o; }
function poRad(o){ const r={}; Object.keys(o).forEach(k=>{ r[k]=[o[k][0]*D2R,o[k][1]*D2R,o[k][2]*D2R]; }); return r; }
function poLook(from,to){ /* head turn toward a point; from={x,z,yaw} */
  const dx=to[0]-from.x, dz=to[1]-from.z, c=Math.cos(from.yaw), s=Math.sin(from.yaw), lx=dx*c-dz*s, lz=dx*s+dz*c;
  let phi=Math.atan2(lx,lz)/D2R; phi=Math.max(-70,Math.min(70,phi)); return {'neck':[0,phi*.35,0],'head':[0,phi*.65,0]};
}
function cafeParts(){
  const P=[], WD='#6b4a2b', WD2='#4a3626', ST='#b8bcc0';
  aC(P,0,.74,0,1.12,.05,1.12,WD,{rough:.7,tex:'wood'}); aC(P,0,.36,0,.12,.72,.12,WD2,{rough:.7}); aC(P,0,.02,0,.6,.04,.6,WD2,{rough:.7});
  [[.3,.0],[-.28,.12],[.05,-.34],[-.1,.34]].forEach((q,i)=>{ aC(P,q[0],.82,q[1],.065,.1,.065,i%2?'#d8dde0':'#d9d2c0',{metal:i%2?.7:0,rough:.35}); aC(P,q[0],.865,q[1],.055,.015,.055,'#c9822c',{rough:.3}); });
  aC(P,.0,.775,.02,.3,.02,.3,'#d8d2c4',{rough:.6}); for(let i=0;i<6;i++) aS(P,Math.cos(i*1.05)*.07,.805,.02+Math.sin(i*1.05)*.07,.075,.05,.075,'#b5712f',{rough:.9});
  aC(P,-.42,.86,-.3,.1,.2,.1,ST,{metal:.8,rough:.3}); aC(P,-.42,.97,-.3,.12,.02,.12,ST,{metal:.8,rough:.3});   /* steel jug */
  return P;
}
function stoolParts(){ const P=[], WD2='#4a3626'; aC(P,0,.46,0,.4,.05,.4,'#7a5736',{rough:.75}); [[.13,.13],[-.13,.13],[.13,-.13],[-.13,-.13]].forEach(q=>aRod(P,[q[0],0,q[1]],[q[0]*.8,.45,q[1]*.8],.035,WD2,{rough:.8})); return P; }
/* line timing of the dialogue track: old script times -> times in the current voices (one fixed voice per friend) */
const S1_KN=[[0,0],[1.96,1.30],[4.74,2.70],[5.04,2.88],[7.56,5.97],[8.08,6.17],[10.64,9.13],[11.0,9.44],[13.56,12.86],[14.16,13.05],[17.74,16.99],[18.2,17.22],[22.54,20.80],[22.66,20.86],[24.28,21.95],[24.5,22.23],[28.18,24.24],[28.38,24.48],[30.24,25.82],[30.8,26.25],[32.96,27.98],[33.24,28.25],[34.2,29.22],[34.4,29.46],[35.5,30.66],[35.68,30.82],[36.58,31.86],[37.5,32.9]];
function S1T(t){ const K=S1_KN; if(t<=0) return t; for(let i=1;i<K.length;i++){ if(t<=K[i][0]){ const a=K[i-1],b=K[i],u=(t-a[0])/(b[0]-a[0]); return +(a[1]+(b[1]-a[1])*u).toFixed(3); } } return +(t-K[K.length-1][0]+K[K.length-1][1]).toFixed(3); }
function scene1Real(){ scene1(true); }
function scene1(real){
  if(S.recording) return;
  if(real===true) loadKochiReal(); else loadKochi(); S.playing=false; syncPlay(); scEnd();
  const TZ=1.5, TC=[0,TZ], G=.2, SEAT_DY=-.42;
  const spots={Hashir:{idx:3,x:.8,z:TZ+.1,seated:true},Renjith:{idx:2,x:-.46,z:TZ+.66,seated:true},Jesvin:{idx:0,x:-.8,z:TZ-.1,seated:true},Stany:{idx:1,x:.15,z:TZ+1.2,seated:false,yaw:Math.PI}};
  const tbl=mkSpec('custom',{name:'Cafe table',parts:cleanParts(cafeParts()),p:[0,G,TZ],r:[0,0,0],s:[1,1,1]}); addNode(tbl);
  const chars={};
  Object.keys(spots).forEach(n=>{
    const q=spots[n]; q.yaw=q.yaw!=null?q.yaw:Math.atan2(TC[0]-q.x,TC[1]-q.z);
    if(q.seated){ const st=mkSpec('custom',{name:'Stool '+n,parts:cleanParts(stoolParts()),p:[q.x,G,q.z],r:[0,q.yaw,0],s:[1,1,1]}); addNode(st); }
    const sp=addEmbedded(q.idx,{p:[q.x,G+(q.seated?SEAT_DY:0),q.z],r:[0,q.yaw,0]}); sp.name=n; sp.pose=poRad(q.seated?PO_SEAT:PO_STAND); q.id=sp.id; q.sp=sp; chars[n]=q;
  });
  const eye=n=>spots[n].seated?[spots[n].x,1.45,spots[n].z]:[spots[n].x,1.86,spots[n].z];
  const LINES=[
    {t0:.06,t1:1.66,who:'',text:'Eighteen hours earlier...',g:{}},
    {t0:1.96,t1:4.74,who:'Stany',text:'Guys, listen. I found a place.',e:{Stany:'excited',Jesvin:'skeptic',Renjith:'skeptic',Hashir:'happy'},g:{Stany:'stalk',Jesvin:'chin',Renjith:'rest',Hashir:'lean'}},
    {t0:5.04,t1:7.56,who:'Jesvin',text:'A pool and a forest for that price? Something\'s off.',e:{Jesvin:'worried',Stany:'smug',Renjith:'skeptic',Hashir:'neutral'},g:{Jesvin:'palms',Stany:'srest',Renjith:'rest',Hashir:'sip'}},
    {t0:8.08,t1:10.64,who:'Stany',text:'Something\'s ON. It\'s called a discount.',e:{Stany:'smug',Jesvin:'skeptic',Renjith:'neutral',Hashir:'laugh'},g:{Stany:'stalk',Jesvin:'chin',Renjith:'rest',Hashir:'laugh'}},
    {t0:11.0,t1:13.56,who:'Renjith',text:'One review. "Quiet. Very quiet."',e:{Renjith:'smug',Jesvin:'neutral',Stany:'worried',Hashir:'neutral'},g:{Renjith:'phone',Stany:'srest',Jesvin:'lean',Hashir:'rest'}},
    {t0:14.16,t1:17.74,who:'Hashir',text:'Quiet? Finally, a place that isn\'t my house.',e:{Hashir:'laugh',Stany:'laugh',Renjith:'skeptic',Jesvin:'happy'},g:{Hashir:'laugh',Renjith:'chin',Jesvin:'rest',Stany:'slaugh'}},
    {t0:18.2,t1:22.54,who:'Renjith',text:'Last time you "found a place", we slept at a bus stand.',e:{Renjith:'annoyed',Stany:'worried',Hashir:'laugh',Jesvin:'happy'},g:{Renjith:'talkR',Stany:'sshrug',Jesvin:'rest',Hashir:'lean'}},
    {t0:22.66,t1:24.28,who:'Hashir',text:'With a goat.',e:{Hashir:'smug',Jesvin:'laugh',Renjith:'happy',Stany:'annoyed'},g:{Hashir:'talkR',Renjith:'rest',Jesvin:'laugh',Stany:'srest'}},
    {t0:24.5,t1:28.18,who:'Jesvin',text:'The goat slept the best.',e:{Jesvin:'happy',Hashir:'laugh',Renjith:'laugh',Stany:'annoyed'},g:{Jesvin:'sip',Hashir:'laugh',Renjith:'laugh',Stany:'srest'}},
    {t0:28.38,t1:30.24,who:'Stany',text:'This time is different!',e:{Stany:'excited',Renjith:'skeptic',Jesvin:'skeptic',Hashir:'neutral'},g:{Stany:'schop',Jesvin:'chin',Renjith:'rest',Hashir:'rest'}},
    {t0:30.8,t1:32.96,who:'Stany',text:'Booked. No refunds, by the way.',e:{Stany:'smug',Jesvin:'worried',Renjith:'worried',Hashir:'worried'},g:{Stany:'sphone',Jesvin:'lean',Renjith:'lean',Hashir:'lean'}},
    {t0:33.24,t1:34.2,who:'Jesvin',text:'...BY THE WAY?!',e:{Jesvin:'surprised',Stany:'surprised',Renjith:'surprised',Hashir:'surprised'},g:{Stany:'sshrug',Jesvin:'palms',Renjith:'lean',Hashir:'lean'}},
    {t0:34.4,t1:35.5,who:'Renjith',text:'...BY THE WAY?!',e:{Jesvin:'surprised',Stany:'surprised',Renjith:'surprised',Hashir:'surprised'},g:{Stany:'sshrug',Jesvin:'palms',Renjith:'palms',Hashir:'lean'}},
    {t0:35.68,t1:36.58,who:'Hashir',text:'...BY THE WAY?!',e:{Jesvin:'surprised',Stany:'surprised',Renjith:'surprised',Hashir:'surprised'},g:{Stany:'sshrug',Jesvin:'palms',Renjith:'palms',Hashir:'palms'}}];
  LINES.forEach(L=>{ L.t0=S1T(L.t0); L.t1=S1T(L.t1); });
  const DUR=S1T(37.5);
  const names=Object.keys(spots), tr={}; names.forEach(n=>{ tr[chars[n].id]=[]; });
  const sm=x=>{ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); };
  const sc=(o,w)=>{ const r={}; Object.keys(o).forEach(k=>{ r[k]=[o[k][0]*w,o[k][1]*w,o[k][2]*w]; }); return r; };
  const env=(t,L)=>sm((t-(L.t0-.35))/.35)*(1-sm((t-L.t1)/.3));
  const PH={Stany:0,Jesvin:1.7,Renjith:3.1,Hashir:4.6};
  /* one pose at time t: base seat/stand + eased gestures + look at speaker + breathing, sway, nods, talk motion */
  const ENV=vbEnv('s1')||new Uint8Array(0), ev=t=>{ if(!ENV.length) return 0; const k=Math.max(0,Math.min(ENV.length-1,t*30)), i=Math.floor(k), f=k-i, a=ENV[i]||0, b=ENV[Math.min(ENV.length-1,i+1)]||0; return (a+(b-a)*f)/255; };
  const slow=t=>{ let z=0; for(let i=0;i<7;i++) z+=ev(t-i*.05); return z/7; };
  const bump=(x,a,b)=>Math.sin(Math.PI*Math.max(0,Math.min(1,(x-a)/(b-a))));
  const rr=o=>{ const r={}; Object.keys(o).forEach(k=>{ r[k]=o[k].map(v=>Math.round(v*10000)/10000); }); return r; };
  const poseAt=(n,t)=>{ const q=spots[n], ph=PH[n]||0; let parts=[q.seated?PO_SEAT:PO_STAND];
    const dyn={'head':[0,0,0],'neck':[0,0,0],'chest':[0,0,0],'spine':[0,0,0],'upperArm.R':[0,0,0],'upperArm.L':[0,0,0],'foreArm.R':[0,0,0],'foreArm.L':[0,0,0]};
    const add=(k,x,y,z)=>{ const d=dyn[k]; d[0]+=x; d[1]+=y; d[2]+=z; };
    let glance=0, speakerNow=null;
    LINES.forEach(L=>{ if(L.who&&L.who!==n&&t>=L.t0-.4&&t<=L.t1+.3) speakerNow=L.who; });
    if(speakerNow) glance=bump(((t+ph*1.3)/5.1)%1,.8,.93);
    LINES.forEach(L=>{ const w=env(t,L); const mine=L.who===n;
      if(w>0){ const g=L.g[n]; if(g&&PO_G[g]) parts.push(poGest(q.seated?PO_SEAT:PO_STAND,g,w));
        const spk=(L.who&&spots[L.who])?L.who:null; if(spk&&spk!==n){ const lk=poLook(q,[spots[spk].x,spots[spk].z]); parts.push(sc(lk,w*(1-.65*glance))); } }
      const ex=L.e&&L.e[n];
      if(mine&&t>=L.t0-.05&&t<=L.t1+.12){ const v=ev(t), pk=Math.max(0,v-slow(t)*1.05)*2.2;
        add('head',3*v+5*pk,3*Math.sin(t*2.3+ph)*v,1.2*Math.sin(t*1.7+ph)*v); add('neck',1.2*v,0,0); add('chest',1.2*v+.8*pk,0,0);
        add('foreArm.R',-12*pk,0,0); add('upperArm.R',-5*pk,0,0); add('foreArm.L',-4*pk,0,0); add('spine',1.5*v,0,0); }
      if(!mine&&L.who){ const dur=L.t1-L.t0;
        if(ex!=='skeptic'&&ex!=='annoyed'){ add('head',5*bump(t,L.t1-.3,L.t1+.25),0,0); if(dur>2) add('head',3*bump(t,L.t0+dur*.5,L.t0+dur*.5+.45),0,0); }
        else add('head',0,0,-4*bump(t,L.t0+.2,L.t1-.1)); }
      if(ex==='laugh'&&w>0){ const sh=Math.sin(2*Math.PI*4.6*t+ph); add('chest',2.4*Math.abs(sh)*w,0,0); add('head',-7*w+2*sh*w,0,0); add('spine',-2*w,0,1.2*sh*w); add('upperArm.L',0,0,3*sh*w); add('upperArm.R',0,0,-3*sh*w); }
    });
    const rec=env(t,{t0:S1T(33.0),t1:S1T(36.9)}); if(rec>0){ add('spine',-5*rec,0,0); add('head',-5*rec,0,0); add('chest',-3*rec,0,0); }
    add('head',5*glance,0,0);
    const br=Math.sin(t*2*Math.PI*.27+ph), sw=Math.sin(t*2*Math.PI*.09+ph*1.3), j=Math.sin(t*2*Math.PI*.41+ph*2.1);
    const idle={'chest':[1.1*br,0.8*sw,0],'spine':[.7*br,1.2*sw,.8*sw],'neck':[.8*j,.6*sw,0],'head':[.9*j,.9*Math.sin(t*2*Math.PI*.17+ph),.7*sw],'upperArm.L':[0,0,.8*br],'upperArm.R':[0,0,-.8*br]};
    parts.push(idle,dyn);
    const out=rr(poRad(poMerge.apply(null,parts)));
    /* fingers: relaxed curl; a cup or phone closes the hand, a point opens the index finger */
    let gr=0, pt=0; LINES.forEach(L=>{ const w=env(t,L), g=L.g[n]; if(w>0&&(g==='sip'||g==='phone'||g==='sphone')) gr=Math.max(gr,w); if(w>0&&g==='point') pt=Math.max(pt,w); });
    const c=x=>+x.toFixed(3);
    out['hand.R.a']=[c(.25+.45*gr+.5*pt),c(.3+.6*gr-.3*pt),c(.35+.6*gr+.6*pt)]; out['hand.R.b']=[c(.4+.55*gr+.55*pt),c(.45+.5*gr+.5*pt),.05];
    out['hand.L.a']=[c(.25+.4*(gr&&LINES.some(L=>env(t,L)>0&&L.g[n]==='phone')?gr:0)),c(.3),c(.35)]; out['hand.L.b']=[.4,.45,.05];
    return out; };
  const sway=(n,t)=>{ const q=spots[n]; if(q.seated) return [q.x,G+SEAT_DY,q.z]; const ph=PH[n]||0; return [+(q.x+.012*Math.sin(t*.5+ph)).toFixed(4),G,+(q.z+.008*Math.sin(t*.37+ph)).toFixed(4)]; };
  const STEP=.1; for(let t=0;t<=DUR+.0001;t+=STEP){ names.forEach(n=>{ const q=spots[n]; tr[q.id].push({t:+t.toFixed(3),p:sway(n,t),r:[0,+(q.yaw+(q.seated?0:.03*Math.sin(t*.33+(PH[n]||0)))).toFixed(4),0],s:[1,1,1],b:poseAt(n,t)}); }); }
  /* camera: each shot is a short move; doubled keys make clean cuts */
  const fwd=n=>{ const y=spots[n].yaw; return [Math.sin(y),Math.cos(y)]; };
  const foc=(n,dist,side,dy,fov)=>{ const e=eye(n), f=fwd(n), sd=[f[1],-f[0]]; return {p:[e[0]+f[0]*dist+sd[0]*side,e[1]+dy,e[2]+f[1]*dist+sd[1]*side],t:[e[0],e[1]-.04,e[2]],f:fov}; };
  const SH=[
    [0,1.84,{p:[-2.0,1.55,-3.4],t:[.1,1.2,TZ+.8],f:38},{p:[-1.1,1.5,-2.3],t:[.1,1.25,TZ+.9],f:36}],
    [1.84,4.92,foc('Stany',3.1,-.5,-.25,34),foc('Stany',2.2,-.3,-.1,30)],
    [4.92,7.96,foc('Jesvin',2.2,.5,.2,32),foc('Jesvin',1.8,.4,.2,28)],
    [7.96,10.88,foc('Stany',2.6,.9,-.35,34),foc('Stany',2.0,.6,-.2,30)],
    [10.88,14.04,foc('Renjith',2.1,-.55,.2,32),foc('Renjith',1.7,-.45,.2,28)],
    [14.04,18.08,foc('Hashir',2.2,.55,.2,32),foc('Hashir',1.8,.45,.2,28)],
    [18.08,22.54,{p:[-.2,1.6,TZ-1.4],t:[-.5,1.35,TZ+.8],f:38},{p:[-.5,1.55,TZ-.9],t:[-.6,1.4,TZ+.8],f:34}],
    [22.54,24.38,foc('Hashir',1.9,-.5,.05,30),foc('Hashir',1.6,-.4,.05,27)],
    [24.38,28.26,foc('Jesvin',1.9,-.4,.05,30),foc('Jesvin',1.6,-.3,.05,27)],
    [28.26,30.68,foc('Stany',2.4,.0,-.55,34),foc('Stany',1.9,.1,-.45,30)],
    [30.68,33.12,{p:[1.5,1.6,TZ-1.5],t:[-.3,1.4,TZ+.8],f:36},{p:[1.0,1.58,TZ-1.2],t:[-.3,1.4,TZ+.8],f:34}],
    [33.12,DUR,{p:[0,1.55,TZ-1.8],t:[-.2,1.4,TZ+.8],f:40},{p:[0,1.55,TZ-1.35],t:[-.2,1.42,TZ+.8],f:36}]];
  SH.forEach(s=>{ s[0]=S1T(s[0]); s[1]=Math.min(DUR,S1T(s[1])); });
  const cam=[], tgt=[]; SH.forEach(s=>{ const t0=s[0]+(s[0]>0?.04:0), t1=s[1], A=s[2], B=s[3];
    cam.push({t:t0,p:A.p,f:A.f},{t:t0+.01,p:A.p,f:A.f},{t:t1-.011,p:B.p,f:B.f},{t:t1-.001,p:B.p,f:B.f}); tgt.push({t:t0,p:A.t},{t:t0+.01,p:A.t},{t:t1-.011,p:B.t},{t:t1-.001,p:B.t}); });
  S.tracks=tr; S.tracks.cam=cam; S.tracks.tgt=tgt; S.duration=DUR; S.ease='linear'; S.fps=24;
  S.caps=[]; setCaptions({lines:LINES.map((L,i)=>({t0:L.t0,t1:L.t1,who:L.who,text:L.text}))},true); CAP.show=false;
  setAudio({beds:[{k:'harbour',t0:0,t1:DUR,v:.32,f:1.5}],cues:[{t:S1T(5.3),k:'glass',v:.35},{t:S1T(21.9),k:'step',v:.2},{t:S1T(30.9),k:'chime',v:.55},{t:S1T(35.95),k:'clap',v:.8},{t:S1T(36.3),k:'whoosh',v:.35}]},true);
  S.exp=[]; LINES.forEach(L=>{ if(L.e) Object.keys(L.e).forEach(n=>S.exp.push({t0:L.t0,t1:L.t1,who:n,e:L.e[n]})); });
  voiceSet('s1',0);
  setTimeout(()=>{ try{ faceReport(); }catch(e){} },3500);
  S.t=0; setAspect(2.39); setView('cam'); applyTracks(0); renderTimeline(); refreshScene(); saveNow();
  toast('Scene 1 ready. Tap once, then play.');
}
/* ---------- one-line shot: Jesvin, "A pool and a forest for that price? Something's off." ---------- */
function sceneJesvinLine(){
  if(S.recording) return;
  scene1(); const OFF=2.75, DUR=3.36, TZ=1.5;   /* only Jesvin's voice: Stany ends at 2.70 s, speaks again at 6.17 s */
  const shiftArr=(a,keep)=>a.filter(k=>k.t>=OFF-.001&&k.t<=OFF+DUR+.001).map(k=>Object.assign({},k,{t:+(k.t-OFF).toFixed(3)}));
  let jid=null; nodes.forEach(n=>{ const sp=n.userData.spec; if(sp&&sp.name==='Jesvin'&&sp.type==='glb') jid=n.userData.id; }); if(!jid){ toast('Jesvin is missing from the scene.'); return; }
  Object.keys(S.tracks).forEach(id=>{ if(id==='cam'||id==='tgt') return; S.tracks[id]=shiftArr(S.tracks[id]); });
  /* extra performance on Jesvin: hands, fingers, brows, squint, head tilt */
  const sm=x=>{ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); }, win=(t,a,b,f)=>sm((t-a)/f)*(1-sm((t-b)/f));
  const R=Math.PI/180;
  const jn0=nodes.get(jid), JQ={x:jn0.position.x,z:jn0.position.z,yaw:jn0.rotation.y};
  const lookAt=(x,z,w)=>{ const L=poLook(JQ,[x,z]), o={}; Object.keys(L).forEach(n=>{ o[n]=L[n].map(v=>v*w); }); return o; };
  const ENV=vbEnv('s1')||new Uint8Array(0), ev=t=>{ if(!ENV.length) return 0; const k=Math.max(0,Math.min(ENV.length-1,t*30)), i=Math.floor(k), f=k-i, a=ENV[i]||0, b2=ENV[Math.min(ENV.length-1,i+1)]||0; return (a+(b2-a)*f)/255; };
  (S.tracks[jid]||[]).forEach(k=>{ const t=k.t+OFF;
    const wOpen=win(t,S1T(5.0),S1T(6.15),.25), wUp=win(t,S1T(6.05),S1T(6.95),.22), wPt=win(t,S1T(6.85),S1T(7.75),.22), wag=Math.sin((t-S1T(6.9))*2*Math.PI*3)*wPt, talk=win(t,S1T(5.0),S1T(7.6),.12), v=ev(t)*talk;
    const base={'upperLeg.L':[-88,0,-4],'upperLeg.R':[-88,0,4],'lowerLeg.L':[90,0,0],'lowerLeg.R':[90,0,0],'foot.L':[-2,0,0],'foot.R':[-2,0,0],'spine':[5,0,0],'chest':[3,0,0],
      'upperArm.L':[-24,0,-3],'upperArm.R':[-24,0,3],'foreArm.L':[-74,0,0],'foreArm.R':[-74,0,0]};
    const g={'upperArm.R':[-22*wOpen-6*wUp-24*wPt,0,4*wOpen+2*wPt],'foreArm.R':[-28*wOpen-16*wUp-8*wPt+7*wag,5*wag,0],
      'upperArm.L':[-14*wUp,0,2*wUp],'foreArm.L':[-24*wUp,0,0],
      'chest':[-3*wUp+2*wPt,0,0],'spine':[2*wPt,0,0],
      'head':[3*v-6*wUp+4*wPt,2.5*Math.sin(t*2.1)*v,7*wUp-6*wPt+1.2*Math.sin(t*1.7)*v],'neck':[1.5*v,0,0]};
    /* eyes and head: Stany before and after, the others while making the point */
    const toStany=1-Math.max(wUp,wPt)*.8, toHashir=wPt;
    const br=Math.sin(t*2*Math.PI*.27), sw=Math.sin(t*2*Math.PI*.09);
    const idle={'chest':[1*br,.6*sw,0],'spine':[.6*br,.9*sw,.5*sw],'head':[.7*Math.sin(t*2.6),.6*Math.sin(t*1.1),.5*sw]};
    const P=poMerge(base,g,lookAt(.15,TZ+1.25,toStany),lookAt(1.1,TZ+.15,toHashir*.9),idle);
    const B=poRad(P); Object.keys(B).forEach(n=>{ B[n]=B[n].map(x=>Math.round(x*10000)/10000); }); k.b=B; const b=B;
    const open=Math.max(wOpen,wUp);
    b['hand.R.a']=[ .15*open+.8*wPt+.25*(1-open-wPt), .1*open+.3*(1-open-wPt), .15*open+1*wPt+.35*(1-open-wPt) ].map(x=>+Math.max(0,x).toFixed(3));
    b['hand.R.b']=[ .2*open+1*wPt+.4*(1-open-wPt), .25*open+1*wPt+.45*(1-open-wPt), .55*open ].map(x=>+Math.max(0,x).toFixed(3));
    b['hand.L.a']=[ .25-.2*wUp, .3-.25*wUp, .35-.3*wUp ].map(x=>+x.toFixed(3)); b['hand.L.b']=[ .4-.35*wUp, .45-.4*wUp, .5*wUp ].map(x=>+x.toFixed(3));
    b['face.c']=[ +(.55*wUp+.2*wOpen-.1*wPt).toFixed(3), +(.55*wUp+.2*wOpen+.7*wPt).toFixed(3), +(.4*wUp+.15*wOpen).toFixed(3) ];
    b['face.d']=[ 0, 0, +(.45*wPt).toFixed(3) ];
    b['face.b']=[ +(-.3*wPt-.1*wUp).toFixed(3), 0, 0 ]; });
  /* camera: slow push from a front three-quarter close-up */
  let jn=nodes.get(jid), e=jn.position.clone(), y=jn.rotation.y, f=[Math.sin(y),Math.cos(y)], sd=[f[1],-f[0]], ey=e.y+1.61;
  const P=(d,s,dy)=>[e.x+f[0]*d+sd[0]*s,ey+dy,e.z+f[1]*d+sd[1]*s];
  S.tracks.cam=[{t:0,p:P(1.95,-.32,-.02),f:31},{t:DUR,p:P(1.6,-.24,-.02),f:29}];
  S.tracks.tgt=[{t:0,p:[e.x+f[0]*.15,ey-.2,e.z+f[1]*.15]},{t:DUR,p:[e.x+f[0]*.15,ey-.16,e.z+f[1]*.15]}];
  S.duration=DUR;
  S.caps=[]; setCaptions({lines:[{t0:S1T(5.04)-OFF,t1:S1T(7.56)-OFF,who:'Jesvin',text:'A pool and a forest for that price? Something'+"'"+'s off.'}]},true); CAP.show=false;
  setAudio({beds:[{k:'harbour',t0:0,t1:DUR,v:.3,f:.6}],cues:[{t:.7,k:'glass',v:.3}]},true);
  S.exp=[{t0:S1T(5.04)-OFF,t1:S1T(7.56)-OFF+.3,who:'Jesvin',e:'worried'},{t0:0,t1:DUR,who:'Stany',e:'smug'},{t0:0,t1:DUR,who:'Hashir',e:'neutral'},{t0:0,t1:DUR,who:'Renjith',e:'skeptic'}];
  voiceSet('s1',-OFF);
  S.t=0; setAspect(2.39); setView('cam'); applyTracks(0); renderTimeline(); refreshScene(); saveNow();
  toast('Jesvin\'s line is ready. Tap once, then play.');
}
