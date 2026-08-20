/**
 * Génère les photos placeholder de BRIN SAUVAGE.
 *
 * Chaque image est composée en SVG — lumière de vitrine, décor de boutique,
 * fleurs assemblées tige par tige — puis rastérisée en JPEG avec un grain
 * argentique dans public/images. Aucun service d'images externe.
 *
 *   node scripts/generate-placeholders.mjs            tout
 *   node scripts/generate-placeholders.mjs hero og    au choix
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
const rad = (deg) => (deg * Math.PI) / 180;

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
  // Ouverture, lumière rasante sur le trottoir.
  matin: {
    wall: ["#fdf6e8", "#efe1c9", "#d3bfa0", "#8d7757"],
    glow: "#fffaf0",
    haze: "#efe0c6",
    floor: "#b49b78",
    woodMid: "#8d6137",
    woodDark: "#4a3220",
    metal: "#b8bdb6",
    greens: ["#7d9a6a", "#5f7d51", "#48633e", "#93ae7c"],
    petals: ["#fbf3e6", "#f3d3dc", "#e79aae", "#f2d489", "#dd8f63", "#cfd8c0"],
    near: "#2b2a20",
    ray: "#fff6dd",
    rayOpacity: 0.16,
  },
  // Intérieur de boutique, lumière chaude d'ampoule.
  boutique: {
    wall: ["#f6e7cf", "#e2c9a4", "#b99973", "#5f4830"],
    glow: "#ffeecd",
    haze: "#dfc6a0",
    floor: "#8f7a5e",
    woodMid: "#93663a",
    woodDark: "#432c1a",
    metal: "#aeb2ab",
    greens: ["#6f8d5d", "#54724a", "#3d5836", "#89a674"],
    petals: ["#fdf5e9", "#eab7c6", "#d0708f", "#e8a75f", "#c96a45", "#b799cf"],
    near: "#25201a",
    ray: "#ffe9c2",
    rayOpacity: 0.15,
  },
  // Réserve fraîche, lumière verte et diffuse.
  serre: {
    wall: ["#eef4e2", "#d7e3c4", "#aebf9a", "#61764f"],
    glow: "#f6ffe8",
    haze: "#d3e0bf",
    floor: "#9aa584",
    woodMid: "#7e6039",
    woodDark: "#3d2e1c",
    metal: "#c2c7bd",
    greens: ["#84a56d", "#65874f", "#4a6b3c", "#a3c088"],
    petals: ["#fcf7ec", "#f0d7e0", "#e08fa6", "#f4dfa0", "#cbd9b6", "#d8a9c9"],
    near: "#22301f",
    ray: "#f2ffdc",
    rayOpacity: 0.13,
  },
  // Fin de journée, vitrine allumée.
  soir: {
    wall: ["#e8bd86", "#c98d55", "#8a5c39", "#37281c"],
    glow: "#ffcf94",
    haze: "#c69468",
    floor: "#6f5236",
    woodMid: "#7c5230",
    woodDark: "#33210f",
    metal: "#9a9d94",
    greens: ["#5c7a4c", "#435c39", "#2f4429", "#7a9666"],
    petals: ["#fbeed9", "#e9a9bb", "#c25f80", "#e0a457", "#b85a3c", "#9d7ab5"],
    near: "#1a140e",
    ray: "#ffdcab",
    rayOpacity: 0.18,
  },
};

/* ------------------------------------------------------- les fleurs, tige */

/** Tige souple, une à deux feuilles lancéolées. */
function stem(r, { x, y, len, angle, fill, width, opacity = 1, blur }) {
  const bend = between(r, -0.18, 0.18) * len;
  const leaves = [];
  for (let i = 0; i < Math.round(between(r, 0, 2.99)); i++) {
    const t = between(r, 0.25, 0.75);
    const s = r() > 0.5 ? 1 : -1;
    const ll = len * between(r, 0.14, 0.24);
    leaves.push(
      `<path d="M${n(t * len)} 0 q ${n(ll * 0.55)} ${n(-s * ll * 0.38)} ${n(ll)} ${n(-s * ll * 0.1)}
                q ${n(-ll * 0.5)} ${n(s * ll * 0.34)} ${n(-ll)} ${n(s * ll * 0.1)} Z"/>`,
    );
  }
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})" fill="${fill}" opacity="${n(opacity)}"${
    blur ? ` filter="url(#${blur})"` : ""
  }>
      <path d="M0 0 Q ${n(len * 0.5)} ${n(bend)} ${n(len)} ${n(bend * 0.4)}"
        stroke="${fill}" stroke-width="${n(width)}" fill="none" stroke-linecap="round"/>
      ${leaves.join("")}
    </g>`;
}

/** Pivoine, renoncule : boule de pétales serrés. */
function bloomBall(r, { x, y, size, fill, opacity = 1, blur }) {
  const heart = mix(fill, "#ffffff", 0.34);
  const parts = [];
  const outer = Math.round(between(r, 9, 14));
  for (let i = 0; i < outer; i++) {
    const a = (i / outer) * 360 + between(r, -10, 10);
    parts.push(
      `<ellipse cx="${n(size * 0.52)}" cy="0" rx="${n(size * between(r, 0.44, 0.56))}" ry="${n(size * between(r, 0.33, 0.44))}"
         transform="rotate(${n(a)})"/>`,
    );
  }
  const inner = [];
  const mid = Math.round(between(r, 5, 8));
  for (let i = 0; i < mid; i++) {
    const a = (i / mid) * 360 + between(r, -14, 14);
    inner.push(
      `<ellipse cx="${n(size * 0.26)}" cy="0" rx="${n(size * 0.3)}" ry="${n(size * 0.23)}" transform="rotate(${n(a)})"/>`,
    );
  }
  return `<g transform="translate(${n(x)} ${n(y)})" opacity="${n(opacity)}"${blur ? ` filter="url(#${blur})"` : ""}>
      <g fill="${fill}">${parts.join("")}</g>
      <g fill="${heart}" fill-opacity="0.75">${inner.join("")}</g>
      <circle r="${n(size * 0.15)}" fill="${mix(fill, "#f6d27a", 0.55)}"/>
    </g>`;
}

/** Marguerite, cosmos, dahlia simple : couronne de pétales effilés. */
function bloomDaisy(r, { x, y, size, fill, opacity = 1, blur }) {
  const petals = [];
  const count = Math.round(between(r, 8, 14));
  for (let i = 0; i < count; i++) {
    const a = (i / count) * 360 + between(r, -7, 7);
    petals.push(
      `<ellipse cx="${n(size * 0.6)}" cy="0" rx="${n(size * between(r, 0.5, 0.62))}" ry="${n(size * between(r, 0.15, 0.23))}"
         transform="rotate(${n(a)})"/>`,
    );
  }
  return `<g transform="translate(${n(x)} ${n(y)})" opacity="${n(opacity)}"${blur ? ` filter="url(#${blur})"` : ""}>
      <g fill="${fill}">${petals.join("")}</g>
      <circle r="${n(size * 0.26)}" fill="${mix(fill, "#c98a2e", 0.72)}"/>
      <circle r="${n(size * 0.14)}" fill="${mix(fill, "#7d5514", 0.8)}" fill-opacity="0.7"/>
    </g>`;
}

/** Rose : spirale de pétales arqués. */
function bloomRose(r, { x, y, size, fill, opacity = 1, blur }) {
  const rings = [];
  for (let k = 3; k >= 1; k--) {
    const rr = size * (0.34 + k * 0.22);
    const shade = mix(fill, k === 3 ? "#000000" : "#ffffff", k === 3 ? 0.12 : 0.14 * (3 - k));
    const count = 4 + k * 2;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * 360 + k * 24;
      rings.push(
        `<path d="M0 0 a ${n(rr)} ${n(rr * 0.9)} 0 0 1 ${n(rr * 1.25)} ${n(rr * 0.25)}
                  a ${n(rr * 0.7)} ${n(rr * 0.7)} 0 0 1 ${n(-rr * 1.25)} ${n(-rr * 0.25)} Z"
           transform="rotate(${n(a)})" fill="${shade}"/>`,
      );
    }
  }
  return `<g transform="translate(${n(x)} ${n(y)})" opacity="${n(opacity)}"${blur ? ` filter="url(#${blur})"` : ""}>
      <circle r="${n(size * 0.95)}" fill="${mix(fill, "#000000", 0.16)}"/>
      ${rings.join("")}
      <circle r="${n(size * 0.16)}" fill="${mix(fill, "#ffffff", 0.3)}"/>
    </g>`;
}

/** Tulipe, renoncule fermée : coupe à trois lobes. */
function bloomCup(r, { x, y, size, angle = 0, fill, opacity = 1, blur }) {
  const light = mix(fill, "#ffffff", 0.22);
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})" opacity="${n(opacity)}"${
    blur ? ` filter="url(#${blur})"` : ""
  }>
      <path d="M${n(-size * 0.62)} ${n(size * 0.1)} q ${n(size * 0.1)} ${n(-size * 1.35)} ${n(size * 0.62)} ${n(-size * 1.1)}
               q ${n(size * 0.52)} ${n(-size * 0.25)} ${n(size * 0.62)} ${n(size * 1.1)}
               q ${n(-size * 0.62)} ${n(size * 0.62)} ${n(-size * 1.24)} 0 Z" fill="${fill}"/>
      <path d="M${n(-size * 0.2)} ${n(-size * 0.05)} q ${n(size * 0.04)} ${n(-size * 1.1)} ${n(size * 0.4)} ${n(-size * 1.02)}
               q ${n(size * 0.28)} ${n(size * 0.5)} ${n(size * 0.02)} ${n(size * 1.06)} Z" fill="${light}" fill-opacity="0.8"/>
    </g>`;
}

