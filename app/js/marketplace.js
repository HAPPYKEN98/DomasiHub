import {supabase} from './lib/supabase.js';
import {escapeHTML} from './lib/security.js';
import {money, schemaHint, param, searchTerm} from './lib/format.js';

const grid=document.querySelector('#marketGrid');
const status=document.querySelector('#marketStatus');
const search=document.querySelector('#marketSearch');
const q=param('q');
if(search&&q)search.value=q;

function card(x){
  const img=x.image_url?`<div class="card-media"><img src="${escapeHTML(x.image_url)}" alt=""></div>`:'';
  return `<a class="card" href="marketplace-detail.html?id=${encodeURIComponent(x.id)}">${img}<div class="card-content"><div class="row"><span class="chip">${escapeHTML(x.category||'General')}</span><span class="price">${money(x.price)}</span></div><h3>${escapeHTML(x.title)}</h3><p class="muted">${escapeHTML(x.location_details||'Domasi')}</p></div></a>`;
}

async function load(){
  if(!grid)return;
  status.textContent='Loading listings...';
  let query=supabase.from('listings').select('*').eq('status','active').order('created_at',{ascending:false}).limit(48);
  const term=searchTerm(search?.value);
  if(term)query=query.or(`title.ilike.%${term}%,category.ilike.%${term}%,location_details.ilike.%${term}%,description.ilike.%${term}%`);
  const {data,error}=await query;
  if(error){status.textContent=schemaHint(error);grid.innerHTML='';return}
  if(!data?.length){status.textContent=term?'No listings match that search.':'No listings yet. Be the first to post something.';grid.innerHTML='';return}
  status.textContent=`${data.length} listing${data.length===1?'':'s'}`;
  grid.innerHTML=data.map(card).join('');
}

search?.addEventListener('input',()=>{clearTimeout(search._t);search._t=setTimeout(load,220)});
load();
