// GTA VI Trophy Guide & Tracker: loads app/data/trophies.json, renders the
// checklist, and keeps progress in the browser. Everything runs offline:
// the page fetches only its own data file, and the only links out are the
// source citations a reader follows by clicking them.

const PROGRESS_KEY = 'gta6-trophy-progress-v1';
const SPOILER_KEY = 'gta6-trophy-spoiler-v1';
const DEFAULT_DETAIL_ID = 28; // Positive Mental Attitude, the missable one

const listEl = document.getElementById('trophy-list');
const detailEl = document.getElementById('detail-card');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const gradeCountsEl = document.getElementById('grade-counts');
const resultCountEl = document.getElementById('result-count');
const searchEl = document.getElementById('search');
const gradeFilterEl = document.getElementById('grade-filter');
const kindFilterEl = document.getElementById('kind-filter');
const statusFilterEl = document.getElementById('status-filter');
const spoilerToggle = document.getElementById('spoiler-toggle');

let trophies = [];
let earned = new Set(readStoredSet(PROGRESS_KEY));
let spoilerOn = localStorage.getItem(SPOILER_KEY) === '1';
let selectedId = DEFAULT_DETAIL_ID;

function readStoredSet(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoilerOn ? '1' : '0');
}

function isStory(trophy) {
  return trophy.kind === 'story';
}

function isHiddenFromSpoiler(trophy) {
  return spoilerOn && isStory(trophy) && !earned.has(trophy.id);
}

function gradeWord(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function visibleTrophies() {
  const query = searchEl.value.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (gradeFilterEl.value !== 'all' && trophy.grade !== gradeFilterEl.value) return false;
    if (kindFilterEl.value === 'missable' && !trophy.missable) return false;
    if (kindFilterEl.value !== 'all' && kindFilterEl.value !== 'missable' && trophy.kind !== kindFilterEl.value) return false;
    if (statusFilterEl.value === 'earned' && !earned.has(trophy.id)) return false;
    if (statusFilterEl.value === 'todo' && earned.has(trophy.id)) return false;
    if (query && !(trophy.name.toLowerCase().includes(query) || trophy.description.toLowerCase().includes(query))) return false;
    return true;
  });
}

function badge(text, extraClass) {
  const span = document.createElement('span');
  span.className = `badge ${extraClass}`;
  span.textContent = text;
  return span;
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  progressFill.style.width = `${pct}%`;
  progressText.textContent = `${done} of ${total} earned — ${pct}% to the platinum`;
  document.getElementById('controls-progress').textContent = `${done}/${total} · ${pct}%`;
  const byGrade = {};
  for (const trophy of trophies) {
    if (!earned.has(trophy.id)) continue;
    byGrade[trophy.grade] = (byGrade[trophy.grade] ?? 0) + 1;
  }
  const totals = {};
  for (const trophy of trophies) totals[trophy.grade] = (totals[trophy.grade] ?? 0) + 1;
  gradeCountsEl.textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((grade) => `${byGrade[grade] ?? 0}/${totals[grade] ?? 0} ${grade}`)
    .join(' · ');
}

