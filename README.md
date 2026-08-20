# WILD GYM

Page d'accueil d'une salle de sport premium à ciel ouvert, imaginée au cœur de
la jungle d'Ubud, à Bali. Design organique et brut : bois de teck, tons vert
forêt / brun / sable, typographie massive et photos en pleine végétation.

Construit avec **Next.js 16** (App Router), **React 19**, **TypeScript** et
**Tailwind CSS 4**.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
```

Autres commandes :

```bash
npm run build      # build de production
npm run start      # sert le build de production
npm run lint       # ESLint
npm run images     # régénère les photos placeholder
```

## Ce que contient la page

| Section | Fichier | Contenu |
| --- | --- | --- |
| En-tête | `src/components/SiteHeader.tsx` | Navigation translucide qui se densifie au défilement, menu mobile plein écran |
| Hero | `src/components/Hero.tsx` | Plein écran, photo de la salle sous la canopée, slogan « Là où la nature devient ta salle », bandeau de chiffres en bois |
| Manifeste | `src/components/Manifesto.tsx` | Le parti pris du lieu, bord déchiré organique, photo en forme de galet |
| Bandeau | `src/components/Marquee.tsx` | Défilé de mots-clés sur fond de bois clair |
| Entraînements | `src/components/Trainings.tsx` | Les 3 formats : Jungle Strength, Canopy Flow, Wild Conditioning |
| L'espace | `src/components/Gallery.tsx` | Galerie asymétrique de 6 photos avec visionneuse (clavier ← → Échap) |
| Rejoindre | `src/components/Join.tsx` | CTA d'inscription : formulaire d'essai gratuit 3 jours (démo, sans back-end) |
| Pied de page | `src/components/SiteFooter.tsx` | Horaires, adresse, contacts |

Tout le contenu éditorial (textes, chiffres, légendes) est regroupé dans
`src/lib/content.ts` : c'est le seul fichier à toucher pour changer les mots.

## Design system

Les jetons de couleur, les matières et les animations vivent dans
`src/app/globals.css` :

- **Palette** — `forest-*` (canopée), `moss-*` (pousses), `wood-*` (teck et
  terre), `sand-*` (lumière), `clay-*` (accent).
- **Matières** — `.texture-wood` (veinage de lattes), `.texture-fiber` (fibre
  végétale claire), `.texture-canopy` (ombres de feuillage), `.grain` (grain
  argentique en surimpression).
- **Formes organiques** — `.blob-a`, `.blob-b`, `.leaf-mask` : des rayons de
  bordure asymétriques pour éviter les rectangles.
- **Typographie** — Anton pour les titres, Barlow pour le texte courant.
- **Mouvement** — dérive lente de la photo hero, feuillage qui oscille,
  apparitions au défilement (`src/components/Reveal.tsx`). Tout est neutralisé
  sous `prefers-reduced-motion`.

## Les photos placeholder

Aucun service d'images externe : les treize visuels de `public/images` sont
générés localement par `scripts/generate-placeholders.mjs`. Le script compose
chaque scène en SVG — dégradé de lumière, couches successives de végétation
tropicale avec perspective atmosphérique et flou de profondeur, agrès en bois en
silhouette — puis la rastérise en JPEG avec un grain argentique via `sharp`.

```bash
npm run images                 # tout régénérer
npm run images hero gallery-4  # seulement certaines images
```

Chaque image a une graine fixe : le rendu est reproductible. Pour passer à de
vraies photos, il suffit de remplacer les fichiers de `public/images` en gardant
les mêmes noms.
