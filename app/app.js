// GTA VI Trophy Guide & Tracker: loads app/data/trophies.json, paints the
// checklist, and keeps progress in the browser. Everything runs offline:
// the page fetches only its own data file, and the only links out are the
// source citations a reader follows by clicking them.

const EARNED_KEY = 'gta6-trophy-progress-v1';
const SPOILER_KEY = 'gta6-trophy-spoiler-v1';
const FIRST_GUIDE_ID = 28; // Positive Mental Attitude, the missable one

const rowsEl = document.getElementById('rows');
const cardEl = document.getElementById('guideCard');
const fillEl = document.getElementById('fill');
const progressLineEl = document.getElementById('progressLine');
const gradeLineEl = document.getElementById('gradeLine');
const shownCountEl = document.getElementById('shownCount');
const queryEl = document.getElementById('q');
const gradeSelEl = document.getElementById('gradeSel');
const kindSelEl = document.getElementById('kindSel');
const statusSelEl = document.getElementById('statusSel');
const spoilerBtn = document.getElementById('spoilerBtn');

let allTrophies = [];
let earnedIds = new Set(loadIdSet(EARNED_KEY));
let spoilersHidden = localStorage.getItem(SPOILER_KEY) === '1';
let openId = FIRST_GUIDE_ID;

function loadIdSet(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function storeEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earnedIds].sort((a, b) => a - b)));
}

function storeSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoilersHidden ? '1' : '0');
}

function isStoryTrophy(trophy) {
  return trophy.kind === 'story';
}

