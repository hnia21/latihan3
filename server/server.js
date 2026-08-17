'use strict';

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ==========================================================
   MIDDLEWARE DASAR
   ========================================================== */
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'ganti-secret-ini-sebelum-deploy',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 hari
  }
}));
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'Belum masuk sebagai admin.' });
}

/* ==========================================================
   UPLOAD GAMBAR (multer)
   ========================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    cb(null, 'img_' + Date.now() + '_' + Math.round(Math.random() * 1e9) + safeExt);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    cb(ok ? null : new Error('Format gambar tidak didukung.'), ok);
  }
});

app.post('/api/upload', requireAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Tidak ada gambar dikirim.' });
    res.json({ url: '/uploads/' + req.file.filename });
  });
});

/* ==========================================================
   AUTENTIKASI
   ========================================================== */
app.get('/api/auth/status', async (req, res) => {
  const [rows] = await pool.query('SELECT id FROM admin_auth LIMIT 1');
  res.json({
    passwordSet: rows.length > 0,
    loggedIn: !!(req.session && req.session.isAdmin)
  });
});

app.post('/api/auth/setup', async (req, res) => {
  const { password, confirm } = req.body || {};
  const [rows] = await pool.query('SELECT id FROM admin_auth LIMIT 1');
  if (rows.length > 0) return res.status(400).json({ error: 'Kata sandi sudah pernah dibuat.' });
  if (!password || password.length < 4) return res.status(400).json({ error: 'Kata sandi minimal 4 karakter.' });
  if (password !== confirm) return res.status(400).json({ error: 'Kata sandi tidak sama.' });

  const hash = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO admin_auth (password_hash) VALUES (?)', [hash]);
  req.session.isAdmin = true;
  res.json({ ok: true });
});

app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body || {};
  const [rows] = await pool.query('SELECT password_hash FROM admin_auth LIMIT 1');
  if (rows.length === 0) return res.status(400).json({ error: 'Kata sandi belum dibuat.' });

  const ok = await bcrypt.compare(password || '', rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: 'Kata sandi salah.' });

  req.session.isAdmin = true;
  res.json({ ok: true });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/* ==========================================================
   PROFIL
   ========================================================== */
app.get('/api/profile', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM profile ORDER BY id LIMIT 1');
  res.json(rows[0] || null);
});

app.put('/api/profile', requireAuth, async (req, res) => {
  const { initials, name, role, bio, location, email } = req.body || {};
  const [rows] = await pool.query('SELECT id FROM profile ORDER BY id LIMIT 1');

  if (rows.length === 0) {
    await pool.query(
      'INSERT INTO profile (initials, name, role, bio, location, email) VALUES (?,?,?,?,?,?)',
      [initials || 'ZP', name || 'Nama Anda', role || '', bio || '', location || '', email || '']
    );
  } else {
    await pool.query(
      'UPDATE profile SET initials=?, name=?, role=?, bio=?, location=?, email=? WHERE id=?',
      [initials || 'ZP', name || 'Nama Anda', role || '', bio || '', location || '', email || '', rows[0].id]
    );
  }
  const [updated] = await pool.query('SELECT * FROM profile ORDER BY id LIMIT 1');
  res.json(updated[0]);
});

/* ==========================================================
   GALERI
   ========================================================== */
app.get('/api/gallery', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC');
  res.json(rows);
});

app.post('/api/gallery', requireAuth, async (req, res) => {
  const { title, caption, image_url } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Judul wajib diisi.' });
  const [result] = await pool.query(
    'INSERT INTO gallery (title, caption, image_url) VALUES (?,?,?)',
    [title, caption || '', image_url || null]
  );
  const [rows] = await pool.query('SELECT * FROM gallery WHERE id=?', [result.insertId]);
  res.json(rows[0]);
});

app.delete('/api/gallery/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM gallery WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

/* ==========================================================
   ARTIKEL
   ========================================================== */
app.get('/api/articles', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM articles ORDER BY created_at DESC');
  res.json(rows);
});

app.get('/api/articles/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM articles WHERE id=?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Artikel tidak ditemukan.' });
  res.json(rows[0]);
});

app.post('/api/articles', requireAuth, async (req, res) => {
  const { title, excerpt, body, image_url } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Judul wajib diisi.' });
  const [result] = await pool.query(
    'INSERT INTO articles (title, excerpt, body, image_url) VALUES (?,?,?,?)',
    [title, excerpt || '', body || '', image_url || null]
  );
  const [rows] = await pool.query('SELECT * FROM articles WHERE id=?', [result.insertId]);
  res.json(rows[0]);
});

app.put('/api/articles/:id', requireAuth, async (req, res) => {
  const { title, excerpt, body, image_url } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Judul wajib diisi.' });
  await pool.query(
    'UPDATE articles SET title=?, excerpt=?, body=?, image_url=? WHERE id=?',
    [title, excerpt || '', body || '', image_url || null, req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM articles WHERE id=?', [req.params.id]);
  res.json(rows[0]);
});

app.delete('/api/articles/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM articles WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

/* ==========================================================
   KARYA
   ========================================================== */
app.get('/api/karya', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM karya ORDER BY created_at DESC');
  res.json(rows);
});

app.post('/api/karya', requireAuth, async (req, res) => {
  const { title, category, description, link, image_url } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Judul wajib diisi.' });
  const [result] = await pool.query(
    'INSERT INTO karya (title, category, description, link, image_url) VALUES (?,?,?,?,?)',
    [title, category || '', description || '', link || '', image_url || null]
  );
  const [rows] = await pool.query('SELECT * FROM karya WHERE id=?', [result.insertId]);
  res.json(rows[0]);
});

app.put('/api/karya/:id', requireAuth, async (req, res) => {
  const { title, category, description, link, image_url } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Judul wajib diisi.' });
  await pool.query(
    'UPDATE karya SET title=?, category=?, description=?, link=?, image_url=? WHERE id=?',
    [title, category || '', description || '', link || '', image_url || null, req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM karya WHERE id=?', [req.params.id]);
  res.json(rows[0]);
});

app.delete('/api/karya/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM karya WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

/* ==========================================================
   FALLBACK: rute non-API dikembalikan ke index.html (SPA)
   ========================================================== */
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
