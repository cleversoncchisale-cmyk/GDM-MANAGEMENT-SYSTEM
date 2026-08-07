window.gdmApp = window.gdmApp || {};

(function () {
  const appState = window.gdmApp;

  // ---------- 1. Basic existence checks for dependencies ----------
  if (!appState.utils) {
    appState.utils = {
      readStorage: (key, fallback) => {
        try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
        catch (e) { return fallback; }
      },
      writeStorage: (key, value) => {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch (e) { console.warn('localStorage write failed', e); }
      }
    };
  }

  // Ensure saveDashboardData exists as a fallback (in case data module not loaded)
  if (!appState.saveDashboardData) {
    appState.saveDashboardData = async function (data) {
      appState.dashboardData = data;
      appState.utils.writeStorage("gdmDashboardData", data);
      return data;
    };
  }

  appState.showToast = function (title, message) {
    const stack = document.getElementById("toastStack");
    if (!stack) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<strong>${title}</strong><div>${message}</div>`;
    stack.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  };

  appState.renderNotifications = function () {
    const list = document.getElementById("notificationList");
    if (!list) return;

    const items = (appState.dashboardData && appState.dashboardData.notifications) || [];
    list.innerHTML = "";

    if (!items.length) {
      list.innerHTML = '<li class="empty-state">No notifications yet.</li>';
      return;
    }

    items.slice(0, 5).forEach((item) => {
      const li = document.createElement("li");
      li.className = "notification-item";
      li.innerHTML = `<strong>${item.title}</strong><div>${item.message}</div>`;
      list.appendChild(li);
    });
  };

  appState.addNotification = function (title, message) {
    const item = {
      id: Date.now(),
      title,
      message,
      createdAt: new Date().toISOString()
    };

    // Safely clone current dashboardData, defaulting to empty object
    const currentData = appState.dashboardData || {};
    const nextData = { ...currentData };  // shallow copy to avoid mutating directly

    nextData.notifications = [item, ...(nextData.notifications || []).slice(0, 4)];

    // Update both local state and persistence
    appState.dashboardData = nextData;
    appState.saveDashboardData(nextData);
    appState.renderNotifications();
    appState.showToast(title, message);
  };

  appState.startLiveNotifications = function () {
    if (appState.notificationTimer) {
      clearInterval(appState.notificationTimer);
      appState.notificationTimer = null;
    }

    // ---------- 2. Firestore real‑time listener (only updates notifications) ----------
    if (appState.db && !appState.mockMode) {
      // Listen only for changes to the `notifications` field to avoid wiping other data
      appState.db.collection("gdm-dashboard").doc("overview")
        .onSnapshot((doc) => {
          if (doc.exists) {
            const remoteData = doc.data();
            // Merge: keep local ministries/documents etc., only replace notifications
            const current = appState.dashboardData || {};
            appState.dashboardData = {
              ...current,
              ...remoteData,           // allow full sync if desired (but keep notifications key)
              notifications: remoteData.notifications || []
            };
            appState.renderNotifications();
          }
        }, (error) => console.warn("Notifications snapshot failed", error));
      return;
    }

    // ---------- 3. Robust demo notification cycle ----------
    const allMessages = [
      { title: "New ministry update", message: "Teaching team launched the monthly media review." },
      { title: "Reminder", message: "Youth outreach training starts next week." },
      { title: "Partner note", message: "Corporate partners requested a brief impact report." }
    ];

    let currentIndex = 0;

    appState.notificationTimer = setInterval(() => {
      const next = allMessages[currentIndex];
      currentIndex = (currentIndex + 1) % allMessages.length;
      appState.addNotification(next.title, next.message);
    }, 14000);
  };
})();