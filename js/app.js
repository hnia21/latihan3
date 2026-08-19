(() => {
  'use strict';

  const SUPABASE_URL = 'https://ynrgauifgghtjogaxzcz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucmdhdWlmZ2dodGpvZ2F4emN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTAyMTcsImV4cCI6MjEwMjUyNjIxN30.Bjeb68YsAAKhsgsXtEGIOem1HsZr4HybgB6-T0aL3V0';
  const BUCKET_NAME = 'gallery';
  let sb;
  try { sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); }
  catch (_) { console.error('Supabase gagal dimuat. Menu offline.'); }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }
  function stripHtml(html) {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    return d.textContent || '';
  }
  const ALLOWED_TAGS = new Set(['B','STRONG','I','EM','U','P','DIV','BR','UL','OL','LI','H2','H3','BLOCKQUOTE','A','SPAN']);
  function sanitizeRichHtml(html) {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    (function clean(node) {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 1) {
          if (!ALLOWED_TAGS.has(child.tagName)) { const p = child.parentNode; while (child.firstChild) p.insertBefore(child.firstChild, child); p.removeChild(child); return; }
          [...child.attributes].forEach(a => { const n = a.name.toLowerCase(); if (n === 'style' && /text-align/.test(a.value)) return; if (child.tagName === 'A' && n === 'href') return; child.removeAttribute(a.name); });
          clean(child);
        } else if (child.nodeType !== 3) { node.removeChild(child); }
      });
    })(d);
    return d.innerHTML;
  }

  let state = { profile: null, gallery: [], articles: [], karya: [], categories: [] };

  async function refreshPublicData() {
    if (!sb) return;
    try {
      const [p, g, a, k, c] = await Promise.all([
        sb.from('profile').select('*').order('id').limit(1).maybeSingle(),
        sb.from('gallery').select('*').order('created_at', { ascending: false }),
        sb.from('articles').select('*').order('created_at', { ascending: false }),
        sb.from('karya').select('*').order('created_at', { ascending: false }),
        sb.from('article_categories').select('*').order('name')
      ]);
      if (p && !p.error) state.profile = p.data;
      if (g && !g.error) state.gallery = g.data || [];
      if (a && !a.error) state.articles = a.data || [];
      if (k && !k.error) state.karya = k.data || [];
      if (c && !c.error) state.categories = c.data || [];
      buildTulisanDropdown();
    } catch (err) {
      console.error('Gagal memuat data:', err);
    }
  }

  const viewPublic      = document.getElementById('view-public');
  const viewArticle     = document.getElementById('view-article');
  const viewAllArticles = document.getElementById('view-all-articles');
  const viewAllKarya    = document.getElementById('view-all-karya');
  const viewAllGallery  = document.getElementById('view-all-gallery');
  const allViews = [viewPublic, viewArticle, viewAllArticles, viewAllKarya, viewAllGallery];

  function hideAll() { allViews.forEach(v => { v.hidden = true; }); }
  function $(c, s) { return c.querySelector(s); }
  function $all(c, s) { return c.querySelectorAll(s); }

  const MAX_ITEMS = 3;

  function fillFooter(scope) {
    const p = state.profile || {};
    $all(scope, '[data-footer-name]').forEach(e => e.textContent = p.name || 'Nama Anda');
    $all(scope, '[data-footer-name-2]').forEach(e => e.textContent = p.name || 'Nama Anda');
    $all(scope, '[data-footer-mark]').forEach(e => e.textContent = p.initials || 'ZP');
    $all(scope, '[data-footer-role]').forEach(e => e.textContent = p.role || 'Peran / profesi Anda');
    const fy = $(scope, '[data-footer-year]');
    if (fy) fy.textContent = new Date().getFullYear();
  }

  function renderPublic() {
    viewPublic.innerHTML = VIEWS.public();
    const p = state.profile || {};

    $all(viewPublic, '[data-stamp]').forEach(e => e.textContent = p.initials || 'ZP');
    $all(viewPublic, '[data-name]').forEach(e => e.textContent = p.name || 'Nama Anda');
    $all(viewPublic, '[data-role]').forEach(e => e.textContent = p.role || 'Peran / profesi Anda');
    $all(viewPublic, '[data-bio]').forEach(e => e.textContent = p.bio || '');
    $all(viewPublic, '[data-footer-name]').forEach(e => e.textContent = p.name || 'Nama Anda');
    $all(viewPublic, '[data-footer-name-2]').forEach(e => e.textContent = p.name || 'Nama Anda');
    $all(viewPublic, '[data-footer-mark]').forEach(e => e.textContent = p.initials || 'ZP');
    $all(viewPublic, '[data-footer-role]').forEach(e => e.textContent = p.role || 'Peran / profesi Anda');
    const fy = $(viewPublic, '[data-footer-year]');
    if (fy) fy.textContent = new Date().getFullYear();
    const loc = $(viewPublic, '[data-location]');
    if (loc) loc.textContent = p.location || 'Lokasi belum diisi';
    const em = $(viewPublic, '[data-email]');
    if (em) em.textContent = p.email || 'email belum diisi';

    const gl = $(viewPublic, '[data-slideshow-track]');
    const dotsWrap = $(viewPublic, '[data-slideshow-dots]');
    const slideshowEl = $(viewPublic, '[data-slideshow]');
    if (state.gallery.length === 0) {
      gl.innerHTML = '<p class="empty-note">Belum ada foto di galeri.</p>';
      if (dotsWrap) dotsWrap.style.display = 'none';
    } else {
      const items = state.gallery.slice(0, MAX_ITEMS);
      gl.innerHTML = items.map((g, i) =>
        '<div class="slideshow__slide' + (i === 0 ? ' is-active' : '') + '">' +
          (g.image_url
            ? '<img src="' + escapeHtml(g.image_url) + '" alt="' + escapeHtml(g.title) + '" loading="lazy">'
            : '<div class="gallery-item--empty">' + escapeHtml((g.title || '?').charAt(0).toUpperCase()) + '</div>') +
          '<div class="slideshow__caption">' + escapeHtml(g.caption || g.title) + '</div></div>'
      ).join('');
      if (dotsWrap) {
        dotsWrap.innerHTML = items.map((_, i) =>
          '<button class="slideshow__dot' + (i === 0 ? ' is-active' : '') + '" data-slide="' + i + '"></button>'
        ).join('');
        dotsWrap.querySelectorAll('.slideshow__dot').forEach(btn => {
          btn.addEventListener('click', () => { goToSlide(parseInt(btn.dataset.slide)); resetTimer(); });
        });
      }
      let current = 0;
      let busy = false;
      function goToSlide(n) {
        const slides = gl.querySelectorAll('.slideshow__slide');
        const dots = dotsWrap ? dotsWrap.querySelectorAll('.slideshow__dot') : [];
        if (slides.length === 0 || busy) return;
        busy = true;
        slides[current].classList.remove('is-active');
        if (dots[current]) dots[current].classList.remove('is-active');
        current = (n + slides.length) % slides.length;
        slides[current].classList.add('is-active');
        if (dots[current]) dots[current].classList.add('is-active');
        setTimeout(() => { busy = false; }, 650);
      }
      let timer = setInterval(() => { goToSlide(current + 1); }, 4000);
      function resetTimer() { clearInterval(timer); timer = setInterval(() => { goToSlide(current + 1); }, 4000); }
      if (slideshowEl) { slideshowEl._resetTimer = resetTimer; slideshowEl._timer = timer; }

      let startX = 0, dragging = false;
      gl.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; dragging = true; }, { passive: true });
      gl.addEventListener('touchend', (e) => {
        if (!dragging) return;
        dragging = false;
        const diff = e.changedTouches[0].clientX - startX;
        if (Math.abs(diff) > 40) { diff < 0 ? goToSlide(current + 1) : goToSlide(current - 1); resetTimer(); }
      }, { passive: true });
      gl.addEventListener('mousedown', (e) => { startX = e.clientX; dragging = true; e.preventDefault(); });
      gl.addEventListener('mouseup', (e) => {
        if (!dragging) return;
        dragging = false;
        const diff = e.clientX - startX;
        if (Math.abs(diff) > 40) { diff < 0 ? goToSlide(current + 1) : goToSlide(current - 1); resetTimer(); }
      });
      gl.addEventListener('mouseleave', () => { dragging = false; });
    }
    const gmb = $(viewPublic, '[data-gallery-more]');
    if (gmb) gmb.style.display = state.gallery.length > MAX_ITEMS ? '' : 'none';

    const al = $(viewPublic, '[data-article-list]');
    if (state.articles.length === 0) {
      al.innerHTML = '<p class="empty-note">Belum ada tulisan.</p>';
    } else {
      al.innerHTML = state.articles.slice(0, MAX_ITEMS).map((a, i) =>
        '<article class="stub-card" data-reveal style="transition-delay:' + Math.min(i, 6) * 60 + 'ms">' +
          (a.image_url ? '<img class="stub-card__image" src="' + escapeHtml(a.image_url) + '" alt="' + escapeHtml(a.title) + '" loading="lazy">' : '') +
          '<div class="stub-card__content">' +
            '<p class="stub-card__tag">Tulisan' + (a.author ? ' &middot; ' + escapeHtml(a.author) : '') + '</p>' +
            '<h3>' + escapeHtml(a.title) + '</h3>' +
            '<p>' + escapeHtml(a.excerpt || stripHtml(a.body).slice(0, 120)) + '</p>' +
            '<a class="stub-card__link" href="/tulisan/' + a.id + '" target="_blank">Baca selengkapnya</a>' +
          '</div></article>'
      ).join('');
    }
    const amb = $(viewPublic, '[data-article-more]');
    if (amb) amb.style.display = state.articles.length > MAX_ITEMS ? '' : 'none';

    const kl = $(viewPublic, '[data-karya-list]');
    if (state.karya.length === 0) {
      kl.innerHTML = '<p class="empty-note">Belum ada karya.</p>';
    } else {
      kl.innerHTML = state.karya.slice(0, MAX_ITEMS).map((k, i) =>
        '<article class="stub-card" data-reveal style="transition-delay:' + Math.min(i, 6) * 60 + 'ms">' +
          (k.image_url ? '<img class="stub-card__image" src="' + escapeHtml(k.image_url) + '" alt="' + escapeHtml(k.title) + '" loading="lazy">' : '') +
          '<div class="stub-card__content">' +
            '<p class="stub-card__tag">' + escapeHtml(k.category || 'Karya') + '</p>' +
            '<h3>' + escapeHtml(k.title) + '</h3>' +
            '<p>' + escapeHtml(k.description || '') + '</p>' +
            (k.link ? '<a class="stub-card__link" href="' + escapeHtml(k.link) + '" target="_blank" rel="noopener">Lihat karya</a>' : '') +
          '</div></article>'
      ).join('');
    }
    const kmb = $(viewPublic, '[data-karya-more]');
    if (kmb) kmb.style.display = state.karya.length > MAX_ITEMS ? '' : 'none';

    setupReveal(viewPublic);
  }

  function renderAllGallery(query) {
    viewAllGallery.innerHTML = VIEWS.allGallery();
    const wrap = $(viewAllGallery, '[data-all-gallery-list]');
    const q = (query || '').toLowerCase();
    const filtered = q ? state.gallery.filter(g =>
      (g.title || '').toLowerCase().includes(q)
    ) : state.gallery;
    if (filtered.length === 0) {
      wrap.innerHTML = '<p class="empty-note">' + (q ? 'Tidak ada foto yang cocok.' : 'Belum ada foto di galeri.') + '</p>';
    } else {
      wrap.innerHTML = filtered.map((g, i) =>
        '<div class="gallery-item" data-reveal style="transition-delay:' + Math.min(i, 6) * 60 + 'ms">' +
          (g.image_url
            ? '<img src="' + escapeHtml(g.image_url) + '" alt="' + escapeHtml(g.title) + '" loading="lazy">'
            : '<div class="gallery-item--empty">' + escapeHtml((g.title || '?').charAt(0).toUpperCase()) + '</div>') +
          '<div class="gallery-item__caption">' + escapeHtml(g.caption || g.title) + '</div></div>'
      ).join('');
    }
    const input = $(viewAllGallery, '[data-search-galeri]');
    if (input) {
      input.value = query || '';
      input.addEventListener('input', () => { renderAllGallery(input.value); });
      input.focus();
    }
    fillFooter(viewAllGallery);
    setupReveal(viewAllGallery);
  }

  function renderAllArticles(query, category) {
    viewAllArticles.innerHTML = VIEWS.allArticles();
    const wrap = $(viewAllArticles, '[data-all-articles-list]');
    const q = (query || '').toLowerCase();
    let filtered = state.articles;
    if (category) filtered = filtered.filter(a => (a.category || '').toLowerCase() === category.toLowerCase());
    if (q) filtered = filtered.filter(a =>
      (a.title || '').toLowerCase().includes(q) || (a.author || '').toLowerCase().includes(q)
    );
    if (filtered.length === 0) {
      wrap.innerHTML = '<p class="empty-note">' + (q || category ? 'Tidak ada tulisan yang cocok.' : 'Belum ada tulisan.') + '</p>';
    } else {
      wrap.innerHTML = filtered.map((a, i) =>
        '<article class="stub-card" data-reveal style="transition-delay:' + Math.min(i, 6) * 60 + 'ms">' +
          (a.image_url ? '<img class="stub-card__image" src="' + escapeHtml(a.image_url) + '" alt="' + escapeHtml(a.title) + '" loading="lazy">' : '') +
          '<div class="stub-card__content">' +
            '<p class="stub-card__tag">Tulisan' + (a.author ? ' &middot; ' + escapeHtml(a.author) : '') + '</p>' +
            '<h3>' + escapeHtml(a.title) + '</h3>' +
            '<p>' + escapeHtml(a.excerpt || stripHtml(a.body).slice(0, 120)) + '</p>' +
            '<a class="stub-card__link" href="/tulisan/' + a.id + '" target="_blank">Baca selengkapnya</a>' +
          '</div></article>'
      ).join('');
    }
    const input = $(viewAllArticles, '[data-search-tulisan]');
    if (input) {
      input.value = query || '';
      input.addEventListener('input', () => { renderAllArticles(input.value, category); });
      input.focus();
    }
    fillFooter(viewAllArticles);
    setupReveal(viewAllArticles);
  }

  function renderAllKarya(query) {
    viewAllKarya.innerHTML = VIEWS.allKarya();
    const wrap = $(viewAllKarya, '[data-all-karya-list]');
    const q = (query || '').toLowerCase();
    const filtered = q ? state.karya.filter(k =>
      (k.title || '').toLowerCase().includes(q) || (k.category || '').toLowerCase().includes(q)
    ) : state.karya;
    if (filtered.length === 0) {
      wrap.innerHTML = '<p class="empty-note">' + (q ? 'Tidak ada karya yang cocok.' : 'Belum ada karya.') + '</p>';
    } else {
      wrap.innerHTML = filtered.map((k, i) =>
        '<article class="stub-card" data-reveal style="transition-delay:' + Math.min(i, 6) * 60 + 'ms">' +
          (k.image_url ? '<img class="stub-card__image" src="' + escapeHtml(k.image_url) + '" alt="' + escapeHtml(k.title) + '" loading="lazy">' : '') +
          '<div class="stub-card__content">' +
            '<p class="stub-card__tag">' + escapeHtml(k.category || 'Karya') + '</p>' +
            '<h3>' + escapeHtml(k.title) + '</h3>' +
            '<p>' + escapeHtml(k.description || '') + '</p>' +
            (k.link ? '<a class="stub-card__link" href="' + escapeHtml(k.link) + '" target="_blank" rel="noopener">Lihat karya</a>' : '') +
          '</div></article>'
      ).join('');
    }
    const input = $(viewAllKarya, '[data-search-karya]');
    if (input) {
      input.value = query || '';
      input.addEventListener('input', () => { renderAllKarya(input.value); });
      input.focus();
    }
    fillFooter(viewAllKarya);
    setupReveal(viewAllKarya);
  }

  function renderArticleDetail(article) {
    viewArticle.innerHTML = VIEWS.articleDetail();
    $(viewArticle, '[data-ad-title]').textContent = article.title;
    $(viewArticle, '[data-ad-date]').textContent = article.created_at
      ? new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const authorEl = $(viewArticle, '[data-ad-author]');
    if (article.author) { authorEl.textContent = 'Oleh ' + article.author; authorEl.hidden = false; }
    else authorEl.hidden = true;
    const imgEl = $(viewArticle, '[data-ad-image]');
    if (article.image_url) { imgEl.src = article.image_url; imgEl.alt = article.title; imgEl.hidden = false; }
    else imgEl.hidden = true;
    const bodyEl = $(viewArticle, '[data-ad-body]');
    const body = article.body || article.excerpt || 'Belum ada isi untuk tulisan ini.';
    if (/<[a-z][\s\S]*>/i.test(body)) bodyEl.innerHTML = sanitizeRichHtml(body);
    else bodyEl.textContent = body;
    document.title = article.title;
    fillFooter(viewArticle);
  }

  function setupReveal(scope) {
    const targets = scope.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) { targets.forEach(el => el.classList.add('is-visible')); return; }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    targets.forEach(el => obs.observe(el));
  }

  function buildTulisanDropdown() {
    const menu = document.querySelector('[data-tulisan-dropdown-menu]');
    if (!menu) return;
    const route = currentRoute();
    let html = '<a href="/semua-tulisan">Semua Tulisan</a>';
    state.categories.forEach(c => {
      const active = route === '/kategori/' + encodeURIComponent(c.name) ? ' is-active' : '';
      html += '<a href="/kategori/' + encodeURIComponent(c.name) + '"' + active + '>' + escapeHtml(c.name) + '</a>';
    });
    menu.innerHTML = html;
  }

  const tulisanDropdown = document.querySelector('[data-tulisan-dropdown]');
  if (tulisanDropdown) {
    const trigger = tulisanDropdown.querySelector('.topbar__dropdown-trigger');
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (tulisanDropdown.classList.contains('is-open')) {
        tulisanDropdown.classList.remove('is-open');
        navigateTo('/semua-tulisan');
      } else {
        tulisanDropdown.classList.add('is-open');
      }
    });
    tulisanDropdown.querySelector('[data-tulisan-dropdown-menu]').addEventListener('click', () => {
      tulisanDropdown.classList.remove('is-open');
    });
    document.addEventListener('click', (e) => {
      if (!tulisanDropdown.contains(e.target)) tulisanDropdown.classList.remove('is-open');
    });
  }

  function currentRoute() {
    const p = location.pathname;
    const r = new URLSearchParams(location.search).get('r');
    if (r && r !== '/') { history.replaceState(null, '', r + location.hash); return r; }
    return p === '/' ? '/' : p;
  }

  let navId = 0;

  function navigateTo(path) {
    history.pushState(null, '', path);
    router();
  }

  async function ensureData() {
    if (state.profile && state.gallery.length) return;
    await refreshPublicData();
  }

  async function router() {
    const id = ++navId;
    const route = currentRoute();
    hideAll();

    try {
      const artMatch = route.match(/^\/tulisan\/(.+)$/);
      if (artMatch) {
        try {
          const { data } = sb ? await sb.from('articles').select('*').eq('id', artMatch[1]).single() : { data: null };
          if (id !== navId) return;
          if (data) { renderArticleDetail(data); viewArticle.hidden = false; window.scrollTo({ top: 0 }); return; }
          else { navigateTo('/'); return; }
        } catch (_) {
          if (id !== navId) return;
          renderPublic(); viewPublic.hidden = false; buildTulisanDropdown(); return;
        }
      }

      if (route === '/semua-galeri') {
        await ensureData();
        if (id !== navId) return;
        renderAllGallery(); viewAllGallery.hidden = false; window.scrollTo({ top: 0 }); return;
      }
      if (route === '/semua-tulisan') {
        await ensureData();
        if (id !== navId) return;
        renderAllArticles(); viewAllArticles.hidden = false; window.scrollTo({ top: 0 }); return;
      }
      const catMatch = route.match(/^\/kategori\/(.+)$/);
      if (catMatch) {
        const catName = decodeURIComponent(catMatch[1]);
        await ensureData();
        if (id !== navId) return;
        renderAllArticles('', catName); viewAllArticles.hidden = false; window.scrollTo({ top: 0 }); return;
      }
      if (route === '/semua-karya') {
        await ensureData();
        if (id !== navId) return;
        renderAllKarya(); viewAllKarya.hidden = false; window.scrollTo({ top: 0 }); return;
      }

      await ensureData();
      if (id !== navId) return;
      renderPublic(); viewPublic.hidden = false; buildTulisanDropdown();

      if (route === '/tulisan') $(viewPublic, '#tulisan')?.scrollIntoView({ behavior: 'smooth' });
      else if (route === '/karya') $(viewPublic, '#karya')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Router error:', err);
      if (id !== navId) return;
      renderPublic(); viewPublic.hidden = false; buildTulisanDropdown();
    }
  }

  window.addEventListener('popstate', router);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
    if (a.hasAttribute('target') && a.target !== '_self') return;
    e.preventDefault();
    navigateTo(href);
  });
  router();

  let logoClicks = 0;
  let logoTimer = null;
  const brand = document.querySelector('.topbar__brand');
  if (brand) {
    brand.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      logoClicks++;
      clearTimeout(logoTimer);
      logoTimer = setTimeout(() => { logoClicks = 0; }, 2000);
      if (logoClicks >= 5) { logoClicks = 0; location.href = 'admin.html'; }
      else { navigateTo('/'); }
    });
  }

  const savedTheme = localStorage.getItem('_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeBtn = document.querySelector('[data-theme-toggle]');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('_theme', next);
    });
  }

  const searchOverlay = document.querySelector('[data-search-overlay]');
  const searchInput = document.querySelector('[data-global-search]');
  const searchResults = document.querySelector('[data-global-results]');
  document.querySelector('[data-search-open]')?.addEventListener('click', () => {
    searchOverlay.hidden = false;
    setTimeout(() => searchInput.focus(), 100);
  });
  document.querySelector('[data-search-close]')?.addEventListener('click', () => {
    searchOverlay.hidden = true;
    searchInput.value = '';
    searchResults.innerHTML = '';
  });
  searchOverlay?.addEventListener('click', (e) => {
    if (e.target === searchOverlay) { searchOverlay.hidden = true; searchInput.value = ''; searchResults.innerHTML = ''; }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay && !searchOverlay.hidden) {
      searchOverlay.hidden = true; searchInput.value = ''; searchResults.innerHTML = '';
    }
  });
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      if (!q) { searchResults.innerHTML = ''; return; }
      let html = '';
      state.articles.filter(a => (a.title || '').toLowerCase().includes(q) || (a.author || '').toLowerCase().includes(q)).forEach(a => {
        html += '<a class="search-result" href="/tulisan/' + a.id + '" data-search-close-result>' +
          '<div class="search-result__type">Tulisan</div>' +
          '<div class="search-result__title">' + escapeHtml(a.title) + '</div>' +
          (a.author ? '<div class="search-result__meta">' + escapeHtml(a.author) + '</div>' : '') + '</a>';
      });
      state.karya.filter(k => (k.title || '').toLowerCase().includes(q) || (k.category || '').toLowerCase().includes(q)).forEach(k => {
        html += '<a class="search-result" href="/semua-karya" data-search-close-result>' +
          '<div class="search-result__type">Karya</div>' +
          '<div class="search-result__title">' + escapeHtml(k.title) + '</div>' +
          (k.category ? '<div class="search-result__meta">' + escapeHtml(k.category) + '</div>' : '') + '</a>';
      });
      state.gallery.filter(g => (g.title || '').toLowerCase().includes(q) || (g.caption || '').toLowerCase().includes(q)).forEach(g => {
        html += '<a class="search-result" href="/semua-galeri" data-search-close-result>' +
          '<div class="search-result__type">Galeri</div>' +
          '<div class="search-result__title">' + escapeHtml(g.title) + '</div>' +
          (g.caption ? '<div class="search-result__meta">' + escapeHtml(g.caption) + '</div>' : '') + '</a>';
      });
      searchResults.innerHTML = html || '<div class="search-no-result">Tidak ada hasil ditemukan.</div>';
      searchResults.querySelectorAll('[data-search-close-result]').forEach(el => {
        el.addEventListener('click', () => { searchOverlay.hidden = true; searchInput.value = ''; searchResults.innerHTML = ''; });
      });
    });
  }
})();
