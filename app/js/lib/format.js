export function money(v){
  if(v==null||v==='')return 'Contact';
  const n=Number(v);
  if(!Number.isFinite(n))return 'Contact';
  return `MWK ${n.toLocaleString()}`;
}

export function waLink(phone,text){
  const n=String(phone||'').replace(/[^\d]/g,'');
  if(!n)return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(text||'Hi, I found you on Domasi Hub.')}`;
}

export function param(name){
  return new URLSearchParams(location.search).get(name)||'';
}

export function schemaHint(err){
  const m=String(err?.message||err||'');
  if(/schema cache|does not exist|relation|could not find/i.test(m)){
    return 'Database tables are missing. In Supabase, open SQL Editor and run supabase/schema.sql.';
  }
  return m||'Something went wrong.';
}

export function searchTerm(v){
  return String(v??'').trim().replace(/[%(),]/g,'').slice(0,80);
}
