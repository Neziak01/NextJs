#!/usr/bin/env node
/**
 * Passerelle hooks Claude Code → Jarvis.
 *
 * Claude Code écrit l'événement en JSON sur stdin ; on le traduit au format Jarvis
 * et on le poste sur /api/events.
 *
 * Règle non négociable : ce script ne doit JAMAIS faire échouer ni ralentir un agent.
 * Toute erreur (Jarvis éteint, réseau coupé, JSON illisible) sort en code 0 sans bruit.
 *
 * Usage : node scripts/jarvis-hook.mjs [nom-evenement]
 */

const ENDPOINT = process.env.JARVIS_URL ?? "http://localhost:3000";
const TOKEN = process.env.JARVIS_TOKEN ?? "";
const TIMEOUT_MS = Number(process.env.JARVIS_TIMEOUT_MS ?? 1500);

/** Les noms de hooks Claude Code ne correspondent pas tous 1:1 à nos types d'événements. */
const EVENT_ALIASES = {
  PreToolUse: "PreToolUse",
  PostToolUse: "PostToolUse",
  PostToolUseFailure: "PostToolUseFailure",
  Notification: "Notification",
  UserPromptSubmit: "UserPromptSubmit",
  Stop: "Stop",
  SubagentStart: "SubagentStart",
  SubagentStop: "SubagentStop",
  PreCompact: "PreCompact",
  SessionStart: "SessionStart",
  SessionEnd: "SessionEnd",
  PermissionRequest: "PermissionRequest",
};

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve("");
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
      // Un transcript complet peut être énorme : on plafonne pour ne pas gonfler la mémoire.
      if (data.length > 2_000_000) process.stdin.destroy();
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
  });
}

function basename(path) {
  return String(path ?? "").split("/").filter(Boolean).pop() ?? "";
}

function truncate(value, max = 240) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Résumé lisible d'une ligne : c'est ce qui s'affiche dans le flux du dashboard. */
function summarize(hook) {
  const input = hook.tool_input ?? {};
  switch (hook.hook_event_name) {
    case "UserPromptSubmit":
      return truncate(hook.prompt);
    case "Notification":
      return truncate(hook.message);
    case "PreToolUse":
    case "PostToolUse":
    case "PostToolUseFailure":
      if (input.command) return truncate(input.command);
      if (input.file_path) return basename(input.file_path);
      if (input.pattern) return truncate(input.pattern);
      if (input.description) return truncate(input.description);
      if (input.url) return truncate(input.url);
      return null;
    case "SessionStart":
      return hook.source ? `source: ${hook.source}` : null;
    case "SessionEnd":
      return hook.reason ? `raison: ${hook.reason}` : null;
    default:
      return null;
  }
}

function projectFrom(hook) {
  const cwd = hook.cwd ?? process.cwd();
  const name = basename(cwd) || "unknown";
  return { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") };
}

async function main() {
  const raw = await readStdin();
  let hook = {};
  try {
    hook = raw ? JSON.parse(raw) : {};
  } catch {
    hook = {};
  }

  const eventName = process.argv[2] ?? hook.hook_event_name ?? "Notification";
  const eventType = EVENT_ALIASES[eventName] ?? eventName;
  const project = projectFrom(hook);

  const payload = {
    eventType,
    sourceApp: process.env.JARVIS_APP ?? project.name,
    projectId: process.env.JARVIS_PROJECT ?? project.slug,
    sessionId: hook.session_id ?? "unknown",
    agentId: hook.subagent_type ?? hook.agent_id ?? "main",
    agentType: hook.subagent_type ?? hook.agent_type ?? null,
    toolName: hook.tool_name ?? null,
    summary: summarize(hook),
    cwd: hook.cwd ?? null,
    model: hook.model ?? process.env.ANTHROPIC_MODEL ?? null,
    prompt: hook.prompt ? truncate(hook.prompt, 500) : null,
    payload: {
      toolInput: hook.tool_input ?? null,
      permissionMode: hook.permission_mode ?? null,
      source: hook.source ?? null,
      reason: hook.reason ?? null,
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    await fetch(`${ENDPOINT}/api/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch {
    // Jarvis peut être éteint : l'agent continue, on ne dit rien.
  } finally {
    clearTimeout(timer);
  }
}

main().finally(() => process.exit(0));
