window.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('btn-create').addEventListener('click',createRoom);
  document.getElementById('btn-join-show').addEventListener('click',()=>{
    document.getElementById('join-section').classList.remove('hidden');
    document.getElementById('code-input').focus();
  });
  document.getElementById('btn-join').addEventListener('click',joinRoom);
  document.getElementById('btn-leave').addEventListener('click',leaveRoom);
  document.getElementById('btn-send').addEventListener('click',sendMessage);

  document.getElementById('name-input').addEventListener('keydown',e=>{if(e.key==='Enter')createRoom();});
  document.getElementById('code-input').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase();});
  document.getElementById('code-input').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom();});
  document.getElementById('msg-input').addEventListener('keydown',e=>{if(e.key==='Enter')sendMessage();});

  document.getElementById('room-code-display').addEventListener('click',()=>{
    if(!room.code)return;
    navigator.clipboard?.writeText(room.code).then(()=>{
      const el=document.getElementById('room-code-display');
      const old=el.style.color;el.style.color='var(--accent)';
      setTimeout(()=>el.style.color=old,600);
    });
  });
});

window.addEventListener('beforeunload',()=>{try{if(peer)peer.destroy();}catch(_){}});
