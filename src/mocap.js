/* ---------- Motion from video: Claude reads poses from frames of a reference video and keys the selected rigged character ---------- */
const MC={file:null,url:'',fps:4,mirror:false,speed:1,busy:false,abort:null,from:0,to:0,dur:0,video:null};
const MC_KEYS=['headTurn','headNod','headTilt','torsoLean','torsoTwist','torsoSide','LArmForward','LArmOut','LElbow','RArmForward','RArmOut','RElbow','LLegForward','LLegOut','LKnee','RLegForward','RLegOut','RKnee'];
const MC_FACE=['mouthOpen','smile','browsUp','browsWorried','eyesClosed','squint'];
const MC_HANDS={open:'Open',relaxed:'Relaxed',fist:'Fist',point:'Point',thumbs_up:'Thumbs up',pinch:'Pinch',peace:'Peace'};
const MC_PROMPT='You are a motion-capture assistant for a 3D animation studio. Each attached image is one frame of a reference video of a person, in time order; the frame numbers are listed below. For EVERY frame, estimate the pose of the main person as joint angles in degrees, using the PERSON\'S OWN left and right (if they face the camera, their right hand is on the image\'s left). Conventions, all relative to standing upright with arms hanging at the sides: headTurn (-70..70, + = turns toward their own left), headNod (-40..40, + = looks down), headTilt (-30..30, + = ear toward their left shoulder), torsoLean (-30..60, + = leans forward), torsoTwist (-40..40, + = chest turns toward their left), torsoSide (-30..30, + = bends toward their left). For each arm (L and R): ArmForward (-40..180, how far the upper arm swings forward and up from hanging: 90 = pointing straight ahead), ArmOut (0..180, how far it lifts out to the side: 90 = horizontal T-pose), Elbow (0..150, elbow bend: 0 = straight). For each leg: LegForward (-30..120, thigh swung forward: 90 = thigh horizontal as when sitting), LegOut (0..60, thigh out to the side), Knee (0..150, knee bend: 90 = sitting). hands: shape of each hand, one of open, relaxed, fist, point, thumbs_up, pinch, peace. face: mouthOpen (0..1), smile (-1 frown .. 1 big smile), browsUp (-1 lowered .. 1 raised), browsWorried (-1 angry .. 1 worried), eyesClosed (0..1), squint (0..1). If a body part is hidden, give your best guess that stays consistent with the neighbouring frames. Reply with ONLY JSON, no prose: {"frames":[{"i":frame number,"headTurn":0,"headNod":0,"headTilt":0,"torsoLean":0,"torsoTwist":0,"torsoSide":0,"LArmForward":0,"LArmOut":0,"LElbow":0,"RArmForward":0,"RArmOut":0,"RElbow":0,"LLegForward":0,"LLegOut":0,"LKnee":0,"RLegForward":0,"RLegOut":0,"RKnee":0,"hands":{"L":"relaxed","R":"relaxed"},"face":{"mouthOpen":0,"smile":0,"browsUp":0,"browsWorried":0,"eyesClosed":0,"squint":0}}]}';
function mcSet(t){ const el=$('#mcStat'); if(el) el.textContent=t; }
function mcPick(file){
  if(!file) return; mcSet('Loading video ('+(file.name||'clip')+', '+(file.size/1048576).toFixed(1)+' MB)...');
  if(MC.url) URL.revokeObjectURL(MC.url); MC.file=file; MC.url=URL.createObjectURL(file); MC.dur=0;
  const v=MC.video; v.hidden=false; v.muted=true; v.preload='auto'; v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline','');
  let ok=false; const ready=()=>{ if(ok) return; let d=v.duration; if(!isFinite(d)||d<=0){ return; } ok=true; MC.dur=d; MC.from=0; MC.to=Math.min(d,12); mcSync(); mcSet('Video ready: '+d.toFixed(1)+' s. Select the rigged character, set the range, then Animate from video.'); };
  ['loadedmetadata','loadeddata','canplay','durationchange'].forEach(ev=>v.addEventListener(ev,ready));
  v.onerror=()=>{ const c=v.error&&v.error.code; mcSet('This video could not be opened here'+(c?' (error '+c+')':'')+'. Try an MP4 or MOV from the Photos app, or record with Camera Formats set to Most Compatible.'); };
  v.src=MC.url; try{ v.load(); }catch(e){}
  /* iPad Safari decodes frames only after playback has started once */
  setTimeout(()=>{ const p=v.play(); if(p&&p.then) p.then(()=>{ v.pause(); try{ v.currentTime=0; }catch(e){} ready(); }).catch(()=>{}); },120);
  setTimeout(()=>{ if(!ok){ if(isFinite(v.duration)&&v.duration>0) ready(); else mcSet('The video is still not ready. Tap play on the video once, then tap Animate from video. If it never plays, export it again as MP4.'); } },6000);
}
function mcSync(){ const a=$('#mcFrom'), b=$('#mcTo'); if(a) a.value=MC.from.toFixed(1); if(b) b.value=MC.to.toFixed(1); const n=$('#mcCount'); if(n) n.textContent=Math.max(1,Math.round((MC.to-MC.from)*MC.fps)+1)+' frames will be read.'; }
function mcSeek(v,t){ return new Promise(res=>{ const done=()=>{ v.removeEventListener('seeked',done); res(); }; v.addEventListener('seeked',done); v.currentTime=Math.min(Math.max(0,t),Math.max(0,(v.duration||t)-.01)); setTimeout(done,2500); }); }
async function mcGrab(v,t,mt){ await mcSeek(v,t); if(!v.videoWidth) await new Promise(r=>setTimeout(r,300)); const w=v.videoWidth||640, h=v.videoHeight||360, s=Math.min(1,640/Math.max(w,h)), c=document.createElement('canvas'); c.width=Math.round(w*s); c.height=Math.round(h*s);
  const g=c.getContext('2d'); if(MC.mirror){ g.translate(c.width,0); g.scale(-1,1); } g.drawImage(v,0,0,c.width,c.height); return await new Promise(r=>c.toBlob(r,mt||'image/jpeg',.82)); }
