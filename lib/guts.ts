import * as THREE from "three";
import { buildSculptedHead } from "./gutsHead";

/**
 * Procedural Guts figurine (Berserk), built from primitives.
 * Units are meters; feet rest at y = 0 of the figure group, which sits on the base.
 * Facing +Z. Guts' right side is -X, his left (prosthetic) side is +X.
 */

export type Pose = "repos" | "combat";

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------ */
/* Textures & materials                                                */
/* ------------------------------------------------------------------ */

function noiseTexture(size: number, seed: number, scratches: number): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const rng = mulberry32(seed);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 150 + (rng() - 0.5) * 90;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // dents / blotches
  for (let i = 0; i < 60; i++) {
    g.fillStyle = rng() > 0.5 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
    g.beginPath();
    g.arc(rng() * size, rng() * size, 4 + rng() * 26, 0, Math.PI * 2);
    g.fill();
  }
  // scratches
  for (let i = 0; i < scratches; i++) {
    g.strokeStyle = rng() > 0.4 ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.35)";
    g.lineWidth = 0.5 + rng() * 1.5;
    g.beginPath();
    const x = rng() * size;
    const y = rng() * size;
    const a = rng() * Math.PI * 2;
    const l = 10 + rng() * 60;
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function makeMaterials() {
  const grunge = noiseTexture(256, 7, 120);
  const bladeNoise = noiseTexture(512, 21, 400);
  if (bladeNoise) bladeNoise.repeat.set(1, 4);

  return {
    armor: new THREE.MeshStandardMaterial({
      color: 0x1b1c20,
      metalness: 0.75,
      roughness: 0.58,
      flatShading: true,
      roughnessMap: grunge ?? undefined,
      name: "armure",
    }),
    armorEdge: new THREE.MeshStandardMaterial({
      color: 0x232428,
      metalness: 0.8,
      roughness: 0.42,
      flatShading: true,
      name: "armure_bord",
    }),
    cloth: new THREE.MeshStandardMaterial({
      color: 0x070708,
      metalness: 0,
      roughness: 1,
      side: THREE.DoubleSide,
      bumpMap: grunge ?? undefined,
      bumpScale: 1.5,
      name: "cape",
    }),
    under: new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.9, name: "tissu" }),
    leather: new THREE.MeshStandardMaterial({ color: 0x2b211a, roughness: 0.75, name: "cuir" }),
    skin: new THREE.MeshStandardMaterial({ color: 0xc19479, roughness: 0.62, name: "peau" }),
    hair: new THREE.MeshStandardMaterial({ color: 0x0b0a0a, roughness: 0.7, flatShading: true, name: "cheveux" }),
    dark: new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 0.6, name: "noir" }),
    scar: new THREE.MeshStandardMaterial({ color: 0x8a5a4c, roughness: 0.7, name: "cicatrice" }),
    steel: new THREE.MeshStandardMaterial({
      color: 0x6c7076,
      metalness: 1,
      roughness: 0.32,
      flatShading: true,
      roughnessMap: grunge ?? undefined,
      name: "prothese",
    }),
    blade: new THREE.MeshStandardMaterial({
      color: 0x8b8e93,
      metalness: 0.92,
      roughness: 0.55,
      roughnessMap: bladeNoise ?? undefined,
      bumpMap: bladeNoise ?? undefined,
      bumpScale: 1.2,
      name: "dragon_slayer",
    }),
    rock: new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.95,
      flatShading: true,
      bumpMap: grunge ?? undefined,
      bumpScale: 3,
      name: "roche",
    }),
    plinth: new THREE.MeshStandardMaterial({ color: 0x0a0a0b, metalness: 0.3, roughness: 0.35, name: "socle" }),
    blood: new THREE.MeshStandardMaterial({ color: 0x3a0506, roughness: 0.4, name: "sang" }),
  };
}

type Mats = ReturnType<typeof makeMaterials>;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, parent?: THREE.Object3D, name?: string) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  if (name) m.name = name;
  parent?.add(m);
  return m;
}

