/* ---------- scene from image: layout builder, prompt, tool, UI ---------- */
const SCENE_CATALOG='Assets (params in braces, all optional): '+
 'building {w:15 width along its front, d:8 depth, floors:2, floorH:3.1, wall:"#ece2cf", roof:"#b4512e", shutter:"#2c6a93", trim:"#f3ecde", roof_style:"gable|flat", detail:"high|low", door:true, balcony:true, awning:true}; '+
 'tree {kind:"rain|palm|round|pine", h:meters, leaf:"#hex"}; ground {w, d, kind:"cobble|grass|sand|dirt|stone|asphalt", color}; water {w, d, color}; '+
 'seawall {len, h, color}; hill {w, h, color} for distant hills; lamp {h}; bench {len}; boat {len, color}; pier {len, w}; fishing_net {size}; '+
 'planter {n}; bush {size, color}; vines {w, h, color} flowering climber on a wall; rock {size, color}; ship {len}. '+
 'ground, water, seawall, pier, building and vines extend in their own local x and z around their origin; every asset faces +Z by default.';
const SCENE_RULES='Coordinates are metres. The viewer stands at the origin, eye height 1.7, looking toward -Z: the right of the picture is +X, the left is -X, farther away is more negative Z, up is +Y. '+
 'Place each object by its base position p=[x,0,z] (water and ground are centred on p). "ry" turns the object about the vertical axis in degrees: 0 faces the viewer (+Z), 90 faces +X (right), -90 faces -X (left), 180 faces away. "s" scales the whole object. '+
 'Lay out the scene so that distances, sizes and left-right placement match the picture: a building on the left side facing the walkway would be at x of about -6 with ry 90. Put big ground and water first, then buildings and trees, then props. Use 20 to 70 objects. ';
const SCENE_JSON_SHAPE='{"environment":"day|golden|overcast|night|studio","camera":{"p":[x,y,z],"target":[x,y,z],"fov":40},"objects":[{"asset":"building","p":[-6,0,-10],"ry":90,"s":1,"params":{"floors":2}}]}';
const SCENE_PROMPT='You are a 3D scene layout assistant. Study the attached image and reply with ONLY JSON (no prose, no code fences) in this shape: '+SCENE_JSON_SHAPE+'. '+SCENE_RULES+SCENE_CATALOG+' The scene to build from my image: ';

function buildScene(layout){
  if(typeof layout==='string') layout=JSON.parse(String(layout).trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim());
  if(!layout||!Array.isArray(layout.objects)) throw new Error('Expected a list called "objects".');
  if(S.recording) throw new Error('Wait for the render to finish.');
  S.playing=false; syncPlay();
  if(layout.clear!==false){ clearObjects(); S.tracks={}; }
  let made=0, skipped=[];
  const vec=(a,d)=>[0,1,2].map(i=>A_num(a&&a[i],d[i],-2000,2000));
  layout.objects.slice(0,160).forEach(o=>{
    const fn=o&&ASSETS[o.asset]; if(!fn){ if(o&&o.asset) skipped.push(String(o.asset)); return; }
    let res; try{ res=fn(o.params||{}); }catch(err){ skipped.push(o.asset); return; }
    const k=(res.k||1)*A_num(o.s,1,.05,50), p=vec(o.p,[0,0,0]), ry=A_num(o.ry,0,-720,720)*Math.PI/180;
    for(let i=0;i<res.parts.length;i+=300){
      const sp=mkSpec('custom',{name:('Scene - '+o.asset+(o.name?' '+String(o.name).slice(0,20):'')+(i?' '+(i/300+1):'')),parts:cleanParts(res.parts.slice(i,i+300)),p:p,r:[0,ry,0],s:[k,k,k]});
      addNode(sp);
    }
    made++;
  });
  if(layout.environment&&PRESETS[layout.environment]) applyPreset(layout.environment);
  kochiEnv(true,false);
  if(layout.clear!==false||layout.camera){
    const c=layout.camera||{}, cp=vec(c.p,[0,1.7,6]), tg=vec(c.target,[0,2.4,-30]), fov=A_num(c.fov,40,15,90), D=S.duration||8;
    const mv=(a,b,t)=>[0,1,2].map(i=>a[i]+(b[i]-a[i])*t);
    S.tracks.cam=[{t:0,p:cp,f:fov},{t:D,p:mv(cp,tg,.12),f:fov}];
    S.tracks.tgt=[{t:0,p:tg},{t:D,p:mv(tg,[tg[0],tg[1],tg[2]-4],1)}];
    camNode.position.fromArray(cp); tgtNode.position.fromArray(tg);
    edit.position.set(cp[0]-10,cp[1]+8,cp[2]+14); orbit.target.set(tg[0]*.3,2,(cp[2]+tg[2])*.35); orbit.update();
    S.t=0;
  }
  applyTracks(S.t); applyLook(); refreshLook(); markPreset(); renderTimeline(); renderOutliner(); renderProps(); queueSave();
  return {built:made,skipped:skipped};
}

