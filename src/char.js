
/* ================= Character from the reference sheet ================= */
function loadCharacter(){
  toast('Building the character...');
  setTimeout(()=>{ try{ loadCharacterNow(); }catch(err){ const m='Character error: '+((err&&err.message)||err); toast(m); try{ scLog(m); }catch(e){} } },60);
}
function loadCharacterNow(){
  if(S.recording) return;
  S.playing=false; syncPlay(); scEnd();
  loadProject({objs:[],cam:{p:[0,1.25,4.8]},tgt:{p:[0,1,0]},tracks:{},duration:8});
  kochiEnv(false); applyPreset('studio'); setAspect(1.78);
  let seed=7; const rnd=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  const made={};
  const P=(key,name,shape,size,pos,color,detail,strokes,rot)=>{
    const sp=sculptCreate({name:name,shape:shape,size:size,position:pos,color:color,detail:detail});
    const n=nodes.get(sp.id); if(rot) n.rotation.set(rot[0]*Math.PI/180,rot[1]*Math.PI/180,rot[2]*Math.PI/180);
    if(strokes&&strokes.length) scAiStrokes(n,strokes,false);
    n.userData.sc.undo.length=0; made[key]=sp.id; return n;
  };
  const SKIN='#a8734e', OLIVE='#4b4a2b', JEANS='#3f5a86', HAIR='#1b130e';
  P('head','Head','head',[.165,.235,.2],[0,1.585,0],SKIN,'high',[
    {brush:'draw',at:[0,-.5,.5],radius:.4,strength:.2},{brush:'draw',at:[.55,-.05,.7],radius:.25,strength:.2,mirror:true},
    {brush:'draw',at:[0,.55,.8],radius:.35,strength:.15},{brush:'draw',at:[.35,.3,.9],radius:.15,strength:.3,mirror:true},
    {brush:'draw',at:[0,-.42,.92],radius:.1,strength:.25},{brush:'smooth',at:[0,.1,.9],radius:.5,strength:.4}]);
  P('neck','Neck','body',[.11,.15,.11],[0,1.465,0],SKIN,'low');
  const hs=[]; for(let i=0;i<80;i++){
    let x=rnd()*2-1, y=rnd()*1.1-.1, z=rnd()*2-1; const l=Math.hypot(x,y,z)||1; x/=l; y/=l; z/=l;
    hs.push({brush:'draw',at:[x,y,z],radius:.1+rnd()*.12,strength:(i%3===2?-.5:.9)});
  }
  hs.push({brush:'smooth',at:[0,.9,0],radius:.25,strength:.2});
  P('hair','Hair','ball',[.205,.17,.205],[0,1.672,-.022],HAIR,'high',hs);
  P('beard','Beard','ball',[.162,.115,.15],[0,1.508,.02],'#1f1611','medium',[{brush:'draw',at:[0,-.6,.9],radius:.35,strength:.4},{brush:'smooth',at:[0,0,1],radius:.5,strength:.4}]);
  P('torso','Hoodie','body',[.37,.64,.25],[0,1.13,0],OLIVE,'medium',[{brush:'draw',at:[0,-.3,.9],radius:.35,strength:.25},{brush:'smooth',at:[0,0,1],radius:.6,strength:.3}]);
  P('hood','Hood','ball',[.21,.13,.12],[0,1.405,-.075],OLIVE,'low');
  P('armL','Arm left','body',[.105,.56,.105],[-.285,1.1,0],OLIVE,'low',null,[0,0,-4]);
  P('armR','Arm right','body',[.105,.56,.105],[.285,1.1,0],OLIVE,'low',null,[0,0,4]);
  P('handL','Hand left','ball',[.08,.17,.05],[-.318,.785,0],SKIN,'low');
  P('handR','Hand right','ball',[.08,.17,.05],[.318,.785,0],SKIN,'low');
  P('legL','Leg left','body',[.17,.86,.19],[-.095,.48,0],JEANS,'low');
  P('legR','Leg right','body',[.17,.86,.19],[.095,.48,0],JEANS,'low');
  P('shoeL','Shoe left','block',[.105,.085,.27],[-.095,.045,.05],'#d9d4c5','low');
  P('shoeR','Shoe right','block',[.105,.085,.27],[.095,.045,.05],'#d9d4c5','low');
  P('pack','Backpack','block',[.3,.42,.14],[0,1.15,-.19],'#5f7b4b','low',[{brush:'smooth',at:[0,0,-1],radius:.6,strength:.4}]);
  const gp=[
    {shape:'torus',p:[-.035,1.598,.104],s:[.058,.058,.03],color:'#25262a',rough:.4,metal:.6},{shape:'torus',p:[.035,1.598,.104],s:[.058,.058,.03],color:'#25262a',rough:.4,metal:.6},
    {shape:'cylinder',p:[0,1.606,.106],s:[.006,.022,.006],r:[0,0,90],color:'#25262a',rough:.4,metal:.6},
    {shape:'box',p:[-.071,1.6,.05],s:[.004,.004,.1],color:'#25262a',rough:.4,metal:.6},{shape:'box',p:[.071,1.6,.05],s:[.004,.004,.1],color:'#25262a',rough:.4,metal:.6},
    {shape:'sphere',p:[-.035,1.599,.09],s:[.022,.016,.012],color:'#f2efe8',rough:.3},{shape:'sphere',p:[.035,1.599,.09],s:[.022,.016,.012],color:'#f2efe8',rough:.3},
    {shape:'sphere',p:[-.035,1.599,.097],s:[.011,.011,.006],color:'#1a0f0a',rough:.2},{shape:'sphere',p:[.035,1.599,.097],s:[.011,.011,.006],color:'#1a0f0a',rough:.2}];
  addCustom('Glasses and eyes',gp,[0,0,0]);
  orbit.target.set(0,1,0); edit.position.set(2.4,1.5,4.4); orbit.update();
  scGuide.op=.3; scGuideApply();
  const r=SC_REFS[0]; if(r) scGuideFromUrl(r.data,r.name);
  refreshScene(); selectId(made.head); setMode('sculpt'); applyLook();
  photoSet(true); saveNow(); toast('Character blocked out in 17 sculpt parts. Pick a part in the Outliner and refine it.');
}

