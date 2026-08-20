import Image from "next/image";
import type { ReactNode } from "react";
import {
  FaCalendarAlt,
  FaCut,
  FaHeart,
  FaSeedling,
  FaSpa,
} from "react-icons/fa";
import InteractiveSelector, {
  type SelectorOption,
} from "@/components/ui/interactive-selector";
import { heroStats, heroUnivers, shop } from "@/lib/content";

const universIcons: Record<string, ReactNode> = {
  bouquet: <FaSpa size={20} className="text-paper-50" />,
  abonnement: <FaCalendarAlt size={18} className="text-paper-50" />,
  mariage: <FaHeart size={18} className="text-paper-50" />,
  plantes: <FaSeedling size={20} className="text-paper-50" />,
  atelier: <FaCut size={18} className="text-paper-50" />,
};

const universOptions: SelectorOption[] = heroUnivers.map((univers) => ({
  title: univers.title,
  description: univers.description,
  image: univers.image,
  icon: universIcons[univers.icon],
}));

export default function Hero() {
  return (
    <section
      id="top"
      className="grain relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden"
    >
      {/* La devanture, au petit matin */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero.jpg"
          alt="Devanture de la boutique au petit matin, seaux de fleurs coupées alignés sur le trottoir"
          fill
          priority
          sizes="100vw"
          className="animate-drift object-cover object-center"
        />
      </div>

      {/* Voiles de lumière : le texte se détache sans assombrir la vitrine */}
      <div className="absolute inset-0 bg-[linear-gradient(100deg,var(--color-paper-50)_0%,rgba(253,250,244,0.93)_20%,rgba(253,250,244,0.6)_37%,rgba(253,250,244,0.15)_57%,rgba(253,250,244,0)_74%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(253,250,244,0.45)_0%,rgba(253,250,244,0)_22%,rgba(253,250,244,0)_58%,rgba(19,27,21,0.42)_100%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] flex-1 items-center gap-12 px-5 pb-10 pt-28 sm:px-8 sm:pt-32 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:px-12">
        <div className="max-w-2xl">
          <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1 text-sage-600">
            <span className="h-px w-10 bg-sage-500/70" />
            Fleuriste artisan
            <span className="hidden text-sage-500/60 sm:inline">·</span>
            <span className="hidden sm:inline">Croix-Rousse, Lyon</span>
          </p>

          <h1 className="display mt-7 text-[clamp(2.5rem,5.4vw,4.6rem)] text-bark-900">
            Là où la saison
            <br />
            devient{" "}
            <span className="relative inline-block italic text-bloom-600">
              bouquet
              <span className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-bloom-400/50" />
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-bark-800/85 sm:text-lg">
            Six producteurs à moins de 80 km, une camionnette qui part à 5 h et
            des seaux qu’on remplit avant d’ouvrir. Chez nous, un
            bouquet se compose avec ce que la semaine donne — jamais deux fois
            le même.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#commander"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-clay-500 px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-paper-50 transition-all duration-300 hover:-translate-y-1 hover:bg-clay-600 hover:shadow-[0_22px_44px_-18px_rgba(178,90,52,0.85)]"
            >
              Commander un bouquet
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </a>
            <a
              href="#bouquets"
              className="inline-flex items-center justify-center rounded-full border border-bark-900/25 bg-paper-50/60 px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-bark-900 backdrop-blur-sm transition-all duration-300 hover:border-sage-600 hover:bg-paper-100 hover:text-bark-950"
            >
              Voir nos offres
            </a>
          </div>
        </div>

        {/* Les cinq univers, à déplier */}
        <div className="w-full">
          <p className="eyebrow mb-4 flex items-center gap-3 text-bark-800/55">
            À la boutique
            <span className="h-px flex-1 bg-bark-900/15" />
          </p>
          <InteractiveSelector
            options={universOptions}
            showHeader={false}
            defaultIndex={0}
            activeBorderColor="#fdfaf4"
            idleBorderColor="rgba(253,250,244,0.35)"
            className="min-h-0 bg-transparent"
          />
        </div>
      </div>

      {/* Bandeau de chiffres, sur une bande de lin */}
      <div className="texture-linen relative z-10 border-t border-paper-50/15">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-12">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 border-b border-paper-50/10 py-4 pr-4 sm:flex-row sm:items-baseline sm:gap-2 sm:py-5 lg:border-b-0"
            >
              <span className="display whitespace-nowrap text-2xl text-paper-50 sm:text-3xl">
                {stat.value}
                <span className="text-clay-400">{stat.unit}</span>
              </span>
              <span className="text-[0.66rem] uppercase leading-tight tracking-[0.14em] text-paper-200/75 sm:text-xs">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">{shop.baseline}</span>
    </section>
  );
}
