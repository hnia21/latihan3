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
          <label class="field">
            <span>Ringkasan</span>
            <textarea data-a-excerpt rows="3"></textarea>
          </label>
          <label class="field">
            <span>Isi artikel</span>
            <div class="editor" data-a-editor-wrap>
              <div class="editor__toolbar" data-a-toolbar>
                <button type="button" class="editor__btn" data-cmd="bold" title="Tebal (Ctrl+B)"><b>B</b></button>
                <button type="button" class="editor__btn" data-cmd="italic" title="Miring (Ctrl+I)"><i>I</i></button>
                <button type="button" class="editor__btn" data-cmd="underline" title="Garis bawah (Ctrl+U)"><u>U</u></button>
                <span class="editor__sep"></span>
                <button type="button" class="editor__btn" data-cmd="justifyLeft" title="Rata kiri">Left</button>
                <button type="button" class="editor__btn" data-cmd="justifyCenter" title="Rata tengah">Center</button>
                <button type="button" class="editor__btn" data-cmd="justifyRight" title="Rata kanan">Right</button>
                <button type="button" class="editor__btn" data-cmd="justifyFull" title="Rata kanan-kiri">Justify</button>
                <span class="editor__sep"></span>
                <button type="button" class="editor__btn" data-cmd="insertUnorderedList" title="Daftar bullet">List</button>
                <button type="button" class="editor__btn" data-cmd="insertOrderedList" title="Daftar bernomor">Ordered</button>
                <button type="button" class="editor__btn" data-cmd="formatBlockH2" title="Sub-judul">H2</button>
                <button type="button" class="editor__btn" data-cmd="formatBlockQuote" title="Kutipan">Quote</button>
                <span class="editor__sep"></span>
                <button type="button" class="editor__btn" data-cmd="removeFormat" title="Hapus format">Clear</button>
              </div>
              <div class="editor__area" data-a-body contenteditable="true" data-placeholder="Tulis isi artikel di sini..."></div>
            </div>
          </label>
          <label class="field">
            <span>Gambar sampul (opsional)</span>
            <input type="file" accept="image/*" data-a-image>
            <span class="field-hint" data-a-image-status></span>
          </label>
          <div class="form-actions">
            <button type="submit" class="btn btn--primary" data-a-submit>Tambah artikel</button>
            <button type="button" class="btn btn--ghost" data-a-cancel hidden>Batal edit</button>
          </div>
        </form>
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

    </div>
  </section>`
};