function concealedBySpoiler(trophy) {
  return spoilersHidden && isStoryTrophy(trophy) && !earnedIds.has(trophy.id);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function filteredTrophies() {
  const query = queryEl.value.trim().toLowerCase();
  return allTrophies.filter((trophy) => {
    if (gradeSelEl.value !== 'all' && trophy.grade !== gradeSelEl.value) return false;
    if (kindSelEl.value === 'missable' && !trophy.missable) return false;
    if (kindSelEl.value !== 'all' && kindSelEl.value !== 'missable' && trophy.kind !== kindSelEl.value) return false;
    if (statusSelEl.value === 'earned' && !earnedIds.has(trophy.id)) return false;
    if (statusSelEl.value === 'todo' && earnedIds.has(trophy.id)) return false;
    if (query && !(trophy.name.toLowerCase().includes(query) || trophy.description.toLowerCase().includes(query))) return false;
    return true;
  });
}

function makePill(text, kind) {
  const span = document.createElement('span');
  span.className = `pill ${kind}`;
  span.textContent = text;
  return span;
}

function paintProgress() {
  const total = allTrophies.length;
  const done = earnedIds.size;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  fillEl.style.width = `${pct}%`;
  progressLineEl.textContent = `${done} of ${total} earned — ${pct}% to the platinum`;
  document.getElementById('toolbarCount').textContent = `${done}/${total} · ${pct}%`;
  const got = {};
  const totals = {};
  for (const trophy of allTrophies) {
    totals[trophy.grade] = (totals[trophy.grade] ?? 0) + 1;
    if (earnedIds.has(trophy.id)) got[trophy.grade] = (got[trophy.grade] ?? 0) + 1;
  }
  gradeLineEl.textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((grade) => `${got[grade] ?? 0}/${totals[grade] ?? 0} ${grade}`)
    .join(' · ');
}

function paintRows() {
  const shown = filteredTrophies();
  shownCountEl.textContent = `Showing ${shown.length} of ${allTrophies.length} trophies`;
  rowsEl.replaceChildren();
  for (const trophy of shown) {
    const row = document.createElement('li');
    row.className = 'trow' + (earnedIds.has(trophy.id) ? ' earned' : '') + (trophy.id === openId ? ' picked' : '');
    row.dataset.trophyId = String(trophy.id);

    const tick = document.createElement('input');
    tick.type = 'checkbox';
    tick.checked = earnedIds.has(trophy.id);
    tick.setAttribute('aria-label', `Mark ${trophy.name} earned`);
    tick.addEventListener('change', () => {
      if (tick.checked) earnedIds.add(trophy.id);
      else earnedIds.delete(trophy.id);
      storeEarned();
      paintAll();
    });
    tick.addEventListener('click', (event) => event.stopPropagation());
    row.append(tick);

    const body = document.createElement('div');
    body.className = 'tbody';
    const name = document.createElement('p');
    name.className = 'tname';
    const desc = document.createElement('p');
    desc.className = 'tdesc';
    if (concealedBySpoiler(trophy)) {
      name.textContent = 'Story trophy — hidden until earned';
      name.classList.add('concealed');
      desc.textContent = 'Turn spoilers off, or earn this trophy, to reveal its name and description.';
      desc.classList.add('concealed');
    } else {
      name.textContent = trophy.name;
      desc.textContent = trophy.description;
    }
    body.append(name, desc);

    const pills = document.createElement('div');
    pills.className = 'pills';
    pills.append(makePill(gradeLabel(trophy.grade), trophy.grade));
    pills.append(makePill(trophy.kind, 'kind'));
    if (trophy.hidden) pills.append(makePill('Hidden', 'hidden-trophy'));
    if (trophy.missable) pills.append(makePill('Missable', 'missable'));
    body.append(pills);
    row.append(body);

    const gradeWord = document.createElement('span');
    gradeWord.className = 'grade-word';
    gradeWord.textContent = gradeLabel(trophy.grade);
    row.append(gradeWord);

    row.addEventListener('click', () => {
      openId = trophy.id;
      paintAll();
    });
    rowsEl.append(row);
  }
}

function paintGuide() {
  const trophy = allTrophies.find((entry) => entry.id === openId);
  cardEl.replaceChildren();
  if (!trophy) {
    const empty = document.createElement('p');
    empty.className = 'detail-empty';
    empty.textContent = 'Pick a trophy from the list to read its guide.';
    cardEl.append(empty);
    return;
  }

  const title = document.createElement('h2');
  title.textContent = concealedBySpoiler(trophy) ? 'Story trophy — hidden until earned' : trophy.name;
  cardEl.append(title);

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = concealedBySpoiler(trophy)
    ? 'Official description hidden by the spoiler setting.'
    : `“${trophy.description}” — ${gradeLabel(trophy.grade)}`;
  cardEl.append(official);

  const pills = document.createElement('div');
  pills.className = 'pills';
  pills.append(makePill(gradeLabel(trophy.grade), trophy.grade));
  pills.append(makePill(trophy.kind, 'kind'));
  if (trophy.hidden) pills.append(makePill('Hidden', 'hidden-trophy'));
  if (trophy.missable) pills.append(makePill('Missable', 'missable'));
  if (earnedIds.has(trophy.id)) pills.append(makePill('Earned', 'kind'));
  cardEl.append(pills);

  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'Guide';
  cardEl.append(guideHeading);
  const guide = document.createElement('p');
  guide.textContent = trophy.guide;
  cardEl.append(guide);

  if (Array.isArray(trophy.steps) && trophy.steps.length > 0) {
    const stepsHeading = document.createElement('h3');
    stepsHeading.textContent = 'What to do';
    cardEl.append(stepsHeading);
    const steps = document.createElement('ol');
    for (const step of trophy.steps) {
      const li = document.createElement('li');
      li.textContent = step;
      steps.append(li);
    }
    cardEl.append(steps);
  }

  const missableLine = document.createElement('p');
  missableLine.className = 'missable-note';
  missableLine.textContent = trophy.missable && trophy.missable_note
    ? `When it can be missed: ${trophy.missable_note}`
    : 'When it can be missed: it cannot — free roam stays open after the story, and there is no point of no return for this one.';
  cardEl.append(missableLine);

  if (trophy.unsolved) {
    const note = document.createElement('p');
    note.className = 'unsolved-note';
    note.textContent = 'Still unsolved: as of November 2026 no guide has confirmed the exact trigger for this trophy. The guide above is the best current reading of its description — do not trust a method that cites no source.';
    cardEl.append(note);
  }

  if (Array.isArray(trophy.sources) && trophy.sources.length > 0) {
    const sourcesHeading = document.createElement('h3');
    sourcesHeading.textContent = 'Sources';
    cardEl.append(sourcesHeading);
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
    cardEl.append(sources);
  }
}

function paintSpoilerButton() {
  spoilerBtn.setAttribute('aria-pressed', spoilersHidden ? 'true' : 'false');
  spoilerBtn.textContent = spoilersHidden ? 'Spoilers: hidden' : 'Spoilers: shown';
}

function paintAll() {
  paintProgress();
  paintRows();
  paintGuide();
  paintSpoilerButton();
}

function downloadEarned() {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', platform: 'PlayStation 5', earned: [...earnedIds].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

async function restoreEarned(file) {
  const parsed = JSON.parse(await file.text());
  const ids = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(ids)) throw new Error('not a progress file');
  const valid = new Set(allTrophies.map((trophy) => trophy.id));
  earnedIds = new Set(ids.filter((id) => valid.has(id)));
  storeEarned();
  paintAll();
}

async function fetchTrophies() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`trophies.json: HTTP ${response.status}`);
  const doc = await response.json();
  allTrophies = doc.trophies ?? doc;
}

queryEl.addEventListener('input', paintRows);
gradeSelEl.addEventListener('change', paintRows);
kindSelEl.addEventListener('change', paintRows);
statusSelEl.addEventListener('change', paintRows);

spoilerBtn.addEventListener('click', () => {
  spoilersHidden = !spoilersHidden;
  storeSpoiler();
  paintAll();
});

document.getElementById('exportBtn').addEventListener('click', downloadEarned);

document.getElementById('importInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    await restoreEarned(file);
  } catch {
    alert('That file is not a trophy-progress export from this guide.');
  }
  event.target.value = '';
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned ticks? Export first if you want a backup.')) return;
  earnedIds = new Set();
  storeEarned();
  paintAll();
});

try {
  await fetchTrophies();
  paintAll();
} catch {
  rowsEl.replaceChildren();
  const error = document.createElement('li');
  error.textContent = 'Could not load data/trophies.json. Open this guide through a local server (node serve.ts, then http://localhost:8080) — browsers block file reads from a plain file:// page.';
  rowsEl.append(error);
  cardEl.replaceChildren();
}
