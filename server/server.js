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
const sessionTtl = Number(process.env.SESSION_TTL_MS) || 1000 * 60 * 60 * 6; // 6 godzin

app.use(session({
  secret: process.env.SESSION_SECRET || 'tajny',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  name: 'vikimeble.sid',
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: sessionTtl
  }
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
const testimonialsFile = path.join(__dirname, 'testimonials.json');
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

function normaliseTestimonials(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      const id = Number(item.id);
      const rating = Number(item.rating);
      const order = Number(item.order);
      return {
        id: Number.isFinite(id) && id > 0 ? id : index + 1,
        author: typeof item.author === 'string' ? item.author : '',
        quote: typeof item.quote === 'string' ? item.quote : '',
        rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : undefined,
        published: Boolean(item.published),
        order: Number.isFinite(order) ? order : index + 1
      };
    })
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 }));
}

function loadTestimonials() {
  try {
    const data = JSON.parse(fs.readFileSync(testimonialsFile));
    return normaliseTestimonials(data);
  } catch (e) {
    return [];
  }
}

function saveTestimonials(testimonials) {
  const normalised = normaliseTestimonials(testimonials);
  fs.writeFileSync(testimonialsFile, JSON.stringify(normalised, null, 2));
  return normalised;
}

function nextTestimonialId(items) {
  return (
    items.reduce((max, item) => {
      const id = Number(item.id);
      return Number.isFinite(id) && id > max ? id : max;
    }, 0) + 1
  );
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalised = value.toLowerCase();
    return normalised === 'true' || normalised === '1' || normalised === 'on' || normalised === 'yes';
  }
  return false;
}

function validateTestimonialPayload(payload) {
  const errors = [];
  const author = typeof payload.author === 'string' ? payload.author.trim() : '';
  const quote = typeof payload.quote === 'string' ? payload.quote.trim() : '';
  const ratingValue = Number(payload.rating);
  const orderValue = payload.order === '' || payload.order === null || payload.order === undefined ? null : Number(payload.order);
  const rating = Number.isFinite(ratingValue) ? Math.round(ratingValue) : NaN;
  const order = Number.isFinite(orderValue) ? orderValue : null;

  if (!author) {
    errors.push('Imię i nazwisko autora jest wymagane.');
  }

  if (!quote) {
    errors.push('Treść opinii jest wymagana.');
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    errors.push('Ocena musi być liczbą od 1 do 5.');
  }

  return {
    errors,
    data: {
      author,
      quote,
      rating,
      published: parseBoolean(payload.published),
      order
    }
  };
}

const defaultUsername = process.env.ADMIN_USER || 'admin';
const defaultPassword = process.env.ADMIN_PASSWORD || 'mariusz';
const legacyDefaultPassword = 'admin';

let users = loadUsers();
let testimonials = loadTestimonials();

function ensureDefaultAdminUser() {
  let shouldSave = false;
  let adminUser = users.find(user => user.username === defaultUsername);

  if (!adminUser) {
    const hash = bcrypt.hashSync(defaultPassword, 10);
    users.push({ username: defaultUsername, passwordHash: hash });
    shouldSave = true;
  } else {
    const hasEnvPassword = Boolean(process.env.ADMIN_PASSWORD);
    const desiredPassword = hasEnvPassword ? defaultPassword : null;
    const currentHash = adminUser.passwordHash;

    if (!currentHash) {
      adminUser.passwordHash = bcrypt.hashSync(defaultPassword, 10);
      shouldSave = true;
    } else if (hasEnvPassword) {
      if (!bcrypt.compareSync(desiredPassword, currentHash)) {
        adminUser.passwordHash = bcrypt.hashSync(desiredPassword, 10);
        shouldSave = true;
      }
    } else if (bcrypt.compareSync(legacyDefaultPassword, currentHash)) {
      adminUser.passwordHash = bcrypt.hashSync(defaultPassword, 10);
      shouldSave = true;
    }
  }

  if (shouldSave) {
    saveUsers(users);
  }
}

ensureDefaultAdminUser();

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
  if (req.session && req.session.loggedIn) return next();
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Brak autoryzacji' });
  }
  res.redirect('/login');
}

app.get('/api/gallery', (req, res) => {
  const { mode } = req.query;
  if (mode === 'full' && !(req.session && req.session.loggedIn)) {
    return res.status(401).json({ error: 'Brak autoryzacji' });
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

app.get('/api/testimonials', (req, res) => {
  try {
    const published = testimonials
      .filter(item => item.published)
      .sort((a, b) => a.order - b.order);
    res.json(published);
  } catch (error) {
    console.error('Nie udało się odczytać opinii', error);
    res.status(500).json({ error: 'Błąd odczytu opinii' });
  }
});

app.get('/api/admin/testimonials', ensureAuth, (req, res) => {
  res.json(testimonials);
});

app.post('/api/admin/testimonials', ensureAuth, (req, res) => {
  const { errors, data } = validateTestimonialPayload(req.body || {});
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const newTestimonial = {
    id: nextTestimonialId(testimonials),
    author: data.author,
    quote: data.quote,
    rating: data.rating,
    published: data.published,
    order: data.order ?? testimonials.length + 1
  };

  testimonials = saveTestimonials([...testimonials, newTestimonial]);
  const saved = testimonials.find(item => item.id === newTestimonial.id) || newTestimonial;
  res.status(201).json(saved);
});

app.put('/api/admin/testimonials/:id', ensureAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Nieprawidłowe ID opinii' });
  }

  const index = testimonials.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Opinia nie istnieje' });
  }

  const { errors, data } = validateTestimonialPayload(req.body || {});
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const updated = {
    ...testimonials[index],
    author: data.author,
    quote: data.quote,
    rating: data.rating,
    published: data.published,
    order: data.order ?? testimonials[index].order
  };

  testimonials = saveTestimonials([
    ...testimonials.slice(0, index),
    updated,
    ...testimonials.slice(index + 1)
  ]);

  const saved = testimonials.find(item => item.id === id) || updated;
  res.json(saved);
});

app.delete('/api/admin/testimonials/:id', ensureAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Nieprawidłowe ID opinii' });
  }

  const index = testimonials.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Opinia nie istnieje' });
  }

  const removed = testimonials[index];
  testimonials = saveTestimonials(testimonials.filter(item => item.id !== id));
  res.json({ ok: true, removed });
});

app.get('/api/refresh-categories', ensureAuth, (req, res) => {
  const categories = refreshCategories();
  res.json(categories);
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).send('Błędny login lub hasło');
  }

  req.session.regenerate(err => {
    if (err) {
      console.error('Nie udało się zregenerować sesji', err);
      return res.status(500).send('Błąd logowania');
    }

    req.session.loggedIn = true;
    req.session.username = username;

    req.session.save(saveErr => {
      if (saveErr) {
        console.error('Nie udało się zapisać sesji', saveErr);
        return res.status(500).send('Błąd logowania');
      }
      const acceptsHtml = (req.headers.accept || '').includes('text/html');
      if (acceptsHtml) {
        return res.redirect('/admin/dashboard.html');
      }
      res.json({ ok: true, redirect: '/admin/dashboard.html' });
    });
  });
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

app.get('/api/session/keep-alive', ensureAuth, (req, res) => {
  // Dotknięcie sesji zapewnia odświeżenie czasu życia ciasteczka.
  if (typeof req.session.touch === 'function') {
    req.session.touch();
  }
  res.json({ ok: true, user: req.session.username, expiresInMs: req.session.cookie.maxAge });
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