/* ================= Photo texture projected from the reference sheet ================= */
const PHOTO={on:false,tex:null,loading:false};
const PHOTO_FN='vec3 phSmp(vec2 uv,vec3 base){ vec3 c=texture2D(uPhoto,uv).rgb; float lum=dot(c,vec3(.3,.59,.11)); float sat=max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b)); float bg=(1.0-smoothstep(.04,.09,sat))*smoothstep(.5,.58,lum)*(1.0-smoothstep(.78,.85,lum)); return mix(pow(c,vec3(2.2)),base,bg); }';
const PHOTO_BODY='{ vec3 pn=normalize(vPN); vec3 pw=pow(abs(pn),vec3(4.0)); pw/=(pw.x+pw.y+pw.z+1e-4); float k=585.0; float vv=1.0-(1062.0-vPW.y*k)/1131.0; vec3 b0=diffuseColor.rgb; vec3 cz=(pn.z>=0.0)?phSmp(vec2((742.0+vPW.x*k)/2000.0,vv),b0):phSmp(vec2((1783.0-vPW.x*k)/2000.0,vv),b0); vec3 cx=phSmp(vec2((1448.0-vPW.z*k)/2000.0,vv),b0); diffuseColor.rgb=cz*pw.z+cx*pw.x+b0*pw.y; }';
function photoPatch(m,tex){
  m.userData.photoU={value:tex};
  m.onBeforeCompile=sh=>{
    sh.uniforms.uPhoto=m.userData.photoU;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vPW;\nvarying vec3 vPN;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPW=(modelMatrix*vec4(transformed,1.0)).xyz;\nvPN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vPW;\nvarying vec3 vPN;\nuniform sampler2D uPhoto;\n'+PHOTO_FN).replace('#include <map_fragment>','#include <map_fragment>\n'+PHOTO_BODY);
  };
  m.customProgramCacheKey=()=>'photo1'; m.needsUpdate=true;
}
function photoSet(on){
  const go=()=>{
    PHOTO.on=on;
    order.forEach(id=>{
      const n=nodes.get(id), sc=n&&n.userData&&n.userData.sc; if(!sc) return; const m=sc.mesh.material;
      if(on) photoPatch(m,PHOTO.tex); else { m.onBeforeCompile=()=>{}; m.customProgramCacheKey=()=>'plain'; m.needsUpdate=true; }
    });
  };
  if(!on||PHOTO.tex){ go(); return; }
  const r=SC_REFS[0]; if(!r){ toast('No reference photo is bundled.'); return; }
  if(PHOTO.loading) return; PHOTO.loading=true;
  try{
    const bin=atob(r.data.slice(r.data.indexOf(',')+1)), u=new Uint8Array(bin.length); for(let k=0;k<bin.length;k++) u[k]=bin.charCodeAt(k);
    const url=URL.createObjectURL(new Blob([u],{type:'image/jpeg'})), im=new Image();
    im.onload=()=>{ const t=new THREE.Texture(im); t.anisotropy=4; t.needsUpdate=true; PHOTO.tex=t; PHOTO.loading=false; go(); };
    im.onerror=()=>{ PHOTO.loading=false; toast('Could not load the reference photo.'); };
    im.src=url;
  }catch(e){ PHOTO.loading=false; toast('Could not load the reference photo.'); }
}

