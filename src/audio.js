/* ---------- sound: procedural ambience and effects, mixed into the exported video ---------- */
const AU={ctx:null,master:null,dest:null,noise:null,live:{},last:0,on:true,timer:null};
function auData(){ if(!S.audio||!Array.isArray(S.audio.cues)) S.audio={beds:[],cues:[]}; return S.audio; }
function auEnsure(){
  try{
    if(AU.ctx){ if(AU.ctx.state==='suspended') AU.ctx.resume(); return AU.ctx; }
    const C=window.AudioContext||window.webkitAudioContext; if(!C) return null;
    const c=new C(); AU.ctx=c; AU.master=c.createGain(); AU.master.gain.value=.85;
    const comp=c.createDynamicsCompressor(); AU.master.connect(comp); comp.connect(c.destination);
    if(c.createMediaStreamDestination){ AU.dest=c.createMediaStreamDestination(); comp.connect(AU.dest); }
    const b=c.createBuffer(1,c.sampleRate*3,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; AU.noise=b;
    if(!AU.timer) AU.timer=setInterval(auEvents,250);
    return c;
  }catch(e){ return null; }
}
function auNoise(c,loop){ const s=c.createBufferSource(); s.buffer=AU.noise; s.loop=loop!==false; if(loop!==false) s.loopStart=Math.random()*1.5; return s; }
function auFilt(c,type,f,q){ const x=c.createBiquadFilter(); x.type=type; x.frequency.value=f; if(q) x.Q.value=q; return x; }
function auLfo(c,rate,depth,target){ const o=c.createOscillator(), g=c.createGain(); o.frequency.value=rate; g.gain.value=depth; o.connect(g); g.connect(target); o.start(); return o; }
/* one-shot helpers */
function auEnv(c,g,t0,a,d,peak){ g.gain.cancelScheduledValues(t0); g.gain.setValueAtTime(0.0001,t0); g.gain.linearRampToValueAtTime(peak,t0+a); g.gain.exponentialRampToValueAtTime(0.0001,t0+a+d); }
function auTone(c,out,f0,f1,t0,a,d,peak,type){ const o=c.createOscillator(), g=c.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(f0,t0); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t0+a+d); auEnv(c,g,t0,a,d,peak); o.connect(g); g.connect(out); o.start(t0); o.stop(t0+a+d+.05); }
function auBurst(c,out,type,f,q,t0,a,d,peak){ const s=auNoise(c,true), fl=auFilt(c,type,f,q), g=c.createGain(); auEnv(c,g,t0,a,d,peak); s.connect(fl); fl.connect(g); g.connect(out); s.start(t0); s.stop(t0+a+d+.05); }
const AU_SFX={
  bong:(c,o,t,v)=>{ [[1,1],[2.0,.5],[2.76,.32],[4.1,.15]].forEach(p=>auTone(c,o,196*p[0],0,t,.004,3.2/p[0]**.4,.5*v*p[1])); auBurst(c,o,'bandpass',900,1,t,.002,.08,.25*v); },
  tick:(c,o,t,v)=>{ auBurst(c,o,'bandpass',2600,3,t,.001,.03,.35*v); },
  creak:(c,o,t,v)=>{ const s=c.createOscillator(), g=c.createGain(), f=auFilt(c,'bandpass',420,6); s.type='sawtooth'; s.frequency.setValueAtTime(70,t); s.frequency.linearRampToValueAtTime(115,t+.5); s.frequency.linearRampToValueAtTime(62,t+1.1); f.frequency.setValueAtTime(380,t); f.frequency.linearRampToValueAtTime(900,t+.6); auEnv(c,g,t,.15,1,.34*v); s.connect(f); f.connect(g); g.connect(o); s.start(t); s.stop(t+1.4); },
  thud:(c,o,t,v)=>{ auTone(c,o,90,38,t,.003,.35,.9*v); auBurst(c,o,'lowpass',320,.7,t,.002,.2,.5*v); },
  slam:(c,o,t,v)=>{ auBurst(c,o,'lowpass',1100,.7,t,.002,.35,.9*v); auTone(c,o,70,30,t,.003,.5,.9*v); },
  knock:(c,o,t,v)=>{ [0,.22,.4].forEach(d=>{ auTone(c,o,150,70,t+d,.002,.12,.6*v); auBurst(c,o,'bandpass',500,2,t+d,.002,.07,.3*v); }); },
  step:(c,o,t,v)=>{ auBurst(c,o,'lowpass',380,.8,t,.004,.09,.45*v); },
  plink:(c,o,t,v)=>{ auTone(c,o,523,0,t,.002,1.2,.4*v); auTone(c,o,1047,0,t,.002,.7,.18*v); auTone(c,o,1568,0,t,.002,.4,.08*v); },
  chime:(c,o,t,v)=>{ auTone(c,o,880,0,t,.004,.35,.4*v); auTone(c,o,1320,0,t+.12,.004,.4,.35*v); },
  shutter:(c,o,t,v)=>{ auBurst(c,o,'highpass',2500,1,t,.001,.03,.5*v); auBurst(c,o,'highpass',1800,1,t+.07,.001,.05,.4*v); },
  clap:(c,o,t,v)=>{ auBurst(c,o,'bandpass',1700,.9,t,.001,.09,.9*v); auBurst(c,o,'bandpass',1200,.9,t+.02,.001,.07,.5*v); },
  glass:(c,o,t,v)=>{ auTone(c,o,2800,0,t,.001,.35,.25*v); auTone(c,o,4300,0,t+.01,.001,.25,.15*v); },
  keys:(c,o,t,v)=>{ for(let i=0;i<7;i++) auTone(c,o,3000+Math.random()*3500,0,t+i*.05,.001,.18,.18*v); },
  whoosh:(c,o,t,v)=>{ const s=auNoise(c,true), f=auFilt(c,'bandpass',300,1.2), g=c.createGain(); f.frequency.setValueAtTime(300,t); f.frequency.exponentialRampToValueAtTime(3000,t+.5); auEnv(c,g,t,.25,.35,.5*v); s.connect(f); f.connect(g); g.connect(o); s.start(t); s.stop(t+.8); },
  sting:(c,o,t,v)=>{ [311,466,622].forEach(f=>auTone(c,o,f,f*.98,t,.01,1.6,.2*v,'sawtooth')); auBurst(c,o,'lowpass',500,1,t,.01,.8,.2*v); },
  rumble:(c,o,t,v,d)=>{ d=d||5; const s=auNoise(c,true), f=auFilt(c,'lowpass',140,.8), g=c.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.8*v,t+d*.6); g.gain.linearRampToValueAtTime(.0001,t+d); s.connect(f); f.connect(g); g.connect(o); s.start(t); s.stop(t+d+.1);
    const q=c.createOscillator(), qg=c.createGain(); q.frequency.value=38; q.type='sine'; qg.gain.setValueAtTime(.0001,t); qg.gain.linearRampToValueAtTime(.7*v,t+d*.5); qg.gain.linearRampToValueAtTime(.0001,t+d); q.connect(qg); qg.connect(o); q.start(t); q.stop(t+d+.1);
    for(let i=0;i<8;i++) auBurst(c,o,'bandpass',1500+Math.random()*2000,2,t+Math.random()*d*.8,.002,.05,.12*v); },
  engine_start:(c,o,t,v)=>{ auTone(c,o,34,62,t,.05,.9,.5*v,'sawtooth'); auBurst(c,o,'lowpass',400,.8,t,.05,.7,.4*v); },
  car_door:(c,o,t,v)=>{ auTone(c,o,110,55,t,.002,.22,.7*v); auBurst(c,o,'highpass',3000,1,t+.02,.001,.04,.3*v); },
  gasp:(c,o,t,v)=>{ auBurst(c,o,'bandpass',1400,1.2,t,.12,.35,.35*v); },
  splash:(c,o,t,v)=>{ auBurst(c,o,'bandpass',1800,.7,t,.01,.4,.5*v); auBurst(c,o,'highpass',4000,1,t,.005,.25,.3*v); },
  frog:(c,o,t,v)=>{ auTone(c,o,180,260,t,.01,.12,.3*v,'square'); auTone(c,o,200,300,t+.16,.01,.12,.25*v,'square'); }
};
/* ambient beds: build(c) returns {out,stop(),evt?} */
const AU_BEDS={
  harbour:c=>{ const out=c.createGain(), n=auNoise(c), lp=auFilt(c,'lowpass',420), wg=c.createGain(); wg.gain.value=.12; n.connect(lp); lp.connect(wg); wg.connect(out); const l=auLfo(c,.13,.09,wg.gain);
    const m=auNoise(c), bp=auFilt(c,'bandpass',750,.7), mg=c.createGain(); mg.gain.value=.09; m.connect(bp); bp.connect(mg); mg.connect(out); const l2=auLfo(c,.3,.03,mg.gain); n.start(); m.start();
    return {out:out,stop:()=>{ [n,m,l,l2].forEach(x=>{try{x.stop();}catch(e){}}); },evt:(c,t)=>{ if(Math.random()<.16){ auTone(c,out,1900,1150,t,.05,.45,.07); auTone(c,out,2100,1300,t+.22,.05,.4,.06); } }}; },
  forest:c=>{ const out=c.createGain(), n=auNoise(c), lp=auFilt(c,'lowpass',650), wg=c.createGain(); wg.gain.value=.1; n.connect(lp); lp.connect(wg); wg.connect(out); const l=auLfo(c,.09,.06,wg.gain);
    const cr=c.createOscillator(), cg=c.createGain(), am=c.createGain(); cr.frequency.value=4300; cg.gain.value=.012; am.gain.value=.5; cr.connect(cg); cg.connect(out); const l2=auLfo(c,22,.012,cg.gain); cr.start(); n.start();
    return {out:out,stop:()=>{ [n,cr,l,l2].forEach(x=>{try{x.stop();}catch(e){}}); },evt:(c,t)=>{ if(Math.random()<.35){ const f=2300+Math.random()*2200, k=2+Math.floor(Math.random()*3); for(let i=0;i<k;i++) auTone(c,out,f,f*1.25,t+i*.11,.01,.07,.06); } }}; },
  night:c=>{ const out=c.createGain(), n=auNoise(c), lp=auFilt(c,'lowpass',380), wg=c.createGain(); wg.gain.value=.07; n.connect(lp); lp.connect(wg); wg.connect(out); const l=auLfo(c,.07,.05,wg.gain);
    const cr=c.createOscillator(), cg=c.createGain(); cr.frequency.value=3800; cg.gain.value=.012; cr.connect(cg); cg.connect(out); const l2=auLfo(c,9,.012,cg.gain); cr.start(); n.start();
    return {out:out,stop:()=>{ [n,cr,l,l2].forEach(x=>{try{x.stop();}catch(e){}}); },evt:(c,t)=>{ if(Math.random()<.04) auTone(c,out,420,330,t,.1,.9,.05); }}; },
  interior:c=>{ const out=c.createGain(), n=auNoise(c), lp=auFilt(c,'lowpass',170), g=c.createGain(); g.gain.value=.08; n.connect(lp); lp.connect(g); g.connect(out);
    const h=c.createOscillator(), hg=c.createGain(); h.frequency.value=50; hg.gain.value=.025; h.connect(hg); hg.connect(out); h.start(); n.start();
    return {out:out,stop:()=>{ [n,h].forEach(x=>{try{x.stop();}catch(e){}}); },evt:(c,t)=>{ if(Math.random()<.05) AU_SFX.creak(c,out,t,.35); }}; },
  wind:c=>{ const out=c.createGain(), n=auNoise(c), bp=auFilt(c,'bandpass',520,.6), g=c.createGain(); g.gain.value=.12; n.connect(bp); bp.connect(g); g.connect(out); const l=auLfo(c,.11,.07,g.gain), l2=auLfo(c,.05,180,bp.frequency); n.start();
    return {out:out,stop:()=>{ [n,l,l2].forEach(x=>{try{x.stop();}catch(e){}}); }}; },
  rain:c=>{ const out=c.createGain(), n=auNoise(c), hp=auFilt(c,'highpass',1400), g=c.createGain(); g.gain.value=.12; n.connect(hp); hp.connect(g); g.connect(out); n.start();
    return {out:out,stop:()=>{ try{n.stop();}catch(e){} }}; },
  drone:c=>{ const out=c.createGain(), lp=auFilt(c,'lowpass',240), a=c.createOscillator(), b=c.createOscillator(), g=c.createGain(); a.type='sawtooth'; b.type='sawtooth'; a.frequency.value=55; b.frequency.value=57.4; g.gain.value=.12; a.connect(lp); b.connect(lp); lp.connect(g); g.connect(out); const l=auLfo(c,.12,.05,g.gain); a.start(); b.start();
    return {out:out,stop:()=>{ [a,b,l].forEach(x=>{try{x.stop();}catch(e){}}); }}; },
  engine:c=>{ const out=c.createGain(), lp=auFilt(c,'lowpass',420), a=c.createOscillator(), b=c.createOscillator(), g=c.createGain(); a.type='sawtooth'; b.type='square'; a.frequency.value=48; b.frequency.value=72; g.gain.value=.16; a.connect(lp); b.connect(lp); lp.connect(g); g.connect(out); const l=auLfo(c,13,.05,g.gain), l2=auLfo(c,.4,3,a.frequency);
    const n=auNoise(c), nf=auFilt(c,'lowpass',260), ng=c.createGain(); ng.gain.value=.1; n.connect(nf); nf.connect(ng); ng.connect(out); a.start(); b.start(); n.start();
    return {out:out,stop:()=>{ [a,b,l,l2,n].forEach(x=>{try{x.stop();}catch(e){}}); }}; },
  clock:c=>{ const out=c.createGain(); return {out:out,stop:()=>{},evt:(c,t)=>{}, every:1000, tick:(c,t)=>AU_SFX.tick(c,out,t,.5)}; }
};
function auFade(b,t){ const f=Math.max(.01,b.f==null?1:b.f), v=b.v==null?.6:b.v; if(t<b.t0||t>b.t1+f) return 0; if(t<b.t0+f) return v*(t-b.t0)/f; if(t>b.t1) return v*(1-(t-b.t1)/f); return v; }
function auUpdate(t,playing){
  if(!AU.ctx||!AU.on) return;
  const c=AU.ctx, now=c.currentTime, A=auData(), want={};
  if(playing){
    A.beds.forEach((b,i)=>{ if(!AU_BEDS[b.k]) return; const g=auFade(b,t); if(g>.002){ const key=b.k+'#'+i; want[key]=[b,g]; } });
    if(t<AU.last-.001||t>AU.last+.6) AU.last=t;
    A.cues.forEach(q=>{ if(q.t>AU.last&&q.t<=t&&AU_SFX[q.k]) AU_SFX[q.k](c,AU.master,now+.02,q.v==null?.8:q.v,q.d); });
    AU.last=t;
  } else AU.last=t;
  Object.keys(want).forEach(key=>{ let L=AU.live[key]; if(!L){ const b=want[key][0], built=AU_BEDS[b.k](c), g=c.createGain(); g.gain.value=0; built.out.connect(g); g.connect(AU.master); L=AU.live[key]={built:built,g:g,v:0,off:0,next:0}; }
    L.v=want[key][1]; L.off=0; L.g.gain.setTargetAtTime(L.v,now,.12); });
  Object.keys(AU.live).forEach(key=>{ if(want[key]) return; const L=AU.live[key]; L.v=0; L.g.gain.setTargetAtTime(0,now,.12); L.off=(L.off||now)+0; if(!L.offAt) L.offAt=now+.8; if(now>L.offAt){ try{ L.built.stop(); L.g.disconnect(); }catch(e){} delete AU.live[key]; } });
  Object.keys(want).forEach(key=>{ const L=AU.live[key]; if(L) L.offAt=0; });
}
function auEvents(){
  if(!AU.ctx||!AU.on) return; const c=AU.ctx, now=c.currentTime;
  Object.keys(AU.live).forEach(key=>{ const L=AU.live[key]; if(L.v<.01||!L.built) return;
    if(L.built.every){ if(now>=L.next){ L.built.tick&&L.built.tick(c,now+.02); L.next=now+L.built.every/1000; } }
    else if(L.built.evt) L.built.evt(c,now+.02); });
}
/* cues from the chat link or the AI tools */
function setAudio(d,replace){
  const A=replace===false?auData():(S.audio={beds:[],cues:[]}), num=(v,a,lo,hi)=>{ v=+v; return isFinite(v)?Math.max(lo,Math.min(hi,v)):a; };
  (Array.isArray(d.beds)?d.beds:[]).slice(0,60).forEach(b=>{ if(b&&AU_BEDS[b.k]) A.beds.push({k:b.k,t0:num(b.t0,0,0,3600),t1:num(b.t1,10,0,3600),v:num(b.v,.6,0,1.5),f:num(b.f,1,.05,20)}); });
  (Array.isArray(d.cues)?d.cues:[]).slice(0,600).forEach(q=>{ if(q&&AU_SFX[q.k]) A.cues.push({t:num(q.t,0,0,3600),k:q.k,v:num(q.v,.8,0,1.5),d:num(q.d,5,.2,20)}); });
  A.cues.sort((a,b)=>a.t-b.t); queueSave&&queueSave(); return {beds:A.beds.length,cues:A.cues.length};
}
function auTest(){ const c=auEnsure(); if(!c){ toast('This browser cannot play sound.'); return; } const t=c.currentTime+.05; AU_SFX.bong(c,AU.master,t,.8); AU_SFX.creak(c,AU.master,t+1.6,.6); AU_SFX.plink(c,AU.master,t+3,.7); toast('Sound test: bong, creak, piano note. Nothing heard? Turn the volume up and the silent switch off.'); }
function auToggle(){ AU.on=!AU.on; if(!AU.on) Object.keys(AU.live).forEach(k=>{ try{ AU.live[k].built.stop(); AU.live[k].g.disconnect(); }catch(e){} delete AU.live[k]; }); toast(AU.on?'Sound on.':'Sound off.'); }
/* iOS keeps Web Audio silent unless a media element is playing; this tiny silent loop switches the audio session on */
function auUnlock(){ try{ if(AU.unl) { AU.unl.play&&AU.unl.play().catch(()=>{}); return; } const w=new Uint8Array(44+2*800), dv=new DataView(w.buffer), S4=(o,s)=>{ for(let i=0;i<4;i++) w[o+i]=s.charCodeAt(i); };
  S4(0,'RIFF'); dv.setUint32(4,36+1600,true); S4(8,'WAVE'); S4(12,'fmt '); dv.setUint32(16,16,true); dv.setUint16(20,1,true); dv.setUint16(22,1,true); dv.setUint32(24,8000,true); dv.setUint32(28,16000,true); dv.setUint16(32,2,true); dv.setUint16(34,16,true); S4(36,'data'); dv.setUint32(40,1600,true);
  let s=''; for(let i=0;i<w.length;i++) s+=String.fromCharCode(w[i]); const el=new Audio('data:audio/wav;base64,'+btoa(s)); el.loop=true; el.volume=.01; el.setAttribute('playsinline',''); AU.unl=el; const p=el.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} }
document.addEventListener('pointerdown',()=>{ auEnsure(); auUnlock(); },{passive:true});
