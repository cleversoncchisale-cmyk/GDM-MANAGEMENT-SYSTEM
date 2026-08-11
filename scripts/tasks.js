// =====================================================
// GDM TASK MANAGEMENT
// =====================================================

const taskState = {

    tasks: [],

    currentUser: null

};


// =====================================================
// LOAD CURRENT USER
// =====================================================

function getTaskUser() {

    try {

        const storedUser =
            localStorage.getItem("gdmCurrentUser");

        if (storedUser) {

            return JSON.parse(storedUser);

        }

    } catch (error) {

        console.error(
            "Unable to load current user:",
            error
        );

    }

    return null;

}


// =====================================================
// LOAD TASKS FROM FIRESTORE
// =====================================================

async function loadTasks() {

    try {

        if (
            typeof firebase === "undefined" ||
            !firebase.firestore
        ) {

            console.error(
                "Firebase Firestore is not available."
            );

            return;

        }


        const snapshot =
            await firebase
                .firestore()
                .collection("tasks")
                .get();


        taskState.tasks =
            snapshot.docs.map(doc => ({

                id: doc.id,

                ...doc.data()

            }));


        console.log(
            "GDM Tasks Loaded:",
            taskState.tasks
        );


        renderTaskStatistics();

        renderTasks();

    }

    catch (error) {

        console.error(
            "Failed to load tasks:",
            error
        );

    }

}


// =====================================================
// DATE HELPERS
// =====================================================

function taskDate(value) {

    if (!value)
        return null;


    if (
        value &&
        typeof value.toDate === "function"
    ) {

        return value.toDate();

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


// =====================================================
// CHECK COMPLETED
// =====================================================

function isTaskCompleted(task) {

    const status =
        String(
            task.status || ""
        ).toLowerCase();


    return (
        status === "completed" ||
        status === "complete" ||
        status === "done"
    );

}


// =====================================================
// CHECK OVERDUE
// =====================================================

function isTaskOverdue(task) {

    if (
        isTaskCompleted(task)
    ) {

        return false;

    }


    const dueDate =
        taskDate(
            task.dueDate
        );


    if (!dueDate)
        return false;


    return (
        dueDate <
        new Date()
    );

}


// =====================================================
// CHECK UPCOMING
// =====================================================

function isTaskUpcoming(task) {

    if (
        isTaskCompleted(task)
    ) {

        return false;

    }


    const dueDate =
        taskDate(
            task.dueDate
        );


    if (!dueDate)
        return false;


    return (
        dueDate >=
        new Date()
    );

}


// =====================================================
// CHECK DUE TODAY
// =====================================================

function isTaskDueToday(task) {

    const dueDate =
        taskDate(
            task.dueDate
        );


    if (!dueDate)
        return false;


    const today =
        new Date();


    return (
        dueDate.getFullYear() ===
        today.getFullYear() &&

        dueDate.getMonth() ===
        today.getMonth() &&

        dueDate.getDate() ===
        today.getDate()
    );

}


// =====================================================
// RENDER STATISTICS
// =====================================================

function renderTaskStatistics() {

    const tasks =
        taskState.tasks;


    const currentUser =
        taskState.currentUser;


    const allTasks =
        tasks.length;


    const myTasks =
        currentUser

            ?

            tasks.filter(task => {

                return (
                    task.assignedTo ===
                    currentUser.uid ||

                    task.assignedTo ===
                    currentUser.email ||

                    task.assignedTo ===
                    currentUser.displayName
                );

            }).length

            :

            0;


    const dueToday =
        tasks.filter(
            isTaskDueToday
        ).length;


    const overdue =
        tasks.filter(
            isTaskOverdue
        ).length;


    const upcoming =
        tasks.filter(
            isTaskUpcoming
        ).length;


    const completed =
        tasks.filter(
            isTaskCompleted
        ).length;


    setTaskCounter(
        "allTasksCount",
        allTasks
    );


    setTaskCounter(
        "myTasksCount",
        myTasks
    );


    setTaskCounter(
        "dueTodayCount",
        dueToday
    );


    setTaskCounter(
        "overdueTasksCount",
        overdue
    );


    setTaskCounter(
        "upcomingTasksCount",
        upcoming
    );


    setTaskCounter(
        "completedTasksCount",
        completed
    );

}


// =====================================================
// COUNTER HELPER
// =====================================================

function setTaskCounter(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            String(value);

    }

}


// =====================================================
// RENDER TASK TABLE
// =====================================================

function renderTasks() {

    const table =
        document.getElementById(
            "tasksTableBody"
        );


    if (!table)
        return;


    const filter =
        document.getElementById(
            "taskFilter"
        )?.value || "all";


    let tasks =
        [...taskState.tasks];


    // ---------------------------------------------
    // FILTER
    // ---------------------------------------------

    if (filter === "my") {

        const user =
            taskState.currentUser;


        if (user) {

            tasks =
                tasks.filter(task => {

                    return (
                        task.assignedTo === user.uid ||

                        task.assignedTo === user.email ||

                        task.assignedTo === user.displayName
                    );

                });

        }

    }


    if (filter === "overdue") {

        tasks =
            tasks.filter(
                isTaskOverdue
            );

    }


    if (filter === "upcoming") {

        tasks =
            tasks.filter(
                isTaskUpcoming
            );

    }


    if (filter === "completed") {

        tasks =
            tasks.filter(
                isTaskCompleted
            );

    }


    table.innerHTML = "";


    // ---------------------------------------------
    // EMPTY
    // ---------------------------------------------

    if (!tasks.length) {

        table.innerHTML = `

            <tr>

                <td colspan="6">

                    No tasks available.

                </td>

            </tr>

        `;

        return;

    }


    // ---------------------------------------------
    // TASK ROWS
    // ---------------------------------------------

    tasks.forEach(task => {

        const row =
            document.createElement(
                "tr"
            );


        const completed =
            isTaskCompleted(task);


        const overdue =
            isTaskOverdue(task);


        const dueDate =
            taskDate(
                task.dueDate
            );


        const formattedDate =
            dueDate

                ?

                dueDate.toLocaleDateString()

                :

                "-";


        let status =
            task.status ||
            "Pending";


        if (completed) {

            status =
                "Completed";

        }

        else if (overdue) {

            status =
                "Overdue";

        }


        row.innerHTML = `

            <td>

                <strong>

                    ${
                        task.title ||
                        "Untitled task"
                    }

                </strong>

                <div>

                    ${
                        task.description ||
                        ""
                    }

                </div>

            </td>


            <td>

                ${
                    task.assignedToName ||
                    task.assignedTo ||
                    "-"
                }

            </td>


            <td>

                ${
                    task.ministry ||
                    "-"
                }

            </td>


            <td>

                ${formattedDate}

            </td>


            <td>

                ${status}

            </td>


            <td>

                ${
                    Number(
                        task.progress
                    ) || 0
                }%

            </td>

        `;


        table.appendChild(row);

    });

}


// =====================================================
// FILTER CHANGE
// =====================================================

document.addEventListener(
    "change",
    event => {

        if (
            event.target &&
            event.target.id ===
                "taskFilter"
        ) {

            renderTasks();

        }

    }
);


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        taskState.currentUser =
            getTaskUser();


        loadTasks();

    }
);
