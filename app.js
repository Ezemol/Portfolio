/**
 * ═══════════════════════════════════════════════════════════════
 *  app.js — Portfolio SPA Logic
 *  Author : Ezequiel Molina
 *  Version: 1.0.0
 *
 *  Responsibilities:
 *    1. SPA tab-switching (Home / Portfolio / Blog / Contact)
 *    2. Mobile menu toggle
 *    3. fetch() projects.json  → render project cards into #projects-grid
 *    4. fetch() posts.json     → render blog rows into #blog-list
 *    5. YouTube URL → embed URL conversion
 *    6. Fallback UI when video_url is missing
 *    7. Filter pill visual state (v2.0 active logic placeholder)
 *    8. Contact form UI feedback
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   UTILITY: YouTube URL → Embed URL parser
   Handles both:
     • https://www.youtube.com/watch?v=VIDEO_ID
     • https://youtu.be/VIDEO_ID
   Returns the /embed/VIDEO_ID string, or null if no ID found.
───────────────────────────────────────────────────────────── */
function parseYouTubeEmbed(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') return null;

  try {
    const url = new URL(rawUrl.trim());

    // Standard watch URL: youtube.com/watch?v=ID
    if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
      return `https://www.youtube.com/embed/${url.searchParams.get('v')}`;
    }

    // Shortened URL: youtu.be/ID
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1); // remove leading "/"
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    // Already an embed URL — return as-is
    if (url.hostname.includes('youtube.com') && url.pathname.startsWith('/embed/')) {
      return rawUrl.trim();
    }
  } catch {
    // If URL parsing fails, return null to trigger the fallback
    return null;
  }

  return null;
}

/* ─────────────────────────────────────────────────────────────
   UTILITY: Get badge color classes per project label
───────────────────────────────────────────────────────────── */
function getLabelClasses(label) {
  const map = {
    'Production':       'bg-emerald-950/40 text-emerald-400 border-emerald-900/50',
    'Producción':       'bg-emerald-950/40 text-emerald-400 border-emerald-900/50',
    'MVP':              'bg-amber-950/40 text-amber-400 border-amber-900/50',
    'Personal Project': 'bg-indigo-950/40 text-indigo-400 border-indigo-900/50',
    'Proyecto Personal':'bg-indigo-950/40 text-indigo-400 border-indigo-900/50',
  };
  return map[label] || 'bg-slate-900 text-slate-400 border-slate-800';
}

/* ─────────────────────────────────────────────────────────────
   RENDERER: Build a single project card HTML string
   Includes:
     • h3 title + status label badge
     • 16:9 responsive iframe OR "Demo coming soon" placeholder
     • Description
     • Tech stack badges
     • "Watch Demo" button → opens raw video_url in new tab
   ───────────────────────────────────────────────────────────── */
