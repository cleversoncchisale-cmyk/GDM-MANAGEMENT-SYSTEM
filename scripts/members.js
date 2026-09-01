window.gdmApp = window.gdmApp || {};

(function () {
  "use strict";

  const appState = window.gdmApp;

  function client() {
    return appState.supabase || null;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function notify(message, type = "info") {
    if (typeof appState.showToast === "function") {
      appState.showToast(message, type);
    } else {
      console.log(message);
    }
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
    const supabase = client();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("people")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Members query failed:", error);
      notify("Unable to load members: " + error.message, "error");
      return [];
    }

    appState.members = (data || []).map(normalizePerson);
    return appState.members;
  }

  function renderMembers(items = appState.members || []) {
    const grid = document.getElementById("membersGrid");
    if (!grid) return;

    const members = items.map(normalizePerson);

    grid.innerHTML = members.length
      ? members.map(member => `
          <article class="member-card" data-member-id="${escapeHTML(member.id)}">
            <h3>${escapeHTML(member.name)}</h3>
            <p><strong>${escapeHTML(member.role)}</strong></p>
            <p>${escapeHTML(member.email || "No email")}</p>
            <span class="badge badge-soft">${escapeHTML(member.status)}</span>
            <div class="form-actions">
              <button type="button" class="secondary-btn member-edit-btn" data-id="${escapeHTML(member.id)}">Edit</button>
              <button type="button" class="secondary-btn member-delete-btn" data-id="${escapeHTML(member.id)}">Delete</button>
            </div>
          </article>
        `).join("")
      : '<div class="empty-state">No members found.</div>';
  }

  async function addMember(payload) {
    const supabase = client();
    if (!supabase) return null;

    const name = String(payload?.name || "").trim();
    const role = String(payload?.role || "").trim();
    const email = String(payload?.email || "").trim();
    const status = String(payload?.status || "Active").trim();

    if (!name || !role || !email) {
      notify("Name, role and email are required.", "error");
      return null;
    }

    const { data, error } = await supabase
      .from("people")
      .insert({ name, role, email, status })
      .select("*")
      .single();

    if (error) {
      console.error("Add member failed:", error);
      notify("Could not add member: " + error.message, "error");
      return null;
    }

    appState.members = [normalizePerson(data), ...(appState.members || [])];
    renderMembers();
    notify("Member added successfully.", "success");
    return data;
  }

  async function updateMember(id, payload) {
    const supabase = client();
    if (!supabase || !id) return false;

    const updates = {
      name: String(payload?.name || "").trim(),
      role: String(payload?.role || "").trim(),
      email: String(payload?.email || "").trim(),
      status: String(payload?.status || "Active").trim()
    };

    if (!updates.name || !updates.role || !updates.email) {
      notify("Name, role and email are required.", "error");
      return false;
    }

    const { data, error } = await supabase
      .from("people")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Update member failed:", error);
      notify("Could not update member: " + error.message, "error");
      return false;
    }

    const updated = normalizePerson(data);
    appState.members = (appState.members || []).map(member =>
      member.id === id ? updated : member
    );
    renderMembers();
    notify("Member updated successfully.", "success");
    return true;
  }

  async function deleteMember(id) {
    if (!id) return false;
    if (!window.confirm("Are you sure you want to delete this member?")) return false;

    const supabase = client();
    if (!supabase) return false;

    const { error } = await supabase
      .from("people")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete member failed:", error);
      notify("Could not delete member: " + error.message, "error");
      return false;
    }

    appState.members = (appState.members || []).filter(member => member.id !== id);
    renderMembers();
    notify("Member deleted successfully.", "success");
    return true;
  }

  function getFormPayload() {
    return {
      name: document.getElementById("memberName")?.value || "",
      role: document.getElementById("memberRole")?.value || "",
      email: document.getElementById("memberEmail")?.value || "",
      status: document.getElementById("memberStatus")?.value || "Active"
    };
  }

  function resetMemberForm() {
    const form = document.getElementById("memberForm");
    if (form) form.reset();
  }

  function bindForm() {
    const form = document.getElementById("memberForm");
    if (!form || form.dataset.bound === "true") return;

    form.dataset.bound = "true";

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const button = form.querySelector("button[type='submit']");
      if (button) button.disabled = true;

      try {
        await addMember(getFormPayload());
        resetMemberForm();
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  function bindMemberActions() {
    const grid = document.getElementById("membersGrid");
    if (!grid || grid.dataset.actionsBound === "true") return;

    grid.dataset.actionsBound = "true";

    grid.addEventListener("click", async event => {
      const editButton = event.target.closest(".member-edit-btn");
      const deleteButton = event.target.closest(".member-delete-btn");

      if (deleteButton) {
        await deleteMember(deleteButton.dataset.id);
        return;
      }

      if (!editButton) return;

      const id = editButton.dataset.id;
      const member = (appState.members || []).find(item => item.id === id);
      if (!member) return;

      const name = window.prompt("Member name:", member.name);
      if (name === null) return;

      const role = window.prompt("Member role:", member.role);
      if (role === null) return;

      const email = window.prompt("Member email:", member.email);
      if (email === null) return;

      const status = window.prompt("Status (Active/Inactive):", member.status);
      if (status === null) return;

      await updateMember(id, { name, role, email, status });
    });
  }

  async function initializeMembers() {
    bindForm();
    bindMemberActions();
    await loadMembers();
    renderMembers();
  }

  appState.loadMembers = loadMembers;
  appState.renderMembers = renderMembers;
  appState.addMember = addMember;
  appState.updateMember = updateMember;
  appState.deleteMember = deleteMember;

  document.addEventListener("gdmDataLoaded", initializeMembers);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeMembers, { once: true });
  } else {
    initializeMembers();
  }
})();
