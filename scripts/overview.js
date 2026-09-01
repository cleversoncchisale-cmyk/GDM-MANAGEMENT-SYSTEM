/*
====================================================
 Good Deeds Ministries Management System
 Overview Page Integration
 Supabase source of truth
====================================================
*/

window.gdmApp = window.gdmApp || {};

(function () {
    "use strict";

    const app = window.gdmApp;

    function getSupabase() {
        return app.supabase && app.supabaseReady ? app.supabase : null;
    }

    function getRole() {
        const user = app.currentUser || app.supabaseUser || {};
        const rawRole = user.role || user.user_role || user.profile?.role || user.user_metadata?.role || "viewer";

        if (typeof app.normalizeRole === "function") {
            return app.normalizeRole(rawRole);
        }

        return String(rawRole).trim().toLowerCase().replace(/[\s-]+/g, "_");
    }

    function getRoleLabel() {
        const role = getRole();
        if (typeof app.getRoleLabel === "function") {
            return app.getRoleLabel(role);
        }
        return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value ?? "0");
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async function loadOverviewData() {
        const supabase = getSupabase();
        if (!supabase) {
            console.warn("Overview: Supabase client is not ready.");
            return;
        }

        const [ministriesResult, peopleResult, tasksResult, reportsResult] = await Promise.all([
            supabase.from("ministries").select("*").order("created_at", { ascending: true }),
            supabase.from("people").select("*").order("created_at", { ascending: false }),
            supabase.from("tasks").select("id,status").in("status", ["pending", "in_progress"]),
            supabase.from("report_submissions").select("id")
        ]);

        if (ministriesResult.error) console.warn("Overview ministries query failed:", ministriesResult.error.message);
        if (peopleResult.error) console.warn("Overview people query failed:", peopleResult.error.message);
        if (tasksResult.error) console.warn("Overview tasks query failed:", tasksResult.error.message);
        if (reportsResult.error) console.warn("Overview reports query failed:", reportsResult.error.message);

        const ministries = ministriesResult.data || [];
        const people = peopleResult.data || [];
        const pendingTasks = tasksResult.data || [];
        const reports = reportsResult.data || [];

        setText("ministryCount", ministries.length);
        setText("pendingTasksCount", pendingTasks.length);
        setText("reportSubmissionCount", reports.length);
        setText("memberCount", people.length);
        setText("overviewRoleLabel", getRoleLabel());

        renderMiniCards(ministries);
    }

    function renderMiniCards(ministries) {
        const container = document.getElementById("miniCards");
        if (!container) return;

        container.innerHTML = "";

        if (!ministries.length) {
            container.innerHTML = '<div class="empty-state">No ministry data available.</div>';
            return;
        }

        ministries.forEach(ministry => {
            const card = document.createElement("div");
            card.className = "mini-card";
            const title = ministry.title || ministry.name || "Unnamed Ministry";
            const members = Number(ministry.members || ministry.member_count || 0);
            const progress = Number(ministry.progress || 0);

            card.innerHTML = `
                <strong>${escapeHTML(title)}</strong>
                <span>${members} members</span>
                <span>${progress}% progress</span>
            `;

            container.appendChild(card);
        });
    }

    async function initialize() {
        try {
            await loadOverviewData();
        } catch (error) {
            console.error("Overview initialization failed:", error);
        }
    }

    app.loadOverviewData = loadOverviewData;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
