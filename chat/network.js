async function createRoom(){
  const name=document.getElementById('name-input').value.trim();
  if(!name)return err('Enter your name first');
  if(typeof Peer==='undefined')return err('Network library failed to load');
  document.getElementById('landing-error').innerHTML='<span class="spinner"></span>Connecting...';
  me.name=name;me.isHost=true;

  let attempts=0;
  while(attempts<6){
    const code=genCode();
    const peerId=PJS_PREFIX+code;
    const result=await new Promise(resolve=>{
      const p=new Peer(peerId,PEER_OPTS);
      const t=setTimeout(()=>{try{p.destroy();}catch(e){}resolve({fatal:true});},10000);
      p.on('open',()=>{clearTimeout(t);resolve({ok:true,p,code});});
      p.on('error',e=>{
        clearTimeout(t);
        if(e.type==='unavailable-id'){try{p.destroy();}catch(_){}resolve({retry:true});}
        else{try{p.destroy();}catch(_){}resolve({fatal:true});}
      });
    });
    if(result.ok){
      peer=result.p;room.code=result.code;me.id=peerId;room.hostId=me.id;
      room.members[me.id]={name:me.name};
      peer.on('connection',c=>setupHostConn(c));
      peer.on('error',()=>{});
      document.getElementById('landing-error').textContent='';
      enterChat();
      pushSystem(me.name+' opened the room');
      return;
    }
    if(result.fatal){document.getElementById('landing-error').textContent='';return err('Could not connect to network');}
    attempts++;
  }
  document.getElementById('landing-error').textContent='';
  err('All codes taken, try again');
}

function setupHostConn(conn){
  conn.on('open',()=>{conns[conn.peer]=conn;});
  conn.on('data',d=>hostOnMessage(conn,d));
  conn.on('close',()=>{
    delete conns[conn.peer];
    const m=room.members[conn.peer];
    if(m){delete room.members[conn.peer];broadcastMembers();pushSystem(m.name+' left');}
  });
  conn.on('error',()=>{});
}

function hostOnMessage(conn,m){
  if(!m||!m.type)return;
  if(m.type==='JOIN'){
    const nm=String(m.name||'Guest').slice(0,14);
    room.members[conn.peer]={name:nm};
    send(conn,{type:'MEMBERS',members:room.members,hostId:room.hostId});
    send(conn,{type:'HISTORY',messages:history});
    broadcastMembers();
    pushSystem(nm+' joined');
  }else if(m.type==='CHAT'){
    const nm=(room.members[conn.peer]&&room.members[conn.peer].name)||'Guest';
    pushChat(nm,String(m.text||'').slice(0,500));
  }
}

function broadcastMembers(){broadcast({type:'MEMBERS',members:room.members,hostId:room.hostId});renderMembers();}

function pushChat(who,text){
  if(!text.trim())return;
  const msg={kind:'chat',who,text,time:now()};
  history.push(msg);if(history.length>MAX_HISTORY)history.shift();
  broadcast({type:'CHAT_BC',msg});renderMessage(msg);
}
function pushSystem(text){
  const msg={kind:'system',text,time:now()};
  history.push(msg);if(history.length>MAX_HISTORY)history.shift();
  broadcast({type:'CHAT_BC',msg});renderMessage(msg);
}

async function joinRoom(){
  const name=document.getElementById('name-input').value.trim();
  if(!name)return err('Enter your name first');
  const code=document.getElementById('code-input').value.trim().toUpperCase();
  if(code.length!==4)return err('Invalid room code');
  if(typeof Peer==='undefined')return err('Network library failed to load');
  document.getElementById('landing-error').innerHTML='<span class="spinner"></span>Connecting...';
  me.name=name;me.isHost=false;me.id=genClientId();room.code=code;

  peer=new Peer(me.id,PEER_OPTS);
  const opened=await new Promise(resolve=>{
    const t=setTimeout(()=>resolve(false),10000);
    peer.on('open',()=>{clearTimeout(t);resolve(true);});
    peer.on('error',()=>{clearTimeout(t);resolve(false);});
  });
  if(!opened){document.getElementById('landing-error').textContent='';try{peer.destroy();}catch(_){}peer=null;return err('Could not connect to network');}

  let ok=false,triesLeft=2,curTimeout=null,failMsg='Could not reach host';
  const giveUp=()=>{
    if(ok)return;
    document.getElementById('landing-error').textContent='';
    err(failMsg);
    try{peer.destroy();}catch(_){}peer=null;
  };
  const retryOrFail=()=>{
    if(ok||!peer)return;
    clearTimeout(curTimeout);
    if(triesLeft>0){triesLeft--;setTimeout(attempt,800);}
    else{giveUp();}
  };

  // The public PeerJS broker occasionally reports the host as unavailable even
  // when it is online, so retry the connection a few times before giving up.
  function attempt(){
    if(ok||!peer)return;
    const conn=peer.connect(PJS_PREFIX+code,{reliable:true});
    curTimeout=setTimeout(()=>{failMsg='Room not found or host offline';try{conn.close();}catch(_){}retryOrFail();},8000);

    conn.on('open',()=>{
      ok=true;clearTimeout(curTimeout);hostConn=conn;
      send(conn,{type:'JOIN',name:me.name});
      document.getElementById('landing-error').textContent='';
      enterChat();
    });
    conn.on('data',d=>clientOnMessage(d));
    conn.on('close',()=>{if(ok&&!leaving){renderMessage({kind:'system',text:'Disconnected from host',time:now()});setTimeout(leaveRoom,1200);}});
    conn.on('error',()=>retryOrFail());
  }

  // peer-unavailable is emitted on the peer (not the connection); treat it as a
  // failed attempt and retry. Other errors mean the broker itself is unreachable.
  peer.on('error',e=>{
    if(ok)return;
    if(e&&e.type==='peer-unavailable')retryOrFail();
    else giveUp();
  });

  attempt();
}

function clientOnMessage(m){
  if(!m||!m.type)return;
  switch(m.type){
    case 'MEMBERS':room.members=m.members||{};room.hostId=m.hostId;renderMembers();break;
    case 'HISTORY':(m.messages||[]).forEach(renderMessage);break;
    case 'CHAT_BC':if(m.msg)renderMessage(m.msg);break;
    case 'REJECT':err(m.reason||'Connection rejected');leaveRoom();break;
  }
}

function sendMessage(){
  const input=document.getElementById('msg-input');
  const text=input.value.trim();
  if(!text)return;
  input.value='';
  if(me.isHost)pushChat(me.name,text);
  else send(hostConn,{type:'CHAT',text});
}

function leaveRoom(){
  leaving=true;
  try{Object.values(conns).forEach(c=>c.close());}catch(_){}
  try{if(hostConn)hostConn.close();}catch(_){}
  try{if(peer)peer.destroy();}catch(_){}
  peer=null;conns={};hostConn=null;history=[];
  me={id:'',name:me.name,isHost:false};
  room={code:'',hostId:'',members:{}};
  show('landing');
}
