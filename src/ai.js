
/* ---------- procedural models from parts ---------- */
const UNIT={};
function unitGeo(shape){
  if(UNIT[shape]) return UNIT[shape];
  let g;
  switch(shape){
    case 'sphere': g=new THREE.SphereGeometry(.5,24,16); break;
    case 'cylinder': g=new THREE.CylinderGeometry(.5,.5,1,24); break;
    case 'cone': g=new THREE.CylinderGeometry(0,.5,1,24); break;
    case 'torus': g=new THREE.TorusGeometry(.35,.15,12,32); break;
    case 'prism': { const sh=new THREE.Shape(); sh.moveTo(-.5,-.5); sh.lineTo(.5,-.5); sh.lineTo(0,.5); sh.closePath(); g=new THREE.ExtrudeGeometry(sh,{depth:1,bevelEnabled:false}); g.translate(0,0,-.5); break; }
    default: g=new THREE.BoxGeometry(1,1,1);
  }
  UNIT[shape]=g; return g;
}
const SHAPES=['box','sphere','cylinder','cone','torus','prism'];
function cleanParts(raw){
  if(!Array.isArray(raw)) throw new Error('parts must be a list');
  const num=(v,d,lo,hi)=>{ v=+v; return isFinite(v)?clamp(v,lo,hi):d; };
  const vec=(a,d,lo,hi)=>[0,1,2].map(i=>num(a&&a[i],d[i],lo,hi));
  const hex=c=>(typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c))?c:'#8a8478';
  return raw.slice(0,4000).filter(p=>p&&typeof p==='object').map(p=>({
    shape:SHAPES.indexOf(p.shape)>=0?p.shape:'box', p:vec(p.p,[0,0,0],-500,500), s:vec(p.s,[1,1,1],.01,300), r:vec(p.r,[0,0,0],-360,360),
    color:hex(p.color), rough:num(p.rough,.7,0,1), metal:num(p.metal,0,0,1), glow:!!p.glow, tex:TEXN.indexOf(p.tex)>=0?p.tex:'', ns:!!p.ns }));
}
function buildParts(parts){
  const g=new THREE.Group();
  if(parts.length<24){
    parts.forEach(pt=>{
      const mat=partMat(pt);
      const m=new THREE.Mesh(unitGeo(pt.shape),mat);
      m.position.fromArray(pt.p); m.scale.fromArray(pt.s); m.rotation.set(pt.r[0]*Math.PI/180,pt.r[1]*Math.PI/180,pt.r[2]*Math.PI/180);
      m.castShadow=!pt.glow&&!pt.ns&&pt.tex!=='water'&&pt.tex!=='net'&&Math.max(pt.s[0],pt.s[1],pt.s[2])>.35; m.receiveShadow=true; if(TEXCFG[pt.tex]&&TEXCFG[pt.tex].alpha&&pt.tex!=='net') m.customDepthMaterial=leafDepth(pt.tex); g.add(m);
    });
    return g;
  }
  /* many parts: merge into one mesh per material and shadow mode, so big scenes stay fast */
  const groups=new Map(), M4=new THREE.Matrix4(), Q=new THREE.Quaternion(), E=new THREE.Euler(), P=new THREE.Vector3(), Sv=new THREE.Vector3(), N3=new THREE.Matrix3(), v=new THREE.Vector3();
  parts.forEach(pt=>{ const mat=partMat(pt), cs=!pt.glow&&!pt.ns&&pt.tex!=='water'&&pt.tex!=='net'&&Math.max(pt.s[0],pt.s[1],pt.s[2])>.35, key=mat.uuid+(cs?'1':'0'); let G=groups.get(key); if(!G){ G={mat:mat,cs:cs,tex:pt.tex,list:[]}; groups.set(key,G); } G.list.push(pt); });
  groups.forEach(G=>{
    let nv=0,ni=0; G.list.forEach(pt=>{ const u=unitGeo(pt.shape); nv+=u.attributes.position.count; ni+=u.index?u.index.count:u.attributes.position.count; });
    const pos=new Float32Array(nv*3), nor=new Float32Array(nv*3), idx=nv>65535?new Uint32Array(ni):new Uint16Array(ni); let ov=0, oi=0;
    G.list.forEach(pt=>{ const u=unitGeo(pt.shape), pa=u.attributes.position, na=u.attributes.normal;
      E.set(pt.r[0]*Math.PI/180,pt.r[1]*Math.PI/180,pt.r[2]*Math.PI/180); Q.setFromEuler(E); M4.compose(P.fromArray(pt.p),Q,Sv.fromArray(pt.s)); N3.getNormalMatrix(M4);
      for(let k=0;k<pa.count;k++){ v.fromBufferAttribute(pa,k).applyMatrix4(M4); pos[(ov+k)*3]=v.x; pos[(ov+k)*3+1]=v.y; pos[(ov+k)*3+2]=v.z; v.fromBufferAttribute(na,k).applyMatrix3(N3).normalize(); nor[(ov+k)*3]=v.x; nor[(ov+k)*3+1]=v.y; nor[(ov+k)*3+2]=v.z; }
      if(u.index){ const ia=u.index.array; for(let k=0;k<ia.length;k++) idx[oi+k]=ia[k]+ov; oi+=ia.length; } else { for(let k=0;k<pa.count;k++) idx[oi+k]=ov+k; oi+=pa.count; }
      ov+=pa.count; });
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.BufferAttribute(nor,3)); geo.setIndex(new THREE.BufferAttribute(idx,1)); geo.computeBoundingSphere();
    const m=new THREE.Mesh(geo,G.mat); m.castShadow=G.cs; m.receiveShadow=true; m.userData.merged=true; if(TEXCFG[G.tex]&&TEXCFG[G.tex].alpha&&G.tex!=='net') m.customDepthMaterial=leafDepth(G.tex); g.add(m); });
  return g;
}
function addCustom(name,parts,pos){
  const clean=cleanParts(parts); if(!clean.length) throw new Error('no usable parts');
  const sp=mkSpec('custom',{name:String(name||'AI model').slice(0,40),parts:clean,
    p:Array.isArray(pos)&&pos.length>=3?[+pos[0]||0,+pos[1]||0,+pos[2]||0]:[orbit.target.x+(Math.random()-.5)*2,0,orbit.target.z+(Math.random()-.5)*2]});
  addNode(sp); return sp;
}
function parseModelJson(text){
  let t=String(text||'').trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
  const a=t.indexOf('{'), b=t.lastIndexOf('}'), a2=t.indexOf('['), b2=t.lastIndexOf(']');
  let o;
  try{ o=JSON.parse(t); }catch(err){
    if(a>=0&&b>a){ try{ o=JSON.parse(t.slice(a,b+1)); }catch(e2){} }
    if(!o&&a2>=0&&b2>a2){ try{ o=JSON.parse(t.slice(a2,b2+1)); }catch(e3){} }
  }
  if(!o) throw new Error('That is not valid JSON.');
  if(Array.isArray(o)) o={parts:o};
  if(!Array.isArray(o.parts)) throw new Error('Expected a "parts" list.');
  return {name:String(o.name||'AI model').slice(0,40),parts:o.parts};
}
const MODEL_PROMPT='You are a 3D modeling assistant. Build the object I describe from simple primitives and reply with ONLY JSON (no prose, no code fences) in this shape: {"name":"...","parts":[{"shape":"box|sphere|cylinder|cone|torus|prism","p":[x,y,z],"s":[sx,sy,sz],"r":[rx,ry,rz],"color":"#rrggbb","rough":0.7,"metal":0,"glow":false,"tex":""}]}. Units are meters and Y is up. The model stands on y=0 and is centered on x and z. "p" is the part center, "s" is the part full size in meters (a sphere or cylinder has diameter s[0] and s[2], height s[1]), "r" is rotation in degrees. "prism" is a triangle extruded along Z (width s[0], height s[1], length s[2]) and is ideal for gable roofs. Optional "tex" adds a realistic surface pattern: plaster, cobble, tile, bark, wood, stone or leaf (leaf makes see-through foliage), leave empty for plain paint. Use 60 to 200 parts, model real construction details (frames, trims, hinges, ropes, planks), and vary colors and roughness. The object I want: ';

