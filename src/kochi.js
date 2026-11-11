/* ---------- Fort Kochi seafront scene (built from parts) ---------- */
function kochiProject(){
  let seed=11; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  const D=180/Math.PI;
  const B=(P,x,y,z,sx,sy,sz,col,o)=>{ o=o||{}; P.push({shape:o.sh||'box',p:[x,y,z],s:[sx,sy,sz],r:o.r||[0,0,0],color:col,rough:o.rough==null?.9:o.rough,metal:o.metal||0,glow:!!o.glow}); };
  const C=(P,x,y,z,sx,sy,sz,col,o)=>B(P,x,y,z,sx,sy,sz,col,Object.assign({sh:'cylinder'},o||{}));
  const SP=(P,x,y,z,sx,sy,sz,col,o)=>B(P,x,y,z,sx,sy,sz,col,Object.assign({sh:'sphere'},o||{}));
  const rod=(P,a,b,th,col,rough)=>{
    const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]), len=d.length(); if(len<1e-4) return; d.normalize();
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d), e=new THREE.Euler().setFromQuaternion(q,'XYZ');
    P.push({shape:'cylinder',p:[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],s:[th,len,th],r:[e.x*D,e.y*D,e.z*D],color:col,rough:rough||.85,metal:0,glow:false});
  };
  const specs=[];
  /* a leaf or flower card: a thin slab whose texture has holes, so light comes through in dapples */
  const card=(P,x,y,z,w,d,col,tilt)=>{ tilt=tilt==null?32:tilt; P.push({shape:'box',p:[x,y,z],s:[w,.015,d],r:[(rnd()-.5)*2*tilt,rnd()*360,(rnd()-.5)*2*tilt],color:col,rough:.85,metal:0,glow:false}); };
  const vcard=(P,x,y,z,w,h,col,yaw,lean)=>{ P.push({shape:'box',p:[x,y,z],s:[w,h,.015],r:[lean||0,yaw,0],color:col,rough:.85,metal:0,glow:false}); };
  const CT={'#ece2cf':'plaster','#c8bda8':'plaster','#d2c4a8':'plaster','#b4512e':'tile','#a94a29':'tile','#8f3d22':'tile','#b79a78':'cobble','#c09a72':'cobble','#8d7b5f':'stone','#d9c5ae':'stone','#cdb99f':'stone','#cbbca5':'stone','#bfb09a':'stone','#bdb09a':'stone','#6b4f38':'bark','#5a4632':'bark','#8a6a4c':'bark','#7a5c40':'bark','#6b5238':'wood','#4a3a2a':'wood','#8b6b3e':'wood','#7b5a3a':'wood','#2b6e9c':'wood','#c0453a':'wood','#2f8da8':'water','#2a7f95':'water','#f3ecde':'plaster','#e2d6bf':'plaster','#2c6a93':'wood','#31698f':'wood','#3a7aa5':'wood','#2a5a7c':'wood'};
  '#5d8c28 #76a238 #4a7a22 #8cb94a #69992f #3f6c1e #4f7d2b #3f7a2c #58922f #2f6a28 #6f9a34 #85ad45'.split(' ').forEach(c=>CT[c]='leaf');
  '#d9408c #c0286f #e8559a #b01e62 #f06aa8'.split(' ').forEach(c=>CT[c]='flower'); CT['#e8eef2']='net';
  const add=(name,parts,p,r,s)=>{
    parts.forEach(q=>{ if(!q.tex&&CT[q.color]&&!(q.shape==='cylinder'&&q.s[0]<.09)) q.tex=CT[q.color]; });
    for(let i=0;i<parts.length;i+=3000){
      specs.push(mkSpec('custom',{name:'Kochi - '+name+(i?' '+(i/3000+1):''),parts:cleanParts(parts.slice(i,i+3000)),p:p||[0,0,0],r:r||[0,0,0],s:s||[1,1,1]}));
    }
  };

  /* ground, promenade, sea wall */
  (function(){
    const P=[];
    [-100,0,100].forEach(x=>{
      B(P,x,.1,-2,100,.2,14,'#c09a72',{rough:1});
      B(P,x,.1,-30,100,.2,40,'#8d7b5f',{rough:1});
      B(P,x,.45,5.5,100,.9,.7,'#d9c5ae',{rough:.95});
      B(P,x,.95,5.5,100,.14,.95,'#cdb99f',{rough:.95});
    });
    for(let i=0;i<9;i++) B(P,0,.205,-8+i*1.5,100,.01,.06,'#9b7f60',{rough:1});
    for(let i=0;i<14;i++) B(P,-60+rnd()*120,.206,-8+rnd()*13,1.4+rnd()*2,.012,.9+rnd()*1.2,rnd()<.5?'#a98d6c':'#c4a782',{rough:1});
    for(let i=0;i<10;i++) B(P,-70+rnd()*140,.55,5.87,1+rnd()*2.4,.25+rnd()*.3,.03,'#74804c',{rough:1});
    for(let i=0;i<8;i++) B(P,-70+rnd()*140,.5+rnd()*.35,5.87,.9+rnd()*1.2,.2,.03,'#b88a76',{rough:1});
    [-60,0,60].forEach(x=>B(P,x,.045,6.25,60,.012,.5,'#c6e6e1',{rough:1}));
    add('Promenade and sea wall',P);
  })();

  /* sea */
  (function(){
    const P=[];
    [-100,0,100].forEach(x=>B(P,x,.02,50,100,.04,100,'#2a7f95',{rough:.1,metal:.25}));
    add('Sea',P,[0,0,5.8],[0,0,0],[2.4,1,2.2]);
  })();

  /* colonial buildings */
  const bld=(L,detail)=>{
    const P=[], W='#ece2cf', TR='#f3ecde', BL='#2c6a93', DK='#222a30';
    B(P,0,3.5,-4,L,6,8,W,{rough:.95});
    B(P,0,.25,-4,L+.15,.5,8.15,'#c8bda8',{rough:1});
    B(P,0,.95,.02,L,.9,.04,'#d2c4a8',{rough:1});
    [-1,1].forEach(sg=>B(P,sg*(L/2-.2),3.5,.02,.45,6.1,.2,TR));
    B(P,0,3.55,.04,L,.25,.12,TR); B(P,0,6.55,.15,L+.3,.25,.5,TR);
    const n=Math.max(2,Math.round(L/3.6)), mid=Math.floor(n/2);
    for(let i=0;i<n;i++){
      const x=-L/2+(i+.5)*L/n;
      [2.0,4.9].forEach((y,fl)=>{
        if(!fl&&detail&&i===mid){
          B(P,x,1.4,.07,1.3,2.1,.1,'#31698f',{rough:.7}); C(P,x,2.45,.07,1.3,.1,1.3,'#31698f',{r:[90,0,0],rough:.7});
          B(P,x,.1,.5,1.9,.2,.8,'#bdb09a',{rough:1}); return;
        }
        B(P,x,y,.07,.9,1.7,.08,DK);
        B(P,x-.62,y,.1,.42,1.8,.06,BL,{rough:.65}); B(P,x+.62,y,.1,.42,1.8,.06,BL,{rough:.65});
        if(detail){
          B(P,x,y,.03,1.2,2.0,.1,TR); B(P,x,y,.07,.9,1.7,.09,DK);
          C(P,x,y+.85,.08,.9,.12,.9,DK,{r:[90,0,0]});
          B(P,x,y-1.02,.14,1.4,.1,.3,TR);
          for(let k=-1;k<=1;k++) B(P,x+k*.27,y,.13,.03,1.7,.03,'#15181b',{rough:.5,metal:.4});
        }
      });
    }
    B(P,0,3.2,1.0,L+.5,.14,2.2,'#b4512e',{r:[14,0,0],rough:.75});
    if(detail) for(let i=0;i<=n;i++) B(P,-L/2+i*L/n,2.95,.55,.12,.12,1.1,'#4a3524',{r:[14,0,0]});
    const ang=28.8;
    B(P,0,7.38,-1.6,L+1,.2,5.5,'#b4512e',{r:[ang,0,0],rough:.8});
    B(P,0,7.38,-6.4,L+1,.2,5.5,'#a94a29',{r:[-ang,0,0],rough:.8});
    B(P,0,8.75,-4,L+1,.28,.4,'#8f3d22',{rough:.85});
    if(detail) for(let i=0;i<8;i++){
      B(P,-L/2+rnd()*L,1.4+rnd()*4.6,.02,1+rnd()*2.2,.5+rnd()*1.2,.01,rnd()<.6?'#d6c9ae':'#c7b794',{rough:1});
    }
    return P;
  };

  /* hero building: much richer detail */
  const hero=(L)=>{
    const P=[], W='#ece2cf', TR='#f3ecde', BL='#2c6a93', BL2='#3a7aa5', DK='#1d2328', IR='#15181b';
    const n=4, bw=L/n, mid=2;
    B(P,0,3.75,-4,L,6.3,8,W,{rough:.95});
    B(P,0,.3,-4,L+.25,.6,8.25,'#c8bda8',{rough:1}); B(P,0,.64,.05,L+.35,.1,.3,TR,{rough:.95});
    B(P,0,1.0,.02,L,.8,.04,'#d2c4a8',{rough:1});
    [-1,1].forEach(sg=>{ const x=sg*(L/2-.25);
      B(P,x,3.75,.06,.5,6.3,.18,TR); B(P,x,.85,.1,.62,.3,.26,TR); B(P,x,6.45,.1,.62,.22,.26,TR); });
    for(let i=1;i<n;i++){ const x=-L/2+i*bw; B(P,x,3.75,.04,.3,6.3,.1,TR); }
    B(P,0,3.65,.06,L,.3,.16,TR); B(P,0,3.42,.04,L,.08,.1,TR);
    B(P,0,6.62,.16,L+.4,.26,.55,TR); B(P,0,6.85,.12,L+.5,.14,.7,TR);
    for(let x=-L/2+.6;x<L/2;x+=1.25) B(P,x,6.38,.12,.2,.22,.3,'#e2d6bf');
    for(let i=0;i<n;i++){
      const x=-L/2+(i+.5)*bw;
      [[2.25,0],[5.15,1]].forEach(a=>{
        const y=a[0], up=a[1];
        if(!up&&i===mid){
          B(P,x,2.0,.05,1.9,3.0,.14,TR); C(P,x,3.5,.05,1.9,.14,1.9,TR,{r:[90,0,0]});
          B(P,x,1.85,.1,1.5,2.55,.1,'#1b2024');
          [-1,1].forEach(sg=>{ B(P,x+sg*.38,1.75,.16,.66,2.35,.08,'#31698f',{rough:.65});
            B(P,x+sg*.38,1.3,.2,.46,.7,.03,'#2a5a7c',{rough:.65}); B(P,x+sg*.38,2.2,.2,.46,.7,.03,'#2a5a7c',{rough:.65});
            B(P,x+sg*.38,1.3,.2,.46,.7,.03,'#2a5a7c',{rough:.65}); });
          C(P,x,3.05,.1,1.4,.08,1.4,'#1b2024',{r:[90,0,0]});
          for(let k=-2;k<=2;k++) rod(P,[x,3.05,.16],[x+k*.3,3.05+Math.sqrt(Math.max(0,.49-k*k*.09)),.16],.03,'#b8a77c',.6);
          B(P,x,.12,.7,2.1,.24,1.0,'#bdb09a',{rough:1}); B(P,x,.3,.55,1.8,.12,.7,'#c8bda8',{rough:1});
          B(P,x+.12,1.9,.24,.06,.06,.04,'#c9a45a',{rough:.35,metal:.8});
          return;
        }
        B(P,x,y,.04,1.35,2.4,.12,TR);
        C(P,x,y+1.2,.04,1.35,.12,1.35,TR,{r:[90,0,0]});
        B(P,x,y,.08,.98,2.1,.1,DK); C(P,x,y+1.05,.08,.98,.1,.98,DK,{r:[90,0,0]});
        B(P,x,y,.12,.05,2.1,.04,'#3a2f26'); B(P,x,y+.4,.12,.98,.05,.04,'#3a2f26');
        [-1,1].forEach(sg=>{
          const sx=x+sg*.78; B(P,sx,y,.12,.5,2.2,.06,BL,{rough:.65});
          for(let k=0;k<4;k++) B(P,sx,y-.8+k*.55,.16,.42,.1,.03,BL2,{rough:.6,r:[-25,0,0]});
        });
        if(!up) for(let k=-2;k<=2;k++) B(P,x+k*.2,y,.15,.025,2.1,.025,IR,{rough:.5,metal:.4});
        if(!up){ B(P,x,y-.2,.15,.98,.025,.025,IR,{rough:.5,metal:.4}); B(P,x,y+.55,.15,.98,.025,.025,IR,{rough:.5,metal:.4}); }
        B(P,x,y-1.3,.16,1.6,.1,.34,TR); B(P,x-.55,y-1.45,.12,.1,.2,.18,TR); B(P,x+.55,y-1.45,.12,.1,.2,.18,TR);
        B(P,x,y+1.45,.12,1.7,.12,.16,TR);
        if(up&&i===mid){ B(P,x,3.6,.55,2.9,.14,1.1,TR); B(P,x,3.5,.55,2.6,.12,.9,'#d8ccb4');
          for(let k=-5;k<=5;k++) C(P,x+k*.26,4.05,1.0,.07,.72,.07,TR);
          B(P,x,4.45,1.05,2.9,.08,.1,TR); B(P,x,4.38,1.05,2.9,.05,.1,TR);
          [-1,1].forEach(sg=>{ B(P,x+sg*1.4,4.05,.55,.08,.72,1.1,TR); B(P,x+sg*.9,3.3,.2,.14,.3,.4,'#4a3524',{rough:1}); }); }
      });
    }
    B(P,0,3.1,1.0,L+.6,.12,2.3,'#b4512e',{r:[14,0,0],rough:.75});
    for(let i=0;i<=n*2;i++){ const x=-L/2+i*bw/2; B(P,x,2.88,.52,.1,.14,1.2,'#4a3524',{r:[14,0,0],rough:1}); }
    const ang=28.8, ov=.9;
    B(P,0,7.5,-1.55,L+1.2,.22,5.6,'#b4512e',{r:[ang,0,0],rough:.8});
    B(P,0,7.5,-6.45,L+1.2,.22,5.6,'#a94a29',{r:[-ang,0,0],rough:.8});
    B(P,0,8.9,-4,L+1.2,.3,.45,'#8f3d22',{rough:.85});
    B(P,0,6.98,.62,L+1.2,.1,.08,'#4a3524');
    [-1,1].forEach(sg=>{
      B(P,sg*L/2,7.9,-4,7.9,2.2,.35,W,{sh:'prism',r:[0,90,0],rough:.95});
      C(P,sg*(L/2+.2),7.75,-4,.8,.06,.8,DK,{r:[0,0,90]});
    });
    B(P,L/2-3,8.9,-5.5,.9,2.2,.9,W,{rough:.95}); B(P,L/2-3,10.1,-5.5,1.15,.18,1.15,'#cdbf9f');
    [-1,1].forEach(sg=>{ C(P,sg*(L/2-.5),3.9,.28,.16,6.6,.16,'#4f5a52',{rough:.5,metal:.3}); B(P,sg*(L/2-.5),.3,.28,.3,.2,.3,'#3b423d',{metal:.3}); });
    B(P,-L/2+2.6,3.4,.2,.14,.9,.14,IR,{metal:.5,rough:.5}); SP(P,-L/2+2.6,3.9,.2,.3,.34,.3,'#ffd9a0',{glow:true});
    for(let i=0;i<14;i++) B(P,-L/2+(i*1.07)%L,1.5+((i*37)%50)/10,.02,.9+(i%3)*.5,.5+(i%4)*.4,.01,i%3?'#d6c9ae':'#bfae8c',{rough:1});
    return P;
  };
  [-33,-18].forEach((x,i)=>add('Heritage building '+(i+1),hero(15),[x,0,-9]));
  add('Heritage building 3',bld(15,true),[-3,0,-9]);
  [12,27,42,57].forEach((x,i)=>add('Far building '+(i+1),bld(15,false),[x,0,-9]));

  /* rain tree: grown branch by branch */
  (function(){
    const P=[], bark='#8a6a4c', bark2='#7a5c40';
    const pal=['#5d8c28','#76a238','#4a7a22','#8cb94a','#69992f','#3f6c1e'];
    // trunk: stacked, slightly leaning sections
    C(P,.08,2.1,0,1.85,4.2,1.75,bark,{rough:1,r:[0,0,-2]}); C(P,.16,3.9,-.02,1.55,1.0,1.5,bark,{rough:1});
    B(P,0,.45,0,3.4,.9,3.4,bark,{sh:'cone',rough:1});
    // buttress roots
    for(let i=0;i<7;i++){ const a=i*.9+.2+rnd()*.25, r1=1.0+rnd()*.3, r2=1.7+rnd()*.6;
      rod(P,[Math.cos(a)*.6,1.5,Math.sin(a)*.6],[Math.cos(a)*r1,.35,Math.sin(a)*r1],.62,bark,1);
      SP(P,Math.cos(a)*r2,.12,Math.sin(a)*r2,.75,.32,.55,bark2,{rough:1,r:[0,-a*57.3,0]});
      rod(P,[Math.cos(a)*r1,.35,Math.sin(a)*r1],[Math.cos(a)*r2,.1,Math.sin(a)*r2],.5,bark2,1); }
    // moss and bark patches on the trunk
    for(let i=0;i<5;i++){ const a=rnd()*6.28; SP(P,Math.cos(a)*.9,.8+rnd()*2.2,Math.sin(a)*.9,.5+rnd()*.4,.25+rnd()*.3,.12,'#7d8a52',{rough:1}); }
    const V=(x,y,z)=>new THREE.Vector3(x,y,z);
    const tips=[];
    const grow=(st,dir,len,th,depth)=>{
      const en=st.clone().addScaledVector(dir,len);
      rod(P,[st.x,st.y,st.z],[en.x,en.y,en.z],th,depth%2?bark2:bark,1);
      if(depth>0){
        const kids=depth===3?3:2;
        for(let k=0;k<kids;k++){
          const az=rnd()*6.283, spread=.5+rnd()*.5;
          const d=dir.clone().multiplyScalar(.75).add(V(Math.cos(az)*spread,.25+rnd()*.35,Math.sin(az)*spread*.9+.12)).normalize();
          grow(en,d,len*(.62+rnd()*.12),th*.62,depth-1);
        }
      } else tips.push(en);
    };
    const prim=[[3.4,.9,3.6],[-3.2,.8,2.4],[4.6,.8,-.6],[-4.2,.9,-1.8],[.8,.8,-3.8],[2.2,1.0,2.0]];
    prim.forEach(p=>{ const d=V(p[0],p[1],p[2]).normalize(); grow(V(0,3.9,0),d,4.0,.82,3); });
    // crown: layered leaf cards around every branch tip, an umbrella canopy with gaps for dappled light
    const lp=['#5d8c28','#76a238','#4a7a22','#8cb94a','#69992f','#3f6c1e','#6f9a34','#85ad45'];
    tips.forEach(t=>{
      for(let k=0;k<26;k++){ const a=rnd()*6.283, r=Math.sqrt(rnd())*2.6; card(P,t.x+Math.cos(a)*r,t.y-.2+rnd()*1.6-r*.15,t.z+Math.sin(a)*r,1.5+rnd()*1.3,1.5+rnd()*1.3,lp[Math.floor(rnd()*lp.length)],38); }
      for(let k=0;k<5;k++){ const a=rnd()*6.283, r=1+rnd()*2; vcard(P,t.x+Math.cos(a)*r,t.y-.9-rnd()*.8,t.z+Math.sin(a)*r,1.0+rnd()*.8,1.2+rnd()*.9,lp[Math.floor(rnd()*lp.length)],rnd()*180,(rnd()-.5)*30); }
    });
    for(let i=0;i<260;i++){ const a=rnd()*6.283, r=Math.sqrt(rnd())*9.5; card(P,Math.cos(a)*r+1.8,8.6+rnd()*2.2-r*.12,Math.sin(a)*r*.9+2.2,1.6+rnd()*1.4,1.6+rnd()*1.4,lp[Math.floor(rnd()*lp.length)],26); }
    // epiphyte ferns and hanging moss strands
    for(let i=0;i<10;i++){ const t=tips[Math.floor(rnd()*tips.length)]; for(let k=0;k<4;k++) vcard(P,t.x*.6+(rnd()-.5)*.6,t.y*.7,t.z*.6+(rnd()-.5)*.6,.7,.5,'#4f7d2b',rnd()*180,(rnd()-.5)*50); }
    for(let i=0;i<14;i++){ const t=tips[Math.floor(rnd()*tips.length)]; rod(P,[t.x,t.y-.3,t.z],[t.x+(rnd()-.5)*.3,t.y-1.4-rnd()*1.2,t.z+(rnd()-.5)*.3],.04,'#7d8a52',1); }
    add('Rain tree',P,[-6,0,-3.5]);
  })();

  /* bougainvillea cascading down the first building and over its awning */
  (function(){
    const P=[], pk=['#d9408c','#c0286f','#e8559a','#b01e62','#f06aa8'], gn=['#4f7d2b','#3f7a2c','#58922f'];
    for(let i=0;i<420;i++){ const y=1.6+Math.pow(rnd(),.7)*7.6, w=1.2+(y/9)*3.6, x=-7.2+rnd()*w*1.7;
      vcard(P,x,y,.4+rnd()*.7,.7+rnd()*.9,.6+rnd()*.9,rnd()<.82?pk[Math.floor(rnd()*pk.length)]:gn[Math.floor(rnd()*gn.length)],(rnd()-.5)*70,(rnd()-.5)*60); }
    for(let i=0;i<120;i++) card(P,-7+rnd()*6,3.1+rnd()*.6,.4+rnd()*1.6,.7+rnd()*.7,.7+rnd()*.7,pk[Math.floor(rnd()*pk.length)],40);
    for(let i=0;i<10;i++) rod(P,[-7.1+rnd()*1.5,.2,.3],[-6.5+rnd()*3,3+rnd()*5,.4],.07,'#4a3a2a',1);
    add('Bougainvillea',P,[-33,0,-9]);
  })();

  /* lamps and benches */
  (function(){
    const P=[];
    [-14,-1,12,25,38,52].forEach(x=>{
      const K='#1b1d1f', o={rough:.45,metal:.6};
      B(P,x,.09,4.3,.7,.18,.7,K,o); B(P,x,.42,4.3,.5,.5,.5,K,o); B(P,x,.74,4.3,.36,.16,.36,K,o);
      C(P,x,2.35,4.3,.15,3.2,.15,K,o); C(P,x,1.2,4.3,.26,.1,.26,K,o); C(P,x,2.3,4.3,.22,.08,.22,K,o); C(P,x,3.55,4.3,.24,.1,.24,K,o);
      rod(P,[x,3.1,4.3],[x-.38,3.5,4.3],.035,K,.45); rod(P,[x,3.1,4.3],[x+.38,3.5,4.3],.035,K,.45);
      SP(P,x-.38,3.52,4.3,.1,.1,.1,K,o); SP(P,x+.38,3.52,4.3,.1,.1,.1,K,o);
      B(P,x,3.98,4.3,.54,.08,.54,K,o);
      B(P,x,4.28,4.3,.34,.52,.34,'#ffd9a0',{glow:true});
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(q=>C(P,x+q[0]*.2,4.3,4.3+q[1]*.2,.05,.64,.05,K,o));
      B(P,x,4.64,4.3,.56,.06,.56,K,o);
      B(P,x,4.88,4.3,.78,.34,.78,K,Object.assign({sh:'cone'},o));
      B(P,x,5.12,4.3,.3,.14,.3,K,Object.assign({sh:'cone'},o)); SP(P,x,5.24,4.3,.12,.12,.12,K,o);
    });
    [-12,-3,5,28,40,52].forEach(x=>{
      B(P,x,.55,3.6,2.3,.2,.65,'#cbbca5',{rough:1});
      B(P,x-.85,.27,3.6,.4,.45,.55,'#bfb09a',{rough:1}); B(P,x+.85,.27,3.6,.4,.45,.55,'#bfb09a',{rough:1});
    });
    add('Lamps and benches',P);
  })();

  /* potted palms and ferns along the buildings */
  (function(){
    const P=[];
    [[-31.2,-8.2],[-29.7,-8.3],[-14.2,-8.3],[-12.6,-8.2],[-5.4,-8.2],[1.2,-8.3]].forEach(a=>{
      C(P,a[0],.4,a[1],.62,.62,.62,'#b2543a',{rough:.9}); C(P,a[0],.74,a[1],.7,.08,.7,'#a04a33',{rough:.9});
      for(let k=0;k<9;k++){ const yaw=k*40+rnd()*20; vcard(P,a[0]+Math.sin(yaw*Math.PI/180)*.25,1.25+rnd()*.35,a[1]+Math.cos(yaw*Math.PI/180)*.25,.45,1.0+rnd()*.4,['#3f7a2c','#58922f','#2f6a28'][k%3],yaw,-25-rnd()*25); }
    });
    add('Potted plants',P);
  })();

  /* pier */
  (function(){
    const P=[], wd='#6b5238', pl='#4a3a2a';
    B(P,0,.7,16.2,2.6,.2,20.6,wd,{rough:.9});
    for(let i=0;i<20;i++) B(P,0,.805,6.1+i,2.6,.01,.05,'#4f3c28',{rough:1});
    for(let z=7;z<=26;z+=3){ C(P,-1.2,.1,z,.22,2.3,.22,pl,{rough:1}); C(P,1.2,.1,z,.22,2.3,.22,pl,{rough:1}); }
    for(let z=8;z<=26;z+=3.6){ C(P,-1.3,1.3,z,.1,1.2,.1,pl,{rough:1}); C(P,1.3,1.3,z,.1,1.2,.1,pl,{rough:1}); }
    rod(P,[-1.3,1.85,8],[-1.3,1.85,26],.05,'#8a7050',1); rod(P,[1.3,1.85,8],[1.3,1.85,26],.05,'#8a7050',1);
    add('Wooden pier',P,[16,0,0]);
  })();

  /* Chinese fishing nets */
  const net=()=>{
    const P=[], bam='#8b6b3e', wd='#6b5238', rope='#3a3026';
    B(P,0,.7,0,4,.18,4.5,wd);
    for(let i=0;i<5;i++) B(P,0,.805,-1.8+i*.9,4,.01,.05,'#4f3c28',{rough:1});
    [[-1.7,-1.9],[1.7,-1.9],[-1.7,1.9],[1.7,1.9]].forEach(a=>C(P,a[0],-.2,a[1],.22,2.2,.22,'#4a3a2a',{rough:1}));
    [[-1.9,-2.1],[1.9,-2.1],[-1.9,2.1],[1.9,2.1]].forEach(a=>C(P,a[0],1.15,a[1],.1,.9,.1,'#4a3a2a',{rough:1}));
    rod(P,[-1.9,1.55,-2.1],[1.9,1.55,-2.1],.05,bam); rod(P,[-1.9,1.55,2.1],[1.9,1.55,2.1],.05,bam);
    rod(P,[-1.4,.8,-1.2],[-.3,5.2,.2],.17,bam); rod(P,[1.4,.8,-1.2],[.3,5.2,.2],.17,bam);
    rod(P,[-1.0,2.6,-.6],[1.0,2.6,-.6],.1,bam);
    rod(P,[0,3.2,-2.8],[0,9.4,7.4],.15,bam);
    for(let i=0;i<6;i++){ const t=.12+i*.15; SP(P,0,3.2+6.2*t,-2.8+10.2*t,.2,.2,.2,'#5b4326',{rough:1}); }
    SP(P,0,2.9,-2.9,.9,.9,.9,'#6a665e',{rough:1}); SP(P,.35,2.7,-2.6,.55,.55,.55,'#7a766c',{rough:1});
    rod(P,[0,3.1,-2.8],[0,1.0,-1.8],.04,rope,1); rod(P,[0,5.2,.2],[-1.0,2.0,-1.8],.04,rope,1);
    const H=[0,8.8,6.6], cs=[[-3.4,4.2,3.5],[3.4,4.2,3.5],[-3.4,3.7,9.8],[3.4,3.7,9.8]];
    cs.forEach(c=>rod(P,H,c,.075,bam));
    [[0,1],[1,3],[3,2],[2,0]].forEach(e=>rod(P,cs[e[0]],cs[e[1]],.05,rope,1));
    rod(P,cs[0],cs[3],.04,rope,1); rod(P,cs[1],cs[2],.04,rope,1);
    [[0,3.9,3.5],[0,3.6,9.8],[-3.4,3.9,6.65],[3.4,3.9,6.65]].forEach(m=>rod(P,H,m,.035,rope,1));
    /* the net: four mesh panels sagging to a low centre, see-through */
    const ctr=[0,2.3,6.65];
    const quad=(a,b,c)=>{ const A=new THREE.Vector3(...a),Bv=new THREE.Vector3(...b),Cv=new THREE.Vector3(...c), mid=A.clone().add(Bv).multiplyScalar(.5), ex=Bv.clone().sub(A), w=ex.length(); ex.normalize(); const ey=Cv.clone().sub(mid); const h=ey.length(); ey.normalize();
      const ez=new THREE.Vector3().crossVectors(ex,ey).normalize(); ey.crossVectors(ez,ex).normalize(); const M=new THREE.Matrix4().makeBasis(ex,ey,ez), e=new THREE.Euler().setFromRotationMatrix(M,'XYZ'), cen=mid.clone().add(Cv).multiplyScalar(.5);
      P.push({shape:'box',p:[cen.x,cen.y,cen.z],s:[w*.78,h,.02],r:[e.x*D,e.y*D,e.z*D],color:'#e8eef2',rough:1,metal:0,glow:false}); };
    [[0,1],[1,3],[3,2],[2,0]].forEach(e=>quad(cs[e[0]],cs[e[1]],ctr));
    [[0,1],[1,3],[3,2],[2,0]].forEach(e=>{ const a=cs[e[0]], b=cs[e[1]], m=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2]; rod(P,m,ctr,.018,'#9fb0bd',1); });
    cs.forEach(c=>rod(P,c,ctr,.02,'#9fb0bd',1));
    B(P,1.2,1.0,-1.2,.8,.4,.6,'#7b5a3a'); B(P,-1.2,.95,-1.4,.5,.3,.5,'#5b7a8a',{rough:.6});
    C(P,-1.3,1.05,1.0,.3,.34,.3,'#2f5d86',{rough:.5,metal:.2});
    return P;
  };
  add('Fishing net 1',net(),[8,0,16],[0,-.45,0]);
  add('Fishing net 2',net(),[25,0,17],[0,.35,0]);
  add('Fishing net 3',net(),[16,0,29.5],[0,0,0]);

  /* boats */
  (function(){
    const mk=(hull)=>{
      const P=[], R='#b5382c', wd='#a58660';
      SP(P,0,.05,0,1.7,.95,5.4,hull,{rough:.5});
      SP(P,0,.46,0,1.5,.1,5.0,'#8a6a45',{rough:.9});
      for(let k=0;k<2;k++){ const sg=k?-1:1;
        for(let z=-2.3;z<=2.31;z+=.46){
          const w=.84*Math.sqrt(Math.max(.05,1-Math.pow(z/2.75,2))), w2=.84*Math.sqrt(Math.max(.05,1-Math.pow((z+.46)/2.75,2)));
          B(P,sg*w,.5,z+.23,.07,.1,.5,R,{r:[0,sg*Math.atan((w2-w)/.46)*180/Math.PI*-1,0],rough:.6});
        } }
      [-1.9,-1.45,-.95,-.45,.05,.55,1.05,1.55,2.0].forEach(z=>B(P,0,.5,z,1.25,.035,.07,'#6e5233',{rough:1}));
      [-1.25,0,1.25].forEach(z=>B(P,0,.58,z,1.4,.06,.2,wd));
      B(P,0,.58,2.5,.12,.5,.14,R,{r:[-22,0,0],rough:.6}); B(P,0,.9,2.74,.12,.5,.14,R,{r:[-48,0,0],rough:.6});
      B(P,0,.58,-2.5,.12,.5,.14,R,{r:[22,0,0],rough:.6}); B(P,0,.9,-2.74,.12,.5,.14,R,{r:[48,0,0],rough:.6});
      B(P,0,.72,-1.8,.5,.5,.5,'#cbb88a',{sh:'torus',r:[90,0,0],rough:1});
      SP(P,.1,.6,-1.5,.8,.3,.6,'#9fb3c2',{rough:1});
      rod(P,[.55,.75,-.4],[1.9,.15,1.5],.05,'#7b5a3a'); B(P,2.05,.12,1.7,.12,.04,.5,'#8b6b3e',{r:[0,-20,0]});
      C(P,0,1.2,.9,.07,1.8,.07,'#7b5a3a'); C(P,.3,.9,-.9,.07,1.2,.07,'#7b5a3a');
      return P;
    };
    add('Fishing boat 1',mk('#2b6e9c'),[9,0,9],[0,1.3,0]);
    add('Fishing boat 2',mk('#c0453a'),[31,0,12],[0,.4,0]);
  })();

  /* distant ship and tree lines */
  (function(){
    const P=[];
    B(P,0,1.4,0,30,2.8,7,'#59626a',{rough:.6,metal:.3}); B(P,-6,3.8,0,10,2.4,5.5,'#d8d6d0',{rough:.7}); B(P,-6,5.6,0,6,1.4,4,'#c9c6bf',{rough:.7});
    B(P,8,3.6,0,3,.6,3,'#8a3a2e'); C(P,8,5.4,0,.35,3,.35,'#44484c');
    add('Ship',P,[48,0,120]);
  })();
  (function(){
    const P=[];
    [-98,-88,-79,-70,70,80,90,97].forEach(x=>{
      C(P,x,2,-6,.8,4,.8,'#5a4632',{rough:1});
      for(let k=0;k<40;k++){ const a=rnd()*6.283, r=Math.sqrt(rnd())*4.2; card(P,x+Math.cos(a)*r,5+rnd()*2.6,-6+Math.sin(a)*r,1.8+rnd(),1.8+rnd(),rnd()<.5?'#5d8c28':'#4a7a22',30); }
    });
    add('Far trees',P);
  })();

  const k=(t,p,f)=>({t:t,p:p,f:f});
  return {
    objs:specs, duration:12,
    cam:{p:[-42,1.8,-1]}, tgt:{p:[-20,2.4,2]},
    tracks:{
      cam:[k(0,[-42,1.8,-1],40),k(6,[-14,1.7,.5],36),k(12,[8,2.0,2.5],34)],
      tgt:[k(0,[-20,2.4,2]),k(6,[6,2.6,6]),k(12,[22,3.6,16])]
    }
  };
}
const KOCHI_LOOK={preset:'kochi',az:125,el:38,sun:3.8,exposure:1.05,bloom:.35,dof:.25,focus:14,vignette:.35,grain:.04,pixar:.65,fog:.006,fov:40};
function kochiEnv(on,fresh){
  kochiOn=!!on;
  const rocks=scene.getObjectByName('rocks'); if(rocks) rocks.visible=!on;
  grid.visible=!on;
  ground.material.color.copy(lin(on?'#6f6a4c':'#3a3733'));
  const c=sun.shadow.camera, ext=on?(order.some(id=>{ const n=nodes.get(id); return n&&String(n.userData.name||'').indexOf('Scene - lb_')===0; })?26:45):18;
  Object.assign(c,{left:-ext,right:ext,top:ext,bottom:-ext,far:on?160:110}); c.updateProjectionMatrix();
  if(on&&fresh){ edit.position.set(-34,9,28); orbit.target.set(-4,2,2); orbit.update(); }
}
function isKochi(){ return order.some(id=>{ const n=nodes.get(id), nm=n?String(n.userData.name||''):''; return nm.indexOf('Kochi - ')===0||nm.indexOf('Scene - ')===0; }); }
function loadKochi(){
  if(S.recording) return;
  S.playing=false; syncPlay();
  loadProject(kochiProject());
  Object.assign(look,KOCHI_LOOK); S.duration=12;
  kochiEnv(true,true); setAspect(2.39); applyTracks(0); applyLook(); refreshLook(); markPreset();
  loadEmbedded(); renderTimeline(); renderOutliner(); renderProps(); queueSave(); toast('Fort Kochi seafront loaded.');
}