function mcNum(x,lo,hi){ x=+x; return isFinite(x)?Math.max(lo,Math.min(hi,x)):0; }
function mcPose(f){ const D=Math.PI/180, g=k=>mcNum(f[k],-180,180)*D, P={};
  const turn=g('headTurn'), nod=g('headNod'), tilt=g('headTilt'), lean=g('torsoLean'), tw=g('torsoTwist'), sd=g('torsoSide');
  P['neck']=[nod*.3,turn*.35,-tilt*.3]; P['head']=[nod*.7,turn*.65,-tilt*.7];
  P['spine']=[lean*.5,tw*.4,-sd*.5]; P['chest']=[lean*.5,tw*.6,-sd*.5]; P['hips']=[0,0,0];
  [['L',1],['R',-1]].forEach(([s,k])=>{ P['upperArm.'+s]=[-g(s+'ArmForward'),0,k*g(s+'ArmOut')]; P['foreArm.'+s]=[-g(s+'Elbow'),0,-k*g(s+'ForeIn')]; P['hand.'+s]=[0,0,0];
    P['upperLeg.'+s]=[-g(s+'LegForward'),0,k*g(s+'LegOut')]; P['lowerLeg.'+s]=[g(s+'Knee'),0,0]; P['foot.'+s]=[0,0,0]; });
  return P; }
function mcHand(name){ const k=MC_HANDS[String(name||'').toLowerCase()]||'Relaxed'; return HAND_PRE[k]; }
function mcSmooth(frames){ const n=frames.length; if(n<3) return frames; const out=frames.map(f=>JSON.parse(JSON.stringify(f)));
  for(let i=1;i<n-1;i++){ MC_KEYS.forEach(k=>{ out[i][k]=(+frames[i-1][k]||0)*.25+(+frames[i][k]||0)*.5+(+frames[i+1][k]||0)*.25; }); MC_FACE.forEach(k=>{ const a=frames[i-1].face||{}, b=frames[i].face||{}, c=frames[i+1].face||{}; (out[i].face=out[i].face||{})[k]=(+a[k]||0)*.25+(+b[k]||0)*.5+(+c[k]||0)*.25; }); }
  return out; }