function renderList() {
  const shown = visibleTrophies();
  resultCountEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
  listEl.replaceChildren();
  for (const trophy of shown) {
    const item = document.createElement('li');
    item.className = 'trophy' + (earned.has(trophy.id) ? ' earned' : '') + (trophy.id === selectedId ? ' selected' : '');
    item.dataset.trophyId = String(trophy.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.id);
    box.setAttribute('aria-label', `Mark ${trophy.name} earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(trophy.id);
      else earned.delete(trophy.id);
      saveProgress();
      renderAll();
    });
    box.addEventListener('click', (event) => event.stopPropagation());
    item.append(box);

    const body = document.createElement('div');
    const name = document.createElement('p');
    name.className = 'trophy-name';
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    if (isHiddenFromSpoiler(trophy)) {
      name.textContent = 'Story trophy — hidden until earned';
      name.classList.add('spoiler-hidden');
      desc.textContent = 'Turn spoilers off, or earn this trophy, to reveal its name and description.';
      desc.classList.add('spoiler-hidden');
    } else {
      name.textContent = trophy.name;
      desc.textContent = trophy.description;
    }
    body.append(name, desc);

    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    meta.append(badge(gradeWord(trophy.grade), trophy.grade));
    meta.append(badge(trophy.kind, 'kind'));
    if (trophy.hidden) meta.append(badge('Hidden', 'hidden-trophy'));
    if (trophy.missable) meta.append(badge('Missable', 'missable'));
    body.append(meta);
    item.append(body);

    const gradeWordEl = document.createElement('span');
    gradeWordEl.className = 'trophy-grade-word';
    gradeWordEl.textContent = gradeWord(trophy.grade);
    item.append(gradeWordEl);

    item.addEventListener('click', () => {
      selectedId = trophy.id;
      renderAll();
    });
    listEl.append(item);
  }
}

function renderDetail() {
  const trophy = trophies.find((entry) => entry.id === selectedId);
  detailEl.replaceChildren();
  if (!trophy) {
    const empty = document.createElement('p');
    empty.className = 'detail-empty';
    empty.textContent = 'Pick a trophy from the list to read its guide.';
    detailEl.append(empty);
    return;
  }

  const title = document.createElement('h2');
  title.textContent = isHiddenFromSpoiler(trophy) ? 'Story trophy — hidden until earned' : trophy.name;
  detailEl.append(title);

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = isHiddenFromSpoiler(trophy)
    ? 'Official description hidden by the spoiler setting.'
    : `“${trophy.description}” — ${gradeWord(trophy.grade)}`;
  detailEl.append(official);

  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  meta.append(badge(gradeWord(trophy.grade), trophy.grade));
  meta.append(badge(trophy.kind, 'kind'));
  if (trophy.hidden) meta.append(badge('Hidden', 'hidden-trophy'));
  if (trophy.missable) meta.append(badge('Missable', 'missable'));
  if (earned.has(trophy.id)) meta.append(badge('Earned', 'kind'));
  detailEl.append(meta);

  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'Guide';
  detailEl.append(guideHeading);
  const guide = document.createElement('p');
  guide.textContent = trophy.guide;
  detailEl.append(guide);

  if (Array.isArray(trophy.steps) && trophy.steps.length > 0) {
    const stepsHeading = document.createElement('h3');
    stepsHeading.textContent = 'What to do';
    detailEl.append(stepsHeading);
    const steps = document.createElement('ol');
    for (const step of trophy.steps) {
      const li = document.createElement('li');
      li.textContent = step;
      steps.append(li);
    }
    detailEl.append(steps);
  }

  if (trophy.missable && trophy.missable_note) {
    const note = document.createElement('p');
    note.className = 'missable-note';
    note.textContent = `When it can be missed: ${trophy.missable_note}`;
    detailEl.append(note);
  } else {
    const note = document.createElement('p');
    note.className = 'missable-note';
    note.textContent = 'When it can be missed: it cannot — free roam stays open after the story, and there is no point of no return for this one.';
    detailEl.append(note);
  }

  if (trophy.unsolved) {
    const note = document.createElement('p');
    note.className = 'unsolved-note';
    note.textContent = 'Still unsolved: as of November 2026 no guide has confirmed the exact trigger for this trophy. The guide above is the best current reading of its description — do not trust a method that cites no source.';
    detailEl.append(note);
  }

  if (Array.isArray(trophy.sources) && trophy.sources.length > 0) {
    const sourcesHeading = document.createElement('h3');
    sourcesHeading.textContent = 'Sources';
    detailEl.append(sourcesHeading);
    const sources = document.createElement('ul');
    sources.className = 'sources';
    for (const source of trophy.sources) {
      const li = document.createElement('li');
      if (source.url) {
        const link = document.createElement('a');
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = `${source.site} — ${source.title}`;
        li.append(link);
      } else {
        li.textContent = `${source.site} — ${source.title}`;
      }
      sources.append(li);
    }
    detailEl.append(sources);
  }
}

function renderSpoilerToggle() {
  spoilerToggle.setAttribute('aria-pressed', spoilerOn ? 'true' : 'false');
  spoilerToggle.textContent = spoilerOn ? 'Spoilers: hidden' : 'Spoilers: shown';
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderSpoilerToggle();
}

function downloadProgress() {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', platform: 'PlayStation 5', earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importProgress(file) {
  const parsed = JSON.parse(await file.text());
  const ids = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(ids)) throw new Error('not a progress file');
  const valid = new Set(trophies.map((trophy) => trophy.id));
  earned = new Set(ids.filter((id) => valid.has(id)));
  saveProgress();
  renderAll();
}

async function loadTrophies() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`trophies.json: HTTP ${response.status}`);
  const doc = await response.json();
  trophies = doc.trophies ?? doc;
}

searchEl.addEventListener('input', renderList);
gradeFilterEl.addEventListener('change', renderList);
kindFilterEl.addEventListener('change', renderList);
statusFilterEl.addEventListener('change', renderList);

spoilerToggle.addEventListener('click', () => {
  spoilerOn = !spoilerOn;
  saveSpoiler();
  renderAll();
});

document.getElementById('export').addEventListener('click', downloadProgress);

document.getElementById('import-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    await importProgress(file);
  } catch {
    alert('That file is not a trophy-progress export from this guide.');
  }
  event.target.value = '';
});

document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned ticks? Export first if you want a backup.')) return;
  earned = new Set();
  saveProgress();
  renderAll();
});

try {
  await loadTrophies();
  renderAll();
} catch {
  listEl.replaceChildren();
  const error = document.createElement('li');
  error.textContent = 'Could not load data/trophies.json. Open this guide through a local server (node serve.ts, then http://localhost:8080) — browsers block file reads from a plain file:// page.';
  listEl.append(error);
  detailEl.replaceChildren();
}