function loadRealCharacter(){
  if(S.recording) return;
  S.playing=false; syncPlay(); scEnd();
  loadProject({objs:[],cam:{p:[0,1.3,4.6]},tgt:{p:[0,.95,0]},tracks:{},duration:8});
  kochiEnv(false); applyPreset('studio'); setAspect(1.78);
  const sp=addEmbedded(0); if(!sp){ toast('The realistic character is not bundled in this build.'); return; }
  orbit.target.set(0,.95,0); edit.position.set(2.2,1.5,4.2); orbit.update();
  refreshScene(); selectId(sp.id); applyLook(); saveNow();
  toast('Realistic character loaded. Orbit with one finger, pinch to zoom.');
}

function loadBundledCharacter(idx,label){
  if(S.recording) return;
  S.playing=false; syncPlay(); scEnd();
  loadProject({objs:[],cam:{p:[0,1.3,4.6]},tgt:{p:[0,.95,0]},tracks:{},duration:8});
  kochiEnv(false); applyPreset('studio'); setAspect(1.78);
  const sp=addEmbedded(idx); if(!sp){ toast(label+' is not bundled in this build.'); return; }
  orbit.target.set(0,.95,0); edit.position.set(2.2,1.5,4.2); orbit.update();
  refreshScene(); selectId(sp.id); applyLook(); saveNow();
  toast(label+' loaded. He is rigged, so open the Rig tab to pose him or make him walk.');
}
function loadStany(){ loadBundledCharacter(1,'Stany'); }

function loadRenjith(){ loadBundledCharacter(2,'Renjith'); }
function loadHashir(){ loadBundledCharacter(3,'Hashir'); }
function loadFriends(){
  if(S.recording) return;
  S.playing=false; syncPlay(); scEnd();
  loadProject({objs:[],cam:{p:[0,1.3,6.2]},tgt:{p:[0,.95,0]},tracks:{},duration:8});
  kochiEnv(false); applyPreset('studio'); setAspect(1.78);
  const xs=[-1.9,-.65,.65,1.9]; let first=null;
  [1,2,0,3].forEach((idx,i)=>{ const sp=addEmbedded(idx,{p:[xs[i],0,0],r:[0,0,0]}); if(!first) first=sp; });
  orbit.target.set(0,.95,0); edit.position.set(2.6,1.6,6.4); orbit.update();
  refreshScene(); if(first) selectId(first.id); applyLook(); saveNow();
  toast('The four friends loaded: Stany, Renjith, Jesvin, Hashir. All are rigged.');
}
