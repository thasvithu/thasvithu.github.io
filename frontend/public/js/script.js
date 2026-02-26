const API_BASE = window.PORTFOLIO_API_BASE || 'http://localhost:4000/api';
let allProjects = [];

window.addEventListener('load', function () {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.classList.add('opacity-0');
    setTimeout(function () {
      preloader.style.display = 'none';
    }, 1000);
  }
});

if (window.ityped && document.querySelector('.iTyped')) {
  window.ityped.init(document.querySelector('.iTyped'), {
    strings: [
      'I Build Production-Ready AI Systems',
      'I Design End-to-End ML Pipelines',
      'I Develop RAG Systems & AI Agents',
      'I Architect Scalable FastAPI Services',
      'I Deploy AI with Docker & CI/CD'
    ],
    loop: true
  });
}

initAsideNavigation();
initPortfolioFilter();
initContactForm();
loadProjects();
loadBlogs();

function initPortfolioFilter() {
  const filterContainer = document.querySelector('.portfolio-filter');
  if (!filterContainer) return;

  const filterBtns = Array.from(filterContainer.children);
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', function () {
      const activeBtn = filterContainer.querySelector('.active');
      if (activeBtn) activeBtn.classList.remove('active');
      this.classList.add('active');

      const filterValue = this.getAttribute('data-filter');
      renderProjects(filterValue || 'all');
    });
  });
}

async function loadProjects() {
  const container = document.querySelector('#portfolio-list');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE}/projects`);
    if (!response.ok) throw new Error('Failed to load projects');
    allProjects = await response.json();
    renderProjects('all');
  } catch (error) {
    container.innerHTML = '<div class="padd-15 loading-state">Unable to load projects right now.</div>';
  }
}

function renderProjects(filterValue) {
  const container = document.querySelector('#portfolio-list');
  if (!container) return;

  const filtered = allProjects.filter((project) => {
    if (filterValue === 'all') return true;
    return normalizeCategory(project.category) === filterValue;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="padd-15">No projects in this category yet.</div>';
    return;
  }

  container.innerHTML = filtered
    .map(
      (project) => `
      <div class="portfolio-item padd-15 show" data-category="${escapeHtml(normalizeCategory(project.category))}" data-slug="${encodeURIComponent(project.slug)}">
        <a href="javascript:void(0)" data-slug="${encodeURIComponent(project.slug)}" class="portfolio-item-inner shadow-dark" style="display:block;">
          <div class="portfolio-img">
            <img
              src="${escapeHtml(project.image_url || 'images/projects/rag.png')}"
              alt="${escapeHtml(project.title)}"
              loading="lazy"
              onerror="this.onerror=null;this.src='images/projects/rag.png';">
          </div>
          <div class="portfolio-info">
            <h4>${escapeHtml(project.title)}</h4>
            <div class="icon"><i class="fa fa-external-link-alt"></i></div>
          </div>
        </a>
      </div>
    `
    )
    .join('');

  container.querySelectorAll('.portfolio-item-inner').forEach((node) => {
    node.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const slug = node.getAttribute('data-slug') || '';
      if (!slug) return;
      localStorage.setItem('last_project_slug', slug);
      window.location.href = `project.html?slug=${slug}`;
    });
  });
}

async function loadBlogs() {
  const container = document.querySelector('#blog-list');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE}/blogs`);
    if (!response.ok) throw new Error('Failed to load blogs');

    const blogs = await response.json();

    if (!blogs.length) {
      container.innerHTML = '<div class="padd-15">No blog posts yet.</div>';
      return;
    }

    container.innerHTML = blogs
      .map(
        (blog) => `
      <div class="blog-item padd-15" style="flex: 0 0 100%; max-width: 100%;">
        <a href="javascript:void(0)" data-slug="${encodeURIComponent(blog.slug)}" class="blog-item-inner shadow-dark"
          style="display: flex; align-items: center; text-decoration: none; transition: all 0.3s ease; cursor: pointer; padding: 20px; border-radius: 10px;">
          <div class="blog-content" style="flex: 1; padding-right: 30px;">
            <div class="blog-date"
              style="display: inline-block; padding: 5px 15px; background-color: var(--skin-color); color: #ffffff; border-radius: 5px; font-size: 12px; margin-bottom: 15px;">
              ${escapeHtml(blog.date_label || 'Recent')}
            </div>
            <h4 class="blog-title" style="font-size: 22px; margin-bottom: 12px;">${escapeHtml(blog.title)}</h4>
            <p class="blog-description"
              style="font-size: 15px; line-height: 24px; margin-bottom: 12px;">${escapeHtml(blog.summary || '')}</p>
            <p class="blog-tags" style="font-size: 14px;">Tags: <span
                style="color: var(--skin-color); font-weight: 600;">${escapeHtml((blog.tags || []).join(', '))}</span></p>
          </div>
          <div class="blog-img"
            style="flex: 0 0 250px; max-width: 250px; height: 180px; border-radius: 10px; overflow: hidden;">
            <img src="${escapeHtml(blog.image_url || 'images/blog/responsive-web-design.png')}" alt="${escapeHtml(blog.title)}"
              style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        </a>
      </div>
    `
      )
      .join('');

    container.querySelectorAll('.blog-item-inner').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const slug = node.getAttribute('data-slug') || '';
        if (!slug) return;
        localStorage.setItem('last_blog_slug', slug);
        window.location.href = `blog.html?slug=${slug}`;
      });
    });
  } catch (error) {
    container.innerHTML = '<div class="padd-15 loading-state">Unable to load blog posts right now.</div>';
  }
}