/** Épi : delphinium, lavande, muflier. */
function bloomSpike(r, { x, y, len, angle, fill, opacity = 1, blur }) {
  const dots = [];
  const count = Math.round(between(r, 14, 24));
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const rr = len * (0.1 - t * 0.055) + len * 0.012;
    for (const s of [-1, 1]) {
      dots.push(
        `<ellipse cx="${n(t * len)}" cy="${n(s * rr * between(r, 0.4, 1.1))}" rx="${n(rr)}" ry="${n(rr * 0.85)}"/>`,
      );
    }
  }
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})" fill="${fill}" opacity="${n(opacity)}"${
    blur ? ` filter="url(#${blur})"` : ""
  }>${dots.join("")}</g>`;
}

/** Gypsophile, ombelle : nuage de points minuscules. */
function bloomCloud(r, { x, y, size, fill, opacity = 1, blur }) {
  const dots = [];
  for (let i = 0; i < Math.round(between(r, 22, 40)); i++) {
    const a = between(r, 0, 360);
    const d = Math.sqrt(r()) * size;
    dots.push(
      `<circle cx="${n(Math.cos(rad(a)) * d)}" cy="${n(Math.sin(rad(a)) * d * 0.85)}" r="${n(size * between(r, 0.06, 0.13))}"/>`,
    );
  }
  return `<g transform="translate(${n(x)} ${n(y)})" fill="${fill}" opacity="${n(opacity)}"${
    blur ? ` filter="url(#${blur})"` : ""
  }>${dots.join("")}</g>`;
}

/** Eucalyptus : feuilles rondes alternées le long d'une tige courbe. */
function eucalyptus(r, { x, y, len, angle, fill, opacity = 1, blur }) {
  const leaves = [];
  const count = Math.round(between(r, 9, 15));
  const curve = between(r, -0.3, 0.3);
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    const px = t * len;
    const py = curve * len * t * t;
    const rr = len * (0.088 - t * 0.042) + len * 0.014;
    const s = i % 2 === 0 ? 1 : -1;
    leaves.push(
      `<ellipse cx="${n(px)}" cy="${n(py + s * rr * 0.95)}" rx="${n(rr * 1.05)}" ry="${n(rr)}"
         transform="rotate(${n(s * between(r, 12, 30))} ${n(px)} ${n(py)})"/>`,
    );
  }
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})" fill="${fill}" opacity="${n(opacity)}"${
    blur ? ` filter="url(#${blur})"` : ""
  }>
      <path d="M0 0 Q ${n(len * 0.5)} ${n(curve * len * 0.25)} ${n(len)} ${n(curve * len)}"
        stroke="${fill}" stroke-width="${n(len * 0.022)}" fill="none"/>${leaves.join("")}</g>`;
}

/** Feuillage découpé : fougère, aneth, asparagus. */
function frond(r, { x, y, len, angle, fill, opacity = 1, blur }) {
  const parts = [];
  const count = Math.round(between(r, 14, 22));
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    const px = t * len;
    const s2 = (1 - t * 0.8) * len * 0.13 + len * 0.012;
    for (const s of [-1, 1]) {
      parts.push(
        `<ellipse cx="${n(px)}" cy="${n(s * s2 * 0.8)}" rx="${n(s2)}" ry="${n(s2 * 0.34)}"
           transform="rotate(${n(s * 30)} ${n(px)} 0)"/>`,
      );
    }
  }
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})" fill="${fill}" opacity="${n(opacity)}"${
    blur ? ` filter="url(#${blur})"` : ""
  }><rect x="0" y="${n(-len * 0.006)}" width="${n(len)}" height="${n(len * 0.012)}"/>${parts.join("")}</g>`;
}

/** Grande feuille simple : hosta, bergenia — pour garnir le bas des bottes. */
function leaf(r, { x, y, size, angle, fill, opacity = 1, blur }) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})" opacity="${n(opacity)}"${
    blur ? ` filter="url(#${blur})"` : ""
  }>
      <path d="M0 0 Q ${n(size * 0.5)} ${n(-size * 0.46)} ${n(size)} 0 Q ${n(size * 0.5)} ${n(size * 0.46)} 0 0 Z" fill="${fill}"/>
      <path d="M0 0 L ${n(size)} 0" stroke="#000" stroke-opacity="0.22" stroke-width="${n(size * 0.025)}"/>
    </g>`;
}

/** Une corolle au hasard, dans la palette donnée. */
function bloomAny(r, { x, y, size, palette, opacity = 1, blur, angle = 0 }) {
  const fill = pick(r, palette);
  const kind = pick(r, ["ball", "daisy", "rose", "cup", "ball", "daisy", "cloud", "spike"]);
  const o = { x, y, opacity, blur };
  if (kind === "ball") return bloomBall(r, { ...o, size, fill });
  if (kind === "daisy") return bloomDaisy(r, { ...o, size: size * 1.05, fill });
  if (kind === "rose") return bloomRose(r, { ...o, size: size * 0.8, fill });
  if (kind === "cup") return bloomCup(r, { ...o, size: size * 0.95, fill, angle });
  if (kind === "cloud") return bloomCloud(r, { ...o, size: size * 1.25, fill: mix(fill, "#ffffff", 0.4) });
  return bloomSpike(r, { ...o, len: size * 2.6, angle: angle - 90, fill });
}

/**
 * Botte de fleurs : feuillage en éventail, puis tiges garnies.
 * `spread` est l'ouverture en degrés de part et d'autre de la verticale.
 */
