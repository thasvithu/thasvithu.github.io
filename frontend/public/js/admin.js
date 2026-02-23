const apiInput = document.querySelector('#api-base');
const userInput = document.querySelector('#admin-username');
const passInput = document.querySelector('#admin-password');
const authStatus = document.querySelector('#admin-auth-status');
const loginCard = document.querySelector('#login-card');
const adminApp = document.querySelector('#admin-app');
const editModal = document.querySelector('#edit-modal');
const editStatus = document.querySelector('#edit-status');
let editContext = null;
const DEFAULT_API_BASE = window.PORTFOLIO_API_BASE || 'http://localhost:4000/api';

apiInput.value = localStorage.getItem('admin_api_base') || DEFAULT_API_BASE;

wireEvents();
initSession();

function wireEvents() {
  document.querySelector('#save-api-btn').addEventListener('click', () => {
    localStorage.setItem('admin_api_base', apiInput.value.trim() || DEFAULT_API_BASE);
    authStatus.textContent = 'API base saved.';
  });

  document.querySelector('#admin-login-btn').addEventListener('click', adminLogin);
  document.querySelector('#admin-logout-btn').addEventListener('click', adminLogout);
  document.querySelector('#refresh-admin-data-btn').addEventListener('click', loadAdminLists);
  document.querySelector('#add-project-btn').addEventListener('click', createProject);
  document.querySelector('#add-blog-btn').addEventListener('click', createBlog);
  document.querySelector('#upload-project-image-btn').addEventListener('click', () =>
    uploadImage('#p-image-file', '#p-image', '#project-status')
  );
  document.querySelector('#upload-blog-image-btn').addEventListener('click', () =>
    uploadImage('#b-image-file', '#b-image', '#blog-status')
  );
  document.querySelector('#load-messages-btn').addEventListener('click', loadMessages);
  document.querySelector('#load-audit-logs-btn').addEventListener('click', loadAuditLogs);
  document.querySelector('#edit-cancel-btn').addEventListener('click', closeEditModal);
  document.querySelector('#edit-save-btn').addEventListener('click', saveEditModal);
}

async function initSession() {
  const token = localStorage.getItem('admin_token');
  if (!token) return;
  setLoggedIn(true);
  await loadAdminLists();
}

async function adminLogin() {
  authStatus.textContent = 'Signing in...';
  try {
    localStorage.setItem('admin_api_base', apiInput.value.trim() || DEFAULT_API_BASE);
    const result = await rawFetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userInput.value.trim(), password: passInput.value.trim() })
    });

    localStorage.setItem('admin_token', result.token);
    passInput.value = '';
    setLoggedIn(true);
    authStatus.textContent = 'Logged in.';
    await loadAdminLists();
  } catch (error) {
    authStatus.textContent = error.message;
  }
}

function adminLogout() {
  localStorage.removeItem('admin_token');
  setLoggedIn(false);
  authStatus.textContent = 'Logged out.';
}

function setLoggedIn(isLoggedIn) {
  loginCard.classList.toggle('hidden', isLoggedIn);
  adminApp.classList.toggle('hidden', !isLoggedIn);
}

async function createProject() {
  const payload = projectFormPayload();
  await postAdmin('/admin/projects', payload, '#project-status');
  await loadProjects();
}

async function createBlog() {
  const payload = blogFormPayload();
  await postAdmin('/admin/blogs', payload, '#blog-status');
  await loadBlogs();
}

async function postAdmin(path, payload, statusSelector) {
  const status = document.querySelector(statusSelector);
  status.textContent = 'Submitting...';

  try {
    await adminFetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    status.textContent = 'Saved successfully.';
  } catch (error) {
    status.textContent = error.message;
  }
}

async function uploadImage(fileSelector, targetInputSelector, statusSelector) {
  const status = document.querySelector(statusSelector);
  const fileInput = document.querySelector(fileSelector);
  const targetInput = document.querySelector(targetInputSelector);
  const file = fileInput.files?.[0];
  if (!file) {
    status.textContent = 'Choose an image file first.';
    return;
  }

  status.textContent = 'Uploading image...';
  const form = new FormData();
  form.append('file', file);

  try {
    const result = await adminFetch('/admin/upload', { method: 'POST', body: form });
    targetInput.value = result.publicUrl;
    status.textContent = 'Image uploaded.';
  } catch (error) {
    status.textContent = error.message;
  }
}

async function loadAdminLists() {
  await Promise.all([loadProjects(), loadBlogs(), loadMessages(), loadAuditLogs()]);
}

