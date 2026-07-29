/* Academic Writing and Research — web edition
   Reading progress · dark mode · checklist persistence · keyboard paging.
   No external dependencies. All state is local to this browser. */
(function () {
  'use strict';

  var KEY_THEME = 'awr:theme';
  var KEY_CHECK = 'awr:check:';

  /* ── dark mode ─────────────────────────────────────── */
  function applyTheme(t) {
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }
  var saved = null;
  try { saved = localStorage.getItem(KEY_THEME); } catch (e) { /* private mode */ }
  if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    saved = 'dark';
  }
  applyTheme(saved);

  var btn = document.getElementById('theme');
  if (btn) {
    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(KEY_THEME, next); } catch (e) { /* ignore */ }
    });
  }

  /* ── reading progress ──────────────────────────────── */
  var bar = document.getElementById('progress');
  if (bar) {
    var tick = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = pct.toFixed(2) + '%';
    };
    document.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }

  /* ── checklist persistence (per page) ──────────────── */
  var boxes = document.querySelectorAll('.ck');
  if (boxes.length) {
    var page = location.pathname.split('/').pop() || 'index';
    var store = KEY_CHECK + page;
    var state = [];
    try { state = JSON.parse(localStorage.getItem(store) || '[]'); } catch (e) { state = []; }
    boxes.forEach(function (b, i) {
      b.checked = !!state[i];
      b.addEventListener('change', function () {
        var next = [];
        boxes.forEach(function (x) { next.push(x.checked); });
        try { localStorage.setItem(store, JSON.stringify(next)); } catch (e) { /* ignore */ }
      });
    });
  }

  /* ── keyboard paging (← / →) ───────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
    var sel = e.key === 'ArrowLeft' ? '.pager--prev' : e.key === 'ArrowRight' ? '.pager--next' : null;
    if (!sel) return;
    var a = document.querySelector(sel);
    if (a) location.href = a.getAttribute('href');
  });
}());
