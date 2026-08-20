import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { trainings } from "@/lib/content";

/** Jauge d'intensité : cinq griffes, remplies selon le niveau. */
function Intensity({ level }: { level: number }) {
  return (
    <span
      className="flex items-center gap-1.5"
      aria-label={`Intensité ${level} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          className={`h-3 w-[3px] rounded-full ${
            step <= level ? "bg-clay-400" : "bg-sand-200/25"
          }`}
        />
      ))}
    </span>
  );
}

export default function Trainings() {
  return (
    <section
      id="entrainements"
      className="texture-canopy grain relative overflow-hidden bg-forest-900 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-moss-300">
              <span className="h-px w-10 bg-moss-400/70" />
              Trois façons de transpirer
            </p>
            <h2 className="display mt-6 max-w-2xl text-[clamp(2.4rem,6.4vw,5rem)] text-sand-50">
              Choisis ton
              <br />
              <span className="outline-text">terrain de jeu</span>
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <p className="max-w-sm text-base leading-relaxed text-sand-200/75">
              Trois formats, trois plateaux, un même décor. Tous les cours sont
              en petit comité et encadrés par nos coachs, du lever du soleil à
              la tombée de la nuit.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {trainings.map((training, i) => (
            <Reveal key={training.name} delay={i * 130}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-[2.5rem_0.75rem_2.5rem_0.75rem] border border-sand-200/10 bg-forest-850 transition-all duration-500 hover:-translate-y-2 hover:border-moss-400/40 hover:shadow-[0_40px_70px_-40px_rgba(0,0,0,0.95)]">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={training.image}
                    alt={training.name}
                    fill
                    sizes="(max-width: 768px) 92vw, (max-width: 1024px) 46vw, 30vw"
                    className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.08]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-850 via-forest-950/35 to-transparent" />

                  <span className="display absolute left-6 top-5 text-6xl text-sand-50/25 transition-colors duration-500 group-hover:text-clay-400/70">
                    {training.index}
                  </span>

                  <div className="absolute inset-x-6 bottom-5">
                    <p className="eyebrow text-moss-300">{training.tagline}</p>
                    <h3 className="display mt-2 text-3xl text-sand-50 sm:text-[2.1rem]">
                      {training.name}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6 pt-5">
                  <p className="text-[0.95rem] leading-relaxed text-sand-200/75">
                    {training.description}
                  </p>

                  <ul className="mt-5 flex flex-wrap gap-2">
                    {training.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-moss-400/25 bg-forest-800/70 px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-moss-300"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-sand-200/10 pt-5 text-sand-200/85">
                    <div>
                      <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-sand-300/55">
                        Durée
                      </dt>
                      <dd className="mt-1 text-sm font-semibold">
                        {training.duration}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-sand-300/55">
                        Intensité
                      </dt>
                      <dd className="mt-2">
                        <Intensity level={training.intensity} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-sand-300/55">
                        Groupe
                      </dt>
                      <dd className="mt-1 text-sm font-semibold">
                        {training.group}
                      </dd>
                    </div>
                  </dl>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