const KOCHI_LAYOUT={
  environment:'day', camera:{p:[-1,1.7,6],target:[4,2.6,-30],fov:38},
  objects:[
    {asset:'water',p:[40,0,-80],params:{w:70,d:200}},
    {asset:'water',p:[140,0,-80],params:{w:130,d:300}},
    {asset:'hill',p:[80,0,-210],params:{w:170,h:22}},
    {asset:'ground',p:[-.5,0,-40],params:{w:11.5,d:130,kind:'cobble'}},
    {asset:'ground',p:[-50,0,-60],params:{w:70,d:170,kind:'grass'}},
    {asset:'seawall',p:[5.6,0,-40],ry:90,params:{len:140,h:.95}},
    {asset:'building',p:[-6,0,12],ry:90,params:{w:15,floors:2}},
    {asset:'building',p:[-6,0,-3],ry:90,params:{w:15,floors:2}},
    {asset:'building',p:[-6,0,-18],ry:90,params:{w:15,floors:2}},
    {asset:'building',p:[-6,0,-33],ry:90,params:{w:15,floors:2,detail:'low'}},
    {asset:'building',p:[-6,0,-48],ry:90,params:{w:15,floors:2,detail:'low'}},
    {asset:'building',p:[-6,0,-63],ry:90,params:{w:15,floors:2,detail:'low'}},
    {asset:'building',p:[-6,0,-78],ry:90,params:{w:15,floors:2,detail:'low'}},
    {asset:'building',p:[-6,0,-93],ry:90,params:{w:15,floors:2,detail:'low'}},
    {asset:'vines',p:[-5.9,0,17],ry:90,params:{w:5,h:7}},
    {asset:'tree',p:[-3.2,0,-8],params:{kind:'rain',h:11}},
    {asset:'planter',p:[-5.4,0,8],ry:90,params:{n:3}},
    {asset:'planter',p:[-5.4,0,-12],ry:90,params:{n:2}},
    {asset:'lamp',p:[4.4,0,-6]},{asset:'lamp',p:[4.4,0,-20]},{asset:'lamp',p:[4.4,0,-34]},{asset:'lamp',p:[4.4,0,-48]},{asset:'lamp',p:[4.4,0,-62]},
    {asset:'bench',p:[3.4,0,-2],ry:90},{asset:'bench',p:[3.4,0,-14],ry:90},{asset:'bench',p:[3.4,0,-30],ry:90},{asset:'bench',p:[3.4,0,-45],ry:90},
    {asset:'pier',p:[5.8,0,-26],ry:90,params:{len:18,w:2.6}},
    {asset:'fishing_net',p:[14,0,-17],ry:90},{asset:'fishing_net',p:[21,0,-37],ry:90},{asset:'fishing_net',p:[26.4,0,-26],ry:90},
    {asset:'boat',p:[12,0,-10],ry:80,params:{len:5.2,color:'#2b6e9c'}},
    {asset:'boat',p:[18,0,-48],ry:15,params:{len:5.5,color:'#c0453a'}},
    {asset:'ship',p:[55,0,-120],ry:70,params:{len:36}},
    {asset:'tree',p:[-3,0,-100],params:{kind:'round',h:9}},{asset:'tree',p:[3,0,-108],params:{kind:'round',h:10}},{asset:'tree',p:[-14,0,-115],params:{kind:'round',h:11}}
  ]
};