function buildProjectCard(project) {
  const { title, label, description, video_url, preview_video, tags = [] } = project;

  const embedUrl   = parseYouTubeEmbed(video_url);
  const labelClass = getLabelClasses(label);

  const soonText = currentLanguage === 'es' ? 'Demo muy pronto' : 'Demo coming soon';
  const isYouTube = !!embedUrl;
  const btnText = isYouTube
    ? (currentLanguage === 'es' ? 'Ver Demo' : 'Watch Demo')
    : (currentLanguage === 'es' ? 'Visitar Sitio' : 'Visit Site');

  const btnIcon = isYouTube
    ? `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/>
       </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
       </svg>`;

  // ── Video / Placeholder block ──────────────────────────────
  let mediaBlock;
  if (preview_video) {
    // Responsive local video autoplaying preview loop
    mediaBlock = `
      <div class="relative w-full aspect-video bg-black overflow-hidden">
        <video
          class="absolute inset-0 w-full h-full object-cover"
          src="${preview_video}"
          autoplay
          loop
          muted
          playsinline>
        </video>
      </div>`;
  } else if (embedUrl) {
    // Responsive 16:9 iframe fallback
    mediaBlock = `
      <div class="relative w-full aspect-video bg-black overflow-hidden">
        <iframe
          class="absolute inset-0 w-full h-full"
          src="${embedUrl}"
          title="${title} — Demo Video"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          loading="lazy">
        </iframe>
      </div>`;
  } else {
    // Animated gradient placeholder with icon
    mediaBlock = `
      <div class="demo-placeholder relative w-full aspect-video flex flex-col items-center justify-center gap-3 select-none" aria-label="${soonText}">
        <div class="w-14 h-14 rounded-full bg-slate-950/60 backdrop-blur-sm flex items-center justify-center shadow-md border border-slate-800">
          <!-- Play icon -->
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <span class="text-xs font-semibold text-slate-400 bg-slate-950/60 backdrop-blur-sm px-3.5 py-1 rounded-full shadow-sm border border-slate-800">${soonText}</span>
      </div>`;
  }

  // ── Tech badges ────────────────────────────────────────────
  const tagsHtml = tags.map(tag =>
    `<span class="tech-badge px-2.5 py-1 text-[11px] font-semibold bg-slate-950 text-slate-400 rounded-lg border border-slate-800/80 cursor-default hover:bg-blue-950 hover:text-blue-400 hover:border-blue-900/50 transition-all duration-200">${tag}</span>`
  ).join('');

  // ── Action Button (either Visit Site or Watch Demo) ─────────
  const watchDemoBtn = video_url
    ? `<a
        href="${video_url}"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-semibold px-8 py-2.5 rounded-xl shadow-md hover:shadow-blue-100 hover:shadow-lg transition-all duration-200"
        aria-label="${btnText} ${title}">
        ${btnIcon}
        ${btnText}
      </a>`
    : `<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 px-8 py-2.5 rounded-xl border border-slate-800 bg-slate-950 cursor-default">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        ${soonText}
      </span>`;

  // ── Final card HTML ────────────────────────────────────────
  return `
    <article class="card-hover bg-slate-900 rounded-3xl border border-slate-800/80 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:shadow-blue-950/10 transition-all duration-300" data-label="${label}">
      ${mediaBlock}
      <div class="p-6 flex flex-col gap-4 flex-1">

        <!-- Title + Status badge -->
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-base font-bold text-slate-100 leading-snug tracking-tight">${title}</h3>
          <span class="flex-shrink-0 text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full border ${labelClass}">${label}</span>
        </div>

        <!-- Description -->
        <p class="text-sm text-slate-400 leading-relaxed flex-1">${description}</p>

        <!-- Tech stack badges -->
        <div class="flex flex-wrap gap-1.5" aria-label="Technologies used">
          ${tagsHtml}
        </div>

        <!-- Watch Demo button -->
        <div class="flex items-center pt-2 border-t border-slate-800 mt-2">
          ${watchDemoBtn}
        </div>
      </div>
    </article>`;
}

/* ─────────────────────────────────────────────────────────────
   RENDERER: Build a single blog post row HTML string
   ───────────────────────────────────────────────────────────── */
function buildBlogRow(post) {
  const { date, reading_time, title, introduction, slug, category } = post;

  const readArticleText = currentLanguage === 'es' ? 'Leer artículo' : 'Read article';

  return `
    <article class="blog-row py-6 rounded-xl px-3 -mx-3 cursor-pointer group" data-slug="${slug || ''}" data-category="${category || ''}" aria-label="Blog post: ${title}">
      <div class="flex flex-col gap-2">
        <!-- Meta: date + reading time -->
        <div class="flex items-center gap-3">
          <time class="text-xs font-medium text-slate-500" datetime="${date}">${date}</time>
          <span class="text-slate-800 text-xs" aria-hidden="true">•</span>
          <span class="text-xs font-medium text-blue-400">${reading_time}</span>
        </div>

        <!-- Post title -->
        <h3 class="text-base md:text-lg font-bold text-slate-100 leading-snug group-hover:text-blue-400 transition-colors duration-200">
          ${title}
        </h3>

        <!-- 2-line introduction -->
        <p class="text-sm text-slate-400 leading-relaxed line-clamp-2">${introduction}</p>

        <!-- Read more link -->
        <span class="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 mt-1 group-hover:gap-2 transition-all duration-200">
          ${readArticleText}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </span>
      </div>
    </article>`;
}

/* ─────────────────────────────────────────────────────────────
   FETCH & RENDER: Projects
   Replaces skeleton loaders with real cards.
   ───────────────────────────────────────────────────────────── */
