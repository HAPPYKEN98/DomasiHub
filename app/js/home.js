const input=document.querySelector('#globalSearch');
input?.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;
  const q=input.value.trim();
  if(!q){location.href='marketplace.html';return}
  const t=q.toLowerCase();
  if(/room|house|rent|hostel|accommod/.test(t))location.href=`accommodation.html`;
  else if(/note|paper|lecture|academic|course/.test(t))location.href='academics.html';
  else if(/print/.test(t))location.href='printing.html';
  else if(/service|tutor|skill/.test(t))location.href='services.html';
  else location.href=`marketplace.html?q=${encodeURIComponent(q)}`;
});
