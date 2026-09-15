#!/usr/bin/env node
/**
 * Remplit Jarvis avec un jeu de démonstration : deux projets, quelques agents et
 * une mémoire de départ. Passe par l'API HTTP pour ne pas dupliquer le schéma SQL.
 *
 * Usage : npm run dev (dans un terminal), puis `node scripts/seed.mjs`
 */

const ENDPOINT = process.env.JARVIS_URL ?? "http://localhost:3000";
const TOKEN = process.env.JARVIS_TOKEN ?? "";

const headers = {
  "content-type": "application/json",
  ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
};

const MEMORIES = [
  {
    kind: "decision",
    scope: "global",
    title: "Un seul poste de commandement",
    body: "Toute la télémétrie agents passe par Jarvis (/api/events). Pas de second tableau de bord concurrent.",
    pinned: true,
    confidence: 0.95,
    tags: ["archi"],
  },
  {
    kind: "preference",
    scope: "global",
    title: "Réponses courtes et directes",
    body: "Phrases de 3 à 6 mots, aucun préambule, on montre le résultat avant de commenter.",
    pinned: true,
    confidence: 0.9,
    tags: ["style"],
  },
  {
    kind: "decision",
    scope: "project:jarvis",
    title: "SQLite via node:sqlite",
    body: "Stockage local sans dépendance native, pour que le projet démarre avec un simple npm install.",
    confidence: 0.85,
    tags: ["archi", "db"],
  },
  {
    kind: "pitfall",
    scope: "project:jarvis",
    title: "Un hook ne doit jamais bloquer l'agent",
    body: "jarvis-hook.mjs sort toujours en code 0, avec un timeout court : Jarvis éteint ne casse aucune session.",
    confidence: 0.9,
    tags: ["hooks"],
  },
  {
    kind: "glossary",
    scope: "global",
    title: "Portée (scope)",
    body: "`global` = visible par tous les agents. `project:<slug>` = réservé aux agents de ce projet.",
    confidence: 0.8,
    tags: ["memoire"],
  },
];

const AGENTS = [
  { session: "demo-jarvis-main", app: "jarvis", project: "jarvis", agent: "main", type: null },
  { session: "demo-jarvis-explore", app: "jarvis", project: "jarvis", agent: "explore-1", type: "Explore" },
  { session: "demo-shop-main", app: "boutique", project: "boutique", agent: "main", type: null },
];

const TOOLS = ["Read", "Grep", "Edit", "Bash", "WebSearch", "Write"];

async function post(path, body) {
  const response = await fetch(`${ENDPOINT}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`POST ${path} → HTTP ${response.status}: ${(await response.text()).slice(0, 160)}`);
  return response.json();
}

async function main() {
  for (const memory of MEMORIES) {
    await post("/api/memory", { ...memory, source: "seed" });
  }
  console.log(`✓ ${MEMORIES.length} souvenirs enregistrés`);

  await post("/api/projects", {
    id: "jarvis",
    name: "Jarvis",
    description: "Poste de commandement des agents : live, projets, mémoire.",
    status: "active",
  });
  await post("/api/projects", {
    id: "boutique",
    name: "Boutique",
    description: "Refonte du tunnel de commande.",
    status: "active",
  });
  console.log("✓ 2 projets créés");

  const now = Date.now();
  const events = [];
  AGENTS.forEach((agent, index) => {
    const base = now - (index + 1) * 12 * 60_000;
    events.push({
      eventType: "SessionStart",
      ts: base,
      sessionId: agent.session,
      sourceApp: agent.app,
      projectId: agent.project,
      agentId: agent.agent,
      agentType: agent.type,
      cwd: `/home/user/${agent.app}`,
      model: "claude-opus-5",
    });
    events.push({
      eventType: "UserPromptSubmit",
      ts: base + 2_000,
      sessionId: agent.session,
      sourceApp: agent.app,
      projectId: agent.project,
      agentId: agent.agent,
      prompt: "Analyse l'état du projet et propose la prochaine étape.",
      summary: "Analyse l'état du projet et propose la prochaine étape.",
    });
    for (let i = 0; i < 14; i++) {
      const tool = TOOLS[(index + i) % TOOLS.length];
      const ts = base + 5_000 + i * 45_000;
      if (ts > now) break;
      events.push({
        eventType: "PreToolUse",
        ts,
        sessionId: agent.session,
        sourceApp: agent.app,
        projectId: agent.project,
        agentId: agent.agent,
        toolName: tool,
        summary: `${tool} — étape ${i + 1}`,
      });
      events.push({
        eventType: i === 9 ? "PostToolUseFailure" : "PostToolUse",
        ts: ts + 1_500,
        sessionId: agent.session,
        sourceApp: agent.app,
        projectId: agent.project,
        agentId: agent.agent,
        toolName: tool,
      });
    }
  });

  // La dernière session se termine : le dashboard doit montrer les deux états côte à côte.
  events.push({
    eventType: "SessionEnd",
    ts: now - 60_000,
    sessionId: "demo-shop-main",
    sourceApp: "boutique",
    projectId: "boutique",
    agentId: "main",
  });

  events.sort((a, b) => a.ts - b.ts);
  for (let i = 0; i < events.length; i += 100) {
    await post("/api/events", events.slice(i, i + 100));
  }
  console.log(`✓ ${events.length} événements injectés`);
  console.log(`\nOuvre ${ENDPOINT} pour voir le poste de commandement.`);
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  console.error(`  Lance d'abord \`npm run dev\` (Jarvis attendu sur ${ENDPOINT}).`);
  process.exit(1);
});
