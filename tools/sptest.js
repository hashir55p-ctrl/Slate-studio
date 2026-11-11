const h=require('./hs.js');(async()=>{const {b,p}=await h.open({vp:{width:1100,height:700}});
await p.click('text=Start with an empty scene'); await p.waitForTimeout(800);
const r=await p.evaluate(async()=>{
  const sp=window.__sp; sp.scNew('sphere'); await new Promise(r=>setTimeout(r,800)); sp.scAlign('front'); await new Promise(r=>setTimeout(r,500));
  const cv=document.createElement('canvas'); cv.width=600; cv.height=800; const c=cv.getContext('2d'); c.fillStyle='#e8e8e8'; c.fillRect(0,0,600,800);
  c.fillStyle='#8a5a44'; c.beginPath(); c.ellipse(300,330,150,230,0,0,Math.PI*2); c.fill(); c.fillRect(255,500,90,150); c.beginPath(); c.ellipse(300,700,270,90,0,0,Math.PI*2); c.fill();
  const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',.92)); sp.scGuideSet(blob); await new Promise(r=>setTimeout(r,1500));
  const m=sp.spMask(); const out={mask:!!m}; if(m){ let v=[]; for(let y=0;y<m.H;y+=24) v.push(isNaN(m.xl[y])?null:[+m.xl[y].toFixed(2),+m.xr[y].toFixed(2)]); out.rows=v; }
  const r1=sp.spMatch(); await new Promise(r=>setTimeout(r,300)); const r2=sp.spMatch();
  if(r1&&r2){ const err=(res)=>{ let s=0,c=0; for(let b=res.first+3;b<=res.last-3;b++){ s+=Math.abs(res.mL[b]-res.pL[b])+Math.abs(res.mR[b]-res.pR[b]); c+=2; } return +(s/c).toFixed(1); }; out.errBefore=err(r1); out.errAfter=err(r2); out.moved=[r1.moved,r2.moved]; }
  return out; });
console.log(JSON.stringify(r)); console.log(p.errs); await p.screenshot({path:'s1r/sp1.png'}); await b.close();})();
