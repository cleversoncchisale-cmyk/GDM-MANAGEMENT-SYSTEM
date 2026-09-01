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

    function normalize(row) {
        return {
            ...row,
            id: row.id,
            title: row.title || row.name || "Unnamed Ministry",
            name: row.name || row.title || "Unnamed Ministry",
            description: row.description || "",
            leader: row.leader || row.lead || row.leader_name || "",
            members: Number(row.members ?? row.member_count ?? 0),
            progress: Number(row.progress ?? 0),
            status: row.status || "Active",
            created_at: row.created_at || null,
            updated_at: row.updated_at || null
        };
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

        if (typeof app.renderMinistries === "function") {
            app.renderMinistries();
        }

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
        if (typeof app.renderMinistries === "function") app.renderMinistries();
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
        app.ministries = (app.ministries || []).map(item =>
            item.id === id ? next : item
        );
        if (typeof app.renderMinistries === "function") app.renderMinistries();
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
        if (typeof app.renderMinistries === "function") app.renderMinistries();
        show("Ministry deleted.", "success");
        return true;
    }

    function searchMinistries(keyword) {
        const term = String(keyword || "").trim().toLowerCase();
        if (!term) return [...(app.ministries || [])];

        return (app.ministries || []).filter(ministry =>
            String(ministry.title || "").toLowerCase().includes(term) ||
            String(ministry.leader || "").toLowerCase().includes(term) ||
            String(ministry.description || "").toLowerCase().includes(term)
        );
    }

    app.loadMinistries = loadMinistries;
    app.addMinistry = addMinistry;
    app.updateMinistry = updateMinistry;
    app.deleteMinistry = deleteMinistry;
    app.searchMinistries = searchMinistries;

    document.addEventListener("DOMContentLoaded", () => {
        loadMinistries();
    });
})();
