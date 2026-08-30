# Space Marine — brief de production 3D

Deux livrables ici :

1. **`space_marine_scene.py`** — script `bpy` qui construit réellement la scène
   (blockout + shading + éclairage + caméra + rendu). À exécuter dans ton Blender.
2. **Les prompts ci-dessous** — le brief à donner à un agent piloté par BlenderMCP,
   et la variante pour les générateurs d'images.

---

## 1. Master prompt — agent Blender (MCP)

À coller tel quel dans une session où le serveur BlenderMCP est connecté. Il est
écrit comme un brief de lead artist : contraintes d'abord, détail ensuite. Un
agent qui reçoit « fais-moi un Space Marine » produit une bouillie ; un agent qui
reçoit des proportions chiffrées et un ordre d'opérations produit quelque chose
d'utilisable.

> **Rôle** — Tu es character artist hard-surface senior. Tu construis dans Blender
> un Adeptus Astartes en armure énergétique Mark X, prêt pour un rendu héroïque.
> Tu travailles par passes, tu valides la silhouette avant d'ajouter le moindre
> détail, et tu ne passes jamais à la passe suivante tant que la précédente ne
> lit pas en contre-jour pur.
>
> **Contraintes non négociables**
> - Échelle réelle : 2,55 m de haut, origine du monde entre les pieds, Z vers le haut.
> - L'avant du personnage regarde vers −Y.
> - Topologie : quads, pas de n-gon sur les surfaces courbes. Bevel + Weighted
>   Normal sur chaque plaque ; jamais de Subsurf sur une plaque d'armure sans
>   arêtes de support.
> - Symétrie par modificateur Mirror sur X, pas par duplication manuelle.
> - Tout objet nommé en clair et rangé dans une collection `Space_Marine`.
> - Aucune texture bitmap : tout le salissement est procédural, porté par
>   `Geometry > Pointiness`.
>
> **Passe 1 — silhouette.** Blockout aux primitives uniquement. Ce qui doit lire
> à 100 % en noir sur fond blanc : pauldrons plus larges que le torse, casque
> enfoncé dans les épaules sans cou visible, sac dorsal qui déborde derrière,
> masse concentrée en haut et jambes en trapèze. Proportions cibles : bottes
> 0→0,22 m ; grèves 0,22→0,75 ; genouillères à 0,75 ; cuisses 0,75→1,30 ;
> bassin 1,20→1,42 ; abdomen segmenté en trois bandes 1,45→1,82 ; plastron
> 1,80→2,17 ; gorget 2,15→2,26 ; casque 2,26→2,55. Pauldrons centrés à z = 2,06,
> débordant jusqu'à x = ±0,80. Arrête-toi et montre-moi la silhouette.
>
> **Passe 2 — plaques.** Sépare chaque volume en plaques distinctes avec un jeu
> de 3 à 5 mm entre elles. C'est le jeu qui fait lire l'armure comme articulée
> plutôt que comme une combinaison moulée. Chanfreine toutes les arêtes vives
> (0,015 à 0,03 m, 4 segments, angle limite 35°).
>
> **Passe 3 — accessoires narratifs.** Aquila sur le plastron, liseré sur les
> rebords de pauldron et les genouillères, cheminées d'échappement sur le sac
> dorsal, bolter tenu en travers du buste, trois sceaux de pureté (cachet de cire
> + parchemin) suspendus asymétriquement — jamais centrés, jamais alignés :
> c'est l'asymétrie qui donne la vie. Sangles de cuir usé sur l'arme.
>
> **Passe 4 — shading.** Un shader « céramite » réutilisable : la couleur de base
> du chapitre, un masque d'usure tiré de `Geometry > Pointiness` remappé serré
> autour de 0,5 (from_min 0,505, from_max 0,560), multiplié par un bruit d'échelle
> 60 pour casser le liseré régulier. Ce masque pilote trois choses à la fois :
> la couleur (peinture → métal nu), le Metallic (0 → 1) et la Roughness
> (0,44 → 0,22). Un second bruit large échelle 3 assombrit les creux de 60 %
> pour la crasse. Bump final : bruit échelle 220, force 0,14. Le liseré or reçoit
> le traitement inverse — vert-de-gris dans les creux via Pointiness inversé.
>
> **Passe 5 — éclairage.** Soleil mourant en contre-jour bas : SUN, énergie 7,
> couleur (1.0, 0.26, 0.085), angle 3,2° pour des ombres douces de fin de jour,
> rotation (76°, 0, 214°). Rim froid arrière-droit : AREA bleu, 900 W, taille 2.
> Fill frontal très faible : AREA bleu-gris, 110 W, taille 5 — juste assez pour
> lire les volumes dans l'ombre sans tuer le contraste. Kick chaud au sol,
> 260 W, comme un incendie hors-champ. Monde en dégradé vertical : horizon
> rouge sang, zénith bleu nuit.
>
> **Passe 6 — atmosphère et caméra.** Cube volumétrique 26×26×12 en Principled
> Volume, densité 0,016, anisotropie 0,45 : c'est lui qui donne les rais de
> lumière. Braises en système de particules, gravité négative. Caméra 50 mm en
> contre-plongée à (1.35, −4.25, 0.92), contrainte Track To sur un empty à
> z = 1,92, DOF f/2.4 avec focus object sur le casque. Cycles, 256 échantillons,
> denoising, AgX en Medium High Contrast.

