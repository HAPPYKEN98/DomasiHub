import {requireAuth} from './lib/guard.js';
import {supabase} from './lib/supabase.js';
import {escapeHTML} from './lib/security.js';
import {schemaHint} from './lib/format.js';

const list=document.querySelector('#noticeList');
const status=document.querySelector('#noticeStatus');

function item(x,kind){
  const unread=kind==='alert'&&!x.read_at;
  const href=x.link||'#';
  return `<a class="card" data-id="${escapeHTML(x.id||'')}" data-kind="${kind}" href="${escapeHTML(href)}"><div class="card-content"><div class="row"><span class="chip">${escapeHTML(kind==='bulletin'?x.notice_type||'Campus':unread?'New':'Alert')}</span><span class="muted">${new Date(x.created_at).toLocaleDateString()}</span></div><h3>${escapeHTML(x.title)}</h3><p class="muted">${escapeHTML(x.body||x.description||'')}</p></div></a>`;
}

async function load(){
  if(!list)return;
  const s=await requireAuth();
  if(!s)return;
  status.textContent='Loading alerts...';
  const [{data:notes,error:nErr},{data:bulletins,error:bErr}]=await Promise.all([
    supabase.from('notifications').select('*').order('created_at',{ascending:false}).limit(40),
    supabase.from('bulletins').select('*').order('created_at',{ascending:false}).limit(20)
  ]);
  if(nErr||bErr){status.textContent=schemaHint(nErr||bErr);list.innerHTML='';return}
  const rows=[
    ...(notes||[]).map(x=>item(x,'alert')),
    ...(bulletins||[]).map(x=>item(x,'bulletin'))
  ];
  if(!rows.length){status.textContent='You have no new notifications.';list.innerHTML='';return}
  status.textContent=`${rows.length} update${rows.length===1?'':'s'}`;
  list.innerHTML=rows.join('');
}

list?.addEventListener('click',async e=>{
  const a=e.target.closest('a[data-kind="alert"][data-id]');
  if(!a?.dataset.id)return;
  await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('id',a.dataset.id);
});

load();
