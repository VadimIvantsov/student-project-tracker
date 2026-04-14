let projects = [];
let currentEditId = null;

function loadProjects() {
  const saved = localStorage.getItem("studentProjects");
  if (saved) {
    projects = JSON.parse(saved);
  } else {
    projects = [];
  }
  renderProjects();
}

function saveProjects() {
  localStorage.setItem("studentProjects", JSON.stringify(projects));
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function updateStats() {
  document.getElementById("statTotal").textContent = projects.length;
  document.getElementById("statPlanning").textContent = projects.filter(
    (p) => p.status === "Планирование",
  ).length;
  document.getElementById("statWorking").textContent = projects.filter(
    (p) => p.status === "В работе",
  ).length;
  document.getElementById("statReview").textContent = projects.filter(
    (p) => p.status === "На проверке",
  ).length;
  document.getElementById("statDone").textContent = projects.filter(
    (p) => p.status === "Завершен",
  ).length;
}

function getStatusClass(status) {
  if (status === "Планирование") return "status-planning";
  if (status === "В работе") return "status-working";
  if (status === "На проверке") return "status-review";
  if (status === "Завершен") return "status-done";
  return "status-planning";
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

function renderProjects() {
  const filterValue = document.getElementById("statusFilter").value;
  let filtered = [...projects];
  if (filterValue !== "all") {
    filtered = filtered.filter((p) => p.status === filterValue);
  }

  const tableBody = document.getElementById("projectsTableBody");
  tableBody.innerHTML = "";
  const cardsContainer = document.getElementById("cardsView");
  cardsContainer.innerHTML = "";

  if (filtered.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="5" class="empty-state">📭 Проекты не найдены. Создайте новый проект!</td>`;
    tableBody.appendChild(emptyRow);
    const emptyCard = document.createElement("div");
    emptyCard.className = "project-card";
    emptyCard.innerHTML = `<div class="empty-state">📭 Нет проектов с таким статусом</div>`;
    cardsContainer.appendChild(emptyCard);
    updateStats();
    return;
  }

  filtered.forEach((proj) => {
    const participantsHtml = `<div class="participants-list">${proj.participants.map((p) => `<span class="participant-badge">${escapeHtml(p)}</span>`).join("")}</div>`;

    const row = document.createElement("tr");
    row.innerHTML = `
            <td><div class="project-title">${escapeHtml(proj.name)}</div></td>
            <td><div class="project-desc">${escapeHtml(proj.description)}</div></td>
            <td>${participantsHtml}</td>
            <td><span class="status-badge ${getStatusClass(proj.status)}" data-id="${proj.id}" data-status="${proj.status}">${escapeHtml(proj.status)}</span></td>
            <td class="action-buttons">
                <button class="btn-edit" data-id="${proj.id}">✏️ Редакт.</button>
                <button class="btn-delete" data-id="${proj.id}">🗑️ Удалить</button>
            </td>
        `;
    tableBody.appendChild(row);

    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
            <div class="card-header">
                <span class="card-title">${escapeHtml(proj.name)}</span>
                <span class="status-badge ${getStatusClass(proj.status)}" data-id="${proj.id}" data-status="${proj.status}">${escapeHtml(proj.status)}</span>
            </div>
            <div class="card-desc">${escapeHtml(proj.description)}</div>
            <div class="card-meta"><div class="card-participants">${proj.participants.map((p) => `<span class="participant-badge">${escapeHtml(p)}</span>`).join("")}</div></div>
            <div class="card-actions">
                <button class="btn-edit" data-id="${proj.id}">✏️ Редактировать</button>
                <button class="btn-delete" data-id="${proj.id}">🗑️ Удалить</button>
            </div>
        `;
    cardsContainer.appendChild(card);
  });

  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", (e) =>
      openEditModal(parseInt(btn.getAttribute("data-id"))),
    );
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(btn.getAttribute("data-id"));
      if (confirm("Удалить проект?")) deleteProject(id);
    });
  });

  document.querySelectorAll(".status-badge[data-id]").forEach((badge) => {
    badge.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(badge.getAttribute("data-id"));
      const statuses = ["Планирование", "В работе", "На проверке", "Завершен"];
      const current = badge.getAttribute("data-status");
      const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
      updateProjectStatus(id, next);
    });
  });

  updateStats();
}

function updateProjectStatus(id, newStatus) {
  const project = projects.find((p) => p.id === id);
  if (project) {
    project.status = newStatus;
    saveProjects();
    renderProjects();
    showToast(`Статус "${project.name}" → ${newStatus}`);
  }
}

function deleteProject(id) {
  const project = projects.find((p) => p.id === id);
  projects = projects.filter((p) => p.id !== id);
  saveProjects();
  renderProjects();
  if (project) {
    showToast(`Проект "${project.name}" удален`);
  }
}

function openEditModal(id) {
  const project = projects.find((p) => p.id === id);
  if (!project) return;
  currentEditId = id;
  document.getElementById("modalTitle").innerText = "✏️ Редактирование проекта";
  document.getElementById("projectName").value = project.name;
  document.getElementById("projectDesc").value = project.description;
  document.getElementById("projectParticipants").value =
    project.participants.join(", ");
  document.getElementById("projectStatus").value = project.status;
  document.getElementById("nameCounter").innerText = project.name.length;
  document.getElementById("descCounter").innerText = project.description.length;
  document.getElementById("projectModal").style.display = "flex";
}

