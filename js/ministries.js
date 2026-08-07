/*
==================================================
 GDM MANAGEMENT SYSTEM
 ministries.js

 Handles:
 - Firestore ministry collection
 - Add ministry
 - Update ministry
 - Delete ministry
 - Real-time updates
==================================================
*/


window.gdmApp = window.gdmApp || {};

(function(){

const appState = window.gdmApp;


/*
--------------------------------------
Check Firebase Connection
--------------------------------------
*/

function checkDatabase(){

    if(!appState.db){

        console.error(
        "Firestore is not connected"
        );

        return false;
    }

    return true;

}



/*
--------------------------------------
Load Ministries
--------------------------------------
*/

appState.loadMinistries = function(){

    if(!checkDatabase()) return;


    appState.db
    .collection("ministries")
    .orderBy("createdAt","desc")
    .onSnapshot(snapshot=>{


        appState.ministries = [];


        snapshot.forEach(doc=>{


            appState.ministries.push({

                id:doc.id,

                ...doc.data()

            });


        });



        console.log(
        "Ministries loaded:",
        appState.ministries
        );


        if(
        typeof appState.renderMinistries
        === "function"
        ){

            appState.renderMinistries();

        }



    },

    error=>{

        console.error(
        "Ministry loading error:",
        error
        );

    });


};




/*
--------------------------------------
Add New Ministry
--------------------------------------
*/


appState.addMinistry = async function(data){


    if(!checkDatabase()) return;


    const ministry = {


        title:data.title,


        leader:data.leader || "",


        description:
        data.description || "",


        members:
        Number(data.members || 0),


        status:
        data.status || "Active",


        createdAt:
        firebase.firestore.FieldValue.serverTimestamp()

    };



    try{


        await appState.db
        .collection("ministries")
        .add(ministry);



        console.log(
        "Ministry added successfully"
        );


        if(appState.showToast){

            appState.showToast(
            "Success",
            "Ministry created successfully"
            );

        }



    }


    catch(error){


        console.error(
        "Add ministry failed",
        error
        );

    }


};




/*
--------------------------------------
Update Ministry
--------------------------------------
*/


appState.updateMinistry = async function(
id,
updates
){


if(!checkDatabase()) return;



try{


await appState.db
.collection("ministries")
.doc(id)
.update(updates);



if(appState.showToast){

appState.showToast(
"Updated",
"Ministry information updated"
);

}


}

catch(error){

console.error(
"Update failed",
error
);

}



};





/*
--------------------------------------
Delete Ministry
--------------------------------------
*/


appState.deleteMinistry = async function(id){


if(!checkDatabase()) return;



const confirmDelete =
confirm(
"Are you sure you want to delete this ministry?"
);



if(!confirmDelete)
return;



try{


await appState.db
.collection("ministries")
.doc(id)
.delete();



if(appState.showToast){

appState.showToast(
"Deleted",
"Ministry removed"
);

}



}


catch(error){

console.error(
"Delete ministry failed",
error
);


}



};





/*
--------------------------------------
Search Ministries
--------------------------------------
*/


appState.searchMinistries=function(keyword){


keyword =
keyword.toLowerCase();



return (
appState.ministries || []

).filter(ministry=>{


return (

ministry.title
.toLowerCase()
.includes(keyword)

||

ministry.leader
.toLowerCase()
.includes(keyword)

);


});


};





})();