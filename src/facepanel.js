/* ---------- Face and hands tab: keyable face sliders, mouth shapes, expressions, finger curls ---------- */
IC.tFace=svg('<circle cx="10" cy="10" r="6.5" '+stroke+'/><path d="M7.3 12.2c1.3 1.5 4.1 1.5 5.4 0M7.6 8.2h.01M12.4 8.2h.01" '+stroke+'/>');
TABS.push({id:'face',ic:IC.tFace,t:'Face and hands',pane:'pFace',needSel:true});
const FACE_CH=[ /* label, pose key, index, min, max */
  ['Blink left eye','face.a',0,0,1],['Blink right eye','face.a',1,0,1],['Squint both eyes','face.d',2,0,1],
  ['Jaw open','face.a',2,0,1],['Smile (frown below 0)','face.b',0,-1,1],['Mouth wide or narrow','face.b',1,-1,1],['Round mouth (O, U)','face.b',2,0,1],['Lip pucker','face.e',0,0,1],['Upper lip raise','face.e',1,-1,1],['Lower lip drop','face.e',2,-1,1],
  ['Left brow up or down','face.c',0,-1,1],['Right brow up or down','face.c',1,-1,1],['Brows: worried (+) or angry (-)','face.c',2,-1,1],
  ['Look right or left','face.d',0,-1,1],['Look up or down','face.d',1,-1,1],
  ['Smile left','face.f',0,-1,1],['Smile right','face.f',1,-1,1],['Jaw sideways','face.f',2,-1,1],['Mouth sideways','face.g',0,-1,1],['Lips press together','face.g',1,0,1],['Cheek puff','face.g',2,0,1],
  ['Eye wide left','face.h',0,0,1],['Eye wide right','face.h',1,0,1],['Nose wrinkle','face.h',2,0,1],['Inner brow left','face.i',0,-1,1],['Inner brow right','face.i',1,-1,1],['Outer brow left','face.j',0,-1,1],['Outer brow right','face.j',1,-1,1]];
const HAND_CH=[['Thumb curl',0,'a',0],['Index curl',0,'a',1],['Middle curl',0,'a',2],['Ring curl',0,'b',0],['Pinky curl',0,'b',1],['Finger spread',0,'b',2]];
const HAND_PRE={'Open':[0,0,0,0,0,.6],'Relaxed':[.25,.3,.35,.4,.45,0],'Fist':[.8,1,1,1,1,0],'Point':[.8,0,1,1,1,0],'Thumbs up':[0,1,1,1,1,0],'Pinch':[.55,.55,.2,.1,.1,0],'Peace':[.8,0,0,1,1,.8]};
const MOUTH_PRE={'Rest':{'face.a':[0,0,0],'face.b':[0,0,0]},'A (open)':{'face.a':[0,0,.8],'face.b':[0,.2,0]},'E (wide)':{'face.a':[0,0,.35],'face.b':[.2,.8,0]},'O (round)':{'face.a':[0,0,.55],'face.b':[0,-.2,.9]},'U (pucker)':{'face.a':[0,0,.2],'face.b':[0,-.6,1],'face.e':[.9,0,0]},'M (closed)':{'face.a':[0,0,0],'face.b':[-.05,-.1,0],'face.e':[.2,0,0]},'F or V':{'face.a':[0,0,.1],'face.b':[.1,.3,0],'face.e':[0,.45,.25]}};
const EYE_PRE={'Center':[0,0,0],'Look left':[.8,0,0],'Look right':[-.8,0,0],'Look up':[0,.8,0],'Look down':[0,-.8,0],'Soft squint':[0,0,.35],'Tight squint':[0,0,.8]};
const FACE_PRE={'Neutral':{},'Happy':{'face.b':[.7,.3,0],'face.c':[.15,.15,0]},'Laugh':{'face.a':[0,0,.55],'face.b':[1,.5,0],'face.c':[.3,.3,0],'face.d':[0,0,.5]},'Surprised':{'face.a':[0,0,.6],'face.b':[0,-.2,.5],'face.c':[1,1,.4]},'Skeptic':{'face.b':[-.15,0,0],'face.c':[0,.9,0],'face.d':[0,0,.25]},'Worried':{'face.b':[-.3,-.1,0],'face.c':[.35,.35,.9]},'Excited':{'face.a':[0,0,.2],'face.b':[.8,.4,0],'face.c':[.5,.5,0]},'Annoyed':{'face.b':[-.45,0,0],'face.c':[-.3,-.3,-.8],'face.d':[0,0,.35]},'Smug':{'face.b':[.5,.1,0],'face.c':[0,.5,0],'face.d':[0,0,.3]},'Sleepy':{'face.a':[.9,.9,0],'face.b':[0,0,0]},
  'Angry':{'face.b':[-.5,.1,0],'face.c':[-.6,-.6,-.9],'face.d':[0,0,.4],'face.g':[0,.5,0],'face.h':[0,0,.5,],'face.i':[-.6,-.6,0]},
  'Sad':{'face.b':[-.5,-.2,0],'face.c':[.2,.2,.9],'face.i':[.8,.8,0],'face.f':[-.4,-.4,0]},
  'Disgust':{'face.b':[-.35,0,0],'face.c':[-.2,-.2,-.4],'face.d':[0,0,.45],'face.h':[0,0,.9],'face.g':[0,0,0]},
  'Fear':{'face.a':[0,0,.35],'face.b':[-.2,.6,0],'face.c':[.8,.8,.7],'face.h':[.9,.9,0],'face.i':[.7,.7,0]},
  'Smirk':{'face.f':[.8,-.1,0],'face.g':[.2,0,0],'face.c':[0,.4,0]},
  'Pout':{'face.b':[-.3,-.4,.6],'face.e':[.8,0,-.3],'face.g':[0,.3,.3]}};
const faceUi={hand:'L',fields:[],hfields:[]};
function faceNode(){ const n=S.sel&&nodes.get(S.sel); return n&&n.userData.rig&&(n.userData.rig.creator||n.userData.rig.mf)?n:null; }
function facePose(n){ const sp=n.userData.spec; return sp.pose||(sp.pose={}); }
function faceCommit(){ const n=faceNode(); if(!n) return; if(S.autokey) addKey(n.userData.id); queueSave(); }
function faceGet(key,i){ const n=faceNode(); const p=n&&n.userData.spec.pose; const e=p&&p[key]; return e?e[i]:0; }
function faceSet(key,i,v){ const n=faceNode(); if(!n) return; const p=facePose(n), e=p[key]||(p[key]=[0,0,0]); e[i]=v; }
function handKey(side,ch){ return 'hand.'+side+'.'+ch; }
function facePaneSync(){ if(faceUi.stat){ const n=faceNode(); faceUi.stat.textContent=n?('Face and hands of '+n.userData.name+'. Move a slider, then Set key at the playhead.'):'Select a rigged character (Character creator, or an imported model after Auto-rig) to animate its face, hands and toes.'; } faceUi.fields.concat(faceUi.hfields).forEach(f=>f.update()); }
function faceApplyMap(map,keys){ const n=faceNode(); if(!n){ toast('Select a Character creator character first.'); return; } const p=facePose(n); keys.forEach(k=>{ p[k]=map[k]?map[k].slice():[0,0,0]; }); facePaneSync(); faceCommit(); }
function handApply(vals,sides){ const n=faceNode(); if(!n){ toast('Select a Character creator character first.'); return; } const p=facePose(n); sides.forEach(s=>{ p[handKey(s,'a')]=[vals[0],vals[1],vals[2]]; p[handKey(s,'b')]=[vals[3],vals[4],vals[5]]; }); rigApply(n); facePaneSync(); faceCommit(); }
function buildFacePane(){
  const host=document.createElement('div'); host.className='pane'; host.id='pFace'; host.hidden=true; $('#pAi').parentNode.appendChild(host);
  const stat=noteEl(''); stat.style.color='var(--fg)'; faceUi.stat=stat;
  faceUi.fields=FACE_CH.map(c=>rangeField(c[0],c[3],c[4],.01,()=>faceGet(c[1],c[2]),v=>faceSet(c[1],c[2],v),v=>v.toFixed(2),faceCommit));
  const exp=document.createElement('div'); exp.className='g2'; Object.keys(FACE_PRE).forEach(k=>exp.appendChild(scBtn(k,()=>faceApplyMap(FACE_PRE[k],['face.a','face.b','face.c','face.d','face.f','face.g','face.h','face.i','face.j']))));
  const mo=document.createElement('div'); mo.className='g2'; Object.keys(MOUTH_PRE).forEach(k=>mo.appendChild(scBtn(k,()=>faceApplyMap(MOUTH_PRE[k],['face.a','face.b','face.e']))));
  const eyes=document.createElement('div'); eyes.className='g2'; Object.keys(EYE_PRE).forEach(k=>eyes.appendChild(scBtn(k,()=>faceApplyMap({'face.d':EYE_PRE[k]},['face.d']))));
  const blink=scBtn('Blink (key closed, then open)',()=>{ const n=faceNode(); if(!n) return; const p=facePose(n), f=Math.round(S.fps*.12)/S.fps, t0=S.t; const a=(p['face.a']||[0,0,0]).slice(); [[t0,0],[t0+f,1],[t0+2*f,0]].forEach(x=>{ p['face.a']=[x[1],x[1],a[2]]; S.t=Math.min(S.duration,x[0]); addKey(n.userData.id); }); S.t=t0; p['face.a']=a; facePaneSync(); queueSave(); },'hi');
  const keyb=scBtn('Set key at playhead',()=>{ const n=faceNode(); if(n){ addKey(n.userData.id); toast('Face and hands keyed at '+S.t.toFixed(2)+' s.'); } },'hi');
  const reset=scBtn('Reset face',()=>faceApplyMap({},['face.a','face.b','face.c','face.d','face.e','face.f','face.g','face.h','face.i','face.j']));
  const side=document.createElement('div'); side.className='g2'; const sb={}; ['L','R','Both'].forEach(s=>{ sb[s]=scBtn(s==='L'?'Left hand':s==='R'?'Right hand':'Both hands',()=>{ faceUi.hand=s; Object.keys(sb).forEach(k=>sb[k].classList.toggle('on',k===s)); facePaneSync(); }); side.appendChild(sb[s]); }); sb.L.classList.add('on');
  const sides=()=>faceUi.hand==='Both'?['L','R']:[faceUi.hand];
  faceUi.hfields=HAND_CH.map(c=>rangeField(c[0],c[0]==='Finger spread'?-1:0,1,.01,()=>{ const s=sides()[0], n=faceNode(), p=n&&n.userData.spec.pose, e=p&&p[handKey(s,c[2])]; return e?e[c[3]]:0; },v=>{ const n=faceNode(); if(!n) return; const p=facePose(n); sides().forEach(s=>{ const e=p[handKey(s,c[2])]||(p[handKey(s,c[2])]=[0,0,0]); e[c[3]]=v; }); rigApply(n); },v=>v.toFixed(2),faceCommit));
  faceUi.hfields.push(rangeField('Toes up (+) or curled (-)',-1,1,.01,()=>{ const s=sides()[0], n=faceNode(), p=n&&n.userData.spec.pose, e=p&&p['toe.'+s]; return e?e[0]:0; },v=>{ const n=faceNode(); if(!n) return; const p=facePose(n); sides().forEach(s=>{ const e=p['toe.'+s]||(p['toe.'+s]=[0,0,0]); e[0]=v; }); },v=>v.toFixed(2),faceCommit));
  const hp=document.createElement('div'); hp.className='g2'; Object.keys(HAND_PRE).forEach(k=>hp.appendChild(scBtn(k,()=>handApply(HAND_PRE[k],sides()))));
  host.append(panel('Face',[stat,exp,keyb,reset].concat([noteEl('Pick an expression, or move the sliders. Voice lip sync and blinks still run on top, and your slider values add to them.')])),
    panel('Face sliders',faceUi.fields.concat([blink])),
    panel('Mouth shapes',[mo,noteEl('Tap a shape to set the mouth, then Set key. Lip pucker and upper/lower lip sliders provide finer control; voice tracks continue to drive speech.')]),
    panel('Eye direction and squint',[eyes,noteEl('Quick gaze presets set horizontal direction, vertical direction and squint. Use the face sliders for finer adjustments.')]),
    panel('Hands and fingers',[side,hp].concat(faceUi.hfields)),
    panel('Export',[scBtn('Export character as .glb (with animation)',()=>exportRigGLB(true),'hi'),scBtn('Export character as .glb (pose only)',()=>exportRigGLB(false)),noteEl('Saves the skeleton, face parts, fingers and your keyframes. Open it in Blender with File, Import, glTF 2.0.')],false));
  try{ const rp=document.getElementById('pRig'); if(rp) rp.appendChild(panel('Export',[scBtn('Export character as .glb (with animation)',()=>exportRigGLB(true),'hi'),scBtn('Export character as .glb (pose only)',()=>exportRigGLB(false))],false)); }catch(e){}
  facePaneSync(); setInterval(()=>{ try{ if(ptab==='face'&&faceUi.last!==S.sel){ faceUi.last=S.sel; facePaneSync(); } }catch(e){} },250);
}
