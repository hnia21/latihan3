(() => {
  'use strict';

  /* ==========================================================
     HELPER API
     Semua data sekarang disimpan di MySQL lewat backend Express
     (folder /server). Frontend ini hanya memanggil endpoint
     /api/... -- tidak ada lagi localStorage untuk konten.
     ========================================================== */
  async function api(method, url, body) {
    const opts = {
      method,
      credentials: 'include',
      headers: {}
    };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    let json = null;
    try { json = await res.json(); } catch (e) { /* respons kosong */ }
    if (!res.ok) {
      throw new Error((json && json.error) || 'Terjadi kesalahan pada server.');
    }
    return json;
  }

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal mengunggah gambar.');
    return json.url;
  }

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

  // Daftar tag & atribut yang diizinkan dari editor kaya (rich text)
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

  /* ==========================================================
     STATE LOKAL (cache hasil fetch supaya tidak fetch berulang
     saat pindah tab admin / render ulang)
     ========================================================== */
  let state = {
    profile: null,
    gallery: [],
    articles: [],
    karya: []
  };

  async function refreshPublicData() {
    const [profile, gallery, articles, karya] = await Promise.all([
      api('GET', '/api/profile'),
      api('GET', '/api/gallery'),
      api('GET', '/api/articles'),
      api('GET', '/api/karya')
    ]);
    state = { profile, gallery, articles, karya };
  }

  /* ==========================================================
     ROUTING
     ========================================================== */
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
      const status = await api('GET', '/api/auth/status');
      if (!status.loggedIn) {
        renderLoginView(status.passwordSet);
        viewLogin.hidden = false;
      } else {
        await renderAdmin();
        viewAdmin.hidden = false;
      }
      return;
    }

    const articleMatch = route.match(/^\/artikel\/(.+)$/);
    if (articleMatch) {
      try {
        const article = await api('GET', '/api/articles/' + articleMatch[1]);
        renderArticleDetail(article);
        viewArticle.hidden = false;
        window.scrollTo({ top: 0 });
        return;
      } catch (e) {
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

  /* ==========================================================
     AKSES ADMIN TERSEMBUNYI
     Tombol/tautan admin sengaja tidak ditampilkan di halaman
     publik. Untuk masuk, klik lencana "ZP" di pojok kiri atas
     sebanyak 5 kali berturut-turut, atau tekan Ctrl+Alt+A.
     ========================================================== */
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

  /* ==========================================================
     ANIMASI REVEAL SAAT SCROLL
     ========================================================== */
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

  /* ==========================================================
     RENDER: HALAMAN PUBLIK
     ========================================================== */
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

    // Galeri
    const galleryList = document.querySelector('[data-gallery-list]');
    if (state.gallery.length === 0) {
      galleryList.innerHTML = '<p class="empty-note">Belum ada foto di galeri. Tambahkan lewat panel admin.</p>';
    } else {
      galleryList.innerHTML = state.gallery.map((g, i) => `
        <div class="gallery-item" data-reveal style="transition-delay:${Math.min(i, 6) * 60}ms">
          ${g.image_url
            ? `<img src="${escapeHtml(g.image_url)}" alt="${escapeHtml(g.title)}" loading="lazy">`
            : `<div class="gallery-item--empty">${escapeHtml((g.title || '?').charAt(0).toUpperCase())}</div>`}
          <div class="gallery-item__caption">${escapeHtml(g.caption || g.title)}</div>
        </div>
      `).join('');
    }

    // Artikel
    const articleList = document.querySelector('[data-article-list]');
    if (state.articles.length === 0) {
      articleList.innerHTML = '<p class="empty-note">Belum ada artikel. Tambahkan lewat panel admin.</p>';
    } else {
      articleList.innerHTML = state.articles.map((a, i) => `
        <article class="stub-card" data-reveal style="transition-delay:${Math.min(i, 6) * 60}ms">
          ${a.image_url ? `<img class="stub-card__image" src="${escapeHtml(a.image_url)}" alt="${escapeHtml(a.title)}" loading="lazy">` : ''}
          <div class="stub-card__content">
            <p class="stub-card__tag">Artikel${a.author ? ` &middot; ${escapeHtml(a.author)}` : ''}</p>
            <h3>${escapeHtml(a.title)}</h3>
            <p>${escapeHtml(a.excerpt || stripHtml(a.body).slice(0, 120))}</p>
            <a class="stub-card__link" href="#/artikel/${a.id}">Baca selengkapnya</a>
          </div>
        </article>
      `).join('');
    }

    // Karya
    const karyaList = document.querySelector('[data-karya-list]');
    if (state.karya.length === 0) {
      karyaList.innerHTML = '<p class="empty-note">Belum ada karya. Tambahkan lewat panel admin.</p>';
    } else {
      karyaList.innerHTML = state.karya.map((k, i) => `
        <article class="stub-card" data-reveal style="transition-delay:${Math.min(i, 6) * 60}ms">
          ${k.image_url ? `<img class="stub-card__image" src="${escapeHtml(k.image_url)}" alt="${escapeHtml(k.title)}" loading="lazy">` : ''}
          <div class="stub-card__content">
            <p class="stub-card__tag">${escapeHtml(k.category || 'Karya')}</p>
            <h3>${escapeHtml(k.title)}</h3>
            <p>${escapeHtml(k.description || '')}</p>
            ${k.link ? `<a class="stub-card__link" href="${escapeHtml(k.link)}" target="_blank" rel="noopener">Lihat karya</a>` : ''}
          </div>
        </article>
      `).join('');
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
    // Dukung artikel lama (plain text) maupun baru (HTML dari editor)
    if (/<[a-z][\s\S]*>/i.test(body)) {
      bodyEl.innerHTML = sanitizeRichHtml(body);
    } else {
      bodyEl.textContent = body;
    }
    document.title = article.title;
  }

  /* ==========================================================
     RENDER: LOGIN / SETUP KATA SANDI PERTAMA KALI
     ========================================================== */
  const loginForm = document.querySelector('[data-login-form]');
  const passwordInput = document.querySelector('[data-password-input]');
  const confirmField = document.querySelector('[data-confirm-field]');
  const confirmInput = document.querySelector('[data-confirm-input]');
  const loginError = document.querySelector('[data-login-error]');
  const loginSubmit = document.querySelector('[data-login-submit]');
  const authTitle = document.querySelector('[data-auth-title]');
  const authDesc = document.querySelector('[data-auth-desc]');
  const authEyebrow = document.querySelector('[data-auth-eyebrow]');

  function renderLoginView(passwordSet) {
    loginError.hidden = true;
    passwordInput.value = '';
    confirmInput.value = '';

    if (!passwordSet) {
      authEyebrow.textContent = '005 — Siapkan akses admin';
      authTitle.textContent = 'Buat kata sandi';
      authDesc.textContent = 'Ini pertama kalinya panel admin dibuka. Buat kata sandi untuk mengamankannya.';
      confirmField.hidden = false;
      confirmInput.required = true;
      loginSubmit.textContent = 'Buat & masuk';
    } else {
      authEyebrow.textContent = '005 — Akses admin';
      authTitle.textContent = 'Masuk';
      authDesc.textContent = 'Masukkan kata sandi untuk mengelola konten.';
      confirmField.hidden = true;
      confirmInput.required = false;
      loginSubmit.textContent = 'Masuk';
    }
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
      const status = await api('GET', '/api/auth/status');
      if (!status.passwordSet) {
        if (pw !== confirmInput.value) {
          loginError.textContent = 'Kata sandi tidak sama. Coba lagi.';
          loginError.hidden = false;
          return;
        }
        await api('POST', '/api/auth/setup', { password: pw, confirm: confirmInput.value });
      } else {
        await api('POST', '/api/auth/login', { password: pw });
      }
      location.hash = '#/admin';
      router();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.hidden = false;
    }
  });

  document.querySelector('[data-logout]').addEventListener('click', async () => {
    await api('POST', '/api/auth/logout');
    location.hash = '#/';
    router();
  });

  /* ==========================================================
     RENDER: PANEL ADMIN
     ========================================================== */
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
      document.querySelector(`[data-panel="${btn.dataset.tab}"]`).classList.add('is-active');
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

  // --- Profil ---
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
      state.profile = await api('PUT', '/api/profile', {
        initials: (fInitials.value || 'ZP').slice(0, 3).toUpperCase(),
        name: fName.value.trim() || 'Nama Anda',
        role: fRole.value.trim(),
        bio: fBio.value.trim(),
        location: fLocation.value.trim(),
        email: fEmail.value.trim()
      });
      profileSaved.hidden = false;
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(submitBtn, false);
    }
  });

  // --- Galeri CRUD ---
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
      await api('POST', '/api/gallery', { title, caption: gCaption.value.trim(), image_url: imageUrl });
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
    wrap.innerHTML = state.gallery.map(g => `
      <div class="admin-row" data-id="${g.id}">
        <div class="admin-row__left">
          ${g.image_url ? `<img class="admin-row__thumb" src="${escapeHtml(g.image_url)}" alt="">` : ''}
          <div>
            <div class="admin-row__title">${escapeHtml(g.title)}</div>
            <div class="admin-row__meta">${new Date(g.created_at).toLocaleDateString('id-ID')}</div>
          </div>
        </div>
        <div class="admin-row__actions">
          <button data-delete class="danger">Hapus</button>
        </div>
      </div>
    `).join('');

    wrap.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('.admin-row').dataset.id;
        await api('DELETE', '/api/gallery/' + id);
        await refreshPublicData();
        renderGalleryAdminList();
      });
    });
  }

  // --- Artikel CRUD ---
  const articleForm = document.querySelector('[data-article-form]');
  const aId = document.querySelector('[data-a-id]');
  const aTitle = document.querySelector('[data-a-title]');
  const aAuthor = document.querySelector('[data-a-author]');
  const aExcerpt = document.querySelector('[data-a-excerpt]');
  const aBody = document.querySelector('[data-a-body]'); // contenteditable div
  const aToolbar = document.querySelector('[data-a-toolbar]');
  const aImage = document.querySelector('[data-a-image]');
  const aImageStatus = document.querySelector('[data-a-image-status]');
  const aSubmit = document.querySelector('[data-a-submit]');
  const aCancel = document.querySelector('[data-a-cancel]');
  let aCurrentImageUrl = null;

  // Toolbar editor kaya: bold, italic, underline, rata kiri/tengah/kanan, dsb.
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
      } catch (err) { /* abaikan */ }
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
    setBusy(aSubmit, true, 'Menyimpan...');
    try {
      let imageUrl = aCurrentImageUrl;
      if (aImage.files && aImage.files[0]) {
        aImageStatus.textContent = 'Mengunggah gambar...';
        imageUrl = await uploadImage(aImage.files[0]);
      }
      const payload = {
        title,
        author: aAuthor.value.trim(),
        excerpt: aExcerpt.value.trim(),
        body: sanitizeRichHtml(aBody.innerHTML.trim()),
        image_url: imageUrl
      };
      if (aId.value) {
        await api('PUT', '/api/articles/' + aId.value, payload);
      } else {
        await api('POST', '/api/articles', payload);
      }
      resetArticleForm();
      await refreshPublicData();
      renderArticleAdminList();
    } catch (err) {
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
    wrap.innerHTML = state.articles.map(a => `
      <div class="admin-row" data-id="${a.id}">
        <div class="admin-row__left">
          ${a.image_url ? `<img class="admin-row__thumb" src="${escapeHtml(a.image_url)}" alt="">` : ''}
          <div>
            <div class="admin-row__title">${escapeHtml(a.title)}</div>
            <div class="admin-row__meta">${a.author ? escapeHtml(a.author) + ' &middot; ' : ''}${new Date(a.created_at).toLocaleDateString('id-ID')}</div>
          </div>
        </div>
        <div class="admin-row__actions">
          <button data-edit>Ubah</button>
          <button data-delete class="danger">Hapus</button>
        </div>
      </div>
    `).join('');

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
        const id = btn.closest('.admin-row').dataset.id;
        await api('DELETE', '/api/articles/' + id);
        await refreshPublicData();
        renderArticleAdminList();
      });
    });
  }

  // --- Karya CRUD ---
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
        await api('PUT', '/api/karya/' + kId.value, payload);
      } else {
        await api('POST', '/api/karya', payload);
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
    wrap.innerHTML = state.karya.map(k => `
      <div class="admin-row" data-id="${k.id}">
        <div class="admin-row__left">
          ${k.image_url ? `<img class="admin-row__thumb" src="${escapeHtml(k.image_url)}" alt="">` : ''}
          <div>
            <div class="admin-row__title">${escapeHtml(k.title)}</div>
            <div class="admin-row__meta">${escapeHtml(k.category || '-')}</div>
          </div>
        </div>
        <div class="admin-row__actions">
          <button data-edit>Ubah</button>
          <button data-delete class="danger">Hapus</button>
        </div>
      </div>
    `).join('');

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
        const id = btn.closest('.admin-row').dataset.id;
        await api('DELETE', '/api/karya/' + id);
        await refreshPublicData();
        renderKaryaAdminList();
      });
    });
  }

  /* ==========================================================
     MULAI
     ========================================================== */
  router();
})();