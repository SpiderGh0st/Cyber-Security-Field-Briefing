/* ==========================================================================
   Cyber Security Field Briefing — app logic
   Renders cover, module dossiers, and the closing debrief from COURSE_DATA,
   handles hash-based routing, quiz interaction, and progress persistence.
   ========================================================================== */

(function () {
  'use strict';

  const DATA = COURSE_DATA;
  const MODULES = DATA.modules;
  const TOTAL_MODULES = MODULES.length;
  const STORAGE_KEY = 'csfb_progress_v1';

  const view = document.getElementById('view');
  const navList = document.getElementById('navList');
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  const menuBtn = document.getElementById('menuBtn');
  const clearancePct = document.getElementById('clearancePct');
  const clearanceFill = document.getElementById('clearanceFill');

  /* ---------------------------------------------------------------- progress */

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { modules: {} };
  }

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (e) {}
  }

  let progress = loadProgress();

  function moduleProgress(num) {
    if (!progress.modules[num]) progress.modules[num] = { answers: {} };
    return progress.modules[num];
  }

  function isModuleComplete(mod) {
    const mp = progress.modules[mod.number];
    if (!mp) return false;
    if (mod.quizzes.length === 0) return !!mp.viewed;
    return Object.keys(mp.answers).length >= mod.quizzes.length;
  }

  function updateClearance() {
    const done = MODULES.filter(isModuleComplete).length;
    const pct = Math.round((done / TOTAL_MODULES) * 100);
    clearancePct.textContent = pct + '%';
    clearanceFill.style.width = pct + '%';
    return pct;
  }

  /* ---------------------------------------------------------------- helpers */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  function fmtBody(arr) {
    return (arr || []).map(p => `<p>${esc(p)}</p>`).join('');
  }

  function reticle(src, tag, isVideo, poster) {
    const media = isVideo
      ? `<video controls preload="metadata" ${poster ? `poster="${esc(poster)}"` : ''}><source src="${esc(src)}" type="video/mp4"></video>`
      : `<img src="${esc(src)}" alt="${esc(tag || '')}" loading="lazy">`;
    return `
      <div class="reticle">
        <span class="cnr-tl"></span><span class="cnr-tr"></span><span class="cnr-bl"></span><span class="cnr-br"></span>
        ${media}
        ${tag ? `<span class="reticle-tag">${esc(tag)}</span>` : ''}
      </div>`;
  }

  /* ---------------------------------------------------------------- nav */

  function buildNav() {
    let html = `<li class="nav-item"><a href="#cover" data-route="cover"><span class="nav-num">00</span> Overview</a></li>`;
    html += `<li class="nav-divider">Modules</li>`;
    MODULES.forEach(m => {
      const done = isModuleComplete(m);
      html += `
        <li class="nav-item ${done ? 'done' : ''}">
          <a href="#module-${m.number}" data-route="module-${m.number}">
            <span class="nav-num">${String(m.number).padStart(2, '0')}</span>
            ${esc(m.name)}
            <svg class="nav-check" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.2 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </li>`;
    });
    html += `<li class="nav-divider">Debrief</li>`;
    html += `<li class="nav-item"><a href="#closing" data-route="closing"><span class="nav-num">••</span> ${esc(DATA.closing ? DATA.closing.name : 'Wrapping Up')}</a></li>`;
    navList.innerHTML = html;
  }

  function setActiveNav(route) {
    navList.querySelectorAll('a').forEach(a => {
      a.classList.toggle('active', a.dataset.route === route);
    });
  }

  /* ---------------------------------------------------------------- cover */

  function renderCover() {
    const totalQuizzes = MODULES.reduce((n, m) => n + m.quizzes.length, 0);
    const totalCases = MODULES.filter(m => m.case_study).length;
    const hero = DATA.hero_images && DATA.hero_images[0];

    view.innerHTML = `
      <section class="cover">
        <div class="cover-tag"><span class="dot"></span> Internal Training Dossier · Case No. CS-2026</div>
        <h1>Cyber Security:<br>the <em>field briefing</em> every employee needs.</h1>
        <p class="lede">Eleven case files covering malware, breaches, live attacks and the countermeasures that stop them — built from real workshop material, real incident interviews, and one hundred field assessments.</p>
        <div class="cover-stats">
          <div class="stat"><b>${TOTAL_MODULES}</b><span>Case files</span></div>
          <div class="stat"><b>${MODULES.reduce((n, m) => n + m.lessons.length, 0)}</b><span>Briefings</span></div>
          <div class="stat"><b>${totalCases}</b><span>Field interviews</span></div>
          <div class="stat"><b>${totalQuizzes}</b><span>Assessment questions</span></div>
        </div>
        <a class="btn btn-primary" href="#module-1">Begin Briefing →</a>
      </section>

      <section class="file-index">
        <h2>Case File Index</h2>
        <p class="sub">Work through in order, or jump to any file — your clearance progress is saved on this device.</p>
        <div class="file-grid">
          ${MODULES.map(m => `
            <a class="file-card ${isModuleComplete(m) ? 'done' : ''}" href="#module-${m.number}">
              <div class="fc-top">
                <span class="fc-num">FILE&nbsp;NO.&nbsp;${String(m.number).padStart(2, '0')}</span>
                <span class="fc-status">${isModuleComplete(m) ? 'CLEARED' : (m.quizzes.length ? m.quizzes.length + ' Q' : 'BRIEF')}</span>
              </div>
              <h3>${esc(m.name)}</h3>
            </a>
          `).join('')}
        </div>
      </section>
    `;
  }

  /* ---------------------------------------------------------------- module */

  function renderModule(num) {
    const idx = MODULES.findIndex(m => m.number === num);
    const mod = MODULES[idx];
    if (!mod) { renderCover(); return; }

    moduleProgress(mod.number).viewed = true;

    const heroImg = mod.images && mod.images[0];

    let html = `
      <header class="module-header">
        <div class="stamp">File No. ${String(mod.number).padStart(2, '0')} / ${String(TOTAL_MODULES).padStart(2, '0')}</div>
        <h1>${esc(mod.name)}</h1>
        ${mod.description && mod.description.length ? `<div class="desc">${esc(mod.description.join('\n\n'))}</div>` : ''}
        ${mod.objectives ? `<div class="desc">${esc(mod.objectives.join('\n\n'))}</div>` : ''}
        ${heroImg ? `<div class="module-media">${reticle(heroImg, 'Ref. Image · Module ' + mod.number)}</div>` : ''}
      </header>
    `;

    if (mod.lessons && mod.lessons.length) {
      html += `
        <section class="section">
          <div class="section-head"><h2>Briefing</h2><span class="count">${mod.lessons.length} topics</span></div>
          <div class="lessons-grid">
            ${mod.lessons.map((l, i) => `
              <article class="lesson-card">
                <span class="ln">TOPIC ${String(i + 1).padStart(2, '0')}</span>
                <h3>${esc(l.title)}</h3>
                <div class="body">${fmtBody(l.body)}</div>
              </article>
            `).join('')}
          </div>
        </section>
      `;
    }

    if (mod.case_study && (mod.case_study.video || (mod.case_study.body && mod.case_study.body.length))) {
      html += `
        <section class="section">
          <div class="section-head"><h2>Field Interview</h2><span class="count">Case study</span></div>
          <div class="case-wrap">
            <div class="case-media">
              ${mod.case_study.video ? reticle(mod.case_study.video, 'Recorded Interview', true, mod.case_study.poster) : ''}
            </div>
            <div class="case-copy">
              <div class="kicker">Transcript notes</div>
              ${mod.case_study.body && mod.case_study.body.length ? mod.case_study.body.map(p => `<p>${esc(p)}</p>`).join('') : '<p>Watch the recorded interview for this case.</p>'}
            </div>
          </div>
        </section>
      `;
    }

    if (mod.quizzes && mod.quizzes.length) {
      html += `
        <section class="section">
          <div class="section-head"><h2>Field Assessment</h2><span class="count">${mod.quizzes.length} questions</span></div>
          <div class="quiz-progress">
            <span class="mono" id="qp-label">0 / ${mod.quizzes.length} answered</span>
            <div class="bar"><span id="qp-bar"></span></div>
            <span class="mono" id="qp-score">Score: 0</span>
          </div>
          <div class="quiz-list" id="quizList"></div>
        </section>
      `;
    }

    const prev = MODULES[idx - 1];
    const next = MODULES[idx + 1];
    html += `
      <footer class="module-footer">
        ${prev ? `<a class="foot-nav prev" href="#module-${prev.number}"><span class="lbl">← Previous file</span><span class="ttl">${esc(prev.name)}</span></a>` : `<a class="foot-nav prev" href="#cover"><span class="lbl">← Back to</span><span class="ttl">Case File Index</span></a>`}
        ${next ? `<a class="foot-nav next" href="#module-${next.number}"><span class="lbl">Next file →</span><span class="ttl">${esc(next.name)}</span></a>` : `<a class="foot-nav next" href="#closing"><span class="lbl">Proceed to →</span><span class="ttl">${esc(DATA.closing ? DATA.closing.name : 'Debrief')}</span></a>`}
      </footer>
    `;

    view.innerHTML = html;

    if (mod.quizzes && mod.quizzes.length) {
      renderQuiz(mod);
    }

    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function renderQuiz(mod) {
    const list = document.getElementById('quizList');
    const mp = moduleProgress(mod.number);

    function draw() {
      list.innerHTML = mod.quizzes.map((q, qi) => {
        const answered = mp.answers[qi];
        return `
          <div class="quiz-card">
            <div class="qn">QUESTION ${String(qi + 1).padStart(2, '0')} / ${String(mod.quizzes.length).padStart(2, '0')}</div>
            <p class="question">${esc(q.question)}</p>
            <div class="choices">
              ${q.choices.map((c, ci) => {
                let cls = '';
                if (answered !== undefined) {
                  if (c.correct) cls = 'correct';
                  else if (ci === answered) cls = 'incorrect';
                }
                return `<button class="choice ${cls}" data-qi="${qi}" data-ci="${ci}" ${answered !== undefined ? 'disabled' : ''}>
                  <span class="mark"></span>${esc(c.text)}
                </button>`;
              }).join('')}
            </div>
            ${answered !== undefined ? `<div class="quiz-feedback ${q.choices[answered].correct ? 'ok' : 'bad'}">${q.choices[answered].correct ? '✔ Correct — logged to your file.' : '✘ Not quite — correct answer highlighted above.'}</div>` : ''}
          </div>
        `;
      }).join('');

      list.querySelectorAll('.choice:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
          const qi = +btn.dataset.qi;
          const ci = +btn.dataset.ci;
          mp.answers[qi] = ci;
          saveProgress();
          draw();
          updateStats();
          buildNav();
          setActiveNav('module-' + mod.number);
        });
      });
    }

    function updateStats() {
      const answeredCount = Object.keys(mp.answers).length;
      const score = mod.quizzes.reduce((n, q, qi) => n + (mp.answers[qi] !== undefined && q.choices[mp.answers[qi]].correct ? 1 : 0), 0);
      document.getElementById('qp-label').textContent = `${answeredCount} / ${mod.quizzes.length} answered`;
      document.getElementById('qp-bar').style.width = Math.round((answeredCount / mod.quizzes.length) * 100) + '%';
      document.getElementById('qp-score').textContent = `Score: ${score} / ${answeredCount}`;
      updateClearance();
    }

    draw();
    updateStats();
  }

  /* ---------------------------------------------------------------- closing */

  function renderClosing() {
    const c = DATA.closing || { name: 'Wrapping Up', body: [] };
    const pct = updateClearance();
    let totalCorrect = 0, totalAnswered = 0;
    MODULES.forEach(m => {
      const mp = progress.modules[m.number];
      if (!mp) return;
      m.quizzes.forEach((q, qi) => {
        if (mp.answers && mp.answers[qi] !== undefined) {
          totalAnswered++;
          if (q.choices[mp.answers[qi]].correct) totalCorrect++;
        }
      });
    });

    const paragraphs = (c.body || []);
    const quoteBlock = paragraphs.find(p => p.startsWith('Words from the Wise'));
    const rest = paragraphs.filter(p => p !== quoteBlock);

    let quotesHtml = '';
    if (quoteBlock) {
      const lines = quoteBlock.split('\n').slice(1).filter(Boolean);
      lines.forEach(line => {
        const m = line.match(/^[·\-\s]*([^:]+):\s*(.+)$/);
        if (m) {
          quotesHtml += `<div class="quote-card"><p>"${esc(m[2].trim())}"</p><div class="who">— ${esc(m[1].trim())}</div></div>`;
        }
      });
    }

    view.innerHTML = `
      <section class="closing-hero">
        <span class="eyebrow">Debrief</span>
        <h1>${esc(c.name)}</h1>
        <p class="lede" style="margin:0 auto;">${rest.map(esc).join(' ')}</p>
        <div class="score-ring-wrap">
          <div style="text-align:center">
            <div style="font-family:var(--font-display);font-size:56px;color:var(--amber);">${pct}%</div>
            <div class="mono" style="color:var(--text-faint);font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Clearance complete</div>
            <div class="mono" style="color:var(--text-dim);font-size:13px;margin-top:10px;">Assessment score: ${totalCorrect} / ${totalAnswered || 100}</div>
          </div>
        </div>
        <a class="btn btn-ghost" href="#cover">← Return to case file index</a>
      </section>
      ${quotesHtml ? `<section class="quotes"><div class="section-head"><h2>Words from the wise</h2></div>${quotesHtml}</section>` : ''}
    `;
    window.scrollTo({ top: 0 });
  }

  /* ---------------------------------------------------------------- router */

  function route() {
    const hash = location.hash.replace('#', '') || 'cover';
    setActiveNav(hash);
    closeSidebar();
    if (hash === 'cover') renderCover();
    else if (hash === 'closing') renderClosing();
    else if (hash.startsWith('module-')) renderModule(+hash.split('-')[1]);
    else renderCover();
    buildNav();
    setActiveNav(hash);
  }

  window.addEventListener('hashchange', route);

  /* ---------------------------------------------------------------- sidebar (mobile) */

  function openSidebar() { sidebar.classList.add('open'); scrim.classList.add('show'); }
  function closeSidebar() { sidebar.classList.remove('open'); scrim.classList.remove('show'); }
  menuBtn.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  scrim.addEventListener('click', closeSidebar);

  document.querySelectorAll('[data-nav="cover"]').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => { location.hash = '#cover'; });
  });

  /* ---------------------------------------------------------------- init */

  buildNav();
  route();
  updateClearance();
})();
