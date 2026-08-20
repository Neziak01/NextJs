import Image from "next/image";
import type { ReactNode } from "react";
import {
  FaDumbbell,
  FaFire,
  FaHiking,
  FaLeaf,
  FaWater,
} from "react-icons/fa";
import InteractiveSelector, {
  type SelectorOption,
} from "@/components/ui/interactive-selector";
import { gym, heroPlateaux, heroStats } from "@/lib/content";

const plateauIcons: Record<string, ReactNode> = {
  strength: <FaDumbbell size={20} className="text-sand-50" />,
  flow: <FaLeaf size={20} className="text-sand-50" />,
  wild: <FaFire size={20} className="text-sand-50" />,
  cold: <FaWater size={20} className="text-sand-50" />,
  trail: <FaHiking size={20} className="text-sand-50" />,
};

const plateauOptions: SelectorOption[] = heroPlateaux.map((plateau) => ({
  title: plateau.title,
  description: plateau.description,
  image: plateau.image,
  icon: plateauIcons[plateau.icon],
}));

export default function Hero() {
  return (
    <section
      id="top"
      className="grain relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden"
    >
      {/* La jungle */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero.jpg"
          alt="Salle de sport à ciel ouvert entourée de végétation tropicale dense, au lever du jour"
          fill
          priority
          sizes="100vw"
          className="animate-drift object-cover object-center"
        />
      </div>

      {/* Fondus : lisibilité du texte et raccord avec la section suivante */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,13,8,0.74)_0%,rgba(6,13,8,0.3)_34%,rgba(6,13,8,0.66)_72%,var(--color-forest-950)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(105%_75%_at_12%_58%,rgba(6,13,8,0.72)_0%,rgba(6,13,8,0.24)_48%,transparent_74%)]" />

      {/* Feuille en surimpression, qui respire */}
      <div className="pointer-events-none absolute -left-28 top-[-10%] h-[48vh] w-[48vh] origin-top animate-sway opacity-45 blur-[3px]">
        <div className="leaf-mask h-full w-full rotate-[24deg] bg-forest-950/85" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] flex-1 items-center gap-12 px-5 pb-10 pt-28 sm:px-8 sm:pt-32 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:px-12">
        <div className="max-w-2xl">
          <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1 text-moss-300">
            <span className="h-px w-10 bg-moss-400/70" />
            {gym.location}
            <span className="hidden text-moss-400/50 sm:inline">·</span>
            <span className="hidden sm:inline">{gym.coordinates}</span>
          </p>

          <h1 className="display mt-7 text-[clamp(2.6rem,5.6vw,4.8rem)] text-sand-50 drop-shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
            Là où la nature
            <br />
            devient{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-clay-400">ta salle</span>
              <span className="absolute inset-x-0 bottom-[0.1em] h-[0.14em] bg-clay-500/45" />
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-sand-200/90 sm:text-lg">
            Pas de murs, pas de miroirs, pas de néons. 1 400 m² de teck brut, de
            bambou noir et de pierre volcanique, posés au milieu de la vallée
            d&apos;Ubud. Tu t&apos;entraînes dans la jungle — littéralement.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#rejoindre"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-clay-500 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-sand-50 transition-all duration-300 hover:-translate-y-1 hover:bg-clay-400 hover:shadow-[0_22px_44px_-18px_rgba(197,107,57,0.95)]"
            >
              Réserver mon essai
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </a>
            <a
              href="#entrainements"
              className="inline-flex items-center justify-center rounded-full border border-sand-200/35 bg-forest-950/30 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-sand-100 backdrop-blur-sm transition-all duration-300 hover:border-moss-300 hover:bg-forest-900/60 hover:text-sand-50"
            >
              Voir les entraînements
            </a>
          </div>
        </div>

        {/* Les cinq plateaux, à déplier */}
        <div className="w-full">
          <p className="eyebrow mb-4 flex items-center gap-3 text-sand-300/70">
            Les plateaux
            <span className="h-px flex-1 bg-sand-200/20" />
          </p>
          <InteractiveSelector
            options={plateauOptions}
            showHeader={false}
            defaultIndex={0}
            activeBorderColor="#b4cf8f"
            idleBorderColor="rgba(230,216,191,0.18)"
            className="min-h-0 bg-transparent"
          />
        </div>
      </div>

      {/* Bandeau de chiffres, sur une latte de teck */}
      <div className="texture-wood relative z-10 border-t border-sand-200/10">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-12">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 border-b border-sand-200/10 py-4 pr-4 sm:flex-row sm:items-baseline sm:gap-2 sm:py-5 lg:border-b-0"
            >
              <span className="display whitespace-nowrap text-2xl text-sand-50 sm:text-3xl">
                {stat.value}
                <span className="normal-case text-clay-400">{stat.unit}</span>
              </span>
              <span className="text-[0.62rem] uppercase leading-tight tracking-[0.14em] text-sand-300/80 sm:text-xs sm:tracking-[0.16em]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
