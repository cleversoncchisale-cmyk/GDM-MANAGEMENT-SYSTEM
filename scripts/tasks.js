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


    if (!dueDate)
        return false;


    return (
        dueDate <
        new Date()
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


    if (!dueDate)
        return false;


    return (
        dueDate >=
        new Date()
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
// COUNTER
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
    // MY TASKS
    // ---------------------------------------------

    if (
        filter === "my"
    ) {

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


    // ---------------------------------------------
    // OVERDUE
    // ---------------------------------------------

    if (
        filter === "overdue"
    ) {

        tasks =
            tasks.filter(
                isTaskOverdue
            );

    }


    // ---------------------------------------------
    // UPCOMING
    // ---------------------------------------------

    if (
        filter === "upcoming"
    ) {

        tasks =
            tasks.filter(
                isTaskUpcoming
            );

    }


    // ---------------------------------------------
    // COMPLETED
    // ---------------------------------------------

    if (
        filter === "completed"
    ) {

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


        // AUTOMATIC PROGRESS

        const progress =
            getAutomaticProgress(
                task
            );


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

                ${status}

            </td>


            <td>

                <strong>
                    ${progress}%
                </strong>

            </td>

        `;


        table.appendChild(row);

    });

}


// =====================================================
// SAFE TEXT
// =====================================================

function escapeTaskText(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// ASSIGN TASK MODAL
// =====================================================

function openTaskForm() {

    if (
        document.getElementById(
            "taskModal"
        )
    ) {

        return;

    }


    const memberOptions =
        taskState.members
            .map(member => {

                const name =
                    member.name ||
                    member.fullName ||
                    member.displayName ||
                    member.memberName ||
                    member.email ||
                    "Unnamed member";


                const id =
                    member.uid ||
                    member.id ||
                    member.email ||
                    name;


                return `

                    <option value="${escapeTaskText(id)}"
                            data-name="${escapeTaskText(name)}">

                        ${escapeTaskText(name)}

                    </option>

                `;

            })
            .join("");


    const ministryOptions =
        taskState.ministries
            .map(ministry => {

                const name =
                    ministry.title ||
                    ministry.name ||
                    ministry.ministry ||
                    "Unnamed ministry";


                return `

                    <option value="${escapeTaskText(name)}">

                        ${escapeTaskText(name)}

                    </option>

                `;

            })
            .join("");


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "taskModal";


    modal.innerHTML = `

        <div style="
            position:fixed;
            inset:0;
            background:rgba(0,0,0,.55);
            display:flex;
            align-items:center;
            justify-content:center;
            z-index:9999;
            padding:20px;
        ">

            <div class="panel glass-panel"
                 style="
                    width:min(600px,100%);
                    max-height:90vh;
                    overflow:auto;
                 ">

                <div class="section-header">

                    <h2>
                        Assign New Task
                    </h2>

                    <button
                        type="button"
                        id="closeTaskModal"
                        class="ghost-btn">

                        ×

                    </button>

                </div>


                <form id="taskForm"
                      class="form-grid">


                    <label>

                        Task title

                        <input
                            id="taskTitle"
                            type="text"
                            required
                            placeholder="Enter task title">

                    </label>


                    <label>

                        Description

                        <textarea
                            id="taskDescription"
                            rows="3"
                            placeholder="Describe the task"></textarea>

                    </label>


                    <label>

                        Assign to

                        <select
                            id="taskAssignee"
                            required>

                            <option value="">
                                Select member
                            </option>

                            ${memberOptions}

                        </select>

                    </label>


                    <label>

                        Ministry

                        <select
                            id="taskMinistry"
                            required>

                            <option value="">
                                Select ministry
                            </option>

                            ${ministryOptions}

                        </select>

                    </label>


                    <label>

                        Due date

                        <input
                            id="taskDueDate"
                            type="date"
                            required>

                    </label>


                    <div class="form-actions">

                        <button
                            type="submit"
                            class="primary-btn">

                            Assign Task

                        </button>


                        <button
                            type="button"
                            id="cancelTaskButton"
                            class="ghost-btn">

                            Cancel

                        </button>

                    </div>


                </form>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    // ---------------------------------------------
    // CLOSE
    // ---------------------------------------------

    document
        .getElementById(
            "closeTaskModal"
        )
        .addEventListener(
            "click",
            closeTaskForm
        );


    document
        .getElementById(
            "cancelTaskButton"
        )
        .addEventListener(
            "click",
            closeTaskForm
        );


    // ---------------------------------------------
    // SUBMIT
    // ---------------------------------------------

    document
        .getElementById(
            "taskForm"
        )
        .addEventListener(
            "submit",
            saveNewTask
        );

}


// =====================================================
// CLOSE TASK FORM
// =====================================================

function closeTaskForm() {

    const modal =
        document.getElementById(
            "taskModal"
        );


    if (modal) {

        modal.remove();

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


        const assignee =
            document.getElementById(
                "taskAssignee"
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
            assignee.value;


        const selectedOption =
            assignee.options[
                assignee.selectedIndex
            ];


        const assignedToName =
            selectedOption
                ?.getAttribute(
                    "data-name"
                ) || "-";


        if (
            !title ||
            !assignedTo ||
            !ministry ||
            !dueDate
        ) {

            alert(
                "Please complete all required fields."
            );

            return;

        }


        // -----------------------------------------
        // CREATE TASK
        // -----------------------------------------

        const task = {

            title,

            description,

            assignedTo,

            assignedToName,

            ministry,

            dueDate,

            status:
                "Pending",

            // AUTOMATIC

            progress:
                0,

            createdBy:
                taskState.currentUser?.uid ||
                taskState.currentUser?.email ||
                "admin",

            createdByName:
                taskState.currentUser?.displayName ||
                taskState.currentUser?.email ||
                "Admin",

            createdAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp()

        };


        // -----------------------------------------
        // SAVE TO FIRESTORE
        // -----------------------------------------

        const docRef =
            await db
                .collection("tasks")
                .add(task);


        console.log(
            "Task created:",
            docRef.id
        );


        // -----------------------------------------
        // ADD TO LOCAL STATE
        // -----------------------------------------

        taskState.tasks.push({

            id:
                docRef.id,

            ...task,

            createdAt:
                new Date()

        });


        renderTaskStatistics();

        renderTasks();


        closeTaskForm();


        alert(
            "Task assigned successfully."
        );

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
// FILTER
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
