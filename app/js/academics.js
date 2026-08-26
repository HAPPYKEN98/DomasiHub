import {requireAuth} from './lib/guard.js';
import {supabase} from './lib/supabase.js';
import {escapeHTML} from './lib/security.js';
import {message,loading} from './lib/ui.js';
import {schemaHint, searchTerm} from './lib/format.js';
import {uploadPublic} from './lib/media.js';

const grid=document.querySelector('#academicGrid');
const status=document.querySelector('#academicStatus');
const search=document.querySelector('#academicSearch');
const form=document.querySelector('#academicForm');
const out=document.querySelector('#formMessage');
const btn=document.querySelector('#academicButton');
if(form)requireAuth();

function card(x){
  return `<article class="card"><div class="card-content"><div class="row"><span class="chip">${escapeHTML(x.department||'General')}</span><span class="muted">${escapeHTML(x.academic_year||'')}</span></div><h3>${escapeHTML(x.title)}</h3><p class="muted">${escapeHTML(x.course_code||'Course')} · ${escapeHTML(x.file_name||'File')}</p><div class="actions"><a class="btn btn-primary" href="${escapeHTML(x.file_url)}" target="_blank" rel="noopener">Open file</a></div></div></article>`;
}

async function load(){
  if(!grid)return;
  status.textContent='Loading resources...';
  let query=supabase.from('academic_resources').select('*').order('created_at',{ascending:false}).limit(48);
  const term=searchTerm(search?.value);
  if(term)query=query.or(`title.ilike.%${term}%,department.ilike.%${term}%,course_code.ilike.%${term}%`);
  const {data,error}=await query;
  if(error){status.textContent=schemaHint(error);grid.innerHTML='';return}
  if(!data?.length){status.textContent=term?'No notes match that search.':'No study materials yet. Upload notes below.';grid.innerHTML='';return}
  status.textContent=`${data.length} resource${data.length===1?'':'s'}`;
  grid.innerHTML=data.map(card).join('');
}

form?.addEventListener('submit',async e=>{
  e.preventDefault();
  const fd=new FormData(form);
  try{
    loading(btn,true,'Uploading...');
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)throw new Error('Please sign in first.');
    const file=fd.get('file');
    if(!file||!file.size)throw new Error('Choose a PDF or document to share.');
    const file_url=await uploadPublic(file,'academics');
    const {error}=await supabase.from('academic_resources').insert({
      uploaded_by:user.id,
      title:String(fd.get('title')||'').trim(),
      department:String(fd.get('department')||'').trim(),
      academic_year:String(fd.get('year')||'').trim(),
      course_code:String(fd.get('course')||'').trim(),
      file_url,
      file_name:file.name
    });
    if(error)throw error;
    message(out,'Resource published.','success');
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