/** Armored limb segment hanging along -Y from the group origin. */
function armoredSegment(
  parent: THREE.Object3D,
  mats: Mats,
  len: number,
  r0: number,
  r1: number,
  plates: number,
  plateMat: THREE.Material,
) {
  mesh(new THREE.CylinderGeometry(r0 * 0.9, r1 * 0.9, len, 10), mats.under, parent).position.y = -len / 2;
  for (let i = 0; i < plates; i++) {
    const t0 = i / plates;
    const t1 = (i + 1) / plates;
    const h = (len / plates) * 1.12;
    const ra = lerp(r0, r1, t0) * 1.08;
    const rb = lerp(r0, r1, t1) * 1.0;
    const p = mesh(new THREE.CylinderGeometry(ra, rb, h, 9), plateMat, parent);
    p.position.y = -lerp(0, len, (t0 + t1) / 2);
  }
}

/** Spiky cap (shell layer) used for pauldrons and knee/elbow cops. */
function shell(r: number, mat: THREE.Material, open = 2.1) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, Math.PI / open), mat);
}

/* ------------------------------------------------------------------ */
/* Cape                                                                */
/* ------------------------------------------------------------------ */

type CapeOpts = {
  thetaMin: number;
  thetaMax: number;
  strips: number;
  rTop: number;
  rBot: number;
  lenMin: number;
  lenMax: number;
  yTop: number;
  zScale: number;
  rows: number;
  sway: number;
  centerBias: number;
};

/** Shredded cloak made of many overlapping, pointed strips wrapped around the back. */
function capeGeometry(rng: Rng, o: CapeOpts) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const cols = 3;
  const span = o.thetaMax - o.thetaMin;
  for (let s = 0; s < o.strips; s++) {
    const u = (s + 0.5) / o.strips;
    const thC = o.thetaMin + span * u + (rng() - 0.5) * (span / o.strips) * 0.6;
    const hw = (span / o.strips) * (0.8 + rng() * 0.3);
    const centre = 1 - Math.abs(u - 0.5) * 2; // 1 at the back, 0 at the sides
    const L = lerp(o.lenMin, o.lenMax, rng() * (1 - o.centerBias) + centre * o.centerBias);
    const layer = rng() * 0.02;
    const phase = rng() * 10;
    const base = pos.length / 3;
    for (let r = 0; r <= o.rows; r++) {
      const t = r / o.rows;
      const y = o.yTop - t * L;
      const taper = t > 0.62 ? Math.pow(Math.max(0, 1 - (t - 0.62) / 0.38), 0.9) : 1;
      for (let c = 0; c < cols; c++) {
        const k = c - 1;
        const th = thC + k * hw * Math.max(taper, 0.03) + Math.sin(t * 7 + phase) * 0.03 * t;
        const drop = (o.yTop - y) / o.lenMax;
        let R = lerp(o.rTop, o.rBot, Math.pow(drop, 0.8)) + layer;
        R += Math.sin(th * 13 + phase) * 0.018 * drop + (k === 0 ? 0.012 : 0) * drop;
        const x = Math.sin(th) * R;
        const z = -Math.cos(th) * R * o.zScale - o.sway * t * t * centre;
        pos.push(x, y, z);
        uv.push(c / (cols - 1), t);
      }
    }
    for (let r = 0; r < o.rows; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const a = base + r * cols + c;
        const b = a + 1;
        const d = a + cols;
        const e = d + 1;
        idx.push(a, d, b, b, d, e);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ */
/* Dragon Slayer                                                        */
/* ------------------------------------------------------------------ */

/** Sword with its origin at the middle of the grip, blade along +Y, flat faces along ±Z. */
function buildDragonSlayer(mats: Mats, rng: Rng) {
  const g = new THREE.Group();
  g.name = "DragonSlayer";
  const bladeLen = 1.62;
  const w = 0.13; // half width
  const shape = new THREE.Shape();
  shape.moveTo(-w, 0);
  shape.lineTo(w, 0);
  shape.lineTo(w, bladeLen - 0.24);
  shape.lineTo(w * 0.15, bladeLen);
  shape.lineTo(-w, bladeLen - 0.1);
  shape.lineTo(-w, 0);
  const blade = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
    curveSegments: 1,
  });
  blade.translate(0, 0, -0.015);
  // map UVs roughly along the length for the grain texture
  const bladeMesh = mesh(blade, mats.blade, g, "lame");
  bladeMesh.position.y = 0.2;

  // chips on the edges
  for (let i = 0; i < 9; i++) {
    const nick = mesh(new THREE.BoxGeometry(0.03 + rng() * 0.03, 0.025, 0.07), mats.dark, g);
    const side = rng() > 0.5 ? 1 : -1;
    nick.position.set(side * (w + 0.008), 0.35 + rng() * 1.1, 0);
    nick.rotation.z = (rng() - 0.5) * 0.8;
  }
  // rivet/disc near the ricasso (as on the detail panel)
  const disc = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 16), mats.armorEdge, g, "rivet");
  disc.rotation.x = Math.PI / 2;
  disc.position.y = 0.3;
  const discInner = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.065, 12), mats.dark, g);
  discInner.rotation.x = Math.PI / 2;
  discInner.position.y = 0.3;
  // stains
  for (let i = 0; i < 6; i++) {
    const s = mesh(new THREE.BoxGeometry(0.015 + rng() * 0.05, 0.006 + rng() * 0.02, 0.061), mats.blood, g);
    s.position.set((rng() - 0.5) * 0.18, 0.6 + rng() * 0.9, 0);
    s.rotation.z = rng() * Math.PI;
  }

  // crossguard
  const guard = mesh(new THREE.BoxGeometry(0.34, 0.07, 0.09), mats.armorEdge, g, "garde");
  guard.position.y = 0.19;
  const guardCap = mesh(new THREE.BoxGeometry(0.36, 0.025, 0.1), mats.armor, g);
  guardCap.position.y = 0.23;
  // grip with leather wrap rings
  mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.36, 10), mats.leather, g, "poignee").position.y = 0;
  for (let i = 0; i < 9; i++) {
    const ring = mesh(new THREE.TorusGeometry(0.031, 0.007, 5, 12), mats.dark, g);
    ring.rotation.x = Math.PI / 2 + (i % 2 ? 0.25 : -0.25);
    ring.position.y = -0.15 + i * 0.037;
  }
  const pommel = mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.07, 8), mats.armorEdge, g, "pommeau");
  pommel.position.y = -0.21;
  // hanging cord at the pommel
  const cord = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 5), mats.leather, g);
  cord.position.set(0.03, -0.3, 0);
  cord.rotation.z = 0.3;
  return g;
}