**Note d'usage** — un agent MCP travaille par appels successifs sur une scène
vivante. Découpe : lance la passe 1, regarde le viewport, corrige, puis enchaîne.
Balancer les six passes d'un coup donne systématiquement une scène incohérente
qu'il faut reprendre entièrement.

---

## 2. Prompt génération d'image

Pour Midjourney / SDXL / Flux / Firefly.

```
Hyper-detailed 3D character render of a Warhammer 40k Space Marine veteran,
ornate battle-worn Mark X power armor with intricate gothic filigree, chest
aquila and skull motifs, purity seals with wax stamps and parchment scrolls
fluttering, chipped gunmetal edges over deep cobalt ceramite, verdigris-bronze
trim, deep battle scars and micro-scratches, glowing green eye lenses under a
heavy snouted helmet, bolter held across the chest with worn leather straps and
brass fittings, heroic low-angle contrapposto pose, dramatic rim lighting from a
dying red sun, cool blue backlight separating the silhouette, volumetric dust and
floating embers, cinematic shallow depth of field, ultra-detailed PBR materials
with roughness variation and edge wear, sculpted in ZBrush, textured in Substance
Painter, rendered in Octane, 8k, hyperrealistic, grimdark atmosphere,
trending on ArtStation
```

Négatif : `cartoonish, flat even lighting, low detail, blurry, plastic sheen, deformed anatomy, extra limbs, symmetrical clutter, text, watermark`

**Les trois leviers qui comptent vraiment**, si tu dois couper :
- `low-angle` + `rim lighting` → la lecture héroïque. Sans ça, tout le reste tombe à plat.
- `chipped edges` + `roughness variation` → ce qui sépare le rendu 3D pro du rendu plastique.
- `volumetric dust` → la profondeur atmosphérique, seule chose qui fasse exister l'échelle.

Variante compacte pour les outils qui plafonnent en tokens :

```
Grimdark Space Marine veteran, battle-worn ornate power armor, chipped ceramite
edges, purity seals, bolter, low-angle hero shot, dying red sun rim light,
volumetric dust, hyperreal PBR, Octane render, 8k, ArtStation
```

---

## 3. Exécuter le script

```bash
# Interface : onglet Scripting > Ouvrir > space_marine_scene.py > Exécuter
# Ligne de commande :
blender -b -P space_marine_scene.py -o //render_ -f 1
```

Blender 4.2 LTS visé ; les noms de sockets sont résolus dynamiquement pour rester
compatibles 3.6 → 4.5.

Réglages en tête de fichier :

| Variable | Effet |
|---|---|
| `CHAPITRE` | `ultramarines`, `blood_angels`, `dark_angels`, `salamanders`, `black_templars`, `iron_hands` |
| `COULEUR_LENTILLES` | Vert par défaut — il tranche avec le rouge du soleil. Passe en rouge pour du canon Ultramarines, tu y perdras en lisibilité. |
| `RESOLUTION` | `(2000, 2500)` par défaut. `(6400, 8000)` pour du 8K — compte plusieurs heures. |
| `ECHANTILLONS` | 256 suffit avec le denoiser. Monte à 1024 si les volumétriques grainent. |
| `BRAISES` / `VOLUMETRIQUE` | Coupe-les pour itérer vite sur le shading. |

Rends la **frame 1** : le système de particules démarre à −220 pour que les
braises aient fini de se répartir quand la caméra les voit.

### Ce que le script fait et ne fait pas

Il produit un **blockout de production** : silhouette, proportions, matériaux,
lumière, caméra, atmosphère. C'est le point de départ dont part un pro, et la
partie qui prend le plus de temps à accorder correctement.

Il ne produit **pas** un sculpt fini. Le filigrane gothique, l'aquila ciselée,
les plis du parchemin, le visage sous le casque : ça se sculpte en mode Sculpt
avec des alphas, ou ça se retopologise depuis ZBrush. Le script pose les volumes
propres et nommés sur lesquels greffer ce travail.

---

## 4. Brancher BlenderMCP en local

Cette session Claude Code tourne dans un conteneur cloud isolé — elle ne peut pas
atteindre le `localhost` de ta machine, donc pas de pilotage Blender depuis ici.
Pour piloter Blender par MCP, il faut une session Claude Code **locale** :

1. Récupère l'addon [`blender-mcp`](https://github.com/ahujasid/blender-mcp) et
   installe-le dans Blender (Edit > Preferences > Add-ons > Install from Disk).
2. Active-le, puis dans le viewport : `N` > onglet BlenderMCP > **Connect**.
   L'addon ouvre un serveur socket local (port 9876 par défaut).
3. Déclare le serveur MCP côté client, par exemple :
   ```bash
   claude mcp add blender -- uvx blender-mcp
   ```
4. Lance `claude` **depuis ta machine**, pas depuis le web. Vérifie avec `/mcp`
   que le serveur apparaît connecté.

Blender doit tourner et le bouton Connect être actif avant de lancer la session,
sinon le serveur MCP démarre sans trouver son addon.
