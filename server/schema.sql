-- Jalankan file ini sekali di database MySQL Anda sebelum menjalankan server.
-- Contoh: mysql -u root -p nama_database < schema.sql

CREATE TABLE IF NOT EXISTS admin_auth (
  id INT PRIMARY KEY AUTO_INCREMENT,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile (
  id INT PRIMARY KEY AUTO_INCREMENT,
  initials VARCHAR(3) DEFAULT 'ZP',
  name VARCHAR(255) DEFAULT 'Nama Anda',
  role VARCHAR(255) DEFAULT '',
  bio TEXT,
  location VARCHAR(255) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  caption TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  body TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS karya (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  description TEXT,
  link VARCHAR(500),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Baris profil default supaya tabel tidak kosong
INSERT INTO profile (initials, name, role, bio, location, email)
SELECT 'ZP', 'Nama Anda', 'Peran / profesi Anda', 'Tulis bio singkat tentang diri Anda di panel admin.', '', ''
WHERE NOT EXISTS (SELECT 1 FROM profile);
