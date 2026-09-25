"""Armure inspirée de l'armure du Berserker, générée procéduralement avec bpy.

Usage : python3 armure.py [--render] [--samples N] [--res W H]
Produit armure.blend, armure.glb et (option) armure.png.
"""
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, Matrix, Euler

random.seed(3)
OUT = os.path.dirname(os.path.abspath(__file__))
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
RENDER = "--render" in ARGS
SAMPLES = int(ARGS[ARGS.index("--samples") + 1]) if "--samples" in ARGS else 128
RES = (int(ARGS[ARGS.index("--res") + 1]), int(ARGS[ARGS.index("--res") + 2])) if "--res" in ARGS else (1200, 1600)

bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.context.collection
TAU = 2 * math.pi


# ---------- matériaux (simples pour l'export glTF, enrichis pour le rendu) ----------
def mat(name, rgb, metal=0.0, rough=0.5, emit=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = 40
    return m

M = {
    "armor": mat("Acier noirci", (0.06, 0.058, 0.062), 1.0, 0.33),
    "trim": mat("Acier patiné", (0.3, 0.27, 0.23), 1.0, 0.28),
    "leather": mat("Cuir", (0.05, 0.035, 0.025), 0.0, 0.65),
    "cloth": mat("Cape", (0.018, 0.016, 0.016), 0.0, 0.9),
    "eyes": mat("Yeux", (1, 0.1, 0.05), 0, 0.5, emit=(1, 0.12, 0.04)),
    "blade": mat("Lame", (0.22, 0.21, 0.2), 1.0, 0.45),
    "ground": mat("Sol", (0.01, 0.009, 0.009), 0.0, 0.95),
    "bone": mat("Os", (0.55, 0.5, 0.42), 0.0, 0.6),
}


# ---------- utilitaires géométriques ----------
def new_obj(name, bm, material, loc=(0, 0, 0), rot=(0, 0, 0), smooth=True):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = smooth
    ob = bpy.data.objects.new(name, me)
    col.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    me.materials.append(material)
    return ob


def finish(ob, thick=0.012, sub=2, bevel=0.0, crease_edge=False):
    if thick:
        s = ob.modifiers.new("Epaisseur", "SOLIDIFY")
        s.thickness = thick
        s.offset = 1.0
        s.use_even_offset = True
    if bevel:
        b = ob.modifiers.new("Chanfrein", "BEVEL")
        b.width = bevel
        b.segments = 2
        b.limit_method = "ANGLE"
    if sub:
        d = ob.modifiers.new("Subdivision", "SUBSURF")
        d.levels = 1
        d.render_levels = sub
    return ob


def loft(name, rings, material, seg=36, cap_top=False, cap_bot=False, **kw):
    """Anneaux horizontaux : dict(z, rx, ry, fy=rayon avant, cx, cy, sq=exposant superellipse)."""
    bm = bmesh.new()
    loops = []
    for r in rings:
        e = 2 / r.get("sq", 2)
        vs = []
        for i in range(seg):
            t = TAU * i / seg
            c, s = math.cos(t), math.sin(t)
            ry = r.get("fy", r["ry"]) if s < 0 else r["ry"]
            x = r["rx"] * math.copysign(abs(c) ** e, c)
            y = ry * math.copysign(abs(s) ** e, s)
            vs.append(bm.verts.new((r.get("cx", 0) + x, r.get("cy", 0) + y, r["z"])))
        loops.append(vs)
    for a, b in zip(loops, loops[1:]):
        for i in range(seg):
            bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i]))
    if cap_bot:
        bm.faces.new(list(reversed(loops[0])))
    if cap_top:
        bm.faces.new(loops[-1])
    return new_obj(name, bm, material, **kw)


