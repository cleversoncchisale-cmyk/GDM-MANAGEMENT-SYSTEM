window.gdmApp = window.gdmApp || {};

(function () {
  "use strict";
  const appState = window.gdmApp;

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizePerson(row) {
    return {
      ...row,
      id: row.id,
      name: row.name || row.full_name || row.display_name || "Unknown",
      role: row.role || row.position || "Member",
      email: row.email || "",
      status: row.status || "Active"
    };
  }

  async function loadMembers() {
    if (!appState.supabase) return [];
    const { data, error } = await appState.supabase
      .from("people").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Members query failed:", error);
      return [];
    }
    appState.members = (data || []).map(normalizePerson);
    return appState.members;
  }

  function renderMembers() {
    const grid = document.getElementById("membersGrid");
    if (!grid) return;
    const members = appState.members || [];
    grid.innerHTML = members.length ? "" : '<div class="empty-state">No members found.</div>';
    members.forEach(member => {
      const card = document.createElement("article");
      card.className = "member-card";
      card.innerHTML = `<h3>${escapeHTML(member.name)}</h3><p><strong>${escapeHTML(member.role)}</strong></p><p>${escapeHTML(member.email)}</p><span class="badge badge-soft">${escapeHTML(member.status)}</span>`;
      grid.appendChild(card);
    });
  }

  async function initializeMembers() {
    await loadMembers();
    renderMembers();
  }

  appState.loadMembers = loadMembers;
  appState.renderMembers = renderMembers;
  document.addEventListener("gdmDataLoaded", initializeMembers);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeMembers, { once: true });
  else initializeMembers();
})();
