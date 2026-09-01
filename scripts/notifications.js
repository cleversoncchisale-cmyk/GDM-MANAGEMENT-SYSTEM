/* =====================================================
   GDM NOTIFICATIONS — SUPABASE/LOCAL UI
   No Firestore dependency.
===================================================== */

window.gdmApp = window.gdmApp || {};

(function () {
    "use strict";

    const app = window.gdmApp;

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderNotifications() {
        const list = document.getElementById("notificationList");
        if (!list) return;

        const items = app.notifications || [];
        list.innerHTML = "";

        if (!items.length) {
            list.innerHTML = '<li class="empty-state">No notifications yet.</li>';
            return;
        }

        items.slice(0, 5).forEach(item => {
            const li = document.createElement("li");
            li.className = "notification-item";
            li.innerHTML = `<strong>${escapeHTML(item.title)}</strong><div>${escapeHTML(item.message)}</div>`;
            list.appendChild(li);
        });
    }

    function addNotification(title, message) {
        const item = {
            id: crypto?.randomUUID?.() || String(Date.now()),
            title: String(title || "Notification"),
            message: String(message || ""),
            created_at: new Date().toISOString()
        };

        app.notifications = [item, ...(app.notifications || [])].slice(0, 20);
        renderNotifications();

        if (typeof app.showToast === "function") {
            app.showToast(item.title, item.message);
        }
    }

    app.notifications = app.notifications || [];
    app.renderNotifications = renderNotifications;
    app.addNotification = addNotification;

    document.addEventListener("DOMContentLoaded", renderNotifications);
})();
