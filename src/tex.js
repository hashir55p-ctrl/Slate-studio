/* ---------- procedural textures with relief, water, wind (shared materials) ---------- */
const TEXN=['plaster','cobble','tile','bark','wood','stone','leaf','water','net','flower'];
const WT={value:0};
/* m = metres per tile, s = colour strength, b = relief strength, g = grime near the ground */
const TEXCFG={plaster:{m:2.6,s:.9,b:.55,g:1},cobble:{m:1.6,s:1,b:.9,g:0},tile:{m:1.4,s:1,b:1.1,g:0},bark:{m:1.3,s:1,b:1.4,g:.6},wood:{m:1.8,s:.95,b:.7,g:0},stone:{m:2.2,s:1,b:.9,g:1},
  leaf:{m:1.5,s:1,b:.3,alpha:1},flower:{m:1.1,s:1,b:.25,alpha:1},net:{m:.9,s:.6,b:0,alpha:1}};
const texCache={};
function mkCanvas(n){ const c=document.createElement('canvas'); c.width=c.height=n; return c; }
function makeTex(name){
  if(texCache[name]) return texCache[name];
  let seed=name.length*977+13; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  const gr=v=>{ v=Math.max(0,Math.min(255,Math.round(v*255))); return 'rgb('+v+','+v+','+v+')'; };
  const N=(name==='net')?256:512, c=mkCanvas(N), x=c.getContext('2d');
  const wrap=(fn,px,py,mg)=>{ const xs=[0],ys=[0]; if(px<mg) xs.push(N); if(px>N-mg) xs.push(-N); if(py<mg) ys.push(N); if(py>N-mg) ys.push(-N); xs.forEach(dx=>ys.forEach(dy=>fn(px+dx,py+dy))); };
  const speck=(n,lo,hi,sz,al)=>{ x.globalAlpha=al; for(let i=0;i<n;i++){ x.fillStyle=gr(lo+rnd()*(hi-lo)); const s=sz*(.5+rnd()); x.fillRect(rnd()*N,rnd()*N,s,s); } x.globalAlpha=1; };
  if(name==='plaster'){
    x.fillStyle=gr(.84); x.fillRect(0,0,N,N);
    for(let i=0;i<700;i++){ const px=rnd()*N,py=rnd()*N,r=10+rnd()*60,v=rnd()<.5?.66+rnd()*.12:.9+rnd()*.1;
      wrap((a,b)=>{ x.globalAlpha=.06; x.fillStyle=gr(v); x.beginPath(); x.arc(a,b,r,0,7); x.fill(); },px,py,r); }
    /* peeled patches showing laterite underneath */
    for(let i=0;i<9;i++){ const px=rnd()*N,py=rnd()*N,r=12+rnd()*28; wrap((a,b)=>{ x.globalAlpha=.85; x.fillStyle=gr(.5+rnd()*.08); x.beginPath(); for(let k=0;k<12;k++){ const an=k/12*6.283, rr=r*(.6+rnd()*.5); x.lineTo(a+Math.cos(an)*rr,b+Math.sin(an)*rr*.7); } x.closePath(); x.fill(); x.globalAlpha=.6; x.strokeStyle=gr(.95); x.lineWidth=2; x.stroke(); },px,py,r*1.2); }
    /* rain streaks */
    for(let i=0;i<60;i++){ const px=rnd()*N,py=rnd()*N,w=2+rnd()*9,l=60+rnd()*260; const g=x.createLinearGradient(0,py,0,py+l); g.addColorStop(0,'rgba(80,80,72,.22)'); g.addColorStop(1,'rgba(80,80,72,0)'); wrap((a,b)=>{ x.fillStyle=g; x.globalAlpha=.7; x.fillRect(a,b,w,l); },px,py,l); }
    /* hairline cracks */
    x.globalAlpha=.5; x.strokeStyle=gr(.45); x.lineWidth=1; for(let i=0;i<14;i++){ let px=rnd()*N,py=rnd()*N; x.beginPath(); x.moveTo(px,py); for(let k=0;k<8;k++){ px+=(rnd()-.5)*26; py+=rnd()*20; x.lineTo(px,py); } x.stroke(); }
    speck(1600,.5,.95,2,.3);
  } else if(name==='cobble'){
    /* laterite pavers: rectangular, warm, porous, worn edges */
    x.fillStyle=gr(.28); x.fillRect(0,0,N,N);
    const rows=8,h=N/rows; for(let r=0;r<rows;r++){ const cols=4, w=N/cols, off=(r%2)*w*.5;
      for(let k=0;k<cols+1;k++){ const px=k*w+off-w*.5, v=.6+rnd()*.32, jw=w-5-rnd()*3, jh=h-5-rnd()*2;
        for(const dx of [-N,0,N]){ const X0=px+dx+2.5, Y0=r*h+2.5; const g=x.createLinearGradient(X0,Y0,X0,Y0+jh); g.addColorStop(0,gr(v+.08)); g.addColorStop(.5,gr(v)); g.addColorStop(1,gr(v-.14));
          x.fillStyle=g; x.beginPath(); if(x.roundRect) x.roundRect(X0,Y0,jw,jh,4); else x.rect(X0,Y0,jw,jh); x.fill(); } } }
    x.globalAlpha=.55; for(let i=0;i<2600;i++){ x.fillStyle=gr(.18+rnd()*.25); const s=1+rnd()*2.5; x.beginPath(); x.arc(rnd()*N,rnd()*N,s,0,7); x.fill(); } x.globalAlpha=1;
    speck(1500,.4,1,2,.25);
  } else if(name==='tile'){
    /* Mangalore clay tiles: rounded ridges with deep overlaps */
    x.fillStyle=gr(.4); x.fillRect(0,0,N,N);
    const cols=10, w=N/cols, rows=8, h=N/rows;
    for(let r=0;r<rows;r++){ for(let k=0;k<cols;k++){ const v=.68+rnd()*.3, px=k*w+(r%2)*w*.5;
      for(const dx of [-N,0]){ const g=x.createLinearGradient(px+dx,0,px+dx+w,0); g.addColorStop(0,gr(v*.45)); g.addColorStop(.3,gr(v*.9)); g.addColorStop(.5,gr(v)); g.addColorStop(.75,gr(v*.85)); g.addColorStop(1,gr(v*.45)); x.fillStyle=g; x.fillRect(px+dx,r*h,w,h*.94); }
      const g2=x.createLinearGradient(0,r*h,0,r*h+h); g2.addColorStop(0,'rgba(0,0,0,.25)'); g2.addColorStop(.15,'rgba(0,0,0,0)'); g2.addColorStop(.85,'rgba(0,0,0,0)'); g2.addColorStop(1,'rgba(0,0,0,.6)'); x.fillStyle=g2; x.fillRect(px,r*h,w,h); } }
    x.globalAlpha=.3; for(let i=0;i<260;i++){ const px=rnd()*N,py=rnd()*N; x.fillStyle=rnd()<.6?gr(.3):'#8ea07a'; x.beginPath(); x.ellipse(px,py,3+rnd()*9,2+rnd()*5,0,0,7); x.fill(); } x.globalAlpha=1;
    speck(1200,.3,.9,2,.25);
  } else if(name==='bark'){
    x.fillStyle=gr(.55); x.fillRect(0,0,N,N);
    /* deep vertical fissures with plates between */
    for(let i=0;i<70;i++){ let px=rnd()*N; const w=3+rnd()*7; x.strokeStyle=gr(.12+rnd()*.12); x.lineWidth=w; x.globalAlpha=.85; x.beginPath(); let py=-20; x.moveTo(px,py); while(py<N+20){ py+=10+rnd()*18; px+=(rnd()-.5)*10; x.lineTo(px,py); } x.stroke(); }
    for(let i=0;i<500;i++){ const px=rnd()*N,py=rnd()*N,w=2+rnd()*6,l=20+rnd()*90,v=.45+rnd()*.45; x.globalAlpha=.35; x.fillStyle=gr(v); wrap((a,b)=>x.fillRect(a,b,w,l),px,py,l); }
    x.globalAlpha=.35; for(let i=0;i<40;i++){ x.fillStyle=rnd()<.5?'#8f9a6a':'#b7b49a'; const px=rnd()*N,py=rnd()*N; wrap((a,b)=>{ x.beginPath(); x.ellipse(a,b,6+rnd()*16,4+rnd()*10,0,0,7); x.fill(); },px,py,30); }
    speck(1400,.2,.8,2,.3);
  } else if(name==='wood'){
    x.fillStyle=gr(.7); x.fillRect(0,0,N,N);
    for(let i=0;i<700;i++){ const py=rnd()*N,px=rnd()*N,l=60+rnd()*260; x.globalAlpha=.28; x.fillStyle=gr(.35+rnd()*.55); wrap((a,b)=>x.fillRect(a,b,l,1+rnd()*2),px,py,l); }
    x.globalAlpha=.9; x.fillStyle=gr(.2); for(let k=0;k<6;k++) x.fillRect(0,k*N/6,N,3);
    x.globalAlpha=.5; for(let i=0;i<10;i++){ x.fillStyle=gr(.25); x.beginPath(); x.ellipse(rnd()*N,rnd()*N,5+rnd()*7,2+rnd()*3,0,0,7); x.fill(); }
    x.globalAlpha=.3; for(let i=0;i<30;i++){ x.fillStyle=gr(.9); x.fillRect(rnd()*N,rnd()*N,30+rnd()*80,1); }
    speck(900,.3,.9,2,.2);
  } else if(name==='stone'){
    /* laterite blocks: porous, uneven courses, moss in the joints */
    x.fillStyle=gr(.3); x.fillRect(0,0,N,N);
    const rows=5,h=N/rows; for(let r=0;r<rows;r++){ let px=(r%2)*55; while(px<N+60){ const w=70+rnd()*90, v=.6+rnd()*.3;
      for(const dx of [-N,0]){ const X0=px+dx+3, Y0=r*h+3, ww=Math.min(w,N+80)-6, hh=h-6; const g=x.createLinearGradient(X0,Y0,X0,Y0+hh); g.addColorStop(0,gr(v+.07)); g.addColorStop(1,gr(v-.12)); x.fillStyle=g; x.beginPath(); if(x.roundRect) x.roundRect(X0,Y0,ww,hh,6); else x.rect(X0,Y0,ww,hh); x.fill(); }
      px+=w; } }
    x.globalAlpha=.5; for(let i=0;i<3200;i++){ x.fillStyle=gr(.15+rnd()*.3); x.beginPath(); x.arc(rnd()*N,rnd()*N,.8+rnd()*2.4,0,7); x.fill(); }
    x.globalAlpha=.3; for(let i=0;i<70;i++){ x.fillStyle=rnd()<.6?'#6f7d45':'#4d5a33'; const px=rnd()*N,py=rnd()*N; wrap((a,b)=>{ x.beginPath(); x.ellipse(a,b,8+rnd()*26,3+rnd()*8,0,0,7); x.fill(); },px,py,40); }
    speck(1200,.4,1,2,.25);
  } else if(name==='leaf'||name==='flower'){
    x.clearRect(0,0,N,N);
    const F=name==='flower';
    /* twigs */
    if(!F){ x.globalAlpha=1; x.strokeStyle=gr(.3); for(let i=0;i<40;i++){ const px=rnd()*N,py=rnd()*N,a=rnd()*6.28,l=40+rnd()*80; x.lineWidth=1.2; wrap((p,q)=>{ x.beginPath(); x.moveTo(p,q); x.lineTo(p+Math.cos(a)*l,q+Math.sin(a)*l); x.stroke(); },px,py,90); } }
    /* leaflets (rain tree: small paired leaflets) or papery bracts (bougainvillea) */
    const n=F?2400:3400;
    for(let i=0;i<n;i++){
      const px=rnd()*N,py=rnd()*N,a=rnd()*Math.PI,lw=F?(5+rnd()*5):(5+rnd()*7),lh=F?(4+rnd()*4):(2.2+rnd()*2.2),v=F?(.6+rnd()*.4):(.45+rnd()*.55);
      wrap((p,q)=>{ x.save(); x.translate(p,q); x.rotate(a); x.fillStyle=gr(v); x.beginPath(); if(F){ for(let k=0;k<3;k++){ x.rotate(2.094); x.ellipse(lw*.5,0,lw*.6,lh*.8,0,0,7); } } else x.ellipse(0,0,lw,lh,0,0,7); x.fill();
        if(!F){ x.fillStyle=gr(v*1.15); x.fillRect(-lw*.7,-.3,lw*1.4,.6); } x.restore(); },px,py,24);
    }
    /* thin out to get gaps for dappled light */
    x.globalCompositeOperation='destination-out'; for(let i=0;i<(F?60:90);i++){ const px=rnd()*N,py=rnd()*N,r=10+rnd()*28; wrap((a,b)=>{ x.beginPath(); x.arc(a,b,r,0,7); x.fill(); },px,py,r); } x.globalCompositeOperation='source-over';
    if(F){ x.globalAlpha=.9; for(let i=0;i<260;i++){ x.fillStyle=gr(.98); x.beginPath(); x.arc(rnd()*N,rnd()*N,1.2,0,7); x.fill(); } }
  } else if(name==='net'){
    x.clearRect(0,0,N,N); x.fillStyle='rgba(225,233,240,.22)'; x.fillRect(0,0,N,N); x.strokeStyle='rgba(240,244,248,.95)'; x.lineWidth=2.2; const s=N/12;
    for(let i=0;i<=12;i++){ x.beginPath(); x.moveTo(i*s+(rnd()-.5),0); x.lineTo(i*s+(rnd()-.5)*2,N); x.stroke(); x.beginPath(); x.moveTo(0,i*s); x.lineTo(N,i*s+(rnd()-.5)*2); x.stroke(); }
    x.fillStyle='rgba(240,245,250,.9)'; for(let i=0;i<=12;i++) for(let j=0;j<=12;j++){ x.beginPath(); x.arc(i*s,j*s,1.6,0,7); x.fill(); }
  }
  x.globalAlpha=1;
  let mean=.7; try{ const d=x.getImageData(0,0,N,N).data; let sm=0,w=0; for(let i=0;i<d.length;i+=64){ const a=d[i+3]/255; if(a<.5) continue; sm+=(d[i]+d[i+1]+d[i+2])/765; w++; } if(w) mean=Math.max(.2,sm/w); }catch(e){}
  const t=new THREE.CanvasTexture(c); t.userData={mean:mean};
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()||1);
  texCache[name]=t; return t;
}
const WIND_VS='\nif(talpha>.5){ transformed+=vec3(sin(wt*1.4+vWPos.x*.7+vWPos.y),0.0,cos(wt*1.1+vWPos.z*.8))*.04; }';
function patchTex(m,name){
  const cfg=TEXCFG[name]; if(!cfg) return;
  const U={tmap:{value:makeTex(name)},tscale:{value:1/cfg.m},tstr:{value:cfg.s},talpha:{value:cfg.alpha?1:0},tbump:{value:cfg.b||0},tgrime:{value:cfg.g||0},tmean:{value:(makeTex(name).userData||{}).mean||.7},tnet:{value:name==='net'?1:0},wt:WT};
  if(cfg.alpha){ m.side=THREE.DoubleSide; if(name==='net'){ m.transparent=true; m.depthWrite=false; } }
  m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vWPos; varying vec3 vWNrm; uniform float wt; uniform float talpha;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvWPos=(modelMatrix*vec4(transformed,1.0)).xyz; vWNrm=normalize(mat3(modelMatrix)*objectNormal);'+WIND_VS);
    sh.fragmentShader=sh.fragmentShader
      .replace('#include <common>','#include <common>\nvarying vec3 vWPos; varying vec3 vWNrm; uniform sampler2D tmap; uniform float tscale; uniform float tstr; uniform float talpha; uniform float tbump; uniform float tgrime; uniform float tmean; uniform float tnet;\nvec3 an_; vec2 tuv_; int ax_;')
      .replace('#include <map_fragment>','#include <map_fragment>\n'+
        'an_=abs(vWNrm); ax_=(an_.y>an_.x&&an_.y>an_.z)?1:((an_.x>an_.z)?0:2); tuv_=ax_==1?vWPos.xz:(ax_==0?vWPos.zy:vWPos.xy);\n'+
        'vec4 t1_=texture2D(tmap,tuv_*tscale); vec4 t2_=texture2D(tmap,tuv_*tscale*.23+vec2(.37,.11));\n'+
        'if(tnet>.5){ diffuseColor.a*=t1_.a; if(t1_.a<.03) discard; } else if(talpha>.5&&t1_.a<.5) discard;\n'+
        'vec3 det_=(talpha>.5?t1_.rgb:(t1_.rgb*.7+t2_.rgb*.3))/tmean; diffuseColor.rgb*=mix(vec3(1.0),det_,tstr);\n'+
        'if(tgrime>0.0){ float gy_=smoothstep(0.0,1.5,vWPos.y); diffuseColor.rgb*=mix(vec3(.6,.64,.52),vec3(1.0),mix(1.0,gy_,tgrime)); }')
      .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+
        'if(tbump>0.0){ float e_=1.0/512.0; vec2 q_=tuv_*tscale; float h0_=dot(texture2D(tmap,q_).rgb,vec3(.333)); float hu_=dot(texture2D(tmap,q_+vec2(e_,0.0)).rgb,vec3(.333)); float hv_=dot(texture2D(tmap,q_+vec2(0.0,e_)).rgb,vec3(.333));\n'+
        ' vec2 g_=vec2(hu_-h0_,hv_-h0_)*tbump*14.0/(1.0+length(vViewPosition)*.06); vec3 tu_=ax_==1?vec3(1.0,0.0,0.0):(ax_==0?vec3(0.0,0.0,1.0):vec3(1.0,0.0,0.0)); vec3 tv_=ax_==1?vec3(0.0,0.0,1.0):vec3(0.0,1.0,0.0);\n'+
        ' normal=normalize(normal-(viewMatrix*vec4(tu_*g_.x+tv_*g_.y,0.0)).xyz); }');
  };
}
function waterMat(color){
  const m=new THREE.MeshStandardMaterial({color:lin(color),roughness:.07,metalness:.12});
  m.onBeforeCompile=sh=>{
    sh.uniforms.wt=WT;
    sh.vertexShader=sh.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvWPos=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader=sh.fragmentShader
      .replace('#include <common>','#include <common>\nvarying vec3 vWPos; uniform float wt;')
      .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+
        'vec2 p_=vWPos.xz; float t_=wt;\n'+
        'float dx_=cos(dot(p_,vec2(.55,.83))*1.7+t_*1.3)*.55+cos(dot(p_,vec2(-.7,.71))*2.9+t_*1.9)*.35+cos(dot(p_,vec2(.2,-.98))*6.3+t_*2.7)*.18;\n'+
        'float dz_=cos(dot(p_,vec2(.83,-.55))*1.5+t_*1.1)*.55+cos(dot(p_,vec2(.71,.7))*3.3+t_*2.1)*.3+cos(dot(p_,vec2(-.98,.2))*7.1+t_*3.1)*.15;\n'+
        'float amp_=.07/(1.0+length(vViewPosition)*.035);\n'+
        'normal=normalize(normal+(viewMatrix*vec4(dx_*amp_,0.0,dz_*amp_,0.0)).xyz);');
  };
  return m;
}
const leafDepthMats={};
function leafDepth(name){
  name=name||'leaf'; if(leafDepthMats[name]) return leafDepthMats[name];
  const U={tmap:{value:makeTex(name)},tscale:{value:1/TEXCFG[name].m}};
  const m=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}); m.side=THREE.DoubleSide;
  m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvWPos=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader=sh.fragmentShader
      .replace('#include <common>','#include <common>\nvarying vec3 vWPos; uniform sampler2D tmap; uniform float tscale;')
      .replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(texture2D(tmap,vWPos.xz*tscale).a<.5) discard;');
  };
  leafDepthMats[name]=m; return m;
}
const matCache=new Map();
function partMat(pt){
  const key=[pt.color,pt.rough,pt.metal,pt.glow?1:0,pt.tex||''].join('|');
  let m=matCache.get(key); if(m) return m;
  if(pt.glow) m=new THREE.MeshStandardMaterial({color:lin('#000000'),emissive:lin(pt.color),emissiveIntensity:3,roughness:1});
  else if(pt.tex==='water') m=waterMat(pt.color);
  else { m=std(pt.color,pt.rough,pt.metal); if(pt.tex) patchTex(m,pt.tex); }
  m.userData.glowMat=!!pt.glow; m.userData.tex=pt.tex||'';
  matCache.set(key,m); return m;
}

/* gentle life: boats bob, nets sway, lanterns flicker */
let kochiOn=false;
function kochiAnim(t){
  order.forEach(id=>{
    const n=nodes.get(id); if(!n) return; const nm=String(n.userData.name||'');
    if(nm.indexOf('Kochi - Fishing')!==0) return;
    if(!n.userData.kb) n.userData.kb={y:n.position.y,rx:n.rotation.x,rz:n.rotation.z};
    const kb=n.userData.kb, ph=(parseInt(String(id).replace(/\D/g,''),10)||1)*1.7;
    if(nm.indexOf('boat')>0){ n.position.y=kb.y+Math.sin(t*1.2+ph)*.05; n.rotation.z=kb.rz+Math.sin(t*.9+ph)*.025; n.rotation.x=kb.rx+Math.sin(t*1.1+ph*2)*.015; }
    else { n.rotation.z=kb.rz+Math.sin(t*.6+ph)*.007; n.rotation.x=kb.rx+Math.sin(t*.5+ph*1.3)*.005; }
  });
  matCache.forEach(m=>{ if(m.userData.glowMat) m.emissiveIntensity=3+.3*Math.sin(t*7.3)*Math.sin(t*3.1)+.12*Math.sin(t*13.7); });
}
