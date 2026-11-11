/* ---------- separate props (not part of any character body) ---------- */
function A_camera(p){
  const P=[], BK='#17181a', GR='#2b2d30', SV='#9ea3a8', y0=.03;
  /* DSLR lying on its base, lens points +Z. Body about 14.5 x 10 x 7.5 cm, with lens about 22 cm deep. */
  aB(P,0,y0+.05,0,.145,.1,.075,BK,{rough:.55});
  aB(P,-.058,y0+.05,.012,.03,.104,.06,'#24262a',{rough:.95});            /* grip */
  aB(P,0,y0+.112,-.002,.06,.03,.055,GR,{rough:.5});                       /* prism hump */
  aB(P,.04,y0+.104,.004,.038,.012,.045,'#202225',{rough:.5});             /* top plate */
  aC(P,.045,y0+.115,.01,.026,.012,.026,SV,{metal:.8,rough:.35});          /* mode dial */
  aC(P,-.045,y0+.108,.018,.016,.01,.016,'#b3342b',{rough:.4});            /* shutter ring */
  aB(P,0,y0+.138,-.002,.03,.014,.03,'#101113',{rough:.4});                /* hot shoe */
  aB(P,.06,y0+.04,.038,.018,.05,.004,'#3a3d41',{rough:.8});               /* back screen bezel edge */
  /* lens */
  aC(P,0,y0+.05,.073,.095,.07,.095,'#8c9096',{r:[90,0,0],metal:.8,rough:.35});   /* mount ring */
  aC(P,0,y0+.05,.135,.082,.1,.082,'#1c1d20',{r:[90,0,0],rough:.5});               /* barrel */
  aC(P,0,y0+.05,.116,.088,.025,.088,'#2a2c30',{r:[90,0,0],rough:.9});             /* zoom grip */
  aC(P,0,y0+.05,.19,.074,.016,.074,SV,{r:[90,0,0],metal:.8,rough:.3});            /* front ring */
  aC(P,0,y0+.05,.196,.058,.008,.058,'#0b1320',{r:[90,0,0],metal:.9,rough:.08});   /* glass */
  aS(P,0,y0+.05,.199,.022,.022,.006,'#2d4a73',{metal:1,rough:.05});               /* lens reflection */
  /* strap lugs and strap */
  aB(P,-.077,y0+.092,-.004,.008,.014,.016,SV,{metal:.7,rough:.4}); aB(P,.077,y0+.092,-.004,.008,.014,.016,SV,{metal:.7,rough:.4});
  if(p.strap!==false){
    aRod(P,[-.077,y0+.1,-.004],[-.15,y0+.34,-.04],.018,'#1f2a3a',{rough:.95});
    aRod(P,[.077,y0+.1,-.004],[.15,y0+.34,-.04],.018,'#1f2a3a',{rough:.95});
    aRod(P,[-.15,y0+.34,-.04],[0,y0+.5,-.12],.018,'#1f2a3a',{rough:.95});
    aRod(P,[.15,y0+.34,-.04],[0,y0+.5,-.12],.018,'#1f2a3a',{rough:.95});
  }
  return {parts:P,k:1};
}
Object.assign(ASSETS,{prop_camera:A_camera});
function addPropAsset(name,o){
  const fn=ASSETS[name]; if(!fn) throw new Error('unknown prop '+name);
  o=o||{}; const res=fn(o.params||{}), k=(res.k||1)*A_num(o.s,1,.05,50), made=[];
  for(let i=0;i<res.parts.length;i+=300){
    const sp=mkSpec('custom',{name:(o.name||name)+(i?' '+(i/300+1):''),parts:cleanParts(res.parts.slice(i,i+300)),p:o.p||[0,0,0],r:o.r||[0,0,0],s:[k,k,k]});
    addNode(sp); made.push(sp);
  }
  refreshScene(); if(made[0]) selectId(made[0].id); saveNow(); return made[0];
}
function addCameraProp(){ addPropAsset('prop_camera',{name:'Camera prop',p:[0,.9,0],s:1.4}); toast('Camera added. Move it with the Move tool, or ask me to place it on Hashir.'); }