async function loadProjects() {
  const box = document.querySelector('#projects-admin-list');
  box.textContent = 'Loading projects...';

  try {
    const items = await adminFetch('/admin/projects');
    if (!items.length) {
      box.textContent = 'No projects yet.';
      return;
    }

    box.innerHTML = items
      .map(
        (item) => `
        <div class="admin-list-item">
          <strong>${escapeHtml(item.title)}</strong>
          <div class="muted">${escapeHtml(item.slug)} | ${escapeHtml(item.category || '')}</div>
          <div class="muted">Published: ${item.is_published ? 'Yes' : 'No'} | Featured: ${item.featured ? 'Yes' : 'No'} | Sort: ${item.sort_order ?? 0}</div>
          <div class="admin-actions" style="margin-top:8px;">
            <button class="btn" data-action="edit-project" data-id="${item.id}">Edit</button>
            <button class="btn" data-action="delete-project" data-id="${item.id}">Delete</button>
          </div>
        </div>
      `
      )
      .join('');

    box.querySelectorAll('[data-action="edit-project"]').forEach((btn) => {
      btn.addEventListener('click', () => editProject(btn.getAttribute('data-id'), items));
    });

    box.querySelectorAll('[data-action="delete-project"]').forEach((btn) => {
      btn.addEventListener('click', () => deleteProject(btn.getAttribute('data-id')));
    });
  } catch (error) {
    box.textContent = error.message;
  }
}

async function loadBlogs() {
  const box = document.querySelector('#blogs-admin-list');
  box.textContent = 'Loading blogs...';

  try {
    const items = await adminFetch('/admin/blogs');
    if (!items.length) {
      box.textContent = 'No blogs yet.';
      return;
    }

    box.innerHTML = items
      .map(
        (item) => `
        <div class="admin-list-item">
          <strong>${escapeHtml(item.title)}</strong>
          <div class="muted">${escapeHtml(item.slug)} | ${escapeHtml(item.date_label || '')}</div>
          <div class="muted">Published: ${item.is_published ? 'Yes' : 'No'} | Featured: ${item.featured ? 'Yes' : 'No'} | Sort: ${item.sort_order ?? 0}</div>
          <div class="admin-actions" style="margin-top:8px;">
            <button class="btn" data-action="edit-blog" data-id="${item.id}">Edit</button>
            <button class="btn" data-action="delete-blog" data-id="${item.id}">Delete</button>
          </div>
        </div>
      `
      )
      .join('');

    box.querySelectorAll('[data-action="edit-blog"]').forEach((btn) => {
      btn.addEventListener('click', () => editBlog(btn.getAttribute('data-id'), items));
    });

    box.querySelectorAll('[data-action="delete-blog"]').forEach((btn) => {
      btn.addEventListener('click', () => deleteBlog(btn.getAttribute('data-id')));
    });
  } catch (error) {
    box.textContent = error.message;
  }
}

async function editProject(id, items) {
  const row = items.find((x) => String(x.id) === String(id));
  if (!row) return;
  openEditModal('project', row);
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  try {
    await adminFetch(`/admin/projects/${id}`, { method: 'DELETE' });
    await loadProjects();
  } catch (error) {
    alert(error.message);
  }
}

async function editBlog(id, items) {
  const row = items.find((x) => String(x.id) === String(id));
  if (!row) return;
  openEditModal('blog', row);
}

async function deleteBlog(id) {
  if (!confirm('Delete this blog?')) return;
  try {
    await adminFetch(`/admin/blogs/${id}`, { method: 'DELETE' });
    await loadBlogs();
  } catch (error) {
    alert(error.message);
  }
}

async function loadMessages() {
  const box = document.querySelector('#admin-messages');
  box.textContent = 'Loading messages...';

  try {
    const data = await adminFetch('/admin/messages');
    if (!data.length) {
      box.textContent = 'No contact messages yet.';
      return;
    }

    box.innerHTML = data
      .map(
        (msg) => `
        <div class="admin-list-item">
          <strong>${escapeHtml(msg.subject)}</strong><br>
          ${escapeHtml(msg.name)} (${escapeHtml(msg.email)})<br>
          <small>${new Date(msg.created_at).toLocaleString()}</small>
          <p style="margin-top:6px; white-space: pre-wrap;">${escapeHtml(msg.message)}</p>
        </div>
      `
      )
      .join('');
  } catch (error) {
    box.textContent = error.message;
  }
}