async function mcRun(){
  const btn=$('#mcGo'); if(MC.busy){ if(MC.abort) MC.abort.abort(); return; }
  const node=rigNode(); if(!node){ toast('Select a rigged character first (Auto-rig it in this tab, or use a Character creator person).'); return; }
  if(!MC.file){ toast('Choose a reference video first.'); return; } if(!(MC.dur>0)){ const d=MC.video.duration; if(isFinite(d)&&d>0){ MC.dur=d; if(!(MC.to>MC.from)){ MC.from=0; MC.to=Math.min(d,12); } mcSync(); } else { mcSet('The video is not ready yet. Tap play on it once, then try again.'); return; } }
  const sample=await getSample(); if(!sample){ mcSet('Claude is not available in this view. Open the studio from its card in the Claude app.'); return; }
  let lim={}; try{ lim=await sample.limits(); }catch(e){} const L=lim&&lim.images; if(!L){ mcSet('This Claude app cannot send images to Claude yet. Update the app and try again.'); return; }
  const mt=L.mediaTypes.indexOf('image/jpeg')>=0?'image/jpeg':L.mediaTypes[0]; const per=Math.max(1,Math.min(6,L.maxCount||4));
  const v=MC.video, times=[]; for(let t=MC.from;t<=MC.to+1e-6;t+=1/MC.fps) times.push(+t.toFixed(3)); if(!times.length){ mcSet('The range is empty.'); return; }
  MC.busy=true; MC.abort=new AbortController(); btn.textContent='Stop'; const got={};
  try{
    for(let s=0;s<times.length;s+=per){
      const chunk=times.slice(s,s+per), imgs=[]; mcSet('Reading frames '+(s+1)+'-'+(s+chunk.length)+' of '+times.length+'...');
      for(const t of chunk){ if(MC.abort.signal.aborted) throw {code:'cancelled'}; const b=await mcGrab(v,t,mt); if(b&&b.size<=L.maxInputBytes) imgs.push(b); }
      const list=chunk.map((t,i)=>'image '+(i+1)+' = frame '+(s+i)+' (t='+t.toFixed(2)+'s)').join('; ');
      let res=null; for(let tries=0;tries<2&&!res;tries++){ try{ res=await sample.json(MC_PROMPT+' Frames in this batch: '+list+'.',{images:imgs,modelTier:'default',signal:MC.abort.signal}); }catch(err){ if(err&&err.code==='rate_limited'){ mcSet('Claude is busy, waiting a moment...'); await new Promise(r=>setTimeout(r,4000)); } else if(tries) throw err; } }
      const fr=(res&&Array.isArray(res.frames))?res.frames:[]; fr.forEach((f,k)=>{ const i=Number.isFinite(+f.i)?+f.i:s+k; if(i>=s&&i<s+chunk.length) got[i]=f; });
    }
    const frames=[]; times.forEach((t,i)=>{ if(got[i]) frames.push(Object.assign({t:t},got[i])); }); if(frames.length<2) throw new Error('Claude could not read enough poses from this video. Try a clearer, well-lit clip with the whole body visible.');
    const sm=mcSmooth(frames), id=node.userData.id, t0=S.t, span=(MC.to-MC.from)/MC.speed;
    const keep=(S.tracks[id]||[]).filter(k=>k.t<t0-1e-3||k.t>t0+span+1e-3);
    const keys=sm.map(f=>{ const tt=+(t0+(f.t-MC.from)/MC.speed).toFixed(3), base=(S.tracks[id]&&S.tracks[id].length)?sampleTrack(id,tt):null;
      const b=mcPose(f), hf=f.hands||{}, fc=f.face||{};
      ['L','R'].forEach(s=>{ const h=mcHand(hf[s]); b['hand.'+s+'.a']=[h[0],h[1],h[2]]; b['hand.'+s+'.b']=[h[3],h[4],h[5]]; });
      const ec=mcNum(fc.eyesClosed,0,1); b['face.a']=[ec,ec,mcNum(fc.mouthOpen,0,1)]; b['face.b']=[mcNum(fc.smile,-1,1),0,0]; b['face.c']=[mcNum(fc.browsUp,-1,1),mcNum(fc.browsUp,-1,1),mcNum(fc.browsWorried,-1,1)]; b['face.d']=[0,0,mcNum(fc.squint,0,1)];
      return {t:tt,p:base?base.p.slice():node.position.toArray(),r:base?base.r.slice():[node.rotation.x,node.rotation.y,node.rotation.z],s:base?base.s.slice():node.scale.toArray(),b:b}; });
    S.tracks[id]=keep.concat(keys).sort((a,b)=>a.t-b.t);
    if(t0+span>S.duration) S.duration=+(t0+span+.1).toFixed(2);
    applyTracks(S.t); renderTimeline(); refreshScene(); queueSave();
    mcSet('Done: '+keys.length+' poses keyed from '+t0.toFixed(2)+' s to '+(t0+span).toFixed(2)+' s. Press play. Fix any odd frame by posing and keying it by hand.'); toast('Motion from video applied.');
  }catch(err){ if((MC.abort&&MC.abort.signal.aborted)||(err&&err.code==='cancelled')) mcSet('Stopped. Nothing was changed.'); else mcSet((typeof aiErrorText==='function'?aiErrorText(err):(err&&err.message))||'Something went wrong.'); }
  finally{ MC.busy=false; MC.abort=null; btn.textContent='Animate from video'; }
}
function buildMocapPanel(){
  const host=$('#pRig'); if(!host) return;
  const v=document.createElement('video'); v.muted=true; v.playsInline=true; v.controls=true; v.hidden=true; v.style.cssText='width:100%;max-height:220px;border-radius:8px;background:#000'; MC.video=v;
  const pick=filePick('Choose reference video...','video/*,.mov,.mp4,.m4v,.webm',false,fs=>mcPick(fs[0]));
  const num=(id,lab,get,set)=>{ const i=document.createElement('input'); i.type='number'; i.step='.1'; i.min='0'; i.id=id; i.className='num'; i.style.width='80px'; i.addEventListener('change',()=>{ set(Math.max(0,Math.min(MC.dur||999,+i.value||0))); mcSync(); }); return row(lab,i); };
  const fromNow=scBtn('Start = video position',()=>{ MC.from=v.currentTime||0; if(MC.to<MC.from) MC.to=Math.min(MC.dur,MC.from+5); mcSync(); });
  const toNow=scBtn('End = video position',()=>{ MC.to=Math.max(MC.from+.25,v.currentTime||0); mcSync(); });
  const fps=document.createElement('select'); fps.className='sel2'; fps.setAttribute('aria-label','Frames read per second'); [[2,'2 per second (fast)'],[4,'4 per second'],[6,'6 per second (detailed, slower)']].forEach(q=>{ const o=document.createElement('option'); o.value=q[0]; o.textContent=q[1]; fps.appendChild(o); }); fps.value='4'; fps.addEventListener('change',()=>{ MC.fps=+fps.value; mcSync(); });
  const go=scBtn('Animate from video',mcRun,'hi'); go.id='mcGo';
  const st=document.createElement('p'); st.className='note'; st.id='mcStat'; st.style.color='var(--fg)'; st.textContent='Choose a short clip of someone acting the shot.';
  const cnt=document.createElement('p'); cnt.className='note'; cnt.id='mcCount';
  const g=document.createElement('div'); g.className='g2'; g.append(fromNow,toNow);
  host.appendChild(panel('Motion from video',[pick,v,g,num('mcFrom','Start (s)',()=>MC.from,x=>{ MC.from=x; }),num('mcTo','End (s)',()=>MC.to,x=>{ MC.to=Math.max(MC.from+.25,x); }),row('Read',fps),
    chk('Mirror (selfie video)',()=>MC.mirror,x=>{ MC.mirror=x; }),cnt,go,st,
    noteEl('Film yourself acting the line: whole body or upper body in frame, good light, plain background. Claude reads the body, head, hands and face in each sampled frame, and the poses are keyed on the selected character from the playhead, with smooth in-betweens. It does not move the character across the floor, and lip sync still comes from the voice track. Short clips (3 to 10 seconds) work best.')],false));
  mcSync();
}
