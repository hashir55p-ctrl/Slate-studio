
/* ---------- Jesvin sings: performance read from the user's reference video (cat singing with earphones) ---------- */
const SING_ENV=[0.0, 0.0, 0.88, 0.92, 0.6, 0.44, 0.45, 0.99, 1.0, 0.92, 0.34, 0.91, 0.71, 0.56, 1.0, 0.8, 0.49, 0.49, 1.0, 1.0, 1.0, 0.63, 0.73, 0.9, 0.75, 0.93, 1.0, 0.57, 0.35, 0.58, 1.0, 1.0, 0.8, 0.31, 0.55, 0.04, 0.18, 0.43, 0.31, 0.25, 0.1, 0.11, 0.2, 0.22, 0.17, 0.06, 0.08, 0.36, 0.55, 0.54, 0.44, 0.43, 0.14, 0.24, 0.28, 0.39, 0.62, 0.27, 0.36, 0.43, 0.54, 0.52, 0.19, 0.14, 0.27, 0.14, 0.33, 0.23, 0.27, 0.25, 0.39, 0.32, 0.39, 0.25, 0.28, 0.61, 0.81, 0.6, 0.42, 0.73, 0.26, 0.3, 0.22, 0.15, 0.39, 0.22, 0.12, 0.06, 0.12, 0.12, 0.1, 0.06, 0.06, 0.06, 0.04, 0.02, 0.01, 0.03, 0.01, 0.03, 0.09, 0.96, 0.93, 0.59, 0.17, 0.29, 0.31, 0.39, 0.45, 0.56, 0.42, 0.49, 0.09, 0.22, 0.23, 0.09, 0.06, 0.17, 0.08, 0.03, 0.04, 0.06, 0.03, 0.03, 0.03, 0.03, 0.02, 0.03, 0.07, 0.11, 0.51, 0.33, 0.92, 0.54, 0.71, 0.92, 0.61, 0.83, 0.57, 0.34, 0.25, 0.51, 0.42, 0.12, 0.2, 0.02, 0.12, 0.03, 0.1, 0.02];
/* [t, LArmForward, LElbow, RArmForward, RElbow, headNod, headTurn, headTilt, LArmOut, RArmOut] from the reference, in degrees */
const SING_KEYS=[[0,50,80,30,60,-30,0,4,8,6],[.5,70,40,40,90,-32,0,8,14,6],[1,100,70,80,100,-32,0,2,8,6],[1.5,120,60,90,110,-35,0,-6,8,8],[2,100,90,110,80,-33,-2,4,8,8],[2.5,90,100,120,70,-32,0,10,8,8],
 [3,120,70,90,110,-34,2,-4,8,8],[3.5,100,80,115,75,-32,0,6,8,8],[4,90,100,110,90,-28,10,8,8,8],[4.5,110,80,95,100,-35,6,-2,8,8],[5,130,60,100,90,-25,-5,6,10,8],[5.5,110,80,120,70,-27,-2,-4,8,8],
 [6,95,90,100,90,-20,0,10,8,8],[6.5,110,70,90,100,-26,2,4,8,8],[7,120,60,110,80,-30,0,-6,8,8],[7.5,100,90,115,80,-28,0,6,8,8],[8,90,100,100,90,-22,4,0,8,8],[8.5,110,80,105,90,-30,0,6,8,8],
 [9,100,90,110,80,-28,0,2,8,8],[9.5,80,100,90,90,-10,20,0,8,8],[10,40,80,60,100,0,45,4,6,8],[10.5,50,110,55,90,2,50,2,6,8],[11,30,70,30,70,2,45,0,5,6],[11.5,35,80,20,40,3,40,0,5,6],
 [12,45,120,45,120,5,0,0,0,0],[12.5,45,122,45,120,4,0,2,0,0],[13,46,120,45,122,4,0,6,0,0],[13.5,45,120,45,120,2,0,2,0,0],[14,45,122,46,120,0,0,0,0,0],[14.5,45,120,45,121,0,0,-2,0,0],[14.8,45,120,45,120,0,0,0,0,0]];