function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const submitBtn = form.querySelector('button[type="submit"]');
  const defaultBtnText = submitBtn ? submitBtn.textContent : 'Send Message';
  const captchaInput = form.querySelector('#captcha-token');
  const turnstileSiteKey = window.PORTFOLIO_TURNSTILE_SITE_KEY || '';

  initTurnstileWidget(turnstileSiteKey, captchaInput);

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      subject: String(formData.get('subject') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      captcha_token: String(formData.get('captcha_token') || '').trim()
    };

    if (turnstileSiteKey && !payload.captcha_token) {
      showContactToast('Please verify captcha before sending.', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
      submitBtn.textContent = 'Sending...';
    }

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      form.reset();
      if (turnstileSiteKey && window.turnstile && typeof window.turnstile.reset === 'function') {
        window.turnstile.reset();
        if (captchaInput) captchaInput.value = '';
      }
      if (result.emailSent === true) {
        showContactToast('Message sent successfully.', 'success');
      } else {
        showContactToast(`Saved, but email was not delivered (${result.emailInfo || 'mail not configured'}).`, 'error');
      }
    } catch (error) {
      showContactToast(error.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        submitBtn.textContent = defaultBtnText;
      }
    }
  });
}

function initTurnstileWidget(siteKey, captchaInput) {
  const widget = document.querySelector('#turnstile-widget');
  if (!widget) return;
  if (!siteKey) {
    widget.innerHTML = '';
    return;
  }

  const render = () => {
    if (!window.turnstile || typeof window.turnstile.render !== 'function') return false;
    if (widget.getAttribute('data-rendered') === 'true') return true;

    window.turnstile.render(widget, {
      sitekey: siteKey,
      callback(token) {
        if (captchaInput) captchaInput.value = token;
      },
      'expired-callback'() {
        if (captchaInput) captchaInput.value = '';
      },
      'error-callback'() {
        if (captchaInput) captchaInput.value = '';
      }
    });
    widget.setAttribute('data-rendered', 'true');
    return true;
  };

  if (!render()) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (render() || attempts > 40) {
        clearInterval(interval);
      }
    }, 250);
  }
}

function showContactToast(message, type = 'success') {
  let toast = document.querySelector('#contact-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'contact-toast';
    toast.className = 'contact-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = String(message || '');
  toast.classList.remove('success', 'error', 'show');
  toast.classList.add(type === 'error' ? 'error' : 'success');
  // Restart animation on repeated messages.
  void toast.offsetWidth;
  toast.classList.add('show');

  clearTimeout(window.__contactToastTimer);
  window.__contactToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

function initAsideNavigation() {
  const nav = document.querySelector('.nav');
  const sections = document.querySelectorAll('.section');
  if (!nav || !sections.length) return;

  const navList = nav.querySelectorAll('li');
  const navTogglerBtn = document.querySelector('.nav-toggler');
  const aside = document.querySelector('.aside');

  navList.forEach((item, i) => {
    const a = item.querySelector('a');
    a.addEventListener('click', function () {
      removeBackSectionClass();

      navList.forEach((node, j) => {
        if (node.querySelector('a').classList.contains('active')) {
          addBackSectionClass(j);
        }
        node.querySelector('a').classList.remove('active');
      });

      this.classList.add('active');
      showSection(this);

      if (window.innerWidth < 1200) {
        asideSectionTogglerBtn();
      }
    });
  });

  function addBackSectionClass(num) {
    sections[num].classList.add('back-section');
  }

  function removeBackSectionClass() {
    sections.forEach((section) => section.classList.remove('back-section'));
  }

  function showSection(element) {
    sections.forEach((section) => section.classList.remove('active'));
    const target = element.getAttribute('href').split('#')[1];
    const targetNode = document.querySelector(`#${target}`);
    if (targetNode) targetNode.classList.add('active');
  }

  function updateNav(element) {
    navList.forEach((node) => {
      node.querySelector('a').classList.remove('active');
      const target = element.getAttribute('href').split('#')[1];
      if (target === node.querySelector('a').getAttribute('href').split('#')[1]) {
        node.querySelector('a').classList.add('active');
      }
    });
  }

  const hireMe = document.querySelector('.hire-me');
  if (hireMe) {
    hireMe.addEventListener('click', function () {
      const sectionIndex = this.getAttribute('data-section-index');
      addBackSectionClass(Number(sectionIndex));
      showSection(this);
      updateNav(this);
      removeBackSectionClass();
    });
  }

  if (navTogglerBtn && aside) {
    navTogglerBtn.addEventListener('click', asideSectionTogglerBtn);
  }

  // Keep section state in sync with URL hash on initial load and refresh.
  applyHashRoute();
  window.addEventListener('hashchange', applyHashRoute);

  function asideSectionTogglerBtn() {
    aside.classList.toggle('open');
    navTogglerBtn.classList.toggle('open');
    sections.forEach((section) => section.classList.toggle('open'));
  }

  function applyHashRoute() {
    const hash = (window.location.hash || '#home').replace('#', '');
    const targetNode = document.querySelector(`#${hash}`);
    if (!targetNode) return;

    sections.forEach((section) => section.classList.remove('active'));
    targetNode.classList.add('active');

    navList.forEach((node) => {
      const link = node.querySelector('a');
      const target = (link.getAttribute('href') || '').replace('#', '');
      link.classList.toggle('active', target === hash);
    });
  }
}

function normalizeCategory(category) {
  return String(category || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
