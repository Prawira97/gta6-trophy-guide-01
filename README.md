# GTA 6 Trophy Guide & Tracker — All 55 PS5 Trophies

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Prawira97/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Prawira97/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

Entry for the make.fun competition
[gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01):
build the best GTA 6 trophy guide — an offline web app that is the guide
and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI.

## What it is

An offline guide and checklist for all 55 official PS5 trophies
(1 platinum, 2 gold, 6 silver, 46 bronze — 28 of them hidden on
PlayStation until earned). Every trophy shows its official name,
description and grade exactly as PlayStation publishes them, plus a guide
written for this entry that cites its sources: what to do, where and how,
and when it can be missed.

- **Tracker** — tick trophies off; progress is saved in the browser
  (localStorage) and can be exported to a file and imported back.
- **Filters** — by grade, by kind (story, side quests, collectibles,
  activities, robberies, exploration, money, misc), by earned status,
  and by missable; plus text search.
- **Spoiler setting** — hides the names and descriptions of the 12
  story trophies until they are earned.
- **Roadmap to the platinum** — three phases (story 60–80 h, 100%
  completion ~100 h, Strangers & cleanup 10–20 h; about 200 h in one
  playthrough, no online trophies), with the full 100% checklist
  numbers and the one potentially missable trophy flagged:
  Positive Mental Attitude (the Chapter 1 balcony meditation).
- **Sources** — every guide names its sources (KeenGamer, GameMapa,
  Push Square, PowerPyx, Insider Gaming, GamesRadar+; the official
  list as carried by the kit, Exophase / PSNProfiles). Nothing is
  copied from them: each guide is written in our own words.

The look is our own — no Rockstar logo, no official artwork, no game
screenshots. The app loads nothing over the network: open
`app/index.html` from its own files and it works offline.

## How it works

- `main.ts` — the entrypoint (Node 22, standard library only). It
  copies `app/` and `screenshots/` to `/output` and writes
  `/output/dossier.json` with `buildDossier` from
  `vendor/makefun-frontend.ts` (vendored from the kit, unchanged).
- `app/` — the guide as static files: `index.html`, `style.css`,
  `app.js`, and `app/data/trophies.json` (the 55 trophies with guides).
- `serve.ts` — a tiny static server for local tries
  (`node serve.ts`, then open http://localhost:8080).

Run the entrypoint:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Two runs write byte-identical output (verified: same SHA-256 of
`dossier.json`).

## License

MIT — see [LICENSE](LICENSE).
