/* ---------- captions: comic-style subtitles drawn inside the render camera so they appear in the exported video ---------- */
const CAP={mesh:null,tex:null,cv:null,cx:null,key:'',show:false};
const VO={on:true,last:0,voices:null,prof:{Stany:{p:1.05,r:1.0,i:0},Jesvin:{p:.9,r:.95,i:1},Renjith:{p:.7,r:.9,i:2},Hashir:{p:1.3,r:1.05,i:3},'All four':{p:1.1,r:1.1,i:0},'':{p:.75,r:.88,i:1}}};
function voPick(i){ try{ if(!VO.voices||!VO.voices.length){ const all=speechSynthesis.getVoices()||[]; const en=all.filter(v=>/^en[-_]IN/i.test(v.lang)); const gb=all.filter(v=>/^en/i.test(v.lang)); VO.voices=en.length?en.concat(gb.filter(v=>en.indexOf(v)<0)):gb; } return VO.voices.length?VO.voices[i%VO.voices.length]:null; }catch(e){ return null; } }
function voStop(){ try{ speechSynthesis.cancel(); }catch(e){} }
function voUpdate(t){
  if(!VO.on||typeof speechSynthesis==='undefined'||!S.caps||!S.caps.length) return;
  if(!S.playing||t<VO.last-.05){ if(VO.last!==t) voStop(); VO.last=t; return; }
  for(const c of S.caps){ if(c.t0>VO.last&&c.t0<=t&&t-c.t0<.6){ const f=VO.prof[c.who]||{p:1,r:1,i:0}; try{ const u=new SpeechSynthesisUtterance(c.text); const v=voPick(f.i); if(v){ u.voice=v; u.lang=v.lang; } else u.lang='en-IN'; u.pitch=f.p; const dur=Math.max(.6,c.t1-c.t0); u.rate=Math.max(.8,Math.min(1.6,c.text.length/15/dur*f.r)); u.volume=1; speechSynthesis.speak(u); }catch(e){} } }
  VO.last=t;
}
function voToggle(){ VO.on=!VO.on; if(!VO.on) voStop(); toast(VO.on?'Voices on':'Voices off'); }
function capToggle(){ CAP.show=!CAP.show; CAP.key=''; toast(CAP.show?'Subtitles on':'Subtitles off'); }
function capData(){ if(!Array.isArray(S.caps)) S.caps=[]; return S.caps; }
function capEnsure(){
  if(CAP.mesh) return true;
  try{
    const cv=document.createElement('canvas'); cv.width=1280; cv.height=260; CAP.cv=cv; CAP.cx=cv.getContext('2d');
    CAP.tex=new THREE.CanvasTexture(cv); CAP.tex.minFilter=THREE.LinearFilter; CAP.tex.generateMipmaps=false;
    const m=new THREE.MeshBasicMaterial({map:CAP.tex,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,fog:false});
    CAP.mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,260/1280),m); CAP.mesh.renderOrder=9999; CAP.mesh.frustumCulled=false; CAP.mesh.visible=false;
    cinema.add(CAP.mesh); if(!cinema.parent) scene.add(cinema);
    return true;
  }catch(e){ return false; }
}
function capDraw(c){
  const x=CAP.cx, W=1280, H=260; x.clearRect(0,0,W,H);
  const narr=!c.who, size=narr?50:54; x.font=(narr?'italic 600 ':'700 ')+size+'px Georgia, "Times New Roman", serif';
  const words=String(c.text||'').split(/\s+/), lines=[]; let cur='';
  words.forEach(w=>{ const t=cur?cur+' '+w:w; if(x.measureText(t).width>1090&&cur){ lines.push(cur); cur=w; } else cur=t; }); if(cur) lines.push(cur);
  const lh=size*1.2, bh=lines.length*lh+34, bw=Math.min(1200,Math.max(...lines.map(l=>x.measureText(l).width))+90), bx=(W-bw)/2, by=H-bh-14;
  const rr=(a,b,w,h,r)=>{ x.beginPath(); x.moveTo(a+r,b); x.arcTo(a+w,b,a+w,b+h,r); x.arcTo(a+w,b+h,a,b+h,r); x.arcTo(a,b+h,a,b,r); x.arcTo(a,b,a+w,b,r); x.closePath(); };
  rr(bx,by,bw,bh,narr?10:34); x.fillStyle=narr?'rgba(232,214,170,.95)':'rgba(252,249,240,.96)'; x.fill(); x.lineWidth=5; x.strokeStyle='#1a1410'; x.stroke();
  x.fillStyle='#1a1410'; x.textAlign='center'; x.textBaseline='middle'; lines.forEach((l,i)=>x.fillText(l,W/2,by+17+lh*(i+.5)));
  if(!narr){ const lab=String(c.who).toUpperCase(); x.font='700 28px Georgia, serif'; const lw=x.measureText(lab).width+36; rr(bx+24,by-20,lw,38,10); x.fillStyle='#f2c23a'; x.fill(); x.lineWidth=4; x.strokeStyle='#1a1410'; x.stroke(); x.fillStyle='#1a1410'; x.textAlign='left'; x.fillText(lab,bx+42,by-1); }
  CAP.tex.needsUpdate=true;
}
function capUpdate(t){
  voUpdate(t);
  const list=S.caps; if(!list||!list.length){ if(CAP.mesh) CAP.mesh.visible=false; return; }
  if(!capEnsure()) return;
  const on=CAP.show&&(S.view==='cam'||S.recording); let c=null; if(on) for(let i=0;i<list.length;i++){ if(t>=list[i].t0&&t<=list[i].t1){ c=list[i]; break; } }
  if(!c){ CAP.mesh.visible=false; CAP.key=''; return; }
  const key=c.who+'|'+c.text; if(key!==CAP.key){ CAP.key=key; capDraw(c); }
  const vh=2*Math.tan(cinema.fov*Math.PI/360), vw=vh*cinema.aspect, w=Math.min(vw*.9,vh*cinema.aspect), h=w*260/1280;
  CAP.mesh.scale.set(w,w,1); CAP.mesh.position.set(0,-vh/2+h/2+vh*.035,-1); CAP.mesh.visible=true;
}
function setCaptions(d,replace){
  const num=(v,a,lo,hi)=>{ v=+v; return isFinite(v)?Math.max(lo,Math.min(hi,v)):a; }, out=replace===false?capData():(S.caps=[]);
  (Array.isArray(d.lines)?d.lines:[]).slice(0,300).forEach(q=>{ if(q&&q.text) out.push({t0:num(q.t0,0,0,3600),t1:num(q.t1,3,0,3600),who:String(q.who||'').slice(0,24),text:String(q.text).slice(0,160)}); });
  out.sort((a,b)=>a.t0-b.t0); CAP.key=''; queueSave&&queueSave(); return {lines:out.length};
}
