"""Génère une petite île low-poly avec Blender (bpy) et l'exporte en .blend + .glb."""
import bpy, math, random, os

random.seed(7)
OUT = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, rgb, rough=0.8):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    return m

def put(obj, m, smooth=False):
    obj.data.materials.append(m)
    for p in obj.data.polygons:
        p.use_smooth = smooth
    return obj

M = {
    "water": mat("Eau", (0.10, 0.45, 0.75), 0.2),
    "sand": mat("Sable", (0.93, 0.80, 0.55)),
    "grass": mat("Herbe", (0.35, 0.65, 0.25)),
    "wall": mat("Mur", (0.95, 0.92, 0.85)),
    "roof": mat("Toit", (0.75, 0.22, 0.18)),
    "wood": mat("Bois", (0.40, 0.25, 0.12)),
    "leaf": mat("Feuilles", (0.18, 0.50, 0.20)),
    "rock": mat("Roche", (0.55, 0.55, 0.58)),
    "door": mat("Porte", (0.30, 0.18, 0.10)),
}

# Eau
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=9, depth=0.2, location=(0, 0, -0.3))
put(bpy.context.object, M["water"]).name = "Eau"
# Sable + herbe
bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=5.5, depth=0.6, location=(0, 0, 0))
put(bpy.context.object, M["sand"]).name = "Sable"
bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=4.6, depth=0.3, location=(0, 0, 0.4))
put(bpy.context.object, M["grass"]).name = "Herbe"

# Maison
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.8, 0.4, 1.15))
h = bpy.context.object; h.scale = (2.0, 1.6, 1.2); put(h, M["wall"]).name = "Maison"
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=1.75, depth=1.1, location=(-0.8, 0.4, 2.3), rotation=(0, 0, math.pi / 4))
r = bpy.context.object; r.scale = (1.2, 1.0, 1.0); put(r, M["roof"]).name = "Toit"
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.8, -0.41, 0.95))
d = bpy.context.object; d.scale = (0.45, 0.05, 0.8); put(d, M["door"]).name = "Porte"
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.2, 0.2, 2.4))
c = bpy.context.object; c.scale = (0.25, 0.25, 0.8); put(c, M["rock"]).name = "Cheminee"

# Arbres
def tree(x, y, s):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.12 * s, depth=1.2 * s, location=(x, y, 0.55 + 0.6 * s))
    put(bpy.context.object, M["wood"]).name = "Tronc"
    for i, (rad, z) in enumerate([(0.7, 1.4), (0.55, 1.9), (0.35, 2.3)]):
        bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=rad * s, depth=0.8 * s,
                                        location=(x, y, 0.55 + z * s), rotation=(0, 0, random.random()))
        put(bpy.context.object, M["leaf"]).name = "Feuillage"

for x, y, s in [(2.3, 1.2, 1.0), (1.6, 2.6, 0.8), (3.0, -0.6, 0.7), (-3.0, 2.0, 0.9), (-2.6, -2.0, 0.75)]:
    tree(x, y, s)

# Rochers
for _ in range(6):
    a = random.uniform(0, 2 * math.pi); rr = random.uniform(4.6, 5.3)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=random.uniform(0.25, 0.5),
                                          location=(rr * math.cos(a), rr * math.sin(a), 0.3))
    put(bpy.context.object, M["rock"]).name = "Rocher"

# Lumière + caméra (utiles dans Blender)
bpy.ops.object.light_add(type="SUN", location=(5, -5, 10)); bpy.context.object.data.energy = 3
bpy.ops.object.camera_add(location=(11, -11, 8), rotation=(math.radians(63), 0, math.radians(45)))
bpy.context.scene.camera = bpy.context.object

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "ile.blend"))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "ile.glb"), export_format="GLB", use_selection=False)
print("OK")
