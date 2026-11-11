const h=require('./hs.js');(async()=>{const {b,p}=await h.open({vp:{width:700,height:520}});
await p.click('text=Start with an empty scene'); await p.waitForTimeout(800);
const st=await p.evaluate(()=>{ const r=document.getElementById('stage').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; });
await p.evaluate(()=>window.__sp.lineup()); await p.waitForTimeout(6000);
await p.evaluate(()=>{ window.__S.quality='final'; window.__look.pixar=.65; window.__pxsync(); window.__rc(); });
for(const e of (process.argv[2]||"0,1,2,3").split(",").map(Number)){ await p.evaluate(a=>window.__sp.faceCam(a[0],a[1],1.64),[e,+(process.argv[3]||.34)]); await p.waitForTimeout(3500);
 await p.screenshot({path:'s1r/head'+e+'.png',clip:{x:st.x,y:st.y+16,width:st.w,height:st.h-16},timeout:120000}); }
console.log(p.errs.slice(0,2)); await b.close();})();
