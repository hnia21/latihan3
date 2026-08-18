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
  const ALLOWED_TAGS = new Set(['B','STRONG','I','EM','U','P','DIV','BR','UL','OL','LI','H2','H3','BLOCKQUOTE','A','SPAN','PRE','HR']);
  function sanitizeRichHtml(html) {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    (function clean(node) {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 1) {
          if (!ALLOWED_TAGS.has(child.tagName)) { const p = child.parentNode; while (child.firstChild) p.insertBefore(child.firstChild, child); p.removeChild(child); return; }
          [...child.attributes].forEach(a => { const n = a.name.toLowerCase(); if (n === 'style' && /text-align|font-size/.test(a.value)) return; if (child.tagName === 'A' && n === 'href') return; child.removeAttribute(a.name); });
          clean(child);
        } else if (child.nodeType !== 3) { node.removeChild(child); }
      });
    })(d);
    return d.innerHTML;
  }
  async function uploadImage(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const path = 'uploads/img_' + Date.now() + '_' + Math.round(Math.random() * 1e9) + '.' + ext;
    const { error } = await sb.storage.from(BUCKET_NAME).upload(path, file);
    if (error) throw new Error(error.message || 'Gagal mengunggah gambar.');
    const { data } = sb.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  }
  async function sbQuery(promise) {
    const { data, error } = await promise;
    if (error) throw new Error(error.message || 'Gagal menyimpan data.');
    return data;
  }

  let state = { profile: null, gallery: [], articles: [], karya: [], loggedIn: false };

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

  const viewLogin = document.getElementById('view-login');
  const viewAdmin = document.getElementById('view-admin');

  function $(c, s) { return c.querySelector(s); }
  function $all(c, s) { return c.querySelectorAll(s); }
  function setBusy(btn, busy, label) {
    if (busy) { btn.dataset.orig = btn.textContent; btn.textContent = label || 'Menyimpan...'; btn.disabled = true; }
    else      { btn.textContent = btn.dataset.orig || btn.textContent; btn.disabled = false; }
  }

  window.APP = { sb, state, router, $, $all, setBusy, VIEWS: window.ADMIN_VIEWS };

  async function router() {
    viewLogin.hidden = true;
    viewAdmin.hidden = true;
    await Auth.checkAuth();
    if (!state.loggedIn) { Auth.initLoginView(viewLogin); viewLogin.hidden = false; }
    else { await renderAdmin(); viewAdmin.hidden = false; }
  }

  // ── admin ──────────────────────────────────────────────────────────
  async function renderAdmin() {
    await Promise.all([refreshPublicData(), refreshCategories()]);
    viewAdmin.innerHTML = ADMIN_VIEWS.admin();
    initAdminTabs();
    Auth.logout(viewAdmin);
    initProfileForm();
    initGalleryForm();
    initArticleForm();
    initKaryaForm();
    initPasswordForm();
  }

  function initAdminTabs() {
    $all(viewAdmin, '.admin__tab').forEach(btn => {
      btn.addEventListener('click', () => {
        $all(viewAdmin, '.admin__tab').forEach(b => b.classList.remove('is-active'));
        $all(viewAdmin, '.admin__panel').forEach(p => p.classList.remove('is-active'));
        btn.classList.add('is-active');
        $(viewAdmin, '[data-panel="' + btn.dataset.tab + '"]').classList.add('is-active');
      });
    });
  }

  // ── profile ────────────────────────────────────────────────────────
  function initProfileForm() {
    const form = $(viewAdmin, '[data-profile-form]');
    const fInit = $(viewAdmin, '[data-f-initials]');
    const fName = $(viewAdmin, '[data-f-name]');
    const fRole = $(viewAdmin, '[data-f-role]');
    const fBio  = $(viewAdmin, '[data-f-bio]');
    const fLoc  = $(viewAdmin, '[data-f-location]');
    const fEmail= $(viewAdmin, '[data-f-email]');
    const saved = $(viewAdmin, '[data-profile-saved]');
    const p = state.profile || {};
    fInit.value = p.initials || '';
    fName.value = p.name || '';
    fRole.value = p.role || '';
    fBio.value  = p.bio || '';
    fLoc.value  = p.location || '';
    fEmail.value= p.email || '';
    saved.hidden = true;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      setBusy(btn, true);
      try {
        const payload = { initials: (fInit.value || 'ZP').slice(0,3).toUpperCase(), name: fName.value.trim() || 'Nama Anda', role: fRole.value.trim(), bio: fBio.value.trim(), location: fLoc.value.trim(), email: fEmail.value.trim() };
        if (state.profile && state.profile.id) state.profile = await sbQuery(sb.from('profile').update(payload).eq('id', state.profile.id).select().single());
        else state.profile = await sbQuery(sb.from('profile').insert(payload).select().single());
        saved.hidden = false;
      } catch (err) { alert(err.message); }
      finally { setBusy(btn, false); }
    });
  }

  // ── gallery ────────────────────────────────────────────────────────
  function initGalleryForm() {
    const form = $(viewAdmin, '[data-gallery-form]');
    const gTitle = $(viewAdmin, '[data-g-title]');
    const gCapt  = $(viewAdmin, '[data-g-caption]');
    const gImg   = $(viewAdmin, '[data-g-image]');
    const gStat  = $(viewAdmin, '[data-g-image-status]');
    const gSub   = $(viewAdmin, '[data-g-submit]');
    renderGalleryAdminList();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = gTitle.value.trim();
      if (!title) return;
      setBusy(gSub, true, 'Mengunggah...');
      try {
        let imageUrl = null;
        if (gImg.files && gImg.files[0]) { gStat.textContent = 'Mengunggah gambar...'; imageUrl = await uploadImage(gImg.files[0]); }
        await sbQuery(sb.from('gallery').insert({ title, caption: gCapt.value.trim(), image_url: imageUrl }));
        form.reset(); gStat.textContent = '';
        await refreshPublicData(); renderGalleryAdminList();
      } catch (err) { alert(err.message); }
      finally { setBusy(gSub, false); }
    });
  }
  function renderGalleryAdminList() {
    const wrap = $(viewAdmin, '[data-gallery-admin-list]');
    if (!wrap) return;
    if (state.gallery.length === 0) { wrap.innerHTML = '<p class="empty-note">Belum ada foto di galeri.</p>'; return; }
    wrap.innerHTML = state.gallery.map(g =>
      '<div class="admin-row" data-id="' + g.id + '">' +
        '<div class="admin-row__left">' + (g.image_url ? '<img class="admin-row__thumb" src="' + escapeHtml(g.image_url) + '" alt="">' : '') +
        '<div><div class="admin-row__title">' + escapeHtml(g.title) + '</div><div class="admin-row__meta">' + new Date(g.created_at).toLocaleDateString('id-ID') + '</div></div></div>' +
        '<div class="admin-row__actions"><button data-delete class="danger">Hapus</button></div></div>'
    ).join('');
    wrap.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try { await sbQuery(sb.from('gallery').delete().eq('id', btn.closest('.admin-row').dataset.id)); await refreshPublicData(); renderGalleryAdminList(); }
        catch (err) { alert(err.message); }
      });
    });
  }

  // ── categories (supabase) ──────────────────────────────────────
  let stateCategories = [];

  async function refreshCategories() {
    const { data, error } = await sb.from('article_categories').select('*').order('name');
    if (!error) stateCategories = data || [];
  }

  async function addCategory(name) {
    const { error } = await sb.from('article_categories').insert({ name });
    if (error) throw new Error(error.message);
    await refreshCategories();
  }

  async function updateCategory(id, name) {
    const { error } = await sb.from('article_categories').update({ name }).eq('id', id);
    if (error) throw new Error(error.message);
    await refreshCategories();
  }

  async function deleteCategory(id) {
    const { error } = await sb.from('article_categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await refreshCategories();
  }

  function renderCatSelect(selectEl) {
    const val = selectEl.value;
    selectEl.innerHTML = '<option value="">Pilih kategori...</option>' +
      stateCategories.map(c => '<option value="' + escapeHtml(c.name) + '">' + escapeHtml(c.name) + '</option>').join('');
    if (val) selectEl.value = val;
  }

  function renderCatList(listEl) {
    if (stateCategories.length === 0) { listEl.innerHTML = '<p class="empty-note">Belum ada kategori.</p>'; return; }
    listEl.innerHTML = stateCategories.map(c =>
      '<div class="cat-row" data-id="' + c.id + '">' +
        '<span>' + escapeHtml(c.name) + '</span>' +
        '<div class="cat-row__actions">' +
          '<button type="button" class="btn btn--sm btn--ghost" data-cat-edit title="Ubah"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
          '<button type="button" class="btn btn--sm btn--ghost danger" data-cat-del title="Hapus"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
        '</div></div>'
    ).join('');
    listEl.querySelectorAll('[data-cat-edit]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.closest('.cat-row').dataset.id);
        const cat = stateCategories.find(c => c.id === id);
        if (!cat) return;
        const newName = prompt('Ubah nama kategori:', cat.name);
        if (newName && newName.trim() && newName.trim() !== cat.name) {
          try { await updateCategory(id, newName.trim()); renderCatList(listEl); renderCatSelect($(viewAdmin, '[data-a-category]')); }
          catch (err) { alert(err.message); }
        }
      });
    });
    listEl.querySelectorAll('[data-cat-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.closest('.cat-row').dataset.id);
        if (!confirm('Hapus kategori ini?')) return;
        try { await deleteCategory(id); renderCatList(listEl); renderCatSelect($(viewAdmin, '[data-a-category]')); }
        catch (err) { alert(err.message); }
      });
    });
  }

  // ── article ────────────────────────────────────────────────────────
  function initArticleForm() {
    const form = $(viewAdmin, '[data-article-form]');
    const aId = $(viewAdmin, '[data-a-id]');
    const aTitle = $(viewAdmin, '[data-a-title]');
    const aAuth  = $(viewAdmin, '[data-a-author]');
    const aCat   = $(viewAdmin, '[data-a-category]');
    const aExc   = $(viewAdmin, '[data-a-excerpt]');
    const aBody  = $(viewAdmin, '[data-a-body]');
    const aToolbar = $(viewAdmin, '[data-a-toolbar]');
    const aImg   = $(viewAdmin, '[data-a-image]');
    const aStat  = $(viewAdmin, '[data-a-image-status]');
    const aSub   = $(viewAdmin, '[data-a-submit]');
    const aCancel= $(viewAdmin, '[data-a-cancel]');
    let aCurImg  = null;

    renderCatSelect(aCat);

    const catManager = $(viewAdmin, '[data-cat-manager]');
    const catList = $(viewAdmin, '[data-cat-list]');
    const catInput = $(viewAdmin, '[data-cat-input]');
    $(viewAdmin, '[data-cat-manage]')?.addEventListener('click', async () => { catManager.hidden = !catManager.hidden; if (!catManager.hidden) { await refreshCategories(); renderCatList(catList); } });
    $(viewAdmin, '[data-cat-close]')?.addEventListener('click', () => { catManager.hidden = true; });
    $(viewAdmin, '[data-cat-add]')?.addEventListener('click', async () => {
      const v = catInput.value.trim(); if (!v) return;
      if (stateCategories.some(c => c.name === v)) { alert('Kategori sudah ada.'); return; }
      try { await addCategory(v); catInput.value = ''; renderCatList(catList); renderCatSelect(aCat); }
      catch (err) { alert(err.message); }
    });
    catInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $(viewAdmin, '[data-cat-add]')?.click(); } });

    renderArticleAdminList();
    if (aToolbar) {
      aToolbar.addEventListener('click', e => {
        const btn = e.target.closest('[data-cmd]');
        if (!btn) return; e.preventDefault(); aBody.focus();
        const cmd = btn.dataset.cmd;
        if (cmd === 'formatBlockH2') document.execCommand('formatBlock', false, 'H2');
        else if (cmd === 'formatBlockH3') document.execCommand('formatBlock', false, 'H3');
        else if (cmd === 'formatBlockQuote') document.execCommand('formatBlock', false, 'BLOCKQUOTE');
        else if (cmd === 'formatBlockPre') document.execCommand('formatBlock', false, 'PRE');
        else if (cmd === 'createLink') {
          const url = prompt('Masukkan URL tautan:', 'https://');
          if (url) document.execCommand('createLink', false, url);
        }
        else if (cmd === 'fontSizeUp') changeFontSize(aBody, 1);
        else if (cmd === 'fontSizeDown') changeFontSize(aBody, -1);
        else document.execCommand(cmd, false, null);
        syncToolbar(aToolbar);
      });
    }

    if (aBody) {
      aBody.addEventListener('keyup', () => syncToolbar(aToolbar));
      aBody.addEventListener('mouseup', () => syncToolbar(aToolbar));
      aBody.addEventListener('focus', () => syncToolbar(aToolbar));
      aBody.addEventListener('paste', e => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      });
      aBody.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          document.execCommand('insertParagraph', false, null);
        }
      });
    }

    function resetForm() { aId.value=''; aTitle.value=''; aAuth.value=''; aCat.value=''; aExc.value=''; aBody.innerHTML=''; aImg.value=''; aStat.textContent=''; aCurImg=null; aSub.textContent='Tambah artikel'; aCancel.hidden=true; }
    aCancel.addEventListener('click', resetForm);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = aTitle.value.trim();
      if (!title) return;
      setBusy(aSub, true, 'Menyimpan...');
      try {
        let imageUrl = aCurImg;
        if (aImg.files && aImg.files[0]) { aStat.textContent = 'Mengunggah gambar...'; imageUrl = await uploadImage(aImg.files[0]); }
        const payload = { title, author: aAuth.value.trim(), category: aCat.value.trim(), excerpt: aExc.value.trim(), body: sanitizeRichHtml(aBody.innerHTML.trim()), image_url: imageUrl };
        if (aId.value) await sbQuery(sb.from('articles').update(payload).eq('id', aId.value));
        else await sbQuery(sb.from('articles').insert(payload));
        resetForm(); await refreshPublicData(); renderArticleAdminList();
      } catch (err) { alert(err.message); }
      finally { setBusy(aSub, false); }
    });
    const listWrap = $(viewAdmin, '[data-article-admin-list]');
    listWrap.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-edit]');
      if (btn) {
        const id = btn.closest('.admin-row').dataset.id;
        const item = state.articles.find(a => String(a.id) === id);
        if (!item) return;
        aId.value=item.id; aTitle.value=item.title; aAuth.value=item.author||''; aCat.value=item.category||''; aExc.value=item.excerpt||''; aBody.innerHTML=item.body||'';
        aCurImg=item.image_url||null; aStat.textContent=item.image_url?'Gambar saat ini akan dipakai kecuali Anda pilih file baru.':'';
        aSub.textContent='Simpan perubahan'; aCancel.hidden=false; window.scrollTo({top:0,behavior:'smooth'}); return;
      }
      const del = e.target.closest('[data-delete]');
      if (del) { try { await sbQuery(sb.from('articles').delete().eq('id', del.closest('.admin-row').dataset.id)); await refreshPublicData(); renderArticleAdminList(); } catch (err) { alert(err.message); } }
    });
  }

  function changeFontSize(container, dir) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const fontSizes = [1, 2, 3, 4, 5, 6, 7];
    let currentSize = 3;
    try { currentSize = parseInt(document.queryCommandValue('fontSize')) || 3; } catch (_) {}
    const idx = fontSizes.indexOf(currentSize);
    const next = fontSizes[Math.max(0, Math.min(fontSizes.length - 1, idx + dir))];
    document.execCommand('fontSize', false, String(next));
    container.querySelectorAll('font[size]').forEach(f => {
      const s = f.getAttribute('size');
      const px = { '1': '12px', '2': '14px', '3': '16px', '4': '18px', '5': '22px', '6': '28px', '7': '36px' }[s] || '16px';
      const span = document.createElement('span');
      span.style.fontSize = px;
      span.innerHTML = f.innerHTML;
      f.parentNode.replaceChild(span, f);
    });
  }
  function syncToolbar(toolbar) {
    if (!toolbar) return;
    toolbar.querySelectorAll('[data-cmd]').forEach(btn => {
      const cmd = btn.dataset.cmd; let active = false;
      try { if (['bold','italic','underline','strikeThrough','justifyLeft','justifyCenter','justifyRight','justifyFull','insertUnorderedList','insertOrderedList'].includes(cmd)) active = document.queryCommandState(cmd); } catch (_) {}
      btn.classList.toggle('is-active', active);
    });
  }
  function renderArticleAdminList() {
    const wrap = $(viewAdmin, '[data-article-admin-list]');
    if (!wrap) return;
    if (state.articles.length === 0) { wrap.innerHTML = '<p class="empty-note">Belum ada artikel.</p>'; return; }
    wrap.innerHTML = state.articles.map(a =>
      '<div class="admin-row" data-id="' + a.id + '">' +
        '<div class="admin-row__left">' + (a.image_url ? '<img class="admin-row__thumb" src="' + escapeHtml(a.image_url) + '" alt="">' : '') +
        '<div><div class="admin-row__title">' + escapeHtml(a.title) + '</div><div class="admin-row__meta">' + (a.category ? '<span class="admin-row__tag">' + escapeHtml(a.category) + '</span> ' : '') + (a.author ? escapeHtml(a.author)+' &middot; ' : '') + new Date(a.created_at).toLocaleDateString('id-ID') + '</div></div></div>' +
        '<div class="admin-row__actions"><button data-edit>Ubah</button><button data-delete class="danger">Hapus</button></div></div>'
    ).join('');
  }

  // ── karya ──────────────────────────────────────────────────────────
  function initKaryaForm() {
    const form = $(viewAdmin, '[data-karya-form]');
    const kId = $(viewAdmin, '[data-k-id]');
    const kTitle = $(viewAdmin, '[data-k-title]');
    const kCat   = $(viewAdmin, '[data-k-category]');
    const kDesc  = $(viewAdmin, '[data-k-desc]');
    const kLink  = $(viewAdmin, '[data-k-link]');
    const kImg   = $(viewAdmin, '[data-k-image]');
    const kStat  = $(viewAdmin, '[data-k-image-status]');
    const kSub   = $(viewAdmin, '[data-k-submit]');
    const kCancel= $(viewAdmin, '[data-k-cancel]');
    let kCurImg  = null;
    renderKaryaAdminList();
    function resetForm() { kId.value=''; kTitle.value=''; kCat.value=''; kDesc.value=''; kLink.value=''; kImg.value=''; kStat.textContent=''; kCurImg=null; kSub.textContent='Tambah karya'; kCancel.hidden=true; }
    kCancel.addEventListener('click', resetForm);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = kTitle.value.trim();
      if (!title) return;
      setBusy(kSub, true, 'Menyimpan...');
      try {
        let imageUrl = kCurImg;
        if (kImg.files && kImg.files[0]) { kStat.textContent = 'Mengunggah gambar...'; imageUrl = await uploadImage(kImg.files[0]); }
        const payload = { title, category: kCat.value.trim(), description: kDesc.value.trim(), link: kLink.value.trim(), image_url: imageUrl };
        if (kId.value) await sbQuery(sb.from('karya').update(payload).eq('id', kId.value));
        else await sbQuery(sb.from('karya').insert(payload));
        resetForm(); await refreshPublicData(); renderKaryaAdminList();
      } catch (err) { alert(err.message); }
      finally { setBusy(kSub, false); }
    });
    const listWrap = $(viewAdmin, '[data-karya-admin-list]');
    listWrap.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-edit]');
      if (btn) {
        const id = btn.closest('.admin-row').dataset.id;
        const item = state.karya.find(k => String(k.id) === id);
        if (!item) return;
        kId.value=item.id; kTitle.value=item.title; kCat.value=item.category||''; kDesc.value=item.description||''; kLink.value=item.link||'';
        kCurImg=item.image_url||null; kStat.textContent=item.image_url?'Gambar saat ini akan dipakai kecuali Anda pilih file baru.':'';
        kSub.textContent='Simpan perubahan'; kCancel.hidden=false; window.scrollTo({top:0,behavior:'smooth'}); return;
      }
      const del = e.target.closest('[data-delete]');
      if (del) { try { await sbQuery(sb.from('karya').delete().eq('id', del.closest('.admin-row').dataset.id)); await refreshPublicData(); renderKaryaAdminList(); } catch (err) { alert(err.message); } }
    });
  }
  function renderKaryaAdminList() {
    const wrap = $(viewAdmin, '[data-karya-admin-list]');
    if (!wrap) return;
    if (state.karya.length === 0) { wrap.innerHTML = '<p class="empty-note">Belum ada karya.</p>'; return; }
    wrap.innerHTML = state.karya.map(k =>
      '<div class="admin-row" data-id="' + k.id + '">' +
        '<div class="admin-row__left">' + (k.image_url ? '<img class="admin-row__thumb" src="' + escapeHtml(k.image_url) + '" alt="">' : '') +
        '<div><div class="admin-row__title">' + escapeHtml(k.title) + '</div><div class="admin-row__meta">' + escapeHtml(k.category||'-') + '</div></div></div>' +
        '<div class="admin-row__actions"><button data-edit>Ubah</button><button data-delete class="danger">Hapus</button></div></div>'
    ).join('');
  }

  // ── password ────────────────────────────────────────────────────
  function initPasswordForm() {
    const form    = $(viewAdmin, '[data-password-form]');
    const newPw   = $(viewAdmin, '[data-pw-new]');
    const confirm = $(viewAdmin, '[data-pw-confirm]');
    const err     = $(viewAdmin, '[data-pw-error]');
    const saved   = $(viewAdmin, '[data-pw-saved]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.hidden = true;
      saved.hidden = true;
      if (newPw.value.length < 6) {
        err.textContent = 'Kata sandi minimal 6 karakter.';
        err.hidden = false;
        return;
      }
      if (newPw.value !== confirm.value) {
        err.textContent = 'Konfirmasi kata sandi tidak cocok.';
        err.hidden = false;
        return;
      }
      const btn = form.querySelector('button[type="submit"]');
      setBusy(btn, true, 'Menyimpan...');
      try {
        const { error } = await sb.auth.updateUser({ password: newPw.value });
        if (error) throw new Error(error.message);
        saved.hidden = false;
        newPw.value = '';
        confirm.value = '';
      } catch (ex) {
        err.textContent = ex.message;
        err.hidden = false;
      } finally {
        setBusy(btn, false);
      }
    });
  }

  router();
})();
