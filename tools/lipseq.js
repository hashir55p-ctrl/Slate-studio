const h=require('./hs.js');(async()=>{const {b,p}=await h.open({vp:{width:1100,height:700}});
await p.click('text=Start with an empty scene'); await p.waitForTimeout(400);
await p.click('button.mbtn:has-text("Assets")'); await p.evaluate(()=>[...document.querySelectorAll('#assetP button')].find(x=>x.textContent.includes('Scene 1: Kochi')).click()); await p.waitForTimeout(25000);
await p.evaluate(()=>{ const a=document.getElementById('assetP'); if(a) a.hidden=true; window.__S.quality='final'; });
const st=await p.evaluate(()=>{ const r=document.getElementById('stage').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; });
const ts=[1.4,1.6,1.8,2.0,2.2,2.4,2.6,2.7]; let i=0;
for(const t of ts){ await p.fill('#tCur',String(Math.round(t*24))); await p.dispatchEvent('#tCur','change'); await p.waitForTimeout(800); await p.evaluate(()=>window.__sp.faceOf('Stany',.4,-.02)); await p.waitForTimeout(1200); await p.dispatchEvent('#tCur','change'); await p.waitForTimeout(1200);
 await p.screenshot({path:'s1r/lip'+(i++)+'.png',clip:{x:st.x+st.w*.3,y:st.y+16+st.h*.05,width:st.w*.4,height:st.h*.8},timeout:120000}); }
console.log(p.errs.slice(0,2)); await b.close();})();
