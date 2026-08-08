window.gdmApp = window.gdmApp || {};

(function () {

const appState = window.gdmApp;


// =====================================================
// SAFE STORAGE
// =====================================================

if (!appState.utils) {

    appState.utils = {

        readStorage:(key,fallback)=>{

            try{

                const data = localStorage.getItem(key);

                return data ? JSON.parse(data) : fallback;

            }catch(error){

                return fallback;

            }

        },


        writeStorage:(key,value)=>{

            try{

                localStorage.setItem(
                    key,
                    JSON.stringify(value)
                );

            }catch(error){

                console.warn(
                    "Storage error:",
                    error
                );

            }

        }

    };

}



// =====================================================
// DOM ELEMENTS
// =====================================================


const sections =
Array.from(
document.querySelectorAll(
"main section[id]"
));


const navItems =
Array.from(
document.querySelectorAll(
".nav-item"
));


const navButtons =
navItems.filter(
item=>item.tagName==="BUTTON"
);


const globalSearch =
document.getElementById(
"globalSearch"
);


const ministriesSearch =
document.getElementById(
"ministriesSearch"
);


const loadingOverlay =
document.getElementById(
"loadingSkeleton"
);



// =====================================================
// NAVIGATION
// =====================================================


function showSection(target){


const section =
sections.find(
section=>section.id===target
);


if(!section)return;



sections.forEach(section=>{

section.classList.toggle(
"hidden",
section.id!==target
);

});



navItems.forEach(item=>{

item.classList.toggle(
"active",
item.dataset.target===target
);

});



const title =
document.getElementById(
"pageTitle"
);



if(title){


const titles={

dashboardSection:
"Management Dashboard",

ministriesSection:
"Ministries",

documentsSection:
"Documents",

reportsSection:
"Reports",

activitySection:
"Recent Activity"

};


title.textContent =
titles[target] ||
"Management Dashboard";


}



}



// =====================================================
// ROLE ACCESS
// =====================================================


function isSectionAllowed(target){

    if(!appState.currentUser){
        return false;
    }

    const role =
        String(
            appState.currentUser.role || "Viewer"
        ).trim();

    const permissions = {

        "Super Admin": [
            "dashboardSection",
            "ministriesSection",
            "membersSection",
            "documentsSection",
            "reportsSection",
            "activitySection"
        ],

        "Admin": [
            "dashboardSection",
            "ministriesSection",
            "membersSection",
            "documentsSection",
            "reportsSection",
            "activitySection"
        ],

        "Member": [
    "dashboardSection",
    "ministriesSection",
    "membersSection",
    "documentsSection",
    "reportsSection",
    "activitySection"
],

        "Viewer": [
            "dashboardSection",
            "ministriesSection"
        ]

    };

    return (
        permissions[role] || []
    ).includes(target);
}




appState.updateNavPermissions = function(){

    navItems.forEach(item => {

        const target =
            item.dataset.target;

        if(!target){
            return;
        }

        const allowed =
            isSectionAllowed(target);

        item.classList.toggle(
            "disabled",
            !allowed
        );

        if(item.tagName === "BUTTON"){

            item.disabled =
                !allowed;

        }

    });

};





// =====================================================
// LOADING
// =====================================================


appState.showLoading=function(status){


if(!loadingOverlay)
return;



loadingOverlay.classList.toggle(
"hidden",
!status
);


};





// =====================================================
// INITIALIZE APPLICATION
// =====================================================


appState.initializeApp =
async function(){


try{


appState.showLoading(true);



const data =
await appState.loadDashboardData();



appState.dashboardData =
data;



appState.renderAll();



if(typeof appState.renderNotifications==="function"){

appState.renderNotifications();

}



if(typeof appState.startLiveNotifications==="function"){

appState.startLiveNotifications();

}



if(
typeof appState.subscribeRealtimeCollections==="function"
){

appState.subscribeRealtimeCollections();

}



appState.updateNavPermissions();



showSection(
"dashboardSection"
);



}catch(error){


console.error(
"Dashboard initialization failed:",
error
);


}
finally{


appState.showLoading(false);


}



};





// =====================================================
// RENDER EVERYTHING
// =====================================================


appState.renderAll=function(){

    if(appState.dashboardData){

        appState.ministries =
        appState.dashboardData.ministries || [];

        appState.members =
        appState.dashboardData.members || [];

        appState.documents =
        appState.dashboardData.documents || [];

        appState.activity =
        appState.dashboardData.activity || [];

        appState.reportSubmissions =
        appState.dashboardData.reportSubmissions || [];

    }


    appState.renderDashboard();


    appState.renderMinistries();


    appState.renderMembers();


    if(typeof appState.renderDocuments==="function")
        appState.renderDocuments();


    if(typeof appState.renderReports==="function")
        appState.renderReports();


    if(typeof appState.renderActivity==="function")
        appState.renderActivity();


};




// =====================================================
// MEMBERS
// =====================================================


appState.renderMembers=function(){


const container =
document.getElementById(
"membersGrid"
);



if(!container)
return;



const members =
appState.members ||
appState.dashboardData?.members ||
[];



container.innerHTML="";



if(!members.length){


container.innerHTML=
`
<div class="empty-state">
No members available.
</div>
`;


return;


}




members.forEach(member=>{


const card =
document.createElement(
"article"
);



card.className =
"member-card";



card.innerHTML=
`

<h3>
${member.name ||
member.displayName ||
"Team Member"}
</h3>


<p>
<strong>
${member.role ||
member.position ||
"Member"}
</strong>
</p>


<p>
${member.email ||
"No contact"}
</p>


<span class="badge badge-soft">
${member.status ||
"Active"}
</span>

`;



container.appendChild(card);



});



};





// =====================================================
// DASHBOARD HOME
// =====================================================


appState.renderDashboard=function(){


const data =
appState.dashboardData;


if(!data)
return;



const heroTitle =
document.getElementById(
"heroTitle"
);


const heroSummary =
document.getElementById(
"heroSummary"
);



if(heroTitle)
heroTitle.textContent =
data.heroTitle || 
"Good Deeds Ministries";



if(heroSummary)
heroSummary.textContent =
data.summary || "";





const statsGrid =
document.getElementById(
"statsGrid"
);



if(statsGrid){


statsGrid.innerHTML="";



(data.stats || [])
.forEach(stat=>{


const card =
document.createElement(
"article"
);



card.className =
"stat-card";



card.innerHTML=
`

<div class="number">
${stat.number || 0}
</div>

<div class="label">
${stat.label || ""}
</div>

`;



statsGrid.appendChild(card);



});


}





};

// =====================================================
// MINISTRIES RENDERING (FIRESTORE SAFE)
// =====================================================


appState.renderMinistries = function () {

    const ministryCards = document.getElementById("ministryCards");
    const ministryTableBody = document.getElementById("ministryTableBody");

    const query = (ministriesSearch?.value || "")
        .toLowerCase()
        .trim();


    const source =
        appState.ministries ||
        appState.dashboardData?.ministries ||
        [];


    const ministries = source.filter((ministry)=>{

        const title =
            String(ministry.title || "")
            .toLowerCase();

        const lead =
            String(ministry.lead || "")
            .toLowerCase();

        const focus =
            String(ministry.focus || "")
            .toLowerCase();


        return (
            title.includes(query) ||
            lead.includes(query) ||
            focus.includes(query)
        );

    });


    if(ministryCards){

        ministryCards.innerHTML="";


        if(!ministries.length){

            ministryCards.innerHTML =
            `
            <div class="empty-state">
                No ministries found.
            </div>
            `;

        }


        ministries.forEach((ministry)=>{


            const card =
            document.createElement("article");


            card.className =
            "ministry-card";


            card.innerHTML=`

            <h4>
                ${ministry.title || "Unnamed Ministry"}
            </h4>


            <p>
                ${ministry.focus || "No focus added"}
            </p>


            <div class="progress-bar">
                <span style="
                width:${ministry.progress || 0}%
                ">
                </span>
            </div>


            <div class="timeline-meta">

                <span>
                ${ministry.members || 0} members
                </span>


                <strong>
                ${ministry.status || "Active"}
                </strong>

            </div>

            `;


            ministryCards.appendChild(card);

        });

    }



    if(ministryTableBody){

        ministryTableBody.innerHTML="";


        ministries.forEach((ministry)=>{


            const row =
            document.createElement("tr");


            row.innerHTML=`

            <td>${ministry.title || "-"}</td>

            <td>${ministry.lead || "-"}</td>

            <td>${ministry.progress || 0}%</td>

            <td>${ministry.members || 0}</td>

            <td>${ministry.status || "-"}</td>

            `;


            ministryTableBody.appendChild(row);

        });

    }



    const totalMinistries =
    document.getElementById(
    "totalMinistriesCount"
    );


    if(totalMinistries){

        totalMinistries.textContent =
        String(source.length);

    }


};



// =====================================================
// DOCUMENTS
// =====================================================


appState.renderDocuments=function(){


const table =
    document.getElementById(
        "documentTableBody"
    );



const documentCount =
document.getElementById(
"documentCount"
);



const ministryCount =
document.getElementById(
"docMinistryCount"
);



const recentCount =
document.getElementById(
"recentUploadsCount"
);




const docs =
appState.documents ||
appState.dashboardData?.documents ||
[];




if(documentCount)
documentCount.textContent =
String(docs.length);





const ministries =
new Set(
docs.map(doc=>
doc.ministry || "General"
)
);



if(ministryCount)
ministryCount.textContent =
String(ministries.size);





if(recentCount){


const recent =
docs.filter(doc=>{

if(!doc.uploadedAt)
return false;


// Firestore Timestamp support
if(
typeof doc.uploadedAt.toDate === "function"
){

const diff =
Date.now() -
doc.uploadedAt.toDate().getTime();

return diff <
7 *
24 *
60 *
60 *
1000;

}


// Normal string date support
if(
typeof doc.uploadedAt === "string"
){

if(
doc.uploadedAt.includes("T")
){

const diff =
Date.now() -
new Date(doc.uploadedAt).getTime();

return diff <
7 *
24 *
60 *
60 *
1000;

}


return (
doc.uploadedAt.includes("day") ||
doc.uploadedAt.includes("week")
);

}


return false;


}).length;


recentCount.textContent =
String(recent);

}





if(table){


table.innerHTML="";



if(!docs.length){


table.innerHTML=
`

<tr>

<td colspan="5">
No documents available.
</td>

</tr>

`;


return;


}




docs.forEach(doc=>{


const row =
document.createElement(
"tr"
);



row.innerHTML=
`

<td>
${doc.title || "-"}
</td>


<td>
${doc.ministry || "General"}
</td>


<td>
${doc.type || "-"}
</td>


<td>
${doc.size || "-"}
</td>


<td>
${doc.uploadedAt || "-"}
</td>


`;



table.appendChild(row);



});


}



};






// =====================================================
// REPORTS
// =====================================================


appState.renderReports=function(){


const table =
document.getElementById(
"reportsTableBody"
);



const reach =
document.getElementById(
"reachMetric"
);



const hours =
document.getElementById(
"hoursMetric"
);



const approval =
document.getElementById(
"approvalMetric"
);




const reports =
appState.reportSubmissions ||
appState.dashboardData?.reportSubmissions ||
[];




const values =
reports.map(
r=>Number(r.value)||0
);



const total =
values.reduce(
(a,b)=>a+b,
0
);



const highest =
values.length ?
Math.max(...values):
0;




if(reach)
reach.textContent =
String(highest * 20);



if(hours)
hours.textContent =
`${total}h`;



if(approval)
approval.textContent =
`${Math.min(100,70+reports.length)}%`;





if(table){


table.innerHTML="";



reports.forEach(report=>{


const row =
document.createElement(
"tr"
);



row.innerHTML=
`

<td>
${report.title || "Untitled"}
</td>


<td>
${report.ministry || "General"}
</td>


<td>
${report.summary || "-"}
</td>


<td>
${report.value || 0}
</td>


<td>
${new Date(
report.submittedAt ||
Date.now()
)
.toLocaleDateString()}
</td>


`;



table.appendChild(row);



});


}



};





// =====================================================
// ACTIVITY
// =====================================================


appState.renderActivity=function(){


const timeline =
document.getElementById(
"activityTimeline"
);



if(!timeline)
return;



const activities =
appState.activity ||
appState.dashboardData?.activity ||
[];




timeline.innerHTML="";



activities.forEach(item=>{


const li =
document.createElement(
"li"
);



li.className =
"timeline-item";



li.innerHTML=
`

<div class="timeline-meta">

<strong>
${item.title || "Activity"}
</strong>


<span>
${item.when || "Now"}
</span>

</div>


<p>
${item.detail || ""}
</p>

`;



timeline.appendChild(li);



});



};


// =====================================================
// SEARCH
// =====================================================


function highlightSearchTerms(){


const value =
globalSearch?.value || "";



if(ministriesSearch){


ministriesSearch.value =
value;



appState.renderMinistries();


}



}




// =====================================================
// UPLOAD DOCUMENT
// =====================================================


appState.uploadDocumentFile =
async function(file){



if(!file)
return;




const extension =
file.name
.split(".")
.pop()
.toLowerCase();



const typeMap={

pdf:"PDF",

doc:"Word",

docx:"Word",

jpg:"Image",

jpeg:"Image",

png:"Image",

mp4:"Video",

mov:"Video"

};



const type =
typeMap[extension] ||
extension.toUpperCase();



const size =
file.size <
1024*1024

?

`${Math.round(file.size/1024)} KB`

:

`${(file.size/(1024*1024)).toFixed(1)} MB`;





const entry={


title:file.name,


ministry:
appState.ministries?.[0]?.title ||
"General",


type,


size,


uploadedBy:
appState.currentUser?.displayName ||
"System",


uploadedAt:
new Date()
.toISOString()



};





if(
typeof appState.saveDocumentEntry==="function"
){


await appState.saveDocumentEntry(
entry
);


}



appState.renderDocuments();



};






// =====================================================
// NAVIGATION EVENTS
// =====================================================


if(navButtons.length){

    navButtons.forEach(button=>{

        button.addEventListener(
            "click",
            ()=>{

                const target =
                    button.dataset.target;

                if(!target)
                    return;

                showSection(target);

            }
        );

    });

}






// =====================================================
// SEARCH EVENTS
// =====================================================


if(globalSearch){


globalSearch.addEventListener(
"input",
highlightSearchTerms
);


}



if(ministriesSearch){


ministriesSearch.addEventListener(
"input",
()=>{


appState.renderMinistries();


}

);


}






// =====================================================
// QUICK ADD ACTIVITY
// =====================================================


const quickAddBtn =
document.getElementById(
"quickAddBtn"
);



if(quickAddBtn){


quickAddBtn.addEventListener(
"click",
async()=>{


const note =
prompt(
"Enter your quick note:"
);



if(!note)
return;




const activity={


title:
"Quick Note",


detail:
note,


when:
"Just now",


createdAt:
new Date()
.toISOString()


};




if(
typeof appState.saveActivityEntry==="function"
){


await appState.saveActivityEntry(
activity
);


}



appState.renderActivity();



}


);


}






// =====================================================
// REPORT FORM
// =====================================================


const reportForm =
document.getElementById(
"reportForm"
);



if(reportForm){


reportForm.addEventListener(
"submit",
async event=>{


event.preventDefault();



const title =
document.getElementById(
"reportTitle"
)?.value.trim();



const ministry =
document.getElementById(
"reportMinistry"
)?.value.trim();



const summary =
document.getElementById(
"reportSummary"
)?.value.trim();



const value =
document.getElementById(
"reportValue"
)?.value;



if(
!title ||
!ministry ||
!summary ||
!value
){


alert(
"Please complete all fields."
);


return;


}





const report={


title,


ministry,


summary,


value:Number(value),


submittedAt:
new Date()
.toISOString(),


submittedBy:
appState.currentUser?.displayName ||
"Guest"



};





if(
typeof appState.saveReportEntry==="function"
){


await appState.saveReportEntry(
report
);


}



appState.renderReports();



reportForm.reset();



}


);


}







// =====================================================
// MEMBER FORM
// =====================================================


const memberForm =
document.getElementById(
"memberForm"
);



if(memberForm){


memberForm.addEventListener(
"submit",
async event=>{


event.preventDefault();



const member={


name:
document.getElementById(
"memberName"
)?.value.trim(),



role:
document.getElementById(
"memberRole"
)?.value.trim(),



email:
document.getElementById(
"memberEmail"
)?.value.trim(),



status:
document.getElementById(
"memberStatus"
)?.value ||
"Active"



};





if(
!member.name ||
!member.email
){


alert(
"Name and email required."
);


return;


}




if(
typeof appState.saveMemberEntry==="function"
){


await appState.saveMemberEntry(
member
);


}




appState.renderMembers();



memberForm.reset();



}


);


}








// =====================================================
// THEME
// =====================================================


const themeToggle =
document.getElementById(
"themeToggle"
);



if(themeToggle){


themeToggle.addEventListener(
"click",
()=>{


document.body.classList.toggle(
"dark"
);



themeToggle.textContent =
document.body.classList.contains("dark")

?

"Light mode"

:

"Dark mode";



}


);


}






// =====================================================
// DOM READY
// =====================================================
document.addEventListener(
"DOMContentLoaded",
()=>{


appState.renderAuthState();


appState.updateNavPermissions();


const storedUser =
appState.utils.readStorage(
"gdmCurrentUser",
null
);


if(storedUser){

appState.currentUser = storedUser;

appState.renderAuthState();

}


});


})();
