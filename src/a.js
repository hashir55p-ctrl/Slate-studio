(function(){
'use strict';
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>[...(r||document).querySelectorAll(s)];
const stage=$('#stage');
if(typeof THREE==='undefined'||!THREE.EffectComposer||!THREE.TransformControls||!THREE.OrbitControls){
  stage.innerHTML='<p class="fail">The 3D engine could not load. Check your connection and reload.</p>';return;
}
const lin=h=>new THREE.Color(h).convertSRGBToLinear();
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

/* ---------- state ---------- */
const S={duration:8,fps:24,t:0,playing:false,loop:true,tracks:{},sel:null,selKey:null,view:'free',mode:'translate',
  ease:'inout',aspect:2.39,quality:'draft',autokey:true,recording:false};
const look={preset:'golden',az:48,el:9,sun:3.6,exposure:1.05,bloom:.45,dof:0,focus:9,vignette:.45,grain:.05,pixar:0,fog:.022,fov:40};
const PRESETS={
  golden:{label:'Golden hour',az:48,el:9,sun:3.6,exposure:1.05,bloom:.45,fog:.022,sunColor:'#ffb067',top:'#35557f',hor:'#f0a674',gnd:'#2b2521',fogC:'#d89c76',disc:1},
  overcast:{label:'Overcast',az:20,el:40,sun:.9,exposure:1.25,bloom:.15,fog:.035,sunColor:'#dfe6ef',top:'#8a98a8',hor:'#c3ccd4',gnd:'#3b3d3d',fogC:'#b4bdc4',disc:.05},
  night:{label:'Moonlit',az:210,el:28,sun:.55,exposure:1.5,bloom:.7,fog:.016,sunColor:'#8eaefc',top:'#050a1a',hor:'#16264a',gnd:'#0a0d14',fogC:'#101c38',disc:.5},
  day:{label:'Tropical day',az:40,el:42,sun:3.4,exposure:1,bloom:.2,fog:.007,sunColor:'#fff0d8',top:'#2f78c8',hor:'#bfe0f2',gnd:'#6b6558',fogC:'#c9e3ef',disc:.6},
  hall:{label:'Dim hall',az:25,el:52,sun:.7,exposure:1.45,bloom:.5,fog:.012,sunColor:'#ffb36b',top:'#2a1f18',hor:'#4a3524',gnd:'#14100d',fogC:'#2a1e16',disc:0},
  kochi:{label:'Kerala afternoon',az:125,el:36,sun:3.9,exposure:1.05,bloom:.3,fog:.006,sunColor:'#ffe0ae',top:'#2f7fd0',hor:'#d2e8f2',gnd:'#6b6150',fogC:'#d6e6ee',disc:.7},
  studio:{label:'Studio',az:30,el:45,sun:2.4,exposure:1,bloom:.1,fog:.004,sunColor:'#fff1de',top:'#555a62',hor:'#6c727b',gnd:'#2c2e31',fogC:'#5d636b',disc:0}
};
const STORE='slate-studio-v1';

/* ---------- renderer ---------- */
let renderer;
try{
  renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
}catch(err){
  stage.innerHTML='<p class="fail">WebGL is not available in this browser.</p>';return;
}
renderer.setPixelRatio(1);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
stage.insertBefore(renderer.domElement,stage.firstChild);

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x888888,.02);
const edit=new THREE.PerspectiveCamera(50,S.aspect,.2,800);
edit.position.set(10,6.5,12);
const cinema=new THREE.PerspectiveCamera(look.fov,S.aspect,.2,600);

/* ---------- sky + environment ---------- */
const skyU={top:{value:new THREE.Color()},hor:{value:new THREE.Color()},gnd:{value:new THREE.Color()},
  sunDir:{value:new THREE.Vector3(0,1,0)},sunCol:{value:new THREE.Color()},sunPow:{value:1}};
const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
  vertexShader:'varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader:'uniform vec3 top; uniform vec3 hor; uniform vec3 gnd; uniform vec3 sunCol; uniform vec3 sunDir; uniform float sunPow; varying vec3 vD;'+
  'void main(){ vec3 d=normalize(vD); float h=d.y; vec3 c=(h>0.0)?mix(hor,top,pow(h,0.45)):mix(hor,gnd,smoothstep(0.0,0.35,-h));'+
  'float s=max(dot(d,normalize(sunDir)),0.0); c+=sunCol*(pow(s,6.0)*0.35+pow(s,220.0)*6.0)*sunPow; gl_FragColor=vec4(c,1.0);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}'});
const skyGeo=new THREE.SphereGeometry(450,32,16);
const sky=new THREE.Mesh(skyGeo,skyMat); sky.frustumCulled=false; sky.renderOrder=-10; scene.add(sky);
const envScene=new THREE.Scene(); envScene.add(new THREE.Mesh(skyGeo,skyMat));
const pmrem=new THREE.PMREMGenerator(renderer);
let envRT=null, envTimer=0;
function rebuildEnv(){
  try{ if(envRT) envRT.dispose(); envRT=pmrem.fromScene(envScene,0,0.1,1000); scene.environment=envRT.texture; }catch(err){}
}
function scheduleEnv(){ clearTimeout(envTimer); envTimer=setTimeout(rebuildEnv,160); }

/* ---------- light + ground ---------- */
const sun=new THREE.DirectionalLight(0xffffff,3);
sun.castShadow=true; sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:110});
sun.shadow.bias=-.0005; sun.shadow.normalBias=.04;
scene.add(sun,sun.target);

