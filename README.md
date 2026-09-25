# NextJs

Learning nextJs — figurine 3D procédurale de **Guts** (Berserk), rendue avec Three.js.

## Lancer

```bash
npm install
npm run dev
# http://localhost:3000
```

## Contenu

- `lib/gutsHead.ts` — tête sculptée : visage d'un seul maillage déformé (mâchoire carrée, arcades,
  pommettes, nez droit), yeux plissés, sourcils épais, cicatrice en relief sur le nez, mèches.
- `lib/guts.ts` — modèle construit par code : armure du Berserker en plaques, cape déchiquetée,
  bras gauche prothèse, cheveux en pointes, cicatrice, Dragon Slayer, socle rocheux avec plaque.
- `components/GutsViewer.tsx` — scène, éclairage, caméra orbitale, vues prédéfinies
  (face, 3/4, profil, dos, plongée, contre-plongée, visage, profil visage, portrait 3/4), poses (debout / en combat).
- Export `.glb` (Blender, visionneuses) et `.stl` (impression 3D) depuis l'interface.

## Aperçu

| Debout | Dos | En combat |
| --- | --- | --- |
| ![Debout](docs/guts-debout.png) | ![Dos](docs/guts-dos.png) | ![En combat](docs/guts-combat.png) |

| Visage | Profil visage |
| --- | --- |
| ![Visage](docs/guts-visage.png) | ![Profil visage](docs/guts-profil-visage.png) |
