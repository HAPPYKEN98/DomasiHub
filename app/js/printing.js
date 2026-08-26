import {requireAuth} from './lib/guard.js';
import {supabase} from './lib/supabase.js';
import {escapeHTML} from './lib/security.js';
import {message,loading} from './lib/ui.js';
import {schemaHint, waLink} from './lib/format.js';
import {uploadPublic} from './lib/media.js';

const providerGrid=document.querySelector('#providerGrid');
const jobGrid=document.querySelector('#jobGrid');
const providerStatus=document.querySelector('#providerStatus');
const jobStatus=document.querySelector('#jobStatus');
const providerForm=document.querySelector('#providerForm');
const jobForm=document.querySelector('#jobForm');
const providerSelect=document.querySelector('#jobProvider');
const providerOut=document.querySelector('#providerMessage');
const jobOut=document.querySelector('#jobMessage');
const providerBtn=document.querySelector('#providerButton');
const jobBtn=document.querySelector('#jobButton');

if(providerForm||jobForm)requireAuth();

function providerCard(x){
  const wa=waLink(x.contact_number,`Hi, I need a print job from ${x.name} via Domasi Hub.`);
  return `<article class="card"><div class="card-content"><div class="row"><span class="chip">${x.available===false?'Busy':'Open'}</span></div><h3>${escapeHTML(x.name)}</h3><p class="muted">${escapeHTML(x.location_details||'Campus')}</p>${x.notes?`<p>${escapeHTML(x.notes)}</p>`:''}${wa?`<div class="actions"><a class="btn btn-secondary" href="${escapeHTML(wa)}" target="_blank" rel="noopener">WhatsApp</a></div>`:''}</div></article>`;
}

function jobCard(x){
  return `<article class="card"><div class="card-content"><div class="row"><span class="chip">${escapeHTML(x.status||'pending')}</span><span class="muted">${x.copies||1} cop${x.copies===1?'y':'ies'}</span></div><h3>${escapeHTML(x.printing_providers?.name||'Print job')}</h3><p class="muted">${escapeHTML(x.file_name||x.notes||'No notes')}</p>${x.file_url?`<div class="actions"><a class="btn btn-secondary" href="${escapeHTML(x.file_url)}" target="_blank" rel="noopener">Open file</a></div>`:''}</div></article>`;
}

async function loadProviders(){
  if(!providerGrid)return;
  providerStatus.textContent='Loading printers...';
  const {data,error}=await supabase.from('printing_providers').select('*').order('created_at',{ascending:false}).limit(48);
  if(error){providerStatus.textContent=schemaHint(error);providerGrid.innerHTML='';return}
  if(!data?.length){providerStatus.textContent='No print setups yet. Register yours below.';providerGrid.innerHTML='';}
  else{
    providerStatus.textContent=`${data.length} printer${data.length===1?'':'s'}`;
    providerGrid.innerHTML=data.map(providerCard).join('');
  }
  if(providerSelect){
    providerSelect.innerHTML='<option value="">Choose a printer</option>'+(data||[]).map(x=>`<option value="${escapeHTML(x.id)}">${escapeHTML(x.name)}</option>`).join('');
  }
}

async function loadJobs(){
  if(!jobGrid)return;
  jobStatus.textContent='Loading your jobs...';
  const {data,error}=await supabase.from('print_jobs').select('*,printing_providers(name)').order('created_at',{ascending:false}).limit(24);
  if(error){jobStatus.textContent=schemaHint(error);jobGrid.innerHTML='';return}
  if(!data?.length){jobStatus.textContent='You have no print jobs yet.';jobGrid.innerHTML='';return}
  jobStatus.textContent=`${data.length} job${data.length===1?'':'s'}`;
  jobGrid.innerHTML=data.map(jobCard).join('');
}

providerForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  const fd=new FormData(providerForm);
  try{
    loading(providerBtn,true,'Saving...');
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)throw new Error('Please sign in first.');
    const {error}=await supabase.from('printing_providers').insert({
      owner_id:user.id,
      name:String(fd.get('name')||'').trim(),
      location_details:String(fd.get('location')||'').trim(),
      contact_number:String(fd.get('contact')||'').trim(),
      notes:String(fd.get('notes')||'').trim()
    });
    if(error)throw error;
    message(providerOut,'Print setup listed.','success');
    providerForm.reset();
    await loadProviders();
  }catch(err){
    console.error(err);
    message(providerOut,schemaHint(err));
  }finally{
    loading(providerBtn,false);
  }
});

jobForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  const fd=new FormData(jobForm);
  try{
    loading(jobBtn,true,'Submitting...');
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)throw new Error('Please sign in first.');
    const file=fd.get('file');
    const file_url=file&&file.size?await uploadPublic(file,'print'):null;
    const {error}=await supabase.from('print_jobs').insert({
      submitted_by:user.id,
      provider_id:String(fd.get('provider')||''),
      copies:Number(fd.get('copies')||1),
      notes:String(fd.get('notes')||'').trim(),
      file_url,
      file_name:file&&file.size?file.name:null
    });
    if(error)throw error;
    message(jobOut,'Print job submitted.','success');
    jobForm.reset();
    await loadJobs();
  }catch(err){
    console.error(err);
    message(jobOut,schemaHint(err));
  }finally{
    loading(jobBtn,false);
  }
});

loadProviders();
loadJobs();
