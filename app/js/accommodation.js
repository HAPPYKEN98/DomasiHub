import {requireAuth} from './lib/guard.js';
import {supabase} from './lib/supabase.js';
import {escapeHTML} from './lib/security.js';
import {message,loading} from './lib/ui.js';
import {money, schemaHint, waLink, searchTerm} from './lib/format.js';
import {uploadPublic} from './lib/media.js';

const grid=document.querySelector('#housingGrid');
const status=document.querySelector('#housingStatus');
const search=document.querySelector('#housingSearch');
const form=document.querySelector('#housingForm');
const out=document.querySelector('#formMessage');
const btn=document.querySelector('#housingButton');
if(form)requireAuth();

function card(x){
  const wa=waLink(x.contact_number,`Hi, I'm interested in "${x.title}" on Domasi Hub.`);
  const img=x.image_url?`<div class="card-media"><img src="${escapeHTML(x.image_url)}" alt=""></div>`:'';
  return `<article class="card">${img}<div class="card-content"><div class="row"><span class="chip">${x.available===false?'Taken':'Available'}</span><span class="price">${money(x.rent)}</span></div><h3>${escapeHTML(x.title)}</h3><p class="muted">${escapeHTML(x.location_details||'Domasi')}</p>${x.utilities?`<p class="muted">Utilities: ${escapeHTML(x.utilities)}</p>`:''}${x.security_notes?`<p class="muted">Security: ${escapeHTML(x.security_notes)}</p>`:''}${x.description?`<p>${escapeHTML(x.description)}</p>`:''}${wa?`<div class="actions"><a class="btn btn-primary" href="${escapeHTML(wa)}" target="_blank" rel="noopener">WhatsApp</a></div>`:''}</div></article>`;
}

async function load(){
  if(!grid)return;
  status.textContent='Loading rooms...';
  let query=supabase.from('housing').select('*').eq('available',true).order('created_at',{ascending:false}).limit(48);
  const term=searchTerm(search?.value);
  if(term)query=query.or(`title.ilike.%${term}%,location_details.ilike.%${term}%,utilities.ilike.%${term}%,description.ilike.%${term}%`);
  const {data,error}=await query;
  if(error){status.textContent=schemaHint(error);grid.innerHTML='';return}
  if(!data?.length){status.textContent=term?'No rooms match that search.':'No rooms yet. Post a place below.';grid.innerHTML='';return}
  status.textContent=`${data.length} place${data.length===1?'':'s'}`;
  grid.innerHTML=data.map(card).join('');
}

form?.addEventListener('submit',async e=>{
  e.preventDefault();
  const fd=new FormData(form);
  try{
    loading(btn,true,'Publishing...');
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)throw new Error('Please sign in first.');
    const file=fd.get('image');
    const image_url=file&&file.size?await uploadPublic(file,'housing'):null;
    const {error}=await supabase.from('housing').insert({
      posted_by:user.id,
      title:String(fd.get('title')||'').trim(),
      location_details:String(fd.get('location')||'').trim(),
      rent:Number(fd.get('rent')||0),
      utilities:String(fd.get('utilities')||'').trim(),
      security_notes:String(fd.get('security')||'').trim(),
      contact_number:String(fd.get('contact')||'').trim(),
      description:String(fd.get('description')||'').trim(),
      image_url
    });
    if(error)throw error;
    message(out,'Room published.','success');
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
