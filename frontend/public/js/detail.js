const DETAIL_API_BASE = window.PORTFOLIO_API_BASE || 'http://localhost:4000/api';

(async function initDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  const hasProjectPage = Boolean(document.querySelector('#project-detail'));
  const hasBlogPage = Boolean(document.querySelector('#blog-detail'));

  if (!slug) {
    if (hasProjectPage) {
      const lastProjectSlug = localStorage.getItem('last_project_slug') || '';
      if (lastProjectSlug) {
        const url = new URL(window.location.href);
        url.searchParams.set('slug', lastProjectSlug);
        window.location.replace(url.toString());
        return;
      }
      write('#project-detail', 'Missing project slug.');
    }

    if (hasBlogPage) {
      const lastBlogSlug = localStorage.getItem('last_blog_slug') || '';
      if (lastBlogSlug) {
        const url = new URL(window.location.href);
        url.searchParams.set('slug', lastBlogSlug);
        window.location.replace(url.toString());
        return;
      }
      write('#blog-detail', 'Missing blog slug.');
    }
    return;
  }

  if (hasProjectPage) {
    await renderProject(slug);
  }

  if (hasBlogPage) {
    await renderBlog(slug);
  }
})();

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

    const links = [
      project.github_url ? `<a class="btn detail-action-btn" href="${escapeHtml(project.github_url)}" target="_blank" rel="noopener noreferrer">GitHub</a>` : '',
      project.demo_url ? `<a class="btn detail-action-btn" href="${escapeHtml(project.demo_url)}" target="_blank" rel="noopener noreferrer">Live Demo</a>` : '',
      project.docs_url ? `<a class="btn detail-action-btn" href="${escapeHtml(project.docs_url)}" target="_blank" rel="noopener noreferrer">Documentation</a>` : ''
    ]
      .filter(Boolean)
      .join('');

    target.innerHTML = `
      <article class="detail-content">
      <h1>${escapeHtml(project.title)}</h1>
      ${project.subtitle ? `<p class="detail-subtitle">${escapeHtml(project.subtitle)}</p>` : ''}
      <p class="detail-meta-line">
        ${project.category ? `<strong>Category:</strong> ${escapeHtml(project.category)} | ` : ''}
        ${project.role ? `<strong>Role:</strong> ${escapeHtml(project.role)} | ` : ''}
        ${project.duration ? `<strong>Duration:</strong> ${escapeHtml(project.duration)} | ` : ''}
        ${project.status ? `<strong>Status:</strong> ${escapeHtml(project.status)}` : ''}
      </p>
      ${project.tags?.length ? `<p class="detail-inline-line"><strong>Tags:</strong> ${escapeHtml(project.tags.join(', '))}</p>` : ''}
      ${project.technologies ? `<p class="detail-inline-line"><strong>Technologies:</strong> ${escapeHtml(project.technologies)}</p>` : ''}
      <img class="detail-hero-image" src="${escapeHtml(project.image_url || 'images/projects/rag.png')}" alt="${escapeHtml(project.title)}">
      ${links ? `<div class="detail-actions">${links}</div>` : ''}
      ${renderSection('Overview', project.overview)}
      ${renderSection('Features', project.features)}
      ${renderSection('Implementation', project.implementation)}
      ${renderSection('Challenges', project.challenges)}
      ${renderSection('Results', project.results)}
      ${renderSection('Future Enhancements', project.future_enhancements)}
      </article>
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
      <article class="detail-content">
      <h1>${escapeHtml(post.title)}</h1>
      <p class="detail-meta-line">
        ${post.date_label ? `<strong>Date:</strong> ${escapeHtml(post.date_label)} | ` : ''}
        <strong>Author:</strong> ${escapeHtml(post.author_name || 'Vimalathas Vithusan')}
      </p>
      ${post.author_bio ? `<p class="detail-inline-line">${escapeHtml(post.author_bio)}</p>` : ''}
      ${post.tags?.length ? `<p class="detail-inline-line"><strong>Tags:</strong> ${escapeHtml(post.tags.join(', '))}</p>` : ''}
      <img class="detail-hero-image" src="${escapeHtml(post.image_url || 'images/blog/responsive-web-design.png')}" alt="${escapeHtml(post.title)}">
      ${post.summary ? `<p class="detail-summary">${escapeHtml(post.summary)}</p>` : ''}
      <hr class="detail-divider">
      <div class="detail-text detail-markdown">${renderMarkdown(post.content || '')}</div>
      </article>
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

function renderSection(title, value) {
  if (!value) return '';
  return `<h3>${escapeHtml(title)}</h3><div class="detail-text detail-markdown">${renderMarkdown(value)}</div>`;
}

function renderTextBlocks(value) {
  const text = escapeHtml(String(value || '').trim());
  if (!text) return '';
  return text
    .split(/\n{2,}/)
    .map((block) => `<p class="detail-paragraph">${block}</p>`)
    .join('');
}

function renderMarkdown(value) {
  const lines = String(value || '').replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let inList = false;
  let listType = '';
  let inCode = false;
  let codeLines = [];

  const closeList = () => {
    if (inList) {
      html.push(`</${listType}>`);
      inList = false;
      listType = '';
    }
  };

  const closeCode = () => {
    if (inCode) {
      html.push(`<pre class="detail-code"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      inCode = false;
      codeLines = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      closeList();
      if (inCode) {
        closeCode();
      } else {
        inCode = true;
        codeLines = [];
      }
      continue;
    }

    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }

    if (!trimmed) {
      closeList();
      continue;
    }

    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      closeList();
      html.push('<hr class="detail-divider">');
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const text = renderInlineMarkdown(headingMatch[2]);
      html.push(`<h${level + 1}>${text}</h${level + 1}>`);
      continue;
    }

    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        html.push('<ul class="detail-list">');
      }
      html.push(`<li>${renderInlineMarkdown(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        closeList();
        inList = true;
        listType = 'ol';
        html.push('<ol class="detail-list">');
      }
      html.push(`<li>${renderInlineMarkdown(olMatch[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p class="detail-paragraph">${renderInlineMarkdown(trimmed)}</p>`);
  }

  closeCode();
  closeList();
  return html.join('');
}

function renderInlineMarkdown(text) {
  let output = escapeHtml(String(text || ''));
  output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return output;
}
