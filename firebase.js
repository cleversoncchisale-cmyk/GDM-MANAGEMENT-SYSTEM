/*
====================================================
 Good Deeds Ministries Management System
 Firebase Configuration
====================================================
*/

window.gdmApp = window.gdmApp || {};

(function () {

    const appState = window.gdmApp;


    // Firebase Configuration

    const firebaseConfig = {
        apiKey: "AIzaSyBqf71f4XKkVfLhDWo-sqX-wAiJJPtgY6M",
        authDomain: "gdm-management-system.firebaseapp.com",
        projectId: "gdm-management-system",
        storageBucket: "gdm-management-system.firebasestorage.app",
        messagingSenderId: "990732389159",
        appId: "1:990732389159:web:bb7b48ed498f0b903c7702",
        measurementId: "G-9FGEMJCRBB"
    };


    // -----------------------------------------
    // Initialize Firebase FIRST
    // -----------------------------------------

    if (!firebase.apps.length) {

        firebase.initializeApp(firebaseConfig);

        console.log(
            "🔥 Firebase initialized successfully"
        );

    } else {

        console.log(
            "🔥 Firebase app already exists"
        );

    }



    // -----------------------------------------
    // Load Firebase Services AFTER initialize
    // -----------------------------------------

    appState.firebase = firebase;

    appState.auth = firebase.auth();

    appState.db = firebase.firestore();

    appState.storage = firebase.storage();



    // -----------------------------------------
    // Firestore Settings
    // -----------------------------------------

    try {

        appState.db.settings({
    merge: true,
    ignoreUndefinedProperties: true
});


        console.log(
            "Firestore settings applied"
        );


    } catch(error){

        console.warn(
            "Firestore settings skipped:",
            error.message
        );

    }



    // -----------------------------------------
    // Application Mode
    // -----------------------------------------

    appState.mockMode = false;

    appState.firebaseReady = true;



    console.log(
        "🔥 GDM Firebase Services Ready",
        {
            auth: !!appState.auth,
            firestore: !!appState.db,
            storage: !!appState.storage
        }
    );


})();