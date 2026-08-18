window.ADMIN_VIEWS = {
  login: () => `
  <section class="auth">
    <div class="auth__card">
      <p class="auth__eyebrow">Akses admin</p>
      <h1>Masuk</h1>
      <p class="auth__desc">Masukkan kata sandi untuk mengelola konten.</p>
      <form data-login-form>
        <label class="field">
          <span>Email</span>
          <input type="email" data-email-input placeholder="email@contoh.com" autocomplete="email" required>
        </label>
        <label class="field">
          <span>Kata sandi</span>
          <input type="password" data-password-input autocomplete="current-password" required>
        </label>
        <p class="field-error" data-login-error hidden></p>
        <button type="submit" class="btn btn--primary" data-login-submit>Masuk</button>
      </form>
      <a href="index.html" class="auth__back">Kembali ke situs</a>
    </div>
  </section>`,

  admin: () => `
  <section class="admin">
    <aside class="admin__side">
      <p class="admin__eyebrow">Panel admin</p>
      <nav class="admin__nav">
        <button data-tab="profil" class="admin__tab is-active">Profil</button>
        <button data-tab="galeri" class="admin__tab">Galeri</button>
        <button data-tab="artikel" class="admin__tab">Artikel</button>
        <button data-tab="karya" class="admin__tab">Karya</button>
        <button data-tab="keamanan" class="admin__tab">Keamanan</button>
      </nav>
      <button class="btn btn--ghost admin__logout" data-logout>Keluar</button>
    </aside>

    <div class="admin__body">

      <div class="admin__panel is-active" data-panel="profil">
        <h2>Profil</h2>
        <form data-profile-form class="stack">
          <label class="field">
            <span>Inisial (untuk lencana)</span>
            <input type="text" data-f-initials maxlength="3">
          </label>
          <label class="field">
            <span>Nama lengkap</span>
            <input type="text" data-f-name required>
          </label>
          <label class="field">
            <span>Peran / profesi</span>
            <input type="text" data-f-role placeholder="misal: Desainer Produk">
          </label>
          <label class="field">
            <span>Bio singkat</span>
            <textarea data-f-bio rows="4"></textarea>
          </label>
          <div class="field-row">
            <label class="field">
              <span>Lokasi</span>
              <input type="text" data-f-location placeholder="misal: Malang, Indonesia">
            </label>
            <label class="field">
              <span>Email</span>
              <input type="email" data-f-email placeholder="nama@email.com">
            </label>
          </div>
          <button type="submit" class="btn btn--primary">Simpan profil</button>
          <p class="save-note" data-profile-saved hidden>Profil disimpan.</p>
        </form>
      </div>

      <div class="admin__panel" data-panel="galeri">
        <h2>Galeri</h2>
        <form data-gallery-form class="stack">
          <label class="field">
            <span>Judul foto</span>
            <input type="text" data-g-title required>
          </label>
          <label class="field">
            <span>Keterangan (opsional)</span>
            <input type="text" data-g-caption>
          </label>
          <label class="field">
            <span>Gambar (opsional)</span>
            <input type="file" accept="image/*" data-g-image>
            <span class="field-hint" data-g-image-status></span>
          </label>
          <button type="submit" class="btn btn--primary" data-g-submit>Tambah ke galeri</button>
        </form>
        <div class="admin-list" data-gallery-admin-list></div>
      </div>

      <div class="admin__panel" data-panel="artikel">
        <h2>Artikel</h2>
        <form data-article-form class="stack stack--wide">
          <input type="hidden" data-a-id>
          <div class="field-row">
            <label class="field">
              <span>Judul</span>
              <input type="text" data-a-title required>
            </label>
            <label class="field">
              <span>Penulis</span>
              <input type="text" data-a-author placeholder="misal: Zidan Pratama">
            </label>
          </div>
          <div class="field-row">
            <div class="field">
              <span>Kategori</span>
              <div class="cat-select">
                <select data-a-category>
                  <option value="">Pilih kategori...</option>
                </select>
                <button type="button" class="btn btn--sm btn--ghost" data-cat-manage title="Kelola kategori">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>
              </div>
            </div>
            <label class="field">
              <span>Gambar sampul</span>
              <input type="file" accept="image/*" data-a-image>
              <span class="field-hint" data-a-image-status></span>
            </label>
          </div>
          <label class="field">
            <span>Ringkasan</span>
            <textarea data-a-excerpt rows="3"></textarea>
          </label>
          <label class="field">
            <span>Isi artikel</span>
            <div class="editor" data-a-editor-wrap>
              <div class="editor__toolbar" data-a-toolbar>
                <button type="button" class="editor__btn" data-cmd="bold" title="Tebal (Ctrl+B)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg></button>
                <button type="button" class="editor__btn" data-cmd="italic" title="Miring (Ctrl+I)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></button>
                <button type="button" class="editor__btn" data-cmd="underline" title="Garis bawah (Ctrl+U)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg></button>
                <button type="button" class="editor__btn" data-cmd="strikeThrough" title="Coret (Strikethrough)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 4H9a3 3 0 0 0-3 3c0 1.4.8 2.6 2 3.2"/><line x1="4" y1="12" x2="20" y2="12"/><path d="M15 12c1.2.6 2 1.8 2 3.2a3 3 0 0 1-3 3H8"/></svg></button>
                <span class="editor__sep"></span>
                <button type="button" class="editor__btn" data-cmd="justifyLeft" title="Rata kiri"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg></button>
                <button type="button" class="editor__btn" data-cmd="justifyCenter" title="Rata tengah"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>
                <button type="button" class="editor__btn" data-cmd="justifyRight" title="Rata kanan"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg></button>
                <button type="button" class="editor__btn" data-cmd="justifyFull" title="Rata kanan-kiri"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
                <span class="editor__sep"></span>
                <button type="button" class="editor__btn" data-cmd="insertUnorderedList" title="Daftar bullet"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg></button>
                <button type="button" class="editor__btn" data-cmd="insertOrderedList" title="Daftar bernomor"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" font-size="7" font-weight="600" fill="currentColor" stroke="none">1</text><text x="2" y="14" font-size="7" font-weight="600" fill="currentColor" stroke="none">2</text><text x="2" y="20" font-size="7" font-weight="600" fill="currentColor" stroke="none">3</text></svg></button>
                <span class="editor__sep"></span>
                <button type="button" class="editor__btn" data-cmd="formatBlockH2" title="Judul 2"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17 12l3-2v10"/></svg></button>
                <button type="button" class="editor__btn" data-cmd="formatBlockH3" title="Judul 3"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17.5 10.5c.83-.83 2.17-.83 3 0 .83.83.83 2.17 0 3-.5.5-1.5.5-2 0h-1"/><path d="M17.5 16.5c.83-.83 2.17-.83 3 0 .83.83.83 2.17 0 3-.5.5-1.5.5-2 0h-1"/></svg></button>
                <button type="button" class="editor__btn" data-cmd="formatBlockQuote" title="Kutipan"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 .001 0 1.003 1 1.003z"/></svg></button>
                <button type="button" class="editor__btn" data-cmd="formatBlockPre" title="Kode"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></button>
                <button type="button" class="editor__btn" data-cmd="insertHorizontalRule" title="Garis pemisah"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/></svg></button>
                <span class="editor__sep"></span>
                <button type="button" class="editor__btn" data-cmd="fontSizeUp" title="Perbesar teks"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 14h6"/><path d="M12 11v6"/></svg></button>
                <button type="button" class="editor__btn" data-cmd="fontSizeDown" title="Perkecil teks"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 14h6"/></svg></button>
                <span class="editor__sep"></span>
                <button type="button" class="editor__btn" data-cmd="createLink" title="Sisipkan tautan"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
                <button type="button" class="editor__btn" data-cmd="removeFormat" title="Hapus format"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="4" x2="20" y2="20"/><path d="M9 9l3 3"/><path d="M15 9l-3 3"/><path d="M6 12h12"/></svg></button>
              </div>
              <div class="editor__area" data-a-body contenteditable="true" data-placeholder="Tulis isi artikel di sini..."></div>
            </div>
          </label>
          <div class="form-actions">
            <button type="submit" class="btn btn--primary" data-a-submit>Tambah artikel</button>
            <button type="button" class="btn btn--ghost" data-a-cancel hidden>Batal edit</button>
          </div>
        </form>

        <div class="cat-manager" data-cat-manager hidden>
          <div class="cat-manager__header">
            <h3>Kelola Kategori</h3>
            <button type="button" class="btn btn--sm btn--ghost" data-cat-close>&times;</button>
          </div>
          <div class="cat-manager__add">
            <input type="text" data-cat-input placeholder="Nama kategori baru...">
            <button type="button" class="btn btn--sm btn--primary" data-cat-add>Tambah</button>
          </div>
          <div class="cat-manager__list" data-cat-list></div>
        </div>

        <div class="admin-list" data-article-admin-list></div>
      </div>

      <div class="admin__panel" data-panel="karya">
        <h2>Karya</h2>
        <form data-karya-form class="stack">
          <input type="hidden" data-k-id>
          <label class="field">
            <span>Judul karya</span>
            <input type="text" data-k-title required>
          </label>
          <label class="field">
            <span>Kategori</span>
            <input type="text" data-k-category placeholder="misal: Ilustrasi, Web, Fotografi">
          </label>
          <label class="field">
            <span>Deskripsi</span>
            <textarea data-k-desc rows="3"></textarea>
          </label>
          <label class="field">
            <span>Tautan (opsional)</span>
            <input type="url" data-k-link placeholder="https://">
          </label>
          <label class="field">
            <span>Gambar (opsional)</span>
            <input type="file" accept="image/*" data-k-image>
            <span class="field-hint" data-k-image-status></span>
          </label>
          <div class="form-actions">
            <button type="submit" class="btn btn--primary" data-k-submit>Tambah karya</button>
            <button type="button" class="btn btn--ghost" data-k-cancel hidden>Batal edit</button>
          </div>
        </form>
        <div class="admin-list" data-karya-admin-list></div>
      </div>

      <div class="admin__panel" data-panel="keamanan">
        <h2>Ubah Kata Sandi</h2>
        <form data-password-form class="stack">
          <label class="field">
            <span>Kata sandi baru</span>
            <input type="password" data-pw-new minlength="6" required autocomplete="new-password">
          </label>
          <label class="field">
            <span>Konfirmasi kata sandi baru</span>
            <input type="password" data-pw-confirm minlength="6" required autocomplete="new-password">
          </label>
          <p class="field-error" data-pw-error hidden></p>
          <p class="save-note" data-pw-saved hidden>Kata sandi berhasil diubah.</p>
          <button type="submit" class="btn btn--primary">Simpan kata sandi</button>
        </form>
      </div>

    </div>
  </section>`
};