/* ---------- GLB import ---------- */
function adoptNode(spec,obj){
  obj.userData.id=spec.id; obj.userData.name=spec.name; obj.userData.type=spec.type; obj.userData.spec=spec;
  obj.position.fromArray(spec.p); obj.rotation.set(spec.r[0],spec.r[1],spec.r[2]); obj.scale.fromArray(spec.s);
  scene.add(obj); nodes.set(spec.id,obj); order.push(spec.id); return obj;
}
function openGlb(){ showTab('ai'); toast('Tap the Import GLB model button in this tab.'); }
function importGlb(file){
  if(!THREE.GLTFLoader){ toast('The model loader did not load. Reload the page.'); return; }
  if(file.size>60*1048576){ toast('That file is over 60 MB. Try a smaller model.'); return; }
  if(!/\.glb$/i.test(file.name||'')){ toast('Choose a .glb file. Other model formats are not supported yet.'); return; }
  const fr=new FileReader();
  fr.onerror=()=>toast('Could not read that file.');
  fr.onload=()=>{
    const buf=fr.result, magic=new Uint8Array(buf.slice(0,4));
    if(String.fromCharCode(magic[0],magic[1],magic[2],magic[3])!=='glTF'){ toast('That file is not a valid GLB model.'); return; }
    toast('Loading '+file.name+'...');
    try{ new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{ adoptGlb(gltf,file.name); }catch(e){ toast('Could not add the model: '+((e&&e.message)||'error')); } },e=>toast('This model could not be loaded: '+((e&&e.message)||'it may use compression'))); }
    catch(err){ toast('This model could not be loaded: '+((err&&err.message)||'error')); }
  };
  fr.readAsArrayBuffer(file);
}
function adoptGlb(gltf,fname,o){
  o=o||{};
  const model=gltf.scene, box=new THREE.Box3().setFromObject(model), size=box.getSize(new THREE.Vector3()), c=box.getCenter(new THREE.Vector3());
  const k=(o.size||2.2)/(Math.max(size.x,size.y,size.z)||1);
  model.scale.setScalar(k); model.position.set(-c.x*k,-box.min.y*k,-c.z*k);
  model.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
  const g=new THREE.Group(); g.add(model);
  const sp=mkSpec('glb',{name:fname.replace(/\.glb$/i,'').slice(0,32)||'Imported model',transient:true,p:o.p||[orbit.target.x,0,orbit.target.z],r:o.r||[0,0,0]});
  adoptNode(sp,g);
  let msg='Imported '+sp.name+'. It is not saved when you reload.';
  if(gltf.animations&&gltf.animations.length){ const mx=new THREE.AnimationMixer(model); mx.clipAction(gltf.animations[0]).play(); g.userData.mixer=mx; msg+=' Its animation follows the timeline.'; }
  if(o.quiet) return;
  selectId(sp.id); renderTimeline(); toast(msg);
}
$('#glbIn').addEventListener('change',e=>{ const f=e.target.files&&e.target.files[0]; if(f) importGlb(f); });

