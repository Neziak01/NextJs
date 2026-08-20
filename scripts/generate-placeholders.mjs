/**
 * Génère les photos placeholder de WILD GYM.
 *
 * Chaque image est composée en SVG — dégradé de lumière, couches successives
 * de végétation tropicale (perspective atmosphérique + flou de profondeur),
 * agrès en bois en silhouette — puis rastérisée en JPEG avec un grain
 * argentique dans public/images. Aucun service d'images externe.
 *
 *   node scripts/generate-placeholders.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(process.cwd(), "public", "images");

/* ------------------------------------------------------------------ utils */

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const between = (r, min, max) => min + r() * (max - min);
const pick = (r, list) => list[Math.min(list.length - 1, Math.floor(r() * list.length))];
const n = (v) => Math.round(v * 100) / 100;

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const to = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${to(r1, r2)}${to(g1, g2)}${to(b1, b2)}`;
};
/** Variation de teinte, pour éviter les aplats trop « vectoriels ». */
const vary = (r, base, tint, amount = 0.18) => mix(base, tint, between(r, 0, amount));

/* --------------------------------------------------------------- palettes */

const MOODS = {
  dawn: {
    sky: ["#ffe6b0", "#f0bd7a", "#a98a4e", "#3f4a2a"],
    glow: "#fff0cc",
    fog: "#d8c99b",
    canopy: "#3d5230",
    mid: "#24361f",
    near: "#0b120a",
    tint: "#d9c98f",
    ground: "#5b4026",
    prop: "#150e07",
    ray: "#ffeec9",
    rayOpacity: 0.13,
  },
  day: {
    sky: ["#e8f6c6", "#a9ce7e", "#5b8b46", "#22401d"],
    glow: "#f6ffd8",
    fog: "#b9d094",
    canopy: "#33632f",
    mid: "#1d3d1c",
    near: "#08130a",
    tint: "#cfe6a0",
    ground: "#57401f",
    prop: "#0f1408",
    ray: "#f4ffd9",
    rayOpacity: 0.1,
  },
  dusk: {
    sky: ["#f2b169", "#c9773a", "#7a5a2e", "#2b2a18"],
    glow: "#ffcf94",
    fog: "#c39763",
    canopy: "#3a4227",
    mid: "#1f2617",
    near: "#090c07",
    tint: "#e0a967",
    ground: "#432d18",
    prop: "#110b06",
    ray: "#ffd8a2",
    rayOpacity: 0.14,
  },
  deep: {
    sky: ["#bfe09a", "#74a85c", "#2f6033", "#0e2411"],
    glow: "#dcf5b4",
    fog: "#8fb271",
    canopy: "#2b5b2c",
    mid: "#15301a",
    near: "#050d07",
    tint: "#a9d183",
    ground: "#3c2c18",
    prop: "#0a1008",
    ray: "#e9ffcd",
    rayOpacity: 0.09,
  },
};

/* ----------------------------------------------------------- la végétation */

/** Palme : nervure courbe garnie de folioles effilées. */
function palm(r, { x, y, len, angle, fill, opacity = 1, blur }) {
  const parts = [];
  const count = Math.round(between(r, 20, 30));
  const curve = between(r, -0.42, 0.42);
  const droop = between(r, 0.5, 1);
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    const px = t * len;
    const py = curve * len * t * t;
    const l = Math.sin(Math.pow(t, 0.75) * Math.PI) * len * between(r, 0.2, 0.3) + 3;
    const tilt = 26 + t * 40 * droop;
    for (const s of [-1, 1]) {
      parts.push(
        `<path d="M0 0 Q ${n(l * 0.55)} ${n(-l * 0.16)} ${n(l)} ${n(l * 0.1)} Q ${n(l * 0.5)} ${n(l * 0.06)} 0 ${n(l * 0.035)} Z"
           transform="translate(${n(px)} ${n(py)}) rotate(${n(s * tilt)}) scale(1 ${s})"/>`,
      );
    }
  }
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})" fill="${fill}" opacity="${n(opacity)}"${
    blur ? ` filter="url(#${blur})"` : ""
  }>
      <path d="M0 0 Q ${n(len * 0.5)} ${n(curve * len * 0.25)} ${n(len)} ${n(curve * len)}"
        stroke="${fill}" stroke-width="${n(len * 0.018)}" fill="none"/>${parts.join("")}</g>`;
}

