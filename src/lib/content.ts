/** Contenu éditorial de la page d'accueil WILD GYM. */

export const gym = {
  name: "Wild Gym",
  baseline: "Là où la nature devient ta salle",
  location: "Jl. Raya Tegallalang, Ubud — Bali",
  coordinates: "8°25′S · 115°17′E",
  phone: "+62 361 555 0142",
  email: "halo@wildgym.bali",
  hours: [
    { days: "Lundi — Vendredi", time: "05:30 — 21:00" },
    { days: "Samedi", time: "06:00 — 20:00" },
    { days: "Dimanche", time: "06:00 — 14:00" },
  ],
} as const;

export const navLinks = [
  { label: "Manifeste", href: "#manifeste" },
  { label: "Entraînements", href: "#entrainements" },
  { label: "L'espace", href: "#espace" },
  { label: "Rejoindre", href: "#rejoindre" },
] as const;

export const heroStats = [
  { value: "1 400", unit: "m²", label: "à ciel ouvert" },
  { value: "0", unit: "", label: "mur, zéro miroir" },
  { value: "28", unit: "°C", label: "toute l'année" },
  { value: "12", unit: "", label: "coachs balinais" },
] as const;

export const manifestoPoints = [
  {
    title: "Matière brute",
    text: "Teck massif, bambou noir, pierre de rivière et sacs de sable cousus au village. Rien de chromé, rien de plastique.",
  },
  {
    title: "Sous la canopée",
    text: "Chaque plateau est construit autour des arbres existants. Pas un banian n'a été abattu pour poser un rack.",
  },
  {
    title: "Ancré ici",
    text: "Coachs balinais, eau de source filtrée sur place, énergie solaire. La salle appartient à la vallée avant de nous appartenir.",
  },
] as const;

export type Training = {
  index: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  duration: string;
  intensity: number;
  group: string;
  tags: readonly string[];
};

export const trainings: readonly Training[] = [
  {
    index: "01",
    name: "Jungle Strength",
    tagline: "Force brute",
    description:
      "Portique en teck, pierres de rivière, sacs de sable et anneaux suspendus. On soulève du lourd, pieds nus dans la terre rouge, à l'ombre des fougères arborescentes.",
    image: "/images/training-strength.jpg",
    duration: "60 min",
    intensity: 4,
    group: "6 personnes max",
    tags: ["Force", "Poids libres", "Pieds nus"],
  },
  {
    index: "02",
    name: "Canopy Flow",
    tagline: "Mobilité & souffle",
    description:
      "Deck de bambou perché à quinze mètres au-dessus de la rivière. Mobilité, respiration et gainage lent, face à la vallée qui se réveille dans la brume.",
    image: "/images/training-flow.jpg",
    duration: "75 min",
    intensity: 2,
    group: "12 personnes max",
    tags: ["Mobilité", "Souffle", "Lever du soleil"],
  },
  {
    index: "03",
    name: "Wild Conditioning",
    tagline: "Cardio sauvage",
    description:
      "Cordes lourdes, pneus de tracteur, sprints sur le sentier de terre et portage de bûches. Le circuit se termine toujours dans le bassin de pierre, à 16 °C.",
    image: "/images/training-wild.jpg",
    duration: "45 min",
    intensity: 5,
    group: "8 personnes max",
    tags: ["Cardio", "Circuit", "Bain froid"],
  },
] as const;

export const gallery = [
  {
    src: "/images/gallery-1.jpg",
    alt: "Portique d'entraînement en teck installé dans une clairière de jungle",
    caption: "Le portique de teck, cœur de l'aire de force",
    span: "col-span-2 row-span-2 sm:col-span-4 sm:row-span-3",
  },
  {
    src: "/images/gallery-2.jpg",
    alt: "Sentier d'échauffement bordé de fougères et de bambous",
    caption: "Sentier d'échauffement, versant est",
    span: "row-span-2 sm:col-span-2 sm:row-span-4",
  },
  {
    src: "/images/gallery-3.jpg",
    alt: "Deck de bambou au coucher du soleil au-dessus de la vallée",
    caption: "Deck de bambou, séance de 17 h",
    span: "row-span-2 sm:col-span-2 sm:row-span-3",
  },
  {
    src: "/images/gallery-4.jpg",
    alt: "Bassin de pierre alimenté par une canalisation en bambou",
    caption: "Bassin de pierre, récupération froide",
    span: "row-span-2 sm:col-span-2 sm:row-span-3",
  },
  {
    src: "/images/gallery-5.jpg",
    alt: "Aire d'entraînement extérieure avec pneus, cordes et rack de pierres",
    caption: "Aire wild : pneus, cordes, pierres",
    span: "row-span-2 sm:col-span-2 sm:row-span-2",
  },
  {
    src: "/images/gallery-6.jpg",
    alt: "Plateau de bois entouré de végétation dense au petit matin",
    caption: "Plateau nord, 6 h du matin",
    span: "col-span-2 row-span-2 sm:col-span-6 sm:row-span-2",
  },
] as const;

export const plans = [
  { value: "decouverte", label: "Découverte — 3 jours offerts" },
  { value: "nomade", label: "Nomade — 1 mois, illimité" },
  { value: "resident", label: "Résident — 6 mois + coaching" },
] as const;

export const marqueeWords = [
  "Pieds nus",
  "Teck & pierre",
  "Sous la canopée",
  "Aucun miroir",
  "Sueur & mousson",
  "Lever du soleil",
  "Rivière froide",
] as const;
