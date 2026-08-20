"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import Reveal from "@/components/ui/Reveal";
import { occasions, orderFacts, orderPerks, shop } from "@/lib/content";

export default function Order() {
  const [sent, setSent] = useState(false);
  const [firstName, setFirstName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Démo : aucun back-end branché, on confirme côté client.
    setSent(true);
  }

  return (
    <section
      id="commander"
      className="grain relative isolate overflow-hidden py-24 sm:py-32"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/cta.jpg"
          alt="Étal de fleurs coupées à la tombée du jour, devant la boutique"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-sage-950)_0%,rgba(19,27,21,0.78)_24%,rgba(19,27,21,0.62)_54%,rgba(19,27,21,0.88)_100%)]" />

      <div className="relative z-10 mx-auto grid max-w-[1400px] items-start gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-12">
        <div>
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-sage-300">
              <span className="h-px w-10 bg-sage-400/70" />
              Passer commande
            </p>
            <h2 className="display mt-6 text-[clamp(2.5rem,6.4vw,5rem)] text-paper-50">
              Dites-nous
              <br />
              <span className="italic text-bloom-400">l’occasion</span>
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-paper-200/85">
              Un anniversaire, des excuses, un mardi sans raison. Décrivez-nous
              l’occasion et le budget : on compose avec l’arrivage du
              jour et on vous envoie une photo avant que ça parte.
            </p>

            <ul className="mt-10 space-y-4 border-l-2 border-sage-500/40 pl-6">
              {orderPerks.map((perk) => (
                <li key={perk} className="flex gap-3 text-paper-200/80">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bloom-400" />
                  {perk}
                </li>
              ))}
            </ul>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-paper-50/15 pt-7">
              {orderFacts.map((fact) => (
                <div key={fact.term}>
                  <dt className="text-[0.6rem] uppercase tracking-[0.16em] text-paper-300/60">
                    {fact.term}
                  </dt>
                  <dd className="display mt-2 text-xl text-paper-50">
                    {fact.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={160}>
          <div className="texture-kraft relative overflow-hidden rounded-[2.5rem_0.75rem_2.5rem_0.75rem] border border-paper-50/15 p-7 shadow-[0_50px_90px_-45px_rgba(0,0,0,0.9)] sm:p-10">
            <div className="grain pointer-events-none absolute inset-0" />

            {sent ? (
              <div className="relative flex min-h-[26rem] flex-col items-center justify-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-sage-400 text-2xl text-sage-300">
                  ✓
                </span>
                <h3 className="display mt-6 text-4xl text-paper-50">
                  {firstName ? `À très vite, ${firstName}` : "À très vite"}
                </h3>
                <p className="mt-4 max-w-sm text-paper-200/80">
                  Votre demande est enregistrée. On revient vers vous sous 24 h
                  avec une proposition et une photo du bouquet.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-8 text-xs uppercase tracking-[0.18em] text-clay-400 underline underline-offset-4 hover:text-clay-500"
                >
                  Envoyer une autre demande
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative space-y-5">
                <h3 className="display text-3xl text-paper-50">
                  Votre demande
                </h3>

                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-[0.68rem] uppercase tracking-[0.18em] text-paper-300/80"
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
                    placeholder="Camille"
                    className="w-full rounded-xl border border-paper-50/20 bg-sage-950/45 px-4 py-3.5 text-paper-50 placeholder:text-paper-300/35 transition-colors focus:border-sage-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[0.68rem] uppercase tracking-[0.18em] text-paper-300/80"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="vous@exemple.fr"
                    className="w-full rounded-xl border border-paper-50/20 bg-sage-950/45 px-4 py-3.5 text-paper-50 placeholder:text-paper-300/35 transition-colors focus:border-sage-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="occasion"
                    className="mb-2 block text-[0.68rem] uppercase tracking-[0.18em] text-paper-300/80"
                  >
                    Occasion
                  </label>
                  <select
                    id="occasion"
                    name="occasion"
                    defaultValue={occasions[0].value}
                    className="w-full appearance-none rounded-xl border border-paper-50/20 bg-sage-950/45 px-4 py-3.5 text-paper-50 transition-colors focus:border-sage-400 focus:outline-none"
                  >
                    {occasions.map((occasion) => (
                      <option
                        key={occasion.value}
                        value={occasion.value}
                        className="bg-sage-900"
                      >
                        {occasion.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="group mt-2 flex w-full items-center justify-center gap-3 rounded-full bg-clay-500 px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-paper-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-clay-600 hover:shadow-[0_22px_44px_-18px_rgba(178,90,52,0.9)]"
                >
                  Envoyer ma demande
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </button>

                <p className="pt-1 text-center text-[0.7rem] leading-relaxed text-paper-300/60">
                  Démo — aucune donnée n’est envoyée. Ou appelez-nous
                  directement au{" "}
                  <a
                    href={`tel:+33${shop.phone.replace(/\D/g, "").slice(1)}`}
                    className="text-sage-300 underline underline-offset-2"
                  >
                    {shop.phone}
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