/* ------------------------------------------------------------------ */
/* Arms                                                                */
/* ------------------------------------------------------------------ */

const UPPER = 0.3;
const FORE = 0.28;

function buildHand(mats: Mats, mat: THREE.Material, fist: boolean) {
  const hand = new THREE.Group();
  hand.name = "main";
  const palm = mesh(new THREE.BoxGeometry(0.085, 0.09, 0.05), mat, hand);
  palm.position.y = -0.045;
  for (let f = 0; f < 4; f++) {
    const finger = new THREE.Group();
    finger.position.set(-0.03 + f * 0.02, -0.09, 0);
    hand.add(finger);
    const s1 = mesh(new THREE.BoxGeometry(0.018, 0.04, 0.022), mat, finger);
    s1.position.y = -0.02;
    finger.rotation.x = fist ? 1.5 : 0.3;
    const knuckle = mesh(new THREE.BoxGeometry(0.02, 0.012, 0.024), mats.armorEdge, finger);
    knuckle.position.y = -0.002;
    const s2 = mesh(new THREE.BoxGeometry(0.017, 0.035, 0.02), mat, finger);
    s2.position.set(0, -0.045, fist ? -0.012 : 0.004);
    s2.rotation.x = fist ? 1.2 : 0.2;
  }
  const thumb = mesh(new THREE.BoxGeometry(0.02, 0.05, 0.022), mat, hand);
  thumb.position.set(0.045, -0.05, 0.02);
  thumb.rotation.z = 0.6;
  thumb.rotation.x = fist ? 0.8 : 0.2;
  return hand;
}

