const PJS_PREFIX='hkcomms1-';
const MAX_HISTORY=100;

let me={id:'',name:'',isHost:false};
let room={code:'',hostId:'',members:{}};
let peer=null,conns={},hostConn=null,history=[],leaving=false;

function genCode(){const c='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let r='';for(let i=0;i<4;i++)r+=c[Math.floor(Math.random()*c.length)];return r;}
function genClientId(){return PJS_PREFIX+'c'+Math.random().toString(36).slice(2,10);}
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));document.getElementById(id).classList.remove('hidden');}
function err(msg){const el=document.getElementById('landing-error');el.textContent=msg;setTimeout(()=>{if(el.textContent===msg)el.textContent='';},5000);}
function escapeHtml(s){const d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
function send(conn,obj){if(conn&&conn.open){try{conn.send(obj);}catch(e){}}}
function broadcast(obj){Object.values(conns).forEach(c=>send(c,obj));}
function now(){const d=new Date();return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');}
