/* =====================================================
   GDM DOCUMENTS — SUPABASE
   Table: documents
   Storage bucket: gdm-documents
===================================================== */
window.gdmApp = window.gdmApp || {};
(function () {
    "use strict";
    const app = window.gdmApp;
    const BUCKET = "gdm-documents";
    const db = () => app.supabase || null;
    const esc = v => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
    const date = v => { if(!v) return "-"; const d=new Date(v); return Number.isNaN(d.getTime())?"-":d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}); };
    const size = n => { n=Number(n)||0; if(n<1024)return n+" B"; if(n<1048576)return (n/1024).toFixed(1)+" KB"; if(n<1073741824)return (n/1048576).toFixed(1)+" MB"; return (n/1073741824).toFixed(1)+" GB"; };
    const name = (row, fallback) => row?.title || row?.file_name || row?.filename || row?.name || fallback || "Untitled document";
    const notify = (m,t="info") => typeof app.showToast === "function" ? app.showToast(m,t) : console.log(m);

    async function waitForSession() {
        const client = db();
        if (!client) return null;
        const { data } = await client.auth.getSession();
        return data?.session || null;
    }

    async function loadDocuments() {
        const client=db();
        if(!client) return [];
        const session = await waitForSession();
        if(!session?.user){
            app.documents=[];
            render([]);
            return [];
        }
        const {data,error}=await client.from("documents").select("*").order("created_at",{ascending:false});
        if(error){console.error("Documents load failed:",error);notify("Unable to load documents: "+error.message,"error");return [];}
        app.documents=data||[]; render(app.documents); return app.documents;
    }

    function render(rows) {
        const body=document.getElementById("documentTableBody"); if(!body)return;
        if(!rows.length){body.innerHTML='<tr><td colspan="6">No documents available.</td></tr>';}
        else body.innerHTML=rows.map(r=>`<tr><td><strong>${esc(name(r))}</strong></td><td>${esc(r.ministry_name||r.ministry||r.ministry_id||"General")}</td><td>${esc(r.mime_type||r.file_type||r.type||"File")}</td><td>${size(r.file_size)}</td><td>${date(r.created_at)}</td><td><button type="button" class="secondary-btn document-open-btn" data-document-id="${esc(r.id)}">Open</button></td></tr>`).join("");
        const count=document.getElementById("documentCount"); if(count)count.textContent=rows.length;
        const ministries=new Set(rows.map(r=>r.ministry_id).filter(Boolean)); const mc=document.getElementById("docMinistryCount");if(mc)mc.textContent=ministries.size;
        const rc=document.getElementById("recentUploadsCount");if(rc)rc.textContent=rows.filter(r=>{const d=new Date(r.created_at);return !Number.isNaN(d.getTime())&&(Date.now()-d.getTime())<=30*86400000;}).length;
    }

    async function openDocument(id) {
        const row=(app.documents||[]).find(x=>x.id===id); if(!row)return;
        const client=db(); if(!client)return;
        let url=row.file_url||null;
        if(!url && row.file_path){ const {data,error}=await client.storage.from(BUCKET).createSignedUrl(row.file_path,3600); if(error){notify("Unable to open document: "+error.message,"error");return;} url=data?.signedUrl||null; }
        if(!url){notify("This document has no file path or URL.","error");return;}
        window.open(url,"_blank","noopener,noreferrer");
    }

    async function upload(file, ministryId=null, departmentId=null) {
        const client=db(); if(!client||!file)return;
        const session=await waitForSession(); const uid=session?.user?.id;
        if(!uid){notify("Please sign in first.","error");return;}
        const path=`${uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
        const progress=document.getElementById("documentUploadProgress"); if(progress){progress.classList.remove("hidden");progress.value=10;}
        const up=await client.storage.from(BUCKET).upload(path,file,{upsert:false});
        if(up.error){if(progress)progress.classList.add("hidden");notify("Upload failed: "+up.error.message,"error");return;}
        if(progress)progress.value=80;
        const row={file_size:file.size,ministry_id:ministryId,department_id:departmentId,uploaded_by:uid,is_public:false,file_path:path};
        const ins=await client.from("documents").insert(row).select("*").single();
        if(ins.error){await client.storage.from(BUCKET).remove([path]);if(progress)progress.classList.add("hidden");notify("Document record failed: "+ins.error.message,"error");return;}
        if(progress){progress.value=100;setTimeout(()=>progress.classList.add("hidden"),500);} notify("Document uploaded successfully.","success"); await loadDocuments();
    }

    document.addEventListener("DOMContentLoaded",async()=>{
        const input=document.getElementById("documentFileInput"), button=document.getElementById("uploadDocumentBtn");
        if(button&&input)button.addEventListener("click",()=>input.click());
        if(input)input.addEventListener("change",()=>{const file=input.files?.[0];if(file)upload(file);input.value="";});
        document.addEventListener("click",e=>{const b=e.target.closest(".document-open-btn");if(b)openDocument(b.dataset.documentId);});
        await loadDocuments();
    });
    app.gdmDocuments={loadDocuments,upload,openDocument,render};
})();