function buildArm(mats: Mats, side: 1 | -1, rng: Rng) {
  // side: -1 = right arm (armored), +1 = left arm (prosthetic)
  const prosthetic = side === 1;
  const shoulder = new THREE.Group();
  shoulder.name = prosthetic ? "bras_gauche" : "bras_droit";

  // pauldron: layered shells
  for (let i = 0; i < 3; i++) {
    const s = shell(0.105 - i * 0.012 + 0.02 * i, i === 0 ? mats.armor : mats.armorEdge, 2.0);
    s.castShadow = true;
    s.position.set(side * (0.01 + i * 0.012), 0.03 - i * 0.045, 0);
    s.rotation.z = side * -(0.35 + i * 0.25);
    s.scale.set(1.05, 0.75, 1.0);
    shoulder.add(s);
  }
  // spikes on pauldron
  for (let i = 0; i < 3; i++) {
    const sp = mesh(new THREE.ConeGeometry(0.012, 0.05, 4), mats.armorEdge, shoulder);
    sp.position.set(side * (0.03 + i * 0.025), 0.1 - i * 0.03, -0.03 + i * 0.03);
    sp.rotation.z = side * -(0.5 + i * 0.2);
  }

  const upper = new THREE.Group();
  shoulder.add(upper);
  armoredSegment(upper, mats, UPPER, 0.072, 0.062, 4, mats.armor);

  const elbow = new THREE.Group();
  elbow.position.y = -UPPER;
  upper.add(elbow);
  const cop = shell(0.05, prosthetic ? mats.steel : mats.armorEdge, 1.6);
  cop.rotation.x = -Math.PI / 2;
  cop.position.z = -0.015;
  cop.castShadow = true;
  elbow.add(cop);

  if (prosthetic) {
    // iron prosthetic forearm: segmented steel with rivets, flared cuff
    mesh(new THREE.CylinderGeometry(0.058, 0.05, FORE, 10), mats.steel, elbow).position.y = -FORE / 2;
    for (let i = 0; i < 5; i++) {
      const ring = mesh(new THREE.CylinderGeometry(0.063 - i * 0.002, 0.063 - i * 0.002, 0.018, 10), mats.steel, elbow);
      ring.position.y = -0.03 - i * 0.055;
      for (let r = 0; r < 6; r++) {
        const a = (r / 6) * Math.PI * 2 + i * 0.3;
        const rivet = mesh(new THREE.SphereGeometry(0.006, 5, 4), mats.armorEdge, elbow);
        rivet.position.set(Math.sin(a) * 0.064, ring.position.y, Math.cos(a) * 0.064);
      }
    }
    // cannon muzzle hint along the forearm
    const barrel = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.2, 8), mats.armorEdge, elbow);
    barrel.position.set(0, -0.14, 0.06);
  } else {
    armoredSegment(elbow, mats, FORE, 0.064, 0.054, 4, mats.armor);
    // gauntlet flare
    const flare = mesh(new THREE.CylinderGeometry(0.058, 0.07, 0.07, 9), mats.armorEdge, elbow);
    flare.position.y = -FORE + 0.04;
  }

  const wrist = new THREE.Group();
  wrist.position.y = -FORE;
  elbow.add(wrist);
  const hand = buildHand(mats, prosthetic ? mats.steel : mats.armor, true);
  wrist.add(hand);

  void rng;
  return { shoulder, upper, elbow, wrist };
}

