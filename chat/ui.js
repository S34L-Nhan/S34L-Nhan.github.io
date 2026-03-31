function enterChat(){
  leaving=false;show('chat');
  document.getElementById('room-code-display').textContent=room.code;
  document.getElementById('messages').innerHTML='';
  document.getElementById('msg-input').disabled=false;
  document.getElementById('msg-input').focus();
  renderMembers();
}

function renderMembers(){
  const list=document.getElementById('member-list');list.innerHTML='';
  Object.entries(room.members).forEach(([id,m])=>{
    const isHost=id===room.hostId,isMe=id===me.id;
    const el=document.createElement('div');el.className='member';
    el.innerHTML=`<span class="dot"></span><span class="nm">${escapeHtml(m.name)}${isMe?' (you)':''}</span>`+(isHost?`<span class="tag">Host</span>`:'');
    list.appendChild(el);
  });
}

function renderMessage(msg){
  const box=document.getElementById('messages');
  const nearBottom=box.scrollHeight-box.scrollTop-box.clientHeight<80;
  const el=document.createElement('div');
  if(msg.kind==='system'){
    el.className='msg system';el.textContent=msg.text;
  }else{
    const isMe=msg.who===me.name;
    el.className='msg'+(isMe?' mine':'');
    el.innerHTML=`<div class="who">${escapeHtml(msg.who)}</div><div class="txt">${escapeHtml(msg.text)}</div><div class="time">${escapeHtml(msg.time||'')}</div>`;
  }
  box.appendChild(el);
  if(nearBottom)box.scrollTop=box.scrollHeight;
}
