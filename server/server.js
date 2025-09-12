const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'tajny',
  resave: false,
  saveUninitialized: false
}));

const publicDir = path.join(__dirname, '../docs');
const adminDir = path.join(__dirname, '../docs/admin');

// Unprotected login page route
app.get('/admin/login.html', (req, res) => {
  res.sendFile(path.join(adminDir, 'login.html'));
});

// Protect admin assets
app.use('/admin', ensureAuth, express.static(adminDir));

// Serve public assets
app.use(express.static(publicDir));
app.get('/login', (req, res) => {
  res.sendFile(path.join(adminDir, 'login.html'));
});
app.use('/admin', ensureAuth, express.static(adminDir));

const galleryFile = path.join(__dirname, 'gallery.json');
const categoriesFile = path.join(__dirname, 'categories.json');
const upload = multer({ dest: path.join(publicDir, 'images') });

function ensureAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.redirect('/login');
}

app.get('/api/gallery', (req, res) => {
  fs.readFile(galleryFile, (err, data) => {
    if (err) return res.status(500).send('Błąd odczytu');
    let images = JSON.parse(data);

    const { category, mode } = req.query;
    if (category) {
      images = images.filter(img => img.category === category);
    }

    // Return original objects when mode=full, otherwise map to public fields
    if (mode === 'full') {
      const full = images.map(img => ({
        id: img.id,
        filename: img.filename,
        category: img.category,
        alt: img.alt || img.category
      }));
      return res.json(full);
    }

    const mapped = images.map(img => {
      const mappedImg = { src: '/images/' + img.filename };
      if (img.alt) mappedImg.alt = img.alt;
      else if (img.category) mappedImg.alt = img.category;
      return mappedImg;
    });

    res.json(mapped);
  });
});

app.get('/api/categories', (req, res) => {
  fs.readFile(categoriesFile, (err, data) => {
    if (err) return res.status(500).send('Błąd odczytu');
    res.json(JSON.parse(data));
  });
});

app.post('/api/login', (req, res) => {
  const password = process.env.ADMIN_PASSWORD || 'admin';
  if (req.body.password === password) {
    req.session.loggedIn = true;
    res.redirect('/admin/dashboard.html');
  } else {
    res.status(401).send('Błędne hasło');
  }
});

app.get('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Błąd wylogowania');
    res.redirect('/login');
  });
});

app.post('/api/upload', ensureAuth, upload.array('images'), (req, res) => {
  const images = JSON.parse(fs.readFileSync(galleryFile));
  const uploaded = req.files.map((file, idx) => {
    const img = {
      id: Date.now() + idx,
      filename: file.filename,
      category: req.body.category
    };
    images.push(img);
    return img;
  });
  fs.writeFileSync(galleryFile, JSON.stringify(images, null, 2));
  res.json(uploaded);
});

app.delete('/api/gallery/:id', ensureAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const images = JSON.parse(fs.readFileSync(galleryFile));
  const index = images.findIndex(i => i.id === id);
  if (index === -1) return res.status(404).end();
  const [img] = images.splice(index, 1);
  fs.writeFileSync(galleryFile, JSON.stringify(images, null, 2));
  try {
    fs.unlinkSync(path.join(publicDir, 'images', img.filename));
  } catch (e) {
    // ignore missing file
  }
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));