/** Two-bone IK in the shoulder parent's space. Limbs point along -Y at rest. */
function solveArm(
  arm: { shoulder: THREE.Group; upper: THREE.Group; elbow: THREE.Group },
  target: THREE.Vector3,
  pole: THREE.Vector3,
) {
  const S = arm.shoulder.position.clone();
  const toT = target.clone().sub(S);
  const d = Math.min(toT.length(), (UPPER + FORE) * 0.995);
  const dir = toT.normalize();
  const cosA = (UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const p = pole.clone().sub(S);
  p.addScaledVector(dir, -p.dot(dir)).normalize();
  const upperDir = dir.clone().multiplyScalar(cosA).addScaledVector(p, sinA).normalize();
  const E = S.clone().addScaledVector(upperDir, UPPER);
  const T = S.clone().addScaledVector(dir, d);
  const foreDir = T.clone().sub(E).normalize();
  const down = new THREE.Vector3(0, -1, 0);
  arm.shoulder.quaternion.identity();
  arm.upper.quaternion.setFromUnitVectors(down, upperDir);
  const local = foreDir.clone().applyQuaternion(arm.upper.quaternion.clone().invert());
  arm.elbow.quaternion.setFromUnitVectors(down, local);
}

/* ------------------------------------------------------------------ */
/* Legs                                                                */
/* ------------------------------------------------------------------ */

function buildLeg(mats: Mats, side: 1 | -1) {
  const hip = new THREE.Group();
  hip.name = side === 1 ? "jambe_gauche" : "jambe_droite";
  const THIGH = 0.46;
  const SHIN = 0.45;
  armoredSegment(hip, mats, THIGH, 0.11, 0.085, 4, mats.armor);
  const knee = new THREE.Group();
  knee.position.y = -THIGH;
  hip.add(knee);
  const poleyn = shell(0.07, mats.armorEdge, 1.7);
  poleyn.rotation.x = Math.PI / 2;
  poleyn.position.z = 0.03;
  poleyn.castShadow = true;
  knee.add(poleyn);
  const kneeSpike = mesh(new THREE.ConeGeometry(0.015, 0.05, 4), mats.armorEdge, knee);
  kneeSpike.rotation.x = Math.PI / 2;
  kneeSpike.position.z = 0.1;
  armoredSegment(knee, mats, SHIN, 0.088, 0.07, 5, mats.armor);
  // greave front plate
  const greave = mesh(new THREE.BoxGeometry(0.1, SHIN * 0.8, 0.03), mats.armorEdge, knee);
  greave.position.set(0, -SHIN * 0.48, 0.065);
  greave.rotation.x = -0.05;
  const ankle = new THREE.Group();
  ankle.position.y = -SHIN;
  knee.add(ankle);
  // boot
  const boot = mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), mats.armor, ankle, "botte");
  boot.position.set(0, -0.045, 0.05);
  const toe = mesh(new THREE.SphereGeometry(0.062, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mats.armorEdge, ankle);
  toe.scale.set(1, 0.7, 1.2);
  toe.position.set(0, -0.08, 0.14);
  const sole = mesh(new THREE.BoxGeometry(0.13, 0.02, 0.27), mats.leather, ankle);
  sole.position.set(0, -0.085, 0.055);
  const cuff = mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.07, 9), mats.armorEdge, ankle);
  cuff.position.y = 0.01;
  return { hip, knee, ankle, THIGH, SHIN };
}

/* ------------------------------------------------------------------ */
/* Torso                                                               */
/* ------------------------------------------------------------------ */