/** Monstera : feuille pleine percée de fentes effilées. */
function monstera(r, { x, y, size, angle, fill, opacity = 1, blur }, defs) {
  const id = `k${defs.length}`;
  const slits = [];
  const rows = Math.round(between(r, 5, 8));
  for (let i = 1; i <= rows; i++) {
    const t = i / (rows + 1);
    const py = -size * 1.0 + t * size * 1.9;
    const w = size * between(r, 0.5, 0.9) * Math.sin(t * Math.PI * 0.9 + 0.25);
    const h = size * between(r, 0.05, 0.085);
    for (const s of [-1, 1]) {
      slits.push(
        `<path d="M0 ${n(-h * 0.7)} L ${n(w)} ${n(-h)} L ${n(w)} ${n(h)} L 0 ${n(h * 0.7)} Z"
           transform="translate(0 ${n(py)}) rotate(${n(s * between(r, 8, 20))}) scale(${s} 1)"/>`,
      );
    }
  }
  defs.push(
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000">
      <rect x="-3000" y="-3000" width="6000" height="6000" fill="#fff"/><g fill="#000">${slits.join("")}</g></mask>`,
  );
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})" opacity="${n(opacity)}"${
    blur ? ` filter="url(#${blur})"` : ""
  }>
      <g mask="url(#${id})" fill="${fill}">
        <path d="M0 ${n(size * 1.05)} C ${n(-size * 1.15)} ${n(size * 0.4)} ${n(-size * 1)} ${n(-size * 0.95)} 0 ${n(-size * 1.2)}
                 C ${n(size)} ${n(-size * 0.95)} ${n(size * 1.15)} ${n(size * 0.4)} 0 ${n(size * 1.05)} Z"/>
      </g>
      <path d="M0 ${n(size * 1.05)} L 0 ${n(-size * 1.15)}" stroke="${fill}" stroke-width="${n(size * 0.05)}" opacity="0.85"/>
    </g>`;
}

/** Feuille de bananier : longue lame nervurée, parfois déchirée. */
function banana(r, { x, y, size, angle, fill, opacity = 1, blur }) {
  const veins = [];
  const count = Math.round(between(r, 11, 16));
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const py = -size + t * size * 2;
    const w = Math.sin(t * Math.PI) * size * 0.6;
    veins.push(
      `<path d="M0 ${n(py)} L ${n(w)} ${n(py + size * 0.17)}" stroke="#000" stroke-opacity="0.3" stroke-width="${n(size * 0.018)}"/>` +
        `<path d="M0 ${n(py)} L ${n(-w)} ${n(py + size * 0.17)}" stroke="#000" stroke-opacity="0.3" stroke-width="${n(size * 0.018)}"/>`,
    );
  }
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})" opacity="${n(opacity)}"${
    blur ? ` filter="url(#${blur})"` : ""
  }>
      <path d="M0 ${n(size)} C ${n(-size * 0.66)} ${n(size * 0.3)} ${n(-size * 0.6)} ${n(-size * 0.6)} 0 ${n(-size)}
               C ${n(size * 0.6)} ${n(-size * 0.6)} ${n(size * 0.66)} ${n(size * 0.3)} 0 ${n(size)} Z" fill="${fill}"/>
      ${veins.join("")}
      <path d="M0 ${n(size)} L 0 ${n(-size)}" stroke="#000" stroke-opacity="0.25" stroke-width="${n(size * 0.035)}"/>
    </g>`;
}

/** Fougère / touffe d'herbe haute. */
function fern(r, { x, y, len, angle, fill, opacity = 1, blur }) {
  const parts = [];
  const count = Math.round(between(r, 16, 24));
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    const px = t * len;
    const s2 = (1 - t * 0.85) * len * 0.14 + 1.5;
    for (const s of [-1, 1]) {
      parts.push(
        `<ellipse cx="${n(px)}" cy="${n(s * s2 * 0.8)}" rx="${n(s2)}" ry="${n(s2 * 0.38)}"
           transform="rotate(${n(s * 28)} ${n(px)} 0)"/>`,
      );
    }
  }
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})" fill="${fill}" opacity="${n(opacity)}"${
    blur ? ` filter="url(#${blur})"` : ""
  }><rect x="0" y="${n(-len * 0.007)}" width="${n(len)}" height="${n(len * 0.014)}"/>${parts.join("")}</g>`;
}

/** Brins d'herbe fins, pour l'avant-plan au sol. */
function grass(r, { x, y, h, fill, opacity = 1, blur }) {
  const blades = [];
  for (let i = 0; i < Math.round(between(r, 12, 22)); i++) {
    const dx = between(r, -h * 0.5, h * 0.5);
    const bh = between(r, h * 0.45, h);
    const bend = between(r, -h * 0.35, h * 0.35);
    blades.push(
      `<path d="M${n(dx)} 0 Q ${n(dx + bend * 0.4)} ${n(-bh * 0.6)} ${n(dx + bend)} ${n(-bh)} L ${n(dx + bend * 0.9)} ${n(-bh)} Q ${n(dx + bend * 0.2)} ${n(-bh * 0.55)} ${n(dx + h * 0.035)} 0 Z"/>`,
    );
  }
  return `<g transform="translate(${n(x)} ${n(y)})" fill="${fill}" opacity="${n(opacity)}"${
    blur ? ` filter="url(#${blur})"` : ""
  }>${blades.join("")}</g>`;
}

