const h=require('./hs.js');(async()=>{const {b,p}=await h.open({vp:{width:1100,height:700}});
await p.click('text=Start with an empty scene'); await p.waitForTimeout(800);
const kinds=['push','pull','crane','dolly','orbit','whip','vertigo','hand'];
for(const k of kinds){
  const r=await p.evaluate(k=>{ const S=window.__S; S.tracks={}; S.t=0; S.duration=8; window.__camMove(k); const c=S.tracks.cam, t=S.tracks.tgt; const ok=c.every(x=>x.p.every(Number.isFinite)&&Number.isFinite(x.f)); return {k,nc:c.length,nt:t.length,t0:c[0].t,t1:c[c.length-1].t,ok,p0:c[0].p.map(v=>+v.toFixed(2)),p1:c[c.length-1].p.map(v=>+v.toFixed(2)),f1:+c[c.length-1].f.toFixed(1)}; },k);
  console.log(JSON.stringify(r));
}
const st=await p.evaluate(()=>{ const r=document.getElementById('stage').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; });
for(const k of ['crane','dolly']){ for(const f of [0,1.0]){ await p.evaluate(({k,f})=>{ const S=window.__S; S.tracks={}; S.t=0; window.__camMove(k); },{k,f}); await p.fill('#tCur',String(f===0?0:Math.round(4*24))); await p.dispatchEvent('#tCur','change'); await p.waitForTimeout(1500); await p.screenshot({path:'s1r/cm_'+k+'_'+f+'.png',clip:{x:st.x,y:st.y+16,width:st.w,height:st.h-16},timeout:60000}); } }
console.log(p.errs); await b.close();})();
