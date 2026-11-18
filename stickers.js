// Original doodle stickers for the board (all drawn in code, viewBox 0 0 100 100)
(function () {
  const INK = '#1b1b1b';
  const S = 'stroke="' + INK + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"';
  const ln = (d, w = 4) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const dot = (x, y, r = 3.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`;
  const blush = (x1, x2, y) => `<ellipse cx="${x1}" cy="${y}" rx="5" ry="3" fill="#ff9fb4"/><ellipse cx="${x2}" cy="${y}" rx="5" ry="3" fill="#ff9fb4"/>`;
  const face = (cx, cy, gap = 11) => dot(cx - gap, cy) + dot(cx + gap, cy) + ln(`M${cx - 4} ${cy + 6} Q${cx} ${cy + 10} ${cx + 4} ${cy + 6}`, 3) + blush(cx - gap - 6, cx + gap + 6, cy + 7);

  const star = (() => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 19 : 40;
      pts.push((50 + r * Math.cos(a)).toFixed(1) + ' ' + (54 + r * Math.sin(a)).toFixed(1));
    }
    return 'M' + pts.join(' L') + ' Z';
  })();

  const tag = (label, fill) =>
    `<path d="M8 32 H76 L94 50 L76 68 H8 Q4 68 4 64 V36 Q4 32 8 32 Z" fill="${fill}" ${S}/>` +
    `<circle cx="80" cy="50" r="4" fill="#fff" stroke="${INK}" stroke-width="3"/>` +
    `<text x="40" y="58" text-anchor="middle" font-family="Mali, sans-serif" font-weight="700" font-size="22" fill="${INK}">${label}</text>`;

  const LIB = {
    cat:
      `<path d="M22 42 L17 13 L40 28 Q50 25 60 28 L83 13 L78 42 Q87 58 78 73 Q67 87 50 87 Q33 87 22 73 Q13 58 22 42 Z" fill="#FFD3A8" ${S}/>` +
      `<path d="M23 20 L36 30 L26 36 Z M77 20 L64 30 L74 36 Z" fill="#ffb3c1"/>` +
      dot(38, 55) + dot(62, 55) + `<path d="M46 62 L54 62 L50 67 Z" fill="${INK}"/>` +
      ln('M43 70 Q46.5 74 50 69 Q53.5 74 57 70', 3) + ln('M14 60 L30 63 M14 70 L30 68 M86 60 L70 63 M86 70 L70 68', 2.6) + blush(32, 68, 65),
    heart:
      `<path d="M50 86 C20 66 10 46 17 31 C24 16 43 15 50 31 C57 15 76 16 83 31 C90 46 80 66 50 86 Z" fill="#FF9DB5" ${S}/>` +
      `<ellipse cx="31" cy="34" rx="6" ry="4" transform="rotate(-35 31 34)" fill="#fff" opacity=".8"/>`,
    star: `<path d="${star}" fill="#FFD84D" ${S}/>` + face(50, 54, 9),
    coffee:
      ln('M40 30 q-5 -6 0 -12 q5 -6 0 -12', 3.4) + ln('M54 30 q-5 -6 0 -12 q5 -6 0 -12', 3.4) +
      `<path d="M70 50 Q85 50 85 61 Q85 72 70 72" fill="none" ${S}/>` +
      `<path d="M22 40 H72 V68 Q72 86 54 86 H40 Q22 86 22 68 Z" fill="#fff" ${S}/>` +
      `<path d="M24 46 H70" stroke="#B5763C" stroke-width="6"/>` + face(47, 64, 10),
    boba:
      `<path d="M56 30 L66 4" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M56 30 L66 4" stroke="#FF9DB5" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M28 34 Q50 14 72 34" fill="#fff" ${S}/>` +
      `<path d="M27 36 H73 L66 88 H34 Z" fill="#E9D3B5" ${S}/>` +
      ln('M24 35 H76', 5) + dot(40, 79, 4) + dot(50, 81, 4) + dot(60, 79, 4) + dot(45, 72, 4) + dot(55, 72, 4) +
      face(50, 52, 9),
    cloud:
      `<path d="M26 72 Q8 72 10 57 Q12 44 27 46 Q29 27 48 27 Q65 27 69 42 Q86 40 90 55 Q92 72 74 72 Z" fill="#BDE3FF" ${S}/>` + face(50, 52, 10),
    sun:
      ln('M50 6 V16 M50 84 V94 M6 50 H16 M84 50 H94 M19 19 L26 26 M74 74 L81 81 M81 19 L74 26 M26 74 L19 81', 4.5) +
      `<circle cx="50" cy="50" r="25" fill="#FFD84D" ${S}/>` + face(50, 48, 9),
    plant:
      `<path d="M50 62 Q27 54 26 30 Q47 33 50 62 Z" fill="#9BDB8E" ${S}/>` +
      `<path d="M50 62 Q73 54 74 30 Q53 33 50 62 Z" fill="#9BDB8E" ${S}/>` +
      `<path d="M50 62 Q42 36 54 16 Q66 40 50 62 Z" fill="#B8E8A8" ${S}/>` +
      `<path d="M30 60 H70 L63 90 H37 Z" fill="#FFB38A" ${S}/>` + face(50, 72, 8),
    rainbow:
      `<path d="M12 74 A38 38 0 0 1 88 74" fill="none" stroke="${INK}" stroke-width="31"/>` +
      `<path d="M12 74 A38 38 0 0 1 88 74" fill="none" stroke="#FF9DB5" stroke-width="8.5"/>` +
      `<path d="M21 74 A29 29 0 0 1 79 74" fill="none" stroke="#FFD84D" stroke-width="8.5"/>` +
      `<path d="M30 74 A20 20 0 0 1 70 74" fill="none" stroke="#9BDB8E" stroke-width="8.5"/>` +
      `<path d="M6 82 Q4 70 15 70 Q19 62 28 68 Q36 68 34 80 Z" fill="#fff" ${S}/>` +
      `<path d="M94 82 Q96 70 85 70 Q81 62 72 68 Q64 68 66 80 Z" fill="#fff" ${S}/>`,
    onigiri:
      `<path d="M50 13 Q60 13 80 55 Q90 80 70 84 H30 Q10 80 20 55 Q40 13 50 13 Z" fill="#fff" ${S}/>` +
      `<rect x="37" y="64" width="26" height="21" rx="2" fill="${INK}"/>` + face(50, 48, 10),
    bunny:
      `<ellipse cx="36" cy="26" rx="9" ry="21" fill="#fff" ${S}/><ellipse cx="64" cy="26" rx="9" ry="21" fill="#fff" ${S}/>` +
      `<ellipse cx="36" cy="27" rx="4" ry="13" fill="#ffc6d3"/><ellipse cx="64" cy="27" rx="4" ry="13" fill="#ffc6d3"/>` +
      `<ellipse cx="50" cy="64" rx="32" ry="27" fill="#fff" ${S}/>` +
      dot(39, 62) + dot(61, 62) + `<path d="M47 68 L53 68 L50 71.5 Z" fill="${INK}"/>` + ln('M45 75 Q47.5 78 50 74 Q52.5 78 55 75', 2.8) + blush(30, 70, 72),
    fight:
      `<path d="M50 6 L58 22 L76 12 L74 32 L94 34 L80 48 L94 62 L74 66 L78 86 L59 76 L50 94 L41 76 L22 86 L26 66 L6 62 L20 48 L6 34 L26 32 L24 12 L42 22 Z" fill="#FFE98A" ${S}/>` +
      `<text x="50" y="59" text-anchor="middle" font-family="Mali, sans-serif" font-weight="700" font-size="25" fill="${INK}">สู้ ๆ</text>`,
    urgent: tag('ด่วน!', '#FF9C9C'),
    important: tag('สำคัญ', '#FFD84D'),
    waiting: tag('รอตอบ', '#BDE3FF'),
  };

  window.Stickers = {
    keys: Object.keys(LIB),
    svg: (k) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${LIB[k] || LIB.heart}</svg>`,
  };
})();
