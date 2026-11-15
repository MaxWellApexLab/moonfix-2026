#!/usr/bin/env python3
"""Check genuine filesystem and archive timestamps without changing them."""
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
START = dt.datetime(2026,11,14,15,0,0,tzinfo=dt.timezone.utc)  # NYC 10:00 EST
IGNORED = {'__pycache__','.pytest_cache','.git'}


def package_files():
    return sorted(p for p in ROOT.rglob('*') if p.is_file() and not any(part in IGNORED for part in p.relative_to(ROOT).parts) and p.suffix != '.pyc')


def check_files(paths):
    result = []
    for p in paths:
        stat = p.stat()
        modified = dt.datetime.fromtimestamp(stat.st_mtime, tz=dt.timezone.utc)
        changed = dt.datetime.fromtimestamp(stat.st_ctime, tz=dt.timezone.utc)
        if modified < START or changed < START:
            raise ValueError(f'Before event start: {p.name}: modified={modified}, changed={changed}')
        result.append({'path':str(p.relative_to(ROOT)), 'modified_utc':modified.isoformat(timespec='seconds'),
                       'changed_utc':changed.isoformat(timespec='seconds'),
                       'size_bytes':stat.st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    return result


def check_archive(archive_path):
    start_tuple=START.astimezone().timetuple()[:6]
    with zipfile.ZipFile(archive_path) as z:
        members=z.infolist()
        for m in members:
            if m.is_dir():continue
            if m.date_time < start_tuple:
                raise ValueError(f'ZIP archive entry predates event: {m.filename}: {m.date_time}')
            if not m.filename.startswith(ROOT.name+'/'):
                raise ValueError(f'Unexpected archive root: {m.filename}')
            rel=m.filename[len(ROOT.name)+1:]
            if hashlib.sha256(z.read(m)).hexdigest()!=hashlib.sha256((ROOT/rel).read_bytes()).hexdigest():
                raise ValueError('ZIP content hash mismatch '+m.filename)
        if len(members) != len(package_files()):
            raise ValueError(f'Member count mismatch {len(members)} != {len(package_files())}')
    return len(members)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--zip',type=Path)
    a=parser.parse_args()
    files=package_files()
    result=check_files(files)
    print(f'FILES VERIFIED: {len(result)} files have genuine mtime/ctime at or after {START.isoformat()}')
    if a.zip:print(f'ZIP VERIFIED: {check_archive(a.zip)} entries, each after event start and content hash-matched')


if __name__=='__main__':main()
