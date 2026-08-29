/*
====================================================
 Good Deeds Ministries Management System
 Dashboard Module
 Supabase Version
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

                    const data =
                        localStorage.getItem(key);

                    return data
                        ? JSON.parse(data)
                        : fallback;

                } catch (error) {

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
                        "Storage error:",
                        error
                    );

                }

            }

        };

    }


    // =================================================
    // DOM ELEMENTS
    // =================================================

    const sections =
        Array.from(
            document.querySelectorAll(
                "main section[id]"
            )
        );

    const navItems =
        Array.from(
            document.querySelectorAll(
                ".nav-item"
            )
        );

    const navButtons =
        navItems.filter(
            item =>
                item.tagName === "BUTTON"
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


    // =================================================
    // NAVIGATION
    // =================================================

    function showSection(target) {

        const section =
            sections.find(
                item =>
                    item.id === target
            );

        if (!section) {
            return;
        }


        sections.forEach(item => {

            item.classList.toggle(
                "hidden",
                item.id !== target
            );

        });


        navItems.forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.target === target
            );

        });


        const title =
            document.getElementById(
                "pageTitle"
            );


        if (title) {

            const titles = {

                dashboardSection:
                    "Management Dashboard",

                ministriesSection:
                    "Ministries",

                membersSection:
                    "Members",

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


    appState.showSection =
        showSection;


    // =================================================
    // ROLE ACCESS
    // =================================================

    function isSectionAllowed(target) {

        if (!appState.currentUser) {
            return false;
        }


        const role =
            String(
                appState.currentUser.role ||
                "Viewer"
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


    appState.isSectionAllowed =
        isSectionAllowed;


    // =================================================
    // UPDATE NAVIGATION PERMISSIONS
    // =================================================

    appState.updateNavPermissions =
        function () {

            navItems.forEach(item => {

                const target =
                    item.dataset.target;

                /*
                Links such as Overview,
                Ministries and Tasks do not
                have data-target and therefore
                are left alone.
                */

                if (!target) {
                    return;
                }


                const allowed =
                    isSectionAllowed(target);


                item.classList.toggle(
                    "disabled",
                    !allowed
                );


                if (
                    item.tagName === "BUTTON"
                ) {

                    item.disabled =
                        !allowed;

                }

            });


            // -----------------------------------------
            // Document upload permission
            // -----------------------------------------

            const uploadDocumentBtn =
                document.getElementById(
                    "uploadDocumentBtn"
                );


            const role =
                String(
                    appState.currentUser?.role ||
                    "Viewer"
                ).trim();


            const canUploadDocument =
                [
                    "Super Admin",
                    "Admin",
                    "Member"
                ].includes(role);


            if (uploadDocumentBtn) {

                uploadDocumentBtn.style.display =
                    canUploadDocument
                        ? ""
                        : "none";

            }

        };


    // =================================================
    // LOADING
    // =================================================

    appState.showLoading =
        function (status) {

            if (!loadingOverlay) {
                return;
            }

            loadingOverlay.classList.toggle(
                "hidden",
                !status
            );

        };


    // =================================================
    // INITIALIZE APPLICATION
    // =================================================

    appState.initializeApp =
        async function () {

            try {

                appState.showLoading(true);


                if (!appState.supabase) {

                    throw new Error(
                        "Supabase is not initialized."
                    );

                }


                const data =
                    await appState.loadDashboardData();


                appState.dashboardData =
                    data;


                appState.renderAll();


                if (
                    typeof appState.renderNotifications ===
                    "function"
                ) {

                    appState.renderNotifications();

                }


                if (
                    typeof appState.startLiveNotifications ===
                    "function"
                ) {

                    appState.startLiveNotifications();

                }


                if (
                    typeof appState.subscribeRealtimeCollections ===
                    "function"
                ) {

                    appState.subscribeRealtimeCollections();

                }


                appState.updateNavPermissions();


                showSection(
                    "dashboardSection"
                );


            } catch (error) {

                console.error(
                    "Dashboard initialization failed:",
                    error
                );

            } finally {

                appState.showLoading(false);

            }

        };


    // =================================================
    // RENDER EVERYTHING
    // =================================================

    appState.renderAll =
        function () {

            if (appState.dashboardData) {

                appState.ministries =
                    appState.dashboardData.ministries ||
                    [];

                appState.members =
                    appState.dashboardData.members ||
                    [];

                appState.documents =
                    appState.dashboardData.documents ||
                    [];

                appState.activity =
                    appState.dashboardData.activity ||
                    [];

                appState.reportSubmissions =
                    appState.dashboardData.reportSubmissions ||
                    [];

            }


            if (
                typeof appState.renderDashboard ===
                "function"
            ) {

                appState.renderDashboard();

            }


            if (
                typeof appState.renderMinistries ===
                "function"
            ) {

                appState.renderMinistries();

            }


            if (
                typeof appState.renderMembers ===
                "function"
            ) {

                appState.renderMembers();

            }


            if (
                typeof appState.renderDocuments ===
                "function"
            ) {

                appState.renderDocuments();

            }


            if (
                typeof appState.renderReports ===
                "function"
            ) {

                appState.renderReports();

            }


            if (
                typeof appState.renderActivity ===
                "function"
            ) {

                appState.renderActivity();

            }

        };


    // =================================================
    // DASHBOARD
    // =================================================

    appState.renderDashboard =
        function () {

            const data =
                appState.dashboardData ||
                {};


            const heroTitle =
                document.getElementById(
                    "heroTitle"
                );


            const heroSummary =
                document.getElementById(
                    "heroSummary"
                );


            if (heroTitle) {

                heroTitle.textContent =
                    data.heroTitle ||
                    "Operational Insights for the Ministries";

            }


            if (heroSummary) {

                heroSummary.textContent =
                    data.summary ||
                    "Monitor progress, approvals, documents, and community impact in one modern dashboard.";

            }


            const ministries =
                appState.ministries ||
                data.ministries ||
                [];


            const members =
                appState.members ||
                data.members ||
                [];


            const reports =
                appState.reportSubmissions ||
                data.reportSubmissions ||
                [];


            const activities =
                appState.activity ||
                data.activity ||
                [];


            // -----------------------------------------
            // Active ministries
            // -----------------------------------------

            const ministryCount =
                document.getElementById(
                    "ministryCount"
                );


            if (ministryCount) {

                ministryCount.textContent =
                    String(
                        ministries.length
                    );

            }


            // -----------------------------------------
            // Pending tasks
            // -----------------------------------------

            const taskCount =
                document.getElementById(
                    "taskCount"
                );


            if (taskCount) {

                const pendingTasks =
                    activities.filter(
                        activity => {

                            const status =
                                String(
                                    activity.status ||
                                    ""
                                ).toLowerCase();

                            return (
                                status === "pending" ||
                                status === "open"
                            );

                        }
                    ).length;


                taskCount.textContent =
                    String(
                        pendingTasks
                    );

            }


            // -----------------------------------------
            // Role
            // -----------------------------------------

            const roleLabel =
                document.getElementById(
                    "userRoleLabel"
                );


            if (roleLabel) {

                roleLabel.textContent =
                    appState.currentUser?.role ||
                    "Viewer";

            }


            // -----------------------------------------
            // Ministry mini cards
            // -----------------------------------------

            const miniCards =
                document.getElementById(
                    "miniCards"
                );


            if (miniCards) {

                miniCards.innerHTML = "";


                if (!ministries.length) {

                    miniCards.innerHTML = `
                        <div class="empty-state">
                            No ministry data available.
                        </div>
                    `;

                } else {

                    ministries.forEach(
                        ministry => {

                            const card =
                                document.createElement(
                                    "div"
                                );


                            card.className =
                                "mini-card";


                            card.innerHTML = `

                                <strong>
                                    ${escapeHTML(
                                        ministry.name ||
                                        ministry.title ||
                                        "Unnamed Ministry"
                                    )}
                                </strong>

                                <span>
                                    ${Number(
                                        ministry.member_count ??
                                        ministry.members ??
                                        0
                                    ) || 0}
                                    members
                                </span>

                                <span>
                                    ${Number(
                                        ministry.progress
                                    ) || 0}%
                                    progress
                                </span>

                            `;


                            miniCards.appendChild(
                                card
                            );

                        }
                    );

                }

            }

        };


    // =================================================
    // MINISTRIES
    // =================================================

    appState.renderMinistries =
        function () {

            const container =
                document.getElementById(
                    "ministryCards"
                );


            const table =
                document.getElementById(
                    "ministryTableBody"
                );


            const ministries =
                appState.ministries ||
                appState.dashboardData?.ministries ||
                [];


            const search =
                ministriesSearch?.value
                    ?.toLowerCase()
                    .trim() ||
                "";


            const filtered =
                ministries.filter(
                    ministry => {

                        const name =
                            String(
                                ministry.name ||
                                ministry.title ||
                                ""
                            ).toLowerCase();


                        const leader =
                            String(
                                ministry.leader ||
                                ministry.lead ||
                                ""
                            ).toLowerCase();


                        return (
                            !search ||
                            name.includes(search) ||
                            leader.includes(search)
                        );

                    }
                );


            // -----------------------------------------
            // Cards
            // -----------------------------------------

            if (container) {

                container.innerHTML = "";


                if (!filtered.length) {

                    container.innerHTML = `
                        <div class="empty-state">
                            No ministry data available.
                        </div>
                    `;

                } else {

                    filtered.forEach(
                        ministry => {

                            const card =
                                document.createElement(
                                    "article"
                                );


                            card.className =
                                "ministry-card";


                            card.innerHTML = `

                                <h3>
                                    ${escapeHTML(
                                        ministry.name ||
                                        ministry.title ||
                                        "Unnamed Ministry"
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        ministry.description ||
                                        ""
                                    )}
                                </p>

                                <div>
                                    <strong>
                                        ${Number(
                                            ministry.member_count ??
                                            ministry.members ??
                                            0
                                        ) || 0}
                                    </strong>
                                    members
                                </div>

                                <div>
                                    <strong>
                                        ${Number(
                                            ministry.progress
                                        ) || 0}%
                                    </strong>
                                    progress
                                </div>

                                <div>
                                    ${escapeHTML(
                                        ministry.status ||
                                        "Active"
                                    )}
                                </div>

                            `;


                            container.appendChild(
                                card
                            );

                        }
                    );

                }

            }


            // -----------------------------------------
            // Table
            // -----------------------------------------

            if (table) {

                table.innerHTML = "";


                filtered.forEach(
                    ministry => {

                        const row =
                            document.createElement(
                                "tr"
                            );


                        row.innerHTML = `

                            <td>
                                ${escapeHTML(
                                    ministry.name ||
                                    ministry.title ||
                                    "Unnamed Ministry"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    ministry.leader ||
                                    ministry.lead ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${Number(
                                    ministry.progress
                                ) || 0}%
                            </td>

                            <td>
                                ${Number(
                                    ministry.member_count ??
                                    ministry.members ??
                                    0
                                ) || 0}
                            </td>

                            <td>
                                ${escapeHTML(
                                    ministry.status ||
                                    "Active"
                                )}
                            </td>

                        `;


                        table.appendChild(
                            row
                        );

                    }
                );

            }

        };


    // =================================================
    // MEMBERS
    // =================================================

    appState.renderMembers =
        function () {

            const container =
                document.getElementById(
                    "membersGrid"
                );


            if (!container) {
                return;
            }


            const members =
                appState.members ||
                appState.dashboardData?.members ||
                [];


            container.innerHTML = "";


            if (!members.length) {

                container.innerHTML = `
                    <div class="empty-state">
                        No members available.
                    </div>
                `;

                return;

            }


            members.forEach(
                member => {

                    const card =
                        document.createElement(
                            "article"
                        );


                    card.className =
                        "member-card";


                    card.innerHTML = `

                        <h3>
                            ${escapeHTML(
                                member.full_name ||
                                member.name ||
                                member.display_name ||
                                member.displayName ||
                                "Team Member"
                            )}
                        </h3>

                        <p>
                            <strong>
                                ${escapeHTML(
                                    member.role ||
                                    member.position ||
                                    "Member"
                                )}
                            </strong>
                        </p>

                        <p>
                            ${escapeHTML(
                                member.email ||
                                "No contact"
                            )}
                        </p>

                        <span class="badge badge-soft">
                            ${escapeHTML(
                                member.status ||
                                "Active"
                            )}
                        </span>

                    `;


                    container.appendChild(
                        card
                    );

                }
            );

        };


    // =================================================
    // DOCUMENTS
    // =================================================

    appState.renderDocuments =
        function () {

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


            // -----------------------------------------
            // File count
            // -----------------------------------------

            if (documentCount) {

                documentCount.textContent =
                    String(
                        docs.length
                    );

            }


            // -----------------------------------------
            // Ministry count
            // -----------------------------------------

            const ministries =
                new Set(
                    docs.map(
                        doc =>
                            doc.ministry_id ||
                            doc.ministry ||
                            "General"
                    )
                );


            if (ministryCount) {

                ministryCount.textContent =
                    String(
                        ministries.size
                    );

            }


            // -----------------------------------------
            // Recent uploads
            // -----------------------------------------

            if (recentCount) {

                const now =
                    Date.now();


                const sevenDays =
                    7 *
                    24 *
                    60 *
                    60 *
                    1000;


                const recent =
                    docs.filter(
                        doc => {

                            const dateValue =
                                doc.created_at ||
                                doc.uploadedAt;


                            if (!dateValue) {
                                return false;
                            }


                            const timestamp =
                                new Date(
                                    dateValue
                                ).getTime();


                            return (
                                !isNaN(timestamp) &&
                                now - timestamp <
                                sevenDays
                            );

                        }
                    ).length;


                recentCount.textContent =
                    String(
                        recent
                    );

            }


            if (!table) {
                return;
            }


            table.innerHTML = "";


            if (!docs.length) {

                table.innerHTML = `

                    <tr>

                        <td colspan="6">
                            No documents available.
                        </td>

                    </tr>

                `;

                return;

            }


            // -----------------------------------------
            // Document table
            // -----------------------------------------

            docs.forEach(
                doc => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    const fileUrl =
                        doc.file_url ||
                        doc.fileUrl ||
                        "";


                    const fileName =
                        doc.file_name ||
                        doc.fileName ||
                        doc.title ||
                        "document";


                    const documentActions =
                        fileUrl

                            ?

                            `

                            <div
                                style="
                                    display:flex;
                                    gap:8px;
                                    flex-wrap:wrap;
                                "
                            >

                                <a
                                    href="${escapeAttribute(
                                        fileUrl
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="secondary-btn"
                                >
                                    Open
                                </a>

                                <a
                                    href="${escapeAttribute(
                                        fileUrl
                                    )}"
                                    download="${escapeAttribute(
                                        fileName
                                    )}"
                                    class="secondary-btn"
                                >
                                    Download
                                </a>

                            </div>

                            `

                            :

                            `

                            <span>
                                Not available
                            </span>

                            `;


                    row.innerHTML = `

                        <td>
                            ${escapeHTML(
                                doc.title ||
                                fileName ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                doc.ministry_name ||
                                doc.ministry ||
                                "General"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                doc.mime_type ||
                                doc.type ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${formatFileSize(
                                doc.file_size ||
                                doc.size
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                doc.created_at ||
                                doc.uploadedAt
                            )}
                        </td>

                        <td>
                            ${documentActions}
                        </td>

                    `;


                    table.appendChild(
                        row
                    );

                }
            );

        };


    // =================================================
    // REPORTS
    // =================================================

    appState.renderReports =
        function () {

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
                    report =>
                        Number(
                            report.value
                        ) || 0
                );


            const total =
                values.reduce(
                    (a, b) =>
                        a + b,
                    0
                );


            const highest =
                values.length
                    ? Math.max(...values)
                    : 0;


            if (reach) {

                reach.textContent =
                    String(
                        highest * 20
                    );

            }


            if (hours) {

                hours.textContent =
                    `${total}h`;

            }


            if (approval) {

                approval.textContent =
                    `${Math.min(
                        100,
                        70 + reports.length
                    )}%`;

            }


            if (!table) {
                return;
            }


            table.innerHTML = "";


            reports.forEach(
                report => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            ${escapeHTML(
                                report.title ||
                                "Untitled"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                report.ministry ||
                                "General"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                report.summary ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${Number(
                                report.value
                            ) || 0}
                        </td>

                        <td>
                            ${formatDate(
                                report.submitted_at ||
                                report.submittedAt
                            )}
                        </td>

                    `;


                    table.appendChild(
                        row
                    );

                }
            );

        };


    // =================================================
    // ACTIVITY
    // =================================================

    appState.renderActivity =
        function () {

            const timeline =
                document.getElementById(
                    "activityTimeline"
                );


            if (!timeline) {
                return;
            }


            const activities =
                appState.activity ||
                appState.dashboardData?.activity ||
                [];


            timeline.innerHTML = "";


            if (!activities.length) {

                timeline.innerHTML = `

                    <li class="timeline-item">

                        <div class="timeline-meta">

                            <strong>
                                No recent activity
                            </strong>

                            <span>
                                Now
                            </span>

                        </div>

                        <p>
                            There are no recent updates to display.
                        </p>

                    </li>

                `;

                return;

            }


            activities.forEach(
                item => {

                    const li =
                        document.createElement(
                            "li"
                        );


                    li.className =
                        "timeline-item";


                    li.innerHTML = `

                        <div class="timeline-meta">

                            <strong>
                                ${escapeHTML(
                                    item.title ||
                                    "Activity"
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    item.when ||
                                    formatDate(
                                        item.created_at ||
                                        item.createdAt
                                    ) ||
                                    "Now"
                                )}
                            </span>

                        </div>

                        <p>
                            ${escapeHTML(
                                item.detail ||
                                item.description ||
                                ""
                            )}
                        </p>

                    `;


                    timeline.appendChild(
                        li
                    );

                }
            );

        };


    // =================================================
    // SUPABASE DOCUMENT UPLOAD
    // =================================================

    appState.uploadDocumentFile =
        async function (file) {

            if (!file) {
                return;
            }


            if (!appState.supabase) {

                alert(
                    "Supabase is not available."
                );

                return;

            }


            try {

                const supabase =
                    appState.supabase;


                // -------------------------------------
                // File information
                // -------------------------------------

                const originalName =
                    file.name;


                const safeFileName =
                    originalName.replace(
                        /[^a-zA-Z0-9._-]/g,
                        "_"
                    );


                const uniqueName =
                    `${Date.now()}_${safeFileName}`;


                const filePath =
                    `documents/${uniqueName}`;


                console.log(
                    "Uploading document:",
                    originalName
                );


                // -------------------------------------
                // Upload to Supabase Storage
                // -------------------------------------

                const {
                    data: uploadData,
                    error: uploadError
                } =
                    await supabase.storage
                        .from("documents")
                        .upload(
                            filePath,
                            file,
                            {
                                cacheControl:
                                    "3600",

                                upsert:
                                    false,

                                contentType:
                                    file.type ||
                                    "application/octet-stream"

                            }
                        );


                if (uploadError) {

                    throw uploadError;

                }


                console.log(
                    "Storage upload successful:",
                    uploadData
                );


                // -------------------------------------
                // Get public URL
                // -------------------------------------

                const {
                    data: publicUrlData
                } =
                    supabase.storage
                        .from("documents")
                        .getPublicUrl(
                            filePath
                        );


                const fileUrl =
                    publicUrlData?.publicUrl ||
                    "";


                // -------------------------------------
                // Save document metadata
                // -------------------------------------

                const documentEntry = {

                    title:
                        originalName,

                    description:
                        "",

                    file_name:
                        originalName,

                    file_path:
                        filePath,

                    file_url:
                        fileUrl,

                    mime_type:
                        file.type ||
                        "application/octet-stream",

                    file_size:
                        file.size,

                    ministry_id:
                        null,

                    department_id:
                        null,

                    uploaded_by:
                        appState.currentUser?.id ||
                        null,

                    is_public:
                        true,

                    is_active:
                        true

                };


                const {
                    data: savedDocument,
                    error: databaseError
                } =
                    await supabase
                        .from("documents")
                        .insert(
                            documentEntry
                        )
                        .select()
                        .single();


                if (databaseError) {

                    /*
                    If database insertion fails,
                    remove the uploaded file so
                    Storage does not contain an
                    orphaned file.
                    */

                    await supabase.storage
                        .from("documents")
                        .remove([
                            filePath
                        ]);


                    throw databaseError;

                }


                console.log(
                    "Document metadata saved:",
                    savedDocument
                );


                // -------------------------------------
                // Update local state
                // -------------------------------------

                appState.documents =
                    appState.documents || [];


                appState.documents.unshift(
                    savedDocument
                );


                if (
                    appState.dashboardData
                ) {

                    appState.dashboardData.documents =
                        appState.documents;

                }


                // -------------------------------------
                // Re-render
                // -------------------------------------

                appState.renderDocuments();


                appState.renderDashboard();


                alert(
                    "Document uploaded successfully."
                );


            } catch (error) {

                console.error(
                    "Document upload failed:",
                    error
                );


                alert(
                    "Document upload failed: " +
                    (
                        error.message ||
                        "Unknown error"
                    )
                );

            }

        };


    // =================================================
    // DOCUMENT UPLOAD EVENTS
    // =================================================

    const uploadDocumentBtn =
        document.getElementById(
            "uploadDocumentBtn"
        );


    const documentFileInput =
        document.getElementById(
            "documentFileInput"
        );


    if (
        uploadDocumentBtn &&
        documentFileInput
    ) {

        uploadDocumentBtn.addEventListener(
            "click",
            () => {

                documentFileInput.click();

            }
        );


        documentFileInput.addEventListener(
            "change",
            async () => {

                const file =
                    documentFileInput.files?.[0];


                if (!file) {
                    return;
                }


                await appState.uploadDocumentFile(
                    file
                );


                documentFileInput.value =
                    "";

            }
        );

    }


    // =================================================
    // NAVIGATION EVENTS
    // =================================================

    if (navButtons.length) {

        navButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const target =
                            button.dataset.target;


                        if (!target) {
                            return;
                        }


                        if (
                            !isSectionAllowed(
                                target
                            )
                        ) {

                            console.warn(
                                "Access denied:",
                                target,
                                appState.currentUser?.role
                            );

                            return;

                        }


                        showSection(
                            target
                        );

                    }
                );

            }
        );

    }


    // =================================================
    // SEARCH
    // =================================================

    if (globalSearch) {

        globalSearch.addEventListener(
            "input",
            () => {

                if (ministriesSearch) {

                    ministriesSearch.value =
                        globalSearch.value;

                }


                appState.renderMinistries();

            }
        );

    }


    if (ministriesSearch) {

        ministriesSearch.addEventListener(
            "input",
            () => {

                appState.renderMinistries();

            }
        );

    }


    // =================================================
    // QUICK ADD ACTIVITY
    // =================================================

    const quickAddBtn =
        document.getElementById(
            "quickAddBtn"
        );


    if (quickAddBtn) {

        quickAddBtn.addEventListener(
            "click",
            async () => {

                const note =
                    prompt(
                        "Enter your quick note:"
                    );


                if (!note) {
                    return;
                }


                const activity = {

                    title:
                        "Quick Note",

                    detail:
                        note,

                    when:
                        "Just now",

                    created_at:
                        new Date().toISOString()

                };


                if (
                    typeof appState.saveActivityEntry ===
                    "function"
                ) {

                    await appState.saveActivityEntry(
                        activity
                    );

                }


                appState.renderActivity();

            }
        );

    }


    // =================================================
    // REPORT FORM
    // =================================================

    const reportForm =
        document.getElementById(
            "reportForm"
        );


    if (reportForm) {

        reportForm.addEventListener(
            "submit",
            async event => {

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


                if (
                    !title ||
                    !ministry ||
                    !summary ||
                    !value
                ) {

                    alert(
                        "Please complete all fields."
                    );

                    return;

                }


                const report = {

                    title,

                    ministry,

                    summary,

                    value:
                        Number(value),

                    submitted_at:
                        new Date().toISOString(),

                    submitted_by:
                        appState.currentUser?.id ||
                        null

                };


                if (
                    typeof appState.saveReportEntry ===
                    "function"
                ) {

                    await appState.saveReportEntry(
                        report
                    );

                }


                appState.renderReports();


                reportForm.reset();

            }
        );

    }


    // =================================================
    // THEME
    // =================================================

    const themeToggle =
        document.getElementById(
            "themeToggle"
        );


    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            () => {

                document.body.classList.toggle(
                    "dark"
                );


                themeToggle.textContent =
                    document.body.classList.contains(
                        "dark"
                    )

                        ? "Light mode"

                        : "Dark mode";

            }
        );

    }


    // =================================================
    // HELPER FUNCTIONS
    // =================================================

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


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


    function escapeAttribute(value) {

        return escapeHTML(value);

    }


    function formatFileSize(size) {

        if (
            size === null ||
            size === undefined ||
            size === ""
        ) {

            return "-";

        }


        const bytes =
            Number(size);


        if (isNaN(bytes)) {

            return String(size);

        }


        if (bytes < 1024) {

            return `${bytes} B`;

        }


        if (bytes < 1024 * 1024) {

            return `${(
                bytes / 1024
            ).toFixed(1)} KB`;

        }


        if (
            bytes <
            1024 *
            1024 *
            1024
        ) {

            return `${(
                bytes /
                (1024 * 1024)
            ).toFixed(1)} MB`;

        }


        return `${(
            bytes /
            (1024 *
            1024 *
            1024)
        ).toFixed(1)} GB`;

    }


    function formatDate(value) {

        if (!value) {
            return "-";
        }


        const date =
            new Date(value);


        if (
            isNaN(
                date.getTime()
            )
        ) {

            return String(value);

        }


        return date.toLocaleDateString();

    }


    // =================================================
    // DOM READY
    // =================================================

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            /*
            auth.js may already have populated
            currentUser. We first check storage
            so permissions are applied correctly.
            */

            const storedUser =
                appState.utils.readStorage(
                    "gdmCurrentUser",
                    null
                );


            if (storedUser) {

                appState.currentUser =
                    storedUser;

            }


            if (
                typeof appState.renderAuthState ===
                "function"
            ) {

                appState.renderAuthState();

            }


            appState.updateNavPermissions();


            /*
            Start the dashboard after the other
            scripts have loaded.
            */

            if (
                typeof appState.initializeApp ===
                "function"
            ) {

                appState.initializeApp();

            }

        }
    );


})();
