import {supabase} from './lib/supabase.js';
import {escapeHTML} from './lib/security.js';
import {money, schemaHint, param, waLink} from './lib/format.js';

const root=document.querySelector('#listingDetail');
const id=param('id');

async function load(){
  if(!root)return;
  if(!id){root.innerHTML='<div class="empty">Select a marketplace listing to view its full details.</div>';return}
  const {data,error}=await supabase.from('listings').select('*').eq('id',id).maybeSingle();
  if(error){root.innerHTML=`<div class="empty">${escapeHTML(schemaHint(error))}</div>`;return}
  if(!data){root.innerHTML='<div class="empty">This listing is unavailable.</div>';return}
  const wa=waLink(data.contact_number,`Hi, I'm interested in "${data.title}" on Domasi Hub.`);
  const img=data.image_url?`<div class="detail-hero"><img src="${escapeHTML(data.image_url)}" alt=""></div>`:'';
  root.innerHTML=`${img}<section class="card"><div class="card-content"><div class="row"><span class="chip">${escapeHTML(data.category||'General')}</span><span class="price">${money(data.price)}</span></div><h1 style="margin:12px 0 8px;font-size:28px;letter-spacing:-.04em">${escapeHTML(data.title)}</h1><p class="muted">${escapeHTML(data.location_details||'Domasi')}${data.item_condition?` · ${escapeHTML(data.item_condition)}`:''}</p>${data.description?`<p style="line-height:1.6;margin-top:14px">${escapeHTML(data.description)}</p>`:''}<div class="actions">${wa?`<a class="btn btn-primary" href="${escapeHTML(wa)}" target="_blank" rel="noopener">Chat on WhatsApp</a>`:''}<a class="btn btn-secondary" href="marketplace.html">Back to marketplace</a></div></div></section>`;
}

load();
