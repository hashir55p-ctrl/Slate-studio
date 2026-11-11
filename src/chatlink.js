/* ---------- chat link: Claude in chat can edit this studio live (owner only) ---------- */
const chatLink={on:false,last:'',busy:false,db:null,unsub:null};
async function chatLinkStart(){
  try{
    if(chatLink.on||!window.claude||!window.claude.use||window.slateStandalone) return;
    const user=await window.claude.use('user'); if(!user||!(await user.isOwner())) return;
    const db=await window.claude.use('db'); if(!db) return;
    chatLink.db=db; try{ chatLink.last=localStorage.getItem('slate-inbox-last')||''; }catch(e){}
    chatLink.unsub=db.doc('inbox/cmd').onSnapshot(s=>{ try{ if(s&&s.exists) chatRun(s.data()); }catch(e){} },()=>{});
    chatLink.on=true; setTimeout(()=>toast('Chat link connected. Claude in chat can now edit this studio.'),1200);
  }catch(e){}
}
function chatLinkToggle(){
  if(!chatLink.db){ toast('Chat link needs this page open inside Claude, signed in as the owner.'); return; }
  if(chatLink.on){ try{ chatLink.unsub&&chatLink.unsub(); }catch(e){} chatLink.on=false; toast('Chat link paused.'); }
  else { chatLink.unsub=chatLink.db.doc('inbox/cmd').onSnapshot(s=>{ try{ if(s&&s.exists) chatRun(s.data()); }catch(e){} },()=>{}); chatLink.on=true; toast('Chat link on.'); }
}
async function chatRun(d){
  if(!chatLink.on||!d||!d.id||String(d.id)===chatLink.last||chatLink.busy) return;
  chatLink.busy=true; chatLink.last=String(d.id); try{ localStorage.setItem('slate-inbox-last',chatLink.last); }catch(e){}
  const results=[]; let ok=true;
  try{
    const by={}; aiTools().forEach(t=>{ by[t.name]=t; });
    for(const c of (Array.isArray(d.calls)?d.calls:[]).slice(0,60)){
      try{
        if(c.tool==='load_example'){ const w=c.input&&c.input.name; if(w==='library_hall') loadLibrary(); else if(w==='character') loadRealCharacter(); else if(w==='stany') loadStany(); else if(w==='renjith') loadRenjith(); else if(w==='hashir') loadHashir(); else if(w==='friends') loadFriends(); else if(w==='kochi') loadKochi(); else if(w==='empty') newEmptyScene(); else throw new Error('unknown example'); results.push({tool:c.tool,ok:true}); continue; }
        if(c.tool==='add_prop'){ const i=c.input||{}; addPropAsset(String(i.asset||''),{p:i.p,r:i.r,s:i.s,name:i.name}); results.push({tool:c.tool,ok:true}); continue; }
        if(c.tool==='add_jeep'){ jeepAdd(c.input||{}); results.push({tool:c.tool,ok:true}); continue; }
        if(c.tool==='drive_jeep'){ const r=jeepDrive(c.input||{}); results.push({tool:c.tool,ok:true,result:r}); continue; }
        if(c.tool==='jeep_demo'){ jeepDemo(); results.push({tool:c.tool,ok:true}); continue; }
        if(c.tool==='set_audio'){ const r=setAudio(c.input||{},(c.input&&c.input.replace)!==false); results.push({tool:c.tool,ok:true,result:r}); continue; }
        if(c.tool==='scene1'){ scene1(); results.push({tool:c.tool,ok:true}); continue; }
        if(c.tool==='set_captions'){ const r=setCaptions(c.input||{},(c.input&&c.input.replace)!==false); results.push({tool:c.tool,ok:true,result:r}); continue; }
        if(c.tool==='play'){ S.playing=!(c.input&&c.input.stop); syncPlay(); results.push({tool:c.tool,ok:true}); continue; }
        const t=by[c.tool]; if(!t) throw new Error('unknown tool '+c.tool);
        const r=await t.execute(c.input||{}); results.push({tool:c.tool,ok:true,result:r});
      }catch(e){ ok=false; results.push({tool:c.tool,ok:false,error:String((e&&e.message)||e).slice(0,300)}); }
    }
    refreshScene(); saveNow();
  }catch(e){ ok=false; results.push({ok:false,error:String((e&&e.message)||e)}); }
  chatLink.busy=false;
  try{ await chatLink.db.doc('inbox/status').set({id:String(d.id),ok:ok,count:results.length,results:JSON.stringify(results).slice(0,8000),at:Date.now()}); }catch(e){}
  toast(ok?'Claude in chat updated the studio.':'Claude in chat applied some changes; some failed.');
}
