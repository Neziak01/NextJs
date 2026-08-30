"""
Space Marine — scène Blender complète (blockout hard-surface + shading + éclairage + rendu).

Génère une scène prête à rendre : personnage type Adeptus Astartes en armure
énergétique, matériaux PBR avec usure procédurale sur les arêtes, éclairage
trois points sous soleil mourant, brume volumétrique et braises.

Ce que ce script produit : un BLOCKOUT de production — silhouette, proportions,
shading, lumière et caméra. C'est le point de départ d'un pro, pas un sculpt
fini : le détail organique (filigranes gothiques, aquila ciselée, visage) se
sculpte ensuite en mode Sculpt ou se retopologise depuis ZBrush.

Usage
-----
    Interface  : Scripting > Ouvrir > Exécuter
    Ligne cmd  : blender -b -P space_marine_scene.py -o //render_ -f 1

Testé contre l'API Blender 4.2 LTS. Les noms de sockets sont résolus
dynamiquement pour rester compatibles 3.6 → 4.5.
"""

import bpy
import math
from mathutils import Vector

# --------------------------------------------------------------------------- #
# CONFIGURATION
# --------------------------------------------------------------------------- #

CHAPITRES = {
    "ultramarines":  {"armure": (0.012, 0.055, 0.220), "trim": "or"},
    "blood_angels":  {"armure": (0.320, 0.012, 0.014), "trim": "or"},
    "dark_angels":   {"armure": (0.006, 0.045, 0.020), "trim": "os"},
    "salamanders":   {"armure": (0.010, 0.090, 0.030), "trim": "or"},
    "black_templars": {"armure": (0.011, 0.011, 0.013), "trim": "os"},
    "iron_hands":    {"armure": (0.020, 0.021, 0.024), "trim": "acier"},
}

CHAPITRE = "ultramarines"
COULEUR_LENTILLES = (0.05, 1.0, 0.35)   # vert toxique : contraste avec le soleil rouge
INTENSITE_LENTILLES = 28.0

RESOLUTION = (2000, 2500)   # portrait ; passer à (6400, 8000) pour du "8K"
ECHANTILLONS = 256
BRAISES = True
VOLUMETRIQUE = True

# Repère : Z vers le haut, l'avant du personnage regarde vers -Y (vers la caméra).
HAUTEUR = 2.55  # mètres — échelle Primaris

_conf = CHAPITRES[CHAPITRE]


# --------------------------------------------------------------------------- #
# HELPERS — compatibilité API
# --------------------------------------------------------------------------- #

def sock(node, noms, valeur):
    """Assigne `valeur` au premier socket d'entrée trouvé parmi `noms`.

    Les sockets du Principled BSDF ont été renommés en 4.0 (Emission ->
    Emission Color, Subsurface -> Subsurface Weight, ...). On essaie les
    variantes plutôt que de casser sur une version donnée.
    """
    for nom in noms:
        if nom in node.inputs:
            node.inputs[nom].default_value = valeur
            return True
    return False


def new_mix_rgb(nt, facteur=0.5):
    """Noeud de mélange couleur, API 4.x (ShaderNodeMix) ou 3.x (ShaderNodeMixRGB).

    Retourne (node, nom_socket_facteur, nom_socket_a, nom_socket_b, nom_sortie).
    """
    try:
        n = nt.nodes.new("ShaderNodeMix")
        n.data_type = "RGBA"
        n.inputs["Factor"].default_value = facteur
        return n, "Factor", "A", "B", "Result"
    except RuntimeError:
        n = nt.nodes.new("ShaderNodeMixRGB")
        n.inputs["Fac"].default_value = facteur
        return n, "Fac", "Color1", "Color2", "Color"


def lisser(obj, angle=math.radians(38)):
    """Shade smooth avec angle limite, quelle que soit la version."""
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()
    if hasattr(bpy.ops.object, "shade_auto_smooth"):
        try:
            bpy.ops.object.shade_auto_smooth(angle=angle)
            return
        except (RuntimeError, TypeError):
            pass
    mesh = obj.data
    if hasattr(mesh, "use_auto_smooth"):        # Blender < 4.1
        mesh.use_auto_smooth = True
        mesh.auto_smooth_angle = angle


# --------------------------------------------------------------------------- #
# HELPERS — géométrie
# --------------------------------------------------------------------------- #

COLLECTION = None


