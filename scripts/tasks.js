/* =====================================================
   GDM TASK MANAGEMENT — SUPABASE
   Database table: tasks
   Status: pending | in_progress | completed
   Priority: low | medium | high | none
   Progress: 0–100
===================================================== */

window.gdmApp = window.gdmApp || {};

(function () {
    "use strict";

    const app = window.gdmApp;
    const state = { tasks: [], people: [], profiles: [], ministries: [], currentUser: null };
    const STATUS = ["pending", "in_progress", "completed"];
    const PRIORITIES = ["low", "medium", "high", "none"];

    function db() { return app.supabase || null; }
    function user() { return app.currentUser || app.supabaseUser || getStoredUser(); }
    function getStoredUser() { try { return JSON.parse(localStorage.getItem("gdmCurrentUser") || "null"); } catch (_) { return null; } }
    function uid() { return user()?.id || user()?.uid || null; }
    function esc(v) { return String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;"); }
    function dateValue(v) { if (!v) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; }
    function dateText(v) { const d = dateValue(v); return d ? d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}) : "-"; }
    function statusLabel(v) { return String(v || "pending").replace(/_/g," ").replace(/\b\w/g,m=>m.toUpperCase()); }
    function priorityOrder(v) { return ({high:1,medium:2,low:3,none:4})[v] || 5; }
    function completed(t) { return t.status === "completed"; }
    function due(t) { return dateValue(t.due_date || t.dueDate); }
    function overdue(t) { const d=due(t); return !!d && !completed(t) && d < new Date(new Date().setHours(0,0,0,0)); }
    function dueToday(t) { const d=due(t), n=new Date(); return !!d && d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate(); }
    function upcoming(t) { const d=due(t); return !!d && !completed(t) && d >= new Date(new Date().setHours(0,0,0,0)); }
    function progress(t) { return Math.max(0, Math.min(100, Number(t.progress) || 0)); }
    function show(message,type="info") { if (typeof app.showToast === "function") app.showToast(message,type); else console.log(message); }

    async function loadPeople() {
        const client=db(); if (!client) return;
        const {data,error}=await client.from("people").select("*").order("created_at",{ascending:true});
        if (error) { console.warn("People query failed:",error.message); return; }
        state.people=data||[];
    }

    async function loadProfiles() {
        const client=db(); if (!client) return;
        const {data,error}=await client.from("profiles").select("id,full_name,display_name,email,role").order("full_name",{ascending:true});
        if (error) { console.warn("Profiles query failed:",error.message); return; }
        state.profiles=data||[];
    }

    async function loadMinistries() {
        const client=db(); if (!client) return;
        const {data,error}=await client.from("ministries").select("*").order("created_at",{ascending:true});
        if (error) { console.warn("Ministries query failed:",error.message); return; }
        state.ministries=data||[];
    }

    async function loadTasks() {
        const client=db();
        if (!client) { show("Supabase is not available.","error"); return; }
        const {data,error}=await client.from("tasks").select("*").order("created_at",{ascending:false});
        if (error) { console.error("Tasks query failed:",error); show("Unable to load tasks: " + error.message,"error"); return; }
        state.tasks=data||[];
        render();
    }

    function personName(id) {
        const p=state.people.find(x=>x.id===id);
        return p?.full_name || p?.name || p?.display_name || p?.email || null;
    }
    function profileName(id) {
        const p=state.profiles.find(x=>x.id===id);
        return p?.full_name || p?.display_name || p?.email || null;
    }
    function ministryName(id) {
        const m=state.ministries.find(x=>x.id===id);
        return m?.name || m?.title || null;
    }

    function renderStats(tasks) {
        const mine=uid() ? tasks.filter(t=>t.assigned_to===uid()).length : 0;
        const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
        set("allTasksCount",tasks.length); set("myTasksCount",mine); set("dueTodayCount",tasks.filter(dueToday).length);
        set("overdueTasksCount",tasks.filter(overdue).length); set("upcomingTasksCount",tasks.filter(upcoming).length); set("completedTasksCount",tasks.filter(completed).length);
    }

    function render() {
        const body=document.getElementById("tasksTableBody"); if (!body) return;
        const filter=document.getElementById("taskFilter")?.value || "all";
        let tasks=[...state.tasks];
        if(filter==="my") tasks=tasks.filter(t=>t.assigned_to===uid());
        if(filter==="overdue") tasks=tasks.filter(overdue);
        if(filter==="upcoming") tasks=tasks.filter(upcoming);
        if(filter==="completed") tasks=tasks.filter(completed);
        renderStats(state.tasks);
        tasks.sort((a,b)=>priorityOrder(a.priority)-priorityOrder(b.priority));
        if(!tasks.length){ body.innerHTML='<tr><td colspan="7">No tasks available.</td></tr>'; return; }
        body.innerHTML=tasks.map(t=>{
            const p=progress(t), assigned=personName(t.assigned_to) || t.assigned_to || "Unassigned";
            const ministry=ministryName(t.ministry_id) || t.ministry || "-";
            const s=STATUS.includes(t.status)?t.status:"pending";
            return `<tr><td><strong>${esc(t.title || "Untitled task")}</strong><div>${esc(t.description || "")}</div></td><td>${esc(assigned)}</td><td>${esc(ministry)}</td><td>${dateText(t.due_date || t.dueDate)}</td><td><select class="task-status-select" data-task-id="${esc(t.id)}">${STATUS.map(x=>`<option value="${x}" ${x===s?"selected":""}>${statusLabel(x)}</option>`).join("")}</select></td><td><strong>${p}%</strong></td><td><button type="button" class="ghost-btn task-view-btn" data-task-id="${esc(t.id)}">View</button> <button type="button" class="secondary-btn task-edit-btn" data-task-id="${esc(t.id)}">Edit</button> <button type="button" class="ghost-btn task-delete-btn" data-task-id="${esc(t.id)}">Delete</button></td></tr>`;
        }).join("");
    }

    async function updateTask(id, patch) {
        const client=db(); if(!client) return false;
        const {data,error}=await client.from("tasks").update(patch).eq("id",id).select("*").single();
        if(error){console.error("Task update failed:",error);show("Could not update task: "+error.message,"error");return false;}
        const i=state.tasks.findIndex(t=>t.id===id); if(i>=0) state.tasks[i]=data; render(); return true;
    }

    async function deleteTask(id) {
        if(!confirm("Delete this task?")) return;
        const client=db(); if(!client) return;
        const {error}=await client.from("tasks").delete().eq("id",id);
        if(error){console.error("Task delete failed:",error);show("Could not delete task: "+error.message,"error");return;}
        state.tasks=state.tasks.filter(t=>t.id!==id); render(); show("Task deleted.","success");
    }

    function createTaskForm() {
        if(document.getElementById("taskFormOverlay")) return;
        const overlay=document.createElement("div"); overlay.id="taskFormOverlay";
        overlay.innerHTML=`<div class="panel glass-panel" style="position:fixed;inset:50% auto auto 50%;transform:translate(-50%,-50%);width:min(650px,92vw);max-height:90vh;overflow:auto;z-index:9999;padding:25px"><div class="section-header"><div><p class="eyebrow">Task Management</p><h2>Assign New Task</h2></div><button type="button" id="closeTaskFormButton" class="ghost-btn">×</button></div><form id="taskForm"><label>Task Title<input id="taskTitle" required type="text" placeholder="Enter task title"></label><label>Description<textarea id="taskDescription" rows="4" placeholder="Describe the task"></textarea></label><label>Assign To<select id="taskAssignedTo" required><option value="">Select member</option>${state.people.map(p=>`<option value="${esc(p.id)}">${esc(p.full_name||p.name||p.display_name||p.email)}</option>`).join("")}</select></label><label>Ministry<select id="taskMinistry"><option value="">No ministry</option>${state.ministries.map(m=>`<option value="${esc(m.id)}">${esc(m.name||m.title)}</option>`).join("")}</select></label><label>Priority<select id="taskPriority">${PRIORITIES.map(x=>`<option value="${x}" ${x==="medium"?"selected":""}>${statusLabel(x)}</option>`).join("")}</select></label><label>Due Date<input id="taskDueDate" type="date"></label><div class="form-actions"><button class="primary-btn" type="submit">Create Task</button><button class="ghost-btn" type="button" id="cancelTaskButton">Cancel</button></div></form></div>`;
        document.body.appendChild(overlay);
        const close=()=>overlay.remove(); overlay.querySelector("#closeTaskFormButton").onclick=close; overlay.querySelector("#cancelTaskButton").onclick=close;
        overlay.querySelector("#taskForm").addEventListener("submit",async e=>{
            e.preventDefault(); const creator=uid(); if(!creator){show("Please sign in first.","error");return;}
            const client=db(); if(!client){show("Supabase is not available.","error");return;}
            const payload={title:document.getElementById("taskTitle").value.trim(),description:document.getElementById("taskDescription").value.trim()||null,assigned_to:document.getElementById("taskAssignedTo").value||null,created_by:creator,ministry_id:document.getElementById("taskMinistry").value||null,priority:document.getElementById("taskPriority").value,status:"pending",progress:0,start_date:null,due_date:document.getElementById("taskDueDate").value||null};
            const {data,error}=await client.from("tasks").insert(payload).select("*").single();
            if(error){console.error("Task creation failed:",error);show("Could not create task: "+error.message,"error");return;}
            state.tasks.unshift(data); close(); render(); show("Task created successfully.","success");
        });
    }

    function viewTask(id) { const t=state.tasks.find(x=>x.id===id); if(!t)return; const assigned=personName(t.assigned_to)||t.assigned_to||"Unassigned"; alert(`${t.title || "Task"}\n\n${t.description || "No description"}\n\nAssigned to: ${assigned}\nStatus: ${statusLabel(t.status)}\nPriority: ${statusLabel(t.priority)}\nProgress: ${progress(t)}%\nDue: ${dateText(t.due_date || t.dueDate)}`); }

    document.addEventListener("DOMContentLoaded",async()=>{
        state.currentUser=user(); const u=state.currentUser; const role=(u?.roleLabel || u?.role || "Guest").replace(/_/g," ").replace(/\b\w/g,m=>m.toUpperCase());
        const rb=document.getElementById("taskRoleBadge"), rl=document.getElementById("taskRoleLabel"); if(rb)rb.textContent=role;if(rl)rl.textContent=role;
        const filter=document.getElementById("taskFilter"); if(filter)filter.addEventListener("change",render);
        const add=document.getElementById("addTaskButton"); if(add)add.addEventListener("click",createTaskForm);
        const logout=document.getElementById("logoutBtn"); if(logout)logout.addEventListener("click",()=>typeof app.signOut==="function"?app.signOut():null);
        const theme=document.getElementById("themeToggle"); if(theme)theme.addEventListener("click",()=>document.body.classList.toggle("dark-mode"));
        document.addEventListener("click",async e=>{ const view=e.target.closest(".task-view-btn"); if(view)return viewTask(view.dataset.taskId); const del=e.target.closest(".task-delete-btn"); if(del)return deleteTask(del.dataset.taskId); });
        document.addEventListener("change",async e=>{ const status=e.target.closest(".task-status-select"); if(!status)return; const value=status.value; const patch={status:value}; if(value==="completed")patch.progress=100; await updateTask(status.dataset.taskId,patch); });
        await Promise.all([loadPeople(),loadProfiles(),loadMinistries()]);
        await loadTasks();
    });

    app.gdmTasks={state,loadTasks,render,createTaskForm,updateTask,deleteTask};
})();
