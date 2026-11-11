const {chromium}=require('playwright');const fs=require('fs');
const R='/home/claude/mrdoob/three.js/';
exports.open=async(opts={})=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage({viewport:opts.vp||{width:1280,height:800}}); p.errs=[]; p.on('pageerror',e=>p.errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') p.errs.push('console: '+m.text()); });
 await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/(.*)/,r=>{ const m=r.request().url().match(/three@0\.128\.0\/(.*)$/)[1]; const f=R+m; if(fs.existsSync(f)) r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}); else { p.errs.push('missing three file '+m); r.abort(); } });
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await p.goto('http://localhost:8765/studio.html#dev'); await p.waitForTimeout(2500); return {b,p};
};