def _finaliser(obj, mat, bevel, segments, lisse):
    if bevel > 0:
        m = obj.modifiers.new("Bevel", "BEVEL")
        m.width = bevel
        m.segments = segments
        m.limit_method = "ANGLE"
        m.angle_limit = math.radians(35)
        m.harden_normals = True
    if mat:
        obj.data.materials.append(mat)
    if lisse:
        lisser(obj)
    if COLLECTION and obj.name not in COLLECTION.objects:
        for c in obj.users_collection:
            c.objects.unlink(obj)
        COLLECTION.objects.link(obj)
    return obj


def boite(nom, loc, dims, rot=(0, 0, 0), mat=None, bevel=0.018, segments=4, lisse=True):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = nom
    obj.scale = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finaliser(obj, mat, bevel, segments, lisse)


def sphere(nom, loc, dims, rot=(0, 0, 0), mat=None, segments=48, anneaux=24):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments, ring_count=anneaux, radius=1, location=loc, rotation=rot
    )
    obj = bpy.context.object
    obj.name = nom
    obj.scale = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finaliser(obj, mat, 0, 0, True)


def cylindre(nom, loc, rayon, hauteur, rot=(0, 0, 0), mat=None, bevel=0.01, verts=32):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=verts, radius=rayon, depth=hauteur, location=loc, rotation=rot
    )
    obj = bpy.context.object
    obj.name = nom
    return _finaliser(obj, mat, bevel, 3, True)


def tore(nom, loc, rayon_maj, rayon_min, rot=(0, 0, 0), mat=None):
    bpy.ops.mesh.primitive_torus_add(
        location=loc, rotation=rot,
        major_radius=rayon_maj, minor_radius=rayon_min,
        major_segments=48, minor_segments=12,
    )
    obj = bpy.context.object
    obj.name = nom
    return _finaliser(obj, mat, 0, 0, True)


# --------------------------------------------------------------------------- #
# MATÉRIAUX
# --------------------------------------------------------------------------- #