def shell(name, rx, ry, rz, th0, th1, ph0, ph1, material, nu=28, nv=10, **kw):
    """Portion d'ellipsoïde (theta azimut, phi depuis le pôle haut)."""
    bm = bmesh.new()
    grid = []
    for v in range(nv + 1):
        ph = ph0 + (ph1 - ph0) * v / nv
        row = []
        for u in range(nu + 1):
            th = th0 + (th1 - th0) * u / nu
            row.append(bm.verts.new((rx * math.sin(ph) * math.cos(th),
                                     ry * math.sin(ph) * math.sin(th),
                                     rz * math.cos(ph))))
        grid.append(row)
    for v in range(nv):
        for u in range(nu):
            bm.faces.new((grid[v][u], grid[v][u + 1], grid[v + 1][u + 1], grid[v + 1][u]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    return new_obj(name, bm, material, **kw)


def spike(name, base, tip, r, material, seg=10):
    base, tip = Vector(base), Vector(tip)
    d = tip - base
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r, radius2=0, depth=d.length,
                                    location=base + d / 2)
    ob = bpy.context.object
    ob.name = name
    ob.rotation_mode = "QUATERNION"
    ob.rotation_quaternion = d.to_track_quat("Z", "Y")
    ob.data.materials.append(material)
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


def curved_spike(name, pts, r0, material, seg=10):
    """Griffe / corne courbe : tube effilé le long d'une polyligne."""
    bm = bmesh.new()
    loops = []
    n = len(pts)
    for k, p in enumerate(pts):
        p = Vector(p)
        d = (Vector(pts[min(k + 1, n - 1)]) - Vector(pts[max(k - 1, 0)])).normalized()
        q = d.to_track_quat("Z", "Y")
        rr = r0 * (1 - k / (n - 1)) + 0.0008
        loops.append([bm.verts.new(p + q @ Vector((rr * math.cos(TAU * i / seg), rr * math.sin(TAU * i / seg), 0)))
                      for i in range(seg)])
    for a, b in zip(loops, loops[1:]):
        for i in range(seg):
            bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i]))
    bm.faces.new(list(reversed(loops[0])))
    return finish(new_obj(name, bm, material), thick=0, sub=1)


def box(name, size, loc, material, rot=(0, 0, 0), bevel=0.004):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.scale = size
    ob.data.materials.append(material)
    bpy.ops.object.transform_apply(scale=True)
    return finish(ob, thick=0, sub=0, bevel=bevel)


def mirror_x(fn):
    """Appelle fn(side) pour side=+1 (droite du modèle) et -1."""
    return [fn(s) for s in (1, -1)]


# ================= CORPS =================
# Plastron : buste bombé avec arête centrale
loft("Plastron", [
    dict(z=1.12, rx=0.165, ry=0.115, fy=0.12),
    dict(z=1.22, rx=0.18, ry=0.12, fy=0.14),
    dict(z=1.33, rx=0.235, ry=0.14, fy=0.18, sq=2.3),
    dict(z=1.43, rx=0.26, ry=0.145, fy=0.19, sq=2.5),
    dict(z=1.51, rx=0.25, ry=0.135, fy=0.16, sq=2.4),
    dict(z=1.57, rx=0.17, ry=0.11, fy=0.11),
    dict(z=1.6, rx=0.1, ry=0.085, fy=0.085),
], M["armor"], seg=48)
finish(bpy.context.view_layer.objects[-1] if False else bpy.data.objects["Plastron"], thick=0.014, sub=3)

# Arête centrale + côtes gravées (lamelles façon cage thoracique)
curved_spike("Arete", [(0, -0.176, 1.46), (0, -0.19, 1.38), (0, -0.17, 1.26), (0, -0.13, 1.14)], 0.012, M["trim"])
for s in (1, -1):
    for k, z in enumerate((1.42, 1.36, 1.30, 1.24)):
        w = 0.17 - 0.02 * k
        pts = []
        for i in range(8):
            t = i / 7
            a = -math.pi / 2 + s * t * 1.25
            pts.append((w * math.cos(a) * 1.08, -0.02 + (0.15 - 0.012 * k) * math.sin(a) - 0.012, z - 0.05 * t * t))
        curved_spike(f"Cote_{s}_{k}", pts, 0.009, M["trim"])

# Lamelles abdominales qui se chevauchent
for k, (z0, z1) in enumerate(((1.13, 1.05), (1.07, 0.99), (1.01, 0.94))):
    loft(f"Lame_ventre_{k}", [
        dict(z=z0, rx=0.172 + 0.006 * k, ry=0.12, fy=0.13 + 0.004 * k),
        dict(z=z1, rx=0.178 + 0.008 * k, ry=0.125, fy=0.14 + 0.004 * k),
    ], M["armor"], seg=40)
    finish(bpy.data.objects[f"Lame_ventre_{k}"], thick=0.01, sub=2)

