/* MoonFix user interface. No network calls, frameworks, tracking or API keys. */
(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('moonfix-data').textContent);
  const sites = data.sites;
  const samples = sites[0].samples;
  const Engine = window.MoonFixEngine;
  const $ = (id) => document.getElementById(id);
  const escape = (s) => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  const fmt = (n, digits = 1) => Number(n).toFixed(digits);
  const nameOf = s => s.id.replace('South_', '').replace(/([EW])/, ' $1');
  const coord = s => `${Math.abs(s.lat).toFixed(0)}°S · ${Math.abs(s.lon).toFixed(0)}°${s.lon < 0 ? 'W' : 'E'}`;
  let toastHandle = null;
  let playback = null;
  let state = {
    start: 0, end: 71, margin: 1,
    minRun: 0, maxSlope: 99, site: 'South_84E40', compare: 'South_83E60',
    selected: 36
  };
  function sanitize() {
    const clamp = (x, low, high) => Math.min(high, Math.max(low, Number.isFinite(Number(x)) ? Number(x) : low));
    state.start = Math.round(clamp(state.start, 0, 71));
    state.end = Math.round(clamp(state.end, state.start, 71));
    state.margin = Math.round(clamp(state.margin, 0, 3) * 2) / 2;
    state.minRun = [0,3,6,12,24].includes(+state.minRun) ? +state.minRun : 0;
    state.maxSlope = [5,10,15,20,25,99].includes(+state.maxSlope) ? +state.maxSlope : 99;
    state.site = sites.find(s=>s.id === state.site)?.id || sites[0].id;
    state.compare = sites.find(s=>s.id === state.compare && s.id !== state.site)?.id || sites.find(s=>s.id !== state.site).id;
    state.selected = Math.round(clamp(state.selected, state.start, state.end));
  }
  function getSite(id) { return sites.find(s=>s.id === id) || sites[0]; }
  function getAnalysis() { return Engine.analyzeAll(sites, state); }
  function formatEpoch(index, multiline=false) {
    const t = samples[index][0];
    const d = t.slice(5, 10).replace('-', '/');
    return multiline ? `${d} ${t.slice(11, 16)} TDB` : `${d} ${t.slice(11, 16)}`;
  }
  function formatFractional(index) {
    const i = Math.min(samples.length-1, Math.max(0, Math.floor(index)));
    const ms = Date.parse(samples[i][0]+'Z') + (index-i)*3600000;
    const t = new Date(ms).toISOString();
    return t.slice(5,10).replace('-','/') + ' ' + t.slice(11,19) + ' TDB';
  }
  function showToast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    window.clearTimeout(toastHandle);
    toastHandle = window.setTimeout(()=>$('toast').classList.remove('show'), 3000);
  }
  function setControls() {
    $('startEpoch').value = String(state.start);
    $('endEpoch').value = String(state.end);
    $('margin').value = String(state.margin);
    $('marginValue').textContent = `+${fmt(state.margin)}°`;
    $('minRun').value = String(state.minRun);
    $('maxSlope').value = String(state.maxSlope);
    $('primarySite').value = state.site;
    $('compareSite').value = state.compare;
    $('epochSlider').min = String(state.start);
    $('epochSlider').max = String(state.end);
    $('epochSlider').value = String(state.selected);
    $('sliderLabel').textContent = formatEpoch(state.selected, false);
    const preset = state.start === 0 && state.end === 71 ? 'all' :
      state.start % 24 === 0 && state.end === state.start + 23 ? String(Math.floor(state.start/24)) : 'custom';
    document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('active',b.dataset.preset===preset));
  }
  function siteResultStats(ranking) {
    const active = ranking.filter(s=>s.eligible);
    const primary = ranking.find(s=>s.site.id===state.site);
    const best = active[0] || ranking[0];
    $('metricEligible').textContent = `${active.length} / ${sites.length}`;
    $('metricBestRun').textContent = `${fmt(active.length ? best.longestHours : 0)}h`;
    $('metricPrimaryCount').textContent = `${primary.sampledCount}/${primary.sampleTotal}`;
    $('metricCoverage').textContent = `${state.end - state.start}h`;
    $('resultStatus').textContent = active.length ? 'ACTIVE' : 'NO MATCH';
    $('resultStatus').style.color = active.length ? 'var(--green)' : 'var(--danger)';
  }
  function renderPolar(ranking) {
    const eligible = new Set(ranking.filter(r=>r.eligible).map(r=>r.site.id));
    const circles = [0.25,0.50,0.75,1].map(fr=>`<circle cx="190" cy="166" r="${144*fr}" fill="none" stroke="#40556a" stroke-width=".8" stroke-dasharray="3 5"/>`).join('');
    const spokes = [0,45,90,135,180,225,270,315].map(deg=>{
      const a=deg*Math.PI/180;return `<line x1="190" y1="166" x2="${190+Math.sin(a)*146}" y2="${166-Math.cos(a)*146}" stroke="#30495e" stroke-width=".7"/>`;
    }).join('');
    const points = sites.map(s=>{
      const rad = Math.abs(90+s.lat)/8*138;
      const theta=s.lon*Math.PI/180;
      const x=190+Math.sin(theta)*rad, y=166-Math.cos(theta)*rad;
      const chosen = state.site===s.id, pass=eligible.has(s.id);
      return `<g data-site="${s.id}" role="button" tabindex="0" aria-label="Select ${escape(s.id)}" aria-pressed="${chosen}">
        ${chosen ? `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="#f9bd69" stroke-width="1.5" stroke-dasharray="3 3"/>` : ''}
        <circle cx="${x}" cy="${y}" r="${chosen?7:5.3}" fill="${chosen?'#f9bd69':pass?'#85d7b4':'#64758a'}" stroke="${chosen?'#ffeed2':'#1c2a3b'}" stroke-width="2.3"/><title>${escape(s.id)} — ${escape(coord(s))}</title>
      </g>`;
    }).join('');
    $('polarMap').innerHTML = `<svg viewBox="0 0 380 340" aria-label="Interactive schematic polar site plot" role="img">
      <defs><radialGradient id="lunarPolar"><stop offset="0" stop-color="#243649"/><stop offset=".63" stop-color="#15283a"/><stop offset="1" stop-color="#101d2e"/></radialGradient></defs>
      <circle cx="190" cy="166" r="150" fill="url(#lunarPolar)" stroke="#5a6e81" stroke-width="1"/>
      ${spokes}${circles}<circle cx="190" cy="166" r="4" fill="#abbac6"/>
      <text x="190" y="12" fill="#a5b7c9" font-size="11" font-weight="700" text-anchor="middle">0° / NORTH</text>
      <text x="359" y="170" fill="#829db1" font-size="10" text-anchor="middle">90°E</text>
      <text x="190" y="326" fill="#839fb3" font-size="10" text-anchor="middle">180°</text>
      <text x="21" y="170" fill="#829db1" font-size="10" text-anchor="middle">90°W</text>
      <text x="204" y="175" fill="#b5c7d5" font-size="8">90°S</text>
      <text x="201" y="65" fill="#708da3" font-size="8">84°S</text>
      ${points}</svg>`;
  }
  function renderSite(ranking) {
    const site = getSite(state.site);
    const stats = ranking.find(r=>r.site.id===state.site);
    $('siteName').textContent=site.id.replace('South_', 'South / ');
    $('siteCoordinates').textContent=coord(site);
    $('siteSlope').textContent=fmt(site.slope95,2)+'°';
    $('siteRelief').textContent=fmt(site.relief,0)+' m';
    $('siteElevation').textContent=fmt(site.elevation,0)+' m';
    $('siteHours').textContent=fmt(stats.totalHours,2)+' h';
    $('terrainImage').src=site.terrainImage;
    $('terrainImage').alt=`Terrain relief preview for ${site.id}`;
    const r=site.samples[state.selected], c=Engine.clearance(r,state.margin);
    $('sunClearance').textContent=(c.sun>=0?'+':'')+fmt(c.sun,2)+'°';
    $('earthClearance').textContent=(c.earth>=0?'+':'')+fmt(c.earth,2)+'°';
    $('sunClearance').style.color=c.sun>=0?'var(--green)':'var(--danger)';
    $('earthClearance').style.color=c.earth>=0?'var(--green)':'var(--danger)';
    $('sunExplain').textContent=`Elevation ${fmt(r[1],2)}° / skyline ${fmt(r[3],2)}°`;
    $('earthExplain').textContent=`Elevation ${fmt(r[4],2)}° / skyline ${fmt(r[6],2)}°`;
    $('epochCurrent').textContent=formatEpoch(state.selected,true);
  }
  function renderClearanceGraph() {
    const site=getSite(state.site), a=state.start,b=state.end;
    const values=site.samples.slice(a,b+1).map((r,j)=>({i:a+j,...Engine.clearance(r,state.margin)}));
    const min=Math.min(-1,...values.map(v=>Math.min(v.sun,v.earth)));
    const max=Math.max(1,...values.map(v=>Math.max(v.sun,v.earth)));
    let lo=Math.floor(min/5)*5, hi=Math.ceil(max/5)*5;
    if (hi-lo<4) {lo-=2;hi+=2;}
    const W=920,H=240,L=46,R=14,T=13,B=29;
    const x=(i)=>L+(i-a)/Math.max(1,b-a)*(W-L-R);
    const y=(v)=>T+(hi-v)/(hi-lo)*(H-T-B);
    const poly=key=>values.map((v,j)=>`${j?'L':'M'}${x(v.i).toFixed(2)},${y(v[key]).toFixed(2)}`).join(' ');
    const grid=Array.from({length:5},(_,j)=>{
      const val=lo+(hi-lo)*j/4, yy=y(val);
      return `<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" stroke="#32465b" stroke-dasharray="2 5"/><text x="${L-8}" y="${yy+3}" fill="#90a6ba" text-anchor="end" font-size="10">${fmt(val,0)}°</text>`;
    }).join('');
    const tickCount=Math.min(5,b-a+1),labels=Array.from({length:tickCount},(_,j)=>{
      const ix=a+Math.round((b-a)*(j/Math.max(1,tickCount-1)));
      return `<text x="${x(ix)}" y="${H-5}" fill="#91a8ba" text-anchor="middle" font-size="10">${formatEpoch(ix)}</text>`;
    }).join('');
    const markers=values.map(v=>`<rect data-epoch="${v.i}" x="${x(v.i)-(W-L-R)/Math.max(1,b-a+1)/2}" y="${T}" width="${Math.max(7,(W-L-R)/Math.max(1,b-a+1))}" height="${H-T-B}" fill="transparent"><title>${formatEpoch(v.i,true)} / Sun ${fmt(v.sun,2)}° / Earth ${fmt(v.earth,2)}°</title></rect>`).join('');
    const cursor=x(state.selected);
    $('clearanceGraph').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sun and Earth clearance line graph">
      <rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" rx="4" fill="#112237"/>
      ${grid}<line x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}" stroke="#c1d2de" stroke-dasharray="5 5" opacity=".85"/>
      ${labels}<path d="${poly('sun')}" stroke="#f9bd69" stroke-width="2.8" fill="none" stroke-linejoin="round"/>
      <path d="${poly('earth')}" stroke="#75b7dc" stroke-width="2.8" fill="none" stroke-linejoin="round"/>
      <line x1="${cursor}" x2="${cursor}" y1="${T}" y2="${H-B}" stroke="#ffffff" stroke-opacity=".85" stroke-dasharray="5 4"/>
      <circle cx="${cursor}" cy="${y(Engine.clearance(site.samples[state.selected],state.margin).sun)}" r="4" fill="#f9bd69" stroke="#fff" stroke-width="1.5"/>
      <circle cx="${cursor}" cy="${y(Engine.clearance(site.samples[state.selected],state.margin).earth)}" r="4" fill="#75b7dc" stroke="#fff" stroke-width="1.5"/>
      ${markers}</svg>`;
  }
  function renderWindows(ranking) {
    const result = ranking.find(r=>r.site.id===state.site);
    $('windowList').innerHTML = result.windows.length ?
      result.windows.map((w,j)=>`<button type="button" class="window-pill" data-window="${j}" title="Inspect window midpoint"><strong>${fmt(w.hours,2)} h · WINDOW ${String(j+1).padStart(2,'0')}</strong><span>${escape(formatFractional(w.start))} → ${escape(formatFractional(w.end))}</span><span>${w.leftBoundary?'START AT DATA BOUNDARY · ':''}${w.rightBoundary?'END AT DATA BOUNDARY':''}</span></button>`).join('') :
      '<div class="window-empty">No positive-length modeled joint-visibility windows in this mission range. Try a smaller clearance margin or a different location.</div>';
  }
  function renderCompare() {
    const rows=[getSite(state.site),getSite(state.compare)];
    const count=state.end-state.start+1;
    $('comparisonTracks').innerHTML=rows.map((s,index)=>{
      const cells=s.samples.slice(state.start,state.end+1).map((row,j)=>{
        const i=state.start+j,cls=Engine.classify(row,state.margin);
        return `<button type="button" class="cell ${cls}${state.selected===i?' selected':''}" data-epoch="${i}" title="${escape(s.id)} / ${formatEpoch(i,true)} / ${cls.toUpperCase()}" aria-label="${escape(s.id)} at ${formatEpoch(i,true)}: ${cls}"></button>`;
      }).join('');
      return `<div class="track"><div class="track-label"><strong>${escape(s.id)}</strong><span>${index?'COMPARISON':'PRIMARY'} · ${escape(coord(s))}</span></div><div class="cells" style="--count:${count}">${cells}</div></div>`;
    }).join('');
  }
  function renderRank(ranking) {
    $('rankRows').innerHTML=ranking.map((r,index)=>{
      const site=r.site,selected=site.id===state.site;
      return `<tr role="button" tabindex="0" data-rank-site="${site.id}" class="${selected?'chosen':''}" aria-label="Inspect ${escape(site.id)}">
        <td><span class="rank-number">${String(index+1).padStart(2,'0')}</span></td>
        <td class="site-table-name"><strong>${escape(site.id)}</strong><small>${escape(coord(site))}</small></td>
        <td><span class="number-em">${r.sampledCount}/${r.sampleTotal}</span></td>
        <td><span class="number-em">${fmt(r.totalHours,2)} h</span></td>
        <td>${fmt(r.longestHours,2)} h</td><td>${fmt(site.slope95,2)}°</td>
        <td><span class="status-tag ${r.eligible?'pass':'fail'}">${r.eligible?'ELIGIBLE':'FILTERED'}</span></td></tr>`;
    }).join('');
    $('rankNote').textContent=`${ranking.filter(r=>r.eligible).length} of 10 sites meet the filters. ${state.end-state.start} between-sample hours, ${state.end-state.start+1} epochs. Positive modeled windows are linear interpolation estimates, not verified continuous operation.`;
  }
  function render() {
    sanitize();
    const ranking=getAnalysis();
    setControls();
    siteResultStats(ranking);
    renderPolar(ranking);
    renderSite(ranking);
    renderClearanceGraph();
    renderWindows(ranking);
    renderCompare();
    renderRank(ranking);
    window.MoonFixState=Object.freeze({ ...state });
  }
  function stopPlayback() {
    if (playback !== null) clearInterval(playback);
    playback=null;$('playToggle').textContent='▶';$('playToggle').setAttribute('aria-label','Play hourly samples');
  }
  function selectEpoch(epoch) {state.selected=Math.round(Number(epoch)); render();}
  function chooseSite(siteId) {
    if (!sites.some(s=>s.id===siteId)) return;
    state.site=siteId;
    if(state.compare===siteId)state.compare=sites.find(s=>s.id!==siteId).id;
    render();
  }
  function exportCsv(name,rows) {
    const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n')+'\r\n';
    const a=document.createElement('a'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    showToast(`Exported ${name}`);
  }
  function exportRanking() {
    const rows=[['rank','site','latitude_deg','longitude_east_deg','start_epoch_tdb','end_epoch_tdb','angular_margin_deg','joint_visible_samples','samples_considered','model_joint_hours','longest_model_window_hours','slope_p95_deg','eligible']];
    getAnalysis().forEach((r,i)=>rows.push([i+1,r.site.id,r.site.lat,r.site.lon,samples[state.start][0],samples[state.end][0],state.margin,r.sampledCount,r.sampleTotal,r.totalHours.toFixed(5),r.longestHours.toFixed(5),r.site.slope95,r.eligible]));
    exportCsv('moonfix_site_ranking.csv',rows);
  }
  function exportWindows() {
    const r=Engine.analyze(getSite(state.site),state.margin,state.start,state.end);
    const rows=[['site','margin_deg','model','window_no','start_tdb','end_tdb','duration_hours','truncated_at_start','truncated_at_end']];
    r.windows.forEach((w,i)=>rows.push([state.site,state.margin,'linear_between_hour_proxy',i+1,formatFractional(w.start),formatFractional(w.end),w.hours.toFixed(6),w.leftBoundary,w.rightBoundary]));
    exportCsv('moonfix_'+state.site+'_windows.csv',rows);
  }
  function initControls() {
    const options=samples.map((r,i)=>`<option value="${i}">${formatEpoch(i,true)}</option>`).join('');
    $('startEpoch').innerHTML=options;$('endEpoch').innerHTML=options;
    const siteOptions=sites.map(s=>`<option value="${s.id}">${escape(s.id)} · ${escape(coord(s))}</option>`).join('');
    $('primarySite').innerHTML=siteOptions;$('compareSite').innerHTML=siteOptions;
    ['startEpoch','endEpoch'].forEach(id=>$(id).addEventListener('change',()=>{
      stopPlayback();state[id==='startEpoch'?'start':'end']=Number($(id).value);
      if(state.end<state.start){if(id==='startEpoch')state.end=state.start;else state.start=state.end;}
      render();
    }));
    $('margin').addEventListener('input',()=>{state.margin=Number($('margin').value);render()});
    $('minRun').addEventListener('change',()=>{state.minRun=Number($('minRun').value);render()});
    $('maxSlope').addEventListener('change',()=>{state.maxSlope=Number($('maxSlope').value);render()});
    $('primarySite').addEventListener('change',()=>chooseSite($('primarySite').value));
    $('compareSite').addEventListener('change',()=>{state.compare=$('compareSite').value;render()});
    document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{
      stopPlayback();const key=b.dataset.preset;
      state.start=key==='all'?0:Number(key)*24;
      state.end=key==='all'?71:state.start+23;
      state.selected=state.start;
      render();
    }));
    $('resetControls').addEventListener('click',()=>{
      stopPlayback();state={start:0,end:71,margin:1,minRun:0,maxSlope:99,site:'South_84E40',compare:'South_83E60',selected:36};
      render();showToast('Mission parameters reset');
    });
    $('epochSlider').addEventListener('input',()=>selectEpoch($('epochSlider').value));
    $('playToggle').addEventListener('click',()=>{
      if(playback!==null){stopPlayback();return;}
      $('playToggle').textContent='Ⅱ';$('playToggle').setAttribute('aria-label','Pause playback');
      playback=setInterval(()=>{state.selected=state.selected>=state.end?state.start:state.selected+1;render();},500);
    });
    $('polarMap').addEventListener('click',e=>{const el=e.target.closest('[data-site]');if(el)chooseSite(el.dataset.site)});
    $('polarMap').addEventListener('keydown',e=>{const el=e.target.closest('[data-site]');if(el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();chooseSite(el.dataset.site)}});
    ['clearanceGraph','comparisonTracks'].forEach(id=>$(id).addEventListener('click',e=>{
      const el=e.target.closest('[data-epoch]');if(el){stopPlayback();selectEpoch(el.dataset.epoch);}
    }));
    $('windowList').addEventListener('click',e=>{
      const el=e.target.closest('[data-window]');if(!el)return;
      const w=Engine.analyze(getSite(state.site),state.margin,state.start,state.end).windows[Number(el.dataset.window)];
      if(w)selectEpoch(Math.round((w.start+w.end)/2));
    });
    $('rankRows').addEventListener('click',e=>{const el=e.target.closest('[data-rank-site]');if(el)chooseSite(el.dataset.rankSite)});
    $('rankRows').addEventListener('keydown',e=>{const el=e.target.closest('[data-rank-site]');if(el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();chooseSite(el.dataset.rankSite)}});
    $('exportHeader').addEventListener('click',exportRanking);
    $('exportRank').addEventListener('click',exportRanking);
    $('exportWindows').addEventListener('click',exportWindows);
    $('shareView').addEventListener('click',async()=>{
      const params=encodeURIComponent(JSON.stringify(state));
      window.location.hash='view='+params;
      const link=window.location.href;
      try{await navigator.clipboard.writeText(link);showToast('Shareable view URL copied');}
      catch(err){showToast('View saved to this URL — copy it from the address bar');}
    });
  }
  function recoverFromUrl() {
    const hash=window.location.hash;
    if(!hash.startsWith('#view='))return;
    try{const o=JSON.parse(decodeURIComponent(hash.slice(6)));if(!o||typeof o!=='object')return;
      for(const key of Object.keys(state))if(Object.hasOwn(o,key))state[key]=o[key];
    }catch(e){/* Ignore malformed share links */}
  }
  initControls();recoverFromUrl();render();
  window.MoonFixApp={get state(){return {...state}}, sites, getAnalysis, chooseSite, selectEpoch, exportRanking, exportWindows};
})();