function buildTorso(mats: Mats, rng: Rng) {
  const spine = new THREE.Group();
  spine.name = "torse";

  // bulk
  const chest = mesh(new THREE.SphereGeometry(0.2, 14, 10), mats.under, spine);
  chest.scale.set(1.45, 1.35, 0.9);
  chest.position.y = 0.3;

  // breastplate lames (stacked elliptical rings)
  const lames = 7;
  for (let i = 0; i < lames; i++) {
    const t = i / (lames - 1);
    const y = lerp(0.47, 0.06, t);
    const rx = lerp(0.29, 0.2, Math.pow(t, 0.9));
    const ring = mesh(new THREE.CylinderGeometry(rx * 1.02, rx * 0.97, 0.075, 14), i % 2 ? mats.armorEdge : mats.armor, spine);
    ring.scale.z = 0.62;
    ring.position.y = y;
  }
  // pectoral plates
  for (const s of [-1, 1]) {
    const pec = mesh(new THREE.SphereGeometry(0.12, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.armor, spine);
    pec.scale.set(1.0, 0.6, 0.55);
    pec.rotation.x = Math.PI / 2 - 0.2;
    pec.position.set(s * 0.1, 0.38, 0.12);
    // scale-like overlapping plates on the flank
    for (let k = 0; k < 3; k++) {
      const fl = mesh(new THREE.BoxGeometry(0.06, 0.09, 0.2), mats.armorEdge, spine);
      fl.position.set(s * (0.22 - k * 0.01), 0.3 - k * 0.08, 0);
      fl.rotation.z = s * 0.15;
    }
  }
  // sternum ridge + gorget
  const ridge = mesh(new THREE.BoxGeometry(0.03, 0.34, 0.03), mats.armor, spine);
  ridge.position.set(0, 0.28, 0.17);
  ridge.rotation.x = -0.08;
  const gorget = mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.09, 10), mats.armor, spine, "gorgerin");
  gorget.position.y = 0.53;
  gorget.scale.z = 0.85;
  // back plate spine ridges (Berserker armor's reptilian look)
  for (let i = 0; i < 6; i++) {
    const sp = mesh(new THREE.ConeGeometry(0.018, 0.05, 4), mats.armorEdge, spine);
    sp.position.set(0, 0.45 - i * 0.07, -0.13);
    sp.rotation.x = -Math.PI / 2 - 0.4;
  }
  // belt with pouches
  const belt = mesh(new THREE.CylinderGeometry(0.205, 0.21, 0.06, 16), mats.leather, spine, "ceinture");
  belt.scale.z = 0.7;
  belt.position.y = 0.0;
  const buckle = mesh(new THREE.BoxGeometry(0.06, 0.05, 0.02), mats.steel, spine);
  buckle.position.set(0, 0.0, 0.15);
  for (let i = 0; i < 4; i++) {
    const a = -1.3 + i * 0.8 + (rng() - 0.5) * 0.1;
    if (Math.abs(a) < 0.3) continue;
    const pouch = mesh(new THREE.BoxGeometry(0.06, 0.07, 0.04), mats.leather, spine, "sacoche");
    pouch.position.set(Math.sin(a) * 0.21, -0.03, Math.cos(a) * 0.15);
    pouch.rotation.y = a;
  }
  // back straps holding the sword
  const strap = mesh(new THREE.BoxGeometry(0.04, 0.62, 0.012), mats.leather, spine, "sangle");
  strap.position.set(0, 0.26, 0.162);
  strap.rotation.z = 0.62;
  strap.rotation.x = -0.1;
  const strapBack = mesh(new THREE.BoxGeometry(0.045, 0.62, 0.012), mats.leather, spine);
  strapBack.position.set(0, 0.26, -0.135);
  strapBack.rotation.z = -0.62;

  return spine;
}

function buildHips(mats: Mats) {
  const hips = new THREE.Group();
  hips.name = "bassin";
  const pelvis = mesh(new THREE.SphereGeometry(0.19, 12, 8), mats.under, hips);
  pelvis.scale.set(1.05, 0.65, 0.75);
  // tassets: hanging plates around the hips
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * 0.85 + (i / (n - 1)) * Math.PI * 1.7;
    const g = new THREE.Group();
    g.position.set(Math.sin(a) * 0.2, -0.02, Math.cos(a) * 0.15);
    g.rotation.y = a;
    hips.add(g);
    for (let k = 0; k < 3; k++) {
      const p = mesh(new THREE.BoxGeometry(0.11, 0.07, 0.018), k % 2 ? mats.armorEdge : mats.armor, g);
      p.position.set(0, -0.03 - k * 0.055, 0.01 + k * 0.012);
      p.rotation.x = -0.18;
    }
  }
  const cod = mesh(new THREE.BoxGeometry(0.1, 0.12, 0.03), mats.armor, hips);
  cod.position.set(0, -0.08, 0.16);
  return hips;
}

/* ------------------------------------------------------------------ */
/* Base                                                                */
/* ------------------------------------------------------------------ */

