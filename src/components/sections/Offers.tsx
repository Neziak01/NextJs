import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { offers } from "@/lib/content";

/** Tenue en vase : cinq brins, remplis selon la longévité annoncée. */
function VaseLife({ level }: { level: number }) {
  return (
    <span
      className="flex items-center gap-1.5"
      aria-label={`Tenue en vase ${level} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          className={`h-3 w-[3px] rounded-full ${
            step <= level ? "bg-clay-500" : "bg-bark-900/15"
          }`}
        />
      ))}
    </span>
  );
}

export default function Offers() {
  return (
    <section
      id="bouquets"
      className="grain relative overflow-hidden bg-paper-50 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-sage-600">
              <span className="h-px w-10 bg-sage-500/70" />
              Trois façons de repartir fleuri
            </p>
            <h2 className="display mt-6 max-w-2xl text-[clamp(2.4rem,6vw,4.6rem)] text-bark-900">
              Ce qu’on prépare
              <br />
              <span className="italic text-bloom-600">pour vous</span>
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <p className="max-w-sm text-base leading-relaxed text-bark-800/75">
              Le bouquet qu’on attrape en passant, celui qui revient chaque
              semaine, et la grande composition qu’on prépare des mois à
              l’avance. Tout part du même arrivage.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer, i) => (
            <Reveal key={offer.name} delay={i * 130}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-[2.5rem_0.75rem_2.5rem_0.75rem] border border-paper-300 bg-paper-100 transition-all duration-500 hover:-translate-y-2 hover:border-sage-400 hover:shadow-[0_40px_70px_-42px_rgba(46,31,16,0.55)]">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={offer.image}
                    alt={offer.name}
                    fill
                    sizes="(max-width: 768px) 92vw, (max-width: 1024px) 46vw, 30vw"
                    className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.08]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bark-950/85 via-bark-950/15 to-transparent" />

                  <span className="display absolute left-6 top-5 text-5xl text-paper-50/45 transition-colors duration-500 group-hover:text-clay-400/85">
                    {offer.index}
                  </span>

                  <div className="absolute inset-x-6 bottom-5">
                    <p className="eyebrow text-sage-200">{offer.tagline}</p>
                    <h3 className="display mt-2 text-3xl text-paper-50">
                      {offer.name}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6 pt-5">
                  <p className="text-[0.95rem] leading-relaxed text-bark-800/80">
                    {offer.description}
                  </p>

                  <ul className="mt-5 flex flex-wrap gap-2">
                    {offer.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-sage-500/30 bg-paper-200/70 px-3 py-1 text-[0.68rem] uppercase tracking-[0.12em] text-sage-700"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-bark-900/10 pt-5 text-bark-900">
                    <div>
                      <dt className="text-[0.62rem] uppercase tracking-[0.14em] text-bark-800/55">
                        Prix
                      </dt>
                      <dd className="mt-1 text-sm font-semibold">
                        {offer.price}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.62rem] uppercase tracking-[0.14em] text-bark-800/55">
                        Tenue
                      </dt>
                      <dd className="mt-2">
                        <VaseLife level={offer.vaseLife} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.62rem] uppercase tracking-[0.14em] text-bark-800/55">
                        Délai
                      </dt>
                      <dd className="mt-1 text-sm font-semibold">
                        {offer.lead}
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
