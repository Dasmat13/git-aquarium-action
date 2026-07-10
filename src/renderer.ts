import { AquariumData, CoralData, FishData, TreasureData } from './aquarium';

const W       = 900;
const H       = 260;
const SEABED  = 225;   // y-coordinate of seabed
const TILE_W  = W / 52; // ≈ 17.3px per column

export function renderSVG(aq: AquariumData, username: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"
     style="border-radius:12px;overflow:hidden;background:#031c20">
  <defs>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${aq.waterColorTop}"/>
      <stop offset="100%" stop-color="${aq.waterColorBottom}"/>
    </linearGradient>
    <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${aq.sandColor}"/>
      <stop offset="100%" stop-color="#8c774b"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Water -->
  <rect width="${W}" height="${H}" fill="url(#water)"/>

  <!-- Algae overlay if polluted -->
  ${aq.hasAlgaePollution ? `<rect width="${W}" height="${H}" fill="rgba(46,204,113,0.12)" style="mix-blend-mode:color-burn"/>` : ''}

  <!-- Sun Rays / Light shafts -->
  <polygon points="150,0 220,0 380,260 250,260" fill="rgba(255,255,255,0.06)" />
  <polygon points="500,0 600,0 750,260 600,260" fill="rgba(255,255,255,0.04)" />

  <!-- Bubbles rising -->
  ${renderBubbles(aq)}

  <!-- Treasures on seabed -->
  ${aq.treasures.map(t => renderTreasure(t)).join('\n  ')}

  <!-- Corals & Plants -->
  ${aq.corals.map(c => renderCoral(c, aq)).join('\n  ')}

  <!-- Swimming fishes -->
  ${aq.fishes.map(f => renderFish(f)).join('\n  ')}

  <!-- Seabed / Sand -->
  <path d="M 0,${SEABED} Q 225,${SEABED - 8} 450,${SEABED} T 900,${SEABED} L 900,${H} L 0,${H} Z" fill="url(#sand)"/>

  <!-- HUD label -->
  ${renderHUD(aq, username)}

  <style>${renderCSS(aq)}</style>
</svg>`;
}

// ─── Bubbles generator ──────────────────────────────────────
function renderBubbles(aq: AquariumData): string {
  const bubbles: string[] = [];
  const seed = aq.username.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = aq.hasAlgaePollution ? 40 : 20;

  for (let i = 0; i < count; i++) {
    const x = ((seed * (i + 1) * 37) % W);
    const r = 2 + (i % 4);
    const delay = (i * 0.4) % 6;
    const dur = 4 + (i % 4);

    bubbles.push(`
      <circle class="bubble" cx="${x}" cy="${SEABED + 10}" r="${r}" 
        fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.4)" stroke-width="0.5"
        style="animation-delay:${delay}s; animation-duration:${dur}s"/>
    `);
  }
  return bubbles.join('\n');
}

// ─── Treasure Chest ──────────────────────────────────────────
function renderTreasure(t: TreasureData): string {
  const y = SEABED - 10;
  return `
    <g transform="translate(${t.x}, ${y}) scale(${t.scale})" class="treasure">
      <!-- Chest base -->
      <rect x="-12" y="0" width="24" height="12" fill="#5a3825" rx="1" stroke="#3d2214" stroke-width="1"/>
      <rect x="-10" y="2" width="20" height="2" fill="#d4af37"/>
      <!-- Chest Lid -->
      <path d="M -12,0 C -12,-8 12,-8 12,0 Z" fill="#5a3825" stroke="#3d2214" stroke-width="1"/>
      <path d="M -10,-2 C -10,-6 10,-6 10,-2" fill="none" stroke="#d4af37" stroke-width="1"/>
      <!-- Keyhole -->
      <circle cx="0" cy="4" r="1.5" fill="#111"/>
      <!-- Gold glow effect -->
      <circle cx="0" cy="-2" r="6" fill="rgba(212, 175, 55, 0.4)" filter="url(#glow)"/>
      <circle class="gold-sparkle" cx="-6" cy="-8" r="1" fill="#fff" />
      <circle class="gold-sparkle" cx="6" cy="-10" r="1" fill="#fff" style="animation-delay:0.5s" />
    </g>
  `;
}

// ─── Coral & Plant Renderer ─────────────────────────────────
function renderCoral(coral: CoralData, aq: AquariumData): string {
  if (coral.height === 0) return '';
  
  const x = coral.weekIdx * TILE_W + TILE_W / 2;
  const y = SEABED - 2;
  const h = coral.height;
  const col = coral.color;

  let path = '';

  switch (coral.coralType) {
    case 'seaweed':
      // Waving tall blade of grass/kelp
      path = `
        <path class="seaweed" d="M ${x},${y} Q ${x - 5},${y - h/2} ${x},${y - h} T ${x + 5},${y - h - 10}" 
          fill="none" stroke="${col}" stroke-width="3.5" stroke-linecap="round" 
          style="animation-delay:${(coral.weekIdx * 0.1).toFixed(2)}s"/>
      `;
      break;

    case 'branching':
      // Branching coral tree
      path = `
        <g class="coral-plant" style="animation-delay:${(coral.weekIdx * 0.15).toFixed(2)}s">
          <!-- Main trunk -->
          <line x1="${x}" y1="${y}" x2="${x}" y2="${y - h * 0.4}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>
          <!-- Left branch -->
          <path d="M ${x},${y - h * 0.3} Q ${x - 12},${y - h * 0.5} ${x - 10},${y - h * 0.8}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Right branch -->
          <path d="M ${x},${y - h * 0.4} Q ${x + 12},${y - h * 0.6} ${x + 8},${y - h}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Small sub-branches -->
          <line x1="${x - 7}" y1="${y - h * 0.6}" x2="${x - 14}" y2="${y - h * 0.7}" stroke="${col}" stroke-width="2" stroke-linecap="round"/>
          <line x1="${x + 6}" y1="${y - h * 0.7}" x2="${x + 12}" y2="${y - h * 0.85}" stroke="${col}" stroke-width="2" stroke-linecap="round"/>
        </g>
      `;
      break;

    case 'fan':
      // Fan shaped sea plant
      const pts = [
        `${x},${y}`,
        `${x - 15},${y - h}`,
        `${x - 8},${y - h - 12}`,
        `${x},${y - h - 5}`,
        `${x + 8},${y - h - 12}`,
        `${x + 15},${y - h}`,
      ].join(' ');
      path = `
        <polygon class="sea-fan" points="${pts}" fill="${col}" opacity="0.85" 
          style="animation-delay:${(coral.weekIdx * 0.2).toFixed(2)}s"/>
      `;
      break;

    case 'bulbous':
      // Stacking round bulbs
      path = `
        <g class="coral-plant" style="animation-delay:${(coral.weekIdx * 0.08).toFixed(2)}s">
          <circle cx="${x}" cy="${y - 6}" r="7" fill="${col}"/>
          <circle cx="${x - 4}" cy="${y - 14}" r="5" fill="${col}"/>
          <circle cx="${x + 5}" cy="${y - 18}" r="4" fill="${col}"/>
          <circle cx="${x}" cy="${y - 25}" r="3" fill="${col}"/>
        </g>
      `;
      break;
  }

  // Add bioluminescent spots if high streak
  if (coral.hasBulbs && aq.bioluminescence > 0.3) {
    path += `
      <circle class="glow-node" cx="${x}" cy="${y - h * 0.8}" r="2" fill="#fff" filter="url(#glow)" />
      <circle class="glow-node" cx="${x - 8}" cy="${y - h * 0.6}" r="1.5" fill="#a3e4d7" filter="url(#glow)" style="animation-delay:0.7s"/>
    `;
  }

  return path;
}

// ─── Fish Renderer ──────────────────────────────────────────
function renderFish(fish: FishData): string {
  const h = fish.size;
  const w = h * 1.5;

  if (fish.type === 'jellyfish') {
    return `
      <g class="jellyfish" style="animation-duration:${fish.speed}s; animation-delay:${fish.delay}s; transform: translate(${fish.y + 100}px, 0px)">
        <!-- Tentacles -->
        <path class="tentacle" d="M -4,0 Q -6,15 -3,30" fill="none" stroke="${fish.color2}" stroke-width="1.5"/>
        <path class="tentacle" d="M 0,0 Q 0,18 2,32" fill="none" stroke="${fish.color1}" stroke-width="1.5" style="animation-delay:0.3s"/>
        <path class="tentacle" d="M 4,0 Q 6,15 3,30" fill="none" stroke="${fish.color2}" stroke-width="1.5" style="animation-delay:0.6s"/>
        <!-- Bell / Body -->
        <path d="M -8,0 C -8,-10 8,-10 8,0 Z" fill="${fish.color1}" filter="url(#glow)"/>
      </g>
    `;
  }

  if (fish.type === 'shark') {
    return `
      <g class="fish shark-swim" style="animation-duration:${fish.speed}s; animation-delay:${fish.delay}s">
        <!-- Body -->
        <path d="M -30,0 C -15,-10 15,-10 30,0 C 15,10 -15,10 -30,0 Z" fill="#4a6572"/>
        <!-- Dorsal Fin -->
        <path d="M -5,-5 L 5,-20 L 10,-3 Z" fill="#34495e"/>
        <!-- Tail -->
        <path class="fish-tail" d="M -30,0 L -42,-12 L -38,0 L -42,12 Z" fill="#34495e"/>
        <!-- Eye -->
        <circle cx="18" cy="-2" r="1.5" fill="#fff"/>
        <circle cx="19" cy="-2" r="0.7" fill="#000"/>
      </g>
    `;
  }

  // Classic Fish (goldfish, clownfish, angelfish)
  return `
    <g class="fish fish-swim" style="animation-duration:${fish.speed}s; animation-delay:${fish.delay}s; transform: scale(${fish.size / 20})">
      <!-- Tail fin -->
      <path class="fish-tail" d="M -12,0 L -22,-8 L -18,0 L -22,8 Z" fill="${fish.color2}"/>
      <!-- Pectoral Fin -->
      <path d="M -2,4 L -6,10 L -4,3 Z" fill="${fish.color2}"/>
      <!-- Body -->
      <path d="M -12,0 C -6,-8 6,-8 14,0 C 6,8 -6,8 -12,0 Z" fill="${fish.color1}"/>
      <!-- Stripes (for clownfish style) -->
      ${fish.type === 'clownfish' ? `
        <path d="M -3,-5 L -3,5 M 4,-4 L 4,4" stroke="#ffffff" stroke-width="2.5"/>
      ` : ''}
      <!-- Eye -->
      <circle cx="8" cy="-2" r="1.5" fill="#ffffff"/>
      <circle cx="9" cy="-2" r="0.7" fill="#000000"/>
    </g>
  `;
}

// ─── HUD Label ──────────────────────────────────────────────
function renderHUD(aq: AquariumData, username: string): string {
  return `
  <g>
    <rect x="8" y="8" width="220" height="22" rx="4" fill="rgba(0,0,0,0.5)"/>
    <text x="14" y="22" font-family="monospace" font-size="10" fill="#fff" font-weight="bold">
      🪸 ${username}'s Aquarium · ${aq.totalContributions} commits
    </text>
  </g>
  <g>
    <rect x="${W - 128}" y="8" width="120" height="22" rx="4" fill="rgba(0,0,0,0.5)"/>
    <text x="${W - 122}" y="22" font-family="monospace" font-size="10" fill="#a2f0ff">
      🐠 ${aq.totalStars} stars · ${aq.streak}d streak
    </text>
  </g>`;
}

// ─── CSS Styles & Animations ─────────────────────────────────
function renderCSS(aq: AquariumData): string {
  return `
    /* Fish swimming from left to right (looping) */
    .fish-swim {
      animation: swim-r 12s linear infinite;
      position: absolute;
    }
    @keyframes swim-r {
      0%   { transform: translate(-100px, 100px) scale(0.8) scaleX(1); }
      48%  { transform: translate(${W + 50}px, 60px) scale(0.8) scaleX(1); }
      /* Turn around and swim back left (subtle layering) */
      50%  { transform: translate(${W + 50}px, 60px) scale(0.8) scaleX(-1); }
      98%  { transform: translate(-100px, 100px) scale(0.8) scaleX(-1); }
      100% { transform: translate(-100px, 100px) scale(0.8) scaleX(1); }
    }

    /* Shark swimming (faster, deeper) */
    .shark-swim {
      animation: shark-r 20s linear infinite;
    }
    @keyframes shark-r {
      0%   { transform: translate(-150px, 120px) scaleX(1); }
      48%  { transform: translate(${W + 150}px, 150px) scaleX(1); }
      50%  { transform: translate(${W + 150}px, 150px) scaleX(-1); }
      98%  { transform: translate(-150px, 120px) scaleX(-1); }
      100% { transform: translate(-150px, 120px) scaleX(1); }
    }

    /* Wiggling fish tail */
    .fish-tail {
      animation: wiggle 0.25s ease-in-out infinite alternate;
      transform-origin: -12px 0px;
    }
    @keyframes wiggle {
      from { transform: rotate(-8deg); }
      to   { transform: rotate(8deg); }
    }

    /* Jellyfish bobbing and rising/falling */
    .jellyfish {
      animation: bob 8s ease-in-out infinite;
      position: absolute;
    }
    @keyframes bob {
      0%, 100% { transform: translate(300px, 40px); }
      50%      { transform: translate(320px, 130px); }
    }
    .tentacle {
      animation: wave-tentacle 1.5s ease-in-out infinite alternate;
      transform-origin: top center;
    }
    @keyframes wave-tentacle {
      from { transform: rotate(-5deg); }
      to   { transform: rotate(5deg); }
    }

    /* Seaweed/Kelp waving in currents */
    .seaweed {
      animation: wave-grass 4s ease-in-out infinite alternate;
      transform-origin: bottom center;
    }
    @keyframes wave-grass {
      from { transform: skewX(-6deg) scaleY(0.98); }
      to   { transform: skewX(6deg) scaleY(1.02); }
    }

    .coral-plant {
      animation: wave-coral 6s ease-in-out infinite alternate;
      transform-origin: bottom center;
    }
    @keyframes wave-coral {
      from { transform: rotate(-3deg); }
      to   { transform: rotate(3deg); }
    }

    .sea-fan {
      animation: wave-fan 5s ease-in-out infinite alternate;
      transform-origin: bottom center;
    }
    @keyframes wave-fan {
      from { transform: scaleX(0.95) skewX(-2deg); }
      to   { transform: scaleX(1.05) skewX(2deg); }
    }

    /* Bubbles rising animation */
    .bubble {
      animation: rise-bubble 5s linear infinite;
    }
    @keyframes rise-bubble {
      0%   { transform: translateY(0px) translateX(0px); opacity: 0; }
      10%  { opacity: 0.6; }
      90%  { opacity: 0.6; }
      100% { transform: translateY(-240px) translateX(15px); opacity: 0; }
    }

    /* Gold Sparkles */
    .gold-sparkle {
      animation: sparkle 2s ease-in-out infinite alternate;
    }
    @keyframes sparkle {
      0% { opacity: 0.2; transform: scale(0.8); }
      100% { opacity: 1; transform: scale(1.2); }
    }

    /* Bioluminescence nodes flashing */
    .glow-node {
      animation: biolum 4s ease-in-out infinite alternate;
    }
    @keyframes biolum {
      0%   { opacity: 0.2; filter: brightness(0.6); }
      100% { opacity: 1; filter: brightness(1.5); }
    }
  `;
}
