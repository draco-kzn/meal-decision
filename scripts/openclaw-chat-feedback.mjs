import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    process.env[key] = rawValue.replace(/^"|"$/g, "");
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function getDateKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(date);
}

async function fetchJson(baseUrl, route) {
  const response = await fetch(`${baseUrl}${route}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`GET ${route} failed with ${response.status}`);
  }

  return response.json();
}

async function postJson(baseUrl, route, body) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`POST ${route} failed with ${response.status}: ${text}`);
  }

  return response.json();
}

function inferMealType(message, nowHour) {
  if (/晚饭|晚餐|dinner|tonight/i.test(message)) {
    return "dinner";
  }

  if (/早饭|早餐|breakfast/i.test(message)) {
    return "breakfast";
  }

  if (/午饭|午餐|中午|lunch/i.test(message)) {
    return "lunch";
  }

  return nowHour >= 15 ? "dinner" : "lunch";
}

function parseFeedbackType(message) {
  if (/已经吃了|刚吃了|吃过|had|ate/i.test(message)) {
    return "consumption_log";
  }

  if (/拍照|photo shoot|目标|deadline|这周更收|target|减脂/i.test(message)) {
    return "goal_update";
  }

  if (/以后|长期|一直|总是|我不吃|我不喝|偏好|长期不要/i.test(message)) {
    return "stable_preference";
  }

  if (/今天|中午|晚上|太累|太困|想吃辣|在公司|在家|social|聚餐/i.test(message)) {
    return "daily_context";
  }

  return "direct_feedback";
}

function inferStructuredPatch(message, locations, fallbackLocationId) {
  const patch = {};
  const lower = message.toLowerCase();
  const office = locations.find((location) => /公司|office/i.test(location.name));
  const home = locations.find((location) => /^家$|home/i.test(location.name));

  if (/累|困|tired|exhausted|drained/i.test(lower)) {
    patch.energy = "low";
  }

  if (/精神好|状态好|energized/i.test(lower)) {
    patch.energy = "high";
  }

  if (/辣|spicy/i.test(lower)) {
    patch.wantsSpicy = true;
  }

  if (/别太严格|轻一点|不要太狠|less strict|take it easy/i.test(lower)) {
    patch.strictnessPreference = "lower";
  }

  if (/聚餐|社交|晚上有局|social|dinner with/i.test(lower)) {
    patch.socialTonight = true;
  }

  if (/在公司|去公司|office/i.test(lower) && office) {
    patch.locationName = office.name;
    patch.currentLocationId = office.id;
  } else if (/在家|回家|home/i.test(lower) && home) {
    patch.locationName = home.name;
    patch.currentLocationId = home.id;
  } else if (fallbackLocationId) {
    patch.currentLocationId = fallbackLocationId;
  }

  return patch;
}

function buildDecision(message, locations, fallbackLocationId) {
  const nowInShanghai = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Shanghai"
    })
  );
  const mealType = inferMealType(message, nowInShanghai.getHours());
  const feedbackType = parseFeedbackType(message);
  const structuredPatch = inferStructuredPatch(message, locations, fallbackLocationId);

  return {
    feedbackType,
    rawText: message,
    structuredPatch,
    shouldUpdateMemory: feedbackType === "stable_preference",
    shouldUpdateDailyContext: feedbackType === "daily_context",
    shouldRegenerateRecommendation: feedbackType === "daily_context" || feedbackType === "goal_update",
    reason:
      feedbackType === "daily_context"
        ? "The message changes today's context and may affect the current meal decision."
        : feedbackType === "goal_update"
          ? "The message shifts near-term goal pressure and recommendation strategy."
          : feedbackType === "consumption_log"
            ? "The message records something already consumed."
            : feedbackType === "stable_preference"
              ? "The message looks like a stable preference instead of a one-off state."
              : "The message is direct feedback but does not clearly change structured daily context.",
    inferredMealType: mealType
  };
}

async function runDailyRefresh({ mealType, date, baseUrl }) {
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        path.join(process.cwd(), "scripts", "openclaw-daily-runner.mjs"),
        "--mealType",
        mealType,
        "--date",
        date,
        "--baseUrl",
        baseUrl,
        "--write"
      ],
      {
        cwd: process.cwd(),
        stdio: "inherit",
        env: process.env
      }
    );

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Daily runner exited with code ${code ?? -1}`));
    });
  });
}

async function main() {
  loadEnvFile(path.join(process.cwd(), ".env"));
  loadEnvFile(path.join(process.cwd(), ".env.local"));

  const args = parseArgs(process.argv.slice(2));
  const message = args.message;
  if (!message) {
    throw new Error("Missing required --message argument.");
  }

  const date = args.date ?? getDateKey();
  const shouldWrite = args.write === "true";
  const baseUrl = args.baseUrl ?? process.env.MEAL_APP_BASE_URL ?? "https://meal-decision-assistant.vercel.app";

  const [locations, existingContext] = await Promise.all([
    fetchJson(baseUrl, "/api/locations"),
    fetchJson(baseUrl, `/api/daily-context?date=${encodeURIComponent(date)}`).catch(() => null)
  ]);

  const parsed = buildDecision(message, locations, existingContext?.currentLocationId ?? null);

  if (!shouldWrite) {
    console.log(JSON.stringify(parsed, null, 2));
    return;
  }

  const feedbackResult = await postJson(baseUrl, "/api/feedback/import", {
    date,
    feedbackType: parsed.feedbackType,
    rawText: parsed.rawText,
    currentLocationId:
      typeof parsed.structuredPatch.currentLocationId === "string" ? parsed.structuredPatch.currentLocationId : null,
    structuredPatch: parsed.structuredPatch
  });

  if (parsed.shouldRegenerateRecommendation) {
    await runDailyRefresh({
      mealType: parsed.inferredMealType,
      date,
      baseUrl
    });
  }

  console.log(
    JSON.stringify(
      {
        ...parsed,
        writeMode: true,
        feedbackId: feedbackResult.feedback?.id ?? null
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