function bunch(r, { x, y, h, spread = 40, count = 14, palette, greens, opacity = 1, blur, scale = 1 }) {
  const out = [];

  for (let i = 0; i < Math.round(count * 0.55); i++) {
    const a = -90 + between(r, -spread * 1.3, spread * 1.3);
    const len = h * between(r, 0.5, 0.95);
    const fill = pick(r, greens);
    const o = { x: x + between(r, -h * 0.04, h * 0.04), y, len, angle: a, fill, opacity, blur };
    out.push(r() > 0.45 ? eucalyptus(r, o) : frond(r, o));
  }

  for (let i = 0; i < Math.round(count * 0.22); i++) {
    out.push(
      leaf(r, {
        x: x + between(r, -h * 0.1, h * 0.1),
        y: y - h * between(r, 0, 0.12),
        size: h * between(r, 0.16, 0.26),
        angle: between(r, -170, -10),
        fill: pick(r, greens),
        opacity,
        blur,
      }),
    );
  }

  const tips = [];
  for (let i = 0; i < count; i++) {
    const a = -90 + between(r, -spread, spread);
    const len = h * between(r, 0.45, 1);
    out.push(
      stem(r, { x, y, len, angle: a, fill: pick(r, greens), width: h * between(r, 0.008, 0.016), opacity, blur }),
    );
    tips.push({
      x: x + Math.cos(rad(a)) * len,
      y: y + Math.sin(rad(a)) * len,
      size: h * between(r, 0.07, 0.125) * scale,
      angle: a + 90,
    });
  }
  // Les corolles passent après toutes les tiges : elles restent au-dessus.
  for (const t of tips) out.push(bloomAny(r, { ...t, palette, opacity, blur }));

  return out.join("");
}

/* ------------------------------------------------------------- contenants */

/** Seau de fleuriste en zinc : tronc conique, rebord roulé, anse. */
function bucket(r, { x, y, w, h, metal }) {
  const top = w;
  const bot = w * 0.72;
  const dark = mix(metal, "#1d2118", 0.55);
  const light = mix(metal, "#ffffff", 0.45);
  return `<g transform="translate(${n(x)} ${n(y - h)})">
      <path d="M${n(-top / 2)} 0 L ${n(-bot / 2)} ${n(h)} L ${n(bot / 2)} ${n(h)} L ${n(top / 2)} 0 Z" fill="${metal}"/>
      <path d="M${n(-top / 2)} 0 L ${n(-bot / 2)} ${n(h)} L ${n(-bot / 2 + bot * 0.3)} ${n(h)} L ${n(-top / 2 + top * 0.3)} 0 Z"
        fill="${light}" fill-opacity="0.45"/>
      <path d="M${n(top / 2 - top * 0.2)} 0 L ${n(bot / 2 - bot * 0.2)} ${n(h)} L ${n(bot / 2)} ${n(h)} L ${n(top / 2)} 0 Z"
        fill="${dark}" fill-opacity="0.5"/>
      <ellipse cx="0" cy="0" rx="${n(top / 2)}" ry="${n(top * 0.13)}" fill="${dark}"/>
      <ellipse cx="0" cy="${n(-h * 0.012)}" rx="${n(top / 2)}" ry="${n(top * 0.13)}" fill="none"
        stroke="${light}" stroke-width="${n(w * 0.045)}" stroke-opacity="0.75"/>
      <rect x="${n(-top / 2)}" y="${n(h * 0.42)}" width="${n(top * 0.97)}" height="${n(h * 0.05)}" fill="${dark}" fill-opacity="0.35"/>
      <path d="M${n(-top * 0.46)} ${n(h * 0.1)} q 0 ${n(-h * 0.42)} ${n(top * 0.46)} ${n(-h * 0.34)}"
        fill="none" stroke="${dark}" stroke-width="${n(w * 0.035)}" stroke-opacity="0.8"/>
    </g>`;
}

/** Vase de verre ou de grès. */
function vase(r, { x, y, w, h, fill, glass = false }) {
  const dark = mix(fill, "#171410", 0.5);
  const light = mix(fill, "#ffffff", 0.5);
  const neck = w * between(r, 0.42, 0.66);
  const body = `M${n(-neck / 2)} 0
      C ${n(-w * 0.62)} ${n(h * 0.36)} ${n(-w * 0.5)} ${n(h * 0.82)} ${n(-w * 0.34)} ${n(h)}
      L ${n(w * 0.34)} ${n(h)}
      C ${n(w * 0.5)} ${n(h * 0.82)} ${n(w * 0.62)} ${n(h * 0.36)} ${n(neck / 2)} 0 Z`;
  return `<g transform="translate(${n(x)} ${n(y - h)})">
      <path d="${body}" fill="${fill}" fill-opacity="${glass ? 0.55 : 1}"/>
      <path d="M${n(-neck / 2)} 0 C ${n(-w * 0.5)} ${n(h * 0.4)} ${n(-w * 0.4)} ${n(h * 0.8)} ${n(-w * 0.28)} ${n(h)}
               L ${n(-w * 0.1)} ${n(h)} C ${n(-w * 0.22)} ${n(h * 0.78)} ${n(-w * 0.3)} ${n(h * 0.4)} ${n(-neck * 0.2)} 0 Z"
        fill="${light}" fill-opacity="0.42"/>
      <path d="M${n(neck * 0.24)} 0 C ${n(w * 0.4)} ${n(h * 0.4)} ${n(w * 0.34)} ${n(h * 0.8)} ${n(w * 0.24)} ${n(h)}
               L ${n(w * 0.34)} ${n(h)} C ${n(w * 0.5)} ${n(h * 0.8)} ${n(w * 0.62)} ${n(h * 0.36)} ${n(neck / 2)} 0 Z"
        fill="${dark}" fill-opacity="0.4"/>
      <ellipse cx="0" cy="0" rx="${n(neck / 2)}" ry="${n(neck * 0.16)}" fill="${dark}"/>
      ${glass ? `<rect x="${n(-w * 0.34)}" y="${n(h * 0.45)}" width="${n(w * 0.68)}" height="${n(h * 0.55)}" fill="${light}" fill-opacity="0.25"/>` : ""}
    </g>`;
}

/** Pot de terre cuite, avec sa collerette. */
function pot(r, { x, y, w, h, fill }) {
  const dark = mix(fill, "#1c1109", 0.45);
  const light = mix(fill, "#ffe9cf", 0.4);
  const bot = w * 0.74;
  return `<g transform="translate(${n(x)} ${n(y - h)})">
      <path d="M${n(-w / 2)} ${n(h * 0.16)} L ${n(-bot / 2)} ${n(h)} L ${n(bot / 2)} ${n(h)} L ${n(w / 2)} ${n(h * 0.16)} Z" fill="${fill}"/>
      <path d="M${n(-w / 2)} ${n(h * 0.16)} L ${n(-bot / 2)} ${n(h)} L ${n(-bot * 0.2)} ${n(h)} L ${n(-w * 0.22)} ${n(h * 0.16)} Z"
        fill="${light}" fill-opacity="0.4"/>
      <path d="M${n(w * 0.2)} ${n(h * 0.16)} L ${n(bot * 0.24)} ${n(h)} L ${n(bot / 2)} ${n(h)} L ${n(w / 2)} ${n(h * 0.16)} Z"
        fill="${dark}" fill-opacity="0.45"/>
      <rect x="${n(-w * 0.54)}" y="0" width="${n(w * 1.08)}" height="${n(h * 0.17)}" rx="${n(h * 0.03)}" fill="${mix(fill, "#ffffff", 0.12)}"/>
      <ellipse cx="0" cy="${n(h * 0.02)}" rx="${n(w * 0.5)}" ry="${n(w * 0.11)}" fill="${dark}" fill-opacity="0.75"/>
    </g>`;
}

/** Cône de papier kraft, bouquet emballé. */
function wrap(r, { x, y, w, h, fill }) {
  const dark = mix(fill, "#2a1a0d", 0.4);
  return `<g transform="translate(${n(x)} ${n(y - h)})">
      <path d="M${n(-w / 2)} 0 L ${n(-w * 0.1)} ${n(h)} L ${n(w * 0.1)} ${n(h)} L ${n(w / 2)} 0 Z" fill="${fill}"/>
      <path d="M${n(-w * 0.16)} 0 L ${n(-w * 0.02)} ${n(h)} L ${n(w * 0.1)} ${n(h)} L ${n(w / 2)} 0 Z" fill="${dark}" fill-opacity="0.4"/>
      <path d="M${n(-w / 2)} 0 L ${n(w / 2)} 0" stroke="${dark}" stroke-width="${n(h * 0.03)}"/>
      <rect x="${n(-w * 0.2)} " y="${n(h * 0.52)}" width="${n(w * 0.32)}" height="${n(h * 0.055)}" rx="${n(h * 0.02)}"
        fill="${mix(fill, "#000000", 0.35)}" transform="rotate(-6)"/>
    </g>`;
}