def ceramite(nom, couleur_base, couleur_usure=(0.16, 0.15, 0.14),
             force_usure=1.0, rugosite=0.42, metal_base=0.0):
    """Céramite peinte, usure procédurale portée par la convexité (Pointiness).

    Le masque d'arêtes vient de Geometry > Pointiness remappé serré autour de
    0.5 : c'est ce qui donne l'écaillage sur chaque angle vif sans peindre une
    seule texture. On le brouille avec un bruit pour éviter le liseré régulier
    qui trahit la génération procédurale.
    """
    mat = bpy.data.materials.new(nom)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (900, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (620, 0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    geo = nt.nodes.new("ShaderNodeNewGeometry")
    geo.location = (-1100, 400)

    arete = nt.nodes.new("ShaderNodeMapRange")
    arete.location = (-900, 400)
    arete.inputs["From Min"].default_value = 0.505
    arete.inputs["From Max"].default_value = 0.560
    arete.clamp = True
    nt.links.new(geo.outputs["Pointiness"], arete.inputs["Value"])

    # Bruit fin : casse le liseré d'usure en éclats irréguliers.
    grain = nt.nodes.new("ShaderNodeTexNoise")
    grain.location = (-1100, 100)
    grain.inputs["Scale"].default_value = 60.0
    grain.inputs["Detail"].default_value = 10.0
    grain.inputs["Roughness"].default_value = 0.65

    grain_ctr = nt.nodes.new("ShaderNodeMapRange")
    grain_ctr.location = (-900, 100)
    grain_ctr.inputs["From Min"].default_value = 0.34
    grain_ctr.inputs["From Max"].default_value = 0.66
    nt.links.new(grain.outputs["Fac"], grain_ctr.inputs["Value"])

    usure = nt.nodes.new("ShaderNodeMath")
    usure.location = (-680, 280)
    usure.operation = "MULTIPLY"
    nt.links.new(arete.outputs["Result"], usure.inputs[0])
    nt.links.new(grain_ctr.outputs["Result"], usure.inputs[1])

    gain = nt.nodes.new("ShaderNodeMath")
    gain.location = (-500, 280)
    gain.operation = "MULTIPLY"
    gain.inputs[1].default_value = force_usure * 1.6
    gain.use_clamp = True
    nt.links.new(usure.outputs["Value"], gain.inputs[0])

    # Crasse : bruit large qui assombrit les creux, casse l'uniformité de teinte.
    crasse = nt.nodes.new("ShaderNodeTexNoise")
    crasse.location = (-1100, -220)
    crasse.inputs["Scale"].default_value = 3.2
    crasse.inputs["Detail"].default_value = 6.0

    salie, f0, a0, b0, s0 = new_mix_rgb(nt, 0.30)
    salie.location = (-500, -150)
    salie.inputs[a0].default_value = (*couleur_base, 1.0)
    salie.inputs[b0].default_value = (
        couleur_base[0] * 0.38, couleur_base[1] * 0.38, couleur_base[2] * 0.38, 1.0
    )
    nt.links.new(crasse.outputs["Fac"], salie.inputs[f0])

    # Métal nu là où la peinture a sauté.
    ecaille, f1, a1, b1, s1 = new_mix_rgb(nt)
    ecaille.location = (-200, 0)
    ecaille.inputs[b1].default_value = (*couleur_usure, 1.0)
    nt.links.new(salie.outputs[s0], ecaille.inputs[a1])
    nt.links.new(gain.outputs["Value"], ecaille.inputs[f1])
    nt.links.new(ecaille.outputs[s1], bsdf.inputs["Base Color"])

    # Le métal nu est métallique et plus lisse que la peinture mate.
    met = nt.nodes.new("ShaderNodeMapRange")
    met.location = (-200, -400)
    met.inputs["To Min"].default_value = metal_base
    met.inputs["To Max"].default_value = 1.0
    nt.links.new(gain.outputs["Value"], met.inputs["Value"])
    nt.links.new(met.outputs["Result"], bsdf.inputs["Metallic"])

    rug = nt.nodes.new("ShaderNodeMapRange")
    rug.location = (-200, -620)
    rug.inputs["To Min"].default_value = rugosite
    rug.inputs["To Max"].default_value = max(0.12, rugosite - 0.22)
    nt.links.new(gain.outputs["Value"], rug.inputs["Value"])

    rug_var = nt.nodes.new("ShaderNodeMapRange")
    rug_var.location = (0, -620)
    rug_var.inputs["From Min"].default_value = 0.0
    rug_var.inputs["From Max"].default_value = 1.0
    nt.links.new(rug.outputs["Result"], rug_var.inputs["Value"])
    nt.links.new(rug_var.outputs["Result"], bsdf.inputs["Roughness"])

    # Micro-relief : rayures et grain de surface.
    micro = nt.nodes.new("ShaderNodeTexNoise")
    micro.location = (0, -900)
    micro.inputs["Scale"].default_value = 220.0
    micro.inputs["Detail"].default_value = 8.0

    bump = nt.nodes.new("ShaderNodeBump")
    bump.location = (320, -900)
    bump.inputs["Strength"].default_value = 0.14
    bump.inputs["Distance"].default_value = 0.004
    nt.links.new(micro.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    sock(bsdf, ["Coat Weight", "Clearcoat"], 0.18)
    sock(bsdf, ["Coat Roughness", "Clearcoat Roughness"], 0.35)
    return mat


def metal(nom, couleur, rugosite=0.30, patine=None):
    """Métal simple : or, bronze verdi, acier. `patine` teinte les creux."""
    mat = bpy.data.materials.new(nom)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    sock(bsdf, ["Metallic"], 1.0)
    sock(bsdf, ["Roughness"], rugosite)

    if patine is None:
        sock(bsdf, ["Base Color"], (*couleur, 1.0))
        return mat

    # Vert-de-gris dans les creux : Pointiness inversé.
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    geo.location = (-800, 200)
    creux = nt.nodes.new("ShaderNodeMapRange")
    creux.location = (-600, 200)
    creux.inputs["From Min"].default_value = 0.50
    creux.inputs["From Max"].default_value = 0.42   # inversé : creux -> 1
    nt.links.new(geo.outputs["Pointiness"], creux.inputs["Value"])

    bruit = nt.nodes.new("ShaderNodeTexNoise")
    bruit.location = (-800, -100)
    bruit.inputs["Scale"].default_value = 24.0

    mul = nt.nodes.new("ShaderNodeMath")
    mul.location = (-420, 120)
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = 1.4
    mul.use_clamp = True
    nt.links.new(creux.outputs["Result"], mul.inputs[0])

    mix, f, a, b, s = new_mix_rgb(nt)
    mix.location = (-220, 100)
    mix.inputs[a].default_value = (*couleur, 1.0)
    mix.inputs[b].default_value = (*patine, 1.0)
    nt.links.new(mul.outputs["Value"], mix.inputs[f])
    nt.links.new(mix.outputs[s], bsdf.inputs["Base Color"])

    rug = nt.nodes.new("ShaderNodeMapRange")
    rug.location = (-220, -240)
    rug.inputs["To Min"].default_value = rugosite
    rug.inputs["To Max"].default_value = 0.78   # la patine est mate
    nt.links.new(mul.outputs["Value"], rug.inputs["Value"])
    nt.links.new(rug.outputs["Result"], bsdf.inputs["Roughness"])

    met = nt.nodes.new("ShaderNodeMapRange")
    met.location = (-220, -420)
    met.inputs["To Min"].default_value = 1.0
    met.inputs["To Max"].default_value = 0.25
    nt.links.new(mul.outputs["Value"], met.inputs["Value"])
    nt.links.new(met.outputs["Result"], bsdf.inputs["Metallic"])
    return mat


def diffus(nom, couleur, rugosite=0.75, sss=0.0):
    mat = bpy.data.materials.new(nom)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    sock(bsdf, ["Base Color"], (*couleur, 1.0))
    sock(bsdf, ["Roughness"], rugosite)
    sock(bsdf, ["Metallic"], 0.0)
    if sss > 0:
        sock(bsdf, ["Subsurface Weight", "Subsurface"], sss)
        sock(bsdf, ["Subsurface Radius"], (0.9, 0.28, 0.16))
    return mat


def emissif(nom, couleur, force):
    mat = bpy.data.materials.new(nom)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    sock(bsdf, ["Base Color"], (*couleur, 1.0))
    sock(bsdf, ["Emission Color", "Emission"], (*couleur, 1.0))
    sock(bsdf, ["Emission Strength"], force)
    sock(bsdf, ["Roughness"], 0.08)
    return mat


# --------------------------------------------------------------------------- #
# CONSTRUCTION DU PERSONNAGE
# --------------------------------------------------------------------------- #

def construire_personnage(M):
    """Assemble l'armure. `M` est le dictionnaire des matériaux.

    Proportions héroïques Primaris : ~2,55 m, pauldrons plus larges que le
    torse — c'est la silhouette qui fait lire le personnage, pas le détail.
    """
    A, T = M["armure"], M["trim"]
    N, C, P = M["noir"], M["cuir"], M["parchemin"]

    # --- Jambes ---------------------------------------------------------- #
    for cote in (-1, 1):
        x = 0.20 * cote
        boite(f"botte_{cote}", (x, -0.04, 0.11), (0.28, 0.42, 0.22), mat=A)
        boite(f"greve_{cote}", (x, 0.0, 0.46), (0.26, 0.28, 0.52), mat=A)
        sphere(f"genou_{cote}", (x, -0.09, 0.76), (0.16, 0.15, 0.14), mat=A)
        tore(f"genou_trim_{cote}", (x, -0.09, 0.76), 0.145, 0.018,
             rot=(math.radians(90), 0, 0), mat=T)
        boite(f"cuisse_{cote}", (x, 0.0, 1.04), (0.30, 0.32, 0.50), mat=A)

    # --- Bassin et abdomen ------------------------------------------------ #
    boite("hanches", (0, 0.0, 1.31), (0.56, 0.38, 0.24), mat=A)
    boite("ceinturon", (0, 0.0, 1.44), (0.60, 0.42, 0.10), mat=T, bevel=0.012)
    boite("braguette", (0, -0.19, 1.26), (0.22, 0.10, 0.26), mat=T)

    # Plates abdominales segmentées : trois bandes empilées, la plus large en haut.
    for i, (z, largeur) in enumerate([(1.55, 0.48), (1.66, 0.52), (1.77, 0.55)]):
        boite(f"abdo_{i}", (0, 0.0, z), (largeur, 0.36, 0.10), mat=A, bevel=0.014)

    # --- Torse ------------------------------------------------------------ #
    boite("plastron", (0, 0.0, 1.99), (0.66, 0.44, 0.36), mat=A, bevel=0.030, segments=5)
    # L'aquila : deux ailes obliques sur la poitrine. Placeholder à sculpter.
    for cote in (-1, 1):
        boite(f"aquila_{cote}", (0.15 * cote, -0.23, 2.03), (0.26, 0.03, 0.13),
              rot=(0, 0, 0), mat=T, bevel=0.008)
    boite("aquila_corps", (0, -0.235, 1.97), (0.07, 0.03, 0.22), mat=T, bevel=0.008)

    boite("gorget", (0, 0.0, 2.20), (0.34, 0.30, 0.11), mat=T, bevel=0.012)

    # --- Pauldrons : la signature de la silhouette ------------------------ #
    for cote in (-1, 1):
        x = 0.50 * cote
        sphere(f"pauldron_{cote}", (x, 0.0, 2.06), (0.30, 0.28, 0.25), mat=A)
        tore(f"pauldron_trim_{cote}", (x, 0.0, 1.94), 0.285, 0.030, mat=T)
        # Plaque de rebord qui casse la rondeur pure de la sphère.
        boite(f"pauldron_bord_{cote}", (x, 0.0, 1.90), (0.58, 0.54, 0.06),
              mat=T, bevel=0.012)

    # --- Bras ------------------------------------------------------------- #
    for cote in (-1, 1):
        x = 0.52 * cote
        boite(f"biceps_{cote}", (x, -0.04, 1.73), (0.22, 0.22, 0.34), mat=A)
        sphere(f"coude_{cote}", (x, -0.04, 1.55), (0.13, 0.13, 0.12), mat=A)
        # Avant-bras ramenés vers l'avant : le bolter se tient en travers du buste.
        boite(f"avant_bras_{cote}", (x * 0.86, -0.30, 1.46), (0.21, 0.44, 0.20),
              rot=(math.radians(58), 0, 0), mat=A)
        boite(f"gantelet_{cote}", (x * 0.62, -0.46, 1.63), (0.17, 0.20, 0.15),
              mat=N, bevel=0.012)

    # --- Casque ----------------------------------------------------------- #
    sphere("casque", (0, 0.0, 2.36), (0.175, 0.195, 0.200), mat=A)
    boite("museau", (0, -0.155, 2.31), (0.16, 0.16, 0.13), mat=A, bevel=0.022)
    boite("grille", (0, -0.225, 2.29), (0.11, 0.03, 0.08), mat=N, bevel=0.006)
    for cote in (-1, 1):
        sphere(f"lentille_{cote}", (0.077 * cote, -0.163, 2.40),
               (0.050, 0.026, 0.032), mat=M["lentille"])
        tore(f"lentille_trim_{cote}", (0.077 * cote, -0.163, 2.40), 0.052, 0.011,
             rot=(math.radians(90), 0, 0), mat=T)
    boite("crete", (0, 0.02, 2.53), (0.035, 0.24, 0.05), mat=T, bevel=0.010)

    # --- Sac dorsal et cheminées ------------------------------------------ #
    boite("sac_dorsal", (0, 0.31, 2.00), (0.52, 0.26, 0.50), mat=N, bevel=0.024)
    for cote in (-1, 1):
        x = 0.19 * cote
        cylindre(f"cheminee_{cote}", (x, 0.34, 2.40), 0.058, 0.38, mat=M["gunmetal"])
        tore(f"cheminee_cap_{cote}", (x, 0.34, 2.59), 0.062, 0.020, mat=T)

    # --- Sceaux de pureté : le détail qui vend l'échelle et raconte ------- #
    sceaux = [
        (0.50, -0.24, 1.86, math.radians(6)),    # pauldron gauche
        (-0.20, -0.24, 1.84, math.radians(-9)),  # plastron
        (0.12, -0.23, 1.71, math.radians(4)),
    ]
    for i, (x, y, z, incl) in enumerate(sceaux):
        cylindre(f"cire_{i}", (x, y, z), 0.032, 0.014,
                 rot=(math.radians(90), 0, 0), mat=M["cire"])
        boite(f"parchemin_{i}", (x, y - 0.005, z - 0.16), (0.075, 0.004, 0.30),
              rot=(0, incl, 0), mat=P, bevel=0.002, segments=2)

    # --- Bolter ------------------------------------------------------------ #
    G = M["gunmetal"]
    ang = (math.radians(74), 0, math.radians(-12))
    boite("bolter_corps", (0.02, -0.52, 1.52), (0.13, 0.46, 0.17), rot=ang, mat=G)
    boite("bolter_chargeur", (0.02, -0.46, 1.36), (0.11, 0.13, 0.24), rot=ang, mat=N)
    cylindre("bolter_canon", (0.05, -0.63, 1.78), 0.036, 0.34, rot=ang, mat=G)
    boite("bolter_lunette", (0.02, -0.56, 1.64), (0.06, 0.18, 0.06), rot=ang, mat=N)
    boite("bolter_crosse", (-0.01, -0.40, 1.26), (0.10, 0.24, 0.12), rot=ang, mat=G)
    for i, t in enumerate((0.30, 0.62)):
        boite(f"sangle_{i}", (0.03, -0.50 - t * 0.08, 1.66 - t * 0.36),
              (0.15, 0.012, 0.055), rot=ang, mat=C, bevel=0.004, segments=2)


# --------------------------------------------------------------------------- #
# ENVIRONNEMENT, LUMIÈRE, CAMÉRA
# --------------------------------------------------------------------------- #

def construire_sol():
    mat = bpy.data.materials.new("Sol_Ruines")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    sock(bsdf, ["Base Color"], (0.030, 0.026, 0.024, 1.0))
    sock(bsdf, ["Roughness"], 0.92)

    v = nt.nodes.new("ShaderNodeTexVoronoi")
    v.location = (-600, -300)
    v.inputs["Scale"].default_value = 9.0
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.location = (-600, -560)
    n.inputs["Scale"].default_value = 55.0
    add = nt.nodes.new("ShaderNodeMath")
    add.location = (-380, -420)
    add.operation = "ADD"
    nt.links.new(v.outputs["Distance"], add.inputs[0])
    nt.links.new(n.outputs["Fac"], add.inputs[1])
    b = nt.nodes.new("ShaderNodeBump")
    b.location = (-180, -420)
    b.inputs["Strength"].default_value = 0.55
    nt.links.new(add.outputs["Value"], b.inputs["Height"])
    nt.links.new(b.outputs["Normal"], bsdf.inputs["Normal"])

    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
    sol = bpy.context.object
    sol.name = "Sol"
    sol.data.materials.append(mat)
    return sol


def construire_monde():
    monde = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    bpy.context.scene.world = monde
    monde.use_nodes = True
    nt = monde.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputWorld")
    out.location = (300, 0)
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.location = (100, 0)
    bg.inputs["Strength"].default_value = 0.35
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])

    # Dégradé vertical : horizon rouge sang, zénith bleu nuit. Le contraste
    # chaud/froid fait tout le travail d'ambiance grimdark.
    grad = nt.nodes.new("ShaderNodeTexGradient")
    grad.location = (-500, 0)
    grad.gradient_type = "LINEAR"
    map_g = nt.nodes.new("ShaderNodeMapping")
    map_g.location = (-700, 0)
    map_g.inputs["Rotation"].default_value = (0, math.radians(-90), 0)
    tex = nt.nodes.new("ShaderNodeTexCoord")
    tex.location = (-900, 0)
    nt.links.new(tex.outputs["Generated"], map_g.inputs["Vector"])
    nt.links.new(map_g.outputs["Vector"], grad.inputs["Vector"])

    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.location = (-280, 0)
    ramp.color_ramp.elements[0].position = 0.34
    ramp.color_ramp.elements[0].color = (0.42, 0.055, 0.018, 1.0)
    ramp.color_ramp.elements[1].position = 0.62
    ramp.color_ramp.elements[1].color = (0.014, 0.018, 0.038, 1.0)
    nt.links.new(grad.outputs["Color"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])


def construire_volumetrique():
    """Domaine de brume : c'est lui qui donne les rais de lumière du soleil."""
    mat = bpy.data.materials.new("Brume")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.location = (-250, 0)
    vol.inputs["Color"].default_value = (0.62, 0.42, 0.32, 1.0)
    vol.inputs["Density"].default_value = 0.016
    vol.inputs["Anisotropy"].default_value = 0.45   # diffusion vers l'avant
    nt.links.new(vol.outputs["Volume"], out.inputs["Volume"])

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 3.0))
    dom = bpy.context.object
    dom.name = "Domaine_Brume"
    dom.scale = (26, 26, 12)
    bpy.ops.object.transform_apply(scale=True)
    dom.data.materials.append(mat)
    dom.display_type = "WIRE"
    dom.visible_shadow = False
    return dom


