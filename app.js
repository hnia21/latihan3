(() => {
  'use strict';

  const SUPABASE_URL = 'https://ynrgauifgghtjogaxzcz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucmdhdWlmZ2dodGpvZ2F4emN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTAyMTcsImV4cCI6MjEwMjUyNjIxN30.Bjeb68YsAAKhsgsXtEGIOem1HsZr4HybgB6-T0aL3V0';
  const BUCKET_NAME = 'gallery';

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent || '';
  }

  const ALLOWED_TAGS = new Set(['B','STRONG','I','EM','U','P','DIV','BR','UL','OL','LI','H2','H3','BLOCKQUOTE','A','SPAN']);
  function sanitizeRichHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    (function clean(node) {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 1) {
          if (!ALLOWED_TAGS.has(child.tagName)) {
            const parent = child.parentNode;
            while (child.firstChild) parent.insertBefore(child.firstChild, child);
            parent.removeChild(child);
            return;
          }
          [...child.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            const keepStyle = name === 'style' && /text-align/.test(attr.value);
            const keepHref = child.tagName === 'A' && name === 'href';
            if (!keepStyle && !keepHref) child.removeAttribute(attr.name);
          });
          clean(child);
        } else if (child.nodeType !== 3) {
          node.removeChild(child);
        }
      });
    })(div);
    return div.innerHTML;
  }

  async function uploadImage(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const path = 'uploads/img_' + Date.now() + '_' + Math.round(Math.random() * 1e9) + '.' + ext;
    const { error } = await sb.storage.from(BUCKET_NAME).upload(path, file);
    if (error) throw new Error(error.message || 'Gagal mengunggah gambar.');
    const { data } = sb.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  }

  async function sbQuery(promise, label) {
    console.log('[sbQuery] start:', label);
    const { data, error } = await promise;
    if (error) {
      console.error('[sbQuery] error:', label, error);
      throw new Error(error.message || 'Gagal menyimpan data.');
    }
    console.log('[sbQuery] ok:', label);
    return data;
  }

  let state = {
    profile: null,
    gallery: [],
    articles: [],
    karya: [],
    loggedIn: false
  };

  async function refreshPublicData() {
    console.log('[REFRESH] start');
    const [profileRes, galleryRes, articlesRes, karyaRes] = await Promise.all([
      sb.from('profile').select('*').order('id').limit(1).maybeSingle(),
      sb.from('gallery').select('*').order('created_at', { ascending: false }),
      sb.from('articles').select('*').order('created_at', { ascending: false }),
      sb.from('karya').select('*').order('created_at', { ascending: false })
    ]);
    console.log('[REFRESH] profile:', profileRes.error ? 'ERR ' + profileRes.error.message : 'ok (' + (profileRes.data ? '1' : '0') + ')');
    console.log('[REFRESH] gallery:', galleryRes.error ? 'ERR ' + galleryRes.error.message : 'ok (' + (galleryRes.data?.length || 0) + ')');
    console.log('[REFRESH] articles:', articlesRes.error ? 'ERR ' + articlesRes.error.message : 'ok (' + (articlesRes.data?.length || 0) + ')');
    console.log('[REFRESH] karya:', karyaRes.error ? 'ERR ' + karyaRes.error.message : 'ok (' + (karyaRes.data?.length || 0) + ')');
    state.profile = profileRes.data;
    state.gallery = galleryRes.data || [];
    state.articles = articlesRes.data || [];
    state.karya = karyaRes.data || [];
    console.log('[REFRESH] done');
  }

  async function checkAuth() {
    const { data: { session } } = await sb.auth.getSession();
    state.loggedIn = !!session;
    return state.loggedIn;
  }

  const viewPublic = document.getElementById('view-public');
  const viewArticle = document.getElementById('view-article');
  const viewLogin = document.getElementById('view-login');
  const viewAdmin = document.getElementById('view-admin');

  function currentRoute() {
    return (location.hash || '#/').replace(/^#/, '') || '/';
  }

  async function router() {
    const route = currentRoute();
    viewPublic.hidden = true;
    viewArticle.hidden = true;
    viewLogin.hidden = true;
    viewAdmin.hidden = true;

    if (route.startsWith('/admin')) {
      await checkAuth();
      if (!state.loggedIn) {
        renderLoginView();
        viewLogin.hidden = false;
      } else {
        await renderAdmin();
        viewAdmin.hidden = false;
      }
      return;
    }

    const articleMatch = route.match(/^\/artikel\/(.+)$/);
    if (articleMatch) {
      const { data } = await sb.from('articles').select('*').eq('id', articleMatch[1]).single();
      if (data) {
        renderArticleDetail(data);
        viewArticle.hidden = false;
        window.scrollTo({ top: 0 });
        return;
      } else {
        location.hash = '#/';
      }
    }

    await refreshPublicData();
    renderPublic();
    viewPublic.hidden = false;
    setupReveal();

    if (route === '/artikel') {
      document.getElementById('artikel').scrollIntoView({ behavior: 'smooth' });
    } else if (route === '/karya') {
      document.getElementById('karya').scrollIntoView({ behavior: 'smooth' });
    } else if (route === '/galeri') {
      document.getElementById('galeri').scrollIntoView({ behavior: 'smooth' });
    }
  }

  window.addEventListener('hashchange', router);

  (function setupSecretAdminAccess() {
    const mark = document.querySelector('[data-brandmark-secret]');
    let clickCount = 0;
    let clickTimer = null;
    if (mark) {
      mark.addEventListener('click', (e) => {
        clickCount += 1;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => { clickCount = 0; }, 1500);
        if (clickCount >= 5) {
          e.preventDefault();
          clickCount = 0;
          location.hash = '#/admin';
        }
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        location.hash = '#/admin';
      }
    });
  })();

  function setupReveal() {
    const targets = document.querySelectorAll('#view-public [data-reveal]');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach(el => observer.observe(el));
  }

  function renderPublic() {
    const p = state.profile || {};
    document.querySelectorAll('[data-stamp]').forEach(el => el.textContent = p.initials || 'ZP');
    document.querySelectorAll('[data-name]').forEach(el => el.textContent = p.name || 'Nama Anda');
    document.querySelectorAll('[data-role]').forEach(el => el.textContent = p.role || 'Peran / profesi Anda');
    document.querySelectorAll('[data-bio]').forEach(el => el.textContent = p.bio || '');
    document.querySelectorAll('[data-footer-name]').forEach(el => el.textContent = p.name || 'Nama Anda');
    document.querySelectorAll('[data-footer-name-2]').forEach(el => el.textContent = p.name || 'Nama Anda');
    document.querySelectorAll('[data-footer-mark]').forEach(el => el.textContent = p.initials || 'ZP');
    document.querySelectorAll('[data-footer-role]').forEach(el => el.textContent = p.role || 'Peran / profesi Anda');
    const footerYear = document.querySelector('[data-footer-year]');
    if (footerYear) footerYear.textContent = new Date().getFullYear();
    document.querySelector('[data-location]').textContent = p.location || 'Lokasi belum diisi';
    document.querySelector('[data-email]').textContent = p.email || 'email belum diisi';

    const galleryList = document.querySelector('[data-gallery-list]');
    if (state.gallery.length === 0) {
      galleryList.innerHTML = '<p class="empty-note">Belum ada foto di galeri. Tambahkan lewat panel admin.</p>';
    } else {
      galleryList.innerHTML = state.gallery.map((g, i) =>
        '<div class="gallery-item" data-reveal style="transition-delay:' + Math.min(i, 6) * 60 + 'ms">' +
          (g.image_url
            ? '<img src="' + escapeHtml(g.image_url) + '" alt="' + escapeHtml(g.title) + '" loading="lazy">'
            : '<div class="gallery-item--empty">' + escapeHtml((g.title || '?').charAt(0).toUpperCase()) + '</div>') +
          '<div class="gallery-item__caption">' + escapeHtml(g.caption || g.title) + '</div>'
        + '</div>'
      ).join('');
    }

    const articleList = document.querySelector('[data-article-list]');
    if (state.articles.length === 0) {
      articleList.innerHTML = '<p class="empty-note">Belum ada artikel. Tambahkan lewat panel admin.</p>';
    } else {
      articleList.innerHTML = state.articles.map((a, i) =>
        '<article class="stub-card" data-reveal style="transition-delay:' + Math.min(i, 6) * 60 + 'ms">' +
          (a.image_url ? '<img class="stub-card__image" src="' + escapeHtml(a.image_url) + '" alt="' + escapeHtml(a.title) + '" loading="lazy">' : '') +
          '<div class="stub-card__content">' +
            '<p class="stub-card__tag">Artikel' + (a.author ? ' &middot; ' + escapeHtml(a.author) : '') + '</p>' +
            '<h3>' + escapeHtml(a.title) + '</h3>' +
            '<p>' + escapeHtml(a.excerpt || stripHtml(a.body).slice(0, 120)) + '</p>' +
            '<a class="stub-card__link" href="#/artikel/' + a.id + '">Baca selengkapnya</a>' +
          '</div>' +
        '</article>'
      ).join('');
    }

    const karyaList = document.querySelector('[data-karya-list]');
    if (state.karya.length === 0) {
      karyaList.innerHTML = '<p class="empty-note">Belum ada karya. Tambahkan lewat panel admin.</p>';
    } else {
      karyaList.innerHTML = state.karya.map((k, i) =>
        '<article class="stub-card" data-reveal style="transition-delay:' + Math.min(i, 6) * 60 + 'ms">' +
          (k.image_url ? '<img class="stub-card__image" src="' + escapeHtml(k.image_url) + '" alt="' + escapeHtml(k.title) + '" loading="lazy">' : '') +
          '<div class="stub-card__content">' +
            '<p class="stub-card__tag">' + escapeHtml(k.category || 'Karya') + '</p>' +
            '<h3>' + escapeHtml(k.title) + '</h3>' +
            '<p>' + escapeHtml(k.description || '') + '</p>' +
            (k.link ? '<a class="stub-card__link" href="' + escapeHtml(k.link) + '" target="_blank" rel="noopener">Lihat karya</a>' : '') +
          '</div>' +
        '</article>'
      ).join('');
    }
  }

  function renderArticleDetail(article) {
    document.querySelector('[data-ad-title]').textContent = article.title;
    document.querySelector('[data-ad-date]').textContent = article.created_at
      ? new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const authorEl = document.querySelector('[data-ad-author]');
    if (article.author) {
      authorEl.textContent = 'Oleh ' + article.author;
      authorEl.hidden = false;
    } else {
      authorEl.hidden = true;
    }
    const imgEl = document.querySelector('[data-ad-image]');
    if (article.image_url) {
      imgEl.src = article.image_url;
      imgEl.alt = article.title;
      imgEl.hidden = false;
    } else {
      imgEl.hidden = true;
    }
    const bodyEl = document.querySelector('[data-ad-body]');
    const body = article.body || article.excerpt || 'Belum ada isi untuk artikel ini.';
    if (/<[a-z][\s\S]*>/i.test(body)) {
      bodyEl.innerHTML = sanitizeRichHtml(body);
    } else {
      bodyEl.textContent = body;
    }
    document.title = article.title;
  }

  const loginForm = document.querySelector('[data-login-form]');
  const emailInput = document.querySelector('[data-email-input]');
  const passwordInput = document.querySelector('[data-password-input]');
  const loginError = document.querySelector('[data-login-error]');
  const loginSubmit = document.querySelector('[data-login-submit]');

  function renderLoginView() {
    loginError.hidden = true;
    passwordInput.value = '';
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    const pw = passwordInput.value;

    if (!pw || pw.length < 4) {
      loginError.textContent = 'Kata sandi minimal 4 karakter.';
      loginError.hidden = false;
      return;
    }

    try {
      const { error } = await sb.auth.signInWithPassword({
        email: emailInput.value.trim(),
        password: pw
      });
      if (error) {
        loginError.textContent = error.message === 'Invalid login credentials'
          ? 'Kata sandi salah atau akun belum dibuat.'
          : error.message;
        loginError.hidden = false;
        return;
      }
      state.loggedIn = true;
      location.hash = '#/admin';
      router();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.hidden = false;
    }
  });

  document.querySelector('[data-logout]').addEventListener('click', async () => {
    await sb.auth.signOut();
    state.loggedIn = false;
    location.hash = '#/';
    router();
  });

  async function renderAdmin() {
    await refreshPublicData();
    fillProfileForm();
    renderGalleryAdminList();
    renderArticleAdminList();
    renderKaryaAdminList();
  }

  document.querySelectorAll('.admin__tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin__tab').forEach(b => b.classList.remove('is-active'));
      document.querySelectorAll('.admin__panel').forEach(p => p.classList.remove('is-active'));
      btn.classList.add('is-active');
      document.querySelector('[data-panel="' + btn.dataset.tab + '"]').classList.add('is-active');
    });
  });

  function setBusy(button, busy, busyLabel) {
    if (busy) {
      button.dataset.originalLabel = button.textContent;
      button.textContent = busyLabel || 'Menyimpan...';
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalLabel || button.textContent;
      button.disabled = false;
    }
  }

  const profileForm = document.querySelector('[data-profile-form]');
  const fInitials = document.querySelector('[data-f-initials]');
  const fName = document.querySelector('[data-f-name]');
  const fRole = document.querySelector('[data-f-role]');
  const fBio = document.querySelector('[data-f-bio]');
  const fLocation = document.querySelector('[data-f-location]');
  const fEmail = document.querySelector('[data-f-email]');
  const profileSaved = document.querySelector('[data-profile-saved]');

  function fillProfileForm() {
    const p = state.profile || {};
    fInitials.value = p.initials || '';
    fName.value = p.name || '';
    fRole.value = p.role || '';
    fBio.value = p.bio || '';
    fLocation.value = p.location || '';
    fEmail.value = p.email || '';
    profileSaved.hidden = true;
  }

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = profileForm.querySelector('button[type="submit"]');
    setBusy(submitBtn, true);
    try {
      const payload = {
        initials: (fInitials.value || 'ZP').slice(0, 3).toUpperCase(),
        name: fName.value.trim() || 'Nama Anda',
        role: fRole.value.trim(),
        bio: fBio.value.trim(),
        location: fLocation.value.trim(),
        email: fEmail.value.trim()
      };
      if (state.profile && state.profile.id) {
        state.profile = await sbQuery(sb.from('profile').update(payload).eq('id', state.profile.id).select().single(), 'profile-update');
      } else {
        state.profile = await sbQuery(sb.from('profile').insert(payload).select().single(), 'profile-insert');
      }
      profileSaved.hidden = false;
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(submitBtn, false);
    }
  });

  const galleryForm = document.querySelector('[data-gallery-form]');
  const gTitle = document.querySelector('[data-g-title]');
  const gCaption = document.querySelector('[data-g-caption]');
  const gImage = document.querySelector('[data-g-image]');
  const gImageStatus = document.querySelector('[data-g-image-status]');
  const gSubmit = document.querySelector('[data-g-submit]');

  galleryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = gTitle.value.trim();
    if (!title) return;
    setBusy(gSubmit, true, 'Mengunggah...');
    try {
      let imageUrl = null;
      if (gImage.files && gImage.files[0]) {
        gImageStatus.textContent = 'Mengunggah gambar...';
        imageUrl = await uploadImage(gImage.files[0]);
      }
      await sbQuery(sb.from('gallery').insert({ title, caption: gCaption.value.trim(), image_url: imageUrl }), 'gallery-insert');
      galleryForm.reset();
      gImageStatus.textContent = '';
      await refreshPublicData();
      renderGalleryAdminList();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(gSubmit, false);
    }
  });

  function renderGalleryAdminList() {
    const wrap = document.querySelector('[data-gallery-admin-list]');
    if (state.gallery.length === 0) {
      wrap.innerHTML = '<p class="empty-note">Belum ada foto di galeri.</p>';
      return;
    }
    wrap.innerHTML = state.gallery.map(g =>
      '<div class="admin-row" data-id="' + g.id + '">' +
        '<div class="admin-row__left">' +
          (g.image_url ? '<img class="admin-row__thumb" src="' + escapeHtml(g.image_url) + '" alt="">' : '') +
          '<div>' +
            '<div class="admin-row__title">' + escapeHtml(g.title) + '</div>' +
            '<div class="admin-row__meta">' + new Date(g.created_at).toLocaleDateString('id-ID') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="admin-row__actions">' +
          '<button data-delete class="danger">Hapus</button>' +
        '</div>' +
      '</div>'
    ).join('');

    wrap.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const id = btn.closest('.admin-row').dataset.id;
          await sbQuery(sb.from('gallery').delete().eq('id', id), 'gallery-delete');
          await refreshPublicData();
          renderGalleryAdminList();
        } catch (err) { alert(err.message); }
      });
    });
  }

  const articleForm = document.querySelector('[data-article-form]');
  const aId = document.querySelector('[data-a-id]');
  const aTitle = document.querySelector('[data-a-title]');
  const aAuthor = document.querySelector('[data-a-author]');
  const aExcerpt = document.querySelector('[data-a-excerpt]');
  const aBody = document.querySelector('[data-a-body]');
  const aToolbar = document.querySelector('[data-a-toolbar]');
  const aImage = document.querySelector('[data-a-image]');
  const aImageStatus = document.querySelector('[data-a-image-status]');
  const aSubmit = document.querySelector('[data-a-submit]');
  const aCancel = document.querySelector('[data-a-cancel]');
  let aCurrentImageUrl = null;

  if (aToolbar) {
    aToolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cmd]');
      if (!btn) return;
      e.preventDefault();
      aBody.focus();
      const cmd = btn.dataset.cmd;
      if (cmd === 'formatBlockH2') {
        document.execCommand('formatBlock', false, 'H2');
      } else if (cmd === 'formatBlockQuote') {
        document.execCommand('formatBlock', false, 'BLOCKQUOTE');
      } else {
        document.execCommand(cmd, false, null);
      }
      syncToolbarState();
    });
  }

  function syncToolbarState() {
    if (!aToolbar) return;
    aToolbar.querySelectorAll('[data-cmd]').forEach(btn => {
      const cmd = btn.dataset.cmd;
      let active = false;
      try {
        if (['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', 'insertUnorderedList', 'insertOrderedList'].includes(cmd)) {
          active = document.queryCommandState(cmd);
        }
      } catch (err) {}
      btn.classList.toggle('is-active', active);
    });
  }
  if (aBody) {
    aBody.addEventListener('keyup', syncToolbarState);
    aBody.addEventListener('mouseup', syncToolbarState);
    aBody.addEventListener('focus', syncToolbarState);
  }

  function resetArticleForm() {
    aId.value = '';
    aTitle.value = '';
    aAuthor.value = '';
    aExcerpt.value = '';
    aBody.innerHTML = '';
    aImage.value = '';
    aImageStatus.textContent = '';
    aCurrentImageUrl = null;
    aSubmit.textContent = 'Tambah artikel';
    aCancel.hidden = true;
  }

  articleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = aTitle.value.trim();
    if (!title) return;
    console.log('[ARTICLE] submit start, title:', title);
    setBusy(aSubmit, true, 'Menyimpan...');
    try {
      let imageUrl = aCurrentImageUrl;
      if (aImage.files && aImage.files[0]) {
        aImageStatus.textContent = 'Mengunggah gambar...';
        console.log('[ARTICLE] uploading image...');
        imageUrl = await uploadImage(aImage.files[0]);
        console.log('[ARTICLE] image uploaded:', imageUrl);
      }
      const payload = {
        title,
        author: aAuthor.value.trim(),
        excerpt: aExcerpt.value.trim(),
        body: sanitizeRichHtml(aBody.innerHTML.trim()),
        image_url: imageUrl
      };
      console.log('[ARTICLE] payload:', JSON.stringify(payload));
      if (aId.value) {
        await sbQuery(sb.from('articles').update(payload).eq('id', aId.value), 'articles-update');
      } else {
        await sbQuery(sb.from('articles').insert(payload), 'articles-insert');
      }
      console.log('[ARTICLE] saved, refreshing...');
      resetArticleForm();
      await refreshPublicData();
      console.log('[ARTICLE] data refreshed');
      renderArticleAdminList();
      console.log('[ARTICLE] DONE');
    } catch (err) {
      console.error('[ARTICLE] catch:', err);
      alert(err.message);
    } finally {
      setBusy(aSubmit, false);
    }
  });

  aCancel.addEventListener('click', resetArticleForm);

  function renderArticleAdminList() {
    const wrap = document.querySelector('[data-article-admin-list]');
    if (state.articles.length === 0) {
      wrap.innerHTML = '<p class="empty-note">Belum ada artikel.</p>';
      return;
    }
    wrap.innerHTML = state.articles.map(a =>
      '<div class="admin-row" data-id="' + a.id + '">' +
        '<div class="admin-row__left">' +
          (a.image_url ? '<img class="admin-row__thumb" src="' + escapeHtml(a.image_url) + '" alt="">' : '') +
          '<div>' +
            '<div class="admin-row__title">' + escapeHtml(a.title) + '</div>' +
            '<div class="admin-row__meta">' + (a.author ? escapeHtml(a.author) + ' &middot; ' : '') + new Date(a.created_at).toLocaleDateString('id-ID') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="admin-row__actions">' +
          '<button data-edit>Ubah</button>' +
          '<button data-delete class="danger">Hapus</button>' +
        '</div>' +
      '</div>'
    ).join('');

    wrap.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.admin-row').dataset.id;
        const item = state.articles.find(a => String(a.id) === id);
        if (!item) return;
        aId.value = item.id;
        aTitle.value = item.title;
        aAuthor.value = item.author || '';
        aExcerpt.value = item.excerpt || '';
        aBody.innerHTML = item.body || '';
        aCurrentImageUrl = item.image_url || null;
        aImageStatus.textContent = item.image_url ? 'Gambar saat ini akan dipakai kecuali Anda pilih file baru.' : '';
        aSubmit.textContent = 'Simpan perubahan';
        aCancel.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
    wrap.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const id = btn.closest('.admin-row').dataset.id;
          await sbQuery(sb.from('articles').delete().eq('id', id), 'articles-delete');
          await refreshPublicData();
          renderArticleAdminList();
        } catch (err) { alert(err.message); }
      });
    });
  }

  const karyaForm = document.querySelector('[data-karya-form]');
  const kId = document.querySelector('[data-k-id]');
  const kTitle = document.querySelector('[data-k-title]');
  const kCategory = document.querySelector('[data-k-category]');
  const kDesc = document.querySelector('[data-k-desc]');
  const kLink = document.querySelector('[data-k-link]');
  const kImage = document.querySelector('[data-k-image]');
  const kImageStatus = document.querySelector('[data-k-image-status]');
  const kSubmit = document.querySelector('[data-k-submit]');
  const kCancel = document.querySelector('[data-k-cancel]');
  let kCurrentImageUrl = null;

  function resetKaryaForm() {
    kId.value = '';
    kTitle.value = '';
    kCategory.value = '';
    kDesc.value = '';
    kLink.value = '';
    kImage.value = '';
    kImageStatus.textContent = '';
    kCurrentImageUrl = null;
    kSubmit.textContent = 'Tambah karya';
    kCancel.hidden = true;
  }

  karyaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = kTitle.value.trim();
    if (!title) return;
    setBusy(kSubmit, true, 'Menyimpan...');
    try {
      let imageUrl = kCurrentImageUrl;
      if (kImage.files && kImage.files[0]) {
        kImageStatus.textContent = 'Mengunggah gambar...';
        imageUrl = await uploadImage(kImage.files[0]);
      }
      const payload = {
        title,
        category: kCategory.value.trim(),
        description: kDesc.value.trim(),
        link: kLink.value.trim(),
        image_url: imageUrl
      };
      if (kId.value) {
        await sbQuery(sb.from('karya').update(payload).eq('id', kId.value), 'karya-update');
      } else {
        await sbQuery(sb.from('karya').insert(payload), 'karya-insert');
      }
      resetKaryaForm();
      await refreshPublicData();
      renderKaryaAdminList();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(kSubmit, false);
    }
  });

  kCancel.addEventListener('click', resetKaryaForm);

  function renderKaryaAdminList() {
    const wrap = document.querySelector('[data-karya-admin-list]');
    if (state.karya.length === 0) {
      wrap.innerHTML = '<p class="empty-note">Belum ada karya.</p>';
      return;
    }
    wrap.innerHTML = state.karya.map(k =>
      '<div class="admin-row" data-id="' + k.id + '">' +
        '<div class="admin-row__left">' +
          (k.image_url ? '<img class="admin-row__thumb" src="' + escapeHtml(k.image_url) + '" alt="">' : '') +
          '<div>' +
            '<div class="admin-row__title">' + escapeHtml(k.title) + '</div>' +
            '<div class="admin-row__meta">' + escapeHtml(k.category || '-') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="admin-row__actions">' +
          '<button data-edit>Ubah</button>' +
          '<button data-delete class="danger">Hapus</button>' +
        '</div>' +
      '</div>'
    ).join('');

    wrap.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.admin-row').dataset.id;
        const item = state.karya.find(k => String(k.id) === id);
        if (!item) return;
        kId.value = item.id;
        kTitle.value = item.title;
        kCategory.value = item.category || '';
        kDesc.value = item.description || '';
        kLink.value = item.link || '';
        kCurrentImageUrl = item.image_url || null;
        kImageStatus.textContent = item.image_url ? 'Gambar saat ini akan dipakai kecuali Anda pilih file baru.' : '';
        kSubmit.textContent = 'Simpan perubahan';
        kCancel.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
    wrap.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const id = btn.closest('.admin-row').dataset.id;
          await sbQuery(sb.from('karya').delete().eq('id', id), 'karya-delete');
          await refreshPublicData();
          renderKaryaAdminList();
        } catch (err) { alert(err.message); }
      });
    });
  }

  router();
})();