function singAt(t){ let i=0; while(i<SING_KEYS.length-2&&SING_KEYS[i+1][0]<=t) i++; const a=SING_KEYS[i], b=SING_KEYS[i+1], u0=Math.max(0,Math.min(1,(t-a[0])/(b[0]-a[0]))), u=u0*u0*(3-2*u0); return a.map((x,k)=>k?x+(b[k]-x)*u:t); }
function sceneJesvinSing(){
  if(S.recording) return;
  S.playing=false; syncPlay(); scEnd();
  const DUR=14.8;
  loadProject({objs:[],cam:{p:[-.45,1.35,2.7]},tgt:{p:[.3,1.35,0]},tracks:{},duration:DUR});
  kochiEnv(false); applyPreset('studio'); setAspect(1.78);
  const j=addEmbedded(0,{p:[0,0,0],r:[0,.32,0]}); j.name='Jesvin';
  const st=addEmbedded(1,{p:[1.25,0,-.35],r:[0,-1.05,0]}); st.name='Stany';
  const sm=x=>{ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); }, win=(t,a,b,f)=>sm((t-a)/f)*(1-sm((t-b)/f));
  const envAt=t=>{ const k=t*10, i=Math.floor(k), f=k-i, a=SING_ENV[Math.max(0,Math.min(SING_ENV.length-1,i))]||0, b=SING_ENV[Math.max(0,Math.min(SING_ENV.length-1,i+1))]||0; return a+(b-a)*f; };
  const tj=[], ts=[];
  for(let t=0;t<=DUR+1e-6;t+=.1){ const tt=+t.toFixed(2), K=singAt(tt), sing=win(tt,0,9.35,.25), talk=win(tt,10,11.1,.12), meow=win(tt,13.2,14.4,.12), e=envAt(tt);
    const f={headNod:K[5],headTurn:K[6],headTilt:K[7]+sing*5*Math.sin(tt*2*Math.PI/1.7),torsoLean:-5*sing+3*win(tt,12,14.8,.4),torsoTwist:4*sing*Math.sin(tt*2*Math.PI/3.4),torsoSide:5*sing*Math.sin(tt*2*Math.PI/1.7+1),
      LArmForward:38+(K[1]-30)*.35,LElbow:Math.min(128,K[2]+12),RArmForward:38+(K[3]-30)*.35,RElbow:Math.min(128,K[4]+12),LArmOut:-10-8*win(tt,11.9,14.8,.3),RArmOut:-10-8*win(tt,11.9,14.8,.3),LForeIn:16+34*win(tt,11.9,14.8,.3),RForeIn:16+34*win(tt,11.9,14.8,.3)};
    const b=mcPose(f);
    const closed=sing*.95;
    const mouth=Math.min(1,sing*(.12+.85*e)+talk*.75*e+meow*.7*e);
    b['face.a']=[+closed.toFixed(3),+closed.toFixed(3),+mouth.toFixed(3)];
    b['face.b']=[+(.35*sing+.1*talk-.1*win(tt,12,14.8,.3)).toFixed(3),+(.2*sing).toFixed(3),+(.35*meow).toFixed(3)];
    b['face.c']=[+(.45*sing+.35*talk+.55*win(tt,12.2,14.8,.3)).toFixed(3),+(.45*sing+.35*talk+.55*win(tt,12.2,14.8,.3)).toFixed(3),+(.55*sing).toFixed(3)];
    b['face.d']=[0,0,0];
    const H=win(tt,11.9,14.8,.3), pin=HAND_PRE['Pinch'], rel=HAND_PRE['Relaxed'], op=HAND_PRE['Open'];
    ['L','R'].forEach(s=>{ const o=op.map((x,k)=>x*(1-H)*.6+rel[k]*(1-H)*.4+pin[k]*H); b['hand.'+s+'.a']=o.slice(0,3).map(x=>+x.toFixed(3)); b['hand.'+s+'.b']=o.slice(3,6).map(x=>+x.toFixed(3)); });
    Object.keys(b).forEach(k=>{ b[k]=b[k].map(x=>Math.round(x*10000)/10000); });
    tj.push({t:tt,p:[0,0,0],r:[0,.32,0],s:[1,1,1],b:b});
    /* Stany: watches, a little puzzled; leans back when Jesvin turns to him; looks at camera at the end */
    const look=win(tt,10,11.6,.25), cam=win(tt,12,14.8,.4);
    const g={headNod:4-3*look,headTurn:-12*(1-cam)+8*cam,headTilt:-8*(1-look-cam)+4*Math.sin(tt*.7),torsoLean:-6*look,torsoTwist:0,torsoSide:0,LArmForward:12,LElbow:25,RArmForward:12,RElbow:25,LArmOut:6,RArmOut:6};
    const bs=mcPose(g); bs['face.b']=[+(-.2*(1-look)+.4*look).toFixed(3),0,0]; bs['face.c']=[+(.2+.5*look).toFixed(3),+(.7*(1-look)+.5*look).toFixed(3),0]; bs['face.d']=[0,0,+(.3*(1-look-cam)).toFixed(3)]; bs['face.a']=[0,0,+(.25*look).toFixed(3)];
    Object.keys(bs).forEach(k=>{ bs[k]=bs[k].map(x=>Math.round(x*10000)/10000); });
    ts.push({t:tt,p:[1.25,0,-.35],r:[0,-1.05,0],s:[1,1,1],b:bs}); }
  S.tracks[j.id]=tj; S.tracks[st.id]=ts;
  S.tracks.cam=[{t:0,p:[-.35,1.22,2.6],f:34},{t:9.3,p:[-.2,1.25,2.05],f:32},{t:10.2,p:[.2,1.35,2.3],f:34},{t:12,p:[.08,1.4,2.1],f:32},{t:DUR,p:[0,1.42,1.8],f:30}];
  S.tracks.tgt=[{t:0,p:[.15,1.38,0]},{t:9.3,p:[.08,1.45,0]},{t:10.2,p:[.45,1.42,-.05]},{t:12,p:[.08,1.4,0]},{t:DUR,p:[.04,1.45,0]}];
  S.duration=DUR; S.ease='linear'; S.fps=24; S.caps=[]; S.exp=[]; S.vo=null;
  S.t=0; setView('cam'); applyTracks(0); renderTimeline(); refreshScene(); saveNow();
  toast('Jesvin sings: animated from your reference video. Press play.');
}
