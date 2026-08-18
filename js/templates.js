window.VIEWS = {
  public: () => `
  <section class="hero" id="hero">
    <div class="hero__inner">
      <div class="hero__text">
        <p class="hero__eyebrow">Selamat datang di</p>
        <h1 class="hero__name" data-name>Nama Anda</h1>
        <p class="hero__role" data-role>Peran / profesi Anda</p>
        <p class="hero__bio" data-bio></p>
        <div class="hero__meta">
          <span data-location>Lokasi belum diisi</span>
          <span class="hero__sep"></span>
          <span data-email>email belum diisi</span>
        </div>
      </div>
      <div class="hero__badge">
        <span class="hero__badge-text" data-stamp>ZP</span>
      </div>
    </div>
  </section>

  <section class="section" id="galeri">
    <div class="section__header">
      <p class="section__eyebrow">Portofolio Visual</p>
      <h2 class="section__title">Galeri</h2>
    </div>
    <div class="slideshow" data-slideshow>
      <div class="slideshow__track" data-slideshow-track></div>
      <div class="slideshow__dots" data-slideshow-dots></div>
    </div>
    <div class="section__more">
      <a href="#/semua-galeri" class="btn btn--outline" data-gallery-more>Lihat Semua Galeri</a>
    </div>
  </section>

  <section class="section section--alt" id="artikel">
    <div class="section__header">
      <p class="section__eyebrow">Artikel &amp; Tulisan</p>
      <h2 class="section__title">Artikel terbaru</h2>
    </div>
    <div class="stub-grid" data-article-list></div>
    <div class="section__more">
      <a href="#/semua-artikel" class="btn btn--outline" data-article-more>Lihat Semua Artikel</a>
    </div>
  </section>

  <section class="section" id="karya">
    <div class="section__header">
      <p class="section__eyebrow">Karya &amp; Proyek</p>
      <h2 class="section__title">Karya pilihan</h2>
    </div>
    <div class="stub-grid" data-karya-list></div>
    <div class="section__more">
      <a href="#/semua-karya" class="btn btn--outline" data-karya-more>Lihat Semua Karya</a>
    </div>
  </section>

  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__brand">
        <span class="footer__mark" data-footer-mark>ZP</span>
        <div class="footer__brand-text">
          <span class="footer__name" data-footer-name>Nama Anda</span>
          <span class="footer__tagline" data-footer-role>Peran / profesi Anda</span>
        </div>
      </div>
      <nav class="footer__links">
        <a href="#/">Profil</a>
        <a href="#/semua-galeri">Galeri</a>
        <a href="#/semua-artikel">Artikel</a>
        <a href="#/semua-karya">Karya</a>
      </nav>
    </div>
    <div class="footer__bottom">
      <p>&copy; <span data-footer-year></span> <span data-footer-name-2>xzdhrn</span>. Seluruh hak cipta dilindungi.</p>
    </div>
  </footer>`,

  allGallery: () => `
  <section class="section">
    <div class="section__header">
      <a href="#/" class="back-link">&larr; Kembali</a>
      <p class="section__eyebrow">Portofolio Visual</p>
      <h2 class="section__title">Semua Galeri</h2>
    </div>
    <div class="search-bar">
      <input type="text" data-search-galeri placeholder="Cari berdasarkan judul..." class="search-input">
    </div>
    <div class="gallery-grid" data-all-gallery-list></div>
  </section>` + (window.VIEWS.public().match(/<footer[\s\S]*$/) || [''])[0],

  allArticles: () => `
  <section class="section">
    <div class="section__header">
      <a href="#/" class="back-link">&larr; Kembali</a>
      <p class="section__eyebrow">Artikel &amp; Tulisan</p>
      <h2 class="section__title">Semua Artikel</h2>
    </div>
    <div class="search-bar">
      <input type="text" data-search-artikel placeholder="Cari berdasarkan judul atau penulis..." class="search-input">
    </div>
    <div class="stub-grid" data-all-articles-list></div>
  </section>` + (window.VIEWS.public().match(/<footer[\s\S]*$/) || [''])[0],

  allKarya: () => `
  <section class="section">
    <div class="section__header">
      <a href="#/" class="back-link">&larr; Kembali</a>
      <p class="section__eyebrow">Karya &amp; Proyek</p>
      <h2 class="section__title">Semua Karya</h2>
    </div>
    <div class="search-bar">
      <input type="text" data-search-karya placeholder="Cari berdasarkan judul atau penulis..." class="search-input">
    </div>
    <div class="stub-grid" data-all-karya-list></div>
  </section>` + (window.VIEWS.public().match(/<footer[\s\S]*$/) || [''])[0],

  articleDetail: () => `
  <article class="article-detail">
    <a href="#/" class="article-detail__back">&larr; Kembali</a>
    <p class="article-detail__eyebrow">Artikel</p>
    <h1 data-ad-title></h1>
    <div class="article-detail__meta-row">
      <span class="article-detail__author" data-ad-author hidden></span>
      <span class="article-detail__date" data-ad-date></span>
    </div>
    <img class="article-detail__image" data-ad-image hidden alt="">
    <div class="article-detail__body" data-ad-body></div>
  </article>` + (window.VIEWS.public().match(/<footer[\s\S]*$/) || [''])[0]
};
