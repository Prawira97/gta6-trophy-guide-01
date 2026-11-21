// Entrypoint for the gta6-trophy-guide-01 entry (Node 22, standard library
// only). The guide itself is the static files under app/ — a browser opens
// app/index.html (one module script, one stylesheet, no build step) and it
// works with the network off: it loads nothing from outside app/, and its
// trophy list and guides live in app/data/trophies.json.
//
// This program hands the guide in. It copies app/ and screenshots/ from
// beside this file into the output directory and writes dossier.json there,
// using buildDossier from the vendored make.fun library. Leave
// vendor/makefun-frontend.ts untouched: the scorer requires dossier.json to
// be byte for byte what its own copy of that library writes.
//
// Run it outside the grader's container with MAKEFUN_OUTPUT_DIR standing
// in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

mkdirSync(outputDir, { recursive: true });
cpSync(appDir, join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps (from the kit's reference/gate.json): only
// text_max_bytes shapes the bytes; the rest refuse an entry the scorer
// would refuse — more than 4 screenshots or one over 256 KiB; more than
// 993 files and directories in app/ or 48 MiB of app files (app/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