/** Buisson : agrégat de feuilles autour d'un point. */
function bush(r, { x, y, size, fill, opacity = 1, blur }, defs) {
  const out = [];
  for (let i = 0; i < Math.round(between(r, 5, 9)); i++) {
    const a = between(r, -180, 180);
    const dx = x + between(r, -size * 0.5, size * 0.5);
    const dy = y + between(r, -size * 0.35, size * 0.25);
    const kind = pick(r, ["palm", "fern", "banana", "monstera"]);
    const o = { fill, opacity, blur };
    if (kind === "palm") out.push(palm(r, { x: dx, y: dy, len: size * between(r, 0.6, 1.1), angle: a, ...o }));
    else if (kind === "fern") out.push(fern(r, { x: dx, y: dy, len: size * between(r, 0.5, 0.9), angle: a, ...o }));
    else if (kind === "banana")
      out.push(banana(r, { x: dx, y: dy, size: size * between(r, 0.3, 0.5), angle: between(r, -80, 80), ...o }));
    else out.push(monstera(r, { x: dx, y: dy, size: size * between(r, 0.2, 0.34), angle: between(r, -55, 55), ...o }, defs));
  }
  return out.join("");
}

/** Tronc / bambou avec veinage vertical. */
function trunk(r, { x, y, w, h, fill, opacity = 1, bamboo = false, blur }) {
  const grain = [];
  for (let i = 0; i < 7; i++) {
    const gx = between(r, w * 0.1, w * 0.85);
    grain.push(
      `<rect x="${n(gx)}" y="0" width="${n(w * between(r, 0.03, 0.09))}" height="${n(h)}" fill="#000" fill-opacity="${n(between(r, 0.12, 0.3))}"/>`,
    );
  }
  if (bamboo) {
    const gap = h * between(r, 0.11, 0.17);
    for (let i = 1; i * gap < h; i++) {
      grain.push(
        `<rect x="${n(-w * 0.14)}" y="${n(h - i * gap)}" width="${n(w * 1.28)}" height="${n(w * 0.18)}" rx="${n(w * 0.09)}" fill="#000" fill-opacity="0.32"/>`,
      );
    }
  }
  const lean = between(r, -4, 4);
  return `<g transform="translate(${n(x)} ${n(y - h)}) rotate(${n(lean)} ${n(w / 2)} ${n(h)})" opacity="${n(opacity)}"${
    blur ? ` filter="url(#${blur})"` : ""
  }>
      <path d="M0 ${n(h)} L ${n(w * 0.14)} 0 L ${n(w * 0.86)} 0 L ${n(w)} ${n(h)} Z" fill="${fill}"/>
      <rect x="0" y="0" width="${n(w * 0.35)}" height="${n(h)}" fill="#fff" fill-opacity="0.06"/>
      ${grain.join("")}
    </g>`;
}

/* -------------------------------------------------------------- les agrès */

