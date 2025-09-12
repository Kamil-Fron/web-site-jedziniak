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
app.use(express.static(publicDir));
app.use('/admin', express.static(adminDir));

const galleryFile = path.join(__dirname, 'gallery.json');
const upload = multer({ dest: path.join(publicDir, 'images') });

function ensureAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.status(401).send('Nieautoryzowany');
}

app.get('/api/gallery', (req, res) => {
  fs.readFile(galleryFile, (err, data) => {
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

app.post('/api/upload', ensureAuth, upload.single('image'), (req, res) => {
  const images = JSON.parse(fs.readFileSync(galleryFile));
  const img = {
    id: Date.now(),
    filename: req.file.filename,
    category: req.body.category
  };
  images.push(img);
  fs.writeFileSync(galleryFile, JSON.stringify(images, null, 2));
  res.json(img);
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
