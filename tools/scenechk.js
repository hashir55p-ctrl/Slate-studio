const h=require('./hs.js');(async()=>{const {b,p}=await h.open({vp:{width:1100,height:700}});
await p.click('text=Start with an empty scene'); await p.waitForTimeout(400);
await p.click('button.mbtn:has-text("Assets")'); await p.evaluate(()=>[...document.querySelectorAll('#assetP button')].find(x=>x.textContent.includes('Scene 1: Kochi')).click()); await p.waitForTimeout(25000);
await p.evaluate(()=>{ const a=document.getElementById('assetP'); if(a) a.hidden=true; window.__S.quality='final'; });
const st=await p.evaluate(()=>{ const r=document.getElementById('stage').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; });
for(const t of (process.argv[2]||'1,3,6').split(',').map(Number)){ await p.fill('#tCur',String(Math.round(t*24))); await p.dispatchEvent('#tCur','change'); await p.waitForTimeout(2500); await p.dispatchEvent('#tCur','change'); await p.waitForTimeout(2500);
 await p.screenshot({path:'s1r/sc_'+t+'.png',clip:{x:st.x,y:st.y+16,width:st.w,height:st.h-16},timeout:180000}); }
console.log(p.errs.slice(0,3)); await b.close();})();
