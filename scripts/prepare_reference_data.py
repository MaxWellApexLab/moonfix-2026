#!/usr/bin/env python3
"""Normalize user-supplied scientific reference samples into MoonFix input schema.

This utility is for development with a separately provided scientific reference
JSON. It is not an ephemeris or lunar terrain pipeline; provenance is retained.
The published app is fully self-contained and needs no source file present.
"""
import argparse
import json
from datetime import datetime
from pathlib import Path

SAMPLE_FORMAT = '%Y-%b-%d %H:%M:%S.%f'


def convert(input_path: Path, output_path: Path):
    raw = json.loads(input_path.read_text(encoding='utf8'))
    result = {
        'schema': 'moonfix-reference-1',
        'timeScale': 'TDB',
        'timeInterpretation': 'Ephemeris sample epoch, not software creation time',
        'siteDataSource': 'Participant-supplied JPL Horizons DE441 and NASA LOLA 80 m derived reference dataset',
        'method': 'Geometric Sun/Earth elevation minus previously derived local terrain skyline; not independent recalculation of JPL or LOLA.',
        'limitations': 'Hourly samples within available dates only. Between-hour windows are linear-model estimates, not verified continuous visibility. Not a landing safety certificate.',
        'sites': []
    }
    for s in raw['sites']:
        obs = []
        for r in s['rows']:
            iso = datetime.strptime(r['time'], SAMPLE_FORMAT).strftime('%Y-%m-%dT%H:%M:%S')
            obs.append([iso, r['sunEl'], r['sunAz'], r['sunH'], r['earthEl'], r['earthAz'], r['earthH']])
        result['sites'].append({
            'id': s['id'], 'lat': s['lat'], 'lon': s['lon'],
            'slope95': s['slope95'], 'slope50': s['slope50'],
            'relief': s['relief'], 'elevation': s['elevation'],
            'terrainImage': s.get('reliefPng', ''),
            'samples': obs
        })
    n = len(result['sites'])
    assert n == 10
    assert all(len(s['samples']) == 72 for s in result['sites'])
    assert all([r[0] for r in s['samples']] == [r[0] for r in result['sites'][0]['samples']] for s in result['sites'])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
    print(f'Wrote {output_path} with {n} sites, {sum(len(s["samples"]) for s in result["sites"])} sample epochs')


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('reference_json', type=Path)
    p.add_argument('--output', type=Path, default=Path('data/mission_samples.json'))
    a = p.parse_args()
    convert(a.reference_json, a.output)