/** Portique en bois : montants, barre de traction, anneaux, corde, sacs. */
function rig(r, { x, y, w, h, fill }) {
  const post = w * 0.05;
  const parts = [
    `<rect x="0" y="0" width="${n(post)}" height="${n(h)}"/>`,
    `<rect x="${n(w - post)}" y="0" width="${n(post)}" height="${n(h)}"/>`,
    `<rect x="${n(w * 0.5 - post * 0.4)}" y="0" width="${n(post * 0.8)}" height="${n(h)}"/>`,
    `<rect x="${n(-post * 0.5)}" y="0" width="${n(w + post)}" height="${n(post * 0.85)}" rx="${n(post * 0.25)}"/>`,
    `<rect x="${n(-post * 0.5)}" y="${n(h * 0.3)}" width="${n(w + post)}" height="${n(post * 0.62)}" rx="${n(post * 0.25)}"/>`,
    `<path d="M${n(post)} ${n(post * 0.85)} L ${n(w * 0.19)} ${n(h * 0.14)} L ${n(post)} ${n(h * 0.14)} Z"/>`,
    `<path d="M${n(w - post)} ${n(post * 0.85)} L ${n(w * 0.81)} ${n(h * 0.14)} L ${n(w - post)} ${n(h * 0.14)} Z"/>`,
  ];
  for (const rx of [0.63, 0.72]) {
    parts.push(
      `<rect x="${n(w * rx)}" y="${n(post * 0.8)}" width="${n(post * 0.16)}" height="${n(h * 0.28)}"/>`,
      `<circle cx="${n(w * rx + post * 0.08)}" cy="${n(h * 0.32)}" r="${n(h * 0.042)}" fill="none" stroke="${fill}" stroke-width="${n(post * 0.26)}"/>`,
    );
  }
  parts.push(
    `<path d="M${n(w * 0.24)} ${n(post * 0.8)} q ${n(w * 0.04)} ${n(h * 0.22)} ${n(-w * 0.015)} ${n(h * 0.42)} q ${n(-w * 0.04)} ${n(h * 0.2)} ${n(w * 0.025)} ${n(h * 0.33)}"
       fill="none" stroke="${fill}" stroke-width="${n(post * 0.42)}"/>`,
    `<rect x="${n(w * 0.06)}" y="${n(h - post * 2.4)}" width="${n(post * 3)}" height="${n(post * 2.4)}" rx="${n(post * 0.5)}"/>`,
    `<rect x="${n(w * 0.06 + post * 0.3)}" y="${n(h - post * 3.1)}" width="${n(post * 2.4)}" height="${n(post * 0.75)}" rx="${n(post * 0.3)}"/>`,
    `<circle cx="${n(w * 0.93)}" cy="${n(h - post)}" r="${n(post)}"/>`,
    `<path d="M${n(w * 0.93 - post * 0.62)} ${n(h - post * 1.5)} a ${n(post * 0.62)} ${n(post * 0.62)} 0 0 1 ${n(post * 1.24)} 0"
       fill="none" stroke="${fill}" stroke-width="${n(post * 0.3)}"/>`,
    `<rect x="${n(w * 0.36)}" y="${n(h - post * 0.55)}" width="${n(w * 0.2)}" height="${n(post * 0.3)}" rx="${n(post * 0.15)}"/>`,
    `<circle cx="${n(w * 0.36)}" cy="${n(h - post * 0.4)}" r="${n(post * 0.55)}"/>`,
    `<circle cx="${n(w * 0.56)}" cy="${n(h - post * 0.4)}" r="${n(post * 0.55)}"/>`,
  );
  return `<g transform="translate(${n(x)} ${n(y - h)})" fill="${fill}">${parts.join("")}</g>`;
}

/** Deck de yoga en bois sur pilotis, garde-corps de bambou et tapis roulés. */
function deck(r, { x, y, w, h, fill }) {
  const top = h * 0.42; // hauteur du plateau au-dessus du sol
  const planks = [];
  const count = 12;
  for (let i = 0; i < count; i++) {
    planks.push(
      `<rect x="${n((i * w) / count)}" y="0" width="${n(w / count - w * 0.006)}" height="${n(h * 0.055)}"/>`,
    );
  }
  const legs = [0.05, 0.33, 0.63, 0.93].map(
    (t) => `<rect x="${n(w * t)}" y="${n(h * 0.055)}" width="${n(w * 0.026)}" height="${n(top)}"/>`,
  );
  // entretoises
  legs.push(
    `<rect x="${n(w * 0.05)}" y="${n(h * 0.055 + top * 0.55)}" width="${n(w * 0.9)}" height="${n(w * 0.012)}"/>`,
  );
  // garde-corps arrière
  const rail = [
    `<rect x="0" y="${n(-h * 0.2)}" width="${n(w)}" height="${n(w * 0.018)}"/>`,
    `<rect x="0" y="${n(-h * 0.1)}" width="${n(w)}" height="${n(w * 0.012)}"/>`,
  ];
  for (let i = 0; i <= 14; i++) {
    rail.push(
      `<rect x="${n((i * w) / 14)}" y="${n(-h * 0.2)}" width="${n(w * 0.009)}" height="${n(h * 0.2)}"/>`,
    );
  }
  // tapis roulés + coussin
  const mats = [0.14, 0.3, 0.46].map(
    (t) => `<rect x="${n(w * t)}" y="${n(-h * 0.055)}" width="${n(w * 0.12)}" height="${n(h * 0.055)}" rx="${n(h * 0.027)}"/>`,
  );
  mats.push(
    `<rect x="${n(w * 0.68)}" y="${n(-h * 0.075)}" width="${n(w * 0.16)}" height="${n(h * 0.075)}" rx="${n(h * 0.02)}"/>`,
  );
  // marches
  const steps = [0, 1, 2].map(
    (i) =>
      `<rect x="${n(w * 0.88)}" y="${n(h * 0.055 + top * (0.3 + i * 0.22))}" width="${n(w * 0.16)}" height="${n(w * 0.02)}"/>`,
  );
  return `<g transform="translate(${n(x)} ${n(y - h * 0.055 - top)})" fill="${fill}">
      ${rail.join("")}${mats.join("")}${planks.join("")}${legs.join("")}${steps.join("")}
    </g>`;
}

