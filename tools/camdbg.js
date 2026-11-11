const h=require('./hs.js');(async()=>{const {b,p}=await h.open({vp:{width:1100,height:700}});
await p.click('text=Start with an empty scene'); await p.waitForTimeout(400);
await p.click('button.mbtn:has-text("Assets")'); await p.evaluate(()=>[...document.querySelectorAll('#assetP button')].find(x=>x.textContent.includes('Scene 1: Kochi')).click()); await p.waitForTimeout(25000);
for(const t of [7.7,11.2]){ await p.fill('#tCur',String(Math.round(t*24))); await p.dispatchEvent('#tCur','change'); await p.waitForTimeout(2500); console.log(JSON.stringify(await p.evaluate(()=>window.__sp.camDbg()))); }
await b.close();})();
