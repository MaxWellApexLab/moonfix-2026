'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../src/engine.js');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/mission_samples.json'),'utf8'));
const sites = data.sites;
const get = id => sites.find(s=>s.id===id);
const siteA = get('South_84E40');
const siteB = get('South_83E60');
const tests = [];
function test(name,fn) {tests.push({name,fn})}
test('10 candidate sites, 720 supplied hourly samples',()=>{
  assert.equal(sites.length,10);
  assert.equal(sites.reduce((n,s)=>n+s.samples.length,0),720);
  assert.ok(sites.every(s=>s.samples[0][0].startsWith('2026-11-14')));
});
test('reference date endpoints consistently ordered',()=>{
  assert.equal(siteA.samples[0][0],'2026-11-14T00:00:00');
  assert.equal(siteA.samples[71][0],'2026-11-16T23:00:00');
  for(let i=0;i<72;i++) assert.equal(new Set(sites.map(s=>s.samples[i][0])).size,1);
});
test('sampled joint site A at 1 degree',()=>assert.equal(engine.analyze(siteA,1,0,71).sampledCount,45));
test('sampled joint site B at 1 degree',()=>assert.equal(engine.analyze(siteB,1,0,71).sampledCount,17));
test('exact linear modeled hours A',()=>assert.ok(Math.abs(engine.analyze(siteA,1,0,71).totalHours-44.0284141)<0.002));
test('exact linear modeled hours B',()=>assert.ok(Math.abs(engine.analyze(siteB,1,0,71).totalHours-16.7186434)<0.002));
test('margin monotonic samples',()=>{
  for(const s of sites){let previous=Infinity;for(const margin of [0,.5,1,2,3]){const r=engine.analyze(s,margin,0,71);assert.ok(r.sampledCount<=previous);previous=r.sampledCount}}
});
test('margin monotonic modeled hours',()=>{
  for(const s of sites){let previous=Infinity;for(const margin of [0,.5,1,2,3]){const r=engine.analyze(s,margin,0,71);assert.ok(r.totalHours<=previous+1e-9);previous=r.totalHours}}
});
test('all modeled windows ordered and bounded',()=>{
  for(const s of sites){for(const margin of [0,.5,1,2,3]){
    let last=0;
    for(const w of engine.modeledWindows(s,margin,0,71)){
      assert.ok(w.hours>0 && w.start>=0 && w.end<=71+1e-9 && w.start>=last-1e-9);
      last=w.end;
    }
  }}
});
test('single-epoch range has sample count but zero inferred duration',()=>{
  const r=engine.analyze(siteA,1,40,40);
  assert.equal(r.sampleTotal,1);assert.equal(r.totalHours,0);assert.equal(r.windows.length,0);
});
test('date preset 24 epochs has 23 modeled intervals',()=>{
  const r=engine.analyze(siteA,0,24,47);
  assert.equal(r.sampleTotal,24);
  assert.ok(r.totalHours<=23+1e-10);
});
test('combined sun and Earth visibility is never more than either alone',()=>{
  for(const s of sites){const r=engine.analyze(s,1,0,71);assert.ok(r.sampledCount<=r.sunHours && r.sampledCount<=r.earthHours)}
});
test('clipped windows stay inside range',()=>{
  for(const s of sites){for(const w of engine.modeledWindows(s,0,39,58))assert.ok(w.start>=39 && w.end<=58+1e-10)}
});
test('slope and min-duration constraints applied',()=>{
  const params={margin:1,start:0,end:71,minRun:24,maxSlope:15};
  const r=engine.analyzeAll(sites,params);
  assert.equal(r.filter(s=>s.eligible).length,0);
  const loose=engine.analyzeAll(sites,{...params,maxSlope:99});
  assert.equal(loose.filter(s=>s.eligible).length,1);
  assert.equal(loose[0].site.id,'South_84E40');
});
test('all strict filters cannot invent eligible sites',()=>{
  const ranks=engine.analyzeAll(sites,{margin:3,start:0,end:5,minRun:24,maxSlope:5});
  assert.ok(ranks.every(r=>!r.eligible));
});
test('linear-crossing both clearances',()=>{
  const site={samples:[['2026-11-14T00:00:00',-1,0,0,-1,0,0],['2026-11-14T01:00:00',1,0,0,1,0,0]]};
  const r=engine.analyze(site,0,0,1);
  assert.ok(Math.abs(r.totalHours-.5)<1e-9);
});
let passed=0;
for(const t of tests){try{t.fn();passed++;console.log('PASS',t.name)}catch(e){console.error('FAIL',t.name,e.stack);process.exitCode=1}}
console.log(`Engine checks: ${passed}/${tests.length}`);
