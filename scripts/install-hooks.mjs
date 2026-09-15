#!/usr/bin/env node
/**
 * Branche un projet sur Jarvis en écrivant les hooks dans son `.claude/settings.json`.
 *
 * Usage : node scripts/install-hooks.mjs [chemin-du-projet]
 *         (par défaut : le dossier courant)
 *
 * Le fichier existant est fusionné, jamais écrasé : les hooks déjà présents sont conservés
 * et une sauvegarde `.bak` est déposée à côté avant toute écriture.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";

const HOOK_EVENTS = [
  "SessionStart",
  "SessionEnd",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "Notification",
  "Stop",
  "SubagentStop",
  "PreCompact",
];

const target = resolve(process.argv[2] ?? process.cwd());
const bridge = resolve(new URL("./jarvis-hook.mjs", import.meta.url).pathname);
const settingsDir = join(target, ".claude");
const settingsPath = join(settingsDir, "settings.json");

/** Reconnaît un hook Jarvis déjà posé, pour pouvoir le remplacer proprement. */
function isJarvisHook(entry) {
  return JSON.stringify(entry).includes("jarvis-hook.mjs");
}

function buildMatcher(eventName) {
  return {
    matcher: "*",
    hooks: [{ type: "command", command: `node ${JSON.stringify(bridge)} ${eventName}`, timeout: 5 }],
  };
}

let settings = {};
if (existsSync(settingsPath)) {
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch (error) {
    console.error(`✗ ${settingsPath} est illisible (${error.message}). Corrige-le avant de relancer.`);
    process.exit(1);
  }
  copyFileSync(settingsPath, `${settingsPath}.bak`);
}

settings.hooks ??= {};
for (const eventName of HOOK_EVENTS) {
  const existing = Array.isArray(settings.hooks[eventName]) ? settings.hooks[eventName] : [];
  settings.hooks[eventName] = [...existing.filter((entry) => !isJarvisHook(entry)), buildMatcher(eventName)];
}

mkdirSync(settingsDir, { recursive: true });
writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);

console.log(`✓ Hooks Jarvis installés dans ${settingsPath}`);
console.log(`  ${HOOK_EVENTS.length} événements suivis : ${HOOK_EVENTS.join(", ")}`);
console.log(`  Cible : ${process.env.JARVIS_URL ?? "http://localhost:3000"}`);
console.log("  Relance Claude Code dans ce projet pour activer les hooks.");
