const h=require('./hs.js');(async()=>{const {b,p}=await h.open({vp:{width:1000,height:700}});
await p.click('text=Start with an empty scene'); await p.waitForTimeout(800);
const st=await p.evaluate(()=>{ const r=document.getElementById('stage').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; });
await p.evaluate(()=>{ window.__cr.add({name:'F',bodyType:'feminine',waist:.85,hips:1.15,bust:1.1,shirt:'#b03f6f',hair:'long'}); });
await p.waitForTimeout(2500); await p.mouse.move(st.x+300,st.y+200); await p.evaluate(()=>window.__cr.frame('F',2.6)); await p.waitForTimeout(2500);
await p.screenshot({path:'/tmp/cr.png',clip:{x:st.x,y:st.y+16,width:st.w,height:st.h-16},timeout:120000});
console.log(p.errs.slice(0,4)); await b.close();})();
