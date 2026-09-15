#!/usr/bin/env node
/**
 * Accès à la mémoire commune depuis un terminal ou un agent sans navigateur.
 *
 *   node scripts/memory-cli.mjs recall "déploiement"
 *   node scripts/memory-cli.mjs remember "Titre" "Contenu" --kind=decision --scope=project:jarvis
 *   node scripts/memory-cli.mjs context --project=jarvis
 *
 * `context` sort du markdown : c'est la commande à piper dans le prompt d'un agent.
 */

const ENDPOINT = process.env.JARVIS_URL ?? "http://localhost:3000";
const TOKEN = process.env.JARVIS_TOKEN ?? "";

const args = process.argv.slice(2);
const command = args[0];
const positional = args.slice(1).filter((a) => !a.startsWith("--"));
const flags = Object.fromEntries(
  args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [key, ...rest] = a.replace(/^--/, "").split("=");
      return [key, rest.join("=") || "true"];
    }),
);

function headers() {
  return { "content-type": "application/json", ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}) };
}

async function request(path, init) {
  const response = await fetch(`${ENDPOINT}${path}`, { headers: headers(), ...init });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`HTTP ${response.status} — ${detail.slice(0, 200)}`);
  }
  return response;
}

async function main() {
  switch (command) {
    case "recall": {
      const query = positional.join(" ");
      const params = new URLSearchParams({ limit: flags.limit ?? "10" });
      if (query) params.set("q", query);
      if (flags.project) params.set("projectId", flags.project);
      const { entries } = await (await request(`/api/memory?${params}`)).json();
      if (!entries.length) return console.log("(aucun souvenir)");
      for (const entry of entries) {
        console.log(`\n[${entry.kind}] ${entry.title}  (${entry.scope}, v${entry.version}, ${Math.round(entry.confidence * 100)}%)`);
        console.log(`  ${entry.body}`);
      }
      return;
    }

    case "remember": {
      const [title, ...bodyParts] = positional;
      if (!title || !bodyParts.length) {
        console.error('Usage : memory-cli.mjs remember "Titre" "Contenu" [--kind=fact] [--scope=global]');
        process.exit(1);
      }
      const response = await request("/api/memory", {
        method: "POST",
        body: JSON.stringify({
          title,
          body: bodyParts.join(" "),
          kind: flags.kind ?? "fact",
          scope: flags.scope ?? "global",
          tags: flags.tags ? flags.tags.split(",") : [],
          pinned: flags.pinned === "true",
          source: flags.source ?? "cli",
        }),
      });
      const result = await response.json();
      console.log(result.created ? `✓ créé : ${result.entry.id}` : `✓ mis à jour → v${result.entry.version}`);
      return;
    }

    case "context": {
      const params = new URLSearchParams();
      if (flags.project) params.set("projectId", flags.project);
      if (positional.length) params.set("q", positional.join(" "));
      process.stdout.write(await (await request(`/api/memory/context?${params}`)).text());
      return;
    }

    default:
      console.log("Commandes : recall | remember | context");
      process.exit(command ? 1 : 0);
  }
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  console.error(`  Jarvis tourne-t-il sur ${ENDPOINT} ?`);
  process.exit(1);
});
