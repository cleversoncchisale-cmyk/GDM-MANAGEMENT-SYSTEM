/*
====================================================
 Good Deeds Ministries Management System
 Supabase Configuration
====================================================
*/

window.gdmApp = window.gdmApp || {};

(function () {

    const appState = window.gdmApp;

    // -----------------------------------------
    // Supabase Configuration
    // -----------------------------------------

    const SUPABASE_URL =
        "https://lnilcwxvpxiwcjdamxdz.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_8ywmhOkM1Mv2pkBIEXTO2w_oAmksE3C";


    // -----------------------------------------
    // Initialize Supabase
    // -----------------------------------------

    if (!window.supabase) {

        console.error(
            "Supabase SDK was not loaded."
        );

        return;
    }


    appState.supabase =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );


    // -----------------------------------------
    // Application Mode
    // -----------------------------------------

    appState.mockMode = false;

    appState.supabaseReady = true;


    // -----------------------------------------
    // Compatibility flags
    // -----------------------------------------

    appState.firebaseReady = false;


    console.log(
        "🟢 GDM Supabase initialized successfully"
    );

    console.log(
        "🟢 GDM Supabase Services Ready",
        {
            database: !!appState.supabase,
            auth: !!appState.supabase?.auth,
            storage: !!appState.supabase?.storage
        }
    );


})();
