/* =====================================================
   GDM REPORTS — SUPABASE
   Table: reports
===================================================== */
window.gdmApp = window.gdmApp || {};
(function () {
    "use strict";
    const app=window.gdmApp;
    const db=()=>app.supabase||null;
    const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
    const date=v=>{if(!v)return "-";const d=new Date(v);return Number.isNaN(d.getTime())?"-":d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});};
    const notify=(m,t="info")=>typeof app.showToast==="function"?app.showToast(m,t):console.log(m);

    async function waitForSession(){
        const client=db(); if(!client)return null;
        const {data}=await client.auth.getSession();
        return data?.session||null;
    }

    async function loadReports(){
        const client=db();if(!client)return [];
        const session=await waitForSession();
        if(!session?.user){app.reports=[];render([]);return [];}
        const {data,error}=await client.from("reports").select("*").order("created_at",{ascending:false});
        if(error){console.error("Reports load failed:",error);notify("Unable to load reports: "+error.message,"error");return [];}
        app.reports=data||[];render(app.reports);return app.reports;
    }

    function render(rows){
        const body=document.getElementById("reportsTableBody");if(!body)return;
        if(!rows.length){body.innerHTML='<tr><td colspan="5">No reports available.</td></tr>';}
        else body.innerHTML=rows.map(r=>`<tr><td><strong>${esc(r.title||r.name||"Report")}</strong></td><td>${esc(r.ministry_name||r.ministry||r.ministry_id||"General")}</td><td>${esc(r.content||r.summary||r.notes||"").slice(0,160)}</td><td>${esc(r.value??"-")}</td><td>${date(r.submitted_at||r.created_at)}</td></tr>`).join("");
        const approval=document.getElementById("approvalMetric");if(approval){const total=rows.length,approved=rows.filter(r=>r.status==="approved").length;approval.textContent=total?Math.round(approved/total*100)+"%":"0%";}
    }

    async function submitReport(payload){
        const client=db();if(!client)return null;
        const session=await waitForSession();const uid=session?.user?.id;if(!uid){notify("Please sign in first.","error");return null;}
        const row={...payload,prepared_by:uid,status:"draft"};
        const {data,error}=await client.from("reports").insert(row).select("*").single();
        if(error){console.error("Report creation failed:",error);notify("Could not save report: "+error.message,"error");return null;}
        notify("Report saved as draft.","success");await loadReports();return data;
    }

    document.addEventListener("DOMContentLoaded",()=>{
        const add=document.getElementById("addReportBtn"),card=document.getElementById("reportsFormCard"),cancel=document.getElementById("cancelReportBtn"),form=document.getElementById("reportForm"),refresh=document.getElementById("refreshChartBtn");
        if(add&&card)add.addEventListener("click",()=>card.classList.toggle("hidden"));
        if(cancel&&card)cancel.addEventListener("click",()=>card.classList.add("hidden"));
        if(refresh)refresh.addEventListener("click",loadReports);
        if(form)form.addEventListener("submit",async e=>{e.preventDefault();const result=await submitReport({title:document.getElementById("reportTitle")?.value.trim(),content:document.getElementById("reportSummary")?.value.trim(),value:Number(document.getElementById("reportValue")?.value||0)});if(result){form.reset();if(card)card.classList.add("hidden");}});
        loadReports();
    });
    app.gdmReports={loadReports,submitReport,render};
})();