# Ceinture de cuir + boucle
loft("Ceinture", [dict(z=0.955, rx=0.19, ry=0.135, fy=0.15), dict(z=0.915, rx=0.19, ry=0.135, fy=0.15)],
     M["leather"], seg=40)
finish(bpy.data.objects["Ceinture"], thick=0.008, sub=2)
box("Boucle", (0.06, 0.02, 0.05), (0, -0.155, 0.935), M["trim"])

# Tassettes (plaques de hanches)
def tasset(name, ang, z0, z1, width=0.5):
    ob = shell(name, 0.2, 0.15, 0.3, ang - width, ang + width, 0.95, 1.75, M["armor"], nu=16, nv=10,
               loc=(0, 0, 0.93 - 0.3 * math.cos(0.95)))
    return finish(ob, thick=0.01, sub=2)
for i, a in enumerate((-math.pi / 2 - 0.55, -math.pi / 2 + 0.55, 0.15, math.pi - 0.15, math.pi / 2)):
    tasset(f"Tassette_{i}", a, 0.93, 0.7)

# Gorgerin
loft("Gorgerin", [
    dict(z=1.56, rx=0.14, ry=0.12), dict(z=1.62, rx=0.1, ry=0.095), dict(z=1.68, rx=0.085, ry=0.085),
], M["trim"], seg=32)
finish(bpy.data.objects["Gorgerin"], thick=0.01, sub=2)

# ================= CASQUE (loup) =================
loft("Casque", [
    dict(z=1.66, rx=0.1, ry=0.1, fy=0.11),
    dict(z=1.72, rx=0.115, ry=0.125, fy=0.13),
    dict(z=1.8, rx=0.118, ry=0.13, fy=0.13),
    dict(z=1.87, rx=0.105, ry=0.12, fy=0.11),
    dict(z=1.92, rx=0.075, ry=0.09, fy=0.07),
    dict(z=1.945, rx=0.03, ry=0.04, fy=0.03),
], M["armor"], seg=40, cap_top=True)
finish(bpy.data.objects["Casque"], thick=0.01, sub=3)

# Museau : loft orienté vers l'avant (-Y) avec rotation de 90° sur X
loft("Museau", [
    dict(z=0.0, rx=0.09, ry=0.07, sq=2.6),
    dict(z=0.06, rx=0.08, ry=0.058, cy=-0.004, sq=2.8),
    dict(z=0.12, rx=0.062, ry=0.045, cy=-0.012, sq=2.8),
    dict(z=0.16, rx=0.045, ry=0.034, cy=-0.02, sq=2.6),
    dict(z=0.185, rx=0.026, ry=0.022, cy=-0.026),
], M["armor"], seg=32, cap_top=True, loc=(0, -0.08, 1.79), rot=(math.pi / 2, 0, 0))
finish(bpy.data.objects["Museau"], thick=0.008, sub=3)
# Arête du nez et crête qui remonte sur le crâne
curved_spike("Crete", [(0, -0.25, 1.8), (0, -0.2, 1.845), (0, -0.12, 1.9), (0, -0.03, 1.955),
                       (0, 0.06, 1.95), (0, 0.13, 1.9)], 0.018, M["armor"])
# Mâchoire inférieure
loft("Machoire", [
    dict(z=0.0, rx=0.075, ry=0.035), dict(z=0.1, rx=0.055, ry=0.03), dict(z=0.17, rx=0.03, ry=0.02),
], M["armor"], seg=24, cap_top=True, loc=(0, -0.07, 1.71), rot=(math.pi / 2 + 0.08, 0, 0))
finish(bpy.data.objects["Machoire"], thick=0.006, sub=2)
# Crocs
for s in (1, -1):
    for i in range(4):
        y = -0.12 - 0.035 * i
        x = s * (0.045 - 0.006 * i)
        spike(f"Croc_{s}_{i}", (x, y, 1.745), (x * 0.95, y - 0.004, 1.722 - 0.004 * (i == 0)), 0.006, M["bone"])