/** Aire « wild » : pneus, battle ropes, rack de pierres. */
function wildYard(r, { x, y, w, h, fill }) {
  const parts = [];
  for (const [t, s] of [
    [0.05, 1],
    [0.17, 0.86],
    [0.28, 0.72],
  ]) {
    const rr = h * 0.3 * s;
    parts.push(
      `<ellipse cx="${n(w * t)}" cy="${n(h - rr * 0.6)}" rx="${n(rr)}" ry="${n(rr * 1.02)}"/>`,
      `<ellipse cx="${n(w * t)}" cy="${n(h - rr * 0.6)}" rx="${n(rr * 0.42)}" ry="${n(rr * 0.46)}" fill="#c9b48d" fill-opacity="0.14"/>`,
    );
  }
  parts.push(
    `<path d="M${n(w * 0.42)} ${n(h - h * 0.02)} q ${n(w * 0.07)} ${n(-h * 0.4)} ${n(w * 0.14)} ${n(-h * 0.04)} q ${n(w * 0.07)} ${n(h * 0.3)} ${n(w * 0.14)} ${n(-h * 0.02)}"
       fill="none" stroke="${fill}" stroke-width="${n(h * 0.05)}" stroke-linecap="round"/>`,
    `<rect x="${n(w * 0.78)}" y="${n(h * 0.3)}" width="${n(w * 0.03)}" height="${n(h * 0.7)}"/>`,
    `<rect x="${n(w * 0.96)}" y="${n(h * 0.3)}" width="${n(w * 0.03)}" height="${n(h * 0.7)}"/>`,
    `<rect x="${n(w * 0.76)}" y="${n(h * 0.3)}" width="${n(w * 0.24)}" height="${n(h * 0.045)}" rx="${n(h * 0.02)}"/>`,
    `<rect x="${n(w * 0.76)}" y="${n(h * 0.62)}" width="${n(w * 0.24)}" height="${n(h * 0.035)}" rx="${n(h * 0.017)}"/>`,
  );
  for (let i = 0; i < 3; i++) {
    parts.push(
      `<ellipse cx="${n(w * (0.8 + i * 0.06))}" cy="${n(h - h * 0.08)}" rx="${n(h * 0.07)}" ry="${n(h * 0.085)}"/>`,
    );
  }
  return `<g transform="translate(${n(x)} ${n(y - h)})" fill="${fill}">${parts.join("")}</g>`;
}

/** Bassin de pierre alimenté par une canalisation en bambou. */
function stonePool(r, { x, y, w, h, fill }) {
  const parts = [];
  const rimY = h * 0.72;
  const rimRx = w * 0.42;
  const rimRy = h * 0.2;

  // margelle
  parts.push(
    `<ellipse cx="${n(w * 0.5)}" cy="${n(rimY)}" rx="${n(rimRx)}" ry="${n(rimRy)}"/>`,
    `<ellipse cx="${n(w * 0.5)}" cy="${n(rimY + h * 0.02)}" rx="${n(rimRx * 0.78)}" ry="${n(rimRy * 0.72)}" fill="#8fb26a" fill-opacity="0.16"/>`,
  );

  // pierres tout autour
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + between(r, -0.2, 0.2);
    const rr = between(r, w * 0.05, w * 0.1);
    parts.push(
      `<ellipse cx="${n(w * 0.5 + Math.cos(a) * rimRx * between(r, 0.95, 1.15))}"
                cy="${n(rimY + Math.sin(a) * rimRy * between(r, 0.95, 1.2))}"
                rx="${n(rr)}" ry="${n(rr * between(r, 0.55, 0.8))}"/>`,
    );
  }

  // gros rochers à l'arrière-plan
  for (const [t, s2] of [[0.12, 1.3], [0.86, 1.15], [0.66, 0.9]]) {
    const rr = w * 0.09 * s2;
    parts.push(
      `<ellipse cx="${n(w * t)}" cy="${n(rimY - h * 0.12)}" rx="${n(rr)}" ry="${n(rr * 0.8)}"/>`,
    );
  }

  // canalisation de bambou sur son support fourchu
  const spoutX = w * 0.5;
  parts.push(
    `<rect x="${n(spoutX - w * 0.016)}" y="${n(h * 0.2)}" width="${n(w * 0.032)}" height="${n(h * 0.32)}"/>`,
    `<path d="M${n(spoutX - w * 0.016)} ${n(h * 0.22)} l ${n(-w * 0.06)} ${n(-h * 0.07)}" stroke="${fill}" stroke-width="${n(w * 0.02)}"/>`,
    `<g transform="rotate(-24 ${n(spoutX)} ${n(h * 0.22)})">
       <rect x="${n(spoutX - w * 0.26)}" y="${n(h * 0.19)}" width="${n(w * 0.3)}" height="${n(w * 0.035)}" rx="${n(w * 0.017)}"/>
     </g>`,
    `<rect x="${n(spoutX + w * 0.03)}" y="${n(h * 0.3)}" width="${n(w * 0.012)}" height="${n(rimY - h * 0.3)}" fill="#dcf5b4" fill-opacity="0.35"/>`,
  );

  return `<g transform="translate(${n(x)} ${n(y - h)})" fill="${fill}">${parts.join("")}</g>`;
}

