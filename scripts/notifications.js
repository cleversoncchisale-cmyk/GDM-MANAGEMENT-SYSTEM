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

    async function initializeSupabaseSession() {
        const supabase = app.supabase;

        if (!supabase || !app.supabaseReady) {
            console.error("GDM Supabase client is not ready for authentication bootstrap.");
            return;
        }

        if (app.__gdmAuthBootstrapInitialized) {
            return;
        }

        app.__gdmAuthBootstrapInitialized = true;

        const authSection = document.getElementById("authSection");
        const dashboardSection = document.getElementById("dashboardSection");

        function setSignedInUI(isSignedIn) {
            if (authSection) {
                authSection.classList.toggle("hidden", isSignedIn);
            }

            if (dashboardSection) {
                dashboardSection.classList.toggle("hidden", !isSignedIn);
            }
        }

        async function applySession(session) {
            if (!session?.user) {
                app.currentUser = null;
                app.supabaseUser = null;

                if (typeof app.renderAuthState === "function") {
                    app.renderAuthState();
                }

                if (typeof app.updateNavPermissions === "function") {
                    app.updateNavPermissions();
                }

                setSignedInUI(false);
                return;
            }

            if (typeof app.handleSupabaseUser !== "function") {
                console.error("GDM authentication handler is unavailable.");
                setSignedInUI(false);
                return;
            }

            try {
                const user = await app.handleSupabaseUser(session.user);

                if (!user) {
                    setSignedInUI(false);
                    return;
                }

                setSignedInUI(true);

                if (typeof app.updateNavPermissions === "function") {
                    app.updateNavPermissions();
                }

                if (typeof app.showSection === "function") {
                    app.showSection("dashboardSection");
                }
            } catch (error) {
                console.error("GDM session initialization failed:", error);
                setSignedInUI(false);
            }
        }

        try {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Unable to restore GDM Supabase session:", error);
            } else {
                await applySession(data?.session || null);
            }
        } catch (error) {
            console.error("GDM Supabase session lookup failed:", error);
            setSignedInUI(false);
        }

        supabase.auth.onAuthStateChange(function (_event, session) {
            window.setTimeout(function () {
                applySession(session);
            }, 0);
        });

        console.log("GDM Supabase authentication bootstrap ready");
    }

    document.addEventListener("DOMContentLoaded", function () {
        renderNotifications();
        initializeSupabaseSession();
    });
})();