# Yeux incandescents
for s in (1, -1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1, location=(s * 0.058, -0.158, 1.825))
    e = bpy.context.object
    e.name = f"Oeil_{s}"
    e.scale = (0.03, 0.014, 0.011)
    e.rotation_euler = (0, s * 0.35, s * 0.25)
    e.data.materials.append(M["eyes"])
    # arcade sourcilière
    curved_spike(f"Sourcil_{s}", [(s * 0.02, -0.17, 1.84), (s * 0.06, -0.155, 1.84), (s * 0.1, -0.11, 1.85)],
                 0.012, M["armor"])
# Crinière de pointes vers l'arrière
for i in range(9):
    t = i / 8
    z = 1.93 - 0.26 * t
    a = math.pi / 2 + (t - 0.5) * 0.0
    for s in (0,) if i % 3 == 0 else (1, -1):
        x = s * 0.06 * (0.5 + t)
        base = (x, 0.07 + 0.05 * t, z)
        tip = (x * 1.8, 0.07 + 0.05 * t + 0.16 + 0.05 * (1 - t), z + 0.05 - 0.06 * t)
        mid = ((base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2, (base[2] + tip[2]) / 2 + 0.03)
        curved_spike(f"Criniere_{i}_{s}", [base, mid, tip], 0.022 - 0.008 * t, M["armor"])

# ================= ÉPAULIÈRES =================
def pauldron(s):
    cx = s * 0.29
    c = 0 if s > 0 else math.pi
    parts = []
    ob = shell(f"Epaule_dome_{s}", 0.16, 0.16, 0.14, c - 2.2, c + 2.2, 0, 0.9, M["armor"], nu=32, nv=10,
               loc=(cx, 0, 1.5))
    parts.append(finish(ob, thick=0.012, sub=3))
    for k in range(4):
        sc = 1.04 + 0.05 * k
        ob = shell(f"Epaule_lame_{s}_{k}", 0.16 * sc, 0.16 * sc, 0.14 * sc, c - 1.9 + 0.12 * k, c + 1.9 - 0.12 * k,
                   0.75 + 0.22 * k, 1.05 + 0.24 * k, M["armor"], nu=28, nv=5, loc=(cx, 0, 1.5 - 0.012 * k))
        parts.append(finish(ob, thick=0.01, sub=2))
    # pointes sur le dôme
    for i, (a, l) in enumerate(((-0.6, 0.12), (0, 0.17), (0.6, 0.12))):
        th = c + a * s
        bx, by = cx + 0.13 * math.cos(th) * 0.75, 0.13 * math.sin(th) * 0.75
        spike(f"Epaule_pointe_{s}_{i}", (bx, by, 1.6), (bx + s * l * 0.7, by + 0.03 * a, 1.6 + l), 0.025, M["armor"])
    # rebord patiné
    pts = [(cx + 0.235 * math.cos(c + t) * 1.0, 0.235 * math.sin(c + t), 1.5 - 0.235 * 0.35)
           for t in [x * 0.25 - 1.5 for x in range(13)]]
    curved_spike(f"Epaule_rebord_{s}", pts, 0.008, M["trim"])
mirror_x(pauldron)

# ================= BRAS =================
def arm(s):
    x0 = s * 0.29
    loft(f"Brassard_{s}", [
        dict(z=1.44, cx=x0, rx=0.068, ry=0.068), dict(z=1.34, cx=s * 0.315, rx=0.064, ry=0.062),
        dict(z=1.24, cx=s * 0.335, rx=0.056, ry=0.056),
    ], M["armor"], seg=28)
    finish(bpy.data.objects[f"Brassard_{s}"], thick=0.01, sub=2)
    # coude pointu
    ob = shell(f"Coude_{s}", 0.07, 0.07, 0.07, 0, TAU, 0.3, 2.2, M["armor"], nu=24, nv=8,
               loc=(s * 0.345, 0.0, 1.2), rot=(-math.pi / 2 + 0.4, 0, 0))
    finish(ob, thick=0.008, sub=2)
    spike(f"Coude_pointe_{s}", (s * 0.345, 0.07, 1.2), (s * 0.35, 0.17, 1.17), 0.028, M["armor"])
    loft(f"Canon_{s}", [
        dict(z=1.17, cx=s * 0.35, rx=0.06, ry=0.062), dict(z=1.06, cx=s * 0.365, rx=0.058, ry=0.058),
        dict(z=0.95, cx=s * 0.38, rx=0.048, ry=0.048),
    ], M["armor"], seg=28)
    finish(bpy.data.objects[f"Canon_{s}"], thick=0.01, sub=2)
    # ailettes de l'avant-bras
    for k in range(3):
        z = 1.1 - 0.05 * k
        spike(f"Ailette_{s}_{k}", (s * (0.4 + 0.004 * k), 0.02, z), (s * 0.47, 0.05, z + 0.05), 0.018, M["armor"])
    # gantelet
    loft(f"Gantelet_{s}", [
        dict(z=0.95, cx=s * 0.38, rx=0.056, ry=0.056), dict(z=0.9, cx=s * 0.385, rx=0.045, ry=0.05, sq=2.6),
        dict(z=0.84, cx=s * 0.39, rx=0.03, ry=0.052, sq=3), dict(z=0.82, cx=s * 0.39, rx=0.026, ry=0.046, sq=3),
    ], M["armor"], seg=28, cap_bot=False)
    finish(bpy.data.objects[f"Gantelet_{s}"], thick=0.008, sub=2)
    # doigts griffus
    for f in range(4):
        y = -0.033 + 0.022 * f
        base = (s * 0.39, y, 0.83)
        curved_spike(f"Doigt_{s}_{f}", [base, (s * 0.395, y - 0.012, 0.77), (s * 0.39, y - 0.03, 0.735),
                                         (s * 0.382, y - 0.05, 0.715)], 0.012, M["armor"])
    curved_spike(f"Pouce_{s}", [(s * 0.37, -0.04, 0.88), (s * 0.36, -0.07, 0.84), (s * 0.35, -0.085, 0.8)],
                 0.012, M["armor"])
mirror_x(arm)

# ================= JAMBES =================
def leg(s):
    x = s * 0.11
    loft(f"Cuissard_{s}", [
        dict(z=0.9, cx=x, rx=0.1, ry=0.1, fy=0.11), dict(z=0.75, cx=s * 0.112, rx=0.088, ry=0.088, fy=0.1),
        dict(z=0.58, cx=s * 0.108, rx=0.07, ry=0.072, fy=0.08),
    ], M["armor"], seg=32)
    finish(bpy.data.objects[f"Cuissard_{s}"], thick=0.01, sub=2)
    ob = shell(f"Genouillere_{s}", 0.08, 0.075, 0.09, 0, TAU, 0.15, 2.0, M["armor"], nu=28, nv=10,
               loc=(s * 0.108, 0.0, 0.54), rot=(math.pi / 2 - 0.2, 0, 0))
    finish(ob, thick=0.01, sub=3)
    spike(f"Genou_pointe_{s}", (s * 0.108, -0.1, 0.55), (s * 0.108, -0.2, 0.6), 0.03, M["armor"])
    loft(f"Greve_{s}", [
        dict(z=0.5, cx=s * 0.108, rx=0.068, ry=0.07, fy=0.085),
        dict(z=0.38, cx=s * 0.11, rx=0.068, ry=0.072, fy=0.09),
        dict(z=0.2, cx=s * 0.112, rx=0.05, ry=0.055, fy=0.065),
        dict(z=0.1, cx=s * 0.112, rx=0.05, ry=0.055, fy=0.06),
    ], M["armor"], seg=32)
    finish(bpy.data.objects[f"Greve_{s}"], thick=0.01, sub=2)
    # tibia : arête
    curved_spike(f"Tibia_{s}", [(s * 0.112, -0.093, 0.46), (s * 0.113, -0.098, 0.34), (s * 0.113, -0.07, 0.16)],
                 0.008, M["trim"])
    # soleret (pied) orienté vers l'avant
    loft(f"Soleret_{s}", [
        dict(z=0.0, rx=0.058, ry=0.05), dict(z=0.1, rx=0.058, ry=0.045, cy=-0.01),
        dict(z=0.18, rx=0.045, ry=0.032, cy=-0.02), dict(z=0.24, rx=0.02, ry=0.018, cy=-0.028),
    ], M["armor"], seg=24, cap_top=True, loc=(s * 0.112, -0.02, 0.07), rot=(math.pi / 2, 0, 0))
    finish(bpy.data.objects[f"Soleret_{s}"], thick=0.008, sub=2)
mirror_x(leg)

# ================= CAPE =================
def cape():
    bm = bmesh.new()
    nx, nz = 28, 40
    grid = []
    for j in range(nz + 1):
        v = j / nz
        z = 1.56 - 1.3 * v
        w = 0.24 + 0.34 * v
        row = []
        for i in range(nx + 1):
            u = i / nx
            x = (u - 0.5) * 2 * w
            fold = 0.035 * math.sin(u * TAU * 3.5 + v * 2) * v + 0.015 * math.sin(u * 23 + v * 9) * v
            y = 0.13 + 0.09 * v + 0.12 * (abs(u - 0.5) * 2) ** 2 * (1 - 0.6 * v) + fold
            if j == 0:
                y = 0.1 + 0.05 * (abs(u - 0.5) * 2) ** 2
            row.append(bm.verts.new((x, y, z)))
        grid.append(row)
    for j in range(nz):
        for i in range(nx):
            v = j / nz
            # bas déchiré : lambeaux irréguliers
            limit = nz - (3 + 5 * abs(math.sin(i * 1.7)) + random.random() * 4)
            if j > limit:
                continue
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    ob = new_obj("Cape", bm, M["cloth"])
    return finish(ob, thick=0.006, sub=2)
cape()

# ================= ÉPÉE (type Dragonslayer, plantée au sol) =================
def sword():
    L, W, T = 1.75, 0.26, 0.035
    bm = bmesh.new()
    prof = [(-W / 2, 0), (W / 2, 0), (W / 2, L - 0.3), (0.02, L), (-0.02, L), (-W / 2, L - 0.3)]
    vs = [bm.verts.new((x, 0, z)) for x, z in prof]
    f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(0, T, 0), verts=[e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.translate(bm, vec=(0, -T / 2, 0), verts=bm.verts)
    # fil aminci : resserre les sommets latéraux
    for v in bm.verts:
        if abs(v.co.x) > W / 2 - 1e-4:
            v.co.y *= 0.25
    blade = new_obj("Lame", bm, M["blade"], smooth=False)
    finish(blade, thick=0, sub=0, bevel=0.006)
    blade.modifiers.new("Tri", "TRIANGULATE") if False else None
    box("Garde", (0.34, 0.07, 0.06), (0, 0, -0.03), M["trim"])
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.025, depth=0.42, location=(0, 0, -0.27))
    h = bpy.context.object
    h.name = "Poignee"
    h.data.materials.append(M["leather"])
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.04, location=(0, 0, -0.5))
    p = bpy.context.object
    p.name = "Pommeau"
    p.data.materials.append(M["trim"])
    # parent commun puis renversé pointe vers le sol
    root = bpy.data.objects.new("Epee", None)
    col.objects.link(root)
    for o in (blade, bpy.data.objects["Garde"], h, p):
        o.parent = root
    root.location = (0.66, 0.08, 1.38)
    root.rotation_euler = (math.pi + 0.08, -0.12, 0.35)
