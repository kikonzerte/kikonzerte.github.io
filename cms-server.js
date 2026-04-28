'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PORT = 3001;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'assets', 'data');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function parseDateForFilename(dateStr) {
  // "So, 29.11.26, 17:00" → "26-11-29"
  const m = dateStr.match(/(\d{2})\.(\d{2})\.(\d{2})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseDateForFilenameFromArchive(dateStr) {
  // "29.11.2026" → "26-11-29"
  const m = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  const yy = m[3].slice(2);
  return `${yy}-${m[2]}-${m[1]}`;
}


async function convertImage(base64, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const input = Buffer.from(base64, 'base64');
  const MAX_BYTES = 500 * 1024;
  let quality = 75;
  let buf;
  do {
    buf = await sharp(input)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toBuffer();
    quality -= 5;
  } while (buf.length > MAX_BYTES && quality >= 20);
  fs.writeFileSync(outputPath, buf);
}

async function handleAddEvent(req, res) {
  const body = await readBody(req);
  const { title, dateType, date, dates, artists, description, footer, imageBase64 } = body;

  if (!title || !artists || !description || !footer || !imageBase64) {
    return json(res, { ok: false, error: 'Missing required fields' }, 400);
  }

  const firstDate = dateType === 'multiple' ? (dates && dates[0]) : date;
  if (!firstDate) return json(res, { ok: false, error: 'No date provided' }, 400);

  const fileSlug = parseDateForFilename(firstDate);
  if (!fileSlug) return json(res, { ok: false, error: 'Could not parse date: ' + firstDate }, 400);

  const imagePath = `assets/img/upcoming/${fileSlug}.webp`;
  const absImagePath = path.join(ROOT, imagePath);

  if (fs.existsSync(absImagePath)) {
    return json(res, { ok: false, error: `Image file already exists: ${imagePath}` }, 409);
  }

  await convertImage(imageBase64, absImagePath);

  const eventsPath = path.join(DATA_DIR, 'events.json');
  const events = readJson(eventsPath);

  const event = { title, image: imagePath, artists, description, footer };
  if (dateType === 'multiple') {
    event.dates = dates;
  } else {
    event.date = date;
  }

  events.upcoming.push(event);
  writeJson(eventsPath, events);

  json(res, { ok: true, imagePath, event });
}

async function handleArchiveEvent(req, res) {
  const body = await readBody(req);
  const { eventIndex, archiveDate, archiveTitle, archiveSubtitle, seasonId, imageBase64 } = body;

  if (eventIndex == null || !archiveDate || !archiveTitle || !seasonId) {
    return json(res, { ok: false, error: 'Missing required fields' }, 400);
  }

  const eventsPath = path.join(DATA_DIR, 'events.json');
  const events = readJson(eventsPath);

  if (eventIndex < 0 || eventIndex >= events.upcoming.length) {
    return json(res, { ok: false, error: 'Invalid event index' }, 400);
  }

  const event = events.upcoming[eventIndex];
  const fileSlug = parseDateForFilenameFromArchive(archiveDate);
  if (!fileSlug) return json(res, { ok: false, error: 'Could not parse archive date: ' + archiveDate }, 400);

  const imagePath = `assets/img/archive/${seasonId}/${fileSlug}.webp`;
  const absImagePath = path.join(ROOT, imagePath);

  if (imageBase64) {
    await convertImage(imageBase64, absImagePath);
  } else {
    // Copy existing upcoming image
    const existingImage = path.join(ROOT, event.image);
    if (fs.existsSync(existingImage)) {
      fs.mkdirSync(path.dirname(absImagePath), { recursive: true });
      fs.copyFileSync(existingImage, absImagePath);
    } else {
      return json(res, { ok: false, error: 'No image uploaded and existing image not found: ' + event.image }, 400);
    }
  }

  // Ensure archive season file + seasons index are up to date
  const seasonsPath = path.join(DATA_DIR, 'archive-seasons.json');
  const seasonsData = readJson(seasonsPath);
  const archiveFilename = `archive-${seasonId}.json`;
  const archivePath = path.join(DATA_DIR, archiveFilename);

  if (!fs.existsSync(archivePath)) {
    const [a, b] = seasonId.split('-');
    const newSeason = {
      season: `${a}/${b}`,
      displayName: `KONZERTARCHIV SPIELZEIT ${a}/${b}`,
      concerts: [],
      specialEvents: []
    };
    writeJson(archivePath, newSeason);

    const exists = seasonsData.seasons.some(s => s.id === seasonId);
    if (!exists) {
      seasonsData.seasons.unshift({
        id: seasonId,
        displayName: `SPIELZEIT ${a}/${b}`,
        file: `assets/data/${archiveFilename}`
      });
      seasonsData.currentSeason = seasonId;
      writeJson(seasonsPath, seasonsData);
    }
  }

  const archiveData = readJson(archivePath);
  const concert = { date: archiveDate, title: archiveTitle, image: imagePath };
  if (archiveSubtitle && archiveSubtitle.trim()) {
    concert.subtitle = archiveSubtitle.trim();
  }
  archiveData.concerts.unshift(concert);
  writeJson(archivePath, archiveData);

  events.upcoming.splice(eventIndex, 1);
  writeJson(eventsPath, events);

  json(res, { ok: true, archivedTo: seasonId, imagePath });
}

async function handleUpdateEvent(req, res) {
  const body = await readBody(req);
  const { eventIndex, title, dateType, date, dates, artists, description, footer, imageBase64 } = body;

  if (eventIndex == null || !title || !artists || !description || !footer) {
    return json(res, { ok: false, error: 'Missing required fields' }, 400);
  }

  const eventsPath = path.join(DATA_DIR, 'events.json');
  const events = readJson(eventsPath);

  if (eventIndex < 0 || eventIndex >= events.upcoming.length) {
    return json(res, { ok: false, error: 'Invalid event index' }, 400);
  }

  const existing = events.upcoming[eventIndex];
  const firstDate = dateType === 'multiple' ? (dates && dates[0]) : date;
  if (!firstDate) return json(res, { ok: false, error: 'No date provided' }, 400);

  const fileSlug = parseDateForFilename(firstDate);
  if (!fileSlug) return json(res, { ok: false, error: 'Could not parse date: ' + firstDate }, 400);

  const newImagePath = `assets/img/upcoming/${fileSlug}.webp`;
  const absNewImagePath = path.join(ROOT, newImagePath);

  if (imageBase64) {
    await convertImage(imageBase64, absNewImagePath);
  } else if (newImagePath !== existing.image) {
    const absOldImagePath = path.join(ROOT, existing.image);
    if (fs.existsSync(absOldImagePath)) {
      fs.mkdirSync(path.dirname(absNewImagePath), { recursive: true });
      fs.copyFileSync(absOldImagePath, absNewImagePath);
    } else {
      return json(res, { ok: false, error: 'Existing image not found: ' + existing.image }, 400);
    }
  }

  const updatedEvent = { title, image: newImagePath, artists, description, footer };
  if (dateType === 'multiple') updatedEvent.dates = dates; else updatedEvent.date = date;

  events.upcoming[eventIndex] = updatedEvent;
  writeJson(eventsPath, events);

  json(res, { ok: true, imagePath: newImagePath, event: updatedEvent });
}

async function handleUpdateArchiveEntry(req, res) {
  const body = await readBody(req);
  const { seasonId, concertIndex, date, title, subtitle, imageBase64 } = body;

  if (!seasonId || concertIndex == null || !date || !title) {
    return json(res, { ok: false, error: 'Missing required fields' }, 400);
  }

  const archivePath = path.join(DATA_DIR, `archive-${seasonId}.json`);
  if (!fs.existsSync(archivePath)) return json(res, { ok: false, error: 'Season not found' }, 404);

  const archiveData = readJson(archivePath);
  if (concertIndex < 0 || concertIndex >= archiveData.concerts.length) {
    return json(res, { ok: false, error: 'Invalid concert index' }, 400);
  }

  const existing = archiveData.concerts[concertIndex];
  const fileSlug = parseDateForFilenameFromArchive(date);
  if (!fileSlug) return json(res, { ok: false, error: 'Could not parse date: ' + date }, 400);

  const newImagePath = `assets/img/archive/${seasonId}/${fileSlug}.webp`;
  const absNewImagePath = path.join(ROOT, newImagePath);

  if (imageBase64) {
    await convertImage(imageBase64, absNewImagePath);
  } else if (newImagePath !== existing.image) {
    const absOldImagePath = path.join(ROOT, existing.image);
    if (fs.existsSync(absOldImagePath)) {
      fs.mkdirSync(path.dirname(absNewImagePath), { recursive: true });
      fs.copyFileSync(absOldImagePath, absNewImagePath);
    }
  }

  const updated = { date, title, image: newImagePath };
  if (subtitle && subtitle.trim()) updated.subtitle = subtitle.trim();

  archiveData.concerts[concertIndex] = updated;
  writeJson(archivePath, archiveData);

  json(res, { ok: true, imagePath: newImagePath });
}

async function handleDeleteEvent(req, res) {
  const { eventIndex } = await readBody(req);
  if (eventIndex == null) return json(res, { ok: false, error: 'Missing eventIndex' }, 400);
  const eventsPath = path.join(DATA_DIR, 'events.json');
  const events = readJson(eventsPath);
  if (eventIndex < 0 || eventIndex >= events.upcoming.length) {
    return json(res, { ok: false, error: 'Invalid event index' }, 400);
  }
  const imagePath = path.join(ROOT, events.upcoming[eventIndex].image);
  events.upcoming.splice(eventIndex, 1);
  writeJson(eventsPath, events);
  if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  json(res, { ok: true });
}

async function handleDeleteArchiveEntry(req, res) {
  const { seasonId, concertIndex } = await readBody(req);
  if (!seasonId || concertIndex == null) return json(res, { ok: false, error: 'Missing required fields' }, 400);
  const archivePath = path.join(DATA_DIR, `archive-${seasonId}.json`);
  if (!fs.existsSync(archivePath)) return json(res, { ok: false, error: 'Season not found' }, 404);
  const archiveData = readJson(archivePath);
  if (concertIndex < 0 || concertIndex >= archiveData.concerts.length) {
    return json(res, { ok: false, error: 'Invalid concert index' }, 400);
  }
  const imagePath = path.join(ROOT, archiveData.concerts[concertIndex].image);
  archiveData.concerts.splice(concertIndex, 1);
  writeJson(archivePath, archiveData);
  if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  json(res, { ok: true });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST' });
    return res.end();
  }

  try {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/cms.html')) {
      const html = fs.readFileSync(path.join(ROOT, 'cms.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(html);
    }

    if (req.method === 'GET' && req.url === '/api/events') {
      return json(res, readJson(path.join(DATA_DIR, 'events.json')));
    }

    if (req.method === 'GET' && req.url === '/api/archive-seasons') {
      return json(res, readJson(path.join(DATA_DIR, 'archive-seasons.json')));
    }

    if (req.method === 'GET' && req.url.startsWith('/api/archive/')) {
      const seasonId = req.url.replace('/api/archive/', '');
      const filePath = path.join(DATA_DIR, `archive-${seasonId}.json`);
      if (!fs.existsSync(filePath)) return json(res, { ok: false, error: 'Season not found' }, 404);
      return json(res, readJson(filePath));
    }

    if (req.method === 'POST' && req.url === '/api/add-event') {
      return await handleAddEvent(req, res);
    }

    if (req.method === 'POST' && req.url === '/api/archive-event') {
      return await handleArchiveEvent(req, res);
    }

    if (req.method === 'POST' && req.url === '/api/update-event') {
      return await handleUpdateEvent(req, res);
    }

    if (req.method === 'POST' && req.url === '/api/update-archive-entry') {
      return await handleUpdateArchiveEntry(req, res);
    }

    if (req.method === 'POST' && req.url === '/api/delete-event') {
      return await handleDeleteEvent(req, res);
    }

    if (req.method === 'POST' && req.url === '/api/delete-archive-entry') {
      return await handleDeleteArchiveEntry(req, res);
    }

    if (req.method === 'GET' && req.url.startsWith('/assets/img/')) {
      const filePath = path.join(ROOT, req.url.split('?')[0]);
      if (!fs.existsSync(filePath)) { res.writeHead(404); return res.end('Not Found'); }
      const ext = path.extname(filePath);
      const mime = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
      return res.end(fs.readFileSync(filePath));
    }

    res.writeHead(404);
    res.end('Not Found');
  } catch (err) {
    console.error(err);
    json(res, { ok: false, error: err.message }, 500);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;
  console.log(`CMS server running at ${url}`);
  require('child_process').exec(`xdg-open "${url}"`);
});
