/*
====================================================
 Good Deeds Ministries Management System
 Supabase Application Bootstrap
====================================================

Purpose:
- Restore the Supabase session on page load.
- Keep the UI synchronized with Supabase auth state.
- Load the user's GDM profile before dashboard initialization.
- Keep authentication and dashboard integration in one place.
====================================================
*/

window.gdmApp = window.gdmApp || {};

(function () {

    "use strict";

    const appState = window.gdmApp;

    function getSupabase() {
        return appState.supabase && appState.supabaseReady
            ? appState.supabase
            : null;
    }

    function setDashboardVisible(visible) {
        const authSection = document.getElementById("authSection");
        const dashboardSection = document.getElementById("dashboardSection");

        if (authSection) {
            authSection.classList.toggle("hidden", visible);
        }

        if (dashboardSection) {
            dashboardSection.classList.toggle("hidden", !visible);
        }
    }

    async function syncSession(session) {
        if (!session?.user) {
            if (typeof appState.handleSupabaseUser === "function") {
                await appState.handleSupabaseUser(null);
            }

            setDashboardVisible(false);

            if (typeof appState.updateNavPermissions === "function") {
                appState.updateNavPermissions();
            }

            return null;
        }

        if (typeof appState.handleSupabaseUser !== "function") {
            console.error("GDM authentication handler is not available.");
            return null;
        }

        const user = await appState.handleSupabaseUser(session.user);

        if (user) {
            setDashboardVisible(true);

            if (typeof appState.showSection === "function") {
                appState.showSection("dashboardSection");
            }
        } else {
            setDashboardVisible(false);
        }

        return user;
    }

    async function initializeAuth() {
        const supabase = getSupabase();

        if (!supabase) {
            console.error("GDM Supabase client is not ready.");
            return;
        }

        if (appState.__gdmAuthBootstrapInitialized) {
            return;
        }

        appState.__gdmAuthBootstrapInitialized = true;

        console.log("GDM authentication bootstrap starting...");

        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error("Unable to restore Supabase session:", error);
        } else {
            await syncSession(data?.session || null);
        }

        supabase.auth.onAuthStateChange(function (_event, session) {
            window.setTimeout(function () {
                syncSession(session).catch(function (error) {
                    console.error("GDM auth state synchronization failed:", error);
                });
            }, 0);
        });

        console.log("GDM authentication bootstrap ready");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeAuth, { once: true });
    } else {
        initializeAuth();
    }

})();
