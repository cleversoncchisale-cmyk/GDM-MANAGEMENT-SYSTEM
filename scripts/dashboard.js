```javascript
/*
====================================================
 GOOD DEEDS MINISTRIES MANAGEMENT SYSTEM
 Dashboard Module
 Supabase Database + Supabase Storage
====================================================

 STORAGE BUCKET:
 gdm-documents

 DATABASE:
 Supabase

 DOCUMENT TABLE:
 documents

====================================================
*/

window.gdmApp = window.gdmApp || {};

(function () {

    "use strict";

    const appState = window.gdmApp;


    // =================================================
    // SAFE STORAGE UTILITIES
    // =================================================

    if (!appState.utils) {

        appState.utils = {

            readStorage(key, fallback = null) {

                try {

                    const value =
                        localStorage.getItem(key);

                    return value
                        ? JSON.parse(value)
                        : fallback;

                } catch (error) {

                    console.warn(
                        "Storage read error:",
                        error
                    );

                    return fallback;
                }
            },


            writeStorage(key, value) {

                try {

                    localStorage.setItem(
                        key,
                        JSON.stringify(value)
                    );

                } catch (error) {

                    console.warn(
                        "Storage write error:",
                        error
                    );
                }
            }

        };

    }


    // =================================================
    // SUPABASE
    // =================================================

    function getSupabase() {

        if (
            appState.supabase &&
            appState.supabaseReady
        ) {

            return appState.supabase;
        }

        if (
            window.supabase &&
            typeof window.supabase.createClient === "function"
        ) {

            console.warn(
                "Supabase client exists but appState.supabase is not ready."
            );
        }

        return null;
    }


    // =================================================
    // STORAGE CONFIGURATION
    // =================================================

    const DOCUMENT_BUCKET =
        "gdm-documents";


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
    // CURRENT USER
    // =================================================

    function getCurrentUser() {

        return (
            appState.currentUser ||
            appState.supabaseUser ||
            null
        );
    }


    function getUserRole() {

        const user =
            getCurrentUser();

        if (!user) {
            return "viewer";
        }

        const role =
            user.role ||
            user.user_role ||
            user.profile?.role ||
            user.user_metadata?.role ||
            "viewer";

        return String(
            role
        )
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
    }


    function getUserId() {

        const user =
            getCurrentUser();

        return (
            user?.id ||
            user?.auth_user_id ||
            user?.user_id ||
            null
        );
    }


    function getUserEmail() {

        const user =
            getCurrentUser();

        return (
            user?.email ||
            user?.user_metadata?.email ||
            "Unknown"
        );
    }


    // =================================================
    // ROLE PERMISSIONS
    // =================================================

    const ROLE_PERMISSIONS = {

        super_admin: [
            "dashboardSection",
            "ministriesSection",
            "membersSection",
            "documentsSection",
            "reportsSection",
            "activitySection"
        ],

        admin: [
            "dashboardSection",
            "ministriesSection",
            "membersSection",
            "documentsSection",
            "reportsSection",
            "activitySection"
        ],

        ministry_leader: [
            "dashboardSection",
            "ministriesSection",
            "membersSection",
            "documentsSection",
            "reportsSection",
            "activitySection"
        ],

        staff: [
            "dashboardSection",
            "ministriesSection",
            "membersSection",
            "documentsSection",
            "reportsSection",
            "activitySection"
        ],

        viewer: [
            "dashboardSection",
            "ministriesSection"
        ]

    };


    function isSectionAllowed(target) {

        const role =
            getUserRole();

        return (
            ROLE_PERMISSIONS[role] ||
            []
        ).includes(target);
    }


    // =================================================
    // NAVIGATION PERMISSIONS
    // =================================================

    appState.updateNavPermissions =
        function () {

            navItems.forEach(item => {

                const target =
                    item.dataset.target;

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
            // Document upload permissions
            // -----------------------------------------

            const uploadButton =
                document.getElementById(
                    "uploadDocumentBtn"
                );


            const role =
                getUserRole();


            const canUpload = [
                "super_admin",
                "admin",
                "ministry_leader",
                "staff"
            ].includes(role);


            if (uploadButton) {

                uploadButton.style.display =
                    canUpload
                        ? ""
                        : "none";

            }

        };


    // =================================================
    // SHOW SECTION
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


        if (!isSectionAllowed(target)) {

            console.warn(
                "Access denied:",
                target,
                getUserRole()
            );

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
    // TOAST
    // =================================================

    function showToast(
        message,
        type = "info"
    ) {

        const stack =
            document.getElementById(
                "toastStack"
            );


        if (!stack) {

            console.log(
                `[${type}]`,
                message
            );

            return;
        }


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            `toast toast-${type}`;


        toast.textContent =
            message;


        stack.appendChild(
            toast
        );


        setTimeout(() => {

            toast.classList.add(
                "hide"
            );

            setTimeout(() => {

                toast.remove();

            }, 300);

        }, 3500);

    }


    appState.showToast =
        showToast;


    // =================================================
    // DATE HELPERS
    // =================================================

    function normalizeDate(value) {

        if (!value) {
            return null;
        }


        if (
            typeof value.toDate ===
            "function"
        ) {

            return value.toDate();

        }


        const date =
            new Date(value);


        return isNaN(
            date.getTime()
        )
            ? null
            : date;
    }


    function formatDate(value) {

        const date =
            normalizeDate(value);


        if (!date) {
            return "-";
        }


        return date.toLocaleDateString(
            undefined,
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );

    }


    function formatFileSize(bytes) {

        const size =
            Number(bytes);


        if (!size || size <= 0) {
            return "-";
        }


        if (size < 1024) {

            return `${size} B`;

        }


        if (size < 1024 * 1024) {

            return `${(
                size / 1024
            ).toFixed(1)} KB`;

        }


        if (size < 1024 * 1024 * 1024) {

            return `${(
                size /
                (1024 * 1024)
            ).toFixed(1)} MB`;

        }


        return `${(
            size /
            (1024 * 1024 * 1024)
        ).toFixed(1)} GB`;

    }


    // =================================================
    // ESCAPE HTML
    // =================================================

    function escapeHTML(value) {

        return String(
            value ?? ""
        )
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


    // =================================================
    // DATA NORMALIZATION
    // =================================================

    function normalizeMinistry(row) {

        return {

            ...row,

            id:
                row.id,

            title:
                row.title ||
                row.name ||
                "Unnamed Ministry",

            name:
                row.name ||
                row.title ||
                "Unnamed Ministry",

            description:
                row.description ||
                "",

            lead:
                row.lead ||
                row.leader ||
                row.leader_name ||
                "",

            members:
                Number(
                    row.members ||
                    row.member_count ||
                    0
                ),

            progress:
                Number(
                    row.progress ||
                    0
                ),

            status:
                row.status ||
                "Active"

        };

    }


    function normalizeDocument(row) {

        return {

            ...row,

            id:
                row.id,

            title:
                row.title ||
                row.file_name ||
                "Untitled document",

            fileName:
                row.file_name ||
                row.fileName ||
                "",

            filePath:
                row.file_path ||
                row.filePath ||
                "",

            fileUrl:
                row.file_url ||
                row.fileUrl ||
                "",

            type:
                row.mime_type ||
                row.type ||
                "File",

            size:
                row.file_size
                    ? formatFileSize(
                        row.file_size
                    )
                    : (
                        row.size ||
                        "-"
                    ),

            ministry:
                row.ministry ||
                row.ministry_name ||
                "General",

            ministryId:
                row.ministry_id ||
                null,

            departmentId:
                row.department_id ||
                null,

            uploadedBy:
                row.uploaded_by ||
                null,

            uploadedAt:
                row.created_at ||
                row.uploadedAt ||
                null

        };

    }


    // =================================================
    // SUPABASE DATA LOADER
    // =================================================

    appState.loadDashboardData =
        async function () {

            const supabase =
                getSupabase();


            if (!supabase) {

                throw new Error(
                    "Supabase client is not available."
                );

            }


            console.log(
                "Loading GDM dashboard data from Supabase..."
            );


            // -----------------------------------------
            // Ministries
            // -----------------------------------------

            let ministries = [];


            try {

                const result =
                    await supabase
                        .from("ministries")
                        .select("*")
                        .order(
                            "created_at",
                            {
                                ascending: true
                            }
                        );


                if (result.error) {

                    console.warn(
                        "Ministries query:",
                        result.error.message
                    );

                } else {

                    ministries =
                        (
                            result.data ||
                            []
                        ).map(
                            normalizeMinistry
                        );

                }

            } catch (error) {

                console.warn(
                    "Unable to load ministries:",
                    error
                );

            }


            // -----------------------------------------
            // Members
            // -----------------------------------------

            let members = [];


            try {

                const result =
                    await supabase
                        .from("members")
                        .select("*")
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        );


                if (result.error) {

                    console.warn(
                        "Members query:",
                        result.error.message
                    );

                } else {

                    members =
                        result.data ||
                        [];

                }

            } catch (error) {

                console.warn(
                    "Unable to load members:",
                    error
                );

            }


            // -----------------------------------------
            // Documents
            // -----------------------------------------

            let documents = [];


            try {

                const result =
                    await supabase
                        .from("documents")
                        .select(`
                            id,
                            title,
                            description,
                            file_name,
                            file_path,
                            file_url,
                            mime_type,
                            file_size,
                            ministry_id,
                            department_id,
                            uploaded_by,
                            is_public,
                            is_active,
                            created_at,
                            updated_at
                        `)
                        .eq(
                            "is_active",
                            true
                        )
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        );


                if (result.error) {

                    console.warn(
                        "Documents query:",
                        result.error.message
                    );

                } else {

                    documents =
                        (
                            result.data ||
                            []
                        ).map(
                            normalizeDocument
                        );

                }

            } catch (error) {

                console.warn(
                    "Unable to load documents:",
                    error
                );

            }


            // -----------------------------------------
            // Reports
            // -----------------------------------------

            let reportSubmissions = [];


            try {

                const result =
                    await supabase
                        .from(
                            "report_submissions"
                        )
                        .select("*")
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        );


                if (result.error) {

                    console.warn(
                        "Reports query:",
                        result.error.message
                    );

                } else {

                    reportSubmissions =
                        result.data ||
                        [];

                }

            } catch (error) {

                console.warn(
                    "Unable to load reports:",
                    error
                );

            }


            // -----------------------------------------
            // Activity
            // -----------------------------------------

            let activity = [];


            try {

                const result =
                    await supabase
                        .from(
                            "activity"
                        )
                        .select("*")
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        )
                        .limit(50);


                if (result.error) {

                    console.warn(
                        "Activity query:",
                        result.error.message
                    );

                } else {

                    activity =
                        result.data ||
                        [];

                }

            } catch (error) {

                console.warn(
                    "Unable to load activity:",
                    error
                );

            }


            return {

                heroTitle:
                    "Operational Insights for the Ministries",

                summary:
                    "Monitor ministries, members, documents, reports and ministry activity from one secure control center.",

                ministries,

                members,

                documents,

                reportSubmissions,

                activity

            };

        };


    // =================================================
    // RENDER ALL
    // =================================================

    appState.renderAll =
        function () {

            if (!appState.dashboardData) {
                return;
            }


            appState.ministries =
                appState.dashboardData.ministries ||
                [];


            appState.members =
                appState.dashboardData.members ||
                [];


            appState.documents =
                appState.dashboardData.documents ||
                [];


            appState.reportSubmissions =
                appState.dashboardData.reportSubmissions ||
                [];


            appState.activity =
                appState.dashboardData.activity ||
                [];


            appState.renderDashboard();


            appState.renderMinistries();


            appState.renderMembers();


            appState.renderDocuments();


            appState.renderReports();


            appState.renderActivity();


            appState.updateNavPermissions();

        };


    // =================================================
    // DASHBOARD
    // =================================================

    appState.renderDashboard =
        function () {

            const data =
                appState.dashboardData ||
                {};


            const ministries =
                appState.ministries ||
                [];


            const members =
                appState.members ||
                [];


            const documents =
                appState.documents ||
                [];


            const reports =
                appState.reportSubmissions ||
                [];


            const activities =
                appState.activity ||
                [];


            // -----------------------------------------
            // Hero
            // -----------------------------------------

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
                    "";

            }


            // -----------------------------------------
            // Ministry count
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
            // Task count
            // -----------------------------------------

            const taskCount =
                document.getElementById(
                    "taskCount"
                );


            const pendingTasks =
                activities.filter(
                    item => {

                        const status =
                            String(
                                item.status ||
                                ""
                            )
                            .toLowerCase();

                        return (
                            status === "pending" ||
                            status === "open"
                        );

                    }
                ).length;


            if (taskCount) {

                taskCount.textContent =
                    String(
                        pendingTasks
                    );

            }


            // -----------------------------------------
            // Role label
            // -----------------------------------------

            const roleLabel =
                document.getElementById(
                    "userRoleLabel"
                );


            if (roleLabel) {

                roleLabel.textContent =
                    getUserRole()
                        .replace(
                            /_/g,
                            " "
                        )
                        .replace(
                            /\b\w/g,
                            letter =>
                                letter.toUpperCase()
                        );

            }


            // -----------------------------------------
            // Notification list
            // -----------------------------------------

            const notificationList =
                document.getElementById(
                    "notificationList"
                );


            if (notificationList) {

                notificationList.innerHTML =
                    "";


                if (!activities.length) {

                    notificationList.innerHTML =
                        `
                        <li class="empty-state">
                            No recent activity.
                        </li>
                        `;

                } else {

                    activities
                        .slice(0, 5)
                        .forEach(
                            item => {

                                const li =
                                    document.createElement(
                                        "li"
                                    );


                                li.innerHTML =
                                    `
                                    <strong>
                                        ${escapeHTML(
                                            item.title ||
                                            "Activity"
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            item.detail ||
                                            item.description ||
                                            ""
                                        )}
                                    </span>
                                    `;


                                notificationList
                                    .appendChild(
                                        li
                                    );

                            }
                        );

                }

            }


            // -----------------------------------------
            // Mini ministry cards
            // -----------------------------------------

            const miniCards =
                document.getElementById(
                    "miniCards"
                );


            if (miniCards) {

                miniCards.innerHTML =
                    "";


                if (!ministries.length) {

                    miniCards.innerHTML =
                        `
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


                            card.innerHTML =
                                `
                                <strong>
                                    ${escapeHTML(
                                        ministry.title
                                    )}
                                </strong>

                                <span>
                                    ${Number(
                                        ministry.members
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


                            miniCards
                                .appendChild(
                                    card
                                );

                        }
                    );

                }

            }


            // -----------------------------------------
            // Generic statistics grid
            // -----------------------------------------

            const statsGrid =
                document.getElementById(
                    "statsGrid"
                );


            if (statsGrid) {

                statsGrid.innerHTML =
                    `
                    <div class="stat-card">
                        <span class="eyebrow">
                            Ministries
                        </span>
                        <strong>
                            ${ministries.length}
                        </strong>
                    </div>

                    <div class="stat-card">
                        <span class="eyebrow">
                            Members
                        </span>
                        <strong>
                            ${members.length}
                        </strong>
                    </div>

                    <div class="stat-card">
                        <span class="eyebrow">
                            Documents
                        </span>
                        <strong>
                            ${documents.length}
                        </strong>
                    </div>

                    <div class="stat-card">
                        <span class="eyebrow">
                            Reports
                        </span>
                        <strong>
                            ${reports.length}
                        </strong>
                    </div>
                    `;

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
                [];


            const search =
                ministriesSearch?.value
                    ?.toLowerCase()
                    .trim() ||
                "";


            const filtered =
                ministries.filter(
                    ministry => {

                        const title =
                            String(
                                ministry.title ||
                                ""
                            )
                            .toLowerCase();


                        const lead =
                            String(
                                ministry.lead ||
                                ""
                            )
                            .toLowerCase();


                        return (
                            !search ||
                            title.includes(search) ||
                            lead.includes(search)
                        );

                    }
                );


            // -----------------------------------------
            // Cards
            // -----------------------------------------

            if (container) {

                container.innerHTML =
                    "";


                if (!filtered.length) {

                    container.innerHTML =
                        `
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


                            card.innerHTML =
                                `
                                <h3>
                                    ${escapeHTML(
                                        ministry.title
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        ministry.description
                                    )}
                                </p>

                                <div>
                                    <strong>
                                        ${Number(
                                            ministry.members
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
                                        ministry.status
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

                table.innerHTML =
                    "";


                filtered.forEach(
                    ministry => {

                        const row =
                            document.createElement(
                                "tr"
                            );


                        row.innerHTML =
                            `
                            <td>
                                ${escapeHTML(
                                    ministry.title
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
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
                                    ministry.members
                                ) || 0}
                            </td>

                            <td>
                                ${escapeHTML(
                                    ministry.status
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
                [];


            container.innerHTML =
                "";


            if (!members.length) {

                container.innerHTML =
                    `
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


                    card.innerHTML =
                        `
                        <h3>
                            ${escapeHTML(
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
    // GET DOCUMENT URL
    // =================================================

    async function getDocumentUrl(doc) {

        const supabase =
            getSupabase();


        if (!supabase) {
            return null;
        }


        // -----------------------------------------
        // Existing URL
        // -----------------------------------------

        if (doc.fileUrl) {

            return doc.fileUrl;

        }


        if (!doc.filePath) {

            return null;

        }


        // -----------------------------------------
        // Try signed URL
        // -----------------------------------------

        try {

            const result =
                await supabase
                    .storage
                    .from(
                        DOCUMENT_BUCKET
                    )
                    .createSignedUrl(
                        doc.filePath,
                        3600
                    );


            if (
                !result.error &&
                result.data?.signedUrl
            ) {

                return result.data.signedUrl;

            }

        } catch (error) {

            console.warn(
                "Signed URL generation failed:",
                error
            );

        }


        // -----------------------------------------
        // Public URL fallback
        // -----------------------------------------

        try {

            const result =
                supabase
                    .storage
                    .from(
                        DOCUMENT_BUCKET
                    )
                    .getPublicUrl(
                        doc.filePath
                    );


            return (
                result.data?.publicUrl ||
                null
            );

        } catch (error) {

            console.warn(
                "Public URL generation failed:",
                error
            );

        }


        return null;

    }


    // =================================================
    // DOCUMENTS
    // =================================================

    appState.renderDocuments =
        async function () {

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
                [];


            // -----------------------------------------
            // Counts
            // -----------------------------------------

            if (documentCount) {

                documentCount.textContent =
                    String(
                        docs.length
                    );

            }


            const ministryIds =
                new Set(
                    docs
                        .map(
                            doc =>
                                doc.ministryId ||
                                doc.ministry
                        )
                        .filter(Boolean)
                );


            if (ministryCount) {

                ministryCount.textContent =
                    String(
                        ministryIds.size
                    );

            }


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

                        const date =
                            normalizeDate(
                                doc.uploadedAt
                            );


                        if (!date) {
                            return false;
                        }


                        return (
                            now -
                            date.getTime()
                        ) <= sevenDays;

                    }
                ).length;


            if (recentCount) {

                recentCount.textContent =
                    String(
                        recent
                    );

            }


            if (!table) {
                return;
            }


            table.innerHTML =
                "";


            if (!docs.length) {

                table.innerHTML =
                    `
                    <tr>
                        <td colspan="6">
                            No documents available.
                        </td>
                    </tr>
                    `;

                return;
            }


            // -----------------------------------------
            // Render rows
            // -----------------------------------------

            for (
                const doc of docs
            ) {

                const row =
                    document.createElement(
                        "tr"
                    );


                const actionCell =
                    document.createElement(
                        "td"
                    );


                actionCell.innerHTML =
                    `
                    <span>
                        Loading...
                    </span>
                    `;


                row.innerHTML =
                    `
                    <td>
                        ${escapeHTML(
                            doc.title
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            doc.ministry
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            doc.type
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            doc.size
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            formatDate(
                                doc.uploadedAt
                            )
                        )}
                    </td>
                    `;


                row.appendChild(
                    actionCell
                );


                table.appendChild(
                    row
                );


                // -------------------------------------
                // Generate URL
                // -------------------------------------

                const url =
                    await getDocumentUrl(
                        doc
                    );


                if (url) {

                    actionCell.innerHTML =
                        `
                        <div
                            style="
                                display:flex;
                                gap:8px;
                                flex-wrap:wrap;
                            "
                        >

                            <a
                                href="${escapeHTML(
                                    url
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="secondary-btn"
                            >
                                Open
                            </a>

                            <a
                                href="${escapeHTML(
                                    url
                                )}"
                                download="${escapeHTML(
                                    doc.fileName ||
                                    doc.title ||
                                    "document"
                                )}"
                                class="secondary-btn"
                            >
                                Download
                            </a>

                        </div>
                        `;

                } else {

                    actionCell.innerHTML =
                        `
                        <span>
                            File unavailable
                        </span>
                        `;

                }

            }

        };


    // =================================================
    // UPLOAD DOCUMENT TO SUPABASE
    // =================================================

    appState.uploadDocumentFile =
        async function (file) {

            if (!file) {
                return;
            }


            const supabase =
                getSupabase();


            if (!supabase) {

                showToast(
                    "Supabase is not available.",
                    "error"
                );

                return;

            }


            const userId =
                getUserId();


            if (!userId) {

                showToast(
                    "You must be signed in before uploading documents.",
                    "error"
                );

                return;

            }


            const role =
                getUserRole();


            const canUpload = [
                "super_admin",
                "admin",
                "ministry_leader",
                "staff"
            ].includes(role);


            if (!canUpload) {

                showToast(
                    "You do not have permission to upload documents.",
                    "error"
                );

                return;

            }


            // -----------------------------------------
            // File validation
            // -----------------------------------------

            const maxSize =
                50 *
                1024 *
                1024;


            if (file.size > maxSize) {

                showToast(
                    "File is larger than the 50 MB limit.",
                    "error"
                );

                return;

            }


            const allowedTypes = [

                "application/pdf",

                "application/msword",

                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

                "image/jpeg",

                "image/png",

                "video/mp4",

                "video/quicktime"

            ];


            if (
                file.type &&
                !allowedTypes.includes(
                    file.type
                )
            ) {

                showToast(
                    "This file type is not allowed.",
                    "error"
                );

                return;

            }


            // -----------------------------------------
            // Safe filename
            // -----------------------------------------

            const originalName =
                file.name;


            const safeFileName =
                originalName
                    .replace(
                        /[^a-zA-Z0-9._-]/g,
                        "_"
                    );


            // -----------------------------------------
            // Storage path
            // -----------------------------------------

            const storagePath =
                `${userId}/${Date.now()}_${safeFileName}`;


            const progress =
                document.getElementById(
                    "documentUploadProgress"
                );


            if (progress) {

                progress.classList.remove(
                    "hidden"
                );

                progress.value =
                    10;

            }


            try {

                console.log(
                    "Uploading to Supabase Storage:",
                    storagePath
                );


                // -------------------------------------
                // Upload file
                // -------------------------------------

                const uploadResult =
                    await supabase
                        .storage
                        .from(
                            DOCUMENT_BUCKET
                        )
                        .upload(
                            storagePath,
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


                if (uploadResult.error) {

                    throw uploadResult.error;

                }


                if (progress) {
                    progress.value = 60;
                }


                // -------------------------------------
                // Get public URL if bucket is public
                // -------------------------------------

                let fileUrl =
                    null;


                try {

                    const publicResult =
                        supabase
                            .storage
                            .from(
                                DOCUMENT_BUCKET
                            )
                            .getPublicUrl(
                                storagePath
                            );


                    fileUrl =
                        publicResult
                            .data
                            ?.publicUrl ||
                        null;

                } catch (error) {

                    console.warn(
                        "Public URL unavailable:",
                        error
                    );

                }


                // -------------------------------------
                // Save document metadata
                // -------------------------------------

                const documentEntry = {

                    title:
                        originalName,

                    description:
                        null,

                    file_name:
                        originalName,

                    file_path:
                        storagePath,

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
                        userId,

                    is_public:
                        false,

                    is_active:
                        true

                };


                const insertResult =
                    await supabase
                        .from(
                            "documents"
                        )
                        .insert(
                            documentEntry
                        )
                        .select()
                        .single();


                if (insertResult.error) {

                    // ---------------------------------
                    // IMPORTANT:
                    // If database insert fails,
                    // remove uploaded file.
                    // ---------------------------------

                    try {

                        await supabase
                            .storage
                            .from(
                                DOCUMENT_BUCKET
                            )
                            .remove([
                                storagePath
                            ]);

                    } catch (
                        cleanupError
                    ) {

                        console.warn(
                            "Storage cleanup failed:",
                            cleanupError
                        );

                    }


                    throw insertResult.error;

                }


                if (progress) {
                    progress.value = 100;
                }


                // -------------------------------------
                // Add to application state
                // -------------------------------------

                const savedDocument =
                    normalizeDocument(
                        insertResult.data
                    );


                appState.documents =
                    appState.documents ||
                    [];


                appState.documents.unshift(
                    savedDocument
                );


                await appState.renderDocuments();


                showToast(
                    "Document uploaded successfully.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Document upload failed:",
                    error
                );


                showToast(
                    "Document upload failed: " +
                    (
                        error.message ||
                        "Unknown error"
                    ),
                    "error"
                );

            } finally {

                if (progress) {

                    setTimeout(() => {

                        progress.classList.add(
                            "hidden"
                        );

                        progress.value =
                            0;

                    }, 800);

                }

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

                if (
                    !isSectionAllowed(
                        "documentsSection"
                    )
                ) {

                    showToast(
                        "You do not have permission to upload documents.",
                        "error"
                    );

                    return;

                }


                documentFileInput.click();

            }
        );


        documentFileInput.addEventListener(
            "change",
            async () => {

                const file =
                    documentFileInput
                        .files?.[0];


                if (!file) {
                    return;
                }


                await appState
                    .uploadDocumentFile(
                        file
                    );


                documentFileInput.value =
                    "";

            }
        );

    }


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
                    ? Math.max(
                        ...values
                    )
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
                        70 +
                        reports.length
                    )}%`;

            }


            if (!table) {
                return;
            }


            table.innerHTML =
                "";


            reports.forEach(
                report => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML =
                        `
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
                            ${escapeHTML(
                                formatDate(
                                    report.submittedAt ||
                                    report.submitted_at ||
                                    report.created_at
                                )
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
    // SAVE REPORT
    // =================================================

    appState.saveReportEntry =
        async function (report) {

            const supabase =
                getSupabase();


            if (!supabase) {

                throw new Error(
                    "Supabase is not available."
                );

            }


            const userId =
                getUserId();


            if (!userId) {

                throw new Error(
                    "You must be signed in."
                );

            }


            const payload = {

                title:
                    report.title,

                ministry:
                    report.ministry,

                summary:
                    report.summary,

                value:
                    Number(
                        report.value
                    ) || 0,

                submitted_by:
                    userId

            };


            const result =
                await supabase
                    .from(
                        "report_submissions"
                    )
                    .insert(
                        payload
                    )
                    .select()
                    .single();


            if (result.error) {

                throw result.error;

            }


            appState.reportSubmissions =
                appState.reportSubmissions ||
                [];


            appState.reportSubmissions.unshift(
                result.data
            );


            appState.renderReports();

        };


    // =================================================
    // SAVE ACTIVITY
    // =================================================

    appState.saveActivityEntry =
        async function (activity) {

            const supabase =
                getSupabase();


            if (!supabase) {

                throw new Error(
                    "Supabase is not available."
                );

            }


            const userId =
                getUserId();


            if (!userId) {

                throw new Error(
                    "You must be signed in."
                );

            }


            const payload = {

                title:
                    activity.title ||
                    "Activity",

                detail:
                    activity.detail ||
                    "",

                status:
                    activity.status ||
                    "completed",

                created_by:
                    userId

            };


            const result =
                await supabase
                    .from(
                        "activity"
                    )
                    .insert(
                        payload
                    )
                    .select()
                    .single();


            if (result.error) {

                throw result.error;

            }


            appState.activity =
                appState.activity ||
                [];


            appState.activity.unshift(
                result.data
            );


            appState.renderActivity();

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
                [];


            timeline.innerHTML =
                "";


            if (!activities.length) {

                timeline.innerHTML =
                    `
                    <li class="empty-state">
                        No recent activity.
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


                    li.innerHTML =
                        `
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
                                        item.created_at
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
    // SEARCH
    // =================================================

    function highlightSearchTerms() {

        const value =
            globalSearch?.value
                ?.toLowerCase()
                .trim() ||
            "";


        if (ministriesSearch) {

            ministriesSearch.value =
                value;

        }


        appState.renderMinistries();

    }


    if (globalSearch) {

        globalSearch.addEventListener(
            "input",
            highlightSearchTerms
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
    // NAVIGATION EVENTS
    // =================================================

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

                        showToast(
                            "You do not have permission to access this section.",
                            "error"
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


                if (!note?.trim()) {
                    return;
                }


                try {

                    await appState
                        .saveActivityEntry({

                            title:
                                "Quick Note",

                            detail:
                                note.trim(),

                            status:
                                "completed"

                        });


                    showToast(
                        "Activity saved.",
                        "success"
                    );


                } catch (error) {

                    console.error(
                        "Activity save failed:",
                        error
                    );


                    showToast(
                        "Could not save activity.",
                        "error"
                    );

                }

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
                    )
                    ?.value
                    .trim();


                const ministry =
                    document.getElementById(
                        "reportMinistry"
                    )
                    ?.value
                    .trim();


                const summary =
                    document.getElementById(
                        "reportSummary"
                    )
                    ?.value
                    .trim();


                const value =
                    document.getElementById(
                        "reportValue"
                    )
                    ?.value;


                if (
                    !title ||
                    !ministry ||
                    !summary ||
                    value === ""
                ) {

                    showToast(
                        "Please complete all fields.",
                        "error"
                    );

                    return;

                }


                try {

                    await appState
                        .saveReportEntry({

                            title,

                            ministry,

                            summary,

                            value:
                                Number(
                                    value
                                )

                        });


                    reportForm.reset();


                    const formCard =
                        document.getElementById(
                            "reportsFormCard"
                        );


                    if (formCard) {

                        formCard.classList.add(
                            "hidden"
                        );

                    }


                    showToast(
                        "Report submitted successfully.",
                        "success"
                    );


                } catch (error) {

                    console.error(
                        "Report submission failed:",
                        error
                    );


                    showToast(
                        "Could not save report: " +
                        (
                            error.message ||
                            "Unknown error"
                        ),
                        "error"
                    );

                }

            }
        );

    }


    // =================================================
    // REPORT FORM BUTTONS
    // =================================================

    const addReportBtn =
        document.getElementById(
            "addReportBtn"
        );


    const cancelReportBtn =
        document.getElementById(
            "cancelReportBtn"
        );


    const reportsFormCard =
        document.getElementById(
            "reportsFormCard"
        );


    if (addReportBtn) {

        addReportBtn.addEventListener(
            "click",
            () => {

                if (reportsFormCard) {

                    reportsFormCard.classList.toggle(
                        "hidden"
                    );

                }

            }
        );

    }


    if (cancelReportBtn) {

        cancelReportBtn.addEventListener(
            "click",
            () => {

                if (reportsFormCard) {

                    reportsFormCard.classList.add(
                        "hidden"
                    );

                }

                if (reportForm) {

                    reportForm.reset();

                }

            }
        );

    }


    // =================================================
    // REFRESH REPORTS
    // =================================================

    const refreshChartBtn =
        document.getElementById(
            "refreshChartBtn"
        );


    if (refreshChartBtn) {

        refreshChartBtn.addEventListener(
            "click",
            async () => {

                try {

                    showToast(
                        "Refreshing dashboard data...",
                        "info"
                    );


                    const data =
                        await appState
                            .loadDashboardData();


                    appState.dashboardData =
                        data;


                    appState.renderAll();


                    showToast(
                        "Dashboard refreshed.",
                        "success"
                    );


                } catch (error) {

                    console.error(
                        "Refresh failed:",
                        error
                    );


                    showToast(
                        "Unable to refresh dashboard.",
                        "error"
                    );

                }

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


                const dark =
                    document.body.classList.contains(
                        "dark"
                    );


                themeToggle.textContent =
                    dark
                        ? "Light mode"
                        : "Dark mode";

            }
        );

    }


    // =================================================
    // INITIALIZE APPLICATION
    // =================================================

    appState.initializeApp =
        async function () {

            try {

                appState.showLoading(
                    true
                );


                const supabase =
                    getSupabase();


                if (!supabase) {

                    throw new Error(
                        "Supabase client is not initialized."
                    );

                }


                // -------------------------------------
                // Get current Supabase session
                // -------------------------------------

                try {

                    const sessionResult =
                        await supabase
                            .auth
                            .getSession();


                    const session =
                        sessionResult
                            .data
                            ?.session;


                    if (
                        session?.user
                    ) {

                        // Preserve profile role
                        // if auth.js already attached it.

                        appState.supabaseUser =
                            session.user;


                        if (
                            !appState.currentUser
                        ) {

                            appState.currentUser =
                                session.user;

                        }

                    }

                } catch (sessionError) {

                    console.warn(
                        "Could not read Supabase session:",
                        sessionError
                    );

                }


                // -------------------------------------
                // Load dashboard data
                // -------------------------------------

                const data =
                    await appState
                        .loadDashboardData();


                appState.dashboardData =
                    data;


                appState.renderAll();


                appState.updateNavPermissions();


                // -------------------------------------
                // Show dashboard
                // -------------------------------------

                if (
                    getCurrentUser()
                ) {

                    showSection(
                        "dashboardSection"
                    );

                }


                console.log(
                    "🟢 GDM Dashboard initialized successfully"
                );


            } catch (error) {

                console.error(
                    "Dashboard initialization failed:",
                    error
                );


                showToast(
                    "Dashboard could not load: " +
                    (
                        error.message ||
                        "Unknown error"
                    ),
                    "error"
                );

            } finally {

                appState.showLoading(
                    false
                );

            }

        };


    // =================================================
    // DOM READY
    // =================================================

    document.addEventListener(
        "DOMContentLoaded",
        async () => {

            // -----------------------------------------
            // Load stored user if available
            // -----------------------------------------

            const storedUser =
                appState.utils.readStorage(
                    "gdmCurrentUser",
                    null
                );


            if (storedUser) {

                appState.currentUser =
                    storedUser;

            }


            // -----------------------------------------
            // Auth state renderer
            // -----------------------------------------

            if (
                typeof appState.renderAuthState ===
                "function"
            ) {

                try {

                    appState.renderAuthState();

                } catch (error) {

                    console.warn(
                        "renderAuthState warning:",
                        error
                    );

                }

            }


            // -----------------------------------------
            // Permissions
            // -----------------------------------------

            appState.updateNavPermissions();


            // -----------------------------------------
            // Start application
            // -----------------------------------------

            await appState.initializeApp();

        }
    );


    // =================================================
    // SUPABASE AUTH STATE LISTENER
    // =================================================

    function setupAuthListener() {

        const supabase =
            getSupabase();


        if (!supabase) {
            return;
        }


        supabase.auth.onAuthStateChange(
            async (
                event,
                session
            ) => {

                console.log(
                    "Supabase auth event:",
                    event
                );


                if (
                    session?.user
                ) {

                    appState.supabaseUser =
                        session.user;


                    if (
                        !appState.currentUser
                    ) {

                        appState.currentUser =
                            session.user;

                    }


                    if (
                        typeof appState.renderAuthState ===
                        "function"
                    ) {

                        appState.renderAuthState();

                    }


                    appState.updateNavPermissions();

                }

            }
        );

    }


    // Give supabase.js time to initialize
    // before attaching listener.

    if (
        appState.supabaseReady
    ) {

        setupAuthListener();

    } else {

        setTimeout(
            setupAuthListener,
            500
        );

    }


})();
```