/* ---------------------------------------------------------------- décors */

/** Devanture : store rayé, vitrine, enseigne, seaux sur le trottoir. */
function devanture(r, { w, h, y, p }) {
  const L = [];
  const facade = mix(p.wall[2], p.woodDark, 0.35);
  const shopTop = y - h * 0.62;

  L.push(
    `<rect x="0" y="${n(shopTop)}" width="${w}" height="${n(y - shopTop)}" fill="${facade}"/>`,
    `<rect x="0" y="${n(shopTop)}" width="${w}" height="${n(y - shopTop)}" fill="url(#wallShade)"/>`,
  );

  // vitrine, avec ses meneaux
  const vx = w * 0.08;
  const vw = w * 0.56;
  const vy = shopTop + h * 0.1;
  const vh = h * 0.4;
  L.push(
    `<rect x="${n(vx)}" y="${n(vy)}" width="${n(vw)}" height="${n(vh)}" fill="${mix(p.glow, p.woodDark, 0.3)}"/>`,
    `<rect x="${n(vx)}" y="${n(vy)}" width="${n(vw)}" height="${n(vh)}" fill="url(#glassLight)"/>`,
  );
  for (let i = 1; i < 4; i++) {
    L.push(
      `<rect x="${n(vx + (vw / 4) * i - w * 0.004)}" y="${n(vy)}" width="${n(w * 0.008)}" height="${n(vh)}" fill="${p.woodDark}"/>`,
    );
  }
  L.push(
    `<rect x="${n(vx - w * 0.012)}" y="${n(vy - h * 0.014)}" width="${n(vw + w * 0.024)}" height="${n(vh + h * 0.028)}"
       fill="none" stroke="${p.woodDark}" stroke-width="${n(w * 0.014)}"/>`,
  );

  // silhouettes de bouquets derrière la vitre
  for (let i = 0; i < 4; i++) {
    L.push(
      bunch(r, {
        x: vx + vw * (0.15 + i * 0.24),
        y: vy + vh * 0.94,
        h: vh * between(r, 0.42, 0.62),
        count: 7,
        spread: 34,
        palette: p.petals.map((c) => mix(c, p.glow, 0.45)),
        greens: p.greens.map((c) => mix(c, p.glow, 0.4)),
        opacity: 0.75,
        blur: "b3",
      }),
    );
  }

  // porte
  const dx = w * 0.7;
  const dw = w * 0.16;
  L.push(
    `<rect x="${n(dx)}" y="${n(vy - h * 0.02)}" width="${n(dw)}" height="${n(y - vy + h * 0.02)}" fill="${p.woodDark}"/>`,
    `<rect x="${n(dx + dw * 0.1)}" y="${n(vy + h * 0.01)}" width="${n(dw * 0.8)}" height="${n(vh * 0.62)}" fill="${mix(p.glow, p.woodDark, 0.42)}"/>`,
    `<circle cx="${n(dx + dw * 0.85)}" cy="${n(vy + vh * 0.86)}" r="${n(w * 0.006)}" fill="${mix(p.metal, "#ffffff", 0.3)}"/>`,
  );

  // store rayé
  const aY = shopTop + h * 0.05;
  const aH = h * 0.1;
  const stripes = [];
  const sw = w * 0.045;
  for (let i = 0; i * sw < w * 0.92; i++) {
    stripes.push(
      `<rect x="${n(w * 0.04 + i * sw)}" y="${n(aY)}" width="${n(sw)}" height="${n(aH * 1.4)}"
         fill="${i % 2 ? mix(p.greens[2], "#000000", 0.15) : mix(p.wall[0], p.greens[3], 0.12)}"/>`,
    );
  }
  const scallop = [];
  for (let i = 0; i * sw < w * 0.92; i++) {
    scallop.push(
      `<circle cx="${n(w * 0.04 + i * sw + sw / 2)}" cy="${n(aY + aH * 1.4)}" r="${n(sw * 0.5)}"
         fill="${i % 2 ? mix(p.greens[2], "#000000", 0.15) : mix(p.wall[0], p.greens[3], 0.12)}"/>`,
    );
  }
  L.push(
    `<g>${stripes.join("")}${scallop.join("")}</g>`,
    `<rect x="${n(w * 0.04)}" y="${n(aY)}" width="${n(w * 0.92)}" height="${n(aH * 1.4)}" fill="url(#awningShade)"/>`,
    `<rect x="${n(w * 0.03)}" y="${n(aY - h * 0.012)}" width="${n(w * 0.94)}" height="${n(h * 0.018)}" fill="${p.woodDark}"/>`,
  );

  // enseigne suspendue
  L.push(
    `<rect x="${n(w * 0.79)}" y="${n(aY + aH * 1.4)}" width="${n(w * 0.006)}" height="${n(h * 0.05)}" fill="${p.woodDark}"/>`,
    `<rect x="${n(w * 0.72)}" y="${n(aY + aH * 1.4 + h * 0.05)}" width="${n(w * 0.14)}" height="${n(h * 0.07)}" rx="${n(h * 0.008)}"
       fill="${p.woodDark}"/>`,
    `<rect x="${n(w * 0.73)}" y="${n(aY + aH * 1.4 + h * 0.058)}" width="${n(w * 0.12)}" height="${n(h * 0.054)}" rx="${n(h * 0.006)}"
       fill="none" stroke="${mix(p.wall[0], p.woodDark, 0.25)}" stroke-width="${n(w * 0.003)}"/>`,
  );

  // trottoir + seaux
  L.push(`<rect x="0" y="${n(y)}" width="${w}" height="${n(h - y)}" fill="${p.floor}"/>`,
    `<rect x="0" y="${n(y)}" width="${w}" height="${n(h - y)}" fill="url(#floorShade)"/>`);

  const slots = [0.08, 0.2, 0.31, 0.44, 0.55, 0.86, 0.95];
  for (const t of slots) {
    const bw = w * between(r, 0.095, 0.125);
    const bh = bw * between(r, 0.95, 1.2);
    const by = y + h * between(r, 0.05, 0.19);
    L.push(bucket(r, { x: w * t, y: by, w: bw, h: bh, metal: p.metal }));
    L.push(
      bunch(r, {
        x: w * t,
        y: by - bh,
        h: bh * between(r, 1.5, 2.1),
        count: Math.round(between(r, 10, 16)),
        spread: 30,
        palette: p.petals,
        greens: p.greens,
      }),
    );
  }

  // ardoise
  const cx = w * 0.63;
  const cy = y + h * 0.15;
  const cw = w * 0.09;
  const ch = cw * 1.35;
  L.push(
    `<g transform="translate(${n(cx)} ${n(cy - ch)})">
       <path d="M${n(-cw * 0.42)} ${n(ch)} L ${n(-cw * 0.1)} 0 L ${n(cw * 0.1)} 0 L ${n(cw * 0.42)} ${n(ch)}" stroke="${p.woodDark}"
         stroke-width="${n(cw * 0.07)}" fill="none"/>
       <rect x="${n(-cw / 2)}" y="0" width="${n(cw)}" height="${n(ch * 0.78)}" rx="${n(cw * 0.04)}" fill="${p.woodDark}"/>
       <rect x="${n(-cw * 0.42)}" y="${n(ch * 0.06)}" width="${n(cw * 0.84)}" height="${n(ch * 0.66)}" fill="${mix(p.near, "#3a4a3c", 0.5)}"/>
       ${[0.18, 0.34, 0.5, 0.62]
         .map(
           (t, i) =>
             `<rect x="${n(-cw * 0.32)}" y="${n(ch * t)}" width="${n(cw * (i === 0 ? 0.5 : 0.62 - i * 0.08))}" height="${n(ch * 0.035)}"
                rx="${n(ch * 0.017)}" fill="${p.wall[0]}" fill-opacity="0.5"/>`,
         )
         .join("")}
     </g>`,
  );

  return L.join("");
}

