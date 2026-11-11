const h=require('./hs.js');(async()=>{const {b,p}=await h.open({vp:{width:1100,height:700}});
await p.click('text=Start with an empty scene'); await p.waitForTimeout(400);
await p.click('button.mbtn:has-text("Assets")'); await p.evaluate(()=>[...document.querySelectorAll('#assetP button')].find(x=>x.textContent.includes('Scene 1: Kochi')).click()); await p.waitForTimeout(25000);
await p.evaluate(()=>{ const a=document.getElementById('assetP'); if(a) a.hidden=true; });
const st=await p.evaluate(()=>{ const r=document.getElementById('stage').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; });
const t=+(process.argv[2]||6);
for(const v of [0,0.8]){ await p.evaluate(v=>{ window.__look.pixar=v; window.__S.quality='final'; window.__pxsync(); },v); await p.fill('#tCur',String(Math.round(t*24))); await p.dispatchEvent('#tCur','change'); await p.waitForTimeout(3000);
 await p.evaluate(()=>{ const e=document.querySelector('#tCur'); e.dispatchEvent(new Event('change')); }); await p.waitForTimeout(2500);
 await p.screenshot({path:'s1r/px'+v+'_'+t+'.png',clip:{x:st.x,y:st.y+16,width:st.w,height:st.h-16},timeout:180000}); }
console.log(p.errs); await b.close();})();