function openCreateModal() {
  currentEditId = null;
  document.getElementById("modalTitle").innerText = "➕ Новый проект";
  document.getElementById("projectName").value = "";
  document.getElementById("projectDesc").value = "";
  document.getElementById("projectParticipants").value = "";
  document.getElementById("projectStatus").value = "Планирование";
  document.getElementById("nameCounter").innerText = "0";
  document.getElementById("descCounter").innerText = "0";
  document.getElementById("projectModal").style.display = "flex";
}

function saveProject() {
  const name = document.getElementById("projectName").value.trim();
  const description = document.getElementById("projectDesc").value.trim();
  const participantsRaw = document
    .getElementById("projectParticipants")
    .value.trim();
  const status = document.getElementById("projectStatus").value;

  if (!name) {
    alert("Введите название проекта");
    return false;
  }

  let participants = participantsRaw
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p);
  if (!participants.length) participants = ["Участник не указан"];

  if (currentEditId === null) {
    const newId = Date.now();
    projects.push({
      id: newId,
      name,
      description: description || "Без описания",
      participants,
      status,
    });
    showToast(`Проект "${name}" создан`);
  } else {
    const idx = projects.findIndex((p) => p.id === currentEditId);
    if (idx !== -1) {
      const oldName = projects[idx].name;
      projects[idx] = {
        ...projects[idx],
        name,
        description: description || "Без описания",
        participants,
        status,
      };
      showToast(`Проект "${oldName}" обновлен`);
    }
  }
  saveProjects();
  closeModal();
  renderProjects();
}

function closeModal() {
  document.getElementById("projectModal").style.display = "none";
  currentEditId = null;
}

function extractSheetId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function convertSheetDataToProjects(data) {
  const projects = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] || !row[0].trim()) continue;

    const name = row[0]?.trim() || "Без названия";
    const description = row[1]?.trim() || "Без описания";
    const participantsRaw = row[2]?.trim() || "";
    let participants = participantsRaw
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p);
    if (participants.length === 0) participants = ["Участник не указан"];

    let status = row[3]?.trim() || "Планирование";
    const validStatuses = [
      "Планирование",
      "В работе",
      "На проверке",
      "Завершен",
    ];
    if (!validStatuses.includes(status)) status = "Планирование";

    projects.push({
      id: Date.now() + i + Math.random(),
      name: name,
      description: description,
      participants: participants,
      status: status,
    });
  }
  return projects;
}

async function importFromGoogleSheets(sheetUrl) {
  const sheetId = extractSheetId(sheetUrl);
  if (!sheetId) {
    showToast("❌ Неверная ссылка на Google таблицу");
    return false;
  }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

  try {
    showToast("⏳ Загрузка данных из Google Sheets...");
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(
        "Не удалось загрузить таблицу. Убедитесь, что таблица опубликована как публичная.",
      );
    }
    const csvText = await response.text();

    const rows = csvText.split(/\r?\n/);
    const data = rows.map((row) => {
      const result = [];
      let inQuotes = false;
      let current = "";
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });

    if (data.length < 2) {
      showToast("❌ Таблица не содержит данных");
      return false;
    }

    const newProjects = convertSheetDataToProjects(data);

    if (newProjects.length === 0) {
      showToast("❌ Не найдено проектов для импорта");
      return false;
    }

    projects.push(...newProjects);
    saveProjects();
    renderProjects();
    showToast(
      `✅ Импортировано ${newProjects.length} проектов из Google Sheets`,
    );
    return true;
  } catch (error) {
    console.error(error);
    showToast("❌ Ошибка импорта: " + error.message);
    return false;
  }
}

function showFeedbackForm() {
  window.open("https://forms.gle/2bgVLETCh1iEVv5L9", "_blank");
  showToast("📝 Откроется форма обратной связи");
}

const googleSheetModal = document.getElementById("googleSheetModal");
const importBtn = document.getElementById("importGoogleBtn");

importBtn.addEventListener("click", () => {
  document.getElementById("googleSheetUrl").value = "";
  googleSheetModal.style.display = "flex";
});

document
  .getElementById("closeGoogleSheetModal")
  .addEventListener("click", () => {
    googleSheetModal.style.display = "none";
  });

document
  .getElementById("confirmImportBtn")
  .addEventListener("click", async () => {
    const url = document.getElementById("googleSheetUrl").value.trim();
    if (!url) {
      showToast("Введите ссылку на Google таблицу");
      return;
    }
    googleSheetModal.style.display = "none";
    await importFromGoogleSheets(url);
  });

document
  .getElementById("feedbackLink")
  .addEventListener("click", showFeedbackForm);
document.getElementById("homeLink").addEventListener("click", () => {
  document.getElementById("statusFilter").value = "all";
  renderProjects();
});
document
  .getElementById("statusFilter")
  .addEventListener("change", () => renderProjects());
document
  .getElementById("createProjectBtn")
  .addEventListener("click", openCreateModal);
document.getElementById("cancelModalBtn").addEventListener("click", closeModal);
document
  .getElementById("saveProjectBtn")
  .addEventListener("click", saveProject);

document.getElementById("projectName").addEventListener("input", (e) => {
  document.getElementById("nameCounter").innerText = e.target.value.length;
});
document.getElementById("projectDesc").addEventListener("input", (e) => {
  document.getElementById("descCounter").innerText = e.target.value.length;
});

window.addEventListener("click", (e) => {
  if (e.target === document.getElementById("projectModal")) closeModal();
  if (e.target === googleSheetModal) googleSheetModal.style.display = "none";
});

loadProjects();