async function loadProjects() {
  const container = document.getElementById('projects-grid');
  if (!container) return;

  try {
    const response = await fetch('./projects.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const allProjects = await response.json();
    // Filter projects dynamically based on the current language
    const projects = allProjects.filter(p => p.lang === currentLanguage);

    // Clear skeleton loaders
    container.innerHTML = '';

    if (!Array.isArray(projects) || projects.length === 0) {
      const noProjectsText = currentLanguage === 'es'
        ? 'No se encontraron proyectos. ¡Añade algunos a projects.json!'
        : 'No projects found. Add some to projects.json!';
      container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
          <p class="text-slate-400 text-sm">${noProjectsText}</p>
        </div>`;
      return;
    }

    // Render each project card
    projects.forEach(project => {
      container.insertAdjacentHTML('beforeend', buildProjectCard(project));
    });

    // Append empty state placeholder (initially hidden)
    const emptyProjectsText = currentLanguage === 'es'
      ? '¡Próximamente más proyectos en esta categoría!'
      : 'More projects in this category coming soon!';
    container.insertAdjacentHTML('beforeend', `
      <div id="projects-empty-message" class="col-span-full hidden flex-col items-center justify-center py-20 text-center select-none animate-fade-in">
        <p class="text-slate-400 text-sm font-medium">${emptyProjectsText}</p>
      </div>
    `);

  } catch (err) {
    console.error('[Portfolio] Failed to load projects.json:', err);
    const errorTitle = currentLanguage === 'es' ? 'No se pudieron cargar los proyectos.' : "Couldn't load projects.";
    const errorDesc = currentLanguage === 'es'
      ? "Asegúrate de estar sirviendo el sitio mediante un servidor local (y no abriendo el index.html directamente) para que las solicitudes fetch() funcionen."
      : "Make sure you're serving the site via a local server (not opening index.html directly) so that fetch() requests work correctly.";
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-20 text-center gap-3">
        <div class="w-12 h-12 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.27 16A2 2 0 005.07 19z"/>
          </svg>
        </div>
        <p class="text-slate-400 text-sm font-medium">${errorTitle}</p>
        <p class="text-slate-500 text-xs max-w-xs">${errorDesc}</p>
      </div>`;
  }
}

/* ─────────────────────────────────────────────────────────────
   FETCH & RENDER: Blog Posts
   Replaces skeleton loaders with real rows.
   ───────────────────────────────────────────────────────────── */
async function loadPosts() {
  const container = document.getElementById('blog-list');
  if (!container) return;

  try {
    const response = await fetch('./posts.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const allPosts = await response.json();
    // Filter posts dynamically based on current language
    const posts = allPosts.filter(p => p.lang === currentLanguage);

    // Clear skeleton loaders
    container.innerHTML = '';

    if (!Array.isArray(posts) || posts.length === 0) {
      const noPostsText = currentLanguage === 'es'
        ? 'No se encontraron artículos. ¡Añade algunos a posts.json!'
        : 'No blog posts found. Add some to posts.json!';
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <p class="text-slate-400 text-sm">${noPostsText}</p>
        </div>`;
      return;
    }

    // Render each blog row
    posts.forEach(post => {
      container.insertAdjacentHTML('beforeend', buildBlogRow(post));
    });

    // Append empty state placeholder (initially hidden)
    const emptyPostsText = currentLanguage === 'es'
      ? '¡Próximamente más artículos en esta categoría!'
      : 'More articles in this category coming soon!';
    container.insertAdjacentHTML('beforeend', `
      <div id="blog-empty-message" class="hidden flex-col items-center justify-center py-20 text-center select-none w-full animate-fade-in">
        <p class="text-slate-400 text-sm font-medium">${emptyPostsText}</p>
      </div>
    `);

  } catch (err) {
    console.error('[Portfolio] Failed to load posts.json:', err);
    const errorTitle = currentLanguage === 'es' ? 'No se pudieron cargar los artículos.' : "Couldn't load blog posts.";
    const errorDesc = currentLanguage === 'es'
      ? "Asegúrate de estar sirviendo el sitio mediante un servidor local (y no abriendo el index.html directamente) para que las solicitudes fetch() funcionen."
      : "Make sure you're serving the site via a local server (not opening index.html directly) so that fetch() requests work correctly.";
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20 text-center gap-3">
        <div class="w-12 h-12 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.27 16A2 2 0 005.07 19z"/>
          </svg>
        </div>
        <p class="text-slate-400 text-sm font-medium">${errorTitle}</p>
        <p class="text-slate-500 text-xs max-w-xs">${errorDesc}</p>
      </div>`;
  }
}


/* ─────────────────────────────────────────────────────────────
   SPA: Tab Switching
   Shows one section at a time, updates nav button active state,
   and triggers a smooth slide-up entrance animation.
───────────────────────────────────────────────────────────── */

let activePostSlug = null;

/**
 * All section IDs and their matching nav button IDs.
 * Order here determines tab iteration order.
 */
const SECTIONS = [
  { id: 'home',      sectionEl: 'section-home',      navBtnId: 'nav-home' },
  { id: 'portfolio', sectionEl: 'section-portfolio',  navBtnId: 'nav-portfolio' },
  { id: 'blog',      sectionEl: 'section-blog',       navBtnId: 'nav-blog' },
  { id: 'contact',   sectionEl: 'section-contact',    navBtnId: 'nav-contact' },
];

/**
 * Switch the visible section.
 * @param {string} targetId - One of 'home' | 'portfolio' | 'blog' | 'contact'
 */
function switchSection(targetId) {
  // Clear active post slug since we are switching to a main tab
  activePostSlug = null;

  // Hide detail section
  const detailSection = document.getElementById('section-post-detail');
  if (detailSection) {
    detailSection.classList.add('hidden');
    detailSection.classList.remove('section-enter');
  }

  // Reset filters to "All" when switching sections
  const activeProjPill = document.querySelector('.filter-pill.active-pill');
  if (activeProjPill && activeProjPill.dataset.filter !== 'all') {
    document.querySelectorAll('.filter-pill').forEach(p => {
      if (p.dataset.filter === 'all') p.classList.add('active-pill');
      else p.classList.remove('active-pill');
    });
    document.querySelectorAll('#projects-grid .card-hover').forEach(c => c.classList.remove('hidden'));
  }

  const activeBlogPill = document.querySelector('.blog-filter-pill.active-pill');
  if (activeBlogPill && activeBlogPill.dataset.filter !== 'all') {
    document.querySelectorAll('.blog-filter-pill').forEach(p => {
      if (p.dataset.filter === 'all') p.classList.add('active-pill');
      else p.classList.remove('active-pill');
    });
    document.querySelectorAll('#blog-list .blog-row').forEach(r => r.classList.remove('hidden'));
  }

  SECTIONS.forEach(({ id, sectionEl, navBtnId }) => {
    const section = document.getElementById(sectionEl);
    const navBtn  = document.getElementById(navBtnId);

    if (id === targetId) {
      // Show target section
      section.classList.remove('hidden');
      // Restart entrance animation
      section.classList.remove('section-enter');
      void section.offsetWidth; // trigger reflow
      section.classList.add('section-enter');

      // Mark nav button active
      if (navBtn) navBtn.classList.add('active');

      // Scroll to top on section change
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } else {
      // Hide all other sections
      section.classList.add('hidden');
      section.classList.remove('section-enter');

      // Remove active state from other nav buttons
      if (navBtn) navBtn.classList.remove('active');
    }
  });

  // Close mobile menu after navigation
  closeMobileMenu();
}

/**
 * Show details of a specific blog post.
 * @param {string} slug - The slug of the post to view
 */
async function showPostDetail(slug) {
  activePostSlug = slug;

  try {
    const response = await fetch('./posts.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const allPosts = await response.json();
    const post = allPosts.find(p => p.slug === slug && p.lang === currentLanguage);

    if (!post) {
      console.error(`[Blog] Post not found for slug: ${slug} and lang: ${currentLanguage}`);
      switchSection('blog');
      return;
    }

    // Populate elements
    document.getElementById('post-detail-title').textContent = post.title;
    document.getElementById('post-detail-date').textContent = post.date;
    document.getElementById('post-detail-reading-time').textContent = post.reading_time;
    
    const categoryEl = document.getElementById('post-detail-category');
    if (categoryEl) {
      categoryEl.textContent = post.category || (currentLanguage === 'es' ? 'Opinión' : 'Opinion');
    }

    const contentEl = document.getElementById('post-detail-content');
    if (contentEl) {
      contentEl.innerHTML = post.content || '';
    }

    // Hide all main sections
    SECTIONS.forEach(({ sectionEl, navBtnId }) => {
      const section = document.getElementById(sectionEl);
      const navBtn  = document.getElementById(navBtnId);
      if (section) section.classList.add('hidden');
      if (navBtn) navBtn.classList.remove('active');
    });

    // Mark Blog nav button as active
    const blogNavBtn = document.getElementById('nav-blog');
    if (blogNavBtn) blogNavBtn.classList.add('active');

    // Show detail section
    const detailSection = document.getElementById('section-post-detail');
    if (detailSection) {
      detailSection.classList.remove('hidden');
      // Slide up entrance animation
      detailSection.classList.remove('section-enter');
      void detailSection.offsetWidth; // trigger reflow
      detailSection.classList.add('section-enter');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    console.error('[Blog] Failed to load post details:', err);
    switchSection('blog');
  }
}

/* ─────────────────────────────────────────────────────────────
   MOBILE MENU: Toggle & Close
───────────────────────────────────────────────────────────── */
let mobileMenuOpen = false;

function openMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const hamburger = document.getElementById('hamburger-btn');
  menu.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  mobileMenuOpen = true;
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const hamburger = document.getElementById('hamburger-btn');
  menu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  mobileMenuOpen = false;
}

function toggleMobileMenu() {
  mobileMenuOpen ? closeMobileMenu() : openMobileMenu();
}

/* ─────────────────────────────────────────────────────────────
   CONTACT FORM: UI Feedback
   Shows a success state on submit (no real backend in v1).
───────────────────────────────────────────────────────────── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  // ═══════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE EMAILJS
  // Reemplaza estos valores con tus credenciales de EmailJS:
  // ═══════════════════════════════════════════════════════════
  const EMAILJS_SERVICE_ID  = 'service_71bakw6';
  const EMAILJS_TEMPLATE_ID = 'template_6cz5hgb';
  const EMAILJS_PUBLIC_KEY  = 'TOQWlAirWBQxuC0x7';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('btn-send-message');
    const originalContent = btn.innerHTML;

    // Obtener respuesta de reCAPTCHA
    const recaptchaToken = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : '';
    if (!recaptchaToken) {
      const captchaAlert = currentLanguage === 'es'
        ? 'Por favor, completa la verificación "No soy un robot".'
        : 'Please complete the "I\'m not a robot" verification.';
      alert(captchaAlert);
      return;
    }

    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const messageInput = document.getElementById('contact-message');

    const name = nameInput ? nameInput.value : '';
    const email = emailInput ? emailInput.value : '';
    const message = messageInput ? messageInput.value : '';

    btn.disabled = true;
    const sendingText = currentLanguage === 'es' ? 'Enviando...' : 'Sending...';
    btn.innerHTML = `
      <svg class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      ${sendingText}`;

    // Si aún no se han configurado las claves reales, simulamos el envío para pruebas locales
    if (EMAILJS_SERVICE_ID.startsWith('YOUR_') || EMAILJS_TEMPLATE_ID.startsWith('YOUR_') || EMAILJS_PUBLIC_KEY.startsWith('YOUR_')) {
      console.warn('[EmailJS] Usando modo de simulación. Por favor configura tus credenciales reales de EmailJS en app.js');
      setTimeout(() => {
        showSuccessMessage();
      }, 1500);
      return;
    }

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            from_name: name,
            reply_to: email,
            message: message,
            "g-recaptcha-response": recaptchaToken
          }
        })
      });

      if (response.ok) {
        showSuccessMessage();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Error sending message through EmailJS');
      }
    } catch (error) {
      console.error('[EmailJS] Error al enviar el correo:', error);
      btn.disabled = false;
      btn.innerHTML = originalContent;
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.reset();
      }
      const errorAlert = currentLanguage === 'es'
        ? 'No se pudo enviar el mensaje. Por favor intenta de nuevo.'
        : 'Failed to send message. Please try again.';
      alert(errorAlert);
    }

    function showSuccessMessage() {
      const successTitle = currentLanguage === 'es' ? '¡Mensaje enviado!' : 'Message sent!';
      const successDesc = currentLanguage === 'es'
        ? 'Gracias por contactarme. Te responderé dentro de las próximas 24 horas.'
        : 'Thanks for reaching out. I\'ll get back to you within 24 hours.';

      form.innerHTML = `
        <div class="flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div class="w-14 h-14 rounded-full bg-green-950/20 border border-green-900/40 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <p class="text-base font-bold text-slate-100">${successTitle}</p>
            <p class="text-sm text-slate-400 mt-1">${successDesc}</p>
          </div>
        </div>`;
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   FILTER PILLS: Visual state toggle (active filtering in v2.0)
───────────────────────────────────────────────────────────── */
function initFilterPills() {
  const pills = document.querySelectorAll('.filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      // Remove active state from all pills
      pills.forEach(p => p.classList.remove('active-pill'));
      // Set active on clicked pill
      pill.classList.add('active-pill');

      const filterValue = pill.dataset.filter;
      const projects = document.querySelectorAll('#projects-grid .card-hover');
      let visibleCount = 0;

      projects.forEach(project => {
        const label = project.dataset.label;
        let isVisible = false;
        if (filterValue === 'all') {
          isVisible = true;
        } else if (filterValue === 'production' && (label === 'Production' || label === 'Producción')) {
          isVisible = true;
        } else if (filterValue === 'mvp' && label === 'MVP') {
          isVisible = true;
        } else if (filterValue === 'personal' && (label === 'Personal Project' || label === 'Proyecto Personal')) {
          isVisible = true;
        }

        if (isVisible) {
          project.classList.remove('hidden');
          visibleCount++;
        } else {
          project.classList.add('hidden');
        }
      });

      const emptyMsg = document.getElementById('projects-empty-message');
      if (emptyMsg) {
        if (visibleCount === 0) {
          emptyMsg.classList.remove('hidden');
          emptyMsg.classList.add('flex');
        } else {
          emptyMsg.classList.add('hidden');
          emptyMsg.classList.remove('flex');
        }
      }
    });
  });
}

function initBlogFilterPills() {
  const pills = document.querySelectorAll('.blog-filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      // Remove active state from all pills
      pills.forEach(p => p.classList.remove('active-pill'));
      // Set active on clicked pill
      pill.classList.add('active-pill');

      const filterValue = pill.dataset.filter;
      const posts = document.querySelectorAll('#blog-list .blog-row');
      let visibleCount = 0;

      posts.forEach(post => {
        const category = post.dataset.category;
        let isVisible = false;
        if (filterValue === 'all') {
          isVisible = true;
        } else if (filterValue === 'opinion' && (category === 'Opinion' || category === 'Opinión')) {
          isVisible = true;
        } else if (filterValue === 'personal' && category === 'Personal') {
          isVisible = true;
        } else if (filterValue === 'engineering' && (category === 'Engineering' || category === 'Ingeniería')) {
          isVisible = true;
        } else if (filterValue === 'freelance' && category === 'Freelance') {
          isVisible = true;
        }

        if (isVisible) {
          post.classList.remove('hidden');
          visibleCount++;
        } else {
          post.classList.add('hidden');
        }
      });

      const emptyMsg = document.getElementById('blog-empty-message');
      if (emptyMsg) {
        if (visibleCount === 0) {
          emptyMsg.classList.remove('hidden');
          emptyMsg.classList.add('flex');
        } else {
          emptyMsg.classList.add('hidden');
          emptyMsg.classList.remove('flex');
        }
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   LOCALIZATION & TRANSLATIONS
───────────────────────────────────────────────────────────── */
let currentLanguage = localStorage.getItem('portfolio-lang') || 'es';

const TRANSLATIONS = {
  es: {
    "nav-home": "Inicio",
    "nav-portfolio": "Proyectos",
    "nav-blog": "Blog",
    "nav-contact": "Contacto",
    "greeting-available": "Disponible para freelance",
    "hero-title-first": "Ezequiel",
    "hero-title-last": "Molina",
    "hero-bio-lead": "Desarrollador Full-Stack especializado en",
    "hero-bio-sub": "Construyo APIs escalables, aplicaciones web modernas y herramientas basadas en datos — desde la idea hasta la producción.",
    "btn-download-cv": "Descargar CV",
    "btn-contact-me": "Contáctame",
    "tech-strip-title": "Tecnologías con las que trabajo",
    "section-projects-title": "Proyectos",
    "section-projects-subtitle": "Una selección de las cosas que he construido — aplicaciones en producción, MVPs y exploraciones personales.",
    "filter-all": "Todos",
    "filter-production": "Producción",
    "filter-mvp": "MVP",
    "filter-personal": "Personal",
    "section-blog-title": "Blog",
    "section-blog-subtitle": "Reflexiones sobre ingeniería de software, trabajo freelance y construcción de productos en la web.",
    "section-contact-title": "Trabajemos juntos",
    "section-contact-subtitle": "¿Tienes un proyecto en mente? Estoy abierto a trabajos independientes y colaboraciones. Envíame un mensaje y te responderé en un plazo de 24 horas.",
    "contact-label-name": "Nombre",
    "contact-placeholder-name": "Tu nombre completo",
    "contact-label-email": "Correo electrónico",
    "contact-placeholder-email": "tu@correo.com",
    "contact-label-message": "Mensaje",
    "contact-placeholder-message": "Describe tu proyecto o idea...",
    "btn-send-message": "Enviar Mensaje",
    "contact-card-email": "Correo electrónico",
    "contact-card-location": "Ubicación",
    "contact-card-availability": "Disponibilidad",
    "availability-status": "Abierto a nuevos proyectos",
    "back-to-blogs": "Volver al Blog",
    "filter-opinion": "Opinión",
    "filter-personal-cat": "Personal",
    "filter-engineering": "Ingeniería",
    "filter-freelance": "Freelance",
    "about-title": "Sobre mí",
    "about-subtitle": "Una mirada a mi trayectoria, estudios e intereses personales.",
    "about-edu-title": "Estudios",
    "about-edu-degree": "Ingeniería en Sistemas de Información",
    "about-edu-school": "UTN FRC — Promedio de 1° año: 8.78",
    "about-edu-desc": "Finalicé el primer año de la carrera con un promedio de 8.78. El cursar materias tan rigurosas me ha brindado una gran capacidad de razonamiento lógico, resolución de problemas y una fuerte disciplina.",
    "about-lang-title": "Idiomas",
    "about-lang-es": "Español",
    "about-lang-level-native": "Nativo",
    "about-lang-en": "Inglés",
    "about-lang-level-bilingual": "Bilingüe",
    "about-lang-pt": "Portugués",
    "about-lang-level-conversational": "Intermedio / Avanzado",
    "about-hobbies-title": "Hobbies e Intereses",
    "about-hobbies-desc": "En mis tiempos libres disfruto mucho de la lectura, tanto de libros de entretenimiento como de desarrollo personal, negocios e investigación. También, una de mis prioridades es entrenar calistenia diariamente. En cuanto a mis hobbies, toco la guitarra, me apasionan los juegos de lógica (como el ajedrez y el sudoku, entre otros) y disfruto ir al lago a hacer windsurf. Además, formo parte del coro de la iglesia de mi pueblo, aportando mi grano de arena para hacer la voluntad de Dios.",
    "hobby-reading": "📚 Leer",
    "hobby-calisthenics": "💪 Calistenia",
    "hobby-guitar": "🎸 Guitarra",
    "hobby-chess": "♟️ Ajedrez",
    "hobby-windsurf": "🏄‍♂️ Windsurf",
  },
  en: {
    "nav-home": "Home",
    "nav-portfolio": "Projects",
    "nav-blog": "Blog",
    "nav-contact": "Contact",
    "greeting-available": "Available for freelance",
    "hero-title-first": "Ezequiel",
    "hero-title-last": "Molina",
    "hero-bio-lead": "Full-Stack Developer specializing in",
    "hero-bio-sub": "I build scalable APIs, modern web apps, and data-driven tools — from idea to production.",
    "btn-download-cv": "Download CV",
    "btn-contact-me": "Contact Me",
    "tech-strip-title": "Technologies I work with",
    "section-projects-title": "Projects",
    "section-projects-subtitle": "A selection of things I've built — production apps, MVPs, and personal explorations.",
    "filter-all": "All",
    "filter-production": "Production",
    "filter-mvp": "MVP",
    "filter-personal": "Personal",
    "section-blog-title": "Blog",
    "section-blog-subtitle": "Thoughts on software engineering, freelancing, and building things on the web.",
    "section-contact-title": "Let's Work Together",
    "section-contact-subtitle": "Have a project in mind? I'm open to freelance work and collaborations. Send me a message and I'll get back to you within 24 hours.",
    "contact-label-name": "Name",
    "contact-placeholder-name": "Your full name",
    "contact-label-email": "Email",
    "contact-placeholder-email": "your@email.com",
    "contact-label-message": "Message",
    "contact-placeholder-message": "Describe your project or idea...",
    "btn-send-message": "Send Message",
    "contact-card-email": "Email",
    "contact-card-location": "Location",
    "contact-card-availability": "Availability",
    "availability-status": "Open to new projects",
    "back-to-blogs": "Back to Blogs",
    "filter-opinion": "Opinion",
    "filter-personal-cat": "Personal",
    "filter-engineering": "Engineering",
    "filter-freelance": "Freelance",
    "about-title": "About Me",
    "about-subtitle": "A look at my background, studies, and personal interests.",
    "about-edu-title": "Education",
    "about-edu-degree": "Information Systems Engineering",
    "about-edu-school": "UTN FRC — First Year GPA: 8.78",
    "about-edu-desc": "Completed the first year of my degree with a GPA of 8.78. Managing rigorous coursework has built strong analytical thinking, problem-solving skills, and deep engineering discipline.",
    "about-lang-title": "Languages",
    "about-lang-es": "Spanish",
    "about-lang-level-native": "Native",
    "about-lang-en": "English",
    "about-lang-level-bilingual": "Bilingual",
    "about-lang-pt": "Portuguese",
    "about-lang-level-conversational": "Intermediate / Advanced",
    "about-hobbies-title": "Hobbies & Interests",
    "about-hobbies-desc": "In my free time, I really enjoy reading, including entertainment, personal development, business, and research books. Training calisthenics daily is also one of my top priorities. As for my hobbies, I play the guitar, love logic games (such as chess and sudoku, among others), and enjoy going to the lake to go windsurfing. I also belong to my town's church choir, doing my part to serve and do God's will.",
    "hobby-reading": "📚 Reading",
    "hobby-calisthenics": "💪 Calisthenics",
    "hobby-guitar": "🎸 Guitar",
    "hobby-chess": "♟️ Chess",
    "hobby-windsurf": "🏄‍♂️ Windsurfing",
  }
};

function translatePage() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = TRANSLATIONS[currentLanguage][key];
      } else {
        el.textContent = TRANSLATIONS[currentLanguage][key];
      }
    }
  });

  // Update language selector active style
  const esBtns = [document.getElementById('lang-es-btn'), document.getElementById('mobile-lang-es-btn')];
  const enBtns = [document.getElementById('lang-en-btn'), document.getElementById('mobile-lang-en-btn')];

  esBtns.forEach(btn => {
    if (!btn) return;
    if (currentLanguage === 'es') {
      btn.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white transition-all duration-200 shadow-sm";
    } else {
      btn.className = "text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-400 hover:text-slate-100 transition-all duration-200";
    }
  });

  enBtns.forEach(btn => {
    if (!btn) return;
    if (currentLanguage === 'en') {
      btn.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white transition-all duration-200 shadow-sm";
    } else {
      btn.className = "text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-400 hover:text-slate-100 transition-all duration-200";
    }
  });

  // Update Languages highlight based on active language
  const langEsEl = document.getElementById('lang-name-es');
  const langEnEl = document.getElementById('lang-name-en');
  if (langEsEl && langEnEl) {
    if (currentLanguage === 'es') {
      langEsEl.className = "font-semibold text-blue-400 transition-colors duration-200";
      langEnEl.className = "font-semibold text-slate-200 transition-colors duration-200";
    } else {
      langEsEl.className = "font-semibold text-slate-200 transition-colors duration-200";
      langEnEl.className = "font-semibold text-blue-400 transition-colors duration-200";
    }
  }
}