def construire_braises():
    """Braises en suspension : particules instanciant une micro-sphère émissive."""
    try:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.012,
                                              location=(0, 0, -20))
        braise = bpy.context.object
        braise.name = "Braise_Source"
        braise.data.materials.append(emissif("Braise", (1.0, 0.34, 0.06), 90.0))

        bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 1.5, 0.05))
        emetteur = bpy.context.object
        emetteur.name = "Emetteur_Braises"
        emetteur.hide_render = True

        ps = emetteur.modifiers.new("Braises", "PARTICLE_SYSTEM").particle_system
        s = ps.settings
        s.count = 900
        s.frame_start, s.frame_end = -220, 1
        s.lifetime, s.lifetime_random = 300, 0.5
        s.normal_factor = 1.6
        s.factor_random = 1.1
        s.effector_weights.gravity = -0.06   # les braises montent
        s.render_type = "OBJECT"
        s.instance_object = braise
        s.particle_size = 1.0
        s.size_random = 0.85
        s.physics_type = "NEWTON"
        s.brownian_factor = 0.28
        return emetteur
    except (RuntimeError, AttributeError) as e:
        print(f"[braises] système de particules ignoré : {e}")
        return None


def construire_lumieres():
    """Trois points classiques, réaccordés pour un soleil mourant.

    Le soleil est en contre-jour bas : il dessine le liseré qui détache la
    silhouette du fond. Le fill froid empêche les ombres de boucher.
    """
    # Key / soleil mourant, arrière-gauche, très rasant.
    d = bpy.data.lights.new("Soleil_Mourant", "SUN")
    d.energy = 7.0
    d.color = (1.0, 0.26, 0.085)
    d.angle = math.radians(3.2)   # disque large : ombres douces de fin de jour
    sol = bpy.data.objects.new("Soleil_Mourant", d)
    bpy.context.collection.objects.link(sol)
    sol.rotation_euler = (math.radians(76), 0, math.radians(214))

    # Rim froid côté droit : sépare l'épaule droite du fond sombre.
    d = bpy.data.lights.new("Rim_Froid", "AREA")
    d.energy = 900.0
    d.color = (0.35, 0.55, 1.0)
    d.size = 2.0
    rim = bpy.data.objects.new("Rim_Froid", d)
    bpy.context.collection.objects.link(rim)
    rim.location = (3.6, 3.2, 3.4)
    rim.rotation_euler = (math.radians(58), 0, math.radians(133))

    # Fill très faible : lit les volumes dans l'ombre sans tuer le contraste.
    d = bpy.data.lights.new("Fill", "AREA")
    d.energy = 110.0
    d.color = (0.45, 0.55, 0.78)
    d.size = 5.0
    fill = bpy.data.objects.new("Fill", d)
    bpy.context.collection.objects.link(fill)
    fill.location = (-3.4, -3.6, 2.6)
    fill.rotation_euler = (math.radians(72), 0, math.radians(-46))

    # Kick au sol : renvoi chaud sous les jambes, comme un incendie hors-champ.
    d = bpy.data.lights.new("Kick_Sol", "AREA")
    d.energy = 260.0
    d.color = (1.0, 0.42, 0.14)
    d.size = 3.0
    kick = bpy.data.objects.new("Kick_Sol", d)
    bpy.context.collection.objects.link(kick)
    kick.location = (-1.2, -2.4, 0.35)
    kick.rotation_euler = (math.radians(102), 0, math.radians(-28))


