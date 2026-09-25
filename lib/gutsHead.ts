import * as THREE from "three";

/**
 * Sculpted head of Guts. The face is a single deformed sphere (no seams):
 * square boxy jaw, heavy brow ridge, deep eye sockets, straight nose, high
 * cheekbones and a prominent chin. Features (eyes, brows, scar, mouth) are
 * then placed on the sculpted surface by raycasting against it.
 *
 * Local space: origin at skull center, face towards +Z, +X is Guts' left.
 */

type HeadMats = {
  hair: THREE.Material;
  dark: THREE.Material;
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const gauss = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) =>
  Math.exp(-(((x - cx) / sx) ** 2) - ((y - cy) / sy) ** 2);

/** Mirrored pair of bumps at ±cx, smooth across the face's midline. */
const pair = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) =>
  gauss(x, y, cx, cy, sx, sy) + gauss(x, y, -cx, cy, sx, sy);

/** Face relief pushed along +Z, as a function of the (x, y) position on the face. */
function relief(x: number, y: number) {
  let dz = 0;
  // heavy, straight brow ridge
  dz += 0.011 * gauss(x, y, 0, 0.027, 0.075, 0.011);
  // furrowed glabella between the brows
  dz += 0.004 * gauss(x, y, 0, 0.02, 0.012, 0.008);
  // deep eye sockets
  dz -= 0.013 * pair(x, y, 0.035, 0.004, 0.021, 0.012);
  // straight nose: bridge rising towards the tip
  const bridge = smooth(0.02, -0.035, y) * (1 - smooth(-0.036, -0.046, y));
  dz += (0.007 + 0.017 * bridge) * gauss(x, 0, 0, 0, 0.0085 + 0.006 * bridge, 1) * smooth(0.03, 0.012, y) * (1 - smooth(-0.036, -0.048, y));
  // nose tip & wings
  dz += 0.008 * gauss(x, y, 0, -0.037, 0.012, 0.009);
  dz += 0.004 * pair(x, y, 0.013, -0.04, 0.007, 0.006);
  // high cheekbones, hollow cheeks below
  dz += 0.007 * pair(x, y, 0.055, -0.018, 0.02, 0.013);
  dz -= 0.011 * pair(x, y, 0.05, -0.054, 0.016, 0.02);
  // philtrum, tight thin lips, mouth line
  dz += 0.002 * gauss(x, y, 0, -0.05, 0.006, 0.006);
  dz += 0.003 * gauss(x, y, 0, -0.063, 0.024, 0.004);
  dz -= 0.0035 * gauss(x, y, 0, -0.0585, 0.024, 0.0022);
  dz += 0.0025 * gauss(x, y, 0, -0.067, 0.018, 0.004);
  // strong, square chin with a slight cleft
  dz += 0.012 * gauss(x, y, 0, -0.096, 0.028, 0.015);
  dz -= 0.0015 * gauss(x, y, 0, -0.1, 0.004, 0.01);
  return dz;
}

/** Shading baked in vertex colors (manga-like hatching feel on the sockets). */
function shade(x: number, y: number, uy: number, uz: number) {
  let s = 1;
  s -= 0.3 * pair(x, y, 0.036, 0.008, 0.02, 0.011) * smooth(0.3, 0.7, uz);
  s -= 0.12 * pair(x, y, 0.05, -0.05, 0.02, 0.025) * smooth(0.3, 0.7, uz);
  s -= 0.08 * gauss(x, y, 0, -0.047, 0.014, 0.004) * smooth(0.5, 0.8, uz);
  s -= 0.25 * smooth(-0.55, -0.85, uy);
  s -= 0.18 * smooth(0.55, 0.05, uz) * smooth(-0.9, -0.2, uy);
  s -= 0.1 * pair(x, y, 0.052, -0.035, 0.012, 0.025) * smooth(0.3, 0.7, uz);
  return Math.max(0.45, s);
}

