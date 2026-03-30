/* =====================================================================
   FAREWELL APP — JavaScript  (Display logic only)
   ===================================================================== */

// ─── Config State ────────────────────────────────────────────────────
let config = {
  date: '',
  links: ''
};

// ─── Media State ─────────────────────────────────────────────────────
let allMedia      = [];
let filteredMedia = [];
let currentFilter = 'all';
let currentLbIdx  = 0;



// ─── Init ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (window.appConfig) {
    config = { ...config, ...window.appConfig };
  }
  
  createParticles();

  if (!config.date) {
    document.body.innerHTML = `
      <div style="display:flex; height:100vh; align-items:center; justify-content:center; flex-direction:column; text-align:center; padding:20px; color:var(--text-primary); background:var(--bg-dark);">
        <h2 style="font-size: 2rem; margin-bottom: 20px;">Configuration Needed</h2>
        <p style="color: var(--text-secondary); margin-bottom: 30px;">Please open config.js to add your event date and Google Drive links.</p>
      </div>
    `;
    return;
  }

  launchApp();
});

// ─── Particles ────────────────────────────────────────────────────────
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const colors = ['#8b5cf6','#ec4899','#f5c842','#c4b5fd','#f9a8d4'];
  for (let i = 0; i < 30; i++) {
    const p    = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 6 + 2;
    const dur  = Math.random() * 15 + 10;
    const del  = Math.random() * 15;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${dur}s;
      animation-delay:-${del}s;
    `;
    container.appendChild(p);
  }
}

// ─── Parse Drive Links (no API key) ──────────────────────────────────
/**
 * Extracts a Drive file ID from common share URL formats:
 *   https://drive.google.com/file/d/FILE_ID/view...
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID
 */
function extractFileId(url) {
  url = url.trim();
  // Pattern: /file/d/FILE_ID/
  let m = url.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1];
  // Pattern: ?id=FILE_ID or &id=FILE_ID
  m = url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1];
  return null;
}

/**
 * Detect file type.
 */
function guessType(rawLine) {
  const lower = rawLine.toLowerCase();
  if (lower.includes('[video]') || lower.includes('[vid]') || lower.includes('[v]')) return 'video';
  return 'unknown'; // will auto-detect via img load-error
}

function parseLinks(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];
  lines.forEach((line, i) => {
    const id = extractFileId(line);
    if (!id) return;
    const hinted = guessType(line);
    items.push({
      id,
      name: `Memory ${items.length + 1}`,
      type: hinted
    });
  });
  return items;
}

// ─── Date Parsing ───────────────────────────────────────────────────
function parseDateIST(dateStr) {
  if (!dateStr) return new Date(NaN);
  let dStr = String(dateStr).trim();
  dStr = dStr.replace(' ', 'T'); // Convert spaces to T for standard ISO format
  
  // If no timezone is specified (Z or +XX:XX), append IST (+05:30)
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(dStr)) {
    // Append seconds if missing
    if ((dStr.match(/:/g) || []).length === 1) {
      dStr += ':00';
    }
    dStr += '+05:30';
  }
  return new Date(dStr);
}

// ─── Launch ─────────────────────────────────────────────────────────
function launchApp() {
  if (config.date) {
    const d = parseDateIST(config.date);
    if (!isNaN(d.getTime())) {
      setText('event-date-display',
        d.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', timeZone: 'Asia/Kolkata' })
      );
    }
  }

  startCountdown();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── Countdown ────────────────────────────────────────────────────────
let countdownInterval = null;

function startCountdown() {
  let target = parseDateIST(config.date);
  if (isNaN(target.getTime())) {
    target = new Date(Date.now() + 86400000); // 1 day fallback
  }

  function tick() {
    const diff = target - new Date();
    if (diff <= 0) {
      document.getElementById('countdown-timer').innerHTML =
        `<button class="skip-btn" style="margin: 0 auto; display: inline-block; padding: 16px 32px; font-size: 1.25rem; cursor: pointer;" onclick="showGallery()">View Memories →</button>`;
      clearInterval(countdownInterval);
      return;
    }
    setUnit('days',    Math.floor(diff / 86400000));
    setUnit('hours',   Math.floor((diff % 86400000) / 3600000));
    setUnit('minutes', Math.floor((diff % 3600000)  / 60000));
    setUnit('seconds', Math.floor((diff % 60000)    / 1000));
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}

function setUnit(id, val) {
  const el     = document.getElementById(id);
  const padded = String(val).padStart(2, '0');
  if (el && el.textContent !== padded) {
    el.textContent = padded;
    el.classList.add('flip');
    setTimeout(() => el.classList.remove('flip'), 150);
  }
}

// ─── Gallery Navigation ───────────────────────────────────────────────
function showGallery() {
  document.getElementById('countdown-screen').classList.add('hidden');
  const gs = document.getElementById('gallery-screen');
  gs.classList.remove('hidden');
  gs.scrollIntoView({ behavior: 'smooth' });
  loadMedia();
}

function goBack() {
  document.getElementById('gallery-screen').classList.add('hidden');
  document.getElementById('countdown-screen').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Load Media ───────────────────────────────────────────────────────
function loadMedia() {
  showLoading(true);

  if (!config.links || !config.links.trim()) {
    showError('No valid Google Drive links found. Please add links in the Admin Setup.');
    return;
  }

  const parsed = parseLinks(config.links);
  if (parsed.length === 0) {
    showError('No valid Google Drive links found. Make sure each link is on its own line.');
    return;
  }

  allMedia = parsed;
  showLoading(false);
  applyFilter('all');
}

// ─── Filter ───────────────────────────────────────────────────────────
function filterMedia(type, btn) {
  currentFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilter(type);
}

function applyFilter(type) {
  currentFilter = type;
  if (type === 'all') {
    filteredMedia = [...allMedia];
  } else {
    // For 'unknown' types (not yet resolved), include them in 'all' and 'image' filter
    filteredMedia = allMedia.filter(m => m.type === type || (type === 'image' && m.type === 'unknown'));
  }
  renderGrid();
}

// ─── Render Grid ──────────────────────────────────────────────────────
function renderGrid() {
  const grid = document.getElementById('media-grid');
  grid.innerHTML = '';

  if (filteredMedia.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">No items found.</div>';
    return;
  }

  filteredMedia.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'media-item';
    card.setAttribute('data-idx', idx);
    card.onclick   = () => openLightbox(idx);

    if (item.type === 'video') {
      // Known video
      card.innerHTML = buildVideoCard(item);
    } else {
      // Real Drive file — type unknown until load
      const imgUrl = driveViewUrl(item.id);
      card.innerHTML = buildImageCard(imgUrl, item.name);

      // Auto-detect: if <img> fails to load, swap to video
      const img = card.querySelector('.media-img');
      if (img) {
        img.addEventListener('error', () => {
          // Mark as video in the data store
          allMedia.find(m => m.id === item.id && m.type === 'unknown') &&
            (allMedia.find(m => m.id === item.id).type = 'video');
          item.type = 'video';
          card.innerHTML = buildVideoCard(item);
          card.onclick   = () => openLightbox(idx);
        }, { once: true });
      }
    }

    // Entrance animation
    card.style.opacity   = '0';
    card.style.transform = 'translateY(20px)';
    grid.appendChild(card);
    setTimeout(() => {
      card.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
      card.style.opacity    = '1';
      card.style.transform  = 'translateY(0)';
    }, idx * 60);
  });
}

function buildImageCard(src, name) {
  return `
    <img class="media-img" src="${src}" alt="${sanitize(name)}" loading="lazy" />
    <div class="media-overlay">
      <div class="media-info">
        <span class="media-icon">📷</span>
        <span class="media-name">${sanitize(name)}</span>
      </div>
    </div>`;
}

function buildVideoCard(item) {
  return `
    <div class="video-thumb">
      <div style="font-size:3rem">🎬</div>
      <div class="play-circle">▶</div>
    </div>
    <div class="video-badge">Video</div>
    <div class="media-overlay">
      <div class="media-info">
        <span class="media-icon">🎬</span>
        <span class="media-name">${sanitize(item.name)}</span>
      </div>
    </div>`;
}

// ─── Drive URL Helpers ────────────────────────────────────────────────
function driveViewUrl(id) {
  // This URL works for publicly shared images without an API key
  return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
}

function driveEmbedUrl(id) {
  return `https://drive.google.com/file/d/${id}/preview`;
}

