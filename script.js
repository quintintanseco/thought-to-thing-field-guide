const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let toastTimer;
function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 1800);
}

function downloadText(name, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

$$('.tool-tabs button').forEach(button => button.addEventListener('click', () => {
  const name = button.dataset.tool;
  $$('.tool-tabs button').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
  });
  $$('.tool-panel').forEach(panel => {
    const active = panel.id === `tool-${name}`;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
}));

// WEB FORGE
let webVibe = 'editorial';
const webFields = {
  brand: $('#web-brand'),
  headline: $('#web-headline'),
  cta: $('#web-cta')
};

function renderWeb() {
  const brand = webFields.brand.value.trim() || 'Untitled';
  const headline = webFields.headline.value.trim() || 'Make something worth opening.';
  const cta = webFields.cta.value.trim() || 'Get started';
  $('#preview-brand').textContent = brand.toUpperCase();
  $('#preview-headline').textContent = headline;
  $('#preview-cta').textContent = `${cta} ↗`;
  $('#site-preview').className = `site-preview ${webVibe}`;
  $('#web-status').textContent = `${webVibe.toUpperCase()} / GENERATED`;
}

$$('.vibe').forEach(button => button.addEventListener('click', () => {
  webVibe = button.dataset.vibe;
  $$('.vibe').forEach(item => item.classList.toggle('active', item === button));
  renderWeb();
}));

$('#web-form').addEventListener('submit', event => {
  event.preventDefault();
  renderWeb();
  toast('Landing page generated');
});

Object.values(webFields).forEach(field => field.addEventListener('input', renderWeb));

function safeHTML(value) {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function exportedPage() {
  const brand = safeHTML(webFields.brand.value.trim() || 'Untitled');
  const headline = safeHTML(webFields.headline.value.trim() || 'Make something worth opening.');
  const cta = safeHTML(webFields.cta.value.trim() || 'Get started');
  const themes = {
    editorial: ['#f4efe4', '#1b211b', 'Georgia,serif', '99px'],
    neon: ['#181126', '#bdff00', 'Arial,sans-serif', '99px'],
    calm: ['#dce9e1', '#18352c', 'Georgia,serif', '99px'],
    brutal: ['#ffd836', '#090909', 'Arial,sans-serif', '0']
  };
  const [bg, ink, font, radius] = themes[webVibe];
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${brand}</title><style>*{box-sizing:border-box}body{margin:0;background:${bg};color:${ink};font-family:Arial,sans-serif}.shell{min-height:100vh;padding:32px 5vw;display:flex;flex-direction:column;overflow:hidden;position:relative}nav,footer{display:flex;justify-content:space-between;font:700 11px monospace;letter-spacing:.12em;position:relative;z-index:2}main{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:${webVibe === 'calm' ? 'center' : 'flex-start'};text-align:${webVibe === 'calm' ? 'center' : 'left'};position:relative;z-index:2}h1{font:900 clamp(58px,10vw,150px)/.85 ${font};letter-spacing:-.065em;max-width:1100px;margin:30px 0}button{border:0;border-radius:${radius};padding:16px 22px;background:${ink};color:${bg};font:700 12px monospace}.orb{position:absolute;width:55vw;height:55vw;border:1px solid ${ink};border-radius:50%;right:-18vw;bottom:-25vw;opacity:.28}.orb:after,.orb:before{content:'';position:absolute;inset:18%;border:1px dashed ${ink};border-radius:50%}.orb:after{inset:37%;background:${ink}}footer{opacity:.6}</style><body><div class="shell"><nav><b>${brand.toUpperCase()}</b><span>Product&nbsp;&nbsp; Journal&nbsp;&nbsp; Sign in</span></nav><main><small>MADE FROM A ROUGH IDEA / 2026</small><h1>${headline}</h1><button>${cta} ↗</button></main><div class="orb"></div><footer><span>GENERATED WITH CODEX HANDS-ON LAB</span><span>01 — 04</span></footer></div></body></html>`;
}

$('#download-web').addEventListener('click', () => {
  const slug = (webFields.brand.value || 'landing-page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  downloadText(`${slug || 'landing-page'}.html`, exportedPage(), 'text/html');
  toast('Standalone HTML downloaded');
});

// DATA LENS
let parsedData = { headers: [], rows: [], numeric: [] };

function parseCSVLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { values.push(value.trim()); value = ''; }
    else value += char;
  }
  values.push(value.trim());
  return values;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('Add a header and at least one data row.');
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine).filter(row => row.length === headers.length);
  const numeric = headers.map((header, index) => ({ header, index })).filter(column => rows.every(row => row[column.index] !== '' && Number.isFinite(Number(row[column.index].replace?.(/[$,%]/g, '') ?? row[column.index]))));
  if (!numeric.length) throw new Error('No consistently numeric column was found.');
  return { headers, rows, numeric };
}

const numberValue = (row, index) => Number(String(row[index]).replace(/[$,%]/g, ''));
const formatNumber = value => new Intl.NumberFormat('en', { maximumFractionDigits: value < 100 ? 1 : 0 }).format(value);

function renderMetric(index) {
  const column = parsedData.numeric.find(item => item.index === Number(index)) || parsedData.numeric[0];
  const values = parsedData.rows.map(row => numberValue(row, column.index));
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = total / values.length;
  const maximum = Math.max(...values);
  const maximumIndex = values.indexOf(maximum);
  const first = values[0];
  const last = values.at(-1);
  const trend = first === 0 ? 0 : ((last - first) / Math.abs(first)) * 100;
  const labelIndex = parsedData.headers.findIndex((_, headerIndex) => !parsedData.numeric.some(item => item.index === headerIndex));

  $('#metric-grid').innerHTML = `<div class="metric"><span>TOTAL ${column.header.toUpperCase()}</span><b>${formatNumber(total)}</b></div><div class="metric"><span>AVERAGE</span><b>${formatNumber(average)}</b></div><div class="metric"><span>HIGH POINT</span><b>${formatNumber(maximum)}</b></div>`;
  $('#trend-badge').textContent = `${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(1)}% FIRST → LAST`;
  $('#trend-badge').style.color = trend >= 0 ? 'var(--acid)' : 'var(--coral)';
  const scale = maximum || 1;
  $('#bar-chart').innerHTML = values.map((value, rowIndex) => `<div class="bar-item"><i>${formatNumber(value)}</i><b style="height:${Math.max(2, (value / scale) * 88)}%"></b><span>${safeHTML(labelIndex >= 0 ? parsedData.rows[rowIndex][labelIndex] : String(rowIndex + 1))}</span></div>`).join('');
  const highLabel = labelIndex >= 0 ? parsedData.rows[maximumIndex][labelIndex] : `row ${maximumIndex + 1}`;
  $('#data-insight').innerHTML = `<b>${safeHTML(highLabel)}</b> is the high point for ${safeHTML(column.header)} at ${formatNumber(maximum)}. The series ${trend >= 0 ? 'grows' : 'falls'} ${Math.abs(trend).toFixed(1)}% from its first to last row.`;
}

function analyzeData() {
  try {
    parsedData = parseCSV($('#csv-input').value);
    const select = $('#metric-select');
    select.innerHTML = parsedData.numeric.map(column => `<option value="${column.index}">${safeHTML(column.header)}</option>`).join('');
    $('#data-status').textContent = `${parsedData.rows.length} ROWS / ${parsedData.numeric.length} METRICS`;
    renderMetric(parsedData.numeric[0].index);
    toast('Data analyzed');
  } catch (error) {
    toast(error.message);
  }
}

$('#analyze-data').addEventListener('click', analyzeData);
$('#metric-select').addEventListener('change', event => renderMetric(event.target.value));
$('#csv-file').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2_000_000) return toast('Choose a CSV under 2 MB');
  const reader = new FileReader();
  reader.onload = () => { $('#csv-input').value = reader.result; $('#file-name').textContent = file.name; analyzeData(); };
  reader.readAsText(file);
});

// NOTE TAMER
let noteMarkdown = '';

function unique(items) {
  return [...new Set(items.map(item => item.trim()).filter(Boolean))];
}

function tameNotes() {
  const raw = $('#notes-input').value.trim();
  if (!raw) return toast('Paste some notes first');
  const lines = raw.split(/\r?\n|(?<=[.!?])\s+/).map(line => line.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
  const decisions = unique(lines.filter(line => /\b(decided|agreed|approved|confirmed|will focus|should focus)\b/i.test(line)));
  const actions = unique(lines.filter(line => /\b(action:|todo|need to|needs to|must|will\s+\w+|by\s+(monday|tuesday|wednesday|thursday|friday|tomorrow|next))\b/i.test(line)));
  const risks = unique(lines.filter(line => /\b(risk|blocked|blocker|issue|concern|slower|delay|missing)\b/i.test(line)));
  const dates = unique((raw.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}\b|\b(?:today|tomorrow|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi) || []));
  const title = lines[0].replace(/[—–-].*$/, '').trim() || 'Structured brief';
  const sections = [
    ['DECISIONS', decisions],
    ['ACTIONS', actions],
    ['RISKS / OPEN QUESTIONS', risks],
    ['DATES DETECTED', dates]
  ];
  $('#brief-output').innerHTML = `<h4>${safeHTML(title)}</h4>` + sections.map(([name, items]) => `<div class="brief-section"><span>${name}</span>${items.length ? `<ul>${items.map(item => `<li>${safeHTML(item)}</li>`).join('')}</ul>` : '<p class="brief-empty">Nothing detected yet.</p>'}</div>`).join('');
  noteMarkdown = `# ${title}\n\n` + sections.map(([name, items]) => `## ${name}\n${items.length ? items.map(item => `- ${item}`).join('\n') : '- Nothing detected'}`).join('\n\n');
  $('#notes-status').textContent = `${decisions.length} DECISIONS / ${actions.length} ACTIONS`;
  toast('Notes transformed');
}

$('#tame-notes').addEventListener('click', tameNotes);
$('#copy-notes').addEventListener('click', async () => {
  if (!noteMarkdown) tameNotes();
  try { await navigator.clipboard.writeText(noteMarkdown); toast('Markdown copied'); }
  catch { downloadText('structured-brief.md', noteMarkdown, 'text/markdown'); toast('Markdown downloaded'); }
});

// POSTER LAB
const palettes = {
  acid: ['#10120e', '#dfff3f', '#f4f0e6'],
  signal: ['#fb4b2d', '#1825a9', '#ffd7bb'],
  ice: ['#071c2d', '#8ee7ff', '#eefcff']
};
let posterPalette = 'acid';

function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function randomFrom(seed) {
  let state = seed || 1;
  return () => { state = Math.imul(48271, state) % 2147483647; return (state & 2147483647) / 2147483647; };
}

function wrapPosterText(ctx, words, maxWidth, maxLines = 5) {
  const tokens = words.trim().toUpperCase().split(/\s+/);
  const lines = [];
  let line = '';
  tokens.forEach(token => {
    const test = line ? `${line} ${token}` : token;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = token; }
    else line = test;
  });
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function generatePoster() {
  const words = $('#poster-words').value.trim() || 'MAKE SOMETHING REAL';
  const energy = Number($('#poster-energy').value);
  const colors = palettes[posterPalette];
  const seed = hashText(`${words}|${energy}|${posterPalette}`);
  const random = randomFrom(seed);
  const canvas = $('#poster-canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, 800, 1000);

  ctx.strokeStyle = colors[2];
  ctx.globalAlpha = .14;
  ctx.lineWidth = 1;
  const grid = 50;
  for (let x = 0; x <= 800; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1000); ctx.stroke(); }
  for (let y = 0; y <= 1000; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke(); }
  ctx.globalAlpha = 1;

  const shapes = Math.round(4 + energy / 9);
  for (let i = 0; i < shapes; i += 1) {
    const x = random() * 900 - 50;
    const y = random() * 980;
    const size = 35 + random() * energy * 2.8;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((random() - .5) * 1.8);
    ctx.globalAlpha = .35 + random() * .5;
    ctx.fillStyle = i % 3 === 0 ? colors[2] : colors[1];
    if (i % 2) ctx.fillRect(-size / 2, -size / 6, size, size / 3);
    else { ctx.beginPath(); ctx.arc(0, 0, size / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = colors[2];
  ctx.font = '700 18px monospace';
  ctx.letterSpacing = '4px';
  ctx.fillText('CODEX / POSTER LAB', 58, 70);
  ctx.textAlign = 'right';
  ctx.fillText(String(seed).slice(0, 8).padStart(8, '0'), 742, 70);
  ctx.textAlign = 'left';

  const fontSize = words.length > 48 ? 82 : words.length > 26 ? 104 : 132;
  ctx.font = `900 ${fontSize}px Arial`;
  const lines = wrapPosterText(ctx, words, 680);
  const startY = 440 - (lines.length * fontSize * .43);
  lines.forEach((line, index) => {
    const y = startY + index * fontSize * .82;
    ctx.fillStyle = index === lines.length - 1 ? colors[1] : colors[2];
    ctx.fillText(line, 58, y);
  });

  ctx.strokeStyle = colors[1];
  ctx.lineWidth = 4;
  ctx.strokeRect(55, 835, 690, 105);
  ctx.fillStyle = colors[2];
  ctx.font = '700 17px monospace';
  ctx.fillText('AN IDEA BECOMES REAL WHEN YOU TOUCH IT.', 78, 883);
  ctx.font = '400 13px monospace';
  ctx.fillText('GENERATED LOCALLY • NO UPLOAD • YOUR ARTIFACT', 78, 912);
  $('#poster-seed').textContent = `SEED ${String(seed).slice(0, 8).padStart(8, '0')}`;
}

$$('.palette').forEach(button => button.addEventListener('click', () => {
  posterPalette = button.dataset.palette;
  $$('.palette').forEach(item => item.classList.toggle('active', item === button));
  generatePoster();
}));
$('#poster-energy').addEventListener('input', event => { $('#energy-output').textContent = event.target.value; });
$('#poster-form').addEventListener('submit', event => { event.preventDefault(); generatePoster(); toast('Poster generated'); });
$('#download-poster').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'codex-poster.png';
  link.href = $('#poster-canvas').toDataURL('image/png');
  link.click();
  toast('Poster PNG downloaded');
});

// LIVE MOTION STUDIES — canvas frames captured into real video elements
const motionControllers = new Map();

function startMotion(video, mode) {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  const random = randomFrom(hashText(mode));
  const particles = Array.from({ length: mode === 'flow' ? 70 : 46 }, () => ({
    x: random() * canvas.width,
    y: random() * canvas.height,
    radius: 1 + random() * 5,
    speed: .25 + random() * 1.3,
    phase: random() * Math.PI * 2
  }));
  const controller = { playing: true, frame: 0 };
  motionControllers.set(video.id, controller);

  function draw() {
    controller.frame += controller.playing ? 1 : 0;
    const t = controller.frame / 60;
    ctx.fillStyle = '#070a08';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glow = ctx.createRadialGradient(
      canvas.width * (.5 + Math.sin(t * .18) * .22),
      canvas.height * (.5 + Math.cos(t * .16) * .18), 10,
      canvas.width / 2, canvas.height / 2, canvas.width * .68
    );
    glow.addColorStop(0, mode === 'flow' ? 'rgba(223,255,63,.42)' : 'rgba(111,180,255,.38)');
    glow.addColorStop(.38, mode === 'flow' ? 'rgba(111,180,255,.16)' : 'rgba(223,255,63,.14)');
    glow.addColorStop(1, 'rgba(7,10,8,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'lighter';
    if (mode === 'flow') {
      for (let band = 0; band < 7; band += 1) {
        ctx.beginPath();
        for (let x = -30; x <= canvas.width + 30; x += 18) {
          const y = canvas.height * (.18 + band * .105) + Math.sin(x * .009 + t * (1.2 + band * .08)) * (35 + band * 7);
          if (x === -30) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = band % 2 ? 'rgba(111,180,255,.24)' : 'rgba(223,255,63,.3)';
        ctx.lineWidth = 1 + band * .35;
        ctx.stroke();
      }
    } else {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      for (let ring = 0; ring < 7; ring += 1) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 90 + ring * 66, 38 + ring * 31, t * (.05 + ring * .006), 0, Math.PI * 2);
        ctx.strokeStyle = ring % 2 ? 'rgba(223,255,63,.22)' : 'rgba(111,180,255,.28)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();
    }

    particles.forEach((particle, index) => {
      if (controller.playing) {
        particle.x = (particle.x + particle.speed * (mode === 'flow' ? 2.2 : .5)) % canvas.width;
        particle.y += Math.sin(t + particle.phase) * .35;
      }
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius * (1 + Math.sin(t * 1.7 + particle.phase) * .28), 0, Math.PI * 2);
      ctx.fillStyle = index % 3 ? 'rgba(223,255,63,.72)' : 'rgba(111,180,255,.82)';
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';

    ctx.fillStyle = 'rgba(241,239,231,.72)';
    ctx.font = '700 14px monospace';
    ctx.fillText(mode === 'flow' ? 'LIVE / FLOW FIELD' : 'LIVE / ORBITAL STUDY', 38, 48);
    ctx.textAlign = 'right';
    ctx.fillText(String(controller.frame).padStart(6, '0'), canvas.width - 38, 48);
    ctx.textAlign = 'left';
    requestAnimationFrame(draw);
  }

  draw();
  if (canvas.captureStream) {
    video.srcObject = canvas.captureStream(30);
    video.play().catch(() => {});
  }
}

startMotion($('#motion-one'), 'flow');
startMotion($('#motion-two'), 'orbit');

$$('.video-toggle').forEach(button => button.addEventListener('click', () => {
  const video = $(`#${button.dataset.video}`);
  const controller = motionControllers.get(video.id);
  if (!controller) return;
  controller.playing = !controller.playing;
  if (controller.playing) video.play().catch(() => {}); else video.pause();
  button.textContent = controller.playing ? 'Ⅱ' : '▶';
  button.setAttribute('aria-label', `${controller.playing ? 'Pause' : 'Play'} motion video`);
}));

renderWeb();
analyzeData();
tameNotes();
generatePoster();