def construire_camera():
    """Contre-plongée héroïque, 50 mm, mise au point sur le casque."""
    cible = bpy.data.objects.new("Cible_Camera", None)
    cible.location = (0, 0, 1.92)
    bpy.context.collection.objects.link(cible)

    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 50.0
    cam_data.dof.use_dof = True
    cam_data.dof.aperture_fstop = 2.4
    cam = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = (1.35, -4.25, 0.92)

    track = cam.constraints.new("TRACK_TO")
    track.target = cible
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"

    # Bonnette sur le casque plutôt qu'une distance en dur : la MAP suit si on
    # bouge la caméra.
    focus = bpy.data.objects.new("Focus_Casque", None)
    focus.location = (0, -0.10, 2.36)
    bpy.context.collection.objects.link(focus)
    cam_data.dof.focus_object = focus

    bpy.context.scene.camera = cam
    return cam


def configurer_rendu():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = ECHANTILLONS
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 12
    scene.cycles.transmission_bounces = 8
    scene.cycles.volume_bounces = 2
    scene.cycles.caustics_reflective = False

    prefs = bpy.context.preferences.addons.get("cycles")
    if prefs:
        for backend in ("OPTIX", "CUDA", "HIP", "METAL", "ONEAPI"):
            try:
                prefs.preferences.compute_device_type = backend
                prefs.preferences.get_devices()
                if any(d.use for d in prefs.preferences.devices):
                    scene.cycles.device = "GPU"
                    print(f"[rendu] GPU {backend} actif")
                    break
            except (TypeError, AttributeError):
                continue

    scene.render.resolution_x, scene.render.resolution_y = RESOLUTION
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "OPEN_EXR"
    scene.render.image_settings.color_depth = "16"

    # AgX (4.x) tient les hautes lumières du soleil sans virer au blanc plat.
    vs = scene.view_settings
    for transform in ("AgX", "Filmic", "Standard"):
        try:
            vs.view_transform = transform
            break
        except TypeError:
            continue
    vs.look = "AgX - Medium High Contrast" if vs.view_transform == "AgX" else "None"
    vs.exposure = 0.15

    # Léger bloom sur les lentilles et les braises.
    scene.use_nodes = True
    nt = scene.node_tree
    nt.nodes.clear()
    rl = nt.nodes.new("CompositorNodeRLayers")
    rl.location = (0, 0)
    comp = nt.nodes.new("CompositorNodeComposite")
    comp.location = (700, 0)
    viewer = nt.nodes.new("CompositorNodeViewer")
    viewer.location = (700, -220)
    try:
        glare = nt.nodes.new("CompositorNodeGlare")
        glare.location = (350, 0)
        glare.glare_type = "FOG_GLOW"
        glare.quality = "HIGH"
        glare.threshold = 1.2
        glare.size = 8
        nt.links.new(rl.outputs["Image"], glare.inputs["Image"])
        nt.links.new(glare.outputs["Image"], comp.inputs["Image"])
        nt.links.new(glare.outputs["Image"], viewer.inputs["Image"])
    except (RuntimeError, KeyError):
        nt.links.new(rl.outputs["Image"], comp.inputs["Image"])


