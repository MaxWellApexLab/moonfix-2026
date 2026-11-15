# MoonFix — Lunar Mission Window Navigator

**A new, standalone implementation of an offline lunar south-pole site explorer.**

Open **`index.html`** in a recent desktop or mobile browser. The application is completely self-contained; no web server, API key, network access, framework, CDN, or account is required.

## What's inside

- **10 candidate landing coordinates** and **720 participant-provided, hour-indexed scientific reference samples**, spanning **14–16 November 2026 (TDB)**. This is the *scientific date coverage*, not a record of when software was created.
- Interactive south-pole schematic; select a pin or rank-table row to inspect a site.
- Scene controls for mission start/end hour, 0–3° terrain clearance margin, longest required uninterrupted model window, and P95 local slope cutoff.
- Filtered site ranking (number of passing samples, linearly modeled joint-visibility hours, longest modeled window, slope).
- Per-site Sun and Earth terrain-clearance graph, hour scrubber and playback.
- Direct two-site comparison with an interactive 72-hour classification strip.
- Model-window finder with boundaries, durations and warnings when a window touches the reference sample boundary.
- CSV exports for rankings and computed windows, plus shareable URL state when published on a website.
- Responsive interface and documentation of scientific limitations.

## How to run

Just open `index.html` in Chrome, Edge, Firefox or Safari. Everything needed for the viewer is embedded into that file, including the terrain thumbnails and reference data. Hosting that same file on GitHub Pages or static hosting is also supported. The URL sharing feature is most useful when hosted (a `file://` link is only valid on the local computer).

## Project layout

| Path | Purpose |
| --- | --- |
| `index.html` | Fully offline, ready-to-run standalone app |
| `src/ui.html` | Fresh HTML interface template |
| `src/ui.css` | Responsive styles |
| `src/engine.js` | Independent mathematical analysis of the supplied hourly samples |
| `src/app.js` | UI state, SVG rendering, filters and downloads |
| `data/mission_samples.json` | Normalized scientific reference input, 10 sites × 72 sample epochs |
| `scripts/build.py` | Deterministically rebuild `index.html` using packaged sources |
| `scripts/prepare_reference_data.py` | Optional input normalization from a separately provided research reference JSON |
| `scripts/check_release.py` | Check project files and ZIP metadata against the event start time |
| `tests/` | Engine and real-browser interaction tests |
| `screenshots/` | Fresh screenshots from real Chromium rendering |
| `docs/` | Operating guide and scientific boundaries |

## Rebuild and test

The viewer can be rebuilt using **Python's standard library**:

```bash
python scripts/build.py
```

For tests, install Node.js, `pytest`, and Playwright with Chromium:

```bash
node tests/test_engine.js
python -m pytest -q tests/test_app.py
```

The browser tests inject the standalone HTML into Chromium without network requests. They also test CSV downloads, both desktop and phone-sized layout, ranking, dynamic filters and shareable state.

## Data provenance and interpretation

The packaged reference dataset was **normalized from scientific material supplied as a reference to the project**. Its JPL Horizons DE441 geometry and NASA LOLA-derived 80 m terrain skyline values are **not independently regenerated** in this repository. The new analysis engine, UI, SVG plotting, report export and code tests were developed for this new application. A sample's ephemeris epoch is an astronomical time coordinate, not a software-development timestamp.

The model checks whether both the Sun and Earth are above their corresponding local, azimuth-specific terrain skyline plus an extra user-selected margin. Sample counts count **epochs** rather than confirmed continuous hours. The model's continuous-window durations are a **linear interpolation proxy between sampled endpoints**, limited to the 71 one-hour intervals between the 72 available samples. No extrapolation outside the reference sample range is performed.

This is an **educational/early-stage mission-analysis prototype**, not a certified flight or landing-site safety tool. It does not cover communication link budgets, terrain obstacles below raster resolution, boulders, energy storage, lunar nights outside the sample span, spacecraft dynamics or operational certification. More detail: [`docs/SCIENCE_NOTES.md`](docs/SCIENCE_NOTES.md).

Primary third-party source references: [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/), [NASA LRO LOLA](https://pds-geosciences.wustl.edu/missions/lro/lola.htm).

## New package file times

All delivered project files are generated in the current development run and the packaging script checks their actual filesystem modification/change times as well as ZIP entry timestamps against the declared start of the New York local event (**2026-11-14 10:00 EST = 2026-11-14 15:00 UTC**). The script **does not alter timestamps** and rejects any early file. The archive includes no Git history and no preexisting source-code files. The scientific reference dataset is included as data, with its origin stated above.

## Attribution

This is an independent educational application and is neither affiliated with nor certified by NASA. Assistance from a generative AI model was used in implementation and tests; review and proper attribution are the submitter's responsibility.


## Official submission transparency / deployment

This package includes `docs/AI_DISCLOSURE.md` and `docs/DATA_SOURCES.md`, a visible on-page provenance and AI-assistance statement, and separate submission-ready English field copy in the sibling `submission/` directory of the complete kit. The 2026 NASA Space Apps Project Submission Guide asks for a **public final-project link** AND a **separate public demo link** (video <=30 seconds or slide deck <=7 slides), plus all required English fields. Saving a project draft is not a final submission; the team must select **Submit for Judging**.

**Important:** Publishing this updated `index.html` to GitHub Pages is a separate user action; generating this package does not update the user's live GitHub Pages site. Do not claim any download artifact is already publicly hosted. For documented research data limitations and attribution, consult `docs/DATA_SOURCES.md`.
