(function(){
  const LV = ["Ad-hoc","AI-Assisted","AI-Augmented","AI-First","AI-Native"];

  /* ---------- matrix column highlight ---------- */
  const matrix = document.getElementById('matrix');
  if(matrix){
  function highlight(c){
    matrix.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));
    if(c==null) return;
    matrix.querySelectorAll('tr').forEach(tr=>{ const cell = tr.children[c+1]; if(cell) cell.classList.add('hl'); });
  }
  matrix.querySelectorAll('thead th[data-col] button').forEach(b=>{
    b.addEventListener('click',()=>{
      const c = +b.parentElement.dataset.col;
      const on = b.parentElement.classList.contains('hl');
      highlight(on?null:c);
    });
  });

  }
  /* ---------- break-even chart ---------- */
  if(document.getElementById('beChart')){
  const COST = 1.5;
  const svg = document.getElementById('beChart');
  const X0=52,X1=620,Y0=236,Y1=20, XM=80, YM=8;
  const sx = n => X0 + (n/XM)*(X1-X0);
  const sy = f => Y0 - (Math.min(f,YM)/YM)*(Y0-Y1);
  function drawChart(team, up){
    const u = up/100;
    const be = COST/u;
    let s = '';
    for(let f=0; f<=YM; f+=2){ s+=`<line x1="${X0}" x2="${X1}" y1="${sy(f)}" y2="${sy(f)}" stroke="var(--rule)" stroke-width="1"/><text x="${X0-8}" y="${sy(f)+4}" text-anchor="end">${f}</text>`; }
    for(let n=0; n<=XM; n+=20){ s+=`<text x="${sx(n)}" y="${Y0+18}" text-anchor="middle">${n}</text>`; }
    s+=`<text x="${(X0+X1)/2}" y="${Y0+38}" text-anchor="middle">engineers</text>`;
    s+=`<text x="${X0-8}" y="${Y1-6}" text-anchor="end">FTE/yr</text>`;
    const nEnd = Math.min(XM, YM/u);
    const beX = Math.min(be,XM);
    // shaded gain area beyond break-even
    if(be < XM){
      s+=`<polygon points="${sx(be)},${sy(COST)} ${sx(nEnd)},${sy(u*nEnd)} ${sx(nEnd)},${sy(COST)}" fill="var(--green)" opacity=".14"/>`;
      if(nEnd<XM) s+=`<polygon points="${sx(nEnd)},${sy(YM)} ${sx(XM)},${sy(YM)} ${sx(XM)},${sy(COST)} ${sx(nEnd)},${sy(COST)}" fill="var(--green)" opacity=".14"/>`;
    }
    s+=`<polygon points="${sx(0)},${sy(0)} ${sx(beX)},${sy(u*beX)} ${sx(beX)},${sy(COST)} ${sx(0)},${sy(COST)}" fill="var(--red)" opacity=".10"/>`;
    s+=`<line x1="${X0}" x2="${X1}" y1="${sy(COST)}" y2="${sy(COST)}" stroke="var(--red)" stroke-width="2" stroke-dasharray="6 5"/>`;
    s+=`<text x="${X1}" y="${sy(COST)-8}" text-anchor="end" style="fill:var(--red)">running cost ≈ 1.5 FTE/yr</text>`;
    s+=`<line x1="${sx(0)}" y1="${sy(0)}" x2="${sx(nEnd)}" y2="${sy(u*nEnd)}" stroke="var(--accent)" stroke-width="2.5"/>`;
    const labN = Math.min(nEnd, XM) * 0.82;
    s+=`<text x="${sx(labN)-6}" y="${sy(u*labN)-10}" text-anchor="end" style="fill:var(--accent)">capacity returned at ${up}%</text>`;
    if(be <= XM){
      s+=`<line x1="${sx(be)}" x2="${sx(be)}" y1="${sy(COST)}" y2="${Y0}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="2 3"/>`;
      s+=`<circle cx="${sx(be)}" cy="${sy(COST)}" r="4.5" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>`;
      s+=`<text x="${sx(be)+8}" y="${Y0-8}" style="fill:var(--ink)">break-even ${Math.round(be)}</text>`;
    }
    const ret = u*team;
    s+=`<line x1="${sx(team)}" x2="${sx(team)}" y1="${Y0}" y2="${sy(ret)}" stroke="var(--ink)" stroke-width="1" opacity=".35"/>`;
    s+=`<circle cx="${sx(team)}" cy="${sy(ret)}" r="6" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`;
    s+=`<line x1="${X0}" x2="${X1}" y1="${Y0}" y2="${Y0}" stroke="var(--muted)" stroke-width="1"/>`;
    svg.innerHTML = s;
    document.getElementById('teamV').textContent = team;
    document.getElementById('upV').textContent = up+'%';
    document.getElementById('retV').textContent = ret.toFixed(1)+' FTE';
    document.getElementById('beV').textContent = Math.round(be)+' eng';
    const net = ret-COST, v = document.getElementById('verdict');
    v.className = 'verdict ' + (net>=0?'pos':'neg');
    v.textContent = net>=0 ? `Pays back: +${net.toFixed(1)} FTE a year` : `Underwater: ${net.toFixed(1)} FTE a year. Stay at L1.`;
  }
  const tEl = document.getElementById('teamSize'), uEl = document.getElementById('uplift');
  const redraw = ()=>drawChart(+tEl.value, +uEl.value);
  tEl.addEventListener('input',redraw); uEl.addEventListener('input',redraw);
  redraw();

  }
  /* ---------- 90-day gantt ---------- */
  if(document.getElementById('gantt')){
  const PLAN = [
    {a:"Confirm placement; baseline cycle time and change-failure rate", o:"Eng lead", d:"Numbers exist, not impressions", s:1, e:2},
    {a:"Lock the data-handling policy; name a platform owner", o:"CTO + Security", d:"Policy signed, owner named", s:2, e:4},
    {a:"AI review on 100% of PRs and CLAUDE.md on 2 pilot repos", o:"Platform squad", d:"Every PR gets an AI first pass", s:3, e:8},
    {a:"Policy-as-code gates on money, auth and PII paths; test generation on pilot teams", o:"Platform + Security", d:"A policy-violating change can't merge", s:6, e:12},
    {a:"Re-measure; report net uplift and failure-rate change", o:"Eng lead", d:"Evidence-based go/no-go on org-wide L2", s:10, e:12}
  ];
  const wk = document.getElementById('wkHead');
  for(let i=1;i<=12;i++){ const sp=document.createElement('span'); sp.textContent='W'+i; wk.appendChild(sp); }
  const g = document.getElementById('gantt');
  PLAN.forEach(p=>{
    const row = document.createElement('div'); row.className='g-line';
    let cells=''; for(let i=1;i<=12;i++) cells+=`<div class="${i>=p.s&&i<=p.e?'on':'off'}"></div>`;
    row.innerHTML = `<div class="what"><span>${p.a}</span><small>${p.o} · done when: ${p.d}</small></div><div class="weeks" aria-label="Weeks ${p.s} to ${p.e}">${cells}</div>`;
    g.appendChild(row);
  });


  }
  /* ---------- tabs ---------- */
  const tabs=[...document.querySelectorAll('.tab')];
  function selectTab(t, focus){
    tabs.forEach(x=>{ const on=x===t; x.setAttribute('aria-selected',on); x.tabIndex=on?0:-1; document.getElementById(x.getAttribute('aria-controls')).hidden=!on; });
    if(focus) t.focus();
  }
  tabs.forEach((t,i)=>{
    t.addEventListener('click',()=>selectTab(t));
    t.addEventListener('keydown',e=>{
      if(e.key==='ArrowRight'){e.preventDefault();selectTab(tabs[(i+1)%tabs.length],true);}
      if(e.key==='ArrowLeft'){e.preventDefault();selectTab(tabs[(i-1+tabs.length)%tabs.length],true);}
    });
  });

  function fromHash(){ const m=(location.hash||'').match(/^#level-([1-4])$/); if(m && tabs.length) selectTab(tabs[+m[1]-1]); }
  window.addEventListener('hashchange',fromHash); fromHash();
  /* ---------- copy email ---------- */
  const ce=document.getElementById('copyEmail');
  if(ce) ce.addEventListener('click',e=>{
    const t = document.getElementById('email').textContent, b=e.currentTarget;
    const done=()=>{ b.textContent='Copied'; setTimeout(()=>b.textContent='Copy email',1600); };
    const fallback=()=>{ const r=document.createRange(); r.selectNodeContents(document.getElementById('email')); const s=getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent='Selected. Press Ctrl+C'; };
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(done,fallback); } else fallback();
  });
})();