/** Étal : rangée de seaux serrés, débordant de fleurs. */
function etal(r, { w, h, y, p }) {
  const L = [];
  L.push(
    `<rect x="0" y="${n(y - h * 0.02)}" width="${w}" height="${n(h - y + h * 0.02)}" fill="${p.floor}"/>`,
    `<rect x="0" y="${n(y - h * 0.02)}" width="${w}" height="${n(h - y + h * 0.02)}" fill="url(#floorShade)"/>`,
  );

  // gradin arrière, en caisses de bois
  const crates = 5;
  for (let i = 0; i < crates; i++) {
    const cw = w / crates;
    L.push(
      `<rect x="${n(i * cw)}" y="${n(y - h * 0.16)}" width="${n(cw * 0.97)}" height="${n(h * 0.16)}" fill="${p.woodMid}"/>`,
      `<rect x="${n(i * cw)}" y="${n(y - h * 0.16)}" width="${n(cw * 0.97)}" height="${n(h * 0.16)}" fill="url(#floorShade)"/>`,
      `<rect x="${n(i * cw)}" y="${n(y - h * 0.16)}" width="${n(cw * 0.97)}" height="${n(h * 0.014)}" fill="${p.woodDark}" fill-opacity="0.6"/>`,
    );
  }

  const rows = [
    { yy: y - h * 0.16, s: 0.72, o: 0.92, blur: "b3", count: 7 },
    { yy: y + h * 0.06, s: 1, o: 1, blur: null, count: 6 },
  ];
  for (const row of rows) {
    for (let i = 0; i < row.count; i++) {
      const bw = (w / row.count) * between(r, 0.66, 0.82) * row.s;
      const bh = bw * between(r, 1, 1.25);
      const bx = (w / row.count) * (i + 0.5) + between(r, -w * 0.02, w * 0.02);
      L.push(bucket(r, { x: bx, y: row.yy, w: bw, h: bh, metal: p.metal }));
      L.push(
        bunch(r, {
          x: bx,
          y: row.yy - bh,
          h: bh * between(r, 1.6, 2.3),
          count: Math.round(between(r, 12, 20)),
          spread: 32,
          palette: p.petals,
          greens: p.greens,
          opacity: row.o,
          blur: row.blur,
        }),
      );
    }
  }
  return L.join("");
}

/** Établi : plan de travail, rouleau de kraft, ficelle, tiges coupées. */
function atelier(r, { w, h, y, p }) {
  const L = [];
  const topY = y - h * 0.04;

  // mur du fond + étagère
  L.push(
    `<rect x="${n(w * 0.06)}" y="${n(topY - h * 0.42)}" width="${n(w * 0.88)}" height="${n(h * 0.022)}" fill="${p.woodMid}"/>`,
    `<rect x="${n(w * 0.06)}" y="${n(topY - h * 0.42)}" width="${n(w * 0.88)}" height="${n(h * 0.022)}" fill="url(#floorShade)"/>`,
  );
  for (let i = 0; i < 5; i++) {
    const vx = w * (0.12 + i * 0.19) + between(r, -w * 0.02, w * 0.02);
    const vw = w * between(r, 0.05, 0.08);
    const vh = vw * between(r, 1.1, 1.6);
    L.push(vase(r, { x: vx, y: topY - h * 0.42, w: vw, h: vh, fill: mix(p.metal, p.wall[1], 0.5), glass: r() > 0.5 }));
    if (r() > 0.35) {
      L.push(
        bunch(r, {
          x: vx,
          y: topY - h * 0.42 - vh,
          h: vh * between(r, 1.1, 1.7),
          count: 6,
          spread: 34,
          palette: p.petals,
          greens: p.greens,
          opacity: 0.95,
          blur: "b3",
        }),
      );
    }
  }

  // plateau
  L.push(
    `<rect x="0" y="${n(topY)}" width="${w}" height="${n(h * 0.05)}" fill="${p.woodMid}"/>`,
    `<rect x="0" y="${n(topY + h * 0.05)}" width="${w}" height="${n(h - topY)}" fill="${mix(p.woodDark, p.floor, 0.35)}"/>`,
    `<rect x="0" y="${n(topY)}" width="${w}" height="${n(h - topY)}" fill="url(#floorShade)"/>`,
  );
  for (let i = 0; i < 9; i++) {
    L.push(
      `<rect x="${n(between(r, 0, w))}" y="${n(topY)}" width="${n(between(r, w * 0.002, w * 0.006))}" height="${n(h * 0.05)}"
         fill="#000" fill-opacity="${n(between(r, 0.1, 0.25))}"/>`,
    );
  }

  // rouleau de kraft
  const kx = w * 0.86;
  L.push(
    `<g transform="translate(${n(kx)} ${n(topY)})">
       <rect x="${n(-w * 0.11)}" y="${n(-h * 0.13)}" width="${n(w * 0.22)}" height="${n(h * 0.13)}" fill="${mix(p.woodMid, "#e8c89a", 0.45)}"/>
       <ellipse cx="${n(-w * 0.11)}" cy="${n(-h * 0.065)}" rx="${n(w * 0.022)}" ry="${n(h * 0.065)}" fill="${mix(p.woodMid, "#f2dbb6", 0.6)}"/>
       <ellipse cx="${n(-w * 0.11)}" cy="${n(-h * 0.065)}" rx="${n(w * 0.008)}" ry="${n(h * 0.024)}" fill="${p.woodDark}" fill-opacity="0.6"/>
     </g>`,
  );
  // bobine de ficelle
  L.push(
    `<g transform="translate(${n(w * 0.14)} ${n(topY)})">
       <ellipse cx="0" cy="${n(-h * 0.035)}" rx="${n(w * 0.045)}" ry="${n(h * 0.037)}" fill="${mix(p.woodMid, "#e0c79c", 0.5)}"/>
       <ellipse cx="0" cy="${n(-h * 0.048)}" rx="${n(w * 0.045)}" ry="${n(h * 0.037)}" fill="${mix(p.woodMid, "#f0dcb8", 0.6)}"/>
       <ellipse cx="0" cy="${n(-h * 0.048)}" rx="${n(w * 0.014)}" ry="${n(h * 0.012)}" fill="${p.woodDark}" fill-opacity="0.55"/>
     </g>`,
  );
  // sécateur
  L.push(
    `<g transform="translate(${n(w * 0.3)} ${n(topY - h * 0.012)}) rotate(-14)" fill="none" stroke-linecap="round">
       <path d="M0 0 L ${n(w * 0.09)} ${n(-h * 0.012)}" stroke="${mix(p.metal, "#ffffff", 0.3)}" stroke-width="${n(h * 0.014)}"/>
       <path d="M0 ${n(h * 0.008)} L ${n(w * 0.085)} ${n(h * 0.016)}" stroke="${mix(p.metal, "#000000", 0.15)}" stroke-width="${n(h * 0.012)}"/>
       <path d="M0 0 L ${n(-w * 0.07)} ${n(h * 0.02)}" stroke="${mix(p.petals[4], "#000000", 0.25)}" stroke-width="${n(h * 0.018)}"/>
       <path d="M0 ${n(h * 0.008)} L ${n(-w * 0.065)} ${n(h * 0.034)}" stroke="${mix(p.petals[4], "#000000", 0.35)}" stroke-width="${n(h * 0.018)}"/>
     </g>`,
  );

  // le bouquet en cours, couché sur l'établi
  L.push(
    bunch(r, {
      x: w * 0.52,
      y: topY - h * 0.005,
      h: h * 0.44,
      count: 20,
      spread: 46,
      palette: p.petals,
      greens: p.greens,
    }),
  );
  // tiges coupées éparpillées
  for (let i = 0; i < 12; i++) {
    L.push(
      stem(r, {
        x: between(r, 0, w),
        y: topY + between(r, -h * 0.004, h * 0.035),
        len: between(r, w * 0.05, w * 0.14),
        angle: between(r, -18, 18),
        fill: pick(r, p.greens),
        width: h * 0.006,
      }),
    );
  }
  for (let i = 0; i < 5; i++) {
    L.push(
      bloomAny(r, {
        x: between(r, w * 0.05, w * 0.95),
        y: topY + between(r, -h * 0.005, h * 0.03),
        size: h * between(r, 0.02, 0.035),
        palette: p.petals,
      }),
    );
  }
  return L.join("");
}

