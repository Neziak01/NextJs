"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import Reveal from "@/components/ui/Reveal";
import { gym, joinFacts, joinPerks, plans } from "@/lib/content";

export default function Join() {
  const [sent, setSent] = useState(false);
  const [firstName, setFirstName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Démo : aucun back-end branché, on confirme côté client.
    setSent(true);
  }

  return (
    <section
      id="rejoindre"
      className="grain relative isolate overflow-hidden py-24 sm:py-32"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/cta.jpg"
          alt="Aire d'entraînement en bois dans la jungle à la tombée du jour"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-forest-950)_0%,rgba(6,13,8,0.7)_26%,rgba(6,13,8,0.58)_55%,rgba(6,13,8,0.86)_100%)]" />

      <div className="relative z-10 mx-auto grid max-w-[1400px] items-start gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-12">
        <div>
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-moss-300">
              <span className="h-px w-10 bg-moss-400/70" />
              Rejoindre la meute
            </p>
            <h2 className="display mt-6 text-[clamp(2.5rem,7vw,5.6rem)] text-sand-50">
              Trois jours
              <br />
              <span className="text-clay-400">offerts</span>
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-sand-200/85">
              Sans engagement, sans carte bancaire. Tu viens, tu essaies les
              trois plateaux, tu repars avec de la terre rouge sous les ongles.
              On te répond sous 24 heures avec un créneau.
            </p>

            <ul className="mt-10 space-y-4 border-l-2 border-moss-500/40 pl-6">
              {joinPerks.map((perk) => (
                <li key={perk} className="flex gap-3 text-sand-200/80">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-clay-400" />
                  {perk}
                </li>
              ))}
            </ul>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-sand-200/15 pt-7">
              {joinFacts.map((fact) => (
                <div key={fact.term}>
                  <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-sand-300/55">
                    {fact.term}
                  </dt>
                  <dd className="display mt-2 text-xl text-sand-50">
                    {fact.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={160}>
          <div className="texture-wood relative overflow-hidden rounded-[2.5rem_0.75rem_2.5rem_0.75rem] border border-sand-200/15 p-7 shadow-[0_50px_90px_-45px_rgba(0,0,0,0.95)] sm:p-10">
            <div className="grain pointer-events-none absolute inset-0" />

            {sent ? (
              <div className="relative flex min-h-[26rem] flex-col items-center justify-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-moss-400 text-2xl text-moss-300">
                  ✓
                </span>
                <h3 className="display mt-6 text-4xl text-sand-50">
                  {firstName ? `À très vite, ${firstName}` : "À très vite"}
                </h3>
                <p className="mt-4 max-w-sm text-sand-200/80">
                  Ta demande est enregistrée. On revient vers toi sous 24 h avec
                  un créneau et le plan d&apos;accès à la vallée.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-8 text-xs uppercase tracking-[0.2em] text-clay-400 underline underline-offset-4 hover:text-clay-500"
                >
                  Envoyer une autre demande
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative space-y-5">
                <h3 className="display text-3xl text-sand-50">
                  Réserve ton essai
                </h3>

                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-[0.68rem] uppercase tracking-[0.2em] text-sand-300/80"
                  >
                    Prénom
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Kadek"
                    className="w-full rounded-xl border border-sand-200/20 bg-forest-950/45 px-4 py-3.5 text-sand-50 placeholder:text-sand-300/35 transition-colors focus:border-moss-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[0.68rem] uppercase tracking-[0.2em] text-sand-300/80"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="toi@exemple.com"
                    className="w-full rounded-xl border border-sand-200/20 bg-forest-950/45 px-4 py-3.5 text-sand-50 placeholder:text-sand-300/35 transition-colors focus:border-moss-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="plan"
                    className="mb-2 block text-[0.68rem] uppercase tracking-[0.2em] text-sand-300/80"
                  >
                    Formule
                  </label>
                  <select
                    id="plan"
                    name="plan"
                    defaultValue={plans[0].value}
                    className="w-full appearance-none rounded-xl border border-sand-200/20 bg-forest-950/45 px-4 py-3.5 text-sand-50 transition-colors focus:border-moss-400 focus:outline-none"
                  >
                    {plans.map((plan) => (
                      <option
                        key={plan.value}
                        value={plan.value}
                        className="bg-forest-900"
                      >
                        {plan.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="group mt-2 flex w-full items-center justify-center gap-3 rounded-full bg-clay-500 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-sand-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-clay-400 hover:shadow-[0_22px_44px_-18px_rgba(197,107,57,0.95)]"
                >
                  Réserver ma place
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </button>

                <p className="pt-1 text-center text-[0.7rem] leading-relaxed text-sand-300/60">
                  Démo — aucune donnée n&apos;est envoyée. Ou écris-nous
                  directement à{" "}
                  <a
                    href={`mailto:${gym.email}`}
                    className="text-moss-300 underline underline-offset-2"
                  >
                    {gym.email}
                  </a>
                  .
                </p>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
