/* =====================================================
   GDM MINISTRIES — SUPABASE
   Database table: ministries
===================================================== */

window.gdmApp = window.gdmApp || {};

(function () {
    "use strict";

    const app = window.gdmApp;

    function db() {
        return app.supabase || null;
    }

    function show(message, type = "info") {
        if (typeof app.showToast === "function") app.showToast(message, type);
        else console.log(message);
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalize(row) {
        return {
            ...row,
            id: row.id,
            title: row.title || row.name || "Unnamed Ministry",
            name: row.name || row.title || "Unnamed Ministry",
            description: row.description || "",
            leader: row.leader || row.lead || row.leader_name || "",
            members: Number(row.members ?? row.member_count ?? 0),
            progress: Math.max(0, Math.min(100, Number(row.progress ?? 0))),
            status: row.status || "Active",
            created_at: row.created_at || null,
            updated_at: row.updated_at || null
        };
    }

    function renderMinistries(items = app.ministries || []) {
        const cards = document.getElementById("ministryCards");
        const tableBody = document.getElementById("ministryTableBody");
        const totalMinistries = document.getElementById("totalMinistriesCount");
        const totalMembers = document.getElementById("totalMembersCount");

        const ministries = items.map(normalize);

        if (totalMinistries) totalMinistries.textContent = ministries.length;
        if (totalMembers) {
            totalMembers.textContent = ministries.reduce((sum, item) => sum + item.members, 0);
        }

        if (cards) {
            cards.innerHTML = ministries.length
                ? ministries.map(item => `
                    <article class="ministry-card glass-panel">
                        <div class="section-header">
                            <div>
                                <p class="eyebrow">Ministry</p>
                                <h3>${escapeHTML(item.title)}</h3>
                            </div>
                            <span class="badge badge-success">${escapeHTML(item.status)}</span>
                        </div>
                        <p>${escapeHTML(item.description || "No description available.")}</p>
                        <div class="ministry-meta">
                            <span>Lead: <strong>${escapeHTML(item.leader || "Not assigned")}</strong></span>
                            <span>Members: <strong>${item.members}</strong></span>
                        </div>
                        <div class="progress-track" aria-label="${item.progress}% complete">
                            <div class="progress-fill" style="width:${item.progress}%"></div>
                        </div>
                        <small>${item.progress}% progress</small>
                    </article>
                `).join("")
                : '<div class="empty-state">No ministries found.</div>';
        }

        if (tableBody) {
            tableBody.innerHTML = ministries.length
                ? ministries.map(item => `
                    <tr>
                        <td><strong>${escapeHTML(item.title)}</strong></td>
                        <td>${escapeHTML(item.leader || "Not assigned")}</td>
                        <td>${item.progress}%</td>
                        <td>${item.members}</td>
                        <td>${escapeHTML(item.status)}</td>
                    </tr>
                `).join("")
                : '<tr><td colspan="5">No ministries found.</td></tr>';
        }
    }

    async function loadMinistries() {
        const client = db();
        if (!client) {
            show("Supabase is not available.", "error");
            return [];
        }

        const { data, error } = await client
            .from("ministries")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Ministries query failed:", error);
            show("Unable to load ministries: " + error.message, "error");
            return [];
        }

        app.ministries = (data || []).map(normalize);
        renderMinistries();
        return app.ministries;
    }

    async function addMinistry(data) {
        const client = db();
        if (!client) return null;

        const title = String(data?.title || data?.name || "").trim();
        if (!title) {
            show("Ministry name is required.", "error");
            return null;
        }

        const payload = {
            title,
            description: String(data?.description || "").trim() || null,
            leader: String(data?.leader || data?.lead || "").trim() || null,
            members: Number(data?.members || 0),
            progress: Number(data?.progress || 0),
            status: data?.status || "Active"
        };

        const { data: created, error } = await client
            .from("ministries")
            .insert(payload)
            .select("*")
            .single();

        if (error) {
            console.error("Add ministry failed:", error);
            show("Could not create ministry: " + error.message, "error");
            return null;
        }

        app.ministries = [normalize(created), ...(app.ministries || [])];
        renderMinistries();
        show("Ministry created successfully.", "success");
        return created;
    }

    async function updateMinistry(id, updates) {
        const client = db();
        if (!client) return false;

        const { data, error } = await client
            .from("ministries")
            .update(updates || {})
            .eq("id", id)
            .select("*")
            .single();

        if (error) {
            console.error("Update ministry failed:", error);
            show("Could not update ministry: " + error.message, "error");
            return false;
        }

        const next = normalize(data);
        app.ministries = (app.ministries || []).map(item => item.id === id ? next : item);
        renderMinistries();
        show("Ministry information updated.", "success");
        return true;
    }

    async function deleteMinistry(id) {
        if (!confirm("Are you sure you want to delete this ministry?")) return false;

        const client = db();
        if (!client) return false;

        const { error } = await client
            .from("ministries")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Delete ministry failed:", error);
            show("Could not delete ministry: " + error.message, "error");
            return false;
        }

        app.ministries = (app.ministries || []).filter(item => item.id !== id);
        renderMinistries();
        show("Ministry deleted.", "success");
        return true;
    }

    function searchMinistries(keyword) {
        const term = String(keyword || "").trim().toLowerCase();
        const results = !term
            ? [...(app.ministries || [])]
            : (app.ministries || []).filter(ministry =>
                String(ministry.title || "").toLowerCase().includes(term) ||
                String(ministry.leader || "").toLowerCase().includes(term) ||
                String(ministry.description || "").toLowerCase().includes(term)
            );

        renderMinistries(results);
        return results;
    }

    app.renderMinistries = renderMinistries;
    app.loadMinistries = loadMinistries;
    app.addMinistry = addMinistry;
    app.updateMinistry = updateMinistry;
    app.deleteMinistry = deleteMinistry;
    app.searchMinistries = searchMinistries;

    document.addEventListener("DOMContentLoaded", () => {
        const search = document.getElementById("ministriesSearch");
        if (search) {
            search.addEventListener("input", () => searchMinistries(search.value));
        }

        loadMinistries();
    });
})();
