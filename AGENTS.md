<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Jarvis — conventions du dépôt

## Vérifier avant de pousser

```bash
npx tsc --noEmit && npx eslint . && npm run build
```

Le lint applique les règles du compilateur React : pas de `Date.now()` ni de lecture
de ref pendant le rendu, pas de `setState` synchrone dans un effet. Pour l'heure
courante, utiliser `useNow()` (`src/components/useLive.ts`), jamais `Date.now()`
dans le JSX — sinon l'hydratation diverge.

## Où vit quoi

| Chemin | Rôle |
| --- | --- |
| `src/lib/db.ts` | Schéma SQL unique. Toute table se déclare ici. |
| `src/lib/events.ts` | Ingestion des hooks et dérivation du statut des sessions. |
| `src/lib/memory.ts` | Mémoire commune : versionnage, portées, recherche, brief. |
| `src/lib/bus.ts` | Bus mémoire pour le SSE. Jamais une source de vérité. |
| `src/app/api/**` | Routes. Toutes en `runtime = "nodejs"` + `dynamic = "force-dynamic"`. |
| `scripts/` | Passerelle hooks, CLI mémoire, installateur, seed. Node pur, sans build. |

## Règles qui ne se négocient pas

1. **Un hook ne casse jamais un agent.** `scripts/jarvis-hook.mjs` sort en code 0 quoi
   qu'il arrive, avec un timeout court. Toute évolution doit préserver ça.
2. **La mémoire ne s'écrase pas.** Modifier un souvenir passe par `remember()`, qui
   archive la version précédente. Ne jamais faire un `UPDATE` direct sur `memory`.
3. **SQLite est la vérité, le bus ne l'est pas.** Un événement publié sur le bus a
   toujours été écrit en base d'abord.
4. **Les routes d'écriture respectent `JARVIS_TOKEN`.** Toute nouvelle route qui écrit
   appelle `authorize()`.

## Langue

Interface, commentaires et documentation en français. Identifiants de code en anglais.