/** Un grand bouquet dans son vase, posé sur une table. */
function bouquetVase(r, { w, h, y, p }) {
  const L = [];
  const topY = y + h * 0.09;
  L.push(
    `<rect x="0" y="${n(topY)}" width="${w}" height="${n(h * 0.035)}" fill="${p.woodMid}"/>`,
    `<rect x="0" y="${n(topY + h * 0.035)}" width="${w}" height="${n(h - topY)}" fill="${mix(p.woodDark, p.near, 0.3)}"/>`,
    `<rect x="0" y="${n(topY)}" width="${w}" height="${n(h - topY)}" fill="url(#floorShade)"/>`,
  );

  const vw = w * 0.28;
  const vh = h * 0.22;
  L.push(vase(r, { x: w * 0.5, y: topY, w: vw, h: vh, fill: mix(p.metal, p.wall[1], 0.45), glass: true }));
  L.push(
    bunch(r, {
      x: w * 0.5,
      y: topY - vh,
      h: h * 0.5,
      count: 28,
      spread: 54,
      palette: p.petals,
      greens: p.greens,
      scale: 1.15,
    }),
  );
  // quelques pétales tombés
  for (let i = 0; i < 6; i++) {
    L.push(
      `<ellipse cx="${n(between(r, w * 0.2, w * 0.8))}" cy="${n(topY + between(r, h * 0.005, h * 0.03))}"
         rx="${n(h * between(r, 0.012, 0.022))}" ry="${n(h * between(r, 0.006, 0.011))}"
         transform="rotate(${n(between(r, -40, 40))} ${n(w * 0.5)} ${n(topY)})" fill="${pick(r, p.petals)}" opacity="0.85"/>`,
    );
  }
  return L.join("");
}

/** Arche fleurie, pour les mariages. */
function arche(r, { w, h, y, p }) {
  const L = [];
  L.push(
    `<rect x="0" y="${n(y)}" width="${w}" height="${n(h - y)}" fill="${p.floor}"/>`,
    `<rect x="0" y="${n(y)}" width="${w}" height="${n(h - y)}" fill="url(#floorShade)"/>`,
  );

  const ax = w * 0.5;
  const aw = w * 0.62;
  const ah = h * 0.66;
  const top = y - ah;
  L.push(
    `<path d="M${n(ax - aw / 2)} ${n(y)} L ${n(ax - aw / 2)} ${n(top + ah * 0.28)}
             Q ${n(ax)} ${n(top - ah * 0.06)} ${n(ax + aw / 2)} ${n(top + ah * 0.28)} L ${n(ax + aw / 2)} ${n(y)}"
       fill="none" stroke="${p.woodMid}" stroke-width="${n(w * 0.016)}"/>`,
  );

  // guirlande de fleurs le long de l'arche
  const steps = 34;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let px;
    let py;
    if (t < 0.3) {
      px = ax - aw / 2;
      py = y - (t / 0.3) * ah * 0.72;
    } else if (t > 0.7) {
      px = ax + aw / 2;
      py = y - ((1 - t) / 0.3) * ah * 0.72;
    } else {
      const u = (t - 0.3) / 0.4;
      px = ax - aw / 2 + u * aw;
      py = top + ah * 0.28 - Math.sin(u * Math.PI) * ah * 0.2;
    }
    const size = h * between(r, 0.02, 0.05);
    if (r() > 0.4) {
      L.push(bloomAny(r, { x: px + between(r, -w * 0.03, w * 0.03), y: py + between(r, -h * 0.03, h * 0.03), size, palette: p.petals }));
    } else {
      L.push(
        eucalyptus(r, {
          x: px,
          y: py,
          len: h * between(r, 0.06, 0.12),
          angle: between(r, 0, 360),
          fill: pick(r, p.greens),
        }),
      );
    }
  }

  // gros massifs au pied
  for (const t of [0.5 - 0.31, 0.5 + 0.31]) {
    L.push(
      bunch(r, {
        x: w * t,
        y: y + h * 0.02,
        h: h * 0.26,
        count: 16,
        spread: 62,
        palette: p.petals,
        greens: p.greens,
      }),
    );
  }
  // pétales au sol
  for (let i = 0; i < 14; i++) {
    L.push(
      `<ellipse cx="${n(between(r, 0, w))}" cy="${n(between(r, y + h * 0.02, h))}"
         rx="${n(h * between(r, 0.008, 0.018))}" ry="${n(h * between(r, 0.004, 0.009))}"
         fill="${pick(r, p.petals)}" opacity="${n(between(r, 0.5, 0.85))}"/>`,
    );
  }
  return L.join("");
}

/** Bottes de fleurs séchées, suspendues à une poutre. */
function sechees(r, { w, h, p }) {
  const L = [];
  const beamY = h * 0.13;
  L.push(
    `<rect x="0" y="${n(beamY)}" width="${w}" height="${n(h * 0.05)}" fill="${p.woodMid}"/>`,
    `<rect x="0" y="${n(beamY)}" width="${w}" height="${n(h * 0.05)}" fill="url(#floorShade)"/>`,
    `<rect x="0" y="${n(beamY + h * 0.05)}" width="${w}" height="${n(h * 0.008)}" fill="${p.woodDark}" fill-opacity="0.6"/>`,
  );

  const dried = p.petals.map((c) => mix(c, "#a98a63", 0.5));
  const driedGreens = p.greens.map((c) => mix(c, "#b39c72", 0.5));

  const count = 7;
  for (let i = 0; i < count; i++) {
    const bx = (w / count) * (i + 0.5) + between(r, -w * 0.02, w * 0.02);
    const cord = h * between(r, 0.04, 0.13);
    const bh = h * between(r, 0.34, 0.52);
    const knot = beamY + h * 0.058 + cord;
    L.push(
      `<path d="M${n(bx)} ${n(beamY + h * 0.05)} L ${n(bx)} ${n(beamY + h * 0.058 + cord)}"
         stroke="${mix(p.woodMid, "#e6d3b0", 0.5)}" stroke-width="${n(w * 0.004)}"/>`,
      `<rect x="${n(bx - w * 0.016)}" y="${n(beamY + h * 0.052 + cord)}" width="${n(w * 0.032)}" height="${n(h * 0.022)}"
         rx="${n(h * 0.008)}" fill="${mix(p.woodMid, "#000000", 0.2)}"/>`,
    );
    // la botte pend, tête en bas : elle part du nœud et descend
    L.push(
      `<g transform="translate(${n(bx)} ${n(knot)}) rotate(180)">
         ${bunch(r, {
           x: 0,
           y: 0,
           h: bh,
           count: Math.round(between(r, 11, 17)),
           spread: 26,
           palette: dried,
           greens: driedGreens,
         })}
       </g>`,
    );
  }

  // étagère basse avec bocaux
  const shelfY = h * 0.92;
  L.push(`<rect x="0" y="${n(shelfY)}" width="${w}" height="${n(h - shelfY)}" fill="${p.woodMid}"/>`);
  for (let i = 0; i < 5; i++) {
    const jx = w * (0.1 + i * 0.2);
    const jw = w * between(r, 0.05, 0.075);
    L.push(vase(r, { x: jx, y: shelfY, w: jw, h: jw * between(r, 0.9, 1.3), fill: mix(p.metal, p.wall[1], 0.55), glass: true }));
  }
  return L.join("");
}