sword()

# ================= SOL =================
bpy.ops.mesh.primitive_circle_add(vertices=64, radius=1.6, fill_type="NGON", location=(0, 0, 0))
g = bpy.context.object
g.name = "Sol"
g.data.materials.append(M["ground"])
# pierres éparses
for i in range(14):
    a = random.uniform(0, TAU)
    r = random.uniform(0.4, 1.4)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=random.uniform(0.03, 0.08),
                                          location=(r * math.cos(a), r * math.sin(a), 0.01))
    st = bpy.context.object
    st.name = "Pierre"
    st.scale.z = 0.5
    st.data.materials.append(M["ground"])

# ================= EXPORT glTF (subdivision niveau viewport) =================
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "armure.glb"), export_format="GLB",
                          export_apply=True, export_lights=False, export_cameras=False)

tri = 0
dg = bpy.context.evaluated_depsgraph_get()
for o in bpy.data.objects:
    if o.type == "MESH":
        me = o.evaluated_get(dg).to_mesh()
        me.calc_loop_triangles()
        tri += len(me.loop_triangles)
print("TRIANGLES_VIEWPORT", tri)


# ================= MATÉRIAUX DE RENDU (usure, micro-rayures) =================
def enrich_metal(m, scale=160, wear=0.35):
    nt = m.node_tree
    n, l = nt.nodes, nt.links
    b = n["Principled BSDF"]
    base = tuple(b.inputs["Base Color"].default_value)
    tc = n.new("ShaderNodeTexCoord")
    nz = n.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = scale; nz.inputs["Detail"].default_value = 12
    l.new(tc.outputs["Object"], nz.inputs["Vector"])
    rr = n.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value = b.inputs["Roughness"].default_value - 0.15
    rr.inputs["To Max"].default_value = b.inputs["Roughness"].default_value + 0.25
    l.new(nz.outputs["Fac"], rr.inputs["Value"]); l.new(rr.outputs["Result"], b.inputs["Roughness"])
    geo = n.new("ShaderNodeNewGeometry")
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.56
    ramp.color_ramp.elements[0].color = base
    ramp.color_ramp.elements[1].position = 0.62
    ramp.color_ramp.elements[1].color = (0.22, 0.2, 0.18, 1)
    mixp = n.new("ShaderNodeMath"); mixp.operation = "ADD"
    sc = n.new("ShaderNodeMath"); sc.operation = "MULTIPLY"; sc.inputs[1].default_value = 0.03
    l.new(nz.outputs["Fac"], sc.inputs[0])
    l.new(geo.outputs["Pointiness"], mixp.inputs[0]); l.new(sc.outputs[0], mixp.inputs[1])
    l.new(mixp.outputs[0], ramp.inputs["Fac"]); l.new(ramp.outputs["Color"], b.inputs["Base Color"])
    bump = n.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.08
    nz2 = n.new("ShaderNodeTexNoise"); nz2.inputs["Scale"].default_value = scale * 6
    l.new(tc.outputs["Object"], nz2.inputs["Vector"])
    l.new(nz2.outputs["Fac"], bump.inputs["Height"]); l.new(bump.outputs["Normal"], b.inputs["Normal"])