// ─── Lightbox ─────────────────────────────────────────────────────────
function openLightbox(idx) {
  currentLbIdx = idx;
  renderLightbox();
  document.getElementById('lightbox').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
  document.getElementById('lightbox-content').innerHTML = '';
  document.body.style.overflow = '';
}

function prevMedia() {
  currentLbIdx = (currentLbIdx - 1 + filteredMedia.length) % filteredMedia.length;
  renderLightbox();
}

function nextMedia() {
  currentLbIdx = (currentLbIdx + 1) % filteredMedia.length;
  renderLightbox();
}

function renderLightbox() {
  const item    = filteredMedia[currentLbIdx];
  const content = document.getElementById('lightbox-content');
  const caption = document.getElementById('lightbox-caption');
  if (!item) return;

  if (item.type === 'image' || item.type === 'unknown') {
    const src = driveViewUrl(item.id);
    content.innerHTML = `<img src="${src}" alt="${sanitize(item.name)}" />`;
  } else {
    // Video — use Drive embed URL
    const src = driveEmbedUrl(item.id);
    content.innerHTML = `<iframe src="${src}" allowfullscreen></iframe>`;
  }

  caption.textContent = `${item.name}  •  ${currentLbIdx + 1} / ${filteredMedia.length}`;
}

// Keyboard nav
document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').classList.contains('hidden')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  prevMedia();
  if (e.key === 'ArrowRight') nextMedia();
});

// Click backdrop to close
document.getElementById('lightbox')?.addEventListener('click', function(e) {
  if (e.target === this) closeLightbox();
});

// ─── UI Helpers ───────────────────────────────────────────────────────
function showLoading(show) {
  document.getElementById('loading-state').classList.toggle('hidden', !show);
  document.getElementById('error-state').classList.add('hidden');
}

function showError(msg) {
  showLoading(false);
  document.getElementById('error-state').classList.remove('hidden');
  document.getElementById('error-message').textContent = msg;
}

function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