function nameplateTexture() {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0a0a0b";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#b8b2a6";
  g.font = "600 64px Georgia, 'Times New Roman', serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("G U T S", c.width / 2, 52);
  g.font = "italic 26px Georgia, serif";
  g.fillStyle = "#7c766c";
  g.fillText("Le Guerrier Noir", c.width / 2, 102);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildBase(mats: Mats, rng: Rng) {
  const base = new THREE.Group();
  base.name = "socle";
  const plinth = mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.1, 64), mats.plinth, base, "socle_noir");
  plinth.position.y = 0.05;
  const lip = mesh(new THREE.CylinderGeometry(0.635, 0.635, 0.012, 64), mats.armorEdge, base);
  lip.position.y = 0.1;

  // nameplate on the front
  const tex = nameplateTexture();
  const plate = mesh(
    new THREE.CylinderGeometry(0.662, 0.662, 0.06, 48, 1, true, -0.55, 1.1),
    new THREE.MeshStandardMaterial({ map: tex ?? undefined, color: tex ? 0xffffff : 0x0a0a0b, roughness: 0.4, metalness: 0.2, name: "plaque" }),
    base,
    "plaque",
  );
  plate.position.y = 0.05;

  // rocky ground
  const rockGeo = new THREE.CylinderGeometry(0.55, 0.6, 0.1, 40, 3);
  const p = rockGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y > 0.04) p.setY(i, y + (rng() - 0.5) * 0.04);
    const x = p.getX(i);
    const z = p.getZ(i);
    const r = 1 + (rng() - 0.5) * 0.08;
    p.setX(i, x * r);
    p.setZ(i, z * r);
  }
  rockGeo.computeVertexNormals();
  const rock = mesh(rockGeo, mats.rock, base, "roche");
  rock.position.y = 0.155;
  // debris, broken swords & stones
  for (let i = 0; i < 16; i++) {
    const s = mesh(new THREE.DodecahedronGeometry(0.02 + rng() * 0.05, 0), mats.rock, base);
    const a = rng() * Math.PI * 2;
    const r = 0.3 + rng() * 0.22;
    s.position.set(Math.cos(a) * r, 0.21, Math.sin(a) * r);
    s.rotation.set(rng() * 3, rng() * 3, rng() * 3);
  }
  // a broken blade stuck in the ground
  const broken = mesh(new THREE.BoxGeometry(0.04, 0.22, 0.008), mats.blade, base);
  broken.position.set(0.38, 0.28, -0.22);
  broken.rotation.set(0.2, 0.6, -0.35);
  // a skull
  const skull = mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: 0x9c948a, roughness: 0.8 }), base, "crane_sol");
  skull.scale.set(1, 0.85, 1.15);
  skull.position.set(-0.36, 0.225, 0.22);
  // blood pools
  for (let i = 0; i < 3; i++) {
    const pool = mesh(new THREE.CircleGeometry(0.04 + rng() * 0.05, 12), mats.blood, base);
    pool.rotation.x = -Math.PI / 2;
    const a = rng() * Math.PI * 2;
    pool.position.set(Math.cos(a) * 0.3, 0.207, Math.sin(a) * 0.3);
  }
  return { base, topY: 0.205 };
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