function changeLanguage(lang) {
  if (lang === currentLanguage) return;
  currentLanguage = lang;
  localStorage.setItem('portfolio-lang', lang);

  // Reset filter pills to default "All" before loading translated lists
  document.querySelectorAll('.filter-pill, .blog-filter-pill').forEach(p => {
    if (p.dataset.filter === 'all') p.classList.add('active-pill');
    else p.classList.remove('active-pill');
  });

  translatePage();
  loadProjects();
  loadPosts();

  // If viewing a post, reload the post details in the new language
  if (activePostSlug) {
    showPostDetail(activePostSlug);
  }
}

/* ─────────────────────────────────────────────────────────────
   INIT: Wire up all event listeners and kick off data loading
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  const esBtn = document.getElementById('lang-es-btn');
  const enBtn = document.getElementById('lang-en-btn');
  const mobileEsBtn = document.getElementById('mobile-lang-es-btn');
  const mobileEnBtn = document.getElementById('mobile-lang-en-btn');

  const toggleLang = () => changeLanguage(currentLanguage === 'es' ? 'en' : 'es');

  if (esBtn) esBtn.addEventListener('click', toggleLang);
  if (enBtn) enBtn.addEventListener('click', toggleLang);
  if (mobileEsBtn) mobileEsBtn.addEventListener('click', toggleLang);
  if (mobileEnBtn) mobileEnBtn.addEventListener('click', toggleLang);

  // Translate static texts initially
  translatePage();

  // ── Footer year ─────────────────────────────────────────────
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Desktop nav buttons ──────────────────────────────────────
  document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.target));
  });

  // ── Mobile nav buttons ───────────────────────────────────────
  document.querySelectorAll('.mobile-nav-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.target));
  });

  // ── Logo → Home ──────────────────────────────────────────────
  const logoBtn = document.getElementById('logo-btn');
  if (logoBtn) logoBtn.addEventListener('click', () => switchSection('home'));

  // ── Hero "Contact Me" button ─────────────────────────────────
  const heroContactBtn = document.getElementById('btn-contact-hero');
  if (heroContactBtn) {
    heroContactBtn.addEventListener('click', () => switchSection('contact'));
  }

  // ── Hamburger toggle ─────────────────────────────────────────
  const hamburgerBtn = document.getElementById('hamburger-btn');
  if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleMobileMenu);

  // ── Close mobile menu when clicking outside ──────────────────
  document.addEventListener('click', (e) => {
    const menu      = document.getElementById('mobile-menu');
    const hamburger = document.getElementById('hamburger-btn');
    if (mobileMenuOpen && menu && !menu.contains(e.target) && !hamburger.contains(e.target)) {
      closeMobileMenu();
    }
  });

  // ── Filter pills ─────────────────────────────────────────────
  initFilterPills();
  initBlogFilterPills();

  // ── Contact form ─────────────────────────────────────────────
  initContactForm();

  // ── Fetch data (both requests fire in parallel) ──────────────
  // Projects and posts are loaded immediately so that when the
  // user clicks Portfolio/Blog, data is already rendered.
  loadProjects();
  loadPosts();

  // ── Blog list click events ──────────────────────────────────
  const blogList = document.getElementById('blog-list');
  if (blogList) {
    blogList.addEventListener('click', (e) => {
      const row = e.target.closest('.blog-row');
      if (row) {
        const slug = row.dataset.slug;
        if (slug) {
          showPostDetail(slug);
        }
      }
    });
  }

  // ── Back to blogs button ────────────────────────────────────
  const backBtn = document.getElementById('btn-back-to-blogs');
  if (backBtn) {
    backBtn.addEventListener('click', () => switchSection('blog'));
  }

  // Set initial active section to Home
  switchSection('home');


  console.log('[Portfolio] App initialized ✓');
});
