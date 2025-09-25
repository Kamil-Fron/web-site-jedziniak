const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
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

const galleryFile = path.join(__dirname, 'gallery.json');
const categoriesFile = path.join(__dirname, 'categories.json');
const usersFile = path.join(__dirname, 'users.json');
const upload = multer({ dest: path.join(publicDir, 'images') });

function loadGalleryData() {
  let images = [];
  try {
    images = JSON.parse(fs.readFileSync(galleryFile));
  } catch (e) {
    return [];
  }

  let changed = false;
  let maxId = images.reduce((max, img) => {
    const id = Number(img.id);
    return Number.isFinite(id) && id > max ? id : max;
  }, 0);

  const normalised = images.map(img => {
    const numericId = Number(img.id);
    if (Number.isFinite(numericId)) {
      if (numericId !== img.id) {
        changed = true;
        return { ...img, id: numericId };
      }
      return img;
    }
    changed = true;
    const newId = ++maxId;
    return { ...img, id: newId };
  });

  if (changed) {
    fs.writeFileSync(galleryFile, JSON.stringify(normalised, null, 2));
  }

  return normalised;
}

function saveGalleryData(images) {
  fs.writeFileSync(galleryFile, JSON.stringify(images, null, 2));
}

function nextGalleryId(images) {
  return (
    images.reduce((max, img) => {
      const id = Number(img.id);
      return Number.isFinite(id) && id > max ? id : max;
    }, 0) + 1
  );
}

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(usersFile));
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

let users = loadUsers();
if (users.length === 0) {
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin';
  const hash = bcrypt.hashSync(password, 10);
  users.push({ username, passwordHash: hash });
  saveUsers(users);
}

// Rebuilds categories.json using the first four images from each category
function refreshCategories() {
  const images = loadGalleryData();
  const categories = images.reduce((acc, img) => {
    const cat = img.category || 'inne';
    (acc[cat] = acc[cat] || []).push({
      src: '/images/' + img.filename,
      alt: img.alt || img.category || cat
    });
    return acc;
  }, {});
  Object.keys(categories).forEach(cat => {
    categories[cat] = categories[cat].slice(0, 4);
  });
  fs.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2));
  return categories;
}

function ensureAuth(req, res, next) {
  console.log(req.session);
  if (req.session && req.session.loggedIn) return next();
  res.redirect('/login');
}

app.get('/api/gallery', (req, res) => {
  const { mode } = req.query;
  if (mode === 'full' && !(req.session && req.session.loggedIn)) {
    return res.redirect('/login');
  }
  try {
    let images = loadGalleryData();

    const { category } = req.query;
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
  } catch (err) {
    res.status(500).send('Błąd odczytu');
  }
});

app.get('/api/categories', (req, res) => {
  fs.readFile(categoriesFile, (err, data) => {
    if (err) return res.status(500).send('Błąd odczytu');
    res.json(JSON.parse(data));
  });
});

app.get('/api/refresh-categories', ensureAuth, (req, res) => {
  const categories = refreshCategories();
  res.json(categories);
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (user && bcrypt.compareSync(password, user.passwordHash)) {
    req.session.loggedIn = true;
    req.session.username = username;
    res.redirect('/admin/dashboard.html');
  } else {
    res.status(401).send('Błędny login lub hasło');
  }
});

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Brak danych');
  if (users.find(u => u.username === username)) {
    return res.status(409).send('Użytkownik istnieje');
  }
  const hash = bcrypt.hashSync(password, 10);
  users.push({ username, passwordHash: hash });
  saveUsers(users);
  res.status(201).send('Zarejestrowano');
});

app.get('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Błąd wylogowania');
    res.redirect('/login');
  });
});

app.post('/api/upload', ensureAuth, upload.array('images'), (req, res) => {
  const images = loadGalleryData();
  let idCounter = nextGalleryId(images);
  const uploaded = req.files.map((file, idx) => {
    const img = {
      id: idCounter + idx,
      filename: file.filename,
      category: req.body.category
    };
    images.push(img);
    return img;
  });
  saveGalleryData(images);
  refreshCategories();
  res.json(uploaded);
});

app.delete('/api/gallery/:id', ensureAuth, (req, res) => {
  const id = Number(req.params.id);
  const images = loadGalleryData();
  const index = images.findIndex(i => i.id === id);
  if (index === -1) return res.status(404).end();
  const [img] = images.splice(index, 1);
  saveGalleryData(images);
  try {
    fs.unlinkSync(path.join(publicDir, 'images', img.filename));
  } catch (e) {
    // ignore missing file
  }
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));
