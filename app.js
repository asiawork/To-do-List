(() => {
  'use strict';

  const COLORS = [
    { c: '#FFE98A', name: 'เหลือง' },
    { c: '#FFC6D3', name: 'ชมพู' },
    { c: '#BDE3FF', name: 'ฟ้า' },
    { c: '#C9F0C2', name: 'เขียว' },
    { c: '#DCCBFF', name: 'ม่วง' },
    { c: '#FFD3A8', name: 'ส้ม' },
  ];
  const KEY = 'paekaikon-board-v1';
  const NOTE_W = 220, NOTE_H = 200;
  const MIN_Z = 0.25, MAX_Z = 2;
  const ZONE_W = 540, ZONE_H = 1250, ZONE_GAP = 60;
  const ZONE_TINTS = ['#FFE98A', '#BDE3FF', '#FFC6D3', '#C9F0C2', '#DCCBFF', '#FFD3A8'];

  const $ = (s) => document.querySelector(s);
  const viewport = $('#viewport'), layer = $('#layer');

  // ---------- state ----------
  let state = load() || seed();
  let editingId = null, draggingId = null;
  let lastActivity = Date.now();
  let cheerUntil = 0, waveUntil = Date.now() + 3500;
  let undoStack = [];

  function defaultZones() {
    return ['Routine', 'Project', 'Meeting', 'Adhoc'].map((name, i) => ({
      id: uid(), name, x: i * (ZONE_W + ZONE_GAP), y: 0, w: ZONE_W, h: ZONE_H,
      tint: ZONE_TINTS[i], routine: i === 0,
    }));
  }
  function seed() {
    const now = Date.now();
    const zx = (i) => i * (ZONE_W + ZONE_GAP);
    const note = (text, i, row, col, color, extra) => ({
      id: uid(), text, x: zx(i) + 36 + col * 250, y: 130 + row * 240, color, rot: [-2, 1.5, -1, 2.5][(i + row + col) % 4],
      done: false, z: 1, t: now, ...extra,
    });
    return {
      zones: defaultZones(),
      notes: [
        note('เช็กอีเมลตอนเช้า', 0, 0, 0, COLORS[0].c, { repeat: 'day' }),
        note('ส่งรายงานประจำสัปดาห์', 0, 0, 1, COLORS[2].c, { repeat: 'week' }),
        note('ร่างโครงหน้าเว็บใหม่', 1, 0, 0, COLORS[3].c),
        note('เตรียมสรุปก่อนประชุมทีม', 2, 0, 0, COLORS[1].c),
        note('ตอบคำถาม IC', 3, 0, 0, COLORS[5].c),
      ],
      view: { x: 60, y: 110, s: 0.55 },
      font: 'Mali',
      hideDone: false,
      z: 5,
    };
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.notes)) { if (!Array.isArray(s.zones)) s.zones = defaultZones(); return s; }
    } catch (e) {}
    return null;
  }
  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }, 150);
  }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  const byId = (id) => state.notes.find((n) => n.id === id);
  const elOf = (id) => layer.querySelector(`.note[data-id="${id}"]`);
  const zoneById = (id) => state.zones.find((z) => z.id === id);
  const zoneEl = (id) => layer.querySelector(`.zone[data-id="${id}"]`);
  function zoneOf(n) {
    const cx = n.x + NOTE_W / 2, cy = n.y + NOTE_H / 2;
    for (let i = state.zones.length - 1; i >= 0; i--) {
      const z = state.zones[i];
      if (cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) return z;
    }
    return null;
  }
  const inRoutine = (n) => !!(zoneOf(n) || {}).routine;

  // ---------- view ----------
  function applyView() {
    const { x, y, s } = state.view;
    layer.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    const g = 28 * s;
    viewport.style.backgroundSize = `${g}px ${g}px`;
    viewport.style.backgroundPosition = `${x}px ${y}px`;
    $('#zoomLabel').textContent = Math.round(s * 100) + '%';
  }
  const toBoard = (cx, cy) => ({ x: (cx - state.view.x) / state.view.s, y: (cy - state.view.y) / state.view.s });

  function zoomAt(cx, cy, factor) {
    const v = state.view;
    const ns = Math.min(MAX_Z, Math.max(MIN_Z, v.s * factor));
    const k = ns / v.s;
    v.x = cx - (cx - v.x) * k;
    v.y = cy - (cy - v.y) * k;
    v.s = ns;
    applyView(); save();
  }
  function animateView(target) {
    const from = { ...state.view }, t0 = performance.now(), dur = 380;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      state.view.x = from.x + (target.x - from.x) * e;
      state.view.y = from.y + (target.y - from.y) * e;
      state.view.s = from.s + (target.s - from.s) * e;
      applyView();
      if (p < 1) requestAnimationFrame(step); else save();
    };
    requestAnimationFrame(step);
  }
  // fit the whole board to the window; when the zones sit in one row, stretch
  // their height so the row fills the screen exactly
  const TOP = 78, SIDE = 18, BOTTOM = 14;
  function fitAll(instant) {
    const W = innerWidth - SIDE * 2, H = innerHeight - TOP - BOTTOM;
    const zs = state.zones;
    if (zs.length && zs.every((z) => z.y === zs[0].y && z.h === zs[0].h)) {
      const rowW = Math.max(...zs.map((z) => z.x + z.w)) - Math.min(...zs.map((z) => z.x));
      const lowest = Math.max(0, ...state.notes.filter((n) => zoneOf(n)).map((n) => n.y + NOTE_H + 30 - zs[0].y));
      const h = Math.max(600, lowest, Math.round(rowW * H / W));
      zs.forEach((z) => { z.h = h; renderZone(z); });
    }
    const boxes = state.notes.filter((n) => !(state.hideDone && n.done)).map((n) => ({ x: n.x, y: n.y, w: NOTE_W, h: NOTE_H }))
      .concat(zs.map((z) => ({ x: z.x, y: z.y, w: z.w, h: z.h })));
    if (!boxes.length) return animateView({ x: 120, y: 120, s: 1 });
    const minX = Math.min(...boxes.map((b) => b.x)), minY = Math.min(...boxes.map((b) => b.y));
    const maxX = Math.max(...boxes.map((b) => b.x + b.w)), maxY = Math.max(...boxes.map((b) => b.y + b.h));
    const sc = Math.min(1.25, Math.max(MIN_Z, Math.min(W / (maxX - minX), H / (maxY - minY))));
    const target = { s: sc, x: SIDE + (W - (maxX - minX) * sc) / 2 - minX * sc, y: TOP + (H - (maxY - minY) * sc) / 2 - minY * sc };
    if (instant === true) { Object.assign(state.view, target); applyView(); save(); }
    else animateView(target);
  }

  // ---------- notes ----------
  function fontSizeFor(text) {
    const len = [...(text || '')].length;
    if (len <= 6) return 42;
    if (len <= 12) return 36;
    if (len <= 22) return 30;
    if (len <= 40) return 25;
    if (len <= 70) return 21;
    return 17;
  }
  function nextColor(c) {
    const i = COLORS.findIndex((x) => x.c === c);
    return COLORS[(i + 1) % COLORS.length].c;
  }

  const REPEAT_LABEL = { day: 'ทุกวัน', week: 'ทุกสัปดาห์', month: 'ทุกเดือน' };
  const REPEAT_NEXT = { day: 'week', week: 'month', month: 'day' };
  const REPEAT_ICON = '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CHECK_SVG = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function renderNote(n, pop) {
    let el = elOf(n.id);
    if (!el) {
      el = document.createElement('div');
      el.className = 'note';
      el.dataset.id = n.id;
      el.innerHTML =
        '<div class="tape"></div>' +
        '<div class="body"><div class="text" data-ph="งานที่ต้องทำ" spellcheck="false"></div></div>' +
        '<div class="stamp">เสร็จ!</div>' +
        '<button class="repeat" title="รอบของงานประจำ"></button>' +
        '<div class="tools">' +
          `<button class="check" title="เสร็จแล้ว">${CHECK_SVG}</button>` +
          '<span class="grow"></span>' +
          '<button class="swatch" title="เปลี่ยนสี"></button>' +
          '<button class="del" title="ลบ">×</button>' +
        '</div>';
      layer.appendChild(el);
      if (pop) { el.classList.add('pop'); el.addEventListener('animationend', () => el.classList.remove('pop'), { once: true }); }
    }
    el.style.left = n.x + 'px';
    el.style.top = n.y + 'px';
    el.style.zIndex = n.z;
    el.style.setProperty('--c', n.color);
    el.style.setProperty('--rot', n.rot + 'deg');
    el.style.setProperty('--tape', (n.rot * -1.4 - 2) + 'deg');
    el.style.setProperty('--next', nextColor(n.color));
    el.classList.toggle('done', !!n.done);
    const routine = inRoutine(n);
    el.classList.toggle('in-routine', routine);
    if (routine) el.querySelector('.repeat').innerHTML = REPEAT_ICON + REPEAT_LABEL[n.repeat || 'day'];
    const t = el.querySelector('.text');
    if (editingId !== n.id && t.textContent !== n.text) t.textContent = n.text;
    t.style.setProperty('--fs', fontSizeFor(n.text) + 'px');
    return el;
  }
  function renderZone(z) {
    let el = zoneEl(z.id);
    if (!el) {
      el = document.createElement('div');
      el.className = 'zone';
      el.dataset.id = z.id;
      el.innerHTML =
        '<div class="zone-head"><div class="zone-title" spellcheck="false"></div><span class="zone-count"></span>' +
        '<button class="zone-del" title="ลบโซน">×</button></div>' +
        '<div class="zone-resize" title="ปรับขนาดโซน"></div>';
      layer.insertBefore(el, layer.querySelector('.note'));
    }
    el.style.left = z.x + 'px'; el.style.top = z.y + 'px';
    el.style.width = z.w + 'px'; el.style.height = z.h + 'px';
    el.style.setProperty('--zc', z.tint);
    el.classList.toggle('routine', !!z.routine);
    const t = el.querySelector('.zone-title');
    if (document.activeElement !== t && t.textContent !== z.name) t.textContent = z.name;
    return el;
  }
  function renderZoneCounts() {
    const counts = {};
    state.notes.forEach((n) => { if (!n.done) { const z = zoneOf(n); if (z) counts[z.id] = (counts[z.id] || 0) + 1; } });
    state.zones.forEach((z) => {
      const el = zoneEl(z.id); if (!el) return;
      const c = el.querySelector('.zone-count');
      c.textContent = counts[z.id] || '';
      c.hidden = !counts[z.id];
    });
  }
  function renderAll() {
    const zids = new Set(state.zones.map((z) => z.id));
    layer.querySelectorAll('.zone').forEach((el) => { if (!zids.has(el.dataset.id)) el.remove(); });
    state.zones.forEach(renderZone);
    const ids = new Set(state.notes.map((n) => n.id));
    layer.querySelectorAll('.note').forEach((el) => { if (!ids.has(el.dataset.id)) el.remove(); });
    state.notes.forEach((n) => renderNote(n));
    document.documentElement.style.setProperty('--note-font', state.font);
    $('#fontSelect').value = state.font;
    document.body.classList.toggle('hide-done', !!state.hideDone);
    $('#toggleDone').classList.toggle('on', !!state.hideDone);
    renderCount();
    updateBuddy();
  }
  function renderCount() {
    renderZoneCounts();
    const total = state.notes.length, done = state.notes.filter((n) => n.done).length;
    const left = total - done;
    $('#count').innerHTML = total ? `เหลือ <b>${left}</b> จาก ${total} งาน` : 'กระดานว่าง';
  }

  function addNote(x, y, color) {
    const n = {
      id: uid(), text: '', x: Math.round(x), y: Math.round(y),
      color: color || COLORS[Math.floor(Math.random() * COLORS.length)].c,
      rot: +(Math.random() * 5 - 2.5).toFixed(1), done: false, z: ++state.z, t: Date.now(), fresh: true,
    };
    if (inRoutine(n)) n.repeat = 'day';
    state.notes.push(n);
    renderNote(n, true);
    renderCount();
    startEdit(n.id);
    save();
    return n;
  }
  // find the nearest empty spot so a new note never lands on top of another
  function freeSpot(x0, y0) {
    const gap = 26, stepX = NOTE_W + gap, stepY = NOTE_H + gap;
    const hits = (x, y) => state.notes.some((n) => !(state.hideDone && n.done) &&
      x < n.x + NOTE_W + gap && x + NOTE_W + gap > n.x && y < n.y + NOTE_H + gap && y + NOTE_H + gap > n.y);
    for (let r = 0; r < 12; r++) {
      const ring = [];
      for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
        ring.push({ x: x0 + i * stepX * 0.5, y: y0 + j * stepY * 0.5, d: i * i + j * j });
      }
      ring.sort((a, b) => a.d - b.d);
      const ok = ring.find((p) => !hits(p.x, p.y));
      if (ok) return ok;
    }
    return { x: x0 + Math.random() * 80, y: y0 + Math.random() * 80 };
  }
  function addNoteInView(color) {
    const c = toBoard(innerWidth / 2, innerHeight / 2 + 30);
    const p = freeSpot(c.x - NOTE_W / 2, c.y - NOTE_H / 2);
    addNote(p.x, p.y, color);
  }

  function removeNotes(ids, msg) {
    const removed = state.notes.filter((n) => ids.includes(n.id));
    if (!removed.length) return;
    state.notes = state.notes.filter((n) => !ids.includes(n.id));
    removed.forEach((n) => { const el = elOf(n.id); if (el) el.remove(); });
    if (removed.some((n) => n.text.trim())) {
      undoStack.push({ notes: removed.map((n) => ({ ...n })), zones: [] });
      showToast(msg || 'ลบโน้ตแล้ว');
    }
    renderCount(); updateBuddy(); save();
  }
  function undo() {
    const last = undoStack.pop();
    if (!last) return;
    last.zones.forEach((z) => { state.zones.push(z); renderZone(z); });
    last.notes.forEach((n) => { state.notes.push(n); renderNote(n, true); });
    state.notes.forEach((n) => renderNote(n));
    hideToast(); renderCount(); updateBuddy(); save();
  }

  function toggleDone(id) {
    const n = byId(id); if (!n) return;
    n.done = !n.done;
    if (n.done) n.doneAt = Date.now(); else delete n.doneAt;
    renderNote(n); renderCount();
    if (n.done) {
      const r = elOf(id).getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, n.color);
      cheerUntil = Date.now() + 2600;
      sayCheer();
    }
    updateBuddy(); save();
  }

  // ---------- editing ----------
  function startEdit(id) {
    if (editingId && editingId !== id) endEdit();
    const el = elOf(id); if (!el) return;
    editingId = id;
    const n = byId(id); n.z = ++state.z; el.style.zIndex = n.z;
    el.classList.add('editing');
    const t = el.querySelector('.text');
    t.contentEditable = 'plaintext-only';
    if (t.contentEditable !== 'plaintext-only') t.contentEditable = 'true';
    t.focus();
    const range = document.createRange(); range.selectNodeContents(t); range.collapse(false);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
    updateBuddy();
  }
  function endEdit() {
    if (!editingId) return;
    const id = editingId; editingId = null;
    const el = elOf(id), n = byId(id);
    if (el) {
      const t = el.querySelector('.text');
      t.contentEditable = 'false';
      el.classList.remove('editing');
      if (n) n.text = t.textContent.replace(/\s+$/,'').replace(/^\s+/, '');
    }
    if (n) {
      delete n.fresh;
      if (!n.text) { removeNotes([id]); }
      else renderNote(n);
    }
    getSelection().removeAllRanges();
    updateBuddy(); save();
  }

  layer.addEventListener('input', (e) => {
    const t = e.target.closest('.text'); if (!t) return;
    const n = byId(t.closest('.note').dataset.id); if (!n) return;
    n.text = t.textContent;
    t.style.setProperty('--fs', fontSizeFor(n.text) + 'px');
    lastActivity = Date.now();
    save();
  });
  layer.addEventListener('keydown', (e) => {
    if (!e.target.closest('.text')) return;
    if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Escape') { e.preventDefault(); e.target.blur(); }
  });
  layer.addEventListener('focusout', (e) => { if (e.target.closest('.text')) endEdit(); });
  layer.addEventListener('paste', (e) => {
    if (!e.target.closest('.text')) return;
    e.preventDefault();
    const txt = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, txt);
  });

  // ---------- pointer: notes ----------
  layer.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.note'); if (!el) return;
    e.stopPropagation();
    lastActivity = Date.now();
    const id = el.dataset.id, n = byId(id);
    const btn = e.target.closest('button');
    if (btn) return; // handled on click
    if (editingId === id && e.target.closest('.text')) return; // let caret move
    e.preventDefault();
    if (editingId && editingId !== id) endEdit();
    n.z = ++state.z; el.style.zIndex = n.z;
    const sx = e.clientX, sy = e.clientY, ox = n.x, oy = n.y;
    let moved = false;
    el.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const dx = (ev.clientX - sx) / state.view.s, dy = (ev.clientY - sy) / state.view.s;
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 4) {
        moved = true; draggingId = id; el.classList.add('dragging');
        if (editingId === id) endEdit();
        updateBuddy();
      }
      if (moved) { n.x = Math.round(ox + dx); n.y = Math.round(oy + dy); el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; }
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      if (moved) {
        el.classList.remove('dragging'); draggingId = null;
        if (inRoutine(n) && !n.repeat) n.repeat = 'day';
        renderNote(n); renderCount(); save(); updateBuddy();
      }
      else startEdit(id);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });
  layer.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const el = btn.closest('.note'); if (!el) return;
    const id = el.dataset.id; const n = byId(id);
    if (!el) return;
    if (btn.classList.contains('repeat')) { n.repeat = REPEAT_NEXT[n.repeat || 'day']; renderNote(n); save(); return; }
    if (btn.classList.contains('check')) { if (editingId === id) endEdit(); if (byId(id)) toggleDone(id); }
    else if (btn.classList.contains('swatch')) { n.color = nextColor(n.color); renderNote(n); save(); }
    else if (btn.classList.contains('del')) { if (editingId === id) { editingId = null; } removeNotes([id]); }
  });
  layer.addEventListener('mousedown', (e) => { if (e.target.closest('.note button')) e.preventDefault(); }); // keep focus while clicking tools

  // ---------- pointer: board ----------
  let spaceDown = false;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.note, .zone-head, .zone-resize')) return;
    lastActivity = Date.now();
    if (editingId) endEdit();
    const sx = e.clientX, sy = e.clientY, ox = state.view.x, oy = state.view.y;
    viewport.setPointerCapture(e.pointerId);
    viewport.classList.add('panning');
    const move = (ev) => { state.view.x = ox + ev.clientX - sx; state.view.y = oy + ev.clientY - sy; applyView(); };
    const up = () => {
      viewport.classList.remove('panning');
      viewport.removeEventListener('pointermove', move);
      viewport.removeEventListener('pointerup', up);
      viewport.removeEventListener('pointercancel', up);
      save();
    };
    viewport.addEventListener('pointermove', move);
    viewport.addEventListener('pointerup', up);
    viewport.addEventListener('pointercancel', up);
  });
  viewport.addEventListener('dblclick', (e) => {
    if (e.target.closest('.note')) return;
    const p = toBoard(e.clientX, e.clientY);
    addNote(p.x - NOTE_W / 2, p.y - NOTE_H / 2);
  });
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    lastActivity = Date.now();
    if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0022));
    else { state.view.x -= e.deltaX; state.view.y -= e.deltaY; applyView(); save(); }
  }, { passive: false });

  // ---------- zones ----------
  layer.addEventListener('pointerdown', (e) => {
    const zEl = e.target.closest('.zone'); if (!zEl) return;
    const head = e.target.closest('.zone-head'), handle = e.target.closest('.zone-resize');
    if (!head && !handle) return;
    if (e.target.closest('.zone-del')) return;
    const title = zEl.querySelector('.zone-title');
    if (head && document.activeElement === title && e.target === title) return; // caret
    e.stopPropagation(); e.preventDefault();
    if (editingId) endEdit();
    lastActivity = Date.now();
    const z = zoneById(zEl.dataset.id);
    const sx = e.clientX, sy = e.clientY, o = { ...z };
    // notes that travel with the zone
    const riders = head ? state.notes.filter((n) => zoneOf(n) === z).map((n) => ({ n, x: n.x, y: n.y })) : [];
    let moved = false;
    zEl.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const dx = (ev.clientX - sx) / state.view.s, dy = (ev.clientY - sy) / state.view.s;
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 4) { moved = true; zEl.classList.add('moving'); }
      if (!moved) return;
      if (handle) { z.w = Math.max(280, Math.round(o.w + dx)); z.h = Math.max(300, Math.round(o.h + dy)); }
      else {
        z.x = Math.round(o.x + dx); z.y = Math.round(o.y + dy);
        riders.forEach((r) => { r.n.x = Math.round(r.x + dx); r.n.y = Math.round(r.y + dy); const ne = elOf(r.n.id); ne.style.left = r.n.x + 'px'; ne.style.top = r.n.y + 'px'; });
      }
      renderZone(z);
    };
    const up = () => {
      zEl.removeEventListener('pointermove', move); zEl.removeEventListener('pointerup', up); zEl.removeEventListener('pointercancel', up);
      zEl.classList.remove('moving');
      if (!moved && head) {
        title.contentEditable = 'plaintext-only';
        if (title.contentEditable !== 'plaintext-only') title.contentEditable = 'true';
        title.focus();
        const r = document.createRange(); r.selectNodeContents(title); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      }
      state.notes.forEach((n) => renderNote(n)); renderCount(); save();
    };
    zEl.addEventListener('pointermove', move); zEl.addEventListener('pointerup', up); zEl.addEventListener('pointercancel', up);
  });
  layer.addEventListener('keydown', (e) => {
    if (!e.target.classList.contains('zone-title')) return;
    if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); e.target.blur(); }
  });
  layer.addEventListener('focusout', (e) => {
    const t = e.target; if (!t.classList || !t.classList.contains('zone-title')) return;
    t.contentEditable = 'false';
    const z = zoneById(t.closest('.zone').dataset.id);
    const name = t.textContent.trim();
    if (z) { if (name) z.name = name; t.textContent = z.name; save(); }
  });
  layer.addEventListener('click', (e) => {
    const del = e.target.closest('.zone-del'); if (!del) return;
    const z = zoneById(del.closest('.zone').dataset.id); if (!z) return;
    state.zones = state.zones.filter((x) => x !== z);
    zoneEl(z.id).remove();
    undoStack.push({ notes: [], zones: [{ ...z }] });
    showToast(`ลบโซน ${z.name} แล้ว`);
    state.notes.forEach((n) => renderNote(n)); renderCount(); save();
  });
  function addZone() {
    const right = state.zones.length ? Math.max(...state.zones.map((z) => z.x + z.w)) + ZONE_GAP : 0;
    const top = state.zones.length ? Math.min(...state.zones.map((z) => z.y)) : 0;
    const z = { id: uid(), name: 'โซนใหม่', x: right, y: top, w: ZONE_W, h: ZONE_H, tint: ZONE_TINTS[state.zones.length % ZONE_TINTS.length], routine: false };
    state.zones.push(z); renderZone(z); save();
    const s = state.view.s;
    animateView({ s, x: innerWidth / 2 - (z.x + z.w / 2) * s, y: state.view.y });
  }

  // routine notes come back undone when their period rolls over
  const pad2 = (v) => String(v).padStart(2, '0');
  function periodKey(ts, repeat) {
    const d = new Date(ts);
    if (repeat === 'month') return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
    if (repeat === 'week') { const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return 'w' + m.toDateString(); }
    return d.toDateString();
  }
  function resetRoutines() {
    const now = Date.now();
    let back = 0;
    state.notes.forEach((n) => {
      if (!n.done || !inRoutine(n)) return;
      const rep = n.repeat || 'day';
      if (periodKey(n.doneAt || 0, rep) !== periodKey(now, rep)) { n.done = false; delete n.doneAt; renderNote(n); back++; }
    });
    if (back) { renderCount(); save(); say(`งานประจำกลับมาแล้ว ${back} อัน`); }
  }

  // ---------- toolbar ----------
  const sw = $('#swatches');
  COLORS.forEach((col, i) => {
    const b = document.createElement('button');
    b.style.setProperty('--c', col.c);
    b.style.setProperty('--r', [-6, 4, -3, 5, -4, 3][i] + 'deg');
    b.title = 'แปะโน้ตสี' + col.name;
    b.textContent = '+';
    b.addEventListener('click', () => addNoteInView(col.c));
    sw.appendChild(b);
  });
  $('#fontSelect').addEventListener('change', (e) => { state.font = e.target.value; renderAll(); save(); });
  [...$('#fontSelect').options].forEach((o) => { o.style.fontFamily = o.value; });
  $('#toggleDone').addEventListener('click', () => { state.hideDone = !state.hideDone; renderAll(); save(); });
  $('#clearDone').addEventListener('click', () => {
    const ids = state.notes.filter((n) => n.done && !inRoutine(n)).map((n) => n.id);
    if (ids.length) removeNotes(ids, `เก็บไป ${ids.length} งานที่เสร็จแล้ว`);
  });
  $('#zoomIn').addEventListener('click', () => zoomAt(innerWidth / 2, innerHeight / 2, 1.2));
  $('#zoomOut').addEventListener('click', () => zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.2));
  $('#zoomLabel').addEventListener('click', () => {
    const c = toBoard(innerWidth / 2, innerHeight / 2);
    animateView({ s: 1, x: innerWidth / 2 - c.x, y: innerHeight / 2 - c.y });
  });
  $('#fitAll').addEventListener('click', () => fitAll());

  const menu = $('#menu');
  $('#menuBtn').addEventListener('click', (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; });
  document.addEventListener('click', (e) => { if (!e.target.closest('.menu-wrap')) menu.hidden = true; });
  menu.addEventListener('click', (e) => { if (e.target.closest('button')) menu.hidden = true; });

  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ app: 'paekaikon', version: 1, ...state }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = `แปะไว้ก่อน-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.notes)) throw new Error('bad');
      state = { ...seed(), ...data, notes: data.notes, zones: Array.isArray(data.zones) ? data.zones : defaultZones() };
      state.buddy = { ...Character.DEFAULT_LOOK, ...(state.buddy || {}) };
      layer.innerHTML = '';
      renderAll(); applyView(); save(); fitAll();
      say('เปิดกระดานเดิมให้แล้วน้า');
    } catch (err) { say('ไฟล์นี้เปิดไม่ได้ ลองไฟล์อื่นนะ'); }
    e.target.value = '';
  });
  $('#addZoneBtn').addEventListener('click', addZone);
  $('#fullBtn').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.();
  });
  $('#wipeBtn').addEventListener('click', () => {
    if (!state.notes.length) return;
    removeNotes(state.notes.map((n) => n.id), 'ล้างกระดานแล้ว');
  });

  // install (PWA)
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; $('#installBtn').hidden = false; });
  $('#installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null; $('#installBtn').hidden = true;
  });
  window.addEventListener('appinstalled', () => { $('#installBtn').hidden = true; say('ย้ายมาอยู่ในเครื่องแล้ว เย้'); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // keyboard
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('.text, input, select')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    else if (e.key === 'n' || e.key === 'N' || e.key === 'ด') { e.preventDefault(); addNoteInView(); }
    else if (e.key === '0' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); fitAll(); }
    else if ((e.key === '=' || e.key === '+') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); zoomAt(innerWidth / 2, innerHeight / 2, 1.2); }
    else if (e.key === '-' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.2); }
  });

  // ---------- toast ----------
  let toastTimer;
  function showToast(msg) {
    $('#toastMsg').textContent = msg;
    $('#toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 6000);
  }
  function hideToast() { $('#toast').hidden = true; }
  $('#toastUndo').addEventListener('click', undo);

  // ---------- confetti ----------
  function burst(x, y, color) {
    const fx = $('#fx');
    const palette = [color, ...COLORS.map((c) => c.c)];
    for (let i = 0; i < 22; i++) {
      const b = document.createElement('i');
      b.className = 'bit';
      const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 120;
      b.style.left = x + 'px'; b.style.top = y + 'px';
      b.style.background = palette[i % palette.length];
      b.style.setProperty('--dx', Math.cos(a) * d + 'px');
      b.style.setProperty('--dy', Math.sin(a) * d - 40 + 'px');
      b.style.setProperty('--rr', (Math.random() * 540 - 270) + 'deg');
      fx.appendChild(b);
      setTimeout(() => b.remove(), 950);
    }
  }

  // ---------- buddy ----------
  const buddyBody = $('#buddyBody'), bubble = $('#bubble');
  let currentPose = '', currentMsg = '', lastMood = '';
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function mood() {
    const now = Date.now();
    const total = state.notes.length, left = state.notes.filter((n) => !n.done).length;
    if (draggingId) return 'carry';
    if (now < cheerUntil) return 'cheer';
    if (editingId) return 'write';
    if (now < waveUntil) return 'wave';
    if (!total) return 'sleep';
    if (!left) return 'tea';
    if (now - lastActivity > 120000) return 'sleep';
    return 'idle';
  }
  function lineFor(m) {
    const total = state.notes.length;
    const done = state.notes.filter((n) => n.done).length, left = total - done;
    switch (m) {
      case 'wave': return left ? `ฮัลโหล! วันนี้มี ${left} งานน้า` : 'ฮัลโหล! วันนี้จะแปะอะไรดี';
      case 'write': return pick(['จดไว้ก่อน กันลืม', 'อันนี้สำคัญใช่มั้ย', 'เขียนสั้น ๆ ก็พอน้า']);
      case 'carry': return pick(['ย้ายไปตรงไหนดี', 'ฮึบ! หนักนิดนึง', 'วางตรงนี้ดีมั้ย']);
      case 'sleep': return total ? 'งีบแป๊บนึงนะ Zzz' : 'กระดานว่างเลย งีบก่อนนะ';
      case 'tea': return pick(['เสร็จหมดแล้ว จิบชาหน่อย', 'วันนี้เก่งมากเลย', 'ไม่เหลืองานแล้ว เย้']);
      default:
        return pick([
          `เหลืออีก ${left} งาน สู้ ๆ`,
          `ค่อย ๆ ทำทีละอันก็ได้`,
          done ? `ทำไปแล้ว ${done} งาน เก่งมาก` : `เริ่มจากอันที่ง่ายสุดก่อนมั้ย`,
          left > 6 ? 'งานเยอะจัง พักน้ำบ้างนะ' : 'วันนี้ไหวอยู่แล้ว',
        ]);
    }
  }
  function say(msg) {
    if (msg === currentMsg) return;
    currentMsg = msg;
    bubble.classList.add('swap');
    setTimeout(() => { bubble.textContent = msg; bubble.classList.remove('swap'); }, 160);
  }
  function sayCheer() {
    const left = state.notes.filter((n) => !n.done).length;
    say(left ? pick(['เย้ เสร็จไปอีกอัน!', 'เก่งมากกก', `อีกแค่ ${left} งานเอง`]) : 'เสร็จครบทุกงานแล้ว!');
  }
  function updateBuddy() {
    const m = mood();
    if (m !== currentPose) {
      const editing = editingId && byId(editingId);
      const dragging = draggingId && byId(draggingId);
      buddyBody.innerHTML = Character.render(m, (dragging || editing || {}).color, state.buddy);
      currentPose = m;
    }
    if (m !== lastMood) {
      if (m !== 'cheer') say(lineFor(m));
      lastMood = m;
    }
  }
  // ---------- look panel ----------
  const LOOK_OPTS = {
    hair: [['long', 'ยาว'], ['bob', 'บ็อบ'], ['bun', 'มัดจุก'], ['short', 'สั้น'], ['sidepart', 'แสกข้าง'], ['curly', 'หยิก']],
    hairColor: ['#1b1b1b', '#6B4128', '#B5763C', '#E8C15A', '#F49CB8', '#7CB8E8', '#A0A0A0'],
    skin: ['#ffffff', '#FDE7D6', '#F2C9A6', '#D9A37C', '#B0784F', '#7E5136'],
    shirt: ['#ffffff', '#FFE98A', '#FFC6D3', '#BDE3FF', '#C9F0C2', '#DCCBFF', '#3b3b3b'],
    note: COLORS.map((c) => c.c),
  };
  const panel = $('#lookPanel');
  function renderLookPanel() {
    const L = state.buddy;
    panel.querySelectorAll('.opts').forEach((box) => {
      const key = box.dataset.key;
      if (!box.children.length) {
        LOOK_OPTS[key].forEach((o) => {
          const b = document.createElement('button');
          if (Array.isArray(o)) { b.className = 'txt'; b.dataset.v = o[0]; b.textContent = o[1]; }
          else { b.dataset.v = o; b.style.setProperty('--c', o); }
          box.appendChild(b);
        });
      }
      [...box.children].forEach((b) => b.classList.toggle('on', b.dataset.v.toLowerCase() === String(L[key]).toLowerCase()));
    });
    panel.querySelectorAll('input[data-key]').forEach((i) => { i.checked = !!L[i.dataset.key]; });
  }
  function applyLook() {
    $('#buddy').classList.toggle('hidden', !state.buddy.show);
    currentPose = '';
    updateBuddy();
    renderLookPanel();
    save();
  }
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('.opts button'); if (!b) return;
    state.buddy[b.closest('.opts').dataset.key] = b.dataset.v;
    applyLook();
  });
  panel.addEventListener('change', (e) => {
    const k = e.target.dataset.key; if (!k) return;
    state.buddy[k] = e.target.checked;
    applyLook();
  });
  $('#lookBtn').addEventListener('click', () => { renderLookPanel(); panel.hidden = false; $('#buddy').classList.add('dressing'); });
  $('#lookClose').addEventListener('click', () => { panel.hidden = true; $('#buddy').classList.remove('dressing'); });
  $('#lookReset').addEventListener('click', () => { state.buddy = { ...Character.DEFAULT_LOOK }; applyLook(); });

  buddyBody.addEventListener('click', () => {
    lastActivity = Date.now();
    buddyBody.classList.remove('boing'); void buddyBody.offsetWidth; buddyBody.classList.add('boing');
    if (currentPose === 'sleep' && state.notes.length) { waveUntil = Date.now() + 2500; updateBuddy(); return; }
    say(lineFor(mood() === 'wave' ? 'idle' : mood()));
  });
  ['pointerdown', 'keydown', 'wheel'].forEach((ev) => addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true }));
  setInterval(updateBuddy, 1000);

  // ---------- go ----------
  state.buddy = { ...Character.DEFAULT_LOOK, ...(state.buddy || {}) };
  $('#buddy').classList.toggle('hidden', !state.buddy.show);
  applyView();
  renderAll();
  resetRoutines();
  setInterval(resetRoutines, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resetRoutines(); });
  fitAll(true);
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => fitAll(true), 120); });
  addEventListener('beforeunload', () => { if (editingId) endEdit(); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} });
})();
