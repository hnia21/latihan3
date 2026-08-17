(() => {
  'use strict';

  const SUPABASE_URL = 'https://ynrgauifgghtjogaxzcz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucmdhdWlmZ2dodGpvZ2F4emN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTAyMTcsImV4cCI6MjEwMjUyNjIxN30.Bjeb68YsAAKhsgsXtEGIOem1HsZr4HybgB6-T0aL3V0';
  const BUCKET_NAME = 'gallery';
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  let state = { profile: null, gallery: [], articles: [], karya: [] };

  async function refreshPublicData() {
    const [p, g, a, k] = await Promise.all([
      sb.from('profile').select('*').order('id').limit(1).maybeSingle(),
      sb.from('gallery').select('*').order('created_at', { ascending: false }),
      sb.from('articles').select('*').order('created_at', { ascending: false }),
      sb.from('karya').select('*').order('created_at', { ascending: false })
    ]);
    state.profile = p.data;
    state.gallery = g.data || [];
    state.articles = a.data || [];
    state.karya = k.data || [];
  }

  const viewPublic      = document.getElementById('view-public');
  const viewArticle     = document.getElementById('view-article');
  const viewAllArticles = document.getElementById('view-all-articles');
  const viewAllKarya    = document.getElementById('view-all-karya');
  const allViews = [viewPublic, viewArticle, viewAllArticles, viewAllKarya];

  function hideAll() { allViews.forEach(v => { v.hidden = true; }); }
  function $(c, s) { return c.querySelector(s); }
  function $all(c, s) { return c.querySelectorAll(s); }

  const MAX_ITEMS = 3;

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

    const gl = $(viewPublic, '[data-gallery-list]');
    if (state.gallery.length === 0) {
      gl.innerHTML = '<p class="empty-note">Belum ada foto di galeri.</p>';
    } else {
      gl.innerHTML = state.gallery.slice(0, MAX_ITEMS).map((g, i) =>
        '<div class="gallery-item" data-reveal style="transition-delay:' + Math.min(i, 6) * 60 + 'ms">' +
          (g.image_url
            ? '<img src="' + escapeHtml(g.image_url) + '" alt="' + escapeHtml(g.title) + '" loading="lazy">'
            : '<div class="gallery-item--empty">' + escapeHtml((g.title || '?').charAt(0).toUpperCase()) + '</div>') +
          '<div class="gallery-item__caption">' + escapeHtml(g.caption || g.title) + '</div></div>'
      ).join('');
    }

    const al = $(viewPublic, '[data-article-list]');
    if (state.articles.length === 0) {
      al.innerHTML = '<p class="empty-note">Belum ada artikel.</p>';
    } else {
      al.innerHTML = state.articles.slice(0, MAX_ITEMS).map((a, i) =>
        '<article class="stub-card" data-reveal style="transition-delay:' + Math.min(i, 6) * 60 + 'ms">' +
          (a.image_url ? '<img class="stub-card__image" src="' + escapeHtml(a.image_url) + '" alt="' + escapeHtml(a.title) + '" loading="lazy">' : '') +
          '<div class="stub-card__content">' +
            '<p class="stub-card__tag">Artikel' + (a.author ? ' &middot; ' + escapeHtml(a.author) : '') + '</p>' +
            '<h3>' + escapeHtml(a.title) + '</h3>' +
            '<p>' + escapeHtml(a.excerpt || stripHtml(a.body).slice(0, 120)) + '</p>' +
            '<a class="stub-card__link" href="#/artikel/' + a.id + '" target="_blank">Baca selengkapnya</a>' +
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

  function renderAllArticles() {
    viewAllArticles.innerHTML = VIEWS.allArticles();
    const wrap = $(viewAllArticles, '[data-all-articles-list]');
    if (state.articles.length === 0) {
      wrap.innerHTML = '<p class="empty-note">Belum ada artikel.</p>';
    } else {
      wrap.innerHTML = state.articles.map((a, i) =>
        '<article class="stub-card" data-reveal style="transition-delay:' + Math.min(i, 6) * 60 + 'ms">' +
          (a.image_url ? '<img class="stub-card__image" src="' + escapeHtml(a.image_url) + '" alt="' + escapeHtml(a.title) + '" loading="lazy">' : '') +
          '<div class="stub-card__content">' +
            '<p class="stub-card__tag">Artikel' + (a.author ? ' &middot; ' + escapeHtml(a.author) : '') + '</p>' +
            '<h3>' + escapeHtml(a.title) + '</h3>' +
            '<p>' + escapeHtml(a.excerpt || stripHtml(a.body).slice(0, 120)) + '</p>' +
            '<a class="stub-card__link" href="#/artikel/' + a.id + '" target="_blank">Baca selengkapnya</a>' +
          '</div></article>'
      ).join('');
    }
    setupReveal(viewAllArticles);
  }

  function renderAllKarya() {
    viewAllKarya.innerHTML = VIEWS.allKarya();
    const wrap = $(viewAllKarya, '[data-all-karya-list]');
    if (state.karya.length === 0) {
      wrap.innerHTML = '<p class="empty-note">Belum ada karya.</p>';
    } else {
      wrap.innerHTML = state.karya.map((k, i) =>
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
    const body = article.body || article.excerpt || 'Belum ada isi untuk artikel ini.';
    if (/<[a-z][\s\S]*>/i.test(body)) bodyEl.innerHTML = sanitizeRichHtml(body);
    else bodyEl.textContent = body;
    document.title = article.title;
  }

  function setupReveal(scope) {
    const targets = scope.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) { targets.forEach(el => el.classList.add('is-visible')); return; }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    targets.forEach(el => obs.observe(el));
  }

  function currentRoute() { return (location.hash || '#/').replace(/^#/, '') || '/'; }

  async function router() {
    const route = currentRoute();
    hideAll();

    const artMatch = route.match(/^\/artikel\/(.+)$/);
    if (artMatch) {
      const { data } = await sb.from('articles').select('*').eq('id', artMatch[1]).single();
      if (data) { renderArticleDetail(data); viewArticle.hidden = false; window.scrollTo({ top: 0 }); return; }
      else { location.hash = '#/'; }
    }

    if (route === '/semua-artikel') {
      await refreshPublicData(); renderAllArticles(); viewAllArticles.hidden = false; window.scrollTo({ top: 0 }); return;
    }
    if (route === '/semua-karya') {
      await refreshPublicData(); renderAllKarya(); viewAllKarya.hidden = false; window.scrollTo({ top: 0 }); return;
    }

    await refreshPublicData(); renderPublic(); viewPublic.hidden = false;

    if (route === '/artikel') $(viewPublic, '#artikel')?.scrollIntoView({ behavior: 'smooth' });
    else if (route === '/karya') $(viewPublic, '#karya')?.scrollIntoView({ behavior: 'smooth' });
    else if (route === '/galeri') $(viewPublic, '#galeri')?.scrollIntoView({ behavior: 'smooth' });
  }

  window.addEventListener('hashchange', router);
  router();
})();