/** Étagère de plantes vertes en pots de terre cuite. */
function plantes(r, { w, h, p }) {
  const L = [];
  const shelves = [0.34, 0.62, 0.9];
  L.push(
    `<rect x="${n(w * 0.04)}" y="${n(h * 0.24)}" width="${n(w * 0.035)}" height="${n(h * 0.72)}" fill="${p.woodMid}"/>`,
    `<rect x="${n(w * 0.925)}" y="${n(h * 0.24)}" width="${n(w * 0.035)}" height="${n(h * 0.72)}" fill="${p.woodMid}"/>`,
  );
  for (const s of shelves) {
    const sy = h * s;
    L.push(
      `<rect x="${n(w * 0.02)}" y="${n(sy)}" width="${n(w * 0.96)}" height="${n(h * 0.022)}" fill="${p.woodMid}"/>`,
      `<rect x="${n(w * 0.02)}" y="${n(sy)}" width="${n(w * 0.96)}" height="${n(h * 0.022)}" fill="url(#floorShade)"/>`,
      `<rect x="${n(w * 0.02)}" y="${n(sy + h * 0.022)}" width="${n(w * 0.96)}" height="${n(h * 0.006)}" fill="${p.woodDark}" fill-opacity="0.5"/>`,
    );
    const pots = Math.round(between(r, 3, 5));
    for (let i = 0; i < pots; i++) {
      const px = w * (0.12 + (i + between(r, -0.15, 0.15)) * (0.76 / pots)) + w * 0.06;
      const pw = w * between(r, 0.1, 0.15);
      const ph = pw * between(r, 0.8, 1);
      L.push(pot(r, { x: px, y: sy, w: pw, h: ph, fill: mix(p.petals[4], p.woodMid, 0.35) }));
      // le feuillage qui déborde
      for (let k = 0; k < Math.round(between(r, 5, 9)); k++) {
        const a = between(r, -175, -5);
        const len = ph * between(r, 0.9, 2);
        const fill = pick(r, p.greens);
        const o = { x: px + between(r, -pw * 0.2, pw * 0.2), y: sy - ph * 0.9, len, angle: a, fill };
        L.push(r() > 0.5 ? eucalyptus(r, o) : frond(r, o));
      }
      // quelques retombantes
      if (r() > 0.5) {
        for (let k = 0; k < 3; k++) {
          L.push(
            eucalyptus(r, {
              x: px + between(r, -pw * 0.4, pw * 0.4),
              y: sy + h * 0.02,
              len: h * between(r, 0.06, 0.14),
              angle: between(r, 60, 120),
              fill: pick(r, p.greens),
            }),
          );
        }
      }
    }
  }
  return L.join("");
}

/** Comptoir : caisse, bouquets emballés, sacs kraft. */
function comptoir(r, { w, h, y, p }) {
  const L = [];
  const topY = y - h * 0.02;
  L.push(
    `<rect x="0" y="${n(topY)}" width="${w}" height="${n(h * 0.045)}" fill="${p.woodMid}"/>`,
    `<rect x="0" y="${n(topY + h * 0.045)}" width="${w}" height="${n(h - topY)}" fill="${mix(p.woodDark, p.near, 0.25)}"/>`,
    `<rect x="0" y="${n(topY)}" width="${w}" height="${n(h - topY)}" fill="url(#floorShade)"/>`,
  );
  for (let i = 0; i < 7; i++) {
    L.push(
      `<rect x="${n(w * (0.05 + i * 0.14))}" y="${n(topY + h * 0.045)}" width="${n(w * 0.004)}" height="${n(h - topY)}"
         fill="#000" fill-opacity="0.18"/>`,
    );
  }

  // étagère du fond, vases et bocaux
  const shY = y - h * 0.32;
  L.push(
    `<rect x="${n(w * 0.04)}" y="${n(shY)}" width="${n(w * 0.92)}" height="${n(h * 0.02)}" fill="${p.woodMid}"/>`,
    `<rect x="${n(w * 0.04)}" y="${n(shY)}" width="${n(w * 0.92)}" height="${n(h * 0.02)}" fill="url(#floorShade)"/>`,
  );
  for (let i = 0; i < 6; i++) {
    const vx = w * (0.1 + i * 0.16) + between(r, -w * 0.015, w * 0.015);
    const vw2 = w * between(r, 0.045, 0.075);
    const vh2 = vw2 * between(r, 1, 1.6);
    L.push(vase(r, { x: vx, y: shY, w: vw2, h: vh2, fill: mix(p.metal, p.wall[1], 0.5), glass: r() > 0.4 }));
    if (r() > 0.3) {
      L.push(
        bunch(r, {
          x: vx,
          y: shY - vh2,
          h: vh2 * between(r, 1.2, 1.9),
          count: 7,
          spread: 32,
          palette: p.petals,
          greens: p.greens,
          opacity: 0.95,
          blur: "b3",
        }),
      );
    }
  }

  // bouquets emballés, couchés
  for (const t of [0.16, 0.35]) {
    const ww = w * 0.26;
    L.push(
      `<g transform="translate(${n(w * t)} ${n(topY)}) rotate(${n(between(r, -14, -4))})">
         ${wrap(r, { x: 0, y: 0, w: ww, h: h * 0.22, fill: mix(p.woodMid, "#e8cda3", 0.55) })}
         ${bunch(r, { x: 0, y: -h * 0.22, h: h * 0.3, count: 14, spread: 36, palette: p.petals, greens: p.greens })}
       </g>`,
    );
  }

  // caisse enregistreuse
  L.push(
    `<g transform="translate(${n(w * 0.72)} ${n(topY)})">
       <rect x="${n(-w * 0.1)}" y="${n(-h * 0.11)}" width="${n(w * 0.2)}" height="${n(h * 0.11)}" rx="${n(h * 0.008)}" fill="${mix(p.metal, p.near, 0.45)}"/>
       <rect x="${n(-w * 0.075)}" y="${n(-h * 0.175)}" width="${n(w * 0.12)}" height="${n(h * 0.07)}" rx="${n(h * 0.006)}" fill="${mix(p.metal, p.near, 0.3)}"/>
       <rect x="${n(-w * 0.062)}" y="${n(-h * 0.165)}" width="${n(w * 0.094)}" height="${n(h * 0.045)}" fill="${mix(p.glow, p.greens[1], 0.4)}" fill-opacity="0.8"/>
       <rect x="${n(-w * 0.09)}" y="${n(-h * 0.055)}" width="${n(w * 0.14)}" height="${n(h * 0.03)}" rx="${n(h * 0.004)}" fill="${p.near}" fill-opacity="0.35"/>
     </g>`,
  );

  // sacs kraft
  for (const t of [0.9, 0.97]) {
    const bw = w * 0.09;
    L.push(
      `<g transform="translate(${n(w * t)} ${n(topY)})">
         <rect x="${n(-bw / 2)}" y="${n(-bw * 1.3)}" width="${n(bw)}" height="${n(bw * 1.3)}" fill="${mix(p.woodMid, "#e5cba2", 0.5)}"/>
         <rect x="${n(-bw / 2)}" y="${n(-bw * 1.3)}" width="${n(bw * 0.3)}" height="${n(bw * 1.3)}" fill="#fff" fill-opacity="0.14"/>
         <path d="M${n(-bw * 0.26)} ${n(-bw * 1.3)} q ${n(bw * 0.26)} ${n(-bw * 0.34)} ${n(bw * 0.52)} 0"
           fill="none" stroke="${mix(p.woodDark, "#000000", 0.2)}" stroke-width="${n(bw * 0.05)}"/>
       </g>`,
    );
  }

  // petit vase et sa fleur unique
  L.push(vase(r, { x: w * 0.53, y: topY, w: w * 0.05, h: h * 0.09, fill: mix(p.metal, p.wall[1], 0.4), glass: true }));
  L.push(
    bunch(r, { x: w * 0.53, y: topY - h * 0.09, h: h * 0.11, count: 4, spread: 22, palette: p.petals, greens: p.greens }),
  );
  return L.join("");
}

