/* ================= Pixar look: warm skin glow + rim light on characters, graded in post ================= */
(function(){ const C=THREE.ShaderChunk; if(C.lights_fragment_end.indexOf('PIXAR')<0) C.lights_fragment_end+=
'\n#ifdef PIXAR\n{ vec3 pnV=normalize(normal); vec3 pvV=normalize(vViewPosition);'+
' float pfr=pow(1.0-clamp(dot(pnV,pvV),0.0,1.0),2.4);'+
'\n#if NUM_DIR_LIGHTS>0\n'+
' float pnl=dot(pnV,directionalLights[0].direction); vec3 pLc=min(directionalLights[0].color,vec3(1.6));'+
' float pwrap=smoothstep(-0.35,0.25,pnl)*(1.0-clamp(pnl,0.0,1.0));'+
' reflectedLight.directDiffuse+=diffuseColor.rgb*vec3(1.0,0.45,0.3)*pLc*pwrap*0.16;'+
' reflectedLight.directDiffuse+=pLc*vec3(1.0,0.84,0.66)*pfr*clamp(0.55-pnl,0.0,1.0)*0.10;'+
'\n#endif\n'+
' reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(0.75,0.86,1.0)*pfr*0.14; }\n#endif\n';
 if(C.map_fragment.indexOf('PIXAR')<0) C.map_fragment=C.map_fragment.replace('vec4 texelColor = texture2D( map, vUv );','vec4 texelColor = texture2D( map, vUv );\n#if defined(PIXAR) && __VERSION__ >= 300\n{ vec2 pts=1.0/vec2(textureSize(map,0)); vec3 bl=(texture2D(map,vUv+vec2(pts.x,0.0)).rgb+texture2D(map,vUv-vec2(pts.x,0.0)).rgb+texture2D(map,vUv+vec2(0.0,pts.y)).rgb+texture2D(map,vUv-vec2(0.0,pts.y)).rgb)*0.25; texelColor.rgb=clamp(texelColor.rgb+(texelColor.rgb-bl)*1.25,0.0,1.0); }\n#endif');
})();
function pixarSync(){
  const want=(look.pixar||0)>.02;
  order.forEach(id=>{ const n=nodes.get(id), sp=n&&n.userData&&n.userData.spec; if(!sp||sp.type!=='glb'||sp.embed==null||sp.embed>3) return;
    n.traverse(o=>{ if(!o.isMesh||!o.material) return; (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
      const has=!!(m.defines&&m.defines.PIXAR); if(want===has) return;
      m.defines=m.defines||{}; if(want) m.defines.PIXAR=1; else delete m.defines.PIXAR; m.needsUpdate=true; if(m.map){ m.map.anisotropy=want?renderer.capabilities.getMaxAnisotropy():1; m.map.needsUpdate=true; } }); }); });
}
window.__look=look;
window.__pxdbg=()=>{ const r={n:0,def:0,types:[],q:S.quality}; order.forEach(id=>{ const n=nodes.get(id), sp=n&&n.userData&&n.userData.spec; if(sp&&r.types.length<12) r.types.push(sp.type+":"+sp.embed+":"+sp.name); if(!sp||sp.type!=="glb"||sp.embed==null) return; n.traverse(o=>{ if(o.isMesh&&o.material){ r.n++; if(o.material.defines&&o.material.defines.PIXAR) r.def++; r.mt=o.material.type; } }); }); return r; };
window.__S=S; window.__pxsync=pixarSync;
