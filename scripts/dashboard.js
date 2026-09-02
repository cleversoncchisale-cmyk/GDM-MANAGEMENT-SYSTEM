/*
====================================================
 GOOD DEEDS MINISTRIES MANAGEMENT SYSTEM
 Dashboard Module (FIXED)
 Supabase Database + Supabase Storage
====================================================

 STORAGE BUCKET:
 gdm-documents

 DATABASE:
 Supabase

 DOCUMENT TABLE:
 documents

====================================================
*/

window.gdmApp = window.gdmApp || {};

(function () {
    "use strict";
    const appState = window.gdmApp;

    if (!appState.utils) {
        appState.utils = {
            readStorage(key, fallback = null) {
                try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
                catch (error) { console.warn("Storage read error:", error); return fallback; }
            },
            writeStorage(key, value) {
                try { localStorage.setItem(key, JSON.stringify(value)); }
                catch (error) { console.warn("Storage write error:", error); }
            }
        };
    }

    function getSupabase() {
        if (appState.supabase && appState.supabaseReady) return appState.supabase;
        if (window.supabase && typeof window.supabase.createClient === "function") {
            console.warn("Supabase client exists but appState.supabase is not ready.");
        }
        return null;
    }

    const DOCUMENT_BUCKET = "gdm-documents";
    const sections = Array.from(document.querySelectorAll("main section[id]"));
    const navItems = Array.from(document.querySelectorAll(".nav-item"));
    const navButtons = navItems.filter(item => item.tagName === "BUTTON");
    const globalSearch = document.getElementById("globalSearch");
    const ministriesSearch = document.getElementById("ministriesSearch");
    const loadingOverlay = document.getElementById("loadingSkeleton");

    function getCurrentUser() {
        return appState.currentUser || appState.supabaseUser || null;
    }

    function getUserRole() {
        const user = getCurrentUser();
        if (!user) return "viewer";

        const role = user.role || user.user_role || user.profile?.role || user.user_metadata?.role || "viewer";

        if (typeof appState.normalizeRole === "function") {
            return appState.normalizeRole(role);
        }

        return String(role).trim().toLowerCase().replace(/[\s-]+/g, "_");
    }

    function getUserId() {
        const user = getCurrentUser();
        return user?.id || user?.auth_user_id || user?.user_id || null;
    }

    function getUserEmail() {
        const user = getCurrentUser();
        return user?.email || user?.user_metadata?.email || "Unknown";
    }

    const ROLE_PERMISSIONS = {
        super_admin: ["dashboardSection", "ministriesSection", "membersSection", "documentsSection", "reportsSection", "activitySection"],
        admin: ["dashboardSection", "ministriesSection", "membersSection", "documentsSection", "reportsSection", "activitySection"],
        ministry_leader: ["dashboardSection", "ministriesSection", "membersSection", "documentsSection", "reportsSection", "activitySection"],
        staff: ["dashboardSection", "ministriesSection", "membersSection", "documentsSection", "reportsSection", "activitySection"],
        viewer: ["dashboardSection", "ministriesSection"]
    };

    function isSectionAllowed(target) {
        return (ROLE_PERMISSIONS[getUserRole()] || []).includes(target);
    }

    appState.updateNavPermissions = function () {
        navItems.forEach(item => {
            const target = item.dataset.target;
            if (!target) return;
            const allowed = isSectionAllowed(target);
            item.classList.toggle("disabled", !allowed);
            if (item.tagName === "BUTTON") item.disabled = !allowed;
        });

        const uploadButton = document.getElementById("uploadDocumentBtn");
        const canUpload = ["super_admin", "admin", "ministry_leader", "staff"].includes(getUserRole());
        if (uploadButton) uploadButton.style.display = canUpload ? "" : "none";
    };

    function showSection(target) {
        const section = sections.find(item => item.id === target);
        if (!section) return;
        if (!isSectionAllowed(target)) {
            console.warn("Access denied:", target, getUserRole());
            return;
        }
        sections.forEach(item => item.classList.toggle("hidden", item.id !== target));
        navItems.forEach(item => item.classList.toggle("active", item.dataset.target === target));
        const title = document.getElementById("pageTitle");
        if (title) {
            const titles = {
                dashboardSection: "Management Dashboard",
                ministriesSection: "Ministries",
                documentsSection: "Documents",
                reportsSection: "Reports",
                activitySection: "Recent Activity"
            };
            title.textContent = titles[target] || "Management Dashboard";
        }
    }

    appState.showSection = showSection;

    appState.showLoading = function (status) {
        if (loadingOverlay) loadingOverlay.classList.toggle("hidden", !status);
    };

    function showToast(message, type = "info") {
        const stack = document.getElementById("toastStack");
        if (!stack) { console.log("[" + type + "]", message); return; }
        const toast = document.createElement("div");
        toast.className = "toast toast-" + type;
        toast.textContent = message;
        stack.appendChild(toast);
        setTimeout(() => { toast.classList.add("hide"); setTimeout(() => toast.remove(), 300); }, 3500);
    }

    appState.showToast = showToast;

    function normalizeDate(value) {
        if (!value) return null;
        if (value?.toDate instanceof Function) return value.toDate();
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatDate(value) {
        const date = normalizeDate(value);
        return date ? date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "-";
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
    }

    appState.getUserRole = getUserRole;
    appState.getUserId = getUserId;
    appState.getUserEmail = getUserEmail;
    appState.formatDate = formatDate;
    appState.escapeHTML = escapeHTML;

    document.addEventListener("DOMContentLoaded", function () {
        appState.updateNavPermissions();
    });
})();
