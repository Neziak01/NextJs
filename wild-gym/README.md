# WILD GYM

Page d'accueil d'une salle de sport premium à ciel ouvert, imaginée au cœur de
la jungle d'Ubud, à Bali. Design organique et brut : bois de teck, tons vert
forêt / brun / sable, typographie massive et photos en pleine végétation.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
structure shadcn/ui.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
```

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run start` | sert le build de production |
| `npm run lint` | ESLint |
| `npm run images` | régénère les photos placeholder |

## Structure

```
wild-gym/
├── public/images/            13 photos placeholder générées localement
├── scripts/
│   └── generate-placeholders.mjs
└── src/
    ├── app/                  layout, page, globals.css, icon.svg
    ├── components/
    │   ├── demo/             exemples d'usage isolés
    │   ├── sections/         une section de la page = un fichier
    │   └── ui/               briques réutilisables (convention shadcn)
    └── lib/
        ├── content.ts        tout le contenu éditorial
        └── utils.ts          cn() : clsx + tailwind-merge
```

## Structure shadcn/ui

`components.json` est présent : `npx shadcn@latest add <composant>` dépose
directement dans `src/components/ui`, résout `@/lib/utils` et écrit dans
`src/app/globals.css`. La configuration est volontairement en
`cssVariables: false` pour que le CLI n'écrase pas les jetons de couleur du
design system.

| Rôle | Chemin |
| --- | --- |
| Composants d'interface | `src/components/ui` (alias `@/components/ui`) |
| Composants applicatifs | `src/components` (alias `@/components`) |
| Styles | `src/app/globals.css` |
| Utilitaires | `src/lib` (alias `@/lib`) |

## Les sections

| Section | Fichier | Contenu |
| --- | --- | --- |
| En-tête | `sections/SiteHeader.tsx` | Navigation translucide qui se densifie au défilement, menu mobile plein écran |
| Hero | `sections/Hero.tsx` | Plein écran, photo de la salle sous la canopée, slogan « Là où la nature devient ta salle », sélecteur de plateaux, bandeau de chiffres sur une latte de teck |
| Manifeste | `sections/Manifesto.tsx` | Le parti pris du lieu, bord déchiré organique, photo en forme de galet |
| Bandeau | `sections/Marquee.tsx` | Défilé de mots-clés sur fond de bois clair |
| Entraînements | `sections/Trainings.tsx` | Les 3 formats : Jungle Strength, Canopy Flow, Wild Conditioning |
| L'espace | `sections/Gallery.tsx` | Galerie asymétrique de 6 photos avec visionneuse (← → et Échap) |
| Rejoindre | `sections/Join.tsx` | CTA d'inscription : formulaire d'essai gratuit 3 jours (démo, sans back-end) |
| Pied de page | `sections/SiteFooter.tsx` | Horaires, adresse, contacts |

Textes, chiffres et légendes sont tous regroupés dans `src/lib/content.ts` :
c'est le seul fichier à toucher pour changer les mots.

## Le sélecteur de plateaux

`src/components/ui/interactive-selector.tsx` est une bande de panneaux qui se
déplient au clic : le panneau actif prend sept fois la place des autres et
révèle son libellé. Il est piloté par ses props, toutes optionnelles — sans
aucune, il rend son jeu de données d'exemple (`src/components/demo/`).

| Prop | Défaut | Rôle |
| --- | --- | --- |
| `options` | jeu d'exemple | `{ title, description, image, icon }[]` |
| `title` / `subtitle` | textes d'exemple | Bandeau d'en-tête |
| `showHeader` | `true` | Masque l'en-tête pour l'insérer dans une section |
| `defaultIndex` | `0` | Panneau ouvert au premier rendu |
| `activeBorderColor` / `idleBorderColor` | `#fff` / `#292929` | Liseré des panneaux |
| `className` | — | Fusionné via `cn()` : la classe passée gagne |

Le hero lui passe les cinq plateaux de `content.ts` (`heroPlateaux`), les
photos locales et les couleurs de la palette. Les icônes viennent de
`react-icons/fa`. Sous `sm` la bande s'empile verticalement ; l'entrée en
cascade des panneaux est en CSS pur et se désactive sous
`prefers-reduced-motion`.

## Design system

Jetons de couleur, matières et animations vivent dans `src/app/globals.css` :

- **Palette** — `forest-*` (canopée), `moss-*` (pousses), `wood-*` (teck et
  terre), `sand-*` (lumière), `clay-*` (accent).
- **Matières** — `.texture-wood` (veinage de lattes), `.texture-fiber` (fibre
  végétale claire), `.texture-canopy` (lueurs de feuillage), `.grain` (grain
  argentique en surimpression).
- **Formes organiques** — `.blob-a`, `.leaf-mask` : des rayons de bordure
  asymétriques pour éviter les rectangles.
- **Typographie** — Anton pour les titres, Barlow pour le texte courant.
- **Mouvement** — dérive lente de la photo hero, feuillage qui oscille,
  apparitions au défilement (`ui/Reveal.tsx`). Tout est neutralisé sous
  `prefers-reduced-motion`.

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
