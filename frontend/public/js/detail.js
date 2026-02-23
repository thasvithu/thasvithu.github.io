const DETAIL_API_BASE = window.PORTFOLIO_API_BASE || 'http://localhost:4000/api';

(async function initDetailPage() {
  const params = new URLSearchParams(window.location.search);
  let slug = params.get('slug');

  const hasProjectPage = Boolean(document.querySelector('#project-detail'));
  const hasBlogPage = Boolean(document.querySelector('#blog-detail'));

  if (!slug) {
    slug = await resolveMissingSlug(hasProjectPage, hasBlogPage);
    if (!slug) return;
    const url = new URL(window.location.href);
    url.searchParams.set('slug', slug);
    window.location.replace(url.toString());
    return;
  }

  if (hasProjectPage) {
    await renderProject(slug);
  }

  if (hasBlogPage) {
    await renderBlog(slug);
  }
})();

async function resolveMissingSlug(hasProjectPage, hasBlogPage) {
  try {
    if (hasProjectPage) {
      const response = await fetch(`${DETAIL_API_BASE}/projects`);
      if (!response.ok) throw new Error('Unable to load projects');
      const items = await response.json();
      if (!items.length) {
        write('#project-detail', 'No projects available yet.');
        return '';
      }
      return items[0].slug;
    }

    if (hasBlogPage) {
      const response = await fetch(`${DETAIL_API_BASE}/blogs`);
      if (!response.ok) throw new Error('Unable to load blog posts');
      const items = await response.json();
      if (!items.length) {
        write('#blog-detail', 'No blog posts available yet.');
        return '';
      }
      return items[0].slug;
    }
  } catch (error) {
    write('#project-detail', error.message);
    write('#blog-detail', error.message);
  }
  return '';
}

async function renderProject(slug) {
  const target = document.querySelector('#project-detail');
  try {
    const response = await fetch(`${DETAIL_API_BASE}/projects/${encodeURIComponent(slug)}`);
    if (!response.ok) throw new Error('Project not found');
    const project = await response.json();
    updatePageSeo({
      title: `${project.title} | Project | Vimalathas Vithusan`,
      description: project.subtitle || project.overview || 'Project details by Vimalathas Vithusan.',
      image: project.image_url || 'https://thasvithu.github.io/images/about.jpg'
    });

    target.innerHTML = `
      <h1>${escapeHtml(project.title)}</h1>
      <p>${escapeHtml(project.subtitle || '')}</p>
      <img src="${escapeHtml(project.image_url || 'images/projects/rag.png')}" alt="${escapeHtml(project.title)}" style="max-width:100%; border-radius:10px; margin: 20px 0;">
      <h3>Overview</h3>
      <p>${escapeHtml(project.overview || '')}</p>
      <h3>Features</h3>
      <p>${escapeHtml(project.features || '')}</p>
      <h3>Implementation</h3>
      <p>${escapeHtml(project.implementation || '')}</p>
      <h3>Challenges</h3>
      <p>${escapeHtml(project.challenges || '')}</p>
      <h3>Results</h3>
      <p>${escapeHtml(project.results || '')}</p>
      <h3>Future Enhancements</h3>
      <p>${escapeHtml(project.future_enhancements || '')}</p>
    `;
  } catch (error) {
    target.textContent = error.message;
  }
}

async function renderBlog(slug) {
  const target = document.querySelector('#blog-detail');
  try {
    const response = await fetch(`${DETAIL_API_BASE}/blogs/${encodeURIComponent(slug)}`);
    if (!response.ok) throw new Error('Blog not found');
    const post = await response.json();
    updatePageSeo({
      title: `${post.title} | Blog | Vimalathas Vithusan`,
      description: post.summary || 'Blog post by Vimalathas Vithusan.',
      image: post.image_url || 'https://thasvithu.github.io/images/about.jpg'
    });

    target.innerHTML = `
      <h1>${escapeHtml(post.title)}</h1>
      <p>${escapeHtml(post.date_label || '')}</p>
      <img src="${escapeHtml(post.image_url || 'images/blog/responsive-web-design.png')}" alt="${escapeHtml(post.title)}" style="max-width:100%; border-radius:10px; margin: 20px 0;">
      <p>${escapeHtml(post.summary || '')}</p>
      <hr style="margin: 20px 0;">
      <p style="white-space: pre-wrap;">${escapeHtml(post.content || '')}</p>
    `;
  } catch (error) {
    target.textContent = error.message;
  }
}

function write(selector, text) {
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function updatePageSeo({ title, description, image }) {
  if (title) document.title = String(title);

  setMetaContent('name', 'description', description);
  setMetaContent('property', 'og:title', title);
  setMetaContent('property', 'og:description', description);
  setMetaContent('property', 'og:image', image);
  setMetaContent('name', 'twitter:title', title);
  setMetaContent('name', 'twitter:description', description);
  setMetaContent('name', 'twitter:image', image);
}

function setMetaContent(attr, key, value) {
  const node = document.querySelector(`meta[${attr}="${key}"]`);
  if (node && value) node.setAttribute('content', String(value));
}