const PROPS = { rig, deck, wildYard, stonePool, none: () => "" };

/* ------------------------------------------------------------ composition */

function scene({ w, h, seed, mood = "day", prop = "rig", propScale = 1, density = 1 }) {
  const r = rng(seed);
  const p = MOODS[mood];
  const defs = [];
  const L = [];
  const horizon = h * between(r, 0.66, 0.74);
  const S = w / 1000; // échelle relative à la largeur

  L.push(`<rect width="${w}" height="${h}" fill="url(#sky)"/>`);
  L.push(
    `<ellipse cx="${n(w * between(r, 0.3, 0.7))}" cy="${n(h * between(r, 0.08, 0.22))}" rx="${n(w * 0.55)}" ry="${n(h * 0.45)}" fill="url(#glow)"/>`,
  );

  /* --- Couche 4 : mur de jungle lointain, presque fondu dans la brume --- */
  const farFill = () => vary(r, mix(p.canopy, p.fog, 0.62), p.tint, 0.25);
  for (let i = 0; i < Math.round(26 * density); i++) {
    const x = between(r, -w * 0.1, w * 1.1);
    const y = between(r, h * 0.02, horizon * 0.95);
    L.push(
      pick(r, ["p", "p", "b"]) === "p"
        ? palm(r, { x, y, len: between(r, 130, 300) * S, angle: between(r, -180, 180), fill: farFill(), opacity: between(r, 0.55, 0.9), blur: "b4" })
        : banana(r, { x, y, size: between(r, 70, 150) * S, angle: between(r, -90, 90), fill: farFill(), opacity: between(r, 0.5, 0.85), blur: "b4" }),
    );
  }
  L.push(`<rect width="${w}" height="${h}" fill="${p.fog}" opacity="0.2"/>`);

  /* --- Couche 3 : troncs et grandes palmes, légèrement flous --- */
  for (let i = 0; i < Math.round(6 * density); i++) {
    const tw = between(r, 16, 42) * S;
    L.push(
      trunk(r, {
        x: between(r, -w * 0.04, w * 0.99),
        y: horizon + between(r, -h * 0.03, h * 0.08),
        w: tw,
        h: between(r, h * 0.5, h * 0.95),
        fill: vary(r, mix(p.mid, p.fog, 0.35), p.ground, 0.4),
        opacity: between(r, 0.8, 1),
        bamboo: r() > 0.45,
        blur: "b3",
      }),
    );
  }
  const midFill = () => vary(r, mix(p.canopy, p.fog, 0.28), p.tint, 0.2);
  for (let i = 0; i < Math.round(22 * density); i++) {
    const x = between(r, -w * 0.08, w * 1.08);
    const y = between(r, h * 0.05, horizon);
    const kind = pick(r, ["palm", "palm", "monstera", "banana", "fern"]);
    const o = { fill: midFill(), opacity: between(r, 0.7, 0.95), blur: "b3" };
    if (kind === "palm") L.push(palm(r, { x, y, len: between(r, 120, 260) * S, angle: between(r, -180, 180), ...o }));
    else if (kind === "monstera") L.push(monstera(r, { x, y, size: between(r, 45, 95) * S, angle: between(r, -55, 55), ...o }, defs));
    else if (kind === "banana") L.push(banana(r, { x, y, size: between(r, 70, 150) * S, angle: between(r, -80, 80), ...o }));
    else L.push(fern(r, { x, y, len: between(r, 70, 150) * S, angle: between(r, -180, 180), ...o }));
  }
  L.push(`<rect width="${w}" height="${h}" fill="${p.fog}" opacity="0.13"/>`);

  /* --- Couche 2 : végétation nette qui borde la clairière --- */
  const nearMid = () => vary(r, p.mid, p.canopy, 0.5);
  for (let i = 0; i < Math.round(14 * density); i++) {
    L.push(
      bush(
        r,
        {
          x: between(r, -w * 0.05, w * 1.05),
          y: between(r, horizon - h * 0.3, horizon + h * 0.06),
          size: between(r, 90, 210) * S,
          fill: nearMid(),
          opacity: between(r, 0.85, 1),
        },
        defs,
      ),
    );
  }

  /* --- Le sol de la clairière --- */
  L.push(
    `<path d="M0 ${n(horizon)} Q ${n(w * 0.5)} ${n(horizon - h * 0.05)} ${w} ${n(horizon + h * 0.03)} L ${w} ${h} L 0 ${h} Z" fill="${p.ground}"/>`,
    `<path d="M0 ${n(horizon)} Q ${n(w * 0.5)} ${n(horizon - h * 0.05)} ${w} ${n(horizon + h * 0.03)} L ${w} ${h} L 0 ${h} Z" fill="url(#soil)"/>`,
  );
  for (let i = 0; i < Math.round(16 * density); i++) {
    const rx = between(r, 20, 90) * S;
    L.push(
      `<ellipse cx="${n(between(r, 0, w))}" cy="${n(between(r, horizon + h * 0.02, h))}" rx="${n(rx)}" ry="${n(rx * between(r, 0.14, 0.28))}"
         fill="${r() > 0.5 ? p.near : p.tint}" opacity="${n(between(r, 0.05, 0.16))}"/>`,
    );
  }

  /* --- Les agrès, plein cadre au sol --- */
  const portrait = h > w;
  const propW = w * (portrait ? 0.82 : 0.52) * propScale;
  const propH = Math.min(h * 0.44, propW * 0.62) * propScale;
  L.push(
    PROPS[prop](r, {
      x: (w - propW) / 2 + between(r, -w * 0.05, w * 0.05),
      y: horizon + h * between(r, 0.13, 0.19),
      w: propW,
      h: propH,
      fill: p.prop,
    }),
  );

  /* --- Couche 1 : herbes et fougères devant les agrès --- */
  for (let i = 0; i < Math.round(18 * density); i++) {
    const y = between(r, horizon + h * 0.03, h * 1.02);
    const t = (y - horizon) / (h - horizon);
    L.push(
      grass(r, {
        x: between(r, -w * 0.02, w * 1.02),
        y,
        h: between(r, 40, 130) * S * (0.5 + t),
        fill: mix(p.mid, p.near, 0.35 + t * 0.55),
        opacity: between(r, 0.8, 1),
      }),
    );
  }

  /* --- Rais de lumière --- */
  for (let i = 0; i < 5; i++) {
    const rx = between(r, -w * 0.25, w);
    L.push(
      `<path d="M${n(rx)} ${n(-h * 0.1)} L ${n(rx + w * between(r, 0.05, 0.14))} ${n(-h * 0.1)} L ${n(rx + w * 0.45)} ${n(h * 1.1)} L ${n(rx + w * 0.24)} ${n(h * 1.1)} Z"
         fill="${p.ray}" opacity="${n(between(r, p.rayOpacity * 0.4, p.rayOpacity))}" filter="url(#b5)"/>`,
    );
  }

  /* --- Couche 0 : feuillage d'avant-plan, très sombre et flou (bokeh) --- */
  const corners = [
    { x: w * between(r, 0, 0.25), y: 0, a: 118 },
    { x: w * between(r, 0.75, 1), y: 0, a: -118 },
    { x: 0, y: h * between(r, 0.75, 1), a: 32 },
    { x: w, y: h * between(r, 0.75, 1), a: -32 },
    { x: w * between(r, 0.35, 0.65), y: h * 1.02, a: r() > 0.5 ? 78 : -78 },
  ];
  for (const c of corners) {
    const kind = pick(r, ["palm", "monstera", "banana", "palm"]);
    const o = { fill: vary(r, p.near, p.mid, 0.4), opacity: between(r, 0.86, 0.98), blur: "b2" };
    if (kind === "palm") L.push(palm(r, { x: c.x, y: c.y, len: between(r, 280, 480) * S, angle: c.a + between(r, -28, 28), ...o }));
    else if (kind === "monstera")
      L.push(monstera(r, { x: c.x, y: c.y, size: between(r, 120, 200) * S, angle: c.a + between(r, -35, 35), ...o }, defs));
    else L.push(banana(r, { x: c.x, y: c.y, size: between(r, 160, 300) * S, angle: c.a + between(r, -35, 35), ...o }));
  }

  /* --- Canopée en surplomb sur le bord supérieur --- */
  for (let i = 0; i < Math.round(9 * density); i++) {
    const x = between(r, -w * 0.05, w * 1.05);
    const y = between(r, -h * 0.06, h * 0.05);
    const o = { fill: vary(r, mix(p.near, p.mid, 0.35), p.canopy, 0.35), opacity: between(r, 0.8, 0.96), blur: "b2" };
    const kind = pick(r, ["palm", "palm", "banana", "monstera"]);
    if (kind === "palm") L.push(palm(r, { x, y, len: between(r, 220, 400) * S, angle: between(r, 55, 125), ...o }));
    else if (kind === "banana") L.push(banana(r, { x, y, size: between(r, 110, 220) * S, angle: between(r, -35, 35), ...o }));
    else L.push(monstera(r, { x, y, size: between(r, 80, 150) * S, angle: between(r, -40, 40), ...o }, defs));
  }

  L.push(`<rect width="${w}" height="${h}" fill="url(#vignette)"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="sky" x1="0.15" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${p.sky[0]}"/>
      <stop offset="0.3" stop-color="${p.sky[1]}"/>
      <stop offset="0.68" stop-color="${p.sky[2]}"/>
      <stop offset="1" stop-color="${p.sky[3]}"/>
    </linearGradient>
    <radialGradient id="glow">
      <stop offset="0" stop-color="${p.glow}" stop-opacity="0.85"/>
      <stop offset="1" stop-color="${p.glow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.1"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.8"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.44" r="0.8">
      <stop offset="0.4" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.6"/>
    </radialGradient>
    <filter id="b2" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${n(w * 0.0035)}"/></filter>
    <filter id="b3" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${n(w * 0.0055)}"/></filter>
    <filter id="b4" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${n(w * 0.014)}"/></filter>
    <filter id="b5" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${n(w * 0.03)}"/></filter>
    ${defs.join("\n    ")}
  </defs>
  ${L.join("\n  ")}
</svg>`;
}

/* ------------------------------------------------ rendu + grain argentique */

async function render({ w, h, ...spec }) {
  const svg = scene({ w, h, ...spec });
  const base = sharp(Buffer.from(svg), { density: 96 });

  // Grain : une tuile de bruit répétée sur toute l'image.
  const T = 512;
  const noise = Buffer.allocUnsafe(T * T * 3);
  const nr = rng(spec.seed * 7 + 13);
  for (let i = 0; i < noise.length; i += 3) {
    const v = 128 + Math.round((nr() + nr() + nr() - 1.5) * 34);
    noise[i] = noise[i + 1] = noise[i + 2] = v < 0 ? 0 : v > 255 ? 255 : v;
  }

  return base
    .composite([
      { input: noise, raw: { width: T, height: T, channels: 3 }, tile: true, blend: "soft-light" },
    ])
    .modulate({ saturation: 1.07, brightness: 1.02 })
    .jpeg({ quality: 76, mozjpeg: true })
    .toBuffer();
}

/* ------------------------------------------------------------------ sortie */

const IMAGES = [
  { file: "hero", w: 2400, h: 1500, seed: 10412, mood: "dawn", prop: "rig", propScale: 1.05, density: 1.15 },
  { file: "training-strength", w: 1200, h: 1500, seed: 7715, mood: "deep", prop: "rig", propScale: 1.3, density: 1.2 },
  { file: "training-flow", w: 1200, h: 1500, seed: 2148, mood: "dawn", prop: "deck", propScale: 1.2, density: 1.1 },
  { file: "training-wild", w: 1200, h: 1500, seed: 9132, mood: "dusk", prop: "wildYard", propScale: 1.25, density: 1.1 },
  { file: "gallery-1", w: 1600, h: 1100, seed: 33017, mood: "day", prop: "rig", propScale: 0.95, density: 1.1 },
  { file: "gallery-2", w: 1100, h: 1500, seed: 55026, mood: "deep", prop: "none", density: 1.7 },
  { file: "gallery-3", w: 1600, h: 1100, seed: 66139, mood: "dusk", prop: "deck", propScale: 1.05, density: 1 },
  { file: "gallery-4", w: 1100, h: 1500, seed: 77248, mood: "dawn", prop: "stonePool", propScale: 1.15, density: 1.2 },
  { file: "gallery-5", w: 1600, h: 1100, seed: 88351, mood: "day", prop: "wildYard", propScale: 1, density: 1.1 },
  { file: "gallery-6", w: 1600, h: 1100, seed: 99461, mood: "deep", prop: "deck", propScale: 1.1, density: 1.2 },
  { file: "cta", w: 2200, h: 1300, seed: 12073, mood: "dusk", prop: "rig", propScale: 1, density: 1.15 },
  { file: "manifeste", w: 1300, h: 1600, seed: 44085, mood: "dusk", prop: "rig", propScale: 0.95, density: 1.5 },
  { file: "og", w: 1200, h: 630, seed: 10412, mood: "dawn", prop: "rig", propScale: 0.85, density: 1 },
];

const only = process.argv.slice(2);

await mkdir(OUT, { recursive: true });
for (const spec of IMAGES.filter((s) => only.length === 0 || only.includes(s.file))) {
  const buf = await render(spec);
  await writeFile(path.join(OUT, `${spec.file}.jpg`), buf);
  console.log(`✓ ${spec.file}.jpg  ${spec.w}×${spec.h}  ${(buf.length / 1024).toFixed(0)} Ko`);
}