const ground=new THREE.Mesh(new THREE.CircleGeometry(220,64).rotateX(-Math.PI/2),
  new THREE.MeshStandardMaterial({color:lin('#3a3733'),roughness:.96,metalness:0}));
ground.receiveShadow=true; scene.add(ground);
const grid=new THREE.GridHelper(40,40,0x8a8f98,0x4a4f58);
grid.position.y=.01; grid.material.transparent=true; grid.material.opacity=.3; scene.add(grid);

(function scatter(){
  let seed=7; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const n=90, mesh=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.5,0),
    new THREE.MeshStandardMaterial({color:lin('#4a4540'),roughness:.9,flatShading:true}),n);
  const m=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), p=new THREE.Vector3(), sc=new THREE.Vector3();
  for(let i=0;i<n;i++){
    const a=rnd()*Math.PI*2, r=11+rnd()*70, s=.25+rnd()*rnd()*2.2;
    p.set(Math.cos(a)*r,s*.25,Math.sin(a)*r); e.set(rnd()*3,rnd()*3,rnd()*3); q.setFromEuler(e); sc.set(s,s*(.6+rnd()*.5),s);
    m.compose(p,q,sc); mesh.setMatrixAt(i,m);
  }
  mesh.name='rocks'; mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh);
})();

/* ---------- camera rig handles ---------- */
const nodes=new Map();
let order=[];
const camNode=new THREE.Group(); camNode.userData={id:'cam',name:'Camera',type:'cam'};
(function(){
  const bm=new THREE.MeshBasicMaterial({color:lin('#c9ced6'),fog:false});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.5,.36,.8),bm);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.14,.19,.28,16).rotateX(Math.PI/2).translate(0,0,.52),bm);
  const mag=new THREE.Mesh(new THREE.BoxGeometry(.4,.3,.34).translate(0,.3,-.1),bm);
  camNode.add(body,lens,mag);
})();
const tgtNode=new THREE.Mesh(new THREE.OctahedronGeometry(.3),new THREE.MeshBasicMaterial({color:lin('#e2a24f'),wireframe:true,fog:false}));
tgtNode.userData={id:'tgt',name:'Camera target',type:'tgt'};
const linkGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
const link=new THREE.Line(linkGeo,new THREE.LineBasicMaterial({color:lin('#e2a24f'),transparent:true,opacity:.55,fog:false}));
link.frustumCulled=false;
scene.add(camNode,tgtNode,link);
nodes.set('cam',camNode); nodes.set('tgt',tgtNode);

/* ---------- post processing ---------- */
const GradeShader={
  uniforms:{tDiffuse:{value:null},exposure:{value:1},vignette:{value:.4},grain:{value:.05},pix:{value:0},time:{value:0},aspect:{value:2.39},res:{value:new THREE.Vector2(1000,400)}},
  vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader:'uniform sampler2D tDiffuse; uniform float exposure; uniform float vignette; uniform float grain; uniform float pix; uniform float time; uniform float aspect; uniform vec2 res; varying vec2 vUv;'+
  'vec3 aces(vec3 x){ x*=exposure; return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }'+
  'float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }'+
  'void main(){ vec3 col=aces(texture2D(tDiffuse,vUv).rgb); float l=dot(col,vec3(0.299,0.587,0.114));'+
  'col=mix(col,col*vec3(1.05,1.0,0.93),smoothstep(0.45,1.0,l)); col=mix(col,col*vec3(0.93,1.0,1.06),1.0-smoothstep(0.0,0.5,l));'+
  'col=mix(col,col*col*(3.0-2.0*col),pix*0.55); l=dot(col,vec3(0.299,0.587,0.114)); col=mix(vec3(l),col,1.0+pix*0.55); col+=pix*vec3(0.018,0.014,0.03)*(1.0-l); col*=mix(vec3(1.0),vec3(1.05,1.0,0.93),pix*smoothstep(0.5,1.0,l)); col=clamp(col,0.0,1.0);'+
  'vec2 d=vUv-0.5; d.x*=min(aspect,1.4); float v=smoothstep(0.25,0.85,length(d)*1.25); col*=1.0-vignette*v;'+
  'col=pow(col,vec3(1.0/2.2)); col+=(hash(vUv*res+time)-0.5)*grain; gl_FragColor=vec4(col,1.0); }'
};
const hasF=renderer.capabilities.isWebGL2&&renderer.extensions.has('EXT_color_buffer_float');
const half=hasF||renderer.extensions.has('EXT_color_buffer_half_float');
const rtOpts={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,type:half?THREE.HalfFloatType:THREE.UnsignedByteType};
let rt;
if(renderer.capabilities.isWebGL2&&THREE.WebGLMultisampleRenderTarget&&(hasF||!half)){ rt=new THREE.WebGLMultisampleRenderTarget(2,2,rtOpts); rt.samples=4; }
else rt=new THREE.WebGLRenderTarget(2,2,rtOpts);
const composer=new THREE.EffectComposer(renderer,rt);
const renderPass=new THREE.RenderPass(scene,edit);
const bokeh=new THREE.BokehPass(scene,edit,{focus:9,aperture:.0003,maxblur:.02,width:2,height:2});
const bloom=new THREE.UnrealBloomPass(new THREE.Vector2(256,256),.4,.6,.9);
const grade=new THREE.ShaderPass(GradeShader);
composer.addPass(renderPass); composer.addPass(bokeh); composer.addPass(bloom); composer.addPass(grade);
