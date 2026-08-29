```javascript
/*
====================================================
 GOOD DEEDS MINISTRIES MANAGEMENT SYSTEM
 Authentication Module
 Supabase Authentication
====================================================

 RESPONSIBILITIES:
 - Supabase authentication
 - Session restoration
 - Profile loading
 - Role normalization
 - Current-user state
 - Login / logout
 - Google authentication
 - Password reset
 - Authentication UI

 IMPORTANT:
 Supabase session is the source of truth.
 profiles.role determines the GDM role.

 ALLOWED ROLES:
 super_admin
 admin
 ministry_leader
 staff
 viewer
====================================================
*/

window.gdmApp = window.gdmApp || {};

(function () {

    "use strict";

    const appState = window.gdmApp;

    // =================================================
    // SAFE STORAGE
    // =================================================

    if (!appState.utils) {

        appState.utils = {

            readStorage(key, fallback = null) {

                try {

                    const raw =
                        localStorage.getItem(key);

                    if (!raw) {
                        return fallback;
                    }

                    return JSON.parse(raw);

                } catch (error) {

                    console.warn(
                        "localStorage read failed:",
                        error
                    );

                    return fallback;
                }

            },

            writeStorage(key, value) {

                try {

                    if (
                        value === null ||
                        value === undefined
                    ) {

                        localStorage.removeItem(key);

                        return;
                    }

                    localStorage.setItem(
                        key,
                        JSON.stringify(value)
                    );

                } catch (error) {

                    console.warn(
                        "localStorage write failed:",
                        error
                    );
                }

            }

        };

    }


    // =================================================
    // SUPABASE CLIENT
    // =================================================

    function getSupabase() {

        if (appState.supabase) {
            return appState.supabase;
        }

        console.error(
            "❌ GDM Supabase client is not available."
        );

        return null;
    }


    const supabase =
        getSupabase();


    if (!supabase) {

        console.error(
            "❌ Authentication module stopped because Supabase is unavailable."
        );

        return;
    }


    console.log(
        "🟢 GDM Supabase authentication module loaded"
    );


    // =================================================
    // DOM ELEMENTS
    // =================================================

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const authMessage =
        document.getElementById(
            "authMessage"
        );

    const authSection =
        document.getElementById(
            "authSection"
        );

    const roleBadge =
        document.getElementById(
            "roleBadge"
        );

    const userRoleLabel =
        document.getElementById(
            "userRoleLabel"
        );

    const googleSignInBtn =
        document.getElementById(
            "googleSignInBtn"
        );

    const forgotPasswordBtn =
        document.getElementById(
            "forgotPasswordBtn"
        );

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    // =================================================
    // GDM ROLES
    // =================================================

    const GDM_ROLES = [

        "super_admin",
        "admin",
        "ministry_leader",
        "staff",
        "viewer"

    ];


    // =================================================
    // ROLE LABEL
    // =================================================

    appState.getRoleLabel =
        function (role) {

            const labels = {

                super_admin:
                    "Super Admin",

                admin:
                    "Admin",

                ministry_leader:
                    "Ministry Leader",

                staff:
                    "Staff",

                viewer:
                    "Viewer"

            };

            return (
                labels[
                    String(role || "")
                        .trim()
                        .toLowerCase()
                ] ||
                "Viewer"
            );

        };


    // =================================================
    // NORMALIZE ROLE
    // =================================================

    appState.normalizeRole =
        function (role) {

            const normalized =
                String(role || "")
                    .trim()
                    .toLowerCase()
                    .replace(
                        /[\s-]+/g,
                        "_"
                    );

            if (
                GDM_ROLES.includes(
                    normalized
                )
            ) {

                return normalized;

            }

            console.warn(
                "⚠️ Invalid or missing GDM role:",
                role
            );

            return "viewer";

        };


    // =================================================
    // NORMALIZE USER
    // =================================================

    appState.normalizeUser =
        function (
            authUser,
            profile
        ) {

            if (!authUser) {
                return null;
            }


            const metadata =
                authUser.user_metadata ||
                {};


            const email =
                authUser.email ||
                "";


            const displayName =
                profile?.display_name ||
                profile?.full_name ||
                metadata.display_name ||
                metadata.full_name ||
                metadata.name ||
                email.split("@")[0] ||
                "GDM User";


            const role =
                appState.normalizeRole(
                    profile?.role
                );


            return {

                uid:
                    authUser.id,

                id:
                    authUser.id,

                email,

                displayName,

                role,

                roleLabel:
                    appState.getRoleLabel(
                        role
                    ),

                photoURL:
                    metadata.avatar_url ||
                    metadata.picture ||
                    null,

                profile:
                    profile || null

            };

        };


    // =================================================
    // LOAD PROFILE
    // =================================================

    appState.loadUserProfile =
        async function (authUser) {

            if (!authUser?.id) {
                return null;
            }


            try {

                const {
                    data,
                    error
                } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq(
                        "id",
                        authUser.id
                    )
                    .maybeSingle();


                if (error) {

                    console.error(
                        "❌ Profile lookup failed:",
                        error
                    );

                    return null;

                }


                return data || null;

            } catch (error) {

                console.error(
                    "❌ Profile lookup exception:",
                    error
                );

                return null;

            }

        };


    // =================================================
    // SET CURRENT USER
    // =================================================

    appState.setCurrentUser =
        function (user) {

            appState.currentUser =
                user || null;


            if (user) {

                appState.utils.writeStorage(
                    "gdmCurrentUser",
                    user
                );

            } else {

                appState.utils.writeStorage(
                    "gdmCurrentUser",
                    null
                );

            }

        };


    // =================================================
    // CLEAR CURRENT USER
    // =================================================

    function clearCurrentUser() {

        appState.currentUser =
            null;

        appState.supabaseUser =
            null;

        appState.utils.writeStorage(
            "gdmCurrentUser",
            null
        );

    }


    // =================================================
    // RENDER AUTH STATE
    // =================================================

    appState.renderAuthState =
        function () {

            const user =
                appState.currentUser;


            if (user) {

                if (authSection) {

                    authSection.classList.add(
                        "hidden"
                    );

                }


                const role =
                    user.role ||
                    "viewer";


                const label =
                    user.roleLabel ||
                    appState.getRoleLabel(
                        role
                    );


                if (roleBadge) {

                    roleBadge.textContent =
                        label;

                }


                if (userRoleLabel) {

                    userRoleLabel.textContent =
                        label;

                }

            } else {

                if (authSection) {

                    authSection.classList.remove(
                        "hidden"
                    );

                }


                if (roleBadge) {

                    roleBadge.textContent =
                        "Guest";

                }


                if (userRoleLabel) {

                    userRoleLabel.textContent =
                        "Viewer";

                }

            }

        };


    // =================================================
    // HANDLE AUTHENTICATED USER
    // =================================================

    appState.handleSupabaseUser =
        async function (authUser) {

            if (!authUser) {

                clearCurrentUser();

                appState.renderAuthState();


                if (
                    typeof appState.updateNavPermissions ===
                    "function"
                ) {

                    appState.updateNavPermissions();

                }


                return null;

            }


            console.log(
                "🔐 Loading GDM profile for:",
                authUser.email
            );


            appState.supabaseUser =
                authUser;


            const profile =
                await appState.loadUserProfile(
                    authUser
                );


            if (!profile) {

                console.error(
                    "❌ Authenticated user has no GDM profile."
                );


                try {

                    await supabase.auth.signOut();

                } catch (signOutError) {

                    console.warn(
                        "Unable to sign out invalid user:",
                        signOutError
                    );

                }


                clearCurrentUser();

                appState.renderAuthState();


                if (authMessage) {

                    authMessage.textContent =
                        "Your account has no GDM profile. Please contact the administrator.";

                }


                return null;

            }


            const normalizedUser =
                appState.normalizeUser(
                    authUser,
                    profile
                );


            appState.setCurrentUser(
                normalizedUser
            );


            appState.renderAuthState();


            if (
                typeof appState.updateNavPermissions ===
                "function"
            ) {

                appState.updateNavPermissions();

            }


            /*
             * Dashboard initialization belongs to
             * dashboard.js.
             *
             * We call it only after authentication
             * and profile loading are complete.
             */

            if (
                typeof appState.initializeApp ===
                "function"
            ) {

                try {

                    await appState.initializeApp();

                } catch (error) {

                    console.error(
                        "❌ Dashboard initialization after authentication failed:",
                        error
                    );

                }

            }


            return normalizedUser;

        };


    // =================================================
    // EMAIL + PASSWORD LOGIN
    // =================================================

    appState.signIn =
        async function (
            email,
            password
        ) {

            if (authMessage) {

                authMessage.textContent =
                    "Authenticating…";

            }


            if (
                !email ||
                !password
            ) {

                if (authMessage) {

                    authMessage.textContent =
                        "Please enter your email and password.";

                }

                return null;

            }


            try {

                const {
                    data,
                    error
                } = await supabase.auth
                    .signInWithPassword({

                        email:
                            email.trim(),

                        password

                    });


                if (error) {
                    throw error;
                }


                if (!data?.user) {

                    throw new Error(
                        "Authentication succeeded but no user was returned."
                    );

                }


                /*
                 * The auth listener will normally
                 * process the session.
                 *
                 * We explicitly process the user here
                 * as well so the application becomes
                 * responsive immediately.
                 */

                const user =
                    await appState.handleSupabaseUser(
                        data.user
                    );


                if (!user) {
                    return null;
                }


                if (authMessage) {

                    authMessage.textContent =
                        "Signed in successfully.";

                }


                return user;

            } catch (error) {

                console.error(
                    "❌ Supabase sign-in failed:",
                    error
                );


                if (authMessage) {

                    authMessage.textContent =
                        error.message ||
                        "Unable to sign in.";

                }


                return null;

            }

        };


    // =================================================
    // GOOGLE SIGN IN
    // =================================================

    appState.signInWithGoogle =
        async function () {

            if (authMessage) {

                authMessage.textContent =
                    "Signing in with Google…";

            }


            try {

                const redirectTo =
                    window.location.href;


                const {
                    data,
                    error
                } = await supabase.auth
                    .signInWithOAuth({

                        provider:
                            "google",

                        options: {

                            redirectTo

                        }

                    });


                if (error) {
                    throw error;
                }


                return data || null;

            } catch (error) {

                console.error(
                    "❌ Google sign-in failed:",
                    error
                );


                if (authMessage) {

                    authMessage.textContent =
                        error.message ||
                        "Google sign-in failed.";

                }


                return null;

            }

        };


    // =================================================
    // PASSWORD RESET
    // =================================================

    appState.sendPasswordReset =
        async function (email) {

            if (!email) {

                if (authMessage) {

                    authMessage.textContent =
                        "Please enter your email address above.";

                }

                return false;

            }


            if (authMessage) {

                authMessage.textContent =
                    "Sending password reset link…";

            }


            try {

                const redirectTo =
                    `${window.location.origin}${window.location.pathname}`;


                const {
                    error
                } = await supabase.auth
                    .resetPasswordForEmail(
                        email.trim(),
                        {
                            redirectTo
                        }
                    );


                if (error) {
                    throw error;
                }


                if (authMessage) {

                    authMessage.textContent =
                        "Password reset link sent. Check your inbox.";

                }


                return true;

            } catch (error) {

                console.error(
                    "❌ Password reset failed:",
                    error
                );


                if (authMessage) {

                    authMessage.textContent =
                        error.message ||
                        "Could not send password reset email.";

                }


                return false;

            }

        };


    // =================================================
    // SIGN OUT
    // =================================================

    appState.signOut =
        async function () {

            try {

                const {
                    error
                } = await supabase.auth
                    .signOut();


                if (error) {
                    throw error;
                }

            } catch (error) {

                console.warn(
                    "Supabase sign out warning:",
                    error
                );

            }


            clearCurrentUser();

            appState.renderAuthState();


            if (
                typeof appState.updateNavPermissions ===
                "function"
            ) {

                appState.updateNavPermissions();

            }


            /*
             * If this is the dashboard page,
             * return to the main login page.
             */

            if (
                window.location.pathname.includes(
                    "/gdm-dashboard/"
                )
            ) {

                window.location.href =
                    "../../index.html";

            }

        };


    // =================================================
    // LOGIN FORM
    // =================================================

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const emailField =
                    document.getElementById(
                        "email"
                    );


                const passwordField =
                    document.getElementById(
                        "password"
                    );


                if (
                    !emailField ||
                    !passwordField
                ) {

                    if (authMessage) {

                        authMessage.textContent =
                            "Login form is incomplete.";

                    }

                    return;

                }


                await appState.signIn(
                    emailField.value.trim(),
                    passwordField.value
                );

            }
        );

    }


    // =================================================
    // GOOGLE BUTTON
    // =================================================

    if (googleSignInBtn) {

        googleSignInBtn.addEventListener(
            "click",
            async function () {

                await appState.signInWithGoogle();

            }
        );

    }


    // =================================================
    // FORGOT PASSWORD
    // =================================================

    if (forgotPasswordBtn) {

        forgotPasswordBtn.addEventListener(
            "click",
            async function () {

                const emailField =
                    document.getElementById(
                        "email"
                    );


                const email =
                    emailField
                        ? emailField.value.trim()
                        : "";


                await appState.sendPasswordReset(
                    email
                );

            }
        );

    }


    // =================================================
    // LOGOUT BUTTON
    // =================================================

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async function () {

                await appState.signOut();

            }
        );

    }


    // =================================================
    // SUPABASE AUTH STATE LISTENER
    // =================================================

    supabase.auth.onAuthStateChange(
        async function (
            event,
            session
        ) {

            console.log(
                "🔐 Supabase auth event:",
                event
            );


            /*
             * SIGNED OUT
             */

            if (
                event === "SIGNED_OUT"
            ) {

                clearCurrentUser();

                appState.renderAuthState();


                if (
                    typeof appState.updateNavPermissions ===
                    "function"
                ) {

                    appState.updateNavPermissions();

                }


                return;

            }


            /*
             * AUTHENTICATED SESSION
             */

            if (
                session?.user
            ) {

                /*
                 * Avoid unnecessary profile
                 * reload when the same user is
                 * already loaded.
                 */

                if (
                    !appState.currentUser ||
                    appState.currentUser.uid !==
                    session.user.id
                ) {

                    await appState.handleSupabaseUser(
                        session.user
                    );

                } else {

                    appState.supabaseUser =
                        session.user;

                    appState.renderAuthState();

                    if (
                        typeof appState.updateNavPermissions ===
                        "function"
                    ) {

                        appState.updateNavPermissions();

                    }

                }

            }

        }
    );


    // =================================================
    // RESTORE SUPABASE SESSION
    // =================================================

    async function restoreSession() {

        try {

            const {
                data,
                error
            } = await supabase.auth
                .getSession();


            if (error) {
                throw error;
            }


            if (
                data?.session?.user
            ) {

                await appState.handleSupabaseUser(
                    data.session.user
                );

            } else {

                clearCurrentUser();

                appState.renderAuthState();

            }

        } catch (error) {

            console.error(
                "❌ Failed to restore Supabase session:",
                error
            );


            clearCurrentUser();

            appState.renderAuthState();

        }

    }


    // =================================================
    // DOM READY
    // =================================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            function () {

                appState.renderAuthState();

                restoreSession();

            },
            {
                once: true
            }
        );

    } else {

        appState.renderAuthState();

        restoreSession();

    }


    console.log(
        "🟢 GDM authentication system ready"
    );

})();
```