export function buildGuts(pose: Pose = "repos") {
  const rng = mulberry32(1990);
  const mats = makeMaterials();
  const root = new THREE.Group();
  root.name = "Guts";

  const { base, topY } = buildBase(mats, rng);
  root.add(base);

  const figure = new THREE.Group();
  figure.name = "figurine";
  figure.position.y = topY;
  root.add(figure);

  const HIP_Y = 1.02;
  const hips = buildHips(mats);
  hips.position.y = HIP_Y;
  figure.add(hips);

  const legR = buildLeg(mats, -1);
  const legL = buildLeg(mats, 1);
  legR.hip.position.set(-0.12, -0.04, 0);
  legL.hip.position.set(0.12, -0.04, 0);
  hips.add(legR.hip, legL.hip);

  const spine = buildTorso(mats, rng);
  spine.position.y = 0.06;
  hips.add(spine);

  const neck = new THREE.Group();
  neck.position.y = 0.53;
  spine.add(neck);
  mesh(new THREE.CylinderGeometry(0.058, 0.072, 0.12, 14), mats.skin, neck).position.y = 0.03;
  const head = buildSculptedHead(mats, rng);
  head.position.set(0, 0.16, 0.01);
  neck.add(head);

  const armR = buildArm(mats, -1, rng);
  const armL = buildArm(mats, 1, rng);
  armR.shoulder.position.set(-0.29, 0.45, 0);
  armL.shoulder.position.set(0.29, 0.45, 0);
  spine.add(armR.shoulder, armL.shoulder);

  // Cloak: long shredded cape + mantle over the shoulders
  const cape = mesh(
    capeGeometry(rng, {
      thetaMin: -1.75,
      thetaMax: 1.75,
      strips: 34,
      rTop: 0.3,
      rBot: 0.5,
      lenMin: 0.95,
      lenMax: 1.42,
      yTop: 0.5,
      zScale: 0.7,
      rows: 14,
      sway: 0.12,
      centerBias: 0.55,
    }),
    mats.cloth,
    spine,
    "cape",
  );
  cape.castShadow = true;
  const mantle = mesh(
    capeGeometry(rng, {
      thetaMin: -2.3,
      thetaMax: 2.3,
      strips: 30,
      rTop: 0.14,
      rBot: 0.44,
      lenMin: 0.26,
      lenMax: 0.42,
      yTop: 0.62,
      zScale: 0.85,
      rows: 6,
      sway: 0.0,
      centerBias: 0.4,
    }),
    mats.cloth,
    spine,
    "capuche",
  );
  mantle.castShadow = true;

  const sword = buildDragonSlayer(mats, rng);

  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const up = v(0, 1, 0);

  if (pose === "repos") {
    // Sword strapped on the back, grip rising above the right shoulder
    spine.add(sword);
    const dir = v(0.42, -1, 0).normalize();
    sword.quaternion.setFromUnitVectors(up, dir); // blade tip downwards to the left
    sword.position.set(-0.28, 0.72, -0.24);
    // arms relaxed, slightly away from the body
    solveArm(armR, v(-0.36, -0.06, 0.08), v(-0.5, 0.2, -0.4));
    solveArm(armL, v(0.37, -0.06, 0.1), v(0.5, 0.2, -0.4));
    legR.hip.rotation.set(0.02, 0, -0.06);
    legL.hip.rotation.set(-0.04, 0, 0.07);
    legR.knee.rotation.x = 0.04;
    legL.knee.rotation.x = 0.06;
    legR.ankle.rotation.z = 0.06;
    legL.ankle.rotation.z = -0.07;
    head.rotation.set(0.08, 0, 0);
  } else if (pose === "combat") {
    // Dragon Slayer resting on the right shoulder, ready to swing
    spine.add(sword);
    const grip = v(-0.2, 0.3, 0.26);
    const dir = v(-0.28, 0.55, -0.8).normalize();
    sword.quaternion.setFromUnitVectors(up, dir);
    sword.rotateY(Math.PI / 2);
    sword.position.copy(grip);
    solveArm(armR, grip.clone().addScaledVector(dir, -0.14), v(-0.7, -0.3, 0.1));
    solveArm(armL, grip.clone().addScaledVector(dir, -0.02).add(v(0.02, 0, 0.05)), v(0.5, -0.6, 0.3));
    hips.rotation.y = 0.25;
    spine.rotation.set(0.12, -0.1, 0);
    head.rotation.set(0.05, -0.2, 0);
    legR.hip.rotation.set(-0.45, 0, -0.12);
    legR.knee.rotation.x = 0.55;
    legR.ankle.rotation.x = -0.1;
    legL.hip.rotation.set(0.35, 0, 0.14);
    legL.knee.rotation.x = 0.3;
    legL.ankle.rotation.x = -0.6;
    hips.position.y = HIP_Y - 0.07;
  }

  // Wrist orientation: fists face inward
  armR.wrist.rotation.y = 0.3;
  armL.wrist.rotation.y = -0.3;

  root.updateMatrixWorld(true);
  return root;
}

export function disposeObject(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.geometry.dispose();
      const mat = m.material as THREE.MeshStandardMaterial;
      for (const k of ["map", "bumpMap", "roughnessMap"] as const) mat[k]?.dispose();
      mat.dispose();
    }
  });
}