/* ---------- Claude assistant ---------- */
const r2=v=>Math.round(v*100)/100;
function findId(name){
  const q=String(name||'').trim().toLowerCase(); let id=null;
  order.forEach(i=>{ const n=nodes.get(i); if(id==null&&n&&n.userData.name.toLowerCase()===q) id=i; });
  if(id==null) order.forEach(i=>{ const n=nodes.get(i); if(id==null&&n&&n.userData.name.toLowerCase().indexOf(q)>=0) id=i; });
  if(id==null) throw new Error('No object named "'+name+'". Call get_scene to see the names.');
  return id;
}
function infoOf(id){
  const n=nodes.get(id);
  return {name:n.userData.name,type:n.userData.type,position:n.position.toArray().map(r2),rotation_deg:[n.rotation.x,n.rotation.y,n.rotation.z].map(x=>r2(x*180/Math.PI)),
    scale:n.scale.toArray().map(r2),keyframe_times_seconds:(S.tracks[id]||[]).map(k=>k.t)};
}
function keyAt(id,t,o){
  const n=nodes.get(id), tt=+clamp(+t||0,0,S.duration).toFixed(3), sm=sampleTrack(id,tt);
  const vec3=(a,d)=>(Array.isArray(a)&&a.length>=3&&a.every(x=>isFinite(+x)))?a.slice(0,3).map(Number):d;
  const k={t:tt,p:vec3(o.position,sm?sm.p:n.position.toArray())};
  if(id==='cam') k.f=(o.fov!=null&&isFinite(+o.fov))?clamp(+o.fov,12,90):(sm&&sm.f!=null?sm.f:look.fov);
  else if(id!=='tgt'){
    const rd=vec3(o.rotation_deg,null);
    k.r=rd?rd.map(d=>d*Math.PI/180):(sm&&sm.r?sm.r:[n.rotation.x,n.rotation.y,n.rotation.z]);
    k.s=vec3(o.scale,sm&&sm.s?sm.s:n.scale.toArray()).map(v=>Math.max(.01,v));
  }
  const ks=S.tracks[id]||(S.tracks[id]=[]), ex=ks.findIndex(x=>Math.abs(x.t-tt)<.5/S.fps);
  if(ex>=0) ks[ex]=k; else { ks.push(k); ks.sort((a,b)=>a.t-b.t); }
  return k;
}
const LOOK_MAP={sun_azimuth:['az',0,360],sun_elevation:['el',-5,70],sun_strength:['sun',0,8],exposure:['exposure',.3,2.5],haze:['fog',0,.08],
  glow:['bloom',0,1.5],depth_of_field:['dof',0,1],focus_distance:['focus',1,40],vignette:['vignette',0,1],film_grain:['grain',0,.25],lens_fov:['fov',12,90]};
