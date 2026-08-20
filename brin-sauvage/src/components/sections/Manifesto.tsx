import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { manifestoPoints } from "@/lib/content";

export default function Manifesto() {
  return (
    <section
      id="maison"
      className="texture-paper grain relative overflow-hidden py-24 text-bark-900 sm:py-32"
    >
      {/* Bord découpé, comme un papier de soie déchiré */}
      <svg
        className="absolute inset-x-0 -top-px h-12 w-full text-sage-800"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 0h1440v30c-96 16-180-6-268-14-88-9-160 20-256 24-96 4-176-18-268-22S470 36 372 47 176 44 88 31 0 20 0 20Z"
          fill="currentColor"
        />
      </svg>

      <div className="mx-auto grid max-w-[1400px] items-center gap-14 px-5 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-12">
        <div>
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-clay-600">
              <span className="h-px w-10 bg-clay-500/60" />
              La maison, depuis 1998
            </p>
            <h2 className="display mt-6 text-[clamp(2.4rem,6vw,4.8rem)] text-bark-900">
              Cultivé.
              <br />
              Coupé.
              <br />
              <span className="italic text-bloom-600">Composé.</span>
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-bark-800/85">
              Brin Sauvage tient le même trottoir de la rue des Pierres
              Plantées depuis vingt-sept ans. On y a vu passer trois
              générations de voisins, quelques centaines de mariages et un
              nombre incalculable de lundis de fermeture.
            </p>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-bark-800/85">
              Ce qui n’a pas changé : on achète en direct aux producteurs,
              on refuse ce qui a voyagé en avion, et on compose devant vous.
              Ce qui a changé : on livre à vélo, et on récupère les vases.
            </p>
          </Reveal>

          <dl className="mt-12 grid gap-8 sm:grid-cols-3">
            {manifestoPoints.map((point, i) => (
              <Reveal key={point.title} delay={160 + i * 110}>
                <dt className="display flex items-baseline gap-3 text-xl text-bark-900">
                  <span className="font-body text-sm font-bold tracking-[0.18em] text-clay-600">
                    0{i + 1}
                  </span>
                  {point.title}
                </dt>
                <dd className="mt-3 border-l-2 border-sage-500/35 pl-4 text-[0.95rem] leading-relaxed text-bark-800/75">
                  {point.text}
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>

        <Reveal delay={100} className="relative">
          <div className="blob-a relative aspect-[4/5] w-full overflow-hidden shadow-[0_40px_80px_-42px_rgba(46,31,16,0.6)]">
            <Image
              src="/images/atelier.jpg"
              alt="Établi de l'atelier : rouleau de kraft, ficelle et bouquet en cours de montage"
              fill
              sizes="(max-width: 1024px) 90vw, 42vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bark-950/35 via-transparent to-transparent" />
          </div>

          {/* Pastille de kraft posée sur la photo */}
          <div className="texture-kraft absolute -bottom-8 -left-4 flex h-36 w-36 flex-col items-center justify-center rounded-full border border-paper-50/15 text-center shadow-[0_24px_50px_-20px_rgba(32,21,9,0.6)] sm:-left-10 sm:h-44 sm:w-44">
            <span className="display text-4xl text-paper-50 sm:text-5xl">27</span>
            <span className="mt-1 px-5 text-[0.62rem] uppercase leading-snug tracking-[0.2em] text-paper-200">
              ans rue des Pierres Plantées
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
