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

            readStorage: (key, fallback) => {

                try {

                    const raw =
                        localStorage.getItem(key);

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
    // CHECK SUPABASE
    // =================================================

    const supabase =
        appState.supabase;


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
    // ROLE RESOLUTION
    // =================================================

    appState.resolveUserRole = function (email) {

        const normalized =
            (email || "")
                .toLowerCase()
                .trim();


        /*
         * Temporary compatibility fallback.
         *
         * The real role should come from
         * the Supabase profiles table.
         */

        if (normalized.includes("super")) {

            return "Super Admin";

        }


        if (normalized.includes("admin")) {

            return "Admin";

        }


        if (normalized.includes("member")) {

            return "Member";

        }


        if (normalized.includes("viewer")) {

            return "Viewer";

        }


        return "Viewer";

    };


    // =================================================
    // NORMALIZE USER
    // =================================================

    appState.normalizeUser =
        function (user, profile) {

            if (!user) {

                return null;

            }


            const email =
                user.email ||
                "guest@gdm.org";


            const metadata =
                user.user_metadata || {};


            const displayName =
                profile?.display_name ||
                profile?.full_name ||
                metadata.display_name ||
                metadata.full_name ||
                metadata.name ||
                email.split("@")[0];


            /*
             * Prefer the role stored in profiles.
             * Fall back to metadata and finally
             * the compatibility resolver.
             */

            const role =
                profile?.role ||
                metadata.role ||
                appState.resolveUserRole(email);


            return {

                uid:
                    user.id ||
                    `demo-${Date.now()}`,

                email,

                displayName,

                role,

                photoURL:
                    metadata.avatar_url ||
                    metadata.picture ||
                    null

            };

        };


    // =================================================
    // LOAD USER PROFILE
    // =================================================

    appState.loadUserProfile =
        async function (user) {

            if (!user) {

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

                    console.warn(
                        "Supabase profile lookup failed:",
                        error
                    );

                    return null;

                }


                return data || null;

            } catch (error) {

                console.warn(
                    "Supabase profile lookup error:",
                    error
                );

                return null;

            }

        };


    // =================================================
    // RENDER AUTH STATE
    // =================================================

    appState.renderAuthState =
        function () {

            if (!authSection) {

                return;

            }


            if (appState.currentUser) {

                authSection.classList.add(
                    "hidden"
                );


                if (roleBadge) {

                    roleBadge.textContent =
                        appState.currentUser.role ||
                        "Viewer";

                }


                if (userRoleLabel) {

                    userRoleLabel.textContent =
                        appState.currentUser.role ||
                        "Viewer";

                }

            } else {

                authSection.classList.remove(
                    "hidden"
                );


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

    appState.signIn =
        async function (email, password) {

            if (!authMessage) {

                return null;

            }


            authMessage.textContent =
                "Authenticating…";


            if (!email || !password) {

                authMessage.textContent =
                    "Please enter your email and password.";

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


                const profile =
                    await appState.loadUserProfile(
                        data.user
                    );


                appState.currentUser =
                    appState.normalizeUser(
                        data.user,
                        profile
                    );


                appState.utils.writeStorage(
                    "gdmCurrentUser",
                    appState.currentUser
                );


                authMessage.textContent =
                    "Signed in successfully.";


                appState.renderAuthState();


                if (
                    typeof appState.initializeApp ===
                    "function"
                ) {

                    await appState.initializeApp();

                }


                return appState.currentUser;

            } catch (error) {

                console.error(
                    "Supabase sign-in failed:",
                    error
                );


                authMessage.textContent =
                    error.message ||
                    "Unable to sign in.";


                return null;

            }

        };


    // =================================================
    // GOOGLE SIGN IN
    // =================================================

    appState.signInWithGoogle =
        async function () {

            if (!authMessage) {

                return null;

            }


            authMessage.textContent =
                "Signing in with Google…";


            try {

                const redirectTo =
                    window.location.href;


                const {
                    data,
                    error
                } = await supabase.auth
                    .signInWithOAuth({

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
                    "Google sign-in failed:",
                    error
                );


                authMessage.textContent =
                    error.message ||
                    "Google sign-in failed.";


                return null;

            }

        };


    // =================================================
    // PASSWORD RESET
    // =================================================

    appState.sendPasswordReset =
        async function (email) {

            if (!authMessage) {

                return;

            }


            if (!email) {

                authMessage.textContent =
                    "Please enter your email address above.";

                return;

            }


            authMessage.textContent =
                "Sending password reset link…";


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


                authMessage.textContent =
                    "Password reset link sent. Check your inbox.";

            } catch (error) {

                console.error(
                    "Password reset failed:",
                    error
                );


                authMessage.textContent =
                    error.message ||
                    "Could not send reset email.";

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


            appState.currentUser =
                null;


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
    // HANDLE AUTHENTICATED USER
    // =================================================

    appState.handleSupabaseUser =
        async function (user) {

            if (!user) {

                appState.currentUser =
                    null;


                appState.utils.writeStorage(
                    "gdmCurrentUser",
                    null
                );


                appState.renderAuthState();


                /*
                 * Dashboard sub-pages require authentication.
                 */

                if (
                    location.pathname.includes(
                        "/gdm-dashboard/"
                    )
                ) {

                    location.href =
                        "../../index.html";

                }


                return null;

            }


            const profile =
                await appState.loadUserProfile(
                    user
                );


            appState.currentUser =
                appState.normalizeUser(
                    user,
                    profile
                );


            appState.utils.writeStorage(
                "gdmCurrentUser",
                appState.currentUser
            );


            appState.renderAuthState();


            if (
                typeof appState.initializeApp ===
                "function"
            ) {

                await appState.initializeApp();

            }


            return appState.currentUser;

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
             * Avoid unnecessary database work
             * during token refresh.
             */

            if (
                event ===
                "TOKEN_REFRESHED"
            ) {

                return;

            }


            if (session?.user) {

                /*
                 * Avoid duplicate initialization
                 * if currentUser is already correct.
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


                const email =
                    emailField.value.trim();


                const password =
                    passwordField.value;


                await appState.signIn(
                    email,
                    password
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
            } = await supabase.auth
                .getSession();


            if (error) {

                throw error;

            }


            if (data?.session?.user) {

                await appState.handleSupabaseUser(
                    data.session.user
                );

            } else {

                appState.currentUser =
                    null;


                appState.utils.writeStorage(
                    "gdmCurrentUser",
                    null
                );


                appState.renderAuthState();


                if (
                    location.pathname.includes(
                        "/gdm-dashboard/"
                    )
                ) {

                    location.href =
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