for k in ("armor", "trim", "blade"):
    enrich_metal(M[k])

# ================= SCÈNE DE RENDU =================
sc = bpy.context.scene
w = bpy.data.worlds.new("Monde"); sc.world = w
w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.012, 0.011, 0.012, 1)
w.node_tree.nodes["Background"].inputs["Strength"].default_value = 1

def light(name, loc, energy, color, size=1.0):
    ld = bpy.data.lights.new(name, "AREA"); ld.energy = energy; ld.color = color; ld.size = size
    lo = bpy.data.objects.new(name, ld); col.objects.link(lo); lo.location = loc
    lo.rotation_mode = "QUATERNION"
    lo.rotation_quaternion = (Vector((0, 0, 1.1)) - Vector(loc)).to_track_quat("-Z", "Y")
light("Principale", (1.8, -2.2, 2.6), 260, (1.0, 0.85, 0.7), 1.2)
light("Contre_rouge", (-1.6, 1.8, 1.8), 600, (1.0, 0.25, 0.12), 1.0)
light("Contre_froid", (1.6, 1.9, 2.4), 350, (0.5, 0.65, 1.0), 1.0)
light("Remplissage", (-2.4, -2.0, 1.0), 60, (0.7, 0.75, 0.9), 2.0)

cd = bpy.data.cameras.new("Camera"); cd.lens = 42
cam = bpy.data.objects.new("Camera", cd); col.objects.link(cam)
cam.location = (1.15, -3.3, 0.95)
cam.rotation_mode = "QUATERNION"
cam.rotation_quaternion = (Vector((0.08, 0, 1.0)) - cam.location).to_track_quat("-Z", "Y")
sc.camera = cam

sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = RES
sc.render.resolution_percentage = 100
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = "AgX - Punchy"

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "armure.blend"))
if RENDER:
    sc.render.filepath = os.path.join(OUT, "armure.png")
    bpy.ops.render.render(write_still=True)
print("OK")