# --------------------------------------------------------------------------- #
# ORCHESTRATION
# --------------------------------------------------------------------------- #

def purger_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for bloc in (bpy.data.meshes, bpy.data.materials, bpy.data.lights,
                 bpy.data.cameras, bpy.data.particles):
        for item in list(bloc):
            if item.users == 0:
                bloc.remove(item)


def main():
    global COLLECTION
    purger_scene()

    trims = {
        "or":    metal("Or_Imperial", (0.72, 0.50, 0.12), 0.22, patine=(0.10, 0.26, 0.20)),
        "os":    diffus("Os_Blanchi", (0.62, 0.58, 0.48), 0.62),
        "acier": metal("Acier_Poli", (0.52, 0.53, 0.56), 0.20),
    }

    M = {
        "armure":    ceramite("Ceramite_Chapitre", _conf["armure"], (0.17, 0.16, 0.15), 1.0, 0.44),
        "trim":      trims[_conf["trim"]],
        "noir":      ceramite("Ceramite_Noire", (0.011, 0.011, 0.013), (0.20, 0.19, 0.18), 0.8, 0.52),
        "gunmetal":  metal("Gunmetal", (0.075, 0.078, 0.082), 0.34),
        "cuir":      diffus("Cuir_Use", (0.055, 0.033, 0.022), 0.68),
        "parchemin": diffus("Parchemin", (0.60, 0.53, 0.38), 0.86, sss=0.30),
        "cire":      diffus("Cire_Rouge", (0.31, 0.020, 0.014), 0.34),
        "lentille":  emissif("Lentille", COULEUR_LENTILLES, INTENSITE_LENTILLES),
    }

    COLLECTION = bpy.data.collections.new("Space_Marine")
    bpy.context.scene.collection.children.link(COLLECTION)

    construire_personnage(M)
    COLLECTION = None   # le décor reste dans la collection racine

    construire_sol()
    construire_monde()
    construire_lumieres()
    construire_camera()
    if VOLUMETRIQUE:
        construire_volumetrique()
    if BRAISES:
        construire_braises()
    configurer_rendu()

    n = len(bpy.data.objects)
    print(f"\n[OK] Scène '{CHAPITRE}' construite — {n} objets, {ECHANTILLONS} échantillons.")
    print("     F12 pour rendre. Frame 1 : les braises ont fini leur simulation.")


if __name__ == "__main__":
    main()
