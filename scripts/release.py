#!/usr/bin/env python3
"""Build and archive this new codebase using actual clock-based file times."""
import datetime as dt
import json
import shutil
import zipfile
from pathlib import Path

from build import build
from check_release import ROOT, START, check_archive, check_files, package_files


def main():
    if dt.datetime.now(dt.timezone.utc) < START:
        raise RuntimeError('Official event has not started; refusing to package')
    build()
    # No git history, previous releases, caches, or source snapshots are included.
    checked = check_files(p for p in package_files() if p.name != 'BUILD_MANIFEST.json')
    manifest = {
        'project': 'MoonFix — fresh standalone implementation',
        'event': '2026 NYC local event',
        'event_start_new_york': '2026-11-14T10:00:00-05:00',
        'event_start_utc': START.isoformat(),
        'generated_at_utc':dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),
        'note': 'File times below are read from the current file system; this tool never sets or backdates them. Data sample epochs are scientific time coordinates, not creation times.',
        'files': checked
    }
    (ROOT/'BUILD_MANIFEST.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    files=package_files()
    check_files(files)
    archive=ROOT.parent/'MoonFix_Fresh_2026.zip'
    with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=8) as z:
        for p in files:z.write(p,arcname=f'{ROOT.name}/{p.relative_to(ROOT).as_posix()}')
    n=check_archive(archive)
    standalone=ROOT.parent/'MoonFix_Fresh_2026_Standalone.html'
    shutil.copyfile(ROOT/'index.html',standalone)
    stat=standalone.stat()
    assert dt.datetime.fromtimestamp(stat.st_mtime,dt.timezone.utc)>=START
    print(f'RELEASED: {archive} ({archive.stat().st_size:,} bytes, {n} project entries)')
    print(f'STANDALONE: {standalone} ({standalone.stat().st_size:,} bytes)')


if __name__=='__main__':main()
