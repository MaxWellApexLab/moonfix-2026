#!/usr/bin/env python3
"""Create a fully offline MoonFix index.html from the clean app sources."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = ('/* __MOONFIX_STYLES__ */', '/* __MOONFIX_SCRIPT__ */', '__MOONFIX_DATA__')


def build():
    html = (ROOT/'src/ui.html').read_text(encoding='utf8')
    assert all(s in html for s in REQUIRED)
    css = (ROOT/'src/ui.css').read_text(encoding='utf8')
    engine = (ROOT/'src/engine.js').read_text(encoding='utf8')
    app = (ROOT/'src/app.js').read_text(encoding='utf8')
    d = json.loads((ROOT/'data/mission_samples.json').read_text(encoding='utf8'))
    assert len(d['sites']) == 10 and sum(map(lambda s: len(s['samples']), d['sites'])) == 720
    data = json.dumps(d, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    html = html.replace(REQUIRED[0], css).replace(REQUIRED[1], engine+'\n'+app).replace(REQUIRED[2], data)
    assert '__MOONFIX_' not in html
    (ROOT/'index.html').write_text(html, encoding='utf8')
    print(f'Built {ROOT / "index.html"} ({len(html):,} chars)')


if __name__ == '__main__':
    build()
