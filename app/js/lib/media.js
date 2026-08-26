import {supabase} from './supabase.js';

function safeName(file){
  return String(file?.name||'file').replace(/[^\w.\-]+/g,'_').slice(-80);
}

export async function uploadPublic(file,folder){
  if(!file||!file.size)return null;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)throw new Error('Please sign in first.');
  const path=`${user.id}/${folder}/${Date.now()}-${safeName(file)}`;
  const {error}=await supabase.storage.from('hub-public').upload(path,file,{upsert:false});
  if(error)throw error;
  const {data}=supabase.storage.from('hub-public').getPublicUrl(path);
  return data.publicUrl;
}
