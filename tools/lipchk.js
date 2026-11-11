const h=require('./hs.js');(async()=>{const {b,p}=await h.open({vp:{width:900,height:600}});
await p.click('text=Start with an empty scene'); await p.waitForTimeout(400);
await p.click('button.mbtn:has-text("Assets")'); await p.evaluate(()=>[...document.querySelectorAll('#assetP button')].find(x=>x.textContent.includes('Scene 1: Kochi')).click()); await p.waitForTimeout(25000);
await p.evaluate(()=>{ window.__S.view='cam'; });
const out=[];
for(const t of [1.4,1.6,1.8,2.0,2.2,2.4,2.6]){ await p.fill('#tCur',String(Math.round(t*24))); await p.dispatchEvent('#tCur','change'); await p.waitForTimeout(1500);
 out.push(await p.evaluate(()=>{ return window.__sp.mouth('Stany'); })); }
console.log(JSON.stringify(out)); console.log(p.errs.slice(0,2)); await b.close();})();
