// น้องโน้ต — original doodle character for แปะไว้ก่อน
// Each pose is composed from shared parts so the look stays consistent.
(function () {
  const INK = '#1b1b1b';
  const line = (d, w = 4) =>
    `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // doodle limb: thick ink outline with white inside
  const limb = (d, cls = '') =>
    `<g class="${cls}"><path d="${d}" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>`;

  const hairBack = `<path d="M100 30 C55 30 48 70 52 110 C54 140 40 160 48 185 C52 200 44 210 50 224 L150 224 C156 207 148 195 152 180 C158 155 146 140 148 110 C152 70 145 30 100 30 Z" fill="${INK}"/>`;
  const neck = `<rect x="91" y="106" width="18" height="34" fill="#fff"/>` + line('M91 108 L91 140 M109 108 L109 140', 3.5);
  const shirt = `<path d="M56 224 C56 172 66 142 86 134 Q100 146 114 134 C134 142 144 172 144 224 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  const face = `<ellipse cx="100" cy="80" rx="33" ry="38" fill="#fff" stroke="${INK}" stroke-width="4"/>`;
  const bangs = `<path d="M67 86 C62 52 82 38 100 38 C122 38 140 54 133 90 C128 72 118 60 104 58 C98 68 82 76 67 86 Z" fill="${INK}"/>`;
  const blush = `<ellipse cx="77" cy="103" rx="5.5" ry="3" fill="#ffb3c1"/><ellipse cx="123" cy="103" rx="5.5" ry="3" fill="#ffb3c1"/>`;
  const glasses =
    `<circle cx="87" cy="90" r="10" fill="#fff" stroke="${INK}" stroke-width="3.5"/>` +
    `<circle cx="113" cy="90" r="10" fill="#fff" stroke="${INK}" stroke-width="3.5"/>` +
    line('M97 89 Q100 86 103 89', 3);

  const eyes = {
    dot: `<circle cx="87" cy="91" r="2.6" fill="${INK}"/><circle cx="113" cy="91" r="2.6" fill="${INK}"/>`,
    happy: line('M82.5 93 Q87 86.5 91.5 93', 3) + line('M108.5 93 Q113 86.5 117.5 93', 3),
    closed: line('M82.5 90 Q87 95 91.5 90', 3) + line('M108.5 90 Q113 95 117.5 90', 3),
    down: `<circle cx="86" cy="94" r="2.6" fill="${INK}"/><circle cx="112" cy="94" r="2.6" fill="${INK}"/>`,
  };
  const mouths = {
    smile: line('M95 107 Q100 111 105 107', 3),
    open: `<path d="M93.5 105 Q100 117 106.5 105 Z" fill="${INK}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`,
    o: `<ellipse cx="100" cy="108" rx="2.6" ry="3" fill="none" stroke="${INK}" stroke-width="2.6"/>`,
    tiny: line('M97.5 108 Q100 109.5 102.5 108', 2.6),
  };
  const headNote = (color = '#FFE98A') =>
    `<g class="head-note" transform="rotate(-9 100 22)"><rect x="84" y="6" width="32" height="28" rx="2" fill="${color}" stroke="${INK}" stroke-width="3.5"/>` +
    line('M90 16 L110 16 M90 23 L104 23', 2.4) + `</g>`;

  const head = (eye, mouth, opts = {}) =>
    `<g class="head"${opts.tilt ? ` transform="rotate(${opts.tilt} 100 110)"` : ''}>` +
    face + bangs + blush + glasses + eyes[eye] + mouths[mouth] + (opts.noNote ? '' : headNote(opts.noteColor)) + `</g>`;

  const sparkle = (x, y, s = 1) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -10 Q2 -2 10 0 Q2 2 0 10 Q-2 2 -10 0 Q-2 -2 0 -10 Z" fill="#FFD84D" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;

  const body = hairBack + neck + shirt;

  const poses = {
    idle: () =>
      body +
      limb('M66 150 Q57 178 62 206') +
      limb('M134 150 Q143 178 138 206') +
      head('dot', 'smile'),

    wave: () =>
      body +
      limb('M66 150 Q57 178 62 206') +
      limb('M134 150 Q156 136 160 104', 'wave-arm') +
      head('happy', 'open') +
      `<g class="wave-lines">${line('M172 92 l9 -5', 3)}${line('M175 104 l10 0', 3)}</g>`,

    write: (c) =>
      body +
      `<g transform="rotate(-5 100 186)"><rect x="76" y="166" width="50" height="38" rx="2" fill="${c || '#FFC6D3'}" stroke="${INK}" stroke-width="3.5"/>` +
      line('M84 178 L116 178 M84 188 L108 188', 2.4) + `</g>` +
      limb('M66 150 Q68 182 88 190') +
      `<g class="pencil"><path d="M114 186 L128 156" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M114 186 L128 156" stroke="#FFD84D" stroke-width="4" stroke-linecap="round"/></g>` +
      limb('M134 150 Q138 176 116 184') +
      head('down', 'tiny'),

    cheer: () =>
      body +
      limb('M66 150 Q46 128 44 96') +
      limb('M134 150 Q154 128 156 96') +
      head('happy', 'open') +
      sparkle(24, 70, 1.1) + sparkle(178, 62, 0.9) + sparkle(32, 130, 0.7) + sparkle(170, 130, 0.75),

    carry: (c) =>
      body +
      `<g class="lifted"><rect x="58" y="4" width="84" height="56" rx="3" fill="${c || '#BDE3FF'}" stroke="${INK}" stroke-width="4" transform="rotate(3 100 32)"/>` +
      line('M72 24 L124 26 M72 38 L112 40', 2.6) + `</g>` +
      limb('M66 150 Q42 112 64 58') +
      limb('M134 150 Q158 112 136 58') +
      head('dot', 'o', { noNote: true }),

    sleep: () =>
      body +
      limb('M66 150 Q70 186 96 192') +
      limb('M134 150 Q130 186 104 192') +
      head('closed', 'o', { tilt: -9 }) +
      `<g class="zzz" font-family="Mali, sans-serif" font-weight="700" fill="${INK}">` +
      `<text x="146" y="54" font-size="22">Z</text><text x="164" y="34" font-size="16">z</text><text x="176" y="18" font-size="12">z</text></g>`,

    tea: () =>
      body +
      `<g class="steam">${line('M94 158 q-5 -6 0 -12 q5 -6 0 -12', 3)}${line('M106 160 q-5 -6 0 -12 q5 -6 0 -12', 3)}</g>` +
      `<rect x="86" y="166" width="28" height="28" rx="5" fill="#fff" stroke="${INK}" stroke-width="3.5"/>` +
      `<path d="M114 172 q10 0 10 8 q0 8 -10 8" fill="none" stroke="${INK}" stroke-width="3.5"/>` +
      `<rect x="86" y="172" width="28" height="7" fill="#C9F0C2"/>` +
      limb('M66 150 Q68 182 88 182') +
      limb('M134 150 Q132 182 112 184') +
      head('happy', 'smile'),
  };

  window.Character = {
    render(pose, color) {
      const fn = poses[pose] || poses.idle;
      return `<svg viewBox="0 -4 200 228" xmlns="http://www.w3.org/2000/svg" class="pose-${pose}" aria-hidden="true">${fn(color)}</svg>`;
    },
    poses: Object.keys(poses),
  };
})();
