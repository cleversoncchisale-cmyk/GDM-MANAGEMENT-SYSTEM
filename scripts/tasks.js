// =====================================================
// GDM TASK MANAGEMENT
// =====================================================

const taskState = {
    tasks: [],
    members: [],
    ministries: [],
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
// ESCAPE TEXT
// =====================================================

function escapeTaskText(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// LOAD TASKS
// =====================================================

async function loadTasks() {

    try {

        const db =
            firebase.firestore();

        const snapshot =
            await db
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
// LOAD MEMBERS
// =====================================================

async function loadTaskMembers() {

    try {

        const db =
            firebase.firestore();

        const snapshot =
            await db
                .collection("members")
                .get();

        taskState.members =
            snapshot.docs.map(doc => ({

                id: doc.id,

                ...doc.data()

            }));

        console.log(
            "GDM Task Members Loaded:",
            taskState.members
        );

    }

    catch (error) {

        console.error(
            "Failed to load members:",
            error
        );

    }

}


// =====================================================
// LOAD MINISTRIES
// =====================================================

async function loadTaskMinistries() {

    try {

        const db =
            firebase.firestore();

        const snapshot =
            await db
                .collection("ministries")
                .get();

        taskState.ministries =
            snapshot.docs.map(doc => ({

                id: doc.id,

                ...doc.data()

            }));

        console.log(
            "GDM Task Ministries Loaded:",
            taskState.ministries
        );

    }

    catch (error) {

        console.error(
            "Failed to load ministries:",
            error
        );

    }

}


// =====================================================
// DATE HELPER
// =====================================================

function taskDate(value) {

    if (!value) {
        return null;
    }

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
// AUTOMATIC PROGRESS
// =====================================================

function getAutomaticProgress(task) {

    const status =
        String(
            task.status || "Pending"
        ).toLowerCase();

    if (
        status === "completed" ||
        status === "complete" ||
        status === "done"
    ) {

        return 100;

    }

    if (
        status === "in progress" ||
        status === "in-progress" ||
        status === "working"
    ) {

        return 50;

    }

    return 0;

}


// =====================================================
// COMPLETED
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
// OVERDUE
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

    if (!dueDate) {
        return false;
    }

    return (
        dueDate < new Date()
    );

}


// =====================================================
// UPCOMING
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

    if (!dueDate) {
        return false;
    }

    return (
        dueDate >= new Date()
    );

}


// =====================================================
// DUE TODAY
// =====================================================

function isTaskDueToday(task) {

    const dueDate =
        taskDate(
            task.dueDate
        );

    if (!dueDate) {
        return false;
    }

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
// COUNTER
// =====================================================

function setTaskCounter(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            String(value);

    }

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
// RENDER TASK TABLE
// =====================================================

function renderTasks() {

    const table =
        document.getElementById(
            "tasksTableBody"
        );

    if (!table) {
        return;
    }

    const filter =
        document.getElementById(
            "taskFilter"
        )?.value || "all";

    let tasks =
        [...taskState.tasks];


    // -------------------------------------------------
    // MY TASKS
    // -------------------------------------------------

    if (filter === "my") {

        const user =
            taskState.currentUser;

        if (user) {

            tasks =
                tasks.filter(task => {

                    return (

                        task.assignedTo ===
                        user.uid ||

                        task.assignedTo ===
                        user.email ||

                        task.assignedTo ===
                        user.displayName

                    );

                });

        }

    }


    // -------------------------------------------------
    // OVERDUE
    // -------------------------------------------------

    if (filter === "overdue") {

        tasks =
            tasks.filter(
                isTaskOverdue
            );

    }


    // -------------------------------------------------
    // UPCOMING
    // -------------------------------------------------

    if (filter === "upcoming") {

        tasks =
            tasks.filter(
                isTaskUpcoming
            );

    }


    // -------------------------------------------------
    // COMPLETED
    // -------------------------------------------------

    if (filter === "completed") {

        tasks =
            tasks.filter(
                isTaskCompleted
            );

    }


    table.innerHTML = "";


    // -------------------------------------------------
    // EMPTY
    // -------------------------------------------------

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


    // -------------------------------------------------
    // TASK ROWS
    // -------------------------------------------------

    tasks.forEach(task => {

        const row =
            document.createElement("tr");

        const completed =
            isTaskCompleted(task);

        const overdue =
            isTaskOverdue(task);

        const dueDate =
            taskDate(task.dueDate);

        const formattedDate =
            dueDate
                ?
                dueDate.toLocaleDateString()
                :
                "-";


        let status =
            String(
                task.status || "Pending"
            );


        if (completed) {

            status =
                "Completed";

        }


        row.innerHTML = `

            <td>

                <strong>

                    ${
                        escapeTaskText(
                            task.title ||
                            "Untitled task"
                        )
                    }

                </strong>

                <div>

                    ${
                        escapeTaskText(
                            task.description ||
                            ""
                        )
                    }

                </div>

            </td>


            <td>

                ${
                    escapeTaskText(
                        task.assignedToName ||
                        task.assignedTo ||
                        "-"
                    )
                }

            </td>


            <td>

                ${
                    escapeTaskText(
                        task.ministry ||
                        "-"
                    )
                }

            </td>


            <td>

                ${formattedDate}

            </td>


            <td>

                <select
                    class="task-status-select"
                    data-task-id="${task.id}"
                >

                    <option
                        value="Pending"
                        ${status === "Pending" ? "selected" : ""}
                    >
                        Pending
                    </option>

                    <option
                        value="In Progress"
                        ${status === "In Progress" ? "selected" : ""}
                    >
                        In Progress
                    </option>

                    <option
                        value="Completed"
                        ${status === "Completed" ? "selected" : ""}
                    >
                        Completed
                    </option>

                </select>

            </td>


            <td>

                <strong>

                    ${getAutomaticProgress(task)}%

                </strong>

            </td>

        `;

        table.appendChild(row);

    });

}


// =====================================================
// CREATE TASK FORM
// =====================================================

function createTaskForm() {

    if (
        document.getElementById(
            "taskFormOverlay"
        )
    ) {

        return;

    }


    const overlay =
        document.createElement("div");

    overlay.id =
        "taskFormOverlay";

    overlay.innerHTML = `

        <div
            class="panel glass-panel"
            style="
                position:fixed;
                inset:50% auto auto 50%;
                transform:translate(-50%, -50%);
                width:min(650px, 92vw);
                max-height:90vh;
                overflow-y:auto;
                z-index:9999;
                padding:25px;
            "
        >

            <div class="section-header">

                <div>

                    <p class="eyebrow">
                        Task Management
                    </p>

                    <h2>
                        Assign New Task
                    </h2>

                </div>

                <button
                    type="button"
                    id="closeTaskFormButton"
                    class="ghost-btn"
                >
                    ×
                </button>

            </div>


            <form id="taskForm">


                <label style="display:block;margin-bottom:15px;">

                    Task Title

                    <input
                        id="taskTitle"
                        type="text"
                        required
                        placeholder="Enter task title"
                        style="width:100%;padding:10px;margin-top:6px;"
                    >

                </label>


                <label style="display:block;margin-bottom:15px;">

                    Description

                    <textarea
                        id="taskDescription"
                        rows="4"
                        placeholder="Describe the task"
                        style="width:100%;padding:10px;margin-top:6px;"
                    ></textarea>

                </label>


                <label style="display:block;margin-bottom:15px;">

                    Assign To

                    <select
                        id="taskAssignedTo"
                        required
                        style="width:100%;padding:10px;margin-top:6px;"
                    >

                        <option value="">
                            Select member
                        </option>

                    </select>

                </label>


                <label style="display:block;margin-bottom:15px;">

                    Ministry

                    <select
                        id="taskMinistry"
                        required
                        style="width:100%;padding:10px;margin-top:6px;"
                    >

                        <option value="">
                            Select ministry
                        </option>

                    </select>

                </label>


                <label style="display:block;margin-bottom:15px;">

                    Due Date

                    <input
                        id="taskDueDate"
                        type="date"
                        required
                        style="width:100%;padding:10px;margin-top:6px;"
                    >

                </label>


                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Save Task
                    </button>


                    <button
                        type="button"
                        id="cancelTaskFormButton"
                        class="ghost-btn"
                    >
                        Cancel
                    </button>

                </div>


            </form>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    // -------------------------------------------------
    // MEMBER OPTIONS
    // -------------------------------------------------

    const memberSelect =
        document.getElementById(
            "taskAssignedTo"
        );


    taskState.members.forEach(member => {

        const option =
            document.createElement("option");

        const name =
            member.name ||
            member.fullName ||
            member.displayName ||
            member.email ||
            "Unnamed member";

        option.value =
            member.uid ||
            member.id ||
            member.email ||
            "";

        option.textContent =
            name;

        option.dataset.name =
            name;

        memberSelect.appendChild(
            option
        );

    });


    // -------------------------------------------------
    // MINISTRY OPTIONS
    // -------------------------------------------------

    const ministrySelect =
        document.getElementById(
            "taskMinistry"
        );


    taskState.ministries.forEach(ministry => {

        const option =
            document.createElement("option");

        const name =
            ministry.name ||
            ministry.title ||
            ministry.ministryName ||
            ministry.id ||
            "Unnamed ministry";

        option.value =
            name;

        option.textContent =
            name;

        ministrySelect.appendChild(
            option
        );

    });


    // -------------------------------------------------
    // EVENTS
    // -------------------------------------------------

    document
        .getElementById(
            "taskForm"
        )
        .addEventListener(
            "submit",
            saveNewTask
        );


    document
        .getElementById(
            "closeTaskFormButton"
        )
        .addEventListener(
            "click",
            closeTaskForm
        );


    document
        .getElementById(
            "cancelTaskFormButton"
        )
        .addEventListener(
            "click",
            closeTaskForm
        );

}


// =====================================================
// OPEN TASK FORM
// =====================================================

function openTaskForm() {

    createTaskForm();

    const overlay =
        document.getElementById(
            "taskFormOverlay"
        );

    if (overlay) {

        overlay.style.display =
            "block";

    }

}


// =====================================================
// CLOSE TASK FORM
// =====================================================

function closeTaskForm() {

    const overlay =
        document.getElementById(
            "taskFormOverlay"
        );

    if (overlay) {

        overlay.remove();

    }

}


// =====================================================
// SAVE NEW TASK
// =====================================================

async function saveNewTask(event) {

    event.preventDefault();


    try {

        const db =
            firebase.firestore();


        const title =
            document.getElementById(
                "taskTitle"
            ).value.trim();


        const description =
            document.getElementById(
                "taskDescription"
            ).value.trim();


        const assignedSelect =
            document.getElementById(
                "taskAssignedTo"
            );


        const ministry =
            document.getElementById(
                "taskMinistry"
            ).value;


        const dueDate =
            document.getElementById(
                "taskDueDate"
            ).value;


        const assignedTo =
            assignedSelect.value;


        const assignedOption =
            assignedSelect.options[
                assignedSelect.selectedIndex
            ];


        const assignedToName =
            assignedOption?.dataset?.name ||
            assignedOption?.textContent ||
            assignedTo;


        if (!title) {

            alert(
                "Please enter a task title."
            );

            return;

        }


        if (!assignedTo) {

            alert(
                "Please select a member."
            );

            return;

        }


        if (!ministry) {

            alert(
                "Please select a ministry."
            );

            return;

        }


        if (!dueDate) {

            alert(
                "Please select a due date."
            );

            return;

        }


        const currentUser =
            taskState.currentUser;


        const task = {

            title: title,

            description: description,

            assignedTo: assignedTo,

            assignedToName: assignedToName,

            ministry: ministry,

            dueDate: dueDate,

            status: "Pending",

            progress: 0,

            createdBy:
                currentUser?.uid ||
                currentUser?.email ||
                "unknown",

            createdByName:
                currentUser?.displayName ||
                currentUser?.email ||
                "Admin",

            createdAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp(),

            updatedAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp()

        };


        await db
            .collection("tasks")
            .add(task);


        alert(
            "Task assigned successfully."
        );


        closeTaskForm();


        await loadTasks();

    }

    catch (error) {

        console.error(
            "Failed to create task:",
            error
        );


        alert(
            "Unable to assign task: " +
            error.message
        );

    }

}


// =====================================================
// UPDATE TASK STATUS
// =====================================================

async function updateTaskStatus(
    taskId,
    newStatus
) {

    try {

        const db =
            firebase.firestore();


        const progress =
            getAutomaticProgress({
                status: newStatus
            });


        await db
            .collection("tasks")
            .doc(taskId)
            .update({

                status: newStatus,

                progress: progress,

                updatedAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });


        const task =
            taskState.tasks.find(
                item =>
                    item.id === taskId
            );


        if (task) {

            task.status =
                newStatus;

            task.progress =
                progress;

        }


        renderTaskStatistics();

        renderTasks();


    }

    catch (error) {

        console.error(
            "Failed to update task status:",
            error
        );


        alert(
            "Unable to update task status: " +
            error.message
        );


        await loadTasks();

    }

}


// =====================================================
// STATUS CHANGE LISTENER
// =====================================================

document.addEventListener(
    "change",
    event => {

        if (
            event.target &&
            event.target.classList.contains(
                "task-status-select"
            )
        ) {

            const taskId =
                event.target.dataset.taskId;


            const newStatus =
                event.target.value;


            updateTaskStatus(
                taskId,
                newStatus
            );

        }


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
// ASSIGN TASK BUTTON
// =====================================================

document.addEventListener(
    "click",
    event => {

        if (
            event.target &&
            event.target.id ===
                "addTaskButton"
        ) {

            openTaskForm();

        }

    }
);


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        taskState.currentUser =
            getTaskUser();


        await Promise.all([

            loadTaskMembers(),

            loadTaskMinistries(),

            loadTasks()

        ]);


        console.log(
            "GDM Task Management Ready."
        );

    }
);