const SETS = { devanture, etal, atelier, bouquetVase, arche, sechees, plantes, comptoir };

/* ------------------------------------------------------------ composition */

function scene({ w, h, seed, mood = "matin", set = "devanture", density = 1 }) {
  const r = rng(seed);
  const p = MOODS[mood];
  const defs = [];
  const L = [];
  const horizon = h * between(r, 0.72, 0.79);

  // le mur du fond et sa lumière
  L.push(`<rect width="${w}" height="${h}" fill="url(#wall)"/>`);
  L.push(
    `<ellipse cx="${n(w * between(r, 0.25, 0.75))}" cy="${n(h * between(r, 0.06, 0.24))}" rx="${n(w * 0.6)}" ry="${n(h * 0.5)}" fill="url(#glow)"/>`,
  );

  // feuillage lointain, presque fondu — la profondeur de la boutique
  for (let i = 0; i < Math.round(14 * density); i++) {
    const fill = vary(r, mix(p.greens[1], p.haze, 0.6), p.wall[1], 0.25);
    const o = {
      x: between(r, -w * 0.1, w * 1.1),
      y: between(r, h * 0.02, horizon * 0.9),
      len: between(r, w * 0.1, w * 0.26),
      angle: between(r, -180, 180),
      fill,
      opacity: between(r, 0.4, 0.7),
      blur: "b4",
    };
    L.push(r() > 0.5 ? eucalyptus(r, o) : frond(r, o));
  }
  L.push(`<rect width="${w}" height="${h}" fill="${p.haze}" opacity="0.18"/>`);

  // le décor
  L.push(SETS[set](r, { w, h, y: horizon, p }));

  // rais de lumière
  for (let i = 0; i < 4; i++) {
    const rx = between(r, -w * 0.25, w);
    L.push(
      `<path d="M${n(rx)} ${n(-h * 0.1)} L ${n(rx + w * between(r, 0.06, 0.16))} ${n(-h * 0.1)} L ${n(rx + w * 0.42)} ${n(h * 1.1)} L ${n(rx + w * 0.22)} ${n(h * 1.1)} Z"
         fill="${p.ray}" opacity="${n(between(r, p.rayOpacity * 0.4, p.rayOpacity))}" filter="url(#b5)"/>`,
    );
  }

  // avant-plan flou : quelques corolles et feuillages hors focale
  const corners = [
    { x: w * between(r, 0, 0.2), y: h * between(r, 0, 0.12), a: 118 },
    { x: w * between(r, 0.8, 1), y: h * between(r, 0, 0.14), a: -118 },
    { x: w * between(r, 0, 0.12), y: h * between(r, 0.82, 1), a: 32 },
    { x: w * between(r, 0.88, 1), y: h * between(r, 0.8, 1), a: -32 },
  ];
  for (const c of corners) {
    const fill = vary(r, mix(p.greens[2], p.near, 0.45), p.greens[0], 0.4);
    const o = { x: c.x, y: c.y, len: between(r, w * 0.16, w * 0.34), angle: c.a + between(r, -30, 30), fill, opacity: between(r, 0.85, 0.97), blur: "b2" };
    L.push(r() > 0.45 ? eucalyptus(r, o) : frond(r, o));
    if (r() > 0.45) {
      L.push(
        bloomAny(r, {
          x: c.x + between(r, -w * 0.05, w * 0.05),
          y: c.y + between(r, -h * 0.05, h * 0.05),
          size: between(r, w * 0.035, w * 0.075),
          palette: p.petals.map((cc) => mix(cc, p.near, 0.3)),
          opacity: 0.8,
          blur: "b2",
        }),
      );
    }
  }

  L.push(`<rect width="${w}" height="${h}" fill="url(#vignette)"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="wall" x1="0.15" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${p.wall[0]}"/>
      <stop offset="0.34" stop-color="${p.wall[1]}"/>
      <stop offset="0.72" stop-color="${p.wall[2]}"/>
      <stop offset="1" stop-color="${p.wall[3]}"/>
    </linearGradient>
    <radialGradient id="glow">
      <stop offset="0" stop-color="${p.glow}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${p.glow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="floorShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </linearGradient>
    <linearGradient id="wallShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.3"/>
      <stop offset="0.55" stop-color="#000" stop-opacity="0.02"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.35"/>
    </linearGradient>
    <linearGradient id="awningShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.4"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="glassLight" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.34"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.3"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.44" r="0.8">
      <stop offset="0.4" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.5"/>
    </radialGradient>
    <filter id="b2" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${n(w * 0.004)}"/></filter>
    <filter id="b3" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${n(w * 0.005)}"/></filter>
    <filter id="b4" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${n(w * 0.013)}"/></filter>
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
    const v = 128 + Math.round((nr() + nr() + nr() - 1.5) * 30);
    noise[i] = noise[i + 1] = noise[i + 2] = v < 0 ? 0 : v > 255 ? 255 : v;
  }

  return base
    .composite([{ input: noise, raw: { width: T, height: T, channels: 3 }, tile: true, blend: "soft-light" }])
    .modulate({ saturation: 1.05, brightness: 1.03 })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
}

/* ------------------------------------------------------------------ sortie */

const IMAGES = [
  { file: "hero", w: 2400, h: 1500, seed: 21044, mood: "matin", set: "devanture", density: 1.1 },
  { file: "offre-bouquet", w: 1200, h: 1500, seed: 3312, mood: "boutique", set: "bouquetVase", density: 1 },
  { file: "offre-abonnement", w: 1200, h: 1500, seed: 5527, mood: "matin", set: "comptoir", density: 1 },
  { file: "offre-evenements", w: 1200, h: 1500, seed: 7741, mood: "soir", set: "arche", density: 1 },
  { file: "gallery-1", w: 1600, h: 1100, seed: 31018, mood: "boutique", set: "etal", density: 1.05 },
  { file: "gallery-2", w: 1100, h: 1500, seed: 42027, mood: "boutique", set: "sechees", density: 0.9 },
  { file: "gallery-3", w: 1600, h: 1100, seed: 53136, mood: "matin", set: "atelier", density: 1 },
  { file: "gallery-4", w: 1100, h: 1500, seed: 64245, mood: "serre", set: "plantes", density: 0.9 },
  { file: "gallery-5", w: 1600, h: 1100, seed: 75354, mood: "serre", set: "bouquetVase", density: 1 },
  { file: "gallery-6", w: 1600, h: 1100, seed: 86463, mood: "soir", set: "devanture", density: 1 },
  { file: "cta", w: 2200, h: 1300, seed: 12074, mood: "soir", set: "etal", density: 1.05 },
  { file: "atelier", w: 1300, h: 1600, seed: 44086, mood: "matin", set: "atelier", density: 1.1 },
  { file: "og", w: 1200, h: 630, seed: 21044, mood: "matin", set: "devanture", density: 1 },
];

const only = process.argv.slice(2);

await mkdir(OUT, { recursive: true });
for (const spec of IMAGES.filter((s) => only.length === 0 || only.includes(s.file))) {
  const buf = await render(spec);
  await writeFile(path.join(OUT, `${spec.file}.jpg`), buf);
  console.log(`✓ ${spec.file}.jpg  ${spec.w}×${spec.h}  ${(buf.length / 1024).toFixed(0)} Ko`);
}
