import Image from "next/image";
import Reveal from "./Reveal";
import { manifestoPoints } from "@/lib/content";

export default function Manifesto() {
  return (
    <section
      id="manifeste"
      className="texture-fiber grain relative overflow-hidden py-24 text-wood-900 sm:py-32"
    >
      {/* Bord organique, comme une déchirure de fibre */}
      <svg
        className="absolute inset-x-0 -top-px h-14 w-full text-forest-950 sm:h-20"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 0h1440v34c-96 18-180-6-268-16-88-10-160 22-256 26-96 4-176-20-268-24S470 40 372 52 176 48 88 34 0 22 0 22Z"
          fill="currentColor"
        />
      </svg>

      <div className="mx-auto grid max-w-[1400px] items-center gap-14 px-5 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-12">
        <div>
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-clay-600">
              <span className="h-px w-10 bg-clay-500/60" />
              Le manifeste
            </p>
            <h2 className="display mt-6 text-[clamp(2.4rem,6.4vw,5.2rem)] text-wood-900">
              Le bois.
              <br />
              La terre.
              <br />
              <span className="text-clay-600">Ta sueur.</span>
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-wood-800/85">
              WILD GYM est né d&apos;un refus : celui des salles climatisées où
              l&apos;on soulève de la fonte devant son propre reflet. Ici, le
              plafond est une canopée de banians, le sol est de la terre rouge
              tassée, et le seul bruit de fond est celui de la rivière trente
              mètres plus bas.
            </p>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-wood-800/85">
              Chaque plateau a été construit à la main par des charpentiers de
              Tegallalang, avec du teck de récupération et du bambou coupé dans
              la vallée. On s&apos;entraîne pieds nus, à la lumière du jour, au
              rythme des saisons.
            </p>
          </Reveal>

          <dl className="mt-12 grid gap-8 sm:grid-cols-3">
            {manifestoPoints.map((point, i) => (
              <Reveal key={point.title} delay={160 + i * 110}>
                <dt className="display flex items-baseline gap-3 text-xl text-wood-900">
                  <span className="text-sm font-body font-bold tracking-[0.2em] text-clay-600">
                    0{i + 1}
                  </span>
                  {point.title}
                </dt>
                <dd className="mt-3 border-l-2 border-wood-700/25 pl-4 text-[0.95rem] leading-relaxed text-wood-800/75">
                  {point.text}
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>

        <Reveal delay={100} className="relative">
          <div className="blob-a relative aspect-[4/5] w-full overflow-hidden shadow-[0_40px_80px_-40px_rgba(36,22,16,0.8)]">
            <Image
              src="/images/manifeste.jpg"
              alt="Végétation tropicale dense traversée par la lumière du matin"
              fill
              sizes="(max-width: 1024px) 90vw, 42vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/55 via-transparent to-transparent" />
          </div>

          {/* Pastille de bois posée sur la photo */}
          <div className="texture-wood absolute -bottom-8 -left-4 flex h-36 w-36 flex-col items-center justify-center rounded-full border border-sand-200/15 text-center shadow-[0_24px_50px_-20px_rgba(0,0,0,0.7)] sm:-left-10 sm:h-44 sm:w-44">
            <span className="display text-4xl text-sand-50 sm:text-5xl">
              2019
            </span>
            <span className="mt-1 px-4 text-[0.62rem] uppercase tracking-[0.22em] text-sand-300">
              Première clairière défrichée
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
