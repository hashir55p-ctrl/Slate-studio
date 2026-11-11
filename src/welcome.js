/* ---------- welcome screen, project copy and paste ---------- */
(function(){ const st=document.createElement('style'); st.textContent='#welcome,#pasteBox{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);padding:16px}#welcome[hidden],#pasteBox[hidden]{display:none}.wcard{max-width:540px;width:100%;max-height:92vh;overflow:auto;background:var(--area,#2b2b2b);color:var(--fg,#eee);border-radius:10px;padding:18px;box-shadow:0 10px 40px rgba(0,0,0,.55);font:14px/1.45 system-ui,sans-serif}.wcard h2{margin:0 0 4px;font-size:21px}.wcard p{margin:6px 0;font-size:13px;opacity:.9}.wcard .wg{display:grid;gap:8px;margin:12px 0}.wcard button{min-height:46px;border-radius:7px;border:0;background:var(--btn,#444);color:inherit;font-size:14px;text-align:left;padding:8px 12px;cursor:pointer}.wcard button.hi{background:var(--accent,#e87d0d);color:#111;font-weight:600}.wcard button small{display:block;font-weight:400;opacity:.75;font-size:12px}.wcard ul{margin:6px 0 0;padding-left:18px;font-size:13px}.wcard textarea{width:100%;min-height:150px;box-sizing:border-box;background:rgba(0,0,0,.3);color:inherit;border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:8px;font:12px monospace}'; document.head.appendChild(st); })();
function wcBtn(t,s,fn,hi){ const b=document.createElement('button'); b.type='button'; if(hi) b.className='hi'; b.innerHTML=t+(s?'<small>'+s+'</small>':''); b.addEventListener('click',fn); return b; }
function newEmptyScene(){
  if(S.recording) return; S.playing=false; syncPlay(); scEnd();
  loadProject({objs:[],cam:{p:[0,2.2,8]},tgt:{p:[0,1,0]},tracks:{},duration:8});
  kochiEnv(false); applyPreset('studio'); setAspect(1.78); refreshScene(); saveNow();
}
function showWelcome(){
  let w=document.getElementById('welcome'); if(w){ w.remove(); }
  w=document.createElement('div'); w.id='welcome'; const c=document.createElement('div'); c.className='wcard'; w.appendChild(c);
  const close=()=>{ w.remove(); };
  const go=fn=>()=>{ close(); try{ fn(); }catch(err){ toast((err&&err.message)||'Could not load that.'); } };
  c.innerHTML='<h2>Slate Studio</h2><p>Make 3D models and cinematic animation right in your browser, with sculpting, rigging, keyframes and film-style rendering. Your work saves automatically on this device and only you can see it.</p>';
  const g=document.createElement('div'); g.className='wg';
  g.append(
    wcBtn('Start with the demo scene','A few shapes and a figure to play with',go(()=>{ loadProject(demoProject()); kochiEnv(false); refreshScene(); }),true),
    wcBtn('Start with an empty scene','Build everything yourself',go(newEmptyScene)),
    wcBtn('Example: library hall','A dark cinematic interior with a walking character',go(loadLibrary)),
    wcBtn('Example: realistic character','A rigged person you can pose and make walk',go(loadRealCharacter)),
    wcBtn('Example: Fort Kochi seafront','A realistic outdoor street scene',go(loadKochi)));
  c.appendChild(g);
  const tips=document.createElement('div'); tips.innerHTML='<b>How to make your own models</b><ul><li><b>Sculpt tab:</b> add a clay shape and push, pull and smooth it with your finger. You can float a reference image over it.</li><li><b>Add menu and tools:</b> boxes, spheres, lights, and a Person figure.</li><li><b>Ask Claude (when opened inside Claude):</b> describe a model or scene and it builds it.</li><li><b>Rig and pose tab:</b> pose the skeleton, keyframe it, or tap Make it walk.</li><li><b>Output tab:</b> render your animation to a video.</li><li><b>Move a project:</b> File menu, Copy project, then paste it on another device.</li></ul>';
  c.appendChild(tips);
  c.appendChild(wcBtn('Close','Reopen any time from the File menu, Welcome',close));
  document.body.appendChild(w);
}
function projectCopy(){
  saveNow(); let txt=''; try{ txt=localStorage.getItem(STORE)||''; }catch(e){}
  if(!txt){ toast('Nothing to copy yet.'); return; }
  const ok=()=>toast('Project copied ('+Math.round(txt.length/1024)+' KB). Paste it with Open project from pasted text.');
  try{ navigator.clipboard.writeText(txt).then(ok).catch(()=>showProjectPaste(txt)); }catch(e){ showProjectPaste(txt); }
}
function showProjectPaste(prefill){
  let w=document.getElementById('pasteBox'); if(w) w.remove();
  w=document.createElement('div'); w.id='pasteBox'; const c=document.createElement('div'); c.className='wcard'; w.appendChild(c);
  const ta=document.createElement('textarea'); ta.setAttribute('aria-label','Project text'); ta.placeholder='Paste project text here'; if(typeof prefill==='string') ta.value=prefill;
  c.innerHTML='<h2>Project text</h2><p>'+(typeof prefill==='string'?'Select all and copy this text to keep your project.':'Paste a project you copied earlier. This replaces the current scene.')+'</p>';
  c.appendChild(ta);
  const g=document.createElement('div'); g.className='wg';
  if(typeof prefill!=='string') g.appendChild(wcBtn('Open this project','',()=>{
    try{ const d=JSON.parse(ta.value.trim()); if(!d||!Array.isArray(d.objs)||!d.cam||!d.tgt) throw new Error('That is not a Slate Studio project.');
      S.playing=false; syncPlay(); scEnd(); loadProject(d); if(d.look) Object.assign(look,d.look); if(!PRESETS[look.preset]) look.preset='golden'; if(d.aspect) setAspect(d.aspect);
      kochiEnv(isKochi(),false); applyLook(); refreshLook(); refreshScene(); saveNow(); w.remove(); toast('Project opened.'); }
    catch(err){ toast(err.message||'Could not read that text.'); } },true));
  g.appendChild(wcBtn('Close','',()=>w.remove())); c.appendChild(g); document.body.appendChild(w); if(typeof prefill==='string'){ ta.focus(); ta.select(); }
}
