/** Contenu éditorial de la page d’accueil BRIN SAUVAGE. */

export const shop = {
  name: "Brin Sauvage",
  baseline: "Là où la saison devient bouquet",
  location: "12 rue des Pierres Plantées, Lyon — Croix-Rousse",
  metro: "Métro Croix-Rousse, sortie Pierres Plantées",
  phone: "04 78 29 61 40",
  email: "bonjour@brinsauvage.fr",
  hours: [
    { days: "Lundi", time: "Fermé" },
    { days: "Mardi — Vendredi", time: "09:00 — 19:30" },
    { days: "Samedi", time: "08:30 — 20:00" },
    { days: "Dimanche", time: "09:00 — 13:00" },
  ],
} as const;

export const navLinks = [
  { label: "La maison", href: "#maison" },
  { label: "Nos bouquets", href: "#bouquets" },
  { label: "L’atelier", href: "#atelier" },
  { label: "Commander", href: "#commander" },
] as const;

/**
 * Les cinq univers présentés dans le sélecteur du hero.
 * `icon` est une clé résolue en composant dans `sections/Hero.tsx`,
 * pour que ce fichier reste du contenu pur, sans JSX.
 */
export const heroUnivers = [
  {
    icon: "bouquet",
    title: "Bouquet du jour",
    description: "Composé le matin même",
    image: "/images/offre-bouquet.jpg",
  },
  {
    icon: "abonnement",
    title: "Abonnement",
    description: "Chaque semaine, au bureau",
    image: "/images/offre-abonnement.jpg",
  },
  {
    icon: "mariage",
    title: "Mariages",
    description: "Arches et centres de table",
    image: "/images/offre-evenements.jpg",
  },
  {
    icon: "plantes",
    title: "Plantes d’intérieur",
    description: "Rempotage compris",
    image: "/images/gallery-4.jpg",
  },
  {
    icon: "atelier",
    title: "Ateliers du samedi",
    description: "Six personnes, deux heures",
    image: "/images/gallery-3.jpg",
  },
] as const;

export const heroStats = [
  { value: "1998", unit: "", label: "sur le même trottoir" },
  { value: "80", unit: "km", label: "autour de la boutique" },
  { value: "0", unit: "", label: "fleur arrivée par avion" },
  { value: "6", unit: "j/7", label: "de fleurs coupées du matin" },
] as const;

export const manifestoPoints = [
  {
    title: "Cultivé près d’ici",
    text: "Six maraîchers du Beaujolais, de l’Isère et des Monts d’Or. Aucune de nos fleurs ne prend l’avion, aucune ne dort en chambre froide plus de deux jours.",
  },
  {
    title: "Coupé le matin",
    text: "La camionnette part à 5 h, la boutique ouvre à 9 h. Ce qui remplit les seaux devant la porte a été coupé la veille au soir, ou le matin même.",
  },
  {
    title: "Composé à la main",
    text: "Pas deux bouquets identiques. On compose avec ce que la saison donne, et vous pouvez piocher vous-même dans les seaux si l’envie vous prend.",
  },
] as const;

export const offers = [
  {
    index: "01",
    name: "Le bouquet du jour",
    tagline: "Ce que la saison donne",
    description:
      "Notre bouquet signature, refait chaque matin avec l’arrivage. Trois tailles, emballé kraft et ficelle de lin, prêt à partir en quinze minutes.",
    image: "/images/offre-bouquet.jpg",
    price: "dès 22 €",
    vaseLife: 4,
    lead: "prêt en 15 min",
    tags: ["De saison", "3 tailles", "Sans plastique"],
  },
  {
    index: "02",
    name: "L’abonnement fleuri",
    tagline: "Chaque semaine, sans y penser",
    description:
      "Un bouquet livré au bureau ou à la maison, toutes les semaines ou tous les quinze jours. Sans engagement : vous mettez en pause quand vous partez.",
    image: "/images/offre-abonnement.jpg",
    price: "dès 19 €/sem.",
    vaseLife: 5,
    lead: "livré le mardi",
    tags: ["Sans engagement", "Livré à vélo", "Vase prêté"],
  },
  {
    index: "03",
    name: "Mariages & événements",
    tagline: "La grande composition",
    description:
      "Arche, centres de table, boutonnières, décor d’église ou de salle. On repère les lieux ensemble, puis on installe le matin même et on démonte le soir.",
    image: "/images/offre-evenements.jpg",
    price: "sur devis",
    vaseLife: 3,
    lead: "6 mois avant",
    tags: ["Repérage inclus", "Installation", "Démontage"],
  },
] as const;

/**
 * La galerie pave exactement une grille de 6 colonnes :
 * bandeau 4×3 + colonne 2×4, puis 2×3 + 2×3 + 2×2, puis bandeau 6×2.
 */
export const gallery = [
  {
    src: "/images/gallery-1.jpg",
    alt: "Seaux de zinc remplis de fleurs coupées devant la boutique",
    caption: "Les seaux du matin, devant la porte",
    span: "col-span-2 row-span-2 sm:col-span-4 sm:row-span-3",
  },
  {
    src: "/images/gallery-2.jpg",
    alt: "Bottes de fleurs séchées suspendues à une poutre de bois",
    caption: "Les séchées, sous la poutre",
    span: "row-span-2 sm:col-span-2 sm:row-span-4",
  },
  {
    src: "/images/gallery-3.jpg",
    alt: "Établi de fleuriste avec papier kraft, ficelle et tiges coupées",
    caption: "L’établi, en plein montage",
    span: "row-span-2 sm:col-span-2 sm:row-span-3",
  },
  {
    src: "/images/gallery-4.jpg",
    alt: "Étagère de plantes vertes en pots de terre cuite",
    caption: "L’étagère des plantes d’intérieur",
    span: "row-span-2 sm:col-span-2 sm:row-span-3",
  },
  {
    src: "/images/gallery-5.jpg",
    alt: "Bouquet du jour dans un vase de verre, sur le comptoir",
    caption: "Un bouquet du jour, taille moyenne",
    span: "row-span-2 sm:col-span-2 sm:row-span-2",
  },
  {
    src: "/images/gallery-6.jpg",
    alt: "Devanture de la boutique éclairée à la tombée du jour",
    caption: "La devanture, à l’heure de la fermeture",
    span: "col-span-2 row-span-2 sm:col-span-6 sm:row-span-2",
  },
] as const;

export const occasions = [
  { value: "jour", label: "Un bouquet du jour" },
  { value: "abonnement", label: "Un abonnement hebdomadaire" },
  { value: "evenement", label: "Un mariage ou un événement" },
  { value: "plante", label: "Une plante d’intérieur" },
] as const;

export const orderFacts = [
  { term: "Composé en", detail: "15 min" },
  { term: "Réponse", detail: "sous 24 h" },
  { term: "Livraison", detail: "Lyon 1er & 4e" },
] as const;

export const orderPerks = [
  "Composé avec l’arrivage du matin, jamais deux fois le même",
  "Emballage kraft et ficelle de lin, zéro plastique",
  "Livraison à vélo dans les 1er et 4e arrondissements",
] as const;

export const marqueeWords = [
  "Coupé du matin",
  "Six producteurs",
  "Zéro avion",
  "Kraft & ficelle",
  "De saison",
  "Livré à vélo",
  "Fermé le lundi",
] as const;

export const socials = [
  { label: "Instagram", href: "#" },
  { label: "Facebook", href: "#" },
  { label: "Pinterest", href: "#" },
] as const;
