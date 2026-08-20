# BRIN SAUVAGE

Page d’accueil d’un fleuriste artisan de quartier, rue des Pierres Plantées à
la Croix-Rousse (Lyon). Design clair et matiéré : papier de soie, kraft, toile
de lin, verts d’eucalyptus, terre cuite et rose de pivoine, avec une
typographie sérif éditoriale.

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
brin-sauvage/
├── public/images/            13 photos placeholder générées localement
├── scripts/
│   └── generate-placeholders.mjs
└── src/
    ├── app/                  layout, page, globals.css, icon.svg
    ├── components/
    │   ├── demo/             exemples d’usage isolés
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
`cssVariables: false` pour que le CLI n’écrase pas les jetons de couleur du
design system.

| Rôle | Chemin |
| --- | --- |
| Composants d’interface | `src/components/ui` (alias `@/components/ui`) |
| Composants applicatifs | `src/components` (alias `@/components`) |
| Styles | `src/app/globals.css` |
| Utilitaires | `src/lib` (alias `@/lib`) |

## Les sections

| Section | Fichier | Contenu |
| --- | --- | --- |
| En-tête | `sections/SiteHeader.tsx` | Navigation translucide qui se densifie au défilement, menu mobile plein écran |
| Hero | `sections/Hero.tsx` | Plein écran, devanture au petit matin, slogan « Là où la saison devient bouquet », sélecteur d’univers, bandeau de chiffres sur toile de lin |
| La maison | `sections/Manifesto.tsx` | Le parti pris de la boutique, bord de papier déchiré, photo de l’établi |
| Bandeau | `sections/Marquee.tsx` | Défilé de mots-clés sur toile de lin |
| Nos bouquets | `sections/Offers.tsx` | Les 3 offres : bouquet du jour, abonnement, mariages & événements |
| L’atelier | `sections/Gallery.tsx` | Galerie asymétrique de 6 photos avec visionneuse (← → et Échap) |
| Commander | `sections/Order.tsx` | Formulaire de demande, sur une carte de kraft (démo, sans back-end) |
| Pied de page | `sections/SiteFooter.tsx` | Horaires, adresse, contacts |

Textes, prix, horaires et légendes sont tous regroupés dans
`src/lib/content.ts` : c’est le seul fichier à toucher pour changer les mots.

## Le sélecteur d’univers

`src/components/ui/interactive-selector.tsx` est une bande de panneaux qui se
déplient au clic : le panneau actif prend sept fois la place des autres et
révèle son libellé. Il est piloté par ses props, toutes optionnelles — sans
aucune, il rend son jeu de données d’exemple (`src/components/demo/`).

| Prop | Défaut | Rôle |
| --- | --- | --- |
| `options` | jeu d’exemple | `{ title, description, image, icon }[]` |
| `title` / `subtitle` | textes d’exemple | Bandeau d’en-tête |
| `showHeader` | `true` | Masque l’en-tête pour l’insérer dans une section |
| `defaultIndex` | `0` | Panneau ouvert au premier rendu |
| `activeBorderColor` / `idleBorderColor` | `#fff` / `#292929` | Liseré des panneaux |
| `className` | — | Fusionné via `cn()` : la classe passée gagne |

Le hero lui passe les cinq univers de `content.ts` (`heroUnivers`), les photos
locales et les couleurs de la palette. Les icônes viennent de `react-icons/fa`.
Sous `sm` la bande s’empile verticalement ; l’entrée en cascade des panneaux
est en CSS pur et se désactive sous `prefers-reduced-motion`.

## Design system

Jetons de couleur, matières et animations vivent dans `src/app/globals.css` :

- **Palette** — `sage-*` (feuillage), `paper-*` (papier de soie, lin),
  `bark-*` (établi, kraft), `clay-*` (terre cuite, accent principal),
  `bloom-*` (rose de pivoine, accent secondaire).
- **Matières** — `.texture-paper` (trame de papier de soie), `.texture-kraft`
  (fibres d’emballage), `.texture-linen` (toile de lin), `.texture-window`
  (lueurs de vitrine), `.grain` (grain argentique en surimpression).
- **Formes organiques** — `.blob-a`, `.petal-mask` : des rayons de bordure
  asymétriques pour éviter les rectangles.
- **Typographie** — Fraunces pour les titres, Karla pour le texte courant.
- **Mouvement** — dérive lente de la photo hero, feuillage qui oscille,
  apparitions au défilement (`ui/Reveal.tsx`). Tout est neutralisé sous
  `prefers-reduced-motion`.

Le site est clair par défaut, avec deux respirations sombres — la galerie et
la section commande — pour faire ressortir les photos.

## Les photos placeholder

Aucun service d’images externe : les treize visuels de `public/images` sont
générés localement par `scripts/generate-placeholders.mjs`. Le script compose
chaque scène en SVG — lumière de vitrine, décor de boutique, puis les fleurs
assemblées tige par tige (corolles, épis, ombelles, eucalyptus) dans des seaux
de zinc, des vases ou des pots de terre cuite — avant de la rastériser en JPEG
avec un grain argentique via `sharp`.

Huit décors sont disponibles : `devanture`, `etal`, `atelier`, `bouquetVase`,
`arche`, `sechees`, `plantes` et `comptoir`, déclinés en quatre lumières
(`matin`, `boutique`, `serre`, `soir`).

```bash
npm run images                 # tout régénérer
npm run images hero gallery-4  # seulement certaines images
```

Chaque image a une graine fixe : le rendu est reproductible. Pour passer à de
vraies photos, il suffit de remplacer les fichiers de `public/images` en
gardant les mêmes noms.
