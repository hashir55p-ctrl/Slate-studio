/* ================= Import models: GLB or OBJ (+MTL), saved with the project (Build 146) =================
   OBJ files are converted to GLB in memory (objects/groups become named meshes, so hair_* and cape parts keep
   their names; per-vertex colours are kept). The model bytes are stored in IndexedDB and restored on reload. */
function impObjToGlb(text,mtlText){
  const mats={}; if(mtlText){ let cur=null; mtlText.split(/\r?\n/).forEach(l=>{ const t=l.trim().split(/\s+/); if(t[0]==='newmtl'){ cur=t.slice(1).join(' '); mats[cur]={c:[.8,.8,.8]}; } else if(t[0]==='Kd'&&cur&&t.length>=4) mats[cur].c=[+t[1],+t[2],+t[3]]; }); }
  const V=[],C=[],VN=[]; let hasC=false; const objs=[]; let cur=null, pend='mesh', pmat='', nameCount={};
  const mk=()=>{ const base=pend; nameCount[base]=(nameCount[base]||0)+1; cur={name:nameCount[base]>1?base+'_'+nameCount[base]:base,map:new Map(),pos:[],nor:[],col:[],idx:[],mat:pmat,hasN:true}; objs.push(cur); return cur; };
  const lines=text.split(/\r?\n/);
  for(let li=0;li<lines.length;li++){ const l=lines[li]; if(!l||l[0]==='#') continue; const t=l.trim().split(/\s+/), c=t[0];
    if(c==='v'){ V.push([+t[1],+t[2],+t[3]]); if(t.length>=7){ C.push([+t[4],+t[5],+t[6]]); hasC=true; } else C.push(null); }
    else if(c==='vn') VN.push([+t[1],+t[2],+t[3]]);
    else if(c==='o'||c==='g'){ pend=(t.slice(1).join('_')||'mesh').replace(/[^A-Za-z0-9_.\-]/g,'_'); cur=null; }
    else if(c==='usemtl'){ const m=t.slice(1).join(' '); if(cur&&cur.idx.length&&cur.mat!==m){ cur=null; } pmat=m; if(cur) cur.mat=m; }
    else if(c==='f'){ if(!cur) mk(); const ids=[];
      for(let k=1;k<t.length;k++){ const p=t[k].split('/'); let vi=parseInt(p[0],10), ni=p.length>2&&p[2]!==''?parseInt(p[2],10):0; vi=vi<0?V.length+vi:vi-1; if(ni) ni=ni<0?VN.length+ni:ni-1;
        const key=vi+'/'+ni; let id=cur.map.get(key);
        if(id===undefined){ id=cur.pos.length/3; cur.map.set(key,id); const v=V[vi]; if(!v) continue; cur.pos.push(v[0],v[1],v[2]);
          if(ni&&VN[ni]){ cur.nor.push(VN[ni][0],VN[ni][1],VN[ni][2]); } else { cur.nor.push(0,0,0); cur.hasN=false; }
          const cc=C[vi]; cur.col.push(cc?cc[0]:1,cc?cc[1]:1,cc?cc[2]:1); }
        ids.push(id); }
      for(let k=1;k<ids.length-1;k++) cur.idx.push(ids[0],ids[k],ids[k+1]); } }
  const O=objs.filter(o=>o.idx.length);
  if(!O.length) throw new Error('No faces found in that OBJ.');
  O.forEach(o=>{ if(!o.hasN){ const P=o.pos, N=new Float32Array(P.length), I=o.idx;
      for(let i=0;i<I.length;i+=3){ const a=I[i]*3,b=I[i+1]*3,c2=I[i+2]*3, ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2], vx=P[c2]-P[a],vy=P[c2+1]-P[a+1],vz=P[c2+2]-P[a+2], nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
        [a,b,c2].forEach(q=>{ N[q]+=nx; N[q+1]+=ny; N[q+2]+=nz; }); }
      for(let i=0;i<N.length;i+=3){ const l=Math.hypot(N[i],N[i+1],N[i+2])||1; N[i]/=l; N[i+1]/=l; N[i+2]/=l; } o.nor=Array.from(N); } });
  const bin=[], views=[], acc=[], meshes=[], nodesJ=[], matList=[], matIdx={};
  const add=(arr,target)=>{ let off=0; bin.forEach(b=>off+=b.byteLength); const pad=(4-off%4)%4; if(pad){ bin.push(new Uint8Array(pad)); off+=pad; } bin.push(new Uint8Array(arr.buffer,arr.byteOffset,arr.byteLength)); views.push({buffer:0,byteOffset:off,byteLength:arr.byteLength,target:target}); return views.length-1; };
  O.forEach(o=>{ const P=new Float32Array(o.pos), N=new Float32Array(o.nor), I=new Uint32Array(o.idx); let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
    for(let i=0;i<P.length;i+=3) for(let k=0;k<3;k++){ if(P[i+k]<mn[k])mn[k]=P[i+k]; if(P[i+k]>mx[k])mx[k]=P[i+k]; }
    const a0=acc.length, vp=add(P,34962), vn=add(N,34962), vi=add(I,34963);
    acc.push({bufferView:vp,componentType:5126,count:P.length/3,type:'VEC3',min:mn,max:mx},{bufferView:vn,componentType:5126,count:N.length/3,type:'VEC3'},{bufferView:vi,componentType:5125,count:I.length,type:'SCALAR'});
    const at={POSITION:a0,NORMAL:a0+1}; if(hasC){ const cb=add(new Float32Array(o.col),34962); acc.push({bufferView:cb,componentType:5126,count:o.col.length/3,type:'VEC3'}); at.COLOR_0=acc.length-1; }
    const mk2=o.mat||'__default'; if(matIdx[mk2]===undefined){ matIdx[mk2]=matList.length; const col=hasC?[1,1,1]:((mats[o.mat]||{c:[.8,.78,.74]}).c); matList.push({name:mk2,pbrMetallicRoughness:{baseColorFactor:[col[0],col[1],col[2],1],metallicFactor:0,roughnessFactor:.7},doubleSided:true}); }
    meshes.push({name:o.name,primitives:[{attributes:at,indices:a0+2,material:matIdx[mk2]}]}); nodesJ.push({name:o.name,mesh:meshes.length-1}); });
  let tot=0; bin.forEach(b=>tot+=b.byteLength); const padEnd=(4-tot%4)%4; if(padEnd){ bin.push(new Uint8Array(padEnd)); tot+=padEnd; }
  const g={asset:{version:'2.0',generator:'slate-studio obj import'},scene:0,scenes:[{nodes:nodesJ.map((_,i)=>i)}],nodes:nodesJ,meshes:meshes,materials:matList,accessors:acc,bufferViews:views,buffers:[{byteLength:tot}]};
  let js=new TextEncoder().encode(JSON.stringify(g)); const jp=(4-js.length%4)%4; if(jp){ const j2=new Uint8Array(js.length+jp); j2.set(js); j2.fill(32,js.length); js=j2; }
  const out=new Uint8Array(12+8+js.length+8+tot), dv=new DataView(out.buffer); dv.setUint32(0,0x46546C67,true); dv.setUint32(4,2,true); dv.setUint32(8,out.length,true);
  dv.setUint32(12,js.length,true); dv.setUint32(16,0x4E4F534A,true); out.set(js,20); let p=20+js.length; dv.setUint32(p,tot,true); dv.setUint32(p+4,0x004E4942,true); p+=8;
  bin.forEach(b=>{ out.set(b,p); p+=b.byteLength; }); return out.buffer;
}
function impReadText(f){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsText(f); }); }
function impReadBuf(f){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsArrayBuffer(f); }); }
function impOverride(spec){ const e=EMBED_GLB[spec.embed]; return e; }
async function importModelFiles(fs){
  try{
    const f=fs.find(x=>/\.(glb|obj)$/i.test(x.name||'')); if(!f){ toast('Choose a .glb or .obj file (an .mtl can come with an .obj).'); return; }
    if(f.size>60*1048576){ toast('That file is over 60 MB. Try a smaller model.'); return; }
    if(!THREE.GLTFLoader){ toast('The model loader did not load. Reload the page.'); return; }
    toast('Loading '+f.name+'...'); let buf;
    if(/\.obj$/i.test(f.name)){ const mf=fs.find(x=>/\.mtl$/i.test(x.name||'')); buf=impObjToGlb(await impReadText(f),mf?await impReadText(mf):''); }
    else { buf=await impReadBuf(f); const m=new Uint8Array(buf.slice(0,4)); if(String.fromCharCode(m[0],m[1],m[2],m[3])!=='glTF'){ toast('That file is not a valid GLB model.'); return; } }
    impAdopt(buf,f.name.replace(/\.(glb|obj)$/i,'').slice(0,32)||'Imported model');
  }catch(e){ toast('Could not import: '+((e&&e.message)||'error')); }
}
function importGlb(file){ importModelFiles([file]); }
function impAdopt(buf,name){
  new THREE.GLTFLoader().parse(buf.slice(0),'',gltf=>{ try{
    const box=new THREE.Box3().setFromObject(gltf.scene), sz=box.getSize(new THREE.Vector3()), tall=sz.y>1.35*Math.max(sz.x,sz.z)||sz.y>=.8*Math.max(sz.x,sz.y,sz.z)&&sz.y>=sz.x*.9&&sz.y>=sz.z*1.2;
    const gsize=tall?1.75:2.2, key='i'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), idx=EMBED_GLB.length;
    EMBED_GLB.push({name:name,size:gsize,humanoid:false,tpose:false,r:[0,0,0],buf:buf,impKey:key});
    const sp=mkSpec('glb',{name:name,embed:idx,gsize:gsize,imp:key,p:[orbit.target.x,0,orbit.target.z],r:[0,0,0]});
    addNode(sp); selectId(sp.id); renderTimeline(); queueSave();
    scIdbPut('imp:'+key,{buf:buf,name:name,gsize:gsize}).then(ok=>{ if(!ok) toast('Imported, but this browser could not keep the model after a reload.'); });
    toast('Imported '+name+' and saved it with the project. '+(tall?'It looks like a character: open the Rig tab and auto-rig it.':''));
  }catch(e){ toast('Could not add the model: '+((e&&e.message)||'error')); } },e=>toast('This model could not be loaded: '+((e&&e.message)||'it may use compression')));
}
/* a saved import only renders once its bytes are back: ignore a stale embed index from another session */
(function(){ const _ef=embedFill; embedFill=function(group,spec){ if(spec.imp){ const e=EMBED_GLB[spec.embed]; if(!e||e.impKey!==spec.imp) return; } _ef(group,spec); }; })();
async function impRestore(){
  const ids=order.filter(id=>{ const n=nodes.get(id), sp=n&&n.userData.spec; return sp&&sp.type==='glb'&&sp.imp; });
  for(const id of ids){ const sp=nodes.get(id).userData.spec; let idx=EMBED_GLB.findIndex(e=>e.impKey===sp.imp);
    if(idx<0){ const v=await scIdbGet('imp:'+sp.imp); if(!v||!v.buf){ toast('The imported model "'+sp.name+'" is not on this device. Import it again.'); continue; }
      idx=EMBED_GLB.length; EMBED_GLB.push({name:v.name||sp.name,size:v.gsize||2.2,humanoid:false,tpose:false,r:[0,0,0],buf:v.buf,impKey:sp.imp}); sp.gsize=sp.gsize||v.gsize; }
    sp.embed=idx; try{ scReplaceNode(id); }catch(e){} }
}
(function(){ const _r=scIdbRestore; scIdbRestore=async function(){ try{ await _r(); }catch(e){} try{ await impRestore(); }catch(e){ console.warn('impRestore',e); } }; })();
window.importModelFiles=importModelFiles;