let aiLines=[], aiText='', aiBusy=false, aiAbort=null, sampleCap;
const aiLog=()=>$('#aiLog');
function renderAiLog(){ const el=aiLog(); if(!el) return; el.textContent=aiLines.concat(aiText?['',aiText]:[]).join('\n'); el.scrollTop=el.scrollHeight; }
function logAi(line){ aiLines.push(line); renderAiLog(); }
function refreshScene(){ applyTracks(S.t); renderTimeline(); renderOutliner(); renderProps(); queueSave(); }
const ob=(props,req)=>({type:'object',properties:props,required:req||[]});
const V3={type:'array',items:{type:'number'},minItems:3,maxItems:3};
function aiTools(){
  const T=[
    {name:'build_scene',description:'Build a whole scene from ready-made detailed assets laid out like a picture. '+SCENE_RULES+SCENE_CATALOG+' Replaces the current objects unless clear is false. Also sets lighting (environment) and the starting camera.',
      inputSchema:ob({environment:{type:'string',enum:['day','golden','overcast','night','studio']},clear:{type:'boolean'},
        camera:ob({p:V3,target:V3,fov:{type:'number'}}),
        objects:{type:'array',items:ob({asset:{type:'string',enum:Object.keys(ASSETS)},p:V3,ry:{type:'number'},s:{type:'number'},params:{type:'object'},name:{type:'string'}},['asset','p'])}},['objects']),
      execute:i=>{ const r=buildScene(i); logAi('+ scene: '+r.built+' objects'+(r.skipped.length?' (skipped: '+r.skipped.join(', ')+')':'')); return r; }},
    {name:'get_scene',description:'List every object with its name, type, position, rotation in degrees, scale and keyframe times, plus the timeline length and look settings.',inputSchema:ob({}),
      execute:()=>({duration_seconds:S.duration,fps:S.fps,look:{preset:look.preset,sun_azimuth:look.az,sun_elevation:look.el,exposure:look.exposure,haze:look.fog,glow:look.bloom,depth_of_field:look.dof,focus_distance:look.focus,lens_fov:look.fov},objects:order.map(infoOf)})},
    {name:'add_model',description:'Add a new model built from 60 to 200 primitive parts. Units are meters, Y up, base at y=0 centered on x and z. Each part: shape (box, sphere, cylinder, cone, torus, prism: a triangle extruded along Z, good for gable roofs), p center [x,y,z], s full size [x,y,z] in meters, r rotation in degrees [x,y,z], color "#rrggbb", rough 0-1, metal 0-1, glow true for lights, tex optional surface pattern (plaster, cobble, tile, bark, wood, stone, leaf). position places the whole model.',
      inputSchema:ob({name:{type:'string'},position:V3,parts:{type:'array',items:ob({shape:{type:'string',enum:SHAPES},p:V3,s:V3,r:V3,color:{type:'string'},rough:{type:'number'},metal:{type:'number'},glow:{type:'boolean'},tex:{type:'string',enum:TEXN}},['shape','p','s'])}},['name','parts']),
      execute:i=>{ const sp=addCustom(i.name,i.parts,i.position); refreshScene(); logAi('+ model: '+sp.name+' ('+sp.parts.length+' parts)'); return {added:sp.name,parts:sp.parts.length}; }},
    {name:'add_primitive',description:'Add a ready-made object: figure, box, sphere, cylinder, rock or light.',
      inputSchema:ob({type:{type:'string',enum:ADDABLE},name:{type:'string'},position:V3,color:{type:'string'}},['type']),
      execute:i=>{ if(ADDABLE.indexOf(i.type)<0) throw new Error('Unknown type'); const o={}; if(i.name) o.name=String(i.name).slice(0,40);
        if(Array.isArray(i.position)&&i.position.length>=3) o.p=i.position.slice(0,3).map(Number); if(/^#[0-9a-f]{6}$/i.test(i.color||'')) o.color=i.color;
        const sp=mkSpec(i.type,o); addNode(sp); refreshScene(); logAi('+ '+TYPES[i.type]+': '+sp.name); return {added:sp.name}; }},
    {name:'set_transform',description:'Move, rotate or scale an object right now without a keyframe. Works on Camera and Camera Target (position only).',
      inputSchema:ob({name:{type:'string'},position:V3,rotation_deg:V3,scale:V3},['name']),
      execute:i=>{ const id=findId(i.name), n=nodes.get(id);
        if(Array.isArray(i.position)&&i.position.length>=3) n.position.fromArray(i.position.slice(0,3).map(Number));
        if(id!=='cam'&&id!=='tgt'){ if(Array.isArray(i.rotation_deg)&&i.rotation_deg.length>=3) n.rotation.set(...i.rotation_deg.slice(0,3).map(d=>d*Math.PI/180));
          if(Array.isArray(i.scale)&&i.scale.length>=3) n.scale.fromArray(i.scale.slice(0,3).map(v=>Math.max(.01,+v))); }
        refreshScene(); logAi('~ moved '+n.userData.name); return infoOf(id); }},
    {name:'keyframe',description:'Write a keyframe for an object at a time in seconds. Give the pose to hold at that time (position, rotation_deg, scale; fov for the Camera). Anything omitted keeps the animated value at that time. Objects need two or more keyframes to move. Camera and Camera Target need three or more for a smooth curve.',
      inputSchema:ob({name:{type:'string'},time_seconds:{type:'number'},position:V3,rotation_deg:V3,scale:V3,fov:{type:'number'}},['name','time_seconds']),
      execute:i=>{ const id=findId(i.name), k=keyAt(id,i.time_seconds,i); refreshScene(); logAi('◆ key '+nodes.get(id).userData.name+' @ '+k.t+'s'); return {key_time:k.t}; }},
    {name:'clear_keyframes',description:'Remove all keyframes from one object.',inputSchema:ob({name:{type:'string'}},['name']),
      execute:i=>{ const id=findId(i.name); delete S.tracks[id]; refreshScene(); logAi('- cleared keys: '+nodes.get(id).userData.name); return {cleared:true}; }},
    {name:'delete_object',description:'Delete an object by name. The Camera and Camera Target cannot be deleted.',inputSchema:ob({name:{type:'string'}},['name']),
      execute:i=>{ const id=findId(i.name); if(id==='cam'||id==='tgt') throw new Error('The camera cannot be deleted.'); const nm=nodes.get(id).userData.name; removeNode(id); refreshScene(); logAi('- deleted '+nm); return {deleted:nm}; }},
    {name:'set_look',description:'Change lighting and lens. preset is golden, overcast, night or studio (sets sun, exposure, glow and haze first). The other fields override: sun_azimuth 0-360, sun_elevation -5-70, sun_strength 0-8, exposure 0.3-2.5, haze 0-0.08, glow 0-1.5, depth_of_field 0-1, focus_distance 1-40, vignette 0-1, film_grain 0-0.25, lens_fov 12-90.',
      inputSchema:ob({preset:{type:'string',enum:Object.keys(PRESETS)},sun_azimuth:{type:'number'},sun_elevation:{type:'number'},sun_strength:{type:'number'},exposure:{type:'number'},haze:{type:'number'},glow:{type:'number'},depth_of_field:{type:'number'},focus_distance:{type:'number'},vignette:{type:'number'},film_grain:{type:'number'},lens_fov:{type:'number'}}),
      execute:i=>{ if(i.preset&&PRESETS[i.preset]) applyPreset(i.preset);
        Object.keys(LOOK_MAP).forEach(k=>{ if(i[k]!=null&&isFinite(+i[k])){ const m=LOOK_MAP[k]; look[m[0]]=clamp(+i[k],m[1],m[2]); } });
        applyLook(); refreshLook(); markPreset(); queueSave(); logAi('☀ look updated'); return {preset:look.preset}; }},
    {name:'set_duration',description:'Set the timeline length in seconds, 1 to 60.',inputSchema:ob({seconds:{type:'number'}},['seconds']),
      execute:i=>{ S.duration=clamp(Math.round((+i.seconds||8)*S.fps)/S.fps,1,60); S.t=Math.min(S.t,S.duration); refreshScene(); logAi('timeline: '+S.duration+' s'); return {duration_seconds:S.duration}; }}
  ];
  T.splice(3,0,sculptToolDef()); T.splice(4,0,rigToolDef(),walkToolDef(),rigModelToolDef());
  return T;
}
const AI_HEAD='You are the 3D modeling and animation assistant inside Slate Studio, a browser tool for cinematic shots. Use the tools to change the scene. When the request or an attached image shows a whole place or scene (street, harbour, village, landscape), call build_scene once with every object placed to match the picture, because it uses detailed ready-made trees, buildings, boats, water, ground and props; use add_model for a single hard-surface object (furniture, vehicle, tool, building) and sculpt_model for an organic one (a head, person, animal, creature, rock, terrain): it starts from a clay base shape and applies brush strokes. Units are meters, Y is up, the ground is y=0. Call get_scene first when you need existing names or positions. To model something new, call add_model with 60 to 200 small parts so it reads as a real object, with believable proportions and varied colors and roughness. To animate, call keyframe with times in seconds inside the timeline (8 s by default). Keep camera moves slow and motivated, and give the Camera and Camera Target three or more keyframes. When you finish, reply with one or two plain sentences about what you made or changed. The request: ';
async function getSample(){
  if(sampleCap!==undefined) return sampleCap;
  try{ sampleCap=(window.claude&&window.claude.use)?await window.claude.use('sample'):null; }catch(err){ sampleCap=null; }
  return sampleCap;
}
let aiAtt=[];
const IMG_OK=['image/jpeg','image/png','image/webp','image/gif'];
const IMG_NOTE='The attached image(s) are references for what to build. If the image shows a place or scene, call build_scene with ready-made assets laid out like the picture. '+SCENE_RULES+SCENE_CATALOG+' If it shows a hard-surface single object (furniture, vehicle, tool, building), use add_model; if it shows an organic subject (a head, person, animal, creature, rock, terrain), use sculpt_model. Study the shapes, proportions, colors and materials. Pick a believable real-world scale and build it with 60 to 200 parts, matching the main silhouette first and then the details. If an image is a sketch, floor plan or blueprint, follow its layout. If several images show different sides, combine them. This is an approximation from simple shapes, not a scan. ';
function renderAtt(){
  const box=$('#aiAtt'); if(!box) return; box.innerHTML='';
  aiAtt.forEach((a,i)=>{
    const c=document.createElement('div'); c.className='att';
    if(a.kind==='image'&&a.url){ const im=document.createElement('img'); im.src=a.url; im.alt=a.name; c.appendChild(im); }
    const nm=document.createElement('span'); nm.textContent=a.name; c.appendChild(nm);
    const x=document.createElement('button'); x.type='button'; x.textContent='\u00d7'; x.setAttribute('aria-label','Remove '+a.name);
    x.addEventListener('click',()=>{ if(a.url){ try{ URL.revokeObjectURL(a.url); }catch(e){} } aiAtt.splice(i,1); renderAtt(); });
    c.appendChild(x); box.appendChild(c);
  });
}
function toJpeg(f){
  return new Promise((res,rej)=>{
    const u=URL.createObjectURL(f), im=new Image();
    im.onload=()=>{
      try{
        const m=1600, k=Math.min(1,m/Math.max(im.naturalWidth,im.naturalHeight)), w=Math.max(1,Math.round(im.naturalWidth*k)), h=Math.max(1,Math.round(im.naturalHeight*k));
        const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.drawImage(im,0,0,w,h);
        c.toBlob(b=>{ URL.revokeObjectURL(u); b?res(b):rej(new Error('blob')); },'image/jpeg',.88);
      }catch(e){ rej(e); }
    };
    im.onerror=()=>{ URL.revokeObjectURL(u); rej(new Error('decode')); };
    im.src=u;
  });
}
function addAttachments(list){
  Array.from(list||[]).forEach(f=>{
    if(aiAtt.length>=8){ toast('Up to 8 attachments.'); return; }
    if(/^image\//.test(f.type)||/\.(jpe?g|png|webp|gif|heic|heif|bmp|avif)$/i.test(f.name||'')){
      toast('Preparing image...');
      toJpeg(f).then(b=>{ let url=''; try{ url=URL.createObjectURL(b); }catch(e){} aiAtt.push({kind:'image',file:b,name:(f.name||'image').replace(/\.[^.]*$/,'')+'.jpg',url:url}); renderAtt(); })
        .catch(()=>toast('This image could not be read. Try a screenshot or a JPG or PNG.'));
    }
    else if(/\.(txt|md|json|csv)$/i.test(f.name||'')||/^text\//.test(f.type)||f.type==='application/json'){
      if(f.size>40000){ toast((f.name||'That file')+' is over 40 KB. Paste the relevant part instead.'); return; }
      const fr=new FileReader(); fr.onload=()=>{ aiAtt.push({kind:'text',name:f.name||'file',text:String(fr.result||'')}); renderAtt(); }; fr.readAsText(f);
    } else toast('Attach photos or images, or TXT, MD, JSON or CSV files. For 3D models use Import GLB.');
  });
  renderAtt();
}
function aiStatus(t){ const el=$('#aiStat'); if(el) el.textContent=t||''; }
function aiErrorText(err){
  const c=err&&err.code;
  if(c==='no_claude') return 'Claude is not available in this view. Open this page from its card inside the Claude app, not as a plain browser tab.';
  if(c==='not_granted') return window.slateStandalone?((err&&err.message)||'Add your Claude API key from the File menu (Claude API key).'):'Claude access is blocked for this page. Tap Claude permissions in this tab and allow it, or reload and tap Allow when asked. It only works when this page is open inside the Claude app and you are signed in.';
  if(c==='sampling_disabled') return 'Claude is not available for this account.';
  if(c==='rate_limited') return 'Too many requests, or your Claude usage limit was reached. Try again later.';
  if(c==='session_expired') return 'Sign in to Claude again, then retry.';
  if(c==='empty_completion') return 'Claude returned nothing. Try a simpler request.';
  if(c==='tools_unavailable') return 'This Claude app version cannot run scene tools. Update the app.';
  if(c==='invalid_request') return 'The request was rejected: '+(err.message||'invalid request');
  if(err instanceof Error) return err.message;
  return 'Something went wrong ('+(c||'error')+'). Try again.';
}
async function askClaude(){
  const btn=$('#aiGo');
  if(aiBusy){ if(aiAbort) aiAbort.abort(); return; }
  const text=$('#aiPrompt').value.trim();
  const imgs=aiAtt.filter(a=>a.kind==='image').map(a=>a.file), txts=aiAtt.filter(a=>a.kind==='text');
  if(!text&&!aiAtt.length){ toast('Describe what to model or animate, or attach an image.'); return; }
  let req=text||'Model what is shown in the attached image or files.';
  txts.forEach(t=>{ req+='\n\n--- attached file: '+t.name+' ---\n'+t.text.slice(0,40000)+'\n--- end of file ---'; });
  const imgNote=imgs.length?IMG_NOTE:'';
  aiLines=[]; aiText=''; renderAiLog();
  aiBusy=true; aiAbort=new AbortController(); btn.textContent='Stop'; aiStatus('Connecting to Claude...');
  try{
    btn.scrollIntoView({block:'nearest'});
    const sample=await getSample();
    if(!sample) throw {code:'no_claude'};
    if(aiAbort.signal.aborted) throw {code:'cancelled'};
    let lim={}; try{ lim=await sample.limits(); }catch(e){ lim={}; }
    aiStatus('Thinking... Claude may ask for your permission the first time.');
    const opts={signal:aiAbort.signal,modelTier:$('#aiTier').value,onText:o=>{ aiStatus('Writing...'); aiText=o.text||''; renderAiLog(); }};
    if(imgs.length){
      const L=lim&&lim.images;
      if(!L) throw new Error('This Claude app cannot send images yet. Update the app, or remove the images.');
      const use=imgs.filter(f=>L.mediaTypes.indexOf(f.type)>=0&&f.size<=L.maxInputBytes).slice(0,L.maxCount);
      if(!use.length) throw new Error('None of the images fit the limits (type, size or count).');
      if(use.length<imgs.length) toast('Some images were skipped (type, size or count limit).');
      opts.images=use; aiStatus('Looking at the image and thinking...');
    }
    let res;
    if(lim&&lim.tools){
      res=await sample(AI_HEAD.replace(/The request: $/,'')+imgNote+'The request: '+req,Object.assign({tools:aiTools().slice(0,Math.max(1,lim.tools.maxCount||9))},opts));
      if(res&&res.text&&!aiText) aiText=res.text;
    } else {
      logAi('This Claude app cannot let Claude edit the scene directly, so it builds one model instead.');
      res=await sample(MODEL_PROMPT+imgNote+req,opts);
      const m=parseModelJson(res.text), sp=addCustom(m.name,m.parts); selectId(sp.id); aiText='Added '+sp.name+' ('+sp.parts.length+' parts).';
    }
    renderAiLog(); aiStatus('Done.'); toast('Claude finished.');
  }catch(err){
    if((aiAbort&&aiAbort.signal.aborted)||(err&&err.code==='cancelled')){ aiStatus('Stopped.'); logAi('Stopped.'); }
    else { const msg=aiErrorText(err); aiStatus(msg); logAi(msg); toast(msg); }
  }finally{
    aiBusy=false; aiAbort=null; btn.textContent='Ask Claude'; refreshScene();
  }
}
function copyText(t){
  const fallback=()=>{ const el=aiLog(); if(!el) return; el.textContent=t; const r=document.createRange(); r.selectNodeContents(el); const s=getSelection(); s.removeAllRanges(); s.addRange(r); toast('Select and copy the prompt shown in the log.'); };
  try{ navigator.clipboard.writeText(t).then(()=>toast('Prompt copied. Paste it into ChatGPT.'),fallback); }catch(err){ fallback(); }
}
const AI_IDEAS=['Build a small stone watchtower with a glowing window','Orbit the camera around the monolith over 8 seconds, ending on the glowing orb','Make it a moonlit night and add two lamp posts along the path'];
function filePick(text,accept,multiple,onFiles){
  const lab=document.createElement('label'); lab.className='pbtn fpick'; lab.textContent=text;
  const inp=document.createElement('input'); inp.type='file'; if(accept) inp.accept=accept; inp.multiple=!!multiple;
  inp.addEventListener('change',()=>{ const fs=Array.from(inp.files||[]); if(fs.length) onFiles(fs); try{ inp.value=''; }catch(e){} });
  lab.appendChild(inp); return lab;
}
function buildAiPane(){
  const ta=document.createElement('textarea'); ta.className='ta'; ta.id='aiPrompt'; ta.placeholder='Describe a model or a camera move, or attach an image'; ta.setAttribute('aria-label','Ask Claude');
  const chips=document.createElement('div'); chips.className='chips';
  AI_IDEAS.forEach(t=>{ const b=document.createElement('button'); b.type='button'; b.className='pbtn'; b.textContent=t.split(' ').slice(0,4).join(' ')+'...'; b.title=t; b.addEventListener('click',()=>{ ta.value=t; ta.focus(); }); chips.appendChild(b); });
  const go=document.createElement('button'); go.type='button'; go.className='pbtn hi'; go.id='aiGo'; go.textContent='Ask Claude'; go.addEventListener('click',askClaude);
  const attBtn=filePick('Attach image or file...','image/*,text/*,application/json',true,fs=>addAttachments(fs));
  const fin=document.createElement('span');
  if(!window.slateStandalone){ const pm=document.createElement('button'); pm.type='button'; pm.className='pbtn'; pm.textContent='Claude permissions'; pm.addEventListener('click',async()=>{ try{ const P=window.claude&&window.claude.use?await window.claude.use('permissions'):null; if(!P){ toast('Open this page inside the Claude app, signed in.'); return; } const st=await P.state('sample'); if(st==='granted'){ toast('Claude is already allowed. Try Ask Claude again.'); return; } if(st==='prompt'){ const r=await P.request(['sample']); toast(r&&r.sample==='granted'?'Allowed. Try Ask Claude again.':'Not allowed yet.'); return; } if(P.manage) await P.manage(); else toast('Open the artifact menu, then Permissions, and allow Claude.'); }catch(e){ toast('Open the artifact menu, then Permissions, and allow Claude.'); } }); fin.appendChild(pm); }
  const thumbs=document.createElement('div'); thumbs.className='thumbs'; thumbs.id='aiAtt';
  ta.addEventListener('paste',e=>{ const fs=e.clipboardData&&e.clipboardData.files; if(fs&&fs.length){ e.preventDefault(); addAttachments(fs); } });
  const stat=document.createElement('p'); stat.className='note'; stat.id='aiStat'; stat.style.color='var(--fg)';
  const tier=document.createElement('select'); tier.className='sel2'; tier.id='aiTier'; tier.setAttribute('aria-label','Mode');
  tier.innerHTML='<option value="default">Detailed (slower, better models)</option><option value="quick">Fast (simple edits)</option>';
  const log=document.createElement('div'); log.className='log'; log.id='aiLog'; log.setAttribute('aria-live','polite'); log.textContent='Claude can add models, move objects, keyframe the camera and change the lighting. You approve access the first time.';
  const imp=filePick('Import GLB model...','',false,fs=>importGlb(fs[0]));
  const js=document.createElement('textarea'); js.className='ta'; js.id='aiJson'; js.placeholder='Paste model JSON here'; js.setAttribute('aria-label','Model JSON');
  const add=document.createElement('button'); add.type='button'; add.className='pbtn'; add.textContent='Add JSON model';
  add.addEventListener('click',()=>{
    try{ const m=parseModelJson(js.value), sp=addCustom(m.name,m.parts); selectId(sp.id); renderTimeline(); queueSave(); toast('Added '+sp.name+'.'); js.value=''; }
    catch(err){ toast(err.message||'Could not read that JSON.'); }
  });
  const cp=document.createElement('button'); cp.type='button'; cp.className='pbtn'; cp.textContent='Copy prompt for ChatGPT'; cp.addEventListener('click',()=>copyText(MODEL_PROMPT));
  const g2=document.createElement('div'); g2.className='g2'; g2.append(add,cp);
  const sj=document.createElement('textarea'); sj.className='ta'; sj.id='aiScene'; sj.placeholder='Paste scene JSON here'; sj.setAttribute('aria-label','Scene JSON');
  const sBuild=document.createElement('button'); sBuild.type='button'; sBuild.className='pbtn hi'; sBuild.textContent='Build scene';
  sBuild.addEventListener('click',()=>{ try{ const r=buildScene(sj.value); toast('Built '+r.built+' objects.'+(r.skipped.length?' Skipped: '+r.skipped.join(', ')+'.':'')); }catch(err){ toast(err.message||'Could not read that scene JSON.'); } });
  const sCopy=document.createElement('button'); sCopy.type='button'; sCopy.className='pbtn'; sCopy.textContent='Copy prompt for ChatGPT'; sCopy.addEventListener('click',()=>copyText(SCENE_PROMPT));
  const sKochi=document.createElement('button'); sKochi.type='button'; sKochi.className='pbtn'; sKochi.textContent='Example: Fort Kochi'; sKochi.addEventListener('click',()=>{ try{ buildScene(KOCHI_LAYOUT); toast('Fort Kochi built from its layout.'); }catch(err){ toast(err.message||'Could not build the example.'); } });
  const sImg=document.createElement('button'); sImg.type='button'; sImg.className='pbtn hi'; sImg.textContent='Build scene from attached image';
  sImg.addEventListener('click',()=>{ if(!aiAtt.some(a=>a.kind==='image')){ toast('Attach an image first, or paste one into the box above.'); return; }
    const pr=$('#aiPrompt'); if(!pr.value.trim()) pr.value='Build this whole scene from the image with build_scene. Match the layout, distances and left-right placement.'; askClaude(); });
  const g3=document.createElement('div'); g3.className='g2'; g3.append(sBuild,sCopy);
  $('#pAi').append(
    panel('Ask Claude',[ta,chips,attBtn,fin,thumbs,noteEl('Attach photos, sketches or floor plans and Claude builds an approximate model from simple shapes. Two or more views (front, side) help. TXT, MD, JSON and CSV files are read as text.'),row('Mode',tier),go,stat,log]),
    panel('Scene from image',[sImg,sKochi,noteEl('Claude looks at your image and places detailed trees, buildings, water, boats and props where they are in the picture. No file picker? Paste the image into the box above. ChatGPT: copy the prompt, add the image and your note, then paste the JSON below.'),sj,g3]),
    panel('Import',[imp,noteEl('GLB files only, up to 60 MB. Sketchfab, Poly Haven and Mixamo can export GLB. Imported models are not saved when you reload.')]),
    panel('Model JSON',[js,g2,noteEl('ChatGPT and other AIs cannot connect to this page directly. Copy the prompt, add your object to the end, then paste the JSON it returns.')],false));
  aiStatus('Checking the Claude connection...');
  getSample().then(c=>{ if(!aiBusy) aiStatus(c?'Claude is connected. Describe what you want and tap Ask Claude.':'Claude is not connected in this view. Open this page from its card inside the Claude app, not as a browser tab.'); });
}