function sculptFace() {
  const geo = new THREE.SphereGeometry(1, 150, 110);
  const p = geo.attributes.position as THREE.BufferAttribute;
  const colors: number[] = [];
  const skin = new THREE.Color(0xcfa184);
  const lip = new THREE.Color(0xa86f5f);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const ux = p.getX(i);
    const uy = p.getY(i);
    const uz = p.getZ(i);
    // superellipsoid: round cranium, boxy lower face and jaw
    const n = 2 + 0.75 * smooth(0.0, -0.6, uy);
    const r = 1 / Math.pow(Math.abs(ux) ** n + Math.abs(uy) ** n + Math.abs(uz) ** n, 1 / n);
    let x = ux * r * 0.083;
    let y = uy * r * 0.118;
    let z = uz * r * 0.1;
    // wide jaw angle, narrower temples
    x *= 1 + 0.05 * gauss(0, y, 0, -0.078, 1, 0.014) * smooth(0.6, -0.2, uz) - 0.06 * gauss(0, y, 0, 0.03, 1, 0.025) * smooth(0.2, 0.8, uz);
    // chin narrower than the jaw angle
    x *= 1 - 0.14 * smooth(-0.025, -0.09, y) * smooth(0.1, 0.9, uz) - 0.08 * smooth(-0.08, -0.115, y) * smooth(0.3, 0.9, uz);
    // flatter face plane, flatter bottom of the jaw
    // rounder face plane: sides recede from the midline
    if (uz > 0) z -= 2.4 * x * x * smooth(0.3, 0.9, uz);
    if (y < -0.105) y = -0.105 + (y + 0.105) * 0.6;
    // back of the skull a bit fuller
    if (uz < 0) z *= 1 + 0.06 * smooth(-0.2, 0.4, uy);
    const front = smooth(0.15, 0.65, uz);
    z += relief(x, y) * front;
    p.setXYZ(i, x, y, z);

    c.copy(skin).multiplyScalar(shade(x, y, uy, uz));
    const lipAmt = gauss(x, y, 0, -0.064, 0.02, 0.005) * front;
    c.lerp(lip, lipAmt * 0.6);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

export function buildSculptedHead(mats: HeadMats, rng: () => number) {
  const head = new THREE.Group();
  head.name = "tete";

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6, name: "peau" });
  const earMat = new THREE.MeshStandardMaterial({ color: 0xb58870, roughness: 0.6, name: "oreille" });
  const face = new THREE.Mesh(sculptFace(), skinMat);
  face.name = "visage";
  // shading is baked in vertex colors; self-shadows from hair/nose look noisy up close
  face.castShadow = true;
  face.receiveShadow = false;
  head.add(face);
  face.updateMatrixWorld(true);

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, name?: string) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    if (name) m.name = name;
    head.add(m);
    return m;
  };

  // Surface probing on the sculpt
  const ray = new THREE.Raycaster();
  const probe = (x: number, y: number) => {
    ray.set(new THREE.Vector3(x, y, 0.3), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(face, false)[0];
    const n = hit?.face?.normal.clone() ?? new THREE.Vector3(0, 0, 1);
    return { p: hit ? hit.point.clone() : new THREE.Vector3(x, y, 0.09), n };
  };
  const onSurface = (pts: [number, number][], lift: number) =>
    pts.map(([x, y]) => {
      const { p, n } = probe(x, y);
      return p.addScaledVector(n, lift);
    });
  const tube = (pts: THREE.Vector3[], r: number, mat: THREE.Material, name?: string) =>
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 6, false), mat, name);
  /** Flat strip following the face surface; each point is [x, y, width]. */
  const ribbon = (pts: [number, number, number][], lift: number, mat: THREE.Material) => {
    const steps = 24;
    const cx = new THREE.CatmullRomCurve3(pts.map(([x, y, w]) => new THREE.Vector3(x, y, w)));
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const q = cx.getPoint(i / steps);
      const t = cx.getTangent(i / steps);
      const nx = -t.y;
      const ny = t.x;
      const l = Math.hypot(nx, ny) || 1;
      for (const side of [-1, 1]) {
        const x = q.x + (side * q.z * 0.5 * nx) / l;
        const y = q.y + (side * q.z * 0.5 * ny) / l;
        const { p, n } = probe(x, y);
        p.addScaledVector(n, lift);
        pos.push(p.x, p.y, p.z);
      }
      if (i < steps) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = add(g, mat);
    m.castShadow = false;
    (mat as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    return m;
  };

  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xb9b0a3, roughness: 0.3, name: "oeil" });
  const iris = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.2, name: "iris" });
  const scarMat = new THREE.MeshStandardMaterial({ color: 0x7a4436, roughness: 0.55, name: "cicatrice" });
  const lipLine = new THREE.MeshStandardMaterial({ color: 0x3a1f1a, roughness: 0.6, name: "bouche" });

  for (const s of [-1, 1]) {
    // narrow, glaring eyes set deep in the sockets
    const c = probe(s * 0.035, 0.004).p;
    const white = add(new THREE.SphereGeometry(1, 16, 10), eyeWhite);
    white.scale.set(0.013, 0.0042, 0.006);
    white.position.copy(c).add(new THREE.Vector3(0, 0, -0.001));
    white.rotation.z = s * -0.12; // outer corner slightly raised
    const pupil = add(new THREE.SphereGeometry(0.0038, 12, 8), iris);
    pupil.scale.z = 0.5;
    pupil.position.copy(c).add(new THREE.Vector3(-s * 0.002, 0.0008, 0.0035));
    // heavy upper lid, straight and angled down to the nose = scowl
    tube(
      onSurface(
        [
          [s * 0.02, 0.004],
          [s * 0.032, 0.0085],
          [s * 0.046, 0.0085],
          [s * 0.051, 0.0055],
        ],
        0.0012,
      ),
      0.0016,
      mats.dark,
    );
    // lower lid crease
    tube(
      onSurface(
        [
          [s * 0.025, -0.0015],
          [s * 0.037, -0.004],
          [s * 0.048, -0.001],
        ],
        0.0006,
      ),
      0.0007,
      lipLine,
    );
    // thick eyebrows, low at the nose, rising outward
    // tapered ribbon lying on the brow ridge: thick at the nose, thin outside
    ribbon(
      [
        [s * 0.009, 0.0145, 0.0075],
        [s * 0.02, 0.0185, 0.0085],
        [s * 0.034, 0.0235, 0.0075],
        [s * 0.048, 0.027, 0.0055],
        [s * 0.06, 0.0255, 0.0025],
      ],
      0.0018,
      mats.hair,
    );
    // ear
    const ear = add(new THREE.SphereGeometry(0.022, 12, 10), earMat);
    ear.scale.set(0.4, 1, 0.75);
    ear.position.set(s * 0.088, -0.006, -0.012);
    ear.rotation.y = s * 0.3;
  }

  // mouth: thin, set, corners pulled down
  tube(
    onSurface(
      [
        [-0.022, -0.0615],
        [-0.01, -0.0585],
        [0, -0.0582],
        [0.01, -0.0585],
        [0.022, -0.0615],
      ],
      0.0003,
    ),
    0.0011,
    lipLine,
    "bouche",
  );
  // nostrils
  for (const s of [-1, 1]) {
    const n = add(new THREE.SphereGeometry(0.0028, 8, 6), lipLine);
    n.scale.set(1.3, 0.6, 1);
    n.position.copy(probe(s * 0.008, -0.043).p).add(new THREE.Vector3(0, -0.001, -0.002));
  }

  // THE scar: a raised welt across the nose bridge, from under his left eye
  // to his right cheek
  const scarPts = onSurface(
    [
      [0.052, -0.012],
      [0.032, -0.012],
      [0.014, -0.013],
      [0, -0.0145],
      [-0.014, -0.017],
      [-0.034, -0.021],
      [-0.054, -0.024],
    ],
    0.0001,
  );
  tube(scarPts, 0.0016, scarMat, "cicatrice");

  /* ---------------- Hair ---------------- */
  const hairBase = add(new THREE.SphereGeometry(0.1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), mats.hair);
  hairBase.scale.set(0.97, 1.1, 1.06);
  hairBase.position.set(0, 0.012, -0.006);
  hairBase.rotation.x = -0.5;

  const up = new THREE.Vector3(0, 1, 0);
  const spikes = 170;
  for (let i = 0; i < spikes; i++) {
    const k = (i + 0.5) / spikes;
    const phi = Math.acos(1 - 2 * k);
    const th = Math.PI * (1 + Math.sqrt(5)) * i;
    const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
    if (dir.y < -0.15) continue;
    if (dir.z > 0.2 && dir.y < 0.55) continue; // face & forehead: handled by the bangs
    if (Math.abs(dir.x) > 0.7 && dir.y < 0.1) continue; // keep the ears clear
    const len = 0.05 + rng() * 0.07 + (dir.z < 0 ? 0.025 : 0);
    const cone = add(new THREE.ConeGeometry(0.017 + rng() * 0.012, len, 4), mats.hair);
    const out = dir.clone();
    out.y += 0.3;
    out.z -= 0.15;
    out.x += (rng() - 0.5) * 0.35;
    out.z += (rng() - 0.5) * 0.35;
    out.normalize();
    cone.quaternion.setFromUnitVectors(up, out);
    const p = dir.clone().multiplyScalar(0.097);
    p.y = p.y * 1.08 + 0.016;
    cone.position.copy(p).addScaledVector(out, len * 0.38);
  }

  // Bangs: thick pointed locks falling over the forehead, one between the eyes
  const bangs: [number, number, number, number][] = [
    // x, length, sideways lean, forward lean
    [-0.058, 0.06, -0.35, 0.35],
    [-0.04, 0.07, -0.18, 0.4],
    [-0.022, 0.075, -0.05, 0.42],
    [-0.004, 0.085, 0.04, 0.45],
    [0.016, 0.07, 0.12, 0.42],
    [0.034, 0.068, 0.22, 0.4],
    [0.052, 0.058, 0.4, 0.35],
  ];
  for (const [x, len, lean, fwd] of bangs) {
    const root = probe(x, 0.066).p;
    const dir = new THREE.Vector3(lean, -1, fwd).normalize();
    const lock = add(new THREE.ConeGeometry(0.014 + rng() * 0.004, len, 4), mats.hair);
    lock.scale.z = 0.55;
    lock.quaternion.setFromUnitVectors(up, dir);
    lock.position.copy(root).addScaledVector(dir, len * 0.45).add(new THREE.Vector3(0, 0, 0.006));
  }
  // side locks over the temples
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const lock = add(new THREE.ConeGeometry(0.014, 0.05 + k * 0.008, 4), mats.hair);
      const dir = new THREE.Vector3(s * 0.45, -1, 0.1 - k * 0.2).normalize();
      lock.quaternion.setFromUnitVectors(up, dir);
      lock.position.set(s * (0.082 - k * 0.004), 0.04, 0.03 - k * 0.028);
    }
  }
  return head;
}
