```javascript
/*
====================================================
 Good Deeds Ministries Management System
 Authentication Module
 Supabase Authentication
====================================================
*/

window.gdmApp = window.gdmApp || {};

(function () {

    const appState = window.gdmApp;

    // =================================================
    // SAFE STORAGE
    // =================================================

    if (!appState.utils) {

        appState.utils = {

            readStorage: (key, fallback = null) => {

                try {

                    const raw = localStorage.getItem(key);

                    return raw
                        ? JSON.parse(raw)
                        : fallback;

                } catch (error) {

                    console.warn(
                        "localStorage read failed:",
                        error
                    );

                    return fallback;

                }

            },

            writeStorage: (key, value) => {

                try {

                    if (value === null || value === undefined) {

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
    // DOM ELEMENTS
    // =================================================

    const loginForm =
        document.getElementById("loginForm");

    const authMessage =
        document.getElementById("authMessage");

    const authSection =
        document.getElementById("authSection");

    const roleBadge =
        document.getElementById("roleBadge");

    const userRoleLabel =
        document.getElementById("userRoleLabel");

    const googleSignInBtn =
        document.getElementById("googleSignInBtn");

    const forgotPasswordBtn =
        document.getElementById("forgotPasswordBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");


    // =================================================
    // SUPABASE CLIENT
    // =================================================

    const supabase = appState.supabase;

    if (!supabase) {

        console.error(
            "❌ Supabase client is not available."
        );

        if (authMessage) {

            authMessage.textContent =
                "Authentication service is unavailable.";

        }

        return;

    }

    console.log(
        "🟢 GDM Supabase authentication module loaded"
    );


    // =================================================
    // ALLOWED GDM ROLES
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

    appState.getRoleLabel = function (role) {

        const labels = {

            super_admin: "Super Admin",
            admin: "Admin",
            ministry_leader: "Ministry Leader",
            staff: "Staff",
            viewer: "Viewer"

        };

        return labels[role] || "Viewer";

    };


    // =================================================
    // NORMALIZE ROLE
    // =================================================

    appState.normalizeRole = function (role) {

        const normalized =
            String(role || "")
                .trim()
                .toLowerCase();

        if (GDM_ROLES.includes(normalized)) {

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

    appState.normalizeUser = function (user, profile) {

        if (!user) {

            return null;

        }

        const metadata =
            user.user_metadata || {};

        const email =
            user.email || "";

        const displayName =
            profile?.display_name ||
            profile?.full_name ||
            metadata.display_name ||
            metadata.full_name ||
            metadata.name ||
            email.split("@")[0] ||
            "GDM User";

        /*
         * IMPORTANT:
         *
         * Role comes from the Supabase profiles table.
         * We do NOT determine roles from email addresses.
         */

        const role =
            appState.normalizeRole(
                profile?.role
            );

        return {

            uid: user.id,

            email,

            displayName,

            role,

            roleLabel:
                appState.getRoleLabel(role),

            photoURL:
                metadata.avatar_url ||
                metadata.picture ||
                null

        };

    };


    // =================================================
    // LOAD USER PROFILE
    // =================================================

    appState.loadUserProfile = async function (user) {

        if (!user?.id) {

            return null;

        }

        try {

            const {
                data,
                error
            } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();

            if (error) {

                console.error(
                    "❌ Supabase profile lookup failed:",
                    error
                );

                return null;

            }

            return data || null;

        } catch (error) {

            console.error(
                "❌ Supabase profile lookup error:",
                error
            );

            return null;

        }

    };


    // =================================================
    // SET CURRENT USER
    // =================================================

    appState.setCurrentUser = function (user) {

        appState.currentUser = user;

        appState.utils.writeStorage(
            "gdmCurrentUser",
            user
        );

    };


    // =================================================
    // RENDER AUTH STATE
    // =================================================

    appState.renderAuthState = function () {

        const user =
            appState.currentUser;

        if (!authSection) {

            return;

        }

        if (user) {

            authSection.classList.add("hidden");

            if (roleBadge) {

                roleBadge.textContent =
                    user.roleLabel ||
                    appState.getRoleLabel(user.role);

            }

            if (userRoleLabel) {

                userRoleLabel.textContent =
                    user.roleLabel ||
                    appState.getRoleLabel(user.role);

            }

        } else {

            authSection.classList.remove("hidden");

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
    // EMAIL + PASSWORD SIGN IN
    // =================================================

    appState.signIn = async function (
        email,
        password
    ) {

        if (authMessage) {

            authMessage.textContent =
                "Authenticating…";

        }

        if (!email || !password) {

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
            } = await supabase.auth.signInWithPassword({

                email: email.trim(),

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

            const profile =
                await appState.loadUserProfile(
                    data.user
                );

            /*
             * A valid authenticated user must have
             * a corresponding GDM profile.
             */

            if (!profile) {

                await supabase.auth.signOut();

                throw new Error(
                    "Your account is authenticated, but no GDM profile was found. Please contact the administrator."
                );

            }

            const normalizedUser =
                appState.normalizeUser(
                    data.user,
                    profile
                );

            appState.setCurrentUser(
                normalizedUser
            );

            appState.renderAuthState();

            if (authMessage) {

                authMessage.textContent =
                    "Signed in successfully.";

            }

            if (
                typeof appState.initializeApp ===
                "function"
            ) {

                await appState.initializeApp();

            }

            return normalizedUser;

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

    appState.signInWithGoogle = async function () {

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
            } = await supabase.auth.signInWithOAuth({

                provider: "google",

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

                return;

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

            } catch (error) {

                console.error(
                    "❌ Password reset failed:",
                    error
                );

                if (authMessage) {

                    authMessage.textContent =
                        error.message ||
                        "Could not send reset email.";

                }

            }

        };


    // =================================================
    // SIGN OUT
    // =================================================

    appState.signOut = async function () {

        try {

            const {
                error
            } = await supabase.auth.signOut();

            if (error) {

                throw error;

            }

        } catch (error) {

            console.warn(
                "Supabase sign out failed:",
                error
            );

        }

        appState.currentUser = null;

        appState.utils.writeStorage(
            "gdmCurrentUser",
            null
        );

        appState.renderAuthState();

        if (
            typeof appState.renderDashboard ===
            "function"
        ) {

            appState.renderDashboard();

        }

    };


    // =================================================
    // HANDLE SUPABASE USER
    // =================================================

    appState.handleSupabaseUser =
        async function (user) {

            if (!user) {

                appState.currentUser = null;

                appState.utils.writeStorage(
                    "gdmCurrentUser",
                    null
                );

                appState.renderAuthState();

                if (
                    window.location.pathname.includes(
                        "/gdm-dashboard/"
                    )
                ) {

                    window.location.href =
                        "../../index.html";

                }

                return null;

            }

            const profile =
                await appState.loadUserProfile(
                    user
                );

            if (!profile) {

                console.error(
                    "❌ Authenticated user has no GDM profile."
                );

                await supabase.auth.signOut();

                appState.currentUser = null;

                appState.utils.writeStorage(
                    "gdmCurrentUser",
                    null
                );

                appState.renderAuthState();

                if (authMessage) {

                    authMessage.textContent =
                        "Your account has no GDM profile. Please contact the administrator.";

                }

                return null;

            }

            const normalizedUser =
                appState.normalizeUser(
                    user,
                    profile
                );

            appState.setCurrentUser(
                normalizedUser
            );

            appState.renderAuthState();

            if (
                typeof appState.initializeApp ===
                "function"
            ) {

                await appState.initializeApp();

            }

            return normalizedUser;

        };


    // =================================================
    // SUPABASE AUTH STATE LISTENER
    // =================================================

    supabase.auth.onAuthStateChange(
        async (event, session) => {

            console.log(
                "🔐 Supabase auth event:",
                event
            );

            /*
             * Token refresh does not require
             * rebuilding the application state.
             */

            if (
                event === "TOKEN_REFRESHED"
            ) {

                return;

            }

            if (session?.user) {

                /*
                 * Avoid duplicate initialization.
                 */

                if (
                    !appState.currentUser ||
                    appState.currentUser.uid !==
                    session.user.id
                ) {

                    await appState.handleSupabaseUser(
                        session.user
                    );

                }

                return;

            }

            if (
                event === "SIGNED_OUT" ||
                event === "INITIAL_SESSION"
            ) {

                await appState.handleSupabaseUser(
                    null
                );

            }

        }
    );


    // =================================================
    // LOGIN FORM
    // =================================================

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async (event) => {

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
            async () => {

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
            () => {

                const emailField =
                    document.getElementById(
                        "email"
                    );

                const email =
                    emailField
                        ? emailField.value.trim()
                        : "";

                appState.sendPasswordReset(
                    email
                );

            }
        );

    }


    // =================================================
    // LOGOUT
    // =================================================

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            appState.signOut
        );

    }


    // =================================================
    // RESTORE EXISTING SESSION
    // =================================================

    (async function restoreSession() {

        try {

            const {
                data,
                error
            } = await supabase.auth.getSession();

            if (error) {

                throw error;

            }

            if (data?.session?.user) {

                await appState.handleSupabaseUser(
                    data.session.user
                );

            } else {

                appState.currentUser = null;

                appState.utils.writeStorage(
                    "gdmCurrentUser",
                    null
                );

                appState.renderAuthState();

                if (
                    window.location.pathname.includes(
                        "/gdm-dashboard/"
                    )
                ) {

                    window.location.href =
                        "../../index.html";

                }

            }

        } catch (error) {

            console.error(
                "❌ Failed to restore Supabase session:",
                error
            );

        }

    })();


})();
```
