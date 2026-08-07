window.gdmApp = window.gdmApp || {};

(function () {

  const appState = window.gdmApp;


  // ---------- Ensure utils exists ----------
  if (!appState.utils) {

    appState.utils = {

      readStorage: (key, fallback) => {

        try {

          const raw = localStorage.getItem(key);

          return raw ? JSON.parse(raw) : fallback;

        } catch (e) {

          return fallback;

        }

      },


      writeStorage: (key, value) => {

        try {

          localStorage.setItem(
            key,
            JSON.stringify(value)
          );

        } catch (e) {

          console.warn(
            "localStorage write failed",
            e
          );

        }

      }

    };

  }



  // ---------- Default Dashboard Data ----------
  const buildSeedData = () => ({

    organization:
      "Good Deeds Ministries",


    heroTitle:
      "Operational Insights for the Ministries",


    summary:
      "Monitor progress, approvals, documents, and community impact in one modern dashboard.",



    stats: [

      {
        number: "124",
        label: "Events this month"
      },

      {
        number: "2.4K",
        label: "Active volunteers"
      },

      {
        number: "18",
        label: "Ministry teams"
      },

      {
        number: "1.7K",
        label: "Community members reached"
      }

    ],



    ministries: [],


    members: [],


    documents: [],


    reports: [],


    activity: [],


    reportSubmissions: [],


    notifications: []

  });





  // ---------- Load Dashboard Data ----------
  appState.loadDashboardData = async function () {


    let dashboardData =
      buildSeedData();



    // Load cached data first

    const cached =
      appState.utils.readStorage(
        "gdmDashboardData",
        null
      );


    if (cached) {

      dashboardData =
        Object.assign(
          {},
          dashboardData,
          cached
        );

    }





    // Load from Firebase

    if (
      appState.db &&
      !appState.mockMode
    ) {


      try {



        // Dashboard overview

        const dashboardSnapshot =
          await appState.db
          .collection("gdm-dashboard")
          .doc("overview")
          .get();



        if (dashboardSnapshot.exists) {

          dashboardData =
            Object.assign(
              {},
              dashboardData,
              dashboardSnapshot.data()
            );

        }





        // Ministries

        const ministriesSnapshot =
          await appState.db
          .collection("ministries")
          .get();



        dashboardData.ministries =
          ministriesSnapshot.docs.map(doc => ({

            id: doc.id,
            ...doc.data()

          }));







        // Members

        const membersSnapshot =
          await appState.db
          .collection("members")
          .get();



        dashboardData.members =
          membersSnapshot.docs.map(doc => ({

            id: doc.id,
            ...doc.data()

          }));







        // Documents

        const documentsSnapshot =
          await appState.db
          .collection("documents")
          .get();



        dashboardData.documents =
          documentsSnapshot.docs.map(doc => {

            const data = doc.data();


            return {

              id: doc.id,

              ...data,


              // Convert Firestore timestamp safely

              uploadedAt:
                data.uploadedAt &&
                typeof data.uploadedAt.toDate === "function"

                ? data.uploadedAt
                    .toDate()
                    .toLocaleDateString()

                : data.uploadedAt || ""

            };


          });







        // Reports

        const reportsSnapshot =
          await appState.db
          .collection("reports")
          .get();



        dashboardData.reportSubmissions =
          reportsSnapshot.docs.map(doc => ({

            id: doc.id,

            ...doc.data()

          }));







        // Activity

        const activitySnapshot =
          await appState.db
          .collection("activity")
          .get();



        dashboardData.activity =
          activitySnapshot.docs.map(doc => ({

            id: doc.id,

            ...doc.data()

          }));






        // Notifications

        const notificationsSnapshot =
          await appState.db
          .collection("notifications")
          .get();



        dashboardData.notifications =
          notificationsSnapshot.docs.map(doc => ({

            id: doc.id,

            ...doc.data()

          }));




      } catch(error) {


        console.warn(
          "Firestore loading error:",
          error
        );


      }


    }






    // Save state

    appState.dashboardData =
      dashboardData;



    appState.ministries =
      dashboardData.ministries || [];



    appState.members =
      dashboardData.members || [];



    appState.documents =
      dashboardData.documents || [];



    appState.activity =
      dashboardData.activity || [];



    appState.reportSubmissions =
      dashboardData.reportSubmissions || [];





    // Save local cache

    appState.saveDashboardData(
      dashboardData
);



console.log(
"GDM Dashboard Loaded:",
dashboardData
);


document.dispatchEvent(
new Event("GDM_DATA_READY")
);


return dashboardData;


// Refresh pages after Firestore data loads
if (typeof appState.renderMinistries === "function") {
    appState.renderMinistries();
}

if (typeof appState.renderMembers === "function") {
    appState.renderMembers();
}

if (typeof appState.renderDocuments === "function") {
    appState.renderDocuments();
}



return dashboardData;
};
      // ---------- Save Dashboard Data ----------
  appState.saveDashboardData = async function (data) {

    appState.dashboardData = data;


    appState.utils.writeStorage(
      "gdmDashboardData",
      data
    );



    if (
      appState.db &&
      !appState.mockMode
    ) {

      try {

        await appState.db
          .collection("gdm-dashboard")
          .doc("overview")
          .set(data);


      } catch (error) {

        console.warn(
          "Could not save dashboard data:",
          error
        );

      }

    }


    return data;

  };





  // ---------- Realtime Firestore Sync ----------
  appState.subscribeRealtimeCollections = function () {


    if (
      !appState.db ||
      appState.mockMode
    ) {

      return;

    }





    // Ministries

    appState.db
      .collection("ministries")
      .onSnapshot((snapshot) => {


        appState.ministries =
          snapshot.docs.map(doc => ({

            id: doc.id,
            ...doc.data()

          }));


        if (
          typeof appState.renderMinistries === "function"
        ) {

          appState.renderMinistries();

        }


      });






    // Members

    appState.db
      .collection("members")
      .onSnapshot((snapshot) => {


        appState.members =
          snapshot.docs.map(doc => ({

            id: doc.id,
            ...doc.data()

          }));


        if (
          typeof appState.renderMembers === "function"
        ) {

          appState.renderMembers();

        }


      });







    // Documents

    appState.db
      .collection("documents")
      .onSnapshot((snapshot)=>{


        appState.documents =
          snapshot.docs.map(doc=>{

            const data = doc.data();


            return {

              id: doc.id,

              ...data,


              uploadedAt:
                data.uploadedAt &&
                typeof data.uploadedAt.toDate === "function"

                ? data.uploadedAt
                    .toDate()
                    .toLocaleDateString()

                : data.uploadedAt || ""

            };


          });



        if (
          typeof appState.renderDocuments === "function"
        ){

          appState.renderDocuments();

        }



      });








    // Activity

    appState.db
      .collection("activity")
      .onSnapshot((snapshot)=>{


        appState.activity =
          snapshot.docs.map(doc=>({

            id: doc.id,
            ...doc.data()

          }));



        if (
          typeof appState.renderActivity === "function"
        ){

          appState.renderActivity();

        }


      });








    // Reports

    appState.db
      .collection("reports")
      .onSnapshot((snapshot)=>{


        appState.reportSubmissions =
          snapshot.docs.map(doc=>({

            id: doc.id,
            ...doc.data()

          }));



        if (
          typeof appState.renderReports === "function"
        ){

          appState.renderReports();

        }


      });




  };








  // ---------- Save Member ----------
  appState.saveMemberEntry = async function(member){


    const memberEntry = {

      ...member,

      status:
        member.status || "Active"

    };



    if(
      appState.db &&
      !appState.mockMode
    ){

      try{

        const ref =
          await appState.db
          .collection("members")
          .add(memberEntry);


        memberEntry.id = ref.id;


      }catch(error){

        console.warn(
          "Member save failed:",
          error
        );

      }

    }



    return memberEntry;

  };









  // ---------- Save Document ----------
  appState.saveDocumentEntry = async function(document){



    const entry = {

      ...document,

      uploadedAt:
        document.uploadedAt ||
        new Date().toISOString()

    };



    if(
      appState.db &&
      !appState.mockMode
    ){

      try{


        const ref =
          await appState.db
          .collection("documents")
          .add(entry);


        entry.id = ref.id;


      }catch(error){

        console.warn(
          "Document save failed:",
          error
        );

      }

    }


    return entry;


  };









  // ---------- Save Activity ----------
  appState.saveActivityEntry = async function(activity){



    const entry = {


      ...activity,


      createdAt:
        activity.createdAt ||
        new Date().toISOString()


    };



    if(
      appState.db &&
      !appState.mockMode
    ){


      try{


        const ref =
          await appState.db
          .collection("activity")
          .add(entry);


        entry.id = ref.id;



      }catch(error){

        console.warn(
          "Activity save failed:",
          error
        );

      }

    }


    return entry;


  };









  // ---------- Save Report ----------
  appState.saveReportEntry = async function(report){



    const entry = {


      ...report,


      value:
        Number(report.value) || 0,


      submittedAt:
        new Date().toISOString()



    };



    if(
      appState.db &&
      !appState.mockMode
    ){


      try{


        const ref =
          await appState.db
          .collection("reports")
          .add(entry);


        entry.id = ref.id;



      }catch(error){

        console.warn(
          "Report save failed:",
          error
        );


      }


    }


    return entry;


  };







})();