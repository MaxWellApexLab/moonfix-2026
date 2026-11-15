/* MoonFix scientific viewer engine — freshly authored, standalone calculations. */
(function (factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.MoonFixEngine = api;
})(function () {
  'use strict';
  const EPS = 1e-10;
  function clearance(row, margin) {
    return { sun: row[1] - row[3] - margin, earth: row[4] - row[6] - margin };
  }
  function classify(row, margin) {
    const c = clearance(row, margin);
    const sun = c.sun >= -EPS, earth = c.earth >= -EPS;
    return sun && earth ? 'both' : sun ? 'sun' : earth ? 'earth' : 'neither';
  }
  // Fractional subinterval within [0,1] on which a linear clearance >= 0.
  function aboveZero(a, b) {
    if (a >= -EPS && b >= -EPS) return [0, 1];
    if (a < -EPS && b < -EPS) return null;
    if (Math.abs(b - a) < EPS) return null;
    const root = Math.max(0, Math.min(1, -a / (b - a)));
    return a < 0 ? [root, 1] : [0, root];
  }
  function modeledWindows(site, margin, start, end) {
    const rows = site.samples;
    if (!Array.isArray(rows) || rows.length < 2) return [];
    const a = Math.max(0, Math.min(rows.length - 1, Math.floor(start)));
    const b = Math.max(a, Math.min(rows.length - 1, Math.floor(end)));
    const segments = [];
    for (let k = a; k < b; k++) {
      const u = clearance(rows[k], margin), v = clearance(rows[k + 1], margin);
      const sun = aboveZero(u.sun, v.sun), earth = aboveZero(u.earth, v.earth);
      if (!sun || !earth) continue;
      const from = Math.max(sun[0], earth[0]);
      const until = Math.min(sun[1], earth[1]);
      if (until - from > EPS) segments.push({ start: k + from, end: k + until });
    }
    const joined = [];
    for (const s of segments) {
      const last = joined[joined.length - 1];
      if (last && s.start <= last.end + EPS) last.end = Math.max(last.end, s.end);
      else joined.push({ ...s });
    }
    return joined.map(w => ({ ...w, hours: w.end - w.start,
      leftBoundary: Math.abs(w.start - a) < EPS,
      rightBoundary: Math.abs(w.end - b) < EPS }));
  }
  function analyze(site, margin, start, end) {
    const rows = site.samples;
    const a = Math.max(0, Math.min(rows.length - 1, Math.floor(start)));
    const b = Math.max(a, Math.min(rows.length - 1, Math.floor(end)));
    const sampledCount = rows.slice(a, b + 1).filter(r => classify(r, margin) === 'both').length;
    const windows = modeledWindows(site, margin, a, b);
    return { site, sampledCount, sampleTotal: b - a + 1,
      windows, totalHours: windows.reduce((sum, w) => sum + w.hours, 0),
      longestHours: Math.max(0, ...windows.map(w => w.hours)),
      sunHours: rows.slice(a,b+1).filter(r=>clearance(r,margin).sun >= -EPS).length,
      earthHours: rows.slice(a,b+1).filter(r=>clearance(r,margin).earth >= -EPS).length };
  }
  function analyzeAll(sites, params) {
    return sites.map(site => {
      const stats = analyze(site, params.margin, params.start, params.end);
      const eligible = stats.longestHours + EPS >= params.minRun && site.slope95 <= params.maxSlope + EPS && stats.sampledCount > 0;
      return { ...stats, eligible };
    }).sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.totalHours - a.totalHours || b.sampledCount - a.sampledCount || a.site.slope95 - b.site.slope95 || a.site.id.localeCompare(b.site.id));
  }
  return { clearance, classify, aboveZero, modeledWindows, analyze, analyzeAll };
});
