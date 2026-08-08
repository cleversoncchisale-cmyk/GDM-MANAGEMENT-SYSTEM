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
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          console.warn('localStorage write failed', e);
        }
      }
    };
  }

  const loginForm = document.getElementById("loginForm");
  const authMessage = document.getElementById("authMessage");
  const authSection = document.getElementById("authSection");
  const roleBadge = document.getElementById("roleBadge");
  const userRoleLabel = document.getElementById("userRoleLabel");

  const googleSignInBtn = document.getElementById("googleSignInBtn");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  appState.resolveUserRole = function (email) {

    const normalized =
        (email || "").toLowerCase().trim();

    if (normalized.includes("super")) {
        return "Super Admin";
    }

    if (normalized.includes("admin")) {
        return "Admin";
    }

    if (normalized.includes("member")) {
        return "Member";
    }

    if (normalized.includes("viewer")) {
        return "Viewer";
    }

    return "Viewer";
};

  appState.normalizeUser = function (user) {
    const email = user.email || "guest@gdm.org";
    const displayName = user.displayName || email.split("@")[0];
    const role = appState.resolveUserRole(email);
    return {
      uid: user.uid || `demo-${Date.now()}`,
      email,
      displayName,
      role,
      photoURL: user.photoURL || null
    };
  };

  appState.renderAuthState = function () {
    if (!authSection) return;

    if (appState.currentUser) {
      authSection.classList.add("hidden");
      if (roleBadge) {
        roleBadge.textContent = appState.currentUser.role || "Viewer";
      }
      if (userRoleLabel) {
        userRoleLabel.textContent = appState.currentUser.role || "Viewer";
      }
    } else {
      authSection.classList.remove("hidden");
      if (roleBadge) {
        roleBadge.textContent = "Guest";
      }
      if (userRoleLabel) {
        userRoleLabel.textContent = "Viewer";
      }
    }
  };

  appState.signIn = async function (email, password) {
    if (!authMessage) return null;
    authMessage.textContent = "Authenticating…";

    if (appState.auth && !appState.mockMode) {
      try {
        const response = await appState.auth.signInWithEmailAndPassword(email, password);
        appState.currentUser = appState.normalizeUser(response.user);
        appState.utils.writeStorage("gdmCurrentUser", appState.currentUser);
        authMessage.textContent = "Signed in with Firebase.";
        appState.renderAuthState();
        return appState.currentUser;
      } catch (error) {
        authMessage.textContent = error.message || "Unable to sign in.";
        return null;
      }
    }

    authMessage.textContent = "Firebase authentication is unavailable. Please check your Firebase setup and try again.";
    return null;
  };

  appState.signInWithGoogle = async function () {
    if (!authMessage) return null;
    authMessage.textContent = "Signing in with Google…";

    // Check for Firebase Auth and the Google provider safely
    if (appState.auth && !appState.mockMode &&
        window.firebase && window.firebase.auth && window.firebase.auth.GoogleAuthProvider) {
      try {
        const provider = new window.firebase.auth.GoogleAuthProvider();
        const response = await appState.auth.signInWithPopup(provider);
        appState.currentUser = appState.normalizeUser(response.user);
        appState.utils.writeStorage("gdmCurrentUser", appState.currentUser);
        authMessage.textContent = "Signed in with Google.";
        appState.renderAuthState();
        return appState.currentUser;
      } catch (error) {
        authMessage.textContent = error.message || "Google sign-in failed.";
        return null;
      }
    }

    authMessage.textContent = "Google sign-in is unavailable because Firebase auth is not configured correctly.";
    return null;
  };

  appState.sendPasswordReset = async function (email) {
    if (!authMessage) return;
    if (!email) {
      authMessage.textContent = "Please enter your email address above.";
      return;
    }

    authMessage.textContent = "Sending password reset link…";
    if (appState.auth && !appState.mockMode) {
      try {
        await appState.auth.sendPasswordResetEmail(email);
        authMessage.textContent = "Password reset link sent. Check your inbox.";
        return;
      } catch (error) {
        authMessage.textContent = error.message || "Could not send reset email.";
        return;
      }
    }

    authMessage.textContent = "Firebase password reset is unavailable. Please check your configuration.";
  };

  appState.signOut = async function () {
    if (appState.auth && !appState.mockMode) {
      try {
        await appState.auth.signOut();
      } catch (error) {
        console.warn("Firebase sign out failed", error);
      }
    }

    appState.currentUser = null;
    appState.utils.writeStorage("gdmCurrentUser", null);
    appState.renderAuthState();
    if (typeof appState.renderDashboard === "function") {
      appState.renderDashboard();
    }
  };

  if (appState.auth && !appState.mockMode && typeof appState.auth.onAuthStateChanged === "function") {
    appState.auth.onAuthStateChanged((user) => {
      if (user) {
        appState.currentUser = appState.normalizeUser(user);
        appState.utils.writeStorage("gdmCurrentUser", appState.currentUser);
        appState.renderAuthState();
        if (typeof appState.initializeApp === "function") {
          appState.initializeApp();
        }
        return;
      }

      appState.currentUser = null;
      appState.utils.writeStorage("gdmCurrentUser", null);
      appState.renderAuthState();
      if (location.pathname.includes("/gdm-dashboard/")) {
        location.href = "../../index.html";
      }
    });
  }

  // ---------- Event listeners with element checks ----------
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const emailField = document.getElementById("email");
      const passwordField = document.getElementById("password");

      if (!emailField || !passwordField) {
        if (authMessage) authMessage.textContent = "Login form is incomplete.";
        return;
      }

      const email = emailField.value.trim();
      const password = passwordField.value;
      await appState.signIn(email, password);
      if (appState.currentUser && typeof appState.initializeApp === "function") {
        appState.initializeApp();
      }
    });
  }

  if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", async () => {
      const user = await appState.signInWithGoogle();
      if (user && typeof appState.initializeApp === "function") {
        appState.initializeApp();
      }
    });
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", () => {
      const emailField = document.getElementById("email");
      const email = emailField ? emailField.value.trim() : "";
      appState.sendPasswordReset(email);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", appState.signOut);
  }

  // Restore session from localStorage
  const storedUser = appState.utils.readStorage("gdmCurrentUser", null);
  if (storedUser) {
    appState.currentUser = storedUser;
    appState.renderAuthState();
    if (typeof appState.initializeApp === "function") {
      appState.initializeApp();
    }
  } else if (location.pathname.includes("/gdm-dashboard/")) {
    location.href = "../../index.html";
  }
})();
