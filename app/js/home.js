import { supabase } from "./lib/supabase.js";
import { escapeHTML } from "./lib/security.js";
import { money, waLink } from "./lib/format.js";

const form=document.querySelector("#globalSearchForm");
const input=document.querySelector("#globalSearch");
const section=document.querySelector("#homeSearchSection");
const title=document.querySelector("#homeSearchTitle");
const status=document.querySelector("#homeSearchStatus");
const grid=document.querySelector("#homeSearchGrid");
const clear=document.querySelector("#clearHomeSearch");

const targets=[
 {type:"marketplace",table:"listings",page:"marketplace-detail.html",label:"Marketplace"},
 {type:"housing",table:"housing",page:"marketplace-detail.html",label:"Accommodation"},
 {type:"printing",table:"printing_providers",page:"marketplace-detail.html",label:"Printing"},
 {type:"academic",table:"academic_resources",page:"marketplace-detail.html",label:"Academics"}
];
function term(v){return String(v||"").trim().replace(/[%(),]/g,"").slice(0,80)}
function imageOf(x){return Array.isArray(x.image_urls)&&x.image_urls[0] || x.image_url || null}
function titleOf(x,type){return type==="printing"?x.name:type==="academic"?x.title:x.title||"Listing"}
function owner(x,type){return x.profiles?.full_name||"Domasi student"}
function render(items,q){
 title.textContent=`Search results for “${q}”`;
 if(!items.length){status.textContent="No results found.";grid.innerHTML=`<div class="empty"><strong>No results found</strong><p>We couldn't find anything matching “${escapeHTML(q)}”. Try another word or search a different section.</p></div>`;return}
 status.textContent=`${items.length} result${items.length===1?"":"s"} across Domasi Hub`;
 grid.innerHTML=items.map(({x,t})=>{
  const image=imageOf(x), name=titleOf(x,t), href=`marketplace-detail.html?type=${t}&id=${encodeURIComponent(x.id)}`;
  const sub=t==="marketplace"?`${x.item_condition||""}${x.location_details?` · ${x.location_details}`:""}`:t==="housing"?`${x.location_details||""}${x.rent!=null?` · ${money(x.rent)}/month`:""}`:t==="printing"?`${x.location_details||""} · ${x.available?"Open":"Unavailable"}`:`${x.department||""}${x.course_code?` · ${x.course_code}`:""}`;
  return `<article class="card listing-card"><a class="card-media ${image?"":"card-media-empty"}" href="${href}" aria-label="Open ${escapeHTML(name)}">${image?`<img src="${escapeHTML(image)}" alt="${escapeHTML(name)}" loading="lazy">`:`<span>No photo</span>`}</a><div class="card-content"><div class="row"><span class="chip">${escapeHTML(targets.find(y=>y.type===t)?.label||t)}</span>${t==="marketplace"?`<span class="price">${money(x.price)}</span>`:t==="housing"?`<span class="price">${money(x.rent)}/month</span>`:""}</div><h3><a href="${href}">${escapeHTML(name)}</a></h3><p class="detail-line">${escapeHTML(sub||"")}</p><div class="uploader"><span class="avatar">${escapeHTML(owner(x,t).charAt(0).toUpperCase())}</span><span>Listed by <strong>${escapeHTML(owner(x,t))}</strong></span></div><a class="btn btn-secondary" href="${href}">View details</a></div></article>`
 }).join("");
}
async function searchAll(q){
 section.hidden=false; status.textContent="Searching Domasi Hub…"; grid.innerHTML="";
 const jobs=targets.map(async t=>{
  let query=supabase.from(t.table).select("*").limit(20);
  if(t.type==="marketplace") query=query.eq("status","active").or(`title.ilike.%${q}%,category.ilike.%${q}%,location_details.ilike.%${q}%,item_condition.ilike.%${q}%,description.ilike.%${q}%`);
  if(t.type==="housing") query=query.or(`title.ilike.%${q}%,location_details.ilike.%${q}%,utilities.ilike.%${q}%,security_notes.ilike.%${q}%,description.ilike.%${q}%`);
  if(t.type==="printing") query=query.or(`name.ilike.%${q}%,location_details.ilike.%${q}%,notes.ilike.%${q}%`);
  if(t.type==="academic") query=query.or(`title.ilike.%${q}%,course_code.ilike.%${q}%,department.ilike.%${q}%,academic_year.ilike.%${q}%`);
  const {data,error}=await query.order("created_at",{ascending:false});
  if(error){console.error(`[home search] ${t.type}`,error);return []}
  return (data||[]).map(x=>({x,t:t.type}));
 });
 const groups=await Promise.all(jobs); render(groups.flat(),q);
}
form?.addEventListener("submit",async e=>{e.preventDefault();const q=term(input?.value);if(!q){input?.focus();return}await searchAll(q)});
input?.addEventListener("keydown",e=>{if(e.key==="Escape"){input.value="";section.hidden=true}});
clear?.addEventListener("click",()=>{input.value="";section.hidden=true;input.focus()});
