// น้องโน้ต — original doodle character for แปะไว้ก่อน
// Each pose is composed from shared parts; `look` changes colors, hairstyle and accessories.
(function () {
  const INK = '#1b1b1b';
  const DEFAULT_LOOK = {
    hair: 'long', hairColor: '#1b1b1b', skin: '#ffffff', shirt: '#ffffff',
    note: '#FFE98A', glasses: true, blush: true, show: true,
  };

  const line = (d, w = 4) =>
    `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  // union of circles with one clean ink outline: outline layer first, fill layer on top
  const blob = (circles, fill) =>
    circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 1.75}" fill="${INK}"/>`).join('') +
    circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.75}" fill="${fill}"/>`).join('');
  const CURLY_BACK = [];
  for (let t = -28; t <= 208; t += 20) {
    const a = t * Math.PI / 180;
    CURLY_BACK.push([+(100 + 37 * Math.cos(a)).toFixed(1), +(74 - 37 * Math.sin(a)).toFixed(1), 13]);
  }
  CURLY_BACK.push([100, 62, 30]);
  const CURLY_FRINGE = [[72, 62, 8], [81, 56, 9], [91, 53, 9], [101, 52, 9], [111, 53, 9], [120, 56, 9], [128, 62, 8]];

  function parts(L) {
    const outline = L.hairColor.toLowerCase() === INK ? '' : ` stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"`;
    // doodle limb: thick ink outline with skin inside
    const limb = (d, cls = '') =>
      `<g class="${cls}"><path d="${d}" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${L.skin}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>`;

    const hairBackShapes = {
      long: 'M100 30 C55 30 48 70 52 110 C54 140 40 160 48 185 C52 200 44 210 50 224 L150 224 C156 207 148 195 152 180 C158 155 146 140 148 110 C152 70 145 30 100 30 Z',
      bob: 'M100 30 C56 30 50 68 53 104 C54 120 56 132 70 134 L130 134 C144 132 146 120 147 104 C150 68 144 30 100 30 Z',
      pony: 'M100 32 C61 32 57 66 61 98 L139 98 C143 66 139 32 100 32 Z',
      sidepart: 'M100 30 C60 30 55 58 60 90 L67 90 L67 70 L133 70 L133 90 L140 90 C145 58 140 30 100 30 Z',
      short: 'M100 31 C60 31 56 60 61 88 L67 88 L67 70 L133 70 L133 88 L139 88 C144 60 140 31 100 31 Z',
    };
    const headHair = ['short', 'pony', 'sidepart', 'curly'].includes(L.hair); // short styles tilt with the head
    const hairBack = L.hair === 'curly'
      ? blob(CURLY_BACK, L.hairColor)
      : `<path d="${hairBackShapes[L.hair] || hairBackShapes.long}" fill="${L.hairColor}"${outline}/>`;
    // ponytail swinging out behind the right side of the head, with a hair tie
    // ponytail hangs behind the shoulders (body layer); the hair tie sits on the head
    const ponyTail = L.hair === 'pony'
      ? `<path d="M124 44 C147 40 160 60 157 86 C155 108 160 126 150 144 C144 130 135 118 137 96 C138 80 134 66 120 58 Z" fill="${L.hairColor}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` +
        line('M146 72 Q150 92 147 112', 2.4)
      : '';
    const bun = L.hair === 'pony'
      ? `<ellipse cx="129" cy="50" rx="6" ry="7.5" transform="rotate(-30 129 50)" fill="${L.note}" stroke="${INK}" stroke-width="3"/>`
      : '';
    const neck = `<rect x="91" y="106" width="18" height="34" fill="${L.skin}"/>` + line('M91 108 L91 140 M109 108 L109 140', 3.5);
    const shirt = `<path d="M56 224 C56 172 66 142 86 134 Q100 146 114 134 C134 142 144 172 144 224 Z" fill="${L.shirt}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    const face = `<ellipse cx="100" cy="80" rx="33" ry="38" fill="${L.skin}" stroke="${INK}" stroke-width="4"/>`;
    // hair cap: covers the whole top of the face outline so no head line shows through the hair;
    // only the hairline (where hair meets skin) gets an ink line
    const cap = (y, hairline) => {
      const dx = 35.8 * Math.sqrt(1 - Math.pow((y - 80) / 40.8, 2));
      const L1 = (100 - dx).toFixed(1), R1 = (100 + dx).toFixed(1);
      return `<path d="M${L1} ${y} A35.8 40.8 0 ${y > 80 ? 1 : 0} 1 ${R1} ${y} L${hairline} Z" fill="${L.hairColor}"/>` +
        (outline ? line('M' + hairline, 3) : '');
    };
    const bangs = L.hair === 'curly' ? blob(CURLY_FRINGE, L.hairColor)
      : L.hair === 'sidepart'
      ? cap(82, '134 82 C130 66 120 57 108 54 C96 52 80 62 65 82') + line('M108 40 Q106 47 108 54', 2.6)
      : L.hair === 'short'
      ? cap(76, '134 76 L127 63 L119 70 L112 59 L104 67 L96 57 L88 67 L80 60 L73 70 L65 76')
      : cap(88, '134 90 C128 72 118 60 104 58 C98 68 82 76 66 88');
    const blush = L.blush ? `<ellipse cx="77" cy="103" rx="5.5" ry="3" fill="#ff9fb4" opacity=".85"/><ellipse cx="123" cy="103" rx="5.5" ry="3" fill="#ff9fb4" opacity=".85"/>` : '';
    const glasses = L.glasses
      ? `<circle cx="87" cy="90" r="10" fill="#fff" fill-opacity=".55" stroke="${INK}" stroke-width="3.5"/>` +
        `<circle cx="113" cy="90" r="10" fill="#fff" fill-opacity=".55" stroke="${INK}" stroke-width="3.5"/>` +
        line('M97 89 Q100 86 103 89', 3)
      : '';

    // without glasses the eyes get bigger, with a little shine, so the face doesn't look empty
    const bigEye = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="5.6" fill="${INK}"/><circle cx="${x + 1.6}" cy="${y - 2}" r="1.7" fill="#fff"/>`;
    const eyes = L.glasses ? {
      dot: `<circle cx="87" cy="91" r="2.6" fill="${INK}"/><circle cx="113" cy="91" r="2.6" fill="${INK}"/>`,
      happy: line('M82.5 93 Q87 86.5 91.5 93', 3) + line('M108.5 93 Q113 86.5 117.5 93', 3),
      closed: line('M82.5 90 Q87 95 91.5 90', 3) + line('M108.5 90 Q113 95 117.5 90', 3),
      down: `<circle cx="86" cy="94" r="2.6" fill="${INK}"/><circle cx="112" cy="94" r="2.6" fill="${INK}"/>`,
    } : {
      dot: bigEye(87, 91) + bigEye(113, 91),
      happy: line('M80.5 94 Q87 84.5 93.5 94', 4) + line('M106.5 94 Q113 84.5 119.5 94', 4),
      closed: line('M80.5 90 Q87 97 93.5 90', 4) + line('M106.5 90 Q113 97 119.5 90', 4),
      down: bigEye(86, 94) + bigEye(112, 94),
    };
    const mouths = {
      smile: line('M95 107 Q100 111 105 107', 3),
      open: `<path d="M93.5 105 Q100 117 106.5 105 Z" fill="${INK}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`,
      o: `<ellipse cx="100" cy="108" rx="2.6" ry="3" fill="none" stroke="${INK}" stroke-width="2.6"/>`,
      tiny: line('M97.5 108 Q100 109.5 102.5 108', 2.6),
    };
    const lift = L.hair === 'curly' ? -8 : 0;
    const headNote = () =>
      `<g class="head-note" transform="translate(0 ${lift}) rotate(-9 100 22)"><rect x="84" y="6" width="32" height="28" rx="2" fill="${L.note}" stroke="${INK}" stroke-width="3.5"/>` +
      line('M90 16 L110 16 M90 23 L104 23', 2.4) + `</g>`;

    const head = (eye, mouth, opts = {}) =>
      `<g class="head"${opts.tilt ? ` transform="rotate(${opts.tilt} 100 110)"` : ''}>` +
      (headHair ? hairBack : '') + face + bangs + bun + blush + glasses + eyes[eye] + mouths[mouth] + (opts.noNote ? '' : headNote()) + `</g>`;

    return { limb, head, body: ponyTail + (headHair ? '' : hairBack) + neck + shirt };
  }

  const sparkle = (x, y, s = 1) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -10 Q2 -2 10 0 Q2 2 0 10 Q-2 2 -10 0 Q-2 -2 0 -10 Z" fill="#FFD84D" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;

  const poses = {
    idle: ({ limb, head, body }) =>
      body + limb('M66 150 Q57 178 62 206') + limb('M134 150 Q143 178 138 206') + head('dot', 'smile'),

    wave: ({ limb, head, body }) =>
      body + limb('M66 150 Q57 178 62 206') + limb('M134 150 Q156 136 160 104', 'wave-arm') + head('happy', 'open') +
      `<g class="wave-lines">${line('M172 92 l9 -5', 3)}${line('M175 104 l10 0', 3)}</g>`,

    write: ({ limb, head, body }, c) =>
      body +
      `<g transform="rotate(-5 100 186)"><rect x="76" y="166" width="50" height="38" rx="2" fill="${c || '#FFC6D3'}" stroke="${INK}" stroke-width="3.5"/>` +
      line('M84 178 L116 178 M84 188 L108 188', 2.4) + `</g>` +
      limb('M66 150 Q68 182 88 190') +
      `<g class="pencil"><path d="M114 186 L128 156" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M114 186 L128 156" stroke="#FFD84D" stroke-width="4" stroke-linecap="round"/></g>` +
      limb('M134 150 Q138 176 116 184') + head('down', 'tiny'),

    cheer: ({ limb, head, body }) =>
      body + limb('M66 150 Q46 128 44 96') + limb('M134 150 Q154 128 156 96') + head('happy', 'open') +
      sparkle(24, 70, 1.1) + sparkle(178, 62, 0.9) + sparkle(32, 130, 0.7) + sparkle(170, 130, 0.75),

    carry: ({ limb, head, body }, c) =>
      body +
      `<g class="lifted"><rect x="58" y="-8" width="84" height="56" rx="3" fill="${c || '#BDE3FF'}" stroke="${INK}" stroke-width="4" transform="rotate(3 100 20)"/>` +
      line('M72 12 L124 14 M72 26 L112 28', 2.6) + `</g>` +
      limb('M66 150 Q42 112 64 46') + limb('M134 150 Q158 112 136 46') + head('dot', 'o', { noNote: true }),

    sleep: ({ limb, head, body }) =>
      body + limb('M66 150 Q70 186 96 192') + limb('M134 150 Q130 186 104 192') + head('closed', 'o', { tilt: -9 }) +
      `<g class="zzz" font-family="Mali, sans-serif" font-weight="700" fill="${INK}">` +
      `<text x="146" y="54" font-size="22">Z</text><text x="164" y="34" font-size="16">z</text><text x="176" y="18" font-size="12">z</text></g>`,

    drink: ({ limb, head, body }) =>
      body + limb('M66 150 Q57 178 62 206') + limb('M134 150 Q156 148 148 128') +
      `<path d="M137 98 L157 98 L154 130 L140 130 Z" fill="#fff" fill-opacity=".75" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>` +
      `<path d="M138.6 108 L155.4 108 L154 128.6 L141.2 128.6 Z" fill="#9ED4F5"/>` +
      line('M143 113 L143 122', 2.2) +
      head('happy', 'smile'),

    tea: ({ limb, head, body }) =>
      body +
      `<g class="steam">${line('M94 158 q-5 -6 0 -12 q5 -6 0 -12', 3)}${line('M106 160 q-5 -6 0 -12 q5 -6 0 -12', 3)}</g>` +
      `<rect x="86" y="166" width="28" height="28" rx="5" fill="#fff" stroke="${INK}" stroke-width="3.5"/>` +
      `<path d="M114 172 q10 0 10 8 q0 8 -10 8" fill="none" stroke="${INK}" stroke-width="3.5"/>` +
      `<rect x="86" y="172" width="28" height="7" fill="#C9F0C2"/>` +
      limb('M66 150 Q68 182 88 182') + limb('M134 150 Q132 182 112 184') + head('happy', 'smile'),
  };

  window.Character = {
    DEFAULT_LOOK,
    render(pose, color, look) {
      const L = { ...DEFAULT_LOOK, ...(look || {}) };
      const fn = poses[pose] || poses.idle;
      return `<svg viewBox="0 -16 200 240" xmlns="http://www.w3.org/2000/svg" class="pose-${pose}" aria-hidden="true">${fn(parts(L), color)}</svg>`;
    },
    // head-and-shoulders preview, used for the hairstyle picker
    thumb(look) {
      const L = { ...DEFAULT_LOOK, ...(look || {}) };
      return `<svg viewBox="46 -12 108 136" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${poses.idle(parts(L))}</svg>`;
    },
    poses: Object.keys(poses),
  };
})();