async function loadAuditLogs() {
  const box = document.querySelector('#admin-audit-logs');
  box.textContent = 'Loading audit logs...';

  try {
    const logs = await adminFetch('/admin/audit-logs');
    if (!logs.length) {
      box.textContent = 'No audit logs yet.';
      return;
    }

    box.innerHTML = logs
      .map(
        (log) => `
        <div class="admin-list-item">
          <strong>${escapeHtml(log.action)}</strong> - ${escapeHtml(log.entity_type)} (${escapeHtml(log.entity_id || '-')})<br>
          <span class="muted">By ${escapeHtml(log.actor)} at ${new Date(log.created_at).toLocaleString()}</span>
        </div>
      `
      )
      .join('');
  } catch (error) {
    box.textContent = error.message;
  }
}

async function rawFetch(path, options = {}) {
  const base = localStorage.getItem('admin_api_base') || DEFAULT_API_BASE;
  const response = await fetch(`${base}${path}`, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed');
  return result;
}

async function adminFetch(path, options = {}) {
  const token = localStorage.getItem('admin_token') || '';
  if (!token) throw new Error('Not logged in');

  return rawFetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
}

function value(selector) {
  return document.querySelector(selector).value.trim();
}

function checked(selector) {
  return Boolean(document.querySelector(selector).checked);
}

function numberValue(selector, fallback = 0) {
  const n = Number(document.querySelector(selector).value);
  return Number.isFinite(n) ? n : fallback;
}

function projectFormPayload() {
  return {
    title: value('#p-title'),
    category: value('#p-category'),
    image_url: value('#p-image'),
    tags: value('#p-tags'),
    overview: value('#p-summary'),
    is_published: checked('#p-published'),
    featured: checked('#p-featured'),
    publish_at: value('#p-publish-at'),
    sort_order: numberValue('#p-sort-order')
  };
}

function blogFormPayload() {
  return {
    title: value('#b-title'),
    date_label: value('#b-date'),
    image_url: value('#b-image'),
    tags: value('#b-tags'),
    summary: value('#b-summary'),
    content: value('#b-content'),
    is_published: checked('#b-published'),
    featured: checked('#b-featured'),
    publish_at: value('#b-publish-at'),
    sort_order: numberValue('#b-sort-order')
  };
}

function openEditModal(type, row) {
  editContext = { type, row };
  editStatus.textContent = '';
  document.querySelector('#edit-modal-title').textContent = type === 'project' ? 'Edit Project' : 'Edit Blog';

  document.querySelector('#edit-title').value = row.title || '';
  document.querySelector('#edit-category').value = row.category || '';
  document.querySelector('#edit-date-label').value = row.date_label || '';
  document.querySelector('#edit-image-url').value = row.image_url || '';
  document.querySelector('#edit-tags').value = (row.tags || []).join(', ');
  document.querySelector('#edit-published').checked = Boolean(row.is_published);
  document.querySelector('#edit-featured').checked = Boolean(row.featured);
  document.querySelector('#edit-publish-at').value = isoToLocalDatetime(row.publish_at);
  document.querySelector('#edit-sort-order').value = String(row.sort_order ?? 0);
  document.querySelector('#edit-summary').value = row.summary || row.overview || '';
  document.querySelector('#edit-content').value = row.content || '';

  const isProject = type === 'project';
  document.querySelector('#edit-category').style.display = isProject ? 'block' : 'none';
  document.querySelector('#edit-date-label').style.display = isProject ? 'none' : 'block';
  document.querySelector('#edit-content').style.display = isProject ? 'none' : 'block';

  editModal.classList.add('open');
  editModal.setAttribute('aria-hidden', 'false');
}

function closeEditModal() {
  editModal.classList.remove('open');
  editModal.setAttribute('aria-hidden', 'true');
  editContext = null;
}

async function saveEditModal() {
  if (!editContext) return;
  editStatus.textContent = 'Saving...';

  const payload = {
    title: value('#edit-title'),
    image_url: value('#edit-image-url'),
    tags: value('#edit-tags'),
    is_published: checked('#edit-published'),
    featured: checked('#edit-featured'),
    publish_at: value('#edit-publish-at'),
    sort_order: numberValue('#edit-sort-order')
  };

  try {
    if (editContext.type === 'project') {
      await adminFetch(`/admin/projects/${editContext.row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          category: value('#edit-category'),
          overview: value('#edit-summary')
        })
      });
      await loadProjects();
    } else {
      await adminFetch(`/admin/blogs/${editContext.row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          date_label: value('#edit-date-label'),
          summary: value('#edit-summary'),
          content: value('#edit-content')
        })
      });
      await loadBlogs();
    }

    editStatus.textContent = 'Saved successfully.';
    closeEditModal();
  } catch (error) {
    editStatus.textContent = error.message;
  }
}

function isoToLocalDatetime(isoValue) {
  if (!isoValue) return '';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
