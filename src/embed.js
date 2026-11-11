/* ---------- GLB models bundled with the studio ---------- */
const EMBED_GLB=[];
function embedParse(i,cb){
  const e=EMBED_GLB[i]; if(!e||!THREE.GLTFLoader) return;
  const go=()=>{ try{ new THREE.GLTFLoader().parse(e.buf.slice(0),'',cb,err=>toast('Bundled model failed: '+((err&&err.message)||'error'))); }catch(err){ toast('Bundled model failed: '+((err&&err.message)||'error')); } };
  if(e.buf){ go(); return; }
  if(e.b64){ try{ const bin=atob(e.b64), u=new Uint8Array(bin.length); for(let k=0;k<bin.length;k++) u[k]=bin.charCodeAt(k); e.buf=u.buffer; go(); }catch(err){ toast('Bundled model failed.'); } return; }
  if(!e.p) e.p=fetch(e.url).then(r=>{ if(!r.ok) throw new Error('missing '+e.url); return r.text(); }).then(t=>{ const bin=atob(t.trim()), u=new Uint8Array(bin.length); for(let k=0;k<bin.length;k++) u[k]=bin.charCodeAt(k); e.buf=u.buffer; },err=>{ e.p=null; throw err; });
  e.p.then(go,err=>toast('Could not load '+e.name+' from the assets folder ('+((err&&err.message)||'error')+').'));
}
function embedRigSpec(en){ const o={rot:(en.r?en.r[1]:0)}; if(en.tpose){ const d=-82*Math.PI/180; o.base={'upperArm.L':[0,0,d],'upperArm.R':[0,0,-d]}; } return o; }
/* props placed many times share one parsed copy (same geometry and textures), so the iPad keeps a single copy in memory */
function embedShared(i,cb){
  const e=EMBED_GLB[i]; if(!e||!e.share) return embedParse(i,cb);
  if(!e.gp) e.gp=new Promise(res=>embedParse(i,res));
  e.gp.then(g=>cb({scene:g.scene.clone(true)}));
}
function embedFill(group,spec){
  embedShared(spec.embed,g=>{
    const model=g.scene, box=new THREE.Box3().setFromObject(model), size=box.getSize(new THREE.Vector3()), c=box.getCenter(new THREE.Vector3());
    const k=(spec.gsize||1.75)/(Math.max(size.x,size.y,size.z)||1);
    model.scale.setScalar(k); model.position.set(-c.x*k,-box.min.y*k,-c.z*k);
    model.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
    group.add(model);
    if(spec.sway&&typeof kochiSway==='function') kochiSway(model,spec.sway,box.min.y,size.y,k);
    const en=EMBED_GLB[spec.embed]; if(en&&en.humanoid&&!spec.rig) spec.rig=embedRigSpec(en);
    if(spec.rig){ try{ rigAuto(group,spec); }catch(err){ toast('Rig failed: '+((err&&err.message)||'error')); } }
  });
}
function addEmbedded(i,o){
  const e=EMBED_GLB[i]; if(!e) return null;
  const sp=mkSpec('glb',{name:e.name,embed:i,gsize:e.size,p:(o&&o.p)||[0,0,0],r:(o&&o.r)||e.r||[0,0,0]});
  addNode(sp); return sp;
}
function loadEmbedded(){}
