window.gdmApp = window.gdmApp || {};

(function () {
    const appState = window.gdmApp;

    function renderMembers() {
        console.log("MEMBER DATA:", appState.members);

        const members =
            appState.members ||
            appState.dashboardData?.members ||
            [];

        console.log("FINAL MEMBERS:", members);

        const membersGrid = document.getElementById("membersGrid");
        if (!membersGrid) return;

        membersGrid.innerHTML = "";

        members.forEach((member) => {
            const card = document.createElement("article");
            card.className = "member-card";

            card.innerHTML = `
                <h3>${member.name || "Unknown"}</h3>
                <p>
                    <strong>${member.role || "Member"}</strong>
                </p>
                <p>${member.email || ""}</p>
                <span class="badge badge-soft">
                    ${member.status || "Active"}
                </span>
            `;

            membersGrid.appendChild(card);
        });
    }

    appState.renderMembers = renderMembers;

    document.addEventListener("gdmDataLoaded", function () {
        console.log("Firestore data received, rendering members...");
        renderMembers();
    });


        // ===============================
    // ADD NEW MEMBER TO FIRESTORE
    // ===============================

    const memberForm = document.getElementById("memberForm");

    if (memberForm) {

        memberForm.addEventListener("submit", async function(e){

    e.preventDefault();


    const submitButton =
    memberForm.querySelector("button[type='submit']");


    if(submitButton){
        submitButton.disabled = true;
        submitButton.textContent = "Saving...";
    }


    const newMember = {

                name:
                document.getElementById("memberName").value.trim(),

                role:
                document.getElementById("memberRole").value.trim(),

                email:
                document.getElementById("memberEmail").value.trim(),

                status:
                document.getElementById("memberStatus").value,


                createdAt:
                new Date().toISOString()

            };



            try {


                // Save to Firestore

                const docRef =
                await appState.db
                .collection("members")
                .add(newMember);



                console.log(
                    "New member added:",
                    docRef.id
                );



                // Add locally so UI updates immediately

                newMember.id = docRef.id;


                appState.members =
                [
                    ...appState.members,
                    newMember
                ];



                renderMembers();



                // Reset form

                memberForm.reset();



               alert(
    "Member added successfully"
);


} catch(error){

    console.error(
        "Failed adding member:",
        error
    );

    alert(
        "Could not add member"
    );


} finally {


    if(submitButton){

        submitButton.disabled = false;
        submitButton.textContent = "Save member";

    }


}


});

    }

})();