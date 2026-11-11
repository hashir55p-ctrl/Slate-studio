/* ---------- Fort Kochi with real 3D models (made from images, textured) ---------- */
const KR={};
['tree','palm','building','boat','net'].forEach(n=>{ KR[n]=EMBED_GLB.length; EMBED_GLB.push({share:true,name:'Kochi '+n,size:({tree:14,palm:11,building:11,boat:7,net:11})[n],r:[0,0,0],url:'assets/kochi_'+n+'.txt'}); });

/* wind: bend the model from the ground up, in the shader (amp = metres of sway at the very top) */
function kochiSway(model,amp,minY,h,k){
  const ph=Math.random()*6.28, A=amp/k, H=h, MY=minY;
  model.traverse(o=>{
    if(!o.isMesh) return; const m=o.material; if(!m||m.userData.sway) return; m.userData.sway=1;
    m.onBeforeCompile=sh=>{
      sh.uniforms.uSwT=WT; sh.uniforms.uSwA={value:A}; sh.uniforms.uSwH={value:H}; sh.uniforms.uSwY={value:MY}; sh.uniforms.uSwP={value:ph};
      sh.vertexShader='uniform float uSwT,uSwA,uSwH,uSwY,uSwP;\n'+sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n float hh=clamp((position.y-uSwY)/uSwH,0.,1.); hh*=hh;\n float pp=uSwP+modelMatrix[3].x*.37+modelMatrix[3].z*.21;\n float gust=sin(uSwT*1.1+pp)+.5*sin(uSwT*2.3+position.x*4.+pp);\n transformed.x+=gust*uSwA*hh; transformed.z+=cos(uSwT*.8+pp+position.z*3.)*uSwA*.5*hh;\n transformed.x+=sin(uSwT*5.+position.y*9.+position.x*7.)*uSwA*.06*hh;');
    };
    m.needsUpdate=true;
  });
}

function kochiRealProject(){
  const pr=kochiProject();
  const keep=['Promenade and sea wall','Sea','Wooden pier','Lamps and benches','Ship','Far trees','Far building'];
  pr.objs=pr.objs.filter(sp=>{ const nm=String(sp.name||'').replace('Kochi - ',''); return keep.some(k=>nm.indexOf(k)===0); });
  const G=(name,key,p,ry,gs,flip,sway)=>pr.objs.push(mkSpec('glb',{name:'Kochi - '+name,embed:KR[key],gsize:gs,p:p,r:[0,ry,0],s:[flip?-1:1,1,1],sway:sway||0}));
  [[-44,11,0],[-31,10.4,1],[-18.5,11.4,0],[-6,10.6,1],[9,11,0]].forEach((b,i)=>G('Real heritage building '+(i+1),'building',[b[0],0,-10.5],0,b[1],!!b[2]));
  [[-26,-3.5,13],[-10,-3.2,14.5],[16,-3.5,13.5]].forEach((t,i)=>G('Real rain tree '+(i+1),'tree',[t[0],0,t[1]],i*70,t[2],i%2===1,.32));
  [[-38,3.6,10.5],[-20,3.8,11.5],[4,3.8,12],[30,3.6,10]].forEach((t,i)=>G('Real coconut palm '+(i+1),'palm',[t[0],0,t[1]],i*55,t[2],i%2===0,.9));
  G('Fishing net 1 (real)','net',[8,0,16],-25,11,false,0); G('Fishing net 2 (real)','net',[25,0,17],20,10.5,true,0); G('Fishing net 3 (real)','net',[16,0,29.5],0,11,false,0);
  G('Fishing boat 1 (real)','boat',[9,-.18,9],75,7,false,0); G('Fishing boat 2 (real)','boat',[31,-.18,12],20,6.5,true,0);
  return pr;
}
function loadKochiReal(){
  if(S.recording) return;
  S.playing=false; syncPlay();
  loadProject(kochiRealProject());
  Object.assign(look,KOCHI_LOOK); S.duration=12;
  kochiEnv(true,true); setAspect(2.39); applyTracks(0); applyLook(); refreshLook(); markPreset();
  renderTimeline(); renderOutliner(); renderProps(); queueSave(); toast('Fort Kochi with real 3D models is loading (about 9 MB, shared between copies).');
}
