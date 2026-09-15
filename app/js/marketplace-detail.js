import { supabase } from "./lib/supabase.js";
import { escapeHTML } from "./lib/security.js";
import { money, param, waLink } from "./lib/format.js";
import { toast } from "./lib/ui.js";

const root=document.querySelector("#listingDetail");
const id=param("id");
const type=param("type") || "marketplace";
const TABLES={marketplace:"listings",housing:"housing",academic:"academic_resources",printing:"printing_providers",service:"skill_services"};
const LABELS={marketplace:"Marketplace",housing:"Accommodation",academic:"Academic resource",printing:"Printing station",service:"Student service"};
const table=TABLES[type] || TABLES.marketplace;
const back=document.querySelector("#detailBack");
if(back){ back.textContent=`← ${LABELS[type] || "Back"}`; back.href=type==="housing"?"accommodation.html":type==="academic"?"academics.html":type==="printing"?"printing.html":type==="service"?"services.html":"marketplace.html"; }

function imagesOf(data){return Array.isArray(data.image_urls)&&data.image_urls.length?data.image_urls:(data.image_url?[data.image_url]:[])}
function ownerId(data){return data.posted_by||data.owner_id||data.uploaded_by||data.provider_id}
function ownerName(data){return data.profiles?.full_name||data.provider_name||"Domasi student"}
async function academicUrl(path){if(!path)return null; if(/^https?:\/\//i.test(path))return path; const {data,error}=await supabase.storage.from("hub-private").createSignedUrl(path,3600); if(error){console.error(error);return null} return data?.signedUrl||null}

async function load(){
 if(!root)return;
 if(!id){root.innerHTML='<div class="empty">This listing could not be found.</div>';return}
 let select="*";
 const {data,error}=await supabase.from(table).select(select).eq("id",id).maybeSingle();
 if(error||!data){console.error(error);root.innerHTML=`<div class="empty">${error?'Unable to load this listing.':'This listing is no longer available.'}</div>`;return}
 const oid=ownerId(data);
 if(oid){ const {data:profile}=await supabase.from("public_profiles").select("id,full_name,avatar_url,verified").eq("id",oid).maybeSingle(); if(profile) data.profiles=profile; }
 const user=(await supabase.auth.getUser()).data.user; const isOwner=!!user&&user.id===ownerId(data);
 const imgs=imagesOf(data); const resolved=type==="academic"?[(await Promise.all(imgs.map(academicUrl))).filter(Boolean)]:[imgs];
 const imageList=type==="academic"?resolved[0]:resolved[0];
 let documentUrl=type==="academic"?await academicUrl(data.file_url):null;
 let title=data.title||data.name||data.service_title||"Listing";
 let contact=data.contact_number||data.profiles?.whatsapp_number;
 let wa=waLink(contact,`Hi, I found "${title}" on Domasi Hub and would like to enquire.`);
 let fields=[];
 if(type==="marketplace") fields=[data.item_condition&&`Condition: <strong>${escapeHTML(data.item_condition)}</strong>`,data.location_details&&escapeHTML(data.location_details),data.description&&`<p class="description">${escapeHTML(data.description)}</p>`].filter(Boolean);
 if(type==="housing") fields=[data.location_details&&`Location: <strong>${escapeHTML(data.location_details)}</strong>`,data.rent!=null&&`Rent: <strong>${money(data.rent)} / month</strong>`,data.utilities&&`Utilities: ${escapeHTML(data.utilities)}`,data.security_notes&&`Security: ${escapeHTML(data.security_notes)}`,data.description&&`<p class="description">${escapeHTML(data.description)}</p>`].filter(Boolean);
 if(type==="printing") fields=[data.location_details&&`Location: <strong>${escapeHTML(data.location_details)}</strong>`,data.available?`Status: <strong>Open</strong>`:`Status: <strong>Unavailable</strong>`,data.notes&&`<p class="description">${escapeHTML(data.notes)}</p>`].filter(Boolean);
 if(type==="academic") fields=[data.department&&`Department: <strong>${escapeHTML(data.department)}</strong>`,data.course_code&&`Course: <strong>${escapeHTML(data.course_code)}</strong>`,data.academic_year&&`Academic year: <strong>${escapeHTML(data.academic_year)}</strong>`].filter(Boolean);
 if(type==="service") fields=[data.skill_category&&`Category: <strong>${escapeHTML(data.skill_category)}</strong>`,data.starting_price!=null&&`Starting from: <strong>${money(data.starting_price)}</strong>`,data.description&&`<p class="description">${escapeHTML(data.description)}</p>`].filter(Boolean);
 root.innerHTML=`
 ${imageList.length?`<div class="detail-gallery">${imageList.map((x,i)=>`<img src="${escapeHTML(x)}" alt="${escapeHTML(title)} photo ${i+1}" loading="lazy">`).join("")}</div>`:""}
 <section class="card"><div class="card-content">
 <div class="row"><span class="chip">${escapeHTML(LABELS[type]||"Listing")}</span>${type==="marketplace"?`<span class="price">${money(data.price)}</span>`:type==="housing"?`<span class="price">${money(data.rent)} / month</span>`:type==="service"?`<span class="price">${money(data.starting_price)}</span>`:""}</div>
 <h1>${escapeHTML(title)}</h1>
 ${fields.map(x=>`<p class="detail-line">${x}</p>`).join("")}
 ${type==="academic"&&documentUrl?`<div class="actions"><a class="btn btn-primary" href="${escapeHTML(documentUrl)}" target="_blank" rel="noopener">Open resource</a></div>`:""}
 <div class="uploader"><span class="avatar">${escapeHTML(ownerName(data).charAt(0).toUpperCase())}</span><span>Listed by <strong>${escapeHTML(ownerName(data))}</strong></span></div>
 <div class="actions">${wa?`<a class="btn btn-primary" href="${escapeHTML(wa)}" target="_blank" rel="noopener">Chat on WhatsApp</a>`:""}${isOwner?`<a class="btn btn-secondary" href="edit.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}">Edit listing</a><button class="btn btn-danger" id="deleteListing" type="button">Delete listing</button>`:""}</div>
 </div></section>`;
 document.querySelector("#deleteListing")?.addEventListener("click",()=>deleteListing(data));
}
async function deleteListing(data){if(!confirm("Delete this listing permanently?"))return; const {error}=await supabase.from(table).delete().eq("id",id); if(error){toast(error.message||"The listing could not be deleted.","error");return} toast("Your listing has been deleted.","success"); const dest=type==="housing"?"accommodation.html":type==="academic"?"academics.html":type==="printing"?"printing.html":type==="service"?"services.html":"marketplace.html"; setTimeout(()=>location.href=dest,500)}
load();
