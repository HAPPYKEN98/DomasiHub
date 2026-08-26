import {requireAuth} from './lib/guard.js';
import {supabase} from './lib/supabase.js';
import {message,loading} from './lib/ui.js';
import {schemaHint} from './lib/format.js';
import {uploadPublic} from './lib/media.js';

const form=document.querySelector('#sellForm');
const out=document.querySelector('#formMessage');
const btn=document.querySelector('#sellButton');
if(form)requireAuth();

form?.addEventListener('submit',async e=>{
  e.preventDefault();
  const fd=new FormData(form);
  try{
    loading(btn,true,'Publishing...');
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)throw new Error('Please sign in first.');
    const file=fd.get('image');
    const image_url=file&&file.size?await uploadPublic(file,'listings'):null;
    const payload={
      posted_by:user.id,
      title:String(fd.get('title')||'').trim(),
      category:String(fd.get('category')||'').trim(),
      price:Number(fd.get('price')||0),
      contact_number:String(fd.get('contact')||'').trim(),
      item_condition:String(fd.get('condition')||'').trim(),
      location_details:String(fd.get('location')||'').trim(),
      description:String(fd.get('description')||'').trim(),
      image_url,
      status:'active'
    };
    const {error}=await supabase.from('listings').insert(payload);
    if(error)throw error;
    message(out,'Listing published successfully.','success');
    form.reset();
    setTimeout(()=>location.href='marketplace.html',800);
  }catch(err){
    console.error(err);
    message(out,schemaHint(err));
  }finally{
    loading(btn,false);
  }
});
