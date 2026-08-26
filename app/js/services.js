import {requireAuth} from './lib/guard.js';
import {profile} from './lib/auth.js';
import {supabase} from './lib/supabase.js';
import {escapeHTML} from './lib/security.js';
import {message,loading} from './lib/ui.js';
import {money, schemaHint, waLink, searchTerm} from './lib/format.js';

const grid=document.querySelector('#serviceGrid');
const status=document.querySelector('#serviceStatus');
const search=document.querySelector('#serviceSearch');
const form=document.querySelector('#serviceForm');
const out=document.querySelector('#formMessage');
const btn=document.querySelector('#serviceButton');
if(form)requireAuth();

function card(x){
  const wa=waLink(x.contact_number,`Hi ${x.provider_name||''}, I found your service "${x.service_title}" on Domasi Hub.`);
  return `<article class="card"><div class="card-content"><div class="row"><span class="chip">${escapeHTML(x.skill_category||'Service')}</span><span class="price">${money(x.starting_price)}</span></div><h3>${escapeHTML(x.service_title)}</h3><p class="muted">${escapeHTML(x.provider_name||'Student')}</p>${x.description?`<p>${escapeHTML(x.description)}</p>`:''}${wa?`<div class="actions"><a class="btn btn-primary" href="${escapeHTML(wa)}" target="_blank" rel="noopener">WhatsApp</a></div>`:''}</div></article>`;
}

async function load(){
  if(!grid)return;
  status.textContent='Loading services...';
  let query=supabase.from('skill_services').select('*').order('created_at',{ascending:false}).limit(48);
  const term=searchTerm(search?.value);
  if(term)query=query.or(`service_title.ilike.%${term}%,skill_category.ilike.%${term}%,provider_name.ilike.%${term}%,description.ilike.%${term}%`);
  const {data,error}=await query;
  if(error){status.textContent=schemaHint(error);grid.innerHTML='';return}
  if(!data?.length){status.textContent=term?'No services match that search.':'No student services yet. Offer one below.';grid.innerHTML='';return}
  status.textContent=`${data.length} service${data.length===1?'':'s'}`;
  grid.innerHTML=data.map(card).join('');
}

form?.addEventListener('submit',async e=>{
  e.preventDefault();
  const fd=new FormData(form);
  try{
    loading(btn,true,'Publishing...');
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)throw new Error('Please sign in first.');
    const p=await profile().catch(()=>null);
    const {error}=await supabase.from('skill_services').insert({
      provider_id:user.id,
      provider_name:p?.full_name||String(fd.get('name')||'').trim()||'Student',
      skill_category:String(fd.get('category')||'').trim(),
      service_title:String(fd.get('title')||'').trim(),
      description:String(fd.get('description')||'').trim(),
      starting_price:Number(fd.get('price')||0),
      contact_number:String(fd.get('contact')||p?.whatsapp_number||'').trim()
    });
    if(error)throw error;
    message(out,'Service published.','success');
    form.reset();
    await load();
  }catch(err){
    console.error(err);
    message(out,schemaHint(err));
  }finally{
    loading(btn,false);
  }
});

search?.addEventListener('input',()=>{clearTimeout(search._t);search._t=setTimeout(load,220)});
load();
