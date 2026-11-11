const h=require('./hs.js');(async()=>{const {b,p}=await h.open({vp:{width:1100,height:700}});
await p.click('text=Start with an empty scene'); await p.waitForTimeout(800);
const st=await p.evaluate(()=>{ const r=document.getElementById('stage').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; });
await p.evaluate(()=>window.__sp.lineup()); await p.waitForTimeout(6000);
await p.evaluate(()=>{ window.__S.quality='final'; window.__look.pixar=.65; window.__pxsync(); }); await p.waitForTimeout(3000);
await p.screenshot({path:'s1r/lineup_now.png',clip:{x:st.x,y:st.y+16,width:st.w,height:st.h-16},timeout:120000});
console.log(p.errs.slice(0,3)); await b.close();})();
