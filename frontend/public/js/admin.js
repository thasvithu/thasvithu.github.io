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
  document.querySelector('#p-image').addEventListener('input', () => syncImagePreview('#p-image', '#p-image-preview'));
  document.querySelector('#b-image').addEventListener('input', () => syncImagePreview('#b-image', '#b-image-preview'));
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
  const canContinue = await ensureUploadedImageBeforeCreate('#p-image-file', '#p-image', '#project-status');
  if (!canContinue) return;
  const payload = projectFormPayload();
  await postAdmin('/admin/projects', payload, '#project-status');
  await loadProjects();
}

async function createBlog() {
  const canContinue = await ensureUploadedImageBeforeCreate('#b-image-file', '#b-image', '#blog-status');
  if (!canContinue) return;
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
    return false;
  }

  status.textContent = 'Uploading image...';
  const form = new FormData();
  form.append('file', file);

  try {
    const result = await adminFetch('/admin/upload', { method: 'POST', body: form });
    targetInput.value = result.publicUrl;
    syncImagePreview(targetInputSelector, targetInputSelector === '#p-image' ? '#p-image-preview' : '#b-image-preview');
    status.textContent = 'Image uploaded and URL set.';
    return true;
  } catch (error) {
    status.textContent = error.message;
    return false;
  }
}

async function ensureUploadedImageBeforeCreate(fileSelector, imageUrlSelector, statusSelector) {
  const fileInput = document.querySelector(fileSelector);
  const imageUrlInput = document.querySelector(imageUrlSelector);
  const status = document.querySelector(statusSelector);
  const hasSelectedFile = Boolean(fileInput?.files?.[0]);
  const hasImageUrl = Boolean(imageUrlInput?.value?.trim());

  // Auto-upload selected file before create if URL is still empty.
  if (hasSelectedFile && !hasImageUrl) {
    status.textContent = 'Uploading selected image before create...';
    const ok = await uploadImage(fileSelector, imageUrlSelector, statusSelector);
    return ok;
  }

  return true;
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
          <div class="muted">Published: ${item.is_published ? 'Yes' : 'No'}</div>
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
          <div class="muted">Published: ${item.is_published ? 'Yes' : 'No'}</div>
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

function projectFormPayload() {
  return {
    title: value('#p-title'),
    subtitle: value('#p-subtitle'),
    category: value('#p-category'),
    role: value('#p-role'),
    duration: value('#p-duration'),
    status: value('#p-status'),
    technologies: value('#p-technologies'),
    image_url: value('#p-image'),
    tags: value('#p-tags'),
    github_url: value('#p-github-url'),
    demo_url: value('#p-demo-url'),
    docs_url: value('#p-docs-url'),
    overview: value('#p-summary'),
    features: value('#p-features'),
    implementation: value('#p-implementation'),
    challenges: value('#p-challenges'),
    results: value('#p-results'),
    future_enhancements: value('#p-future'),
    is_published: checked('#p-published')
  };
}

function blogFormPayload() {
  return {
    title: value('#b-title'),
    date_label: value('#b-date'),
    author_name: value('#b-author-name'),
    author_bio: value('#b-author-bio'),
    image_url: value('#b-image'),
    tags: value('#b-tags'),
    summary: value('#b-summary'),
    content: value('#b-content'),
    is_published: checked('#b-published')
  };
}

function openEditModal(type, row) {
  editContext = { type, row };
  editStatus.textContent = '';
  document.querySelector('#edit-modal-title').textContent = type === 'project' ? 'Edit Project' : 'Edit Blog';

  document.querySelector('#edit-title').value = row.title || '';
  document.querySelector('#edit-subtitle').value = row.subtitle || '';
  document.querySelector('#edit-category').value = row.category || '';
  document.querySelector('#edit-role').value = row.role || '';
  document.querySelector('#edit-duration').value = row.duration || '';
  document.querySelector('#edit-status').value = row.status || '';
  document.querySelector('#edit-technologies').value = row.technologies || '';
  document.querySelector('#edit-date-label').value = row.date_label || '';
  document.querySelector('#edit-author-name').value = row.author_name || '';
  document.querySelector('#edit-author-bio').value = row.author_bio || '';
  document.querySelector('#edit-image-url').value = row.image_url || '';
  document.querySelector('#edit-tags').value = (row.tags || []).join(', ');
  document.querySelector('#edit-github-url').value = row.github_url || '';
  document.querySelector('#edit-demo-url').value = row.demo_url || '';
  document.querySelector('#edit-docs-url').value = row.docs_url || '';
  document.querySelector('#edit-published').checked = Boolean(row.is_published);
  document.querySelector('#edit-summary').value = row.summary || row.overview || '';
  document.querySelector('#edit-features').value = row.features || '';
  document.querySelector('#edit-implementation').value = row.implementation || '';
  document.querySelector('#edit-challenges').value = row.challenges || '';
  document.querySelector('#edit-results').value = row.results || '';
  document.querySelector('#edit-future').value = row.future_enhancements || '';
  document.querySelector('#edit-content').value = row.content || '';

  const isProject = type === 'project';
  toggleField('#edit-subtitle', isProject);
  toggleField('#edit-category', isProject);
  toggleField('#edit-role', isProject);
  toggleField('#edit-duration', isProject);
  toggleField('#edit-status', isProject);
  toggleField('#edit-technologies', isProject);
  toggleField('#edit-github-url', isProject);
  toggleField('#edit-demo-url', isProject);
  toggleField('#edit-docs-url', isProject);
  toggleField('#edit-features', isProject);
  toggleField('#edit-implementation', isProject);
  toggleField('#edit-challenges', isProject);
  toggleField('#edit-results', isProject);
  toggleField('#edit-future', isProject);

  toggleField('#edit-date-label', !isProject);
  toggleField('#edit-author-name', !isProject);
  toggleField('#edit-author-bio', !isProject);
  toggleField('#edit-content', !isProject);

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
    is_published: checked('#edit-published')
  };

  try {
    if (editContext.type === 'project') {
      await adminFetch(`/admin/projects/${editContext.row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          subtitle: value('#edit-subtitle'),
          category: value('#edit-category'),
          role: value('#edit-role'),
          duration: value('#edit-duration'),
          status: value('#edit-status'),
          technologies: value('#edit-technologies'),
          github_url: value('#edit-github-url'),
          demo_url: value('#edit-demo-url'),
          docs_url: value('#edit-docs-url'),
          overview: value('#edit-summary'),
          features: value('#edit-features'),
          implementation: value('#edit-implementation'),
          challenges: value('#edit-challenges'),
          results: value('#edit-results'),
          future_enhancements: value('#edit-future')
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
          author_name: value('#edit-author-name'),
          author_bio: value('#edit-author-bio'),
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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toggleField(selector, visible) {
  const node = document.querySelector(selector);
  if (!node) return;
  node.style.display = visible ? 'block' : 'none';
}

function syncImagePreview(inputSelector, previewSelector) {
  const input = document.querySelector(inputSelector);
  const preview = document.querySelector(previewSelector);
  if (!input || !preview) return;

  const url = (input.value || '').trim();
  if (!url) {
    preview.style.display = 'none';
    preview.removeAttribute('src');
    return;
  }

  preview.src = url;
  preview.style.display = 'block';
}
