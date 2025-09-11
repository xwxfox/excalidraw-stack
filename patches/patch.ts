// This is not being used anymore, but keeping it here if it gets useful in the future.

import { promises as fs } from "fs";
import * as path from "path";

type Stats = {
  filesScanned: number;
  filesModified: number;
  replacements: number;
  skippedEnvKeys: string[];
};

const DEFAULT_DIR = "dist";
const TEXT_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".html",
  ".htm",
  ".json",
  ".css",
  ".map",
  ".svg",
  ".txt",
  ".xml",
  ".wasm",
]);

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const res = path.resolve(dir, ent.name);
    if (ent.isDirectory()) {
      yield* walk(res);
    } else if (ent.isFile()) {
      yield res;
    }
  }
}

function looksLikeTextFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  return false;
}

function buildReplacementsFromEnv(env: NodeJS.ProcessEnv) {
  const replacements: {
    key: string;
    value: string;
    json: string;
    escKey: string;
  }[] = [];
  const skipped: string[] = [];

  for (const key of Object.keys(env)) {
    const val = env[key];
    if (val == null || val === "") {
      if (val === undefined) {
        skipped.push(key);
        continue;
      }
    }
    const json = JSON.stringify(String(val));
    replacements.push({
      key,
      value: String(val),
      json,
      escKey: escapeRegex(key),
    });
  }
  return { replacements, skipped };
}

function makeRegexesForKey(escKey: string) {
  const reAccess = new RegExp(
    `\\b(?:import\\.meta\\.env|process\\.env)\\.${escKey}\\b`,
    "g"
  );
  const rePropUnquoted = new RegExp(
    `(^|[\\s,\\{\\(\\[])${escKey}\\s*:\\s*([\\\`"'])([\\s\\S]*?)\\2`,
    "gm"
  );
  const rePropQuoted = new RegExp(
    `(^|[\\s,\\{\\(\\[])["']${escKey}["']\\s*:\\s*([\\\`"'])([\\s\\S]*?)\\2`,
    "gm"
  );
  const reAssign = new RegExp(
    `(^|[\\s;\\(\\[])((?:var|let|const)\\s+)?${escKey}\\s*=\\s*([\\\`"'])([\\s\\S]*?)\\3`,
    "gm"
  );
  const reJsonKey = new RegExp(
    `["']${escKey}["']\\s*:\\s*([\\\`"'])([\\s\\S]*?)\\1`,
    "g"
  );

  return { reAccess, rePropUnquoted, rePropQuoted, reAssign, reJsonKey };
}

async function processFile(
  filePath: string,
  replacements: { key: string; json: string; escKey: string; value: string }[]
) {
  if (!looksLikeTextFile(filePath)) return { modified: false, changes: 0 };

  let content: string;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch (err) {
    return { modified: false, changes: 0 };
  }

  let newContent = content;
  let totalChanges = 0;

  for (const { key, json, escKey } of replacements) {
    const { reAccess, rePropUnquoted, rePropQuoted, reAssign, reJsonKey } =
      makeRegexesForKey(escKey);

    newContent = newContent.replace(reAccess, () => {
      totalChanges++;
      return json;
    });

    newContent = newContent.replace(rePropUnquoted, (_m, p1) => {
      totalChanges++;
      return `${p1}${key}: ${json}`;
    });

    newContent = newContent.replace(rePropQuoted, (_m, p1) => {
      totalChanges++;
      return `${p1}"${key}": ${json}`;
    });

    newContent = newContent.replace(reAssign, (_m, p1, p2) => {
      totalChanges++;
      if (p2) return `${p1}${p2}${key} = ${json}`;
      return `${p1}${key} = ${json}`;
    });

    newContent = newContent.replace(reJsonKey, () => {
      totalChanges++;
      return `"${key}": ${json}`;
    });
  }

  if (totalChanges > 0 && newContent !== content) {
    await fs.writeFile(filePath, newContent, "utf8");
    return { modified: true, changes: totalChanges };
  }
  return { modified: false, changes: 0 };
}

async function main() {
  const argv = process.argv.slice(2);
  const dirFlagIndex = argv.findIndex((a) => a === "--dir" || a === "-d");
  const dir =
    dirFlagIndex >= 0 && argv[dirFlagIndex + 1]
      ? argv[dirFlagIndex + 1]
      : DEFAULT_DIR;

  const dryRun = argv.includes("--dry-run");
  const verbose = argv.includes("--verbose") || argv.includes("-v");

  console.log(`[replace-envs] Starting in directory: ${dir}`);
  if (dryRun)
    console.log("[replace-envs] Dry run enabled (no files will be written).");

  const { replacements, skipped } = buildReplacementsFromEnv(process.env);
  if (replacements.length === 0) {
    console.warn(
      "[replace-envs] No environment variables found to replace. Exiting."
    );
    process.exit(0);
  }

  if (verbose) {
    console.log(
      `[replace-envs] Found ${replacements.length} env vars to consider (skipped ${skipped.length}).`
    );
  }

  const stats: Stats = {
    filesScanned: 0,
    filesModified: 0,
    replacements: 0,
    skippedEnvKeys: skipped,
  };

  try {
    for await (const filePath of walk(path.resolve(dir!))) {
      stats.filesScanned++;
      const { modified, changes } = await processFile(filePath, replacements);
      if (modified) {
        stats.filesModified++;
        stats.replacements += changes;
        if (verbose) {
          console.log(
            `[replace-envs] Modified ${filePath} (${changes} replacements)`
          );
        } else {
          console.log(
            `[replace-envs] Modified ${path.relative(process.cwd(), filePath)}`
          );
        }
      }
    }
  } catch (err) {
    console.error("[replace-envs] Error while walking directory:", err);
    process.exitCode = 2;
  }

  console.log("----");
  console.log(`[replace-envs] Files scanned: ${stats.filesScanned}`);
  console.log(`[replace-envs] Files modified: ${stats.filesModified}`);
  console.log(`[replace-envs] Total replacements: ${stats.replacements}`);
  if (stats.skippedEnvKeys.length > 0) {
    console.log(
      `[replace-envs] Skipped env keys (not present): ${stats.skippedEnvKeys.join(
        ", "
      )}`
    );
  }
  console.log("Done.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
