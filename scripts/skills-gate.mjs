#!/usr/bin/env node
/**
 * Skills gate — enforces the Claude Skills made in Week 1 on every push.
 *
 * It does TWO things (per the Week 5 decision "Both"):
 *   1. INTEGRITY — the five vendored skill files in .claude/skills/ exist and
 *      match the SHA-256 recorded in skills.manifest.json. A push that deletes
 *      or quietly edits a skill fails until the manifest is updated on purpose.
 *   2. ENFORCEMENT — the mechanically-checkable rules the skills describe are
 *      applied to the app code:
 *        - security-guard : no hard-coded secrets in source.
 *        - testing-standards: unit tests must exist (they are also run and must
 *          pass in the separate `unit-tests` CI job).
 *        - performance-guard: no whole-library imports of known-heavy packages.
 *      (accessibility is enforced as errors by the `lint-and-types` job via
 *      eslint-plugin-jsx-a11y; ux-standards is a review-level skill whose file
 *      is held intact by the integrity check above.)
 *
 * Exit code 0 = all good; 1 = at least one violation (fails the CI job).
 * No dependencies — plain Node, so it runs anywhere with `node`.
 */

import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const failures = [];
const notes = [];
const fail = (rule, msg) => failures.push(`[${rule}] ${msg}`);
const note = (msg) => notes.push(msg);

/* ---------- helpers ---------- */

// Recursively list source files under the given dirs, honoring a skip list.
function listFiles(dirs, exts) {
  const out = [];
  const SKIP = new Set(["node_modules", ".next", ".git", "coverage", "out", "build"]);
  const walk = (p) => {
    let st;
    try {
      st = statSync(p);
    } catch {
      return;
    }
    if (st.isDirectory()) {
      const base = p.split("/").pop();
      if (SKIP.has(base)) return;
      for (const name of readdirSync(p)) walk(join(p, name));
    } else if (exts.some((e) => p.endsWith(e))) {
      out.push(p);
    }
  };
  for (const d of dirs) walk(join(ROOT, d));
  return out;
}

const SOURCE_DIRS = ["app", "lib", "components", "middleware.ts", "next.config.mjs"];
const SOURCE_EXTS = [".ts", ".tsx", ".js", ".mjs", ".jsx"];
// Scan application source only; tests use obvious fake literals on purpose.
const sourceFiles = listFiles(SOURCE_DIRS, SOURCE_EXTS).filter(
  (f) => !/\.test\.|\.spec\./.test(f),
);

/* ---------- 1. INTEGRITY: vendored skills match the manifest ---------- */

const MANIFEST = ".claude/skills/skills.manifest.json";
if (!existsSync(join(ROOT, MANIFEST))) {
  fail("skills-integrity", `missing manifest ${MANIFEST}`);
} else {
  const manifest = JSON.parse(readFileSync(join(ROOT, MANIFEST), "utf8"));
  const EXPECTED = 5;
  if (!Array.isArray(manifest.skills) || manifest.skills.length < EXPECTED) {
    fail("skills-integrity", `manifest should list ${EXPECTED} skills, found ${manifest.skills?.length ?? 0}`);
  }
  for (const { file, sha256 } of manifest.skills ?? []) {
    const abs = join(ROOT, file);
    if (!existsSync(abs)) {
      fail("skills-integrity", `skill file missing: ${file}`);
      continue;
    }
    const actual = createHash("sha256").update(readFileSync(abs)).digest("hex");
    if (actual !== sha256) {
      fail(
        "skills-integrity",
        `skill changed without updating the manifest: ${file}\n          expected ${sha256}\n          actual   ${actual}`,
      );
    }
  }
  note(`integrity: checked ${manifest.skills?.length ?? 0} vendored skill files`);
}

/* ---------- 2a. security-guard: no hard-coded secrets ---------- */

const SECRET_PATTERNS = [
  { name: "JWT / Supabase key", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{6,}/ },
  { name: "OpenAI-style key", re: /\bsk-[A-Za-z0-9]{20,}/ },
  { name: "private key block", re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  { name: "service-role literal", re: /SERVICE_ROLE[A-Z_]*\s*[:=]\s*["'`][A-Za-z0-9._-]{12,}["'`]/ },
];
let secretsScanned = 0;
for (const f of sourceFiles) {
  const text = readFileSync(f, "utf8");
  secretsScanned++;
  const lines = text.split("\n");
  for (const { name, re } of SECRET_PATTERNS) {
    lines.forEach((line, i) => {
      if (re.test(line)) fail("security-guard", `possible hard-coded secret (${name}) in ${relative(ROOT, f)}:${i + 1}`);
    });
  }
}
note(`security-guard: scanned ${secretsScanned} source files for secrets`);

/* ---------- 2b. testing-standards: tests must exist ---------- */

const testFiles = listFiles(["test"], [".test.ts", ".test.tsx"]);
if (testFiles.length === 0) {
  fail("testing-standards", "no unit tests found under test/ — 'no code without tests'");
} else {
  note(`testing-standards: found ${testFiles.length} test files (run + must pass in the unit-tests job)`);
}

/* ---------- 2c. performance-guard: no whole-library heavy imports ---------- */

// Flag default/namespace imports of known-heavy libs (use subpath imports).
const HEAVY = ["lodash", "moment", "rxjs"];
const heavyRe = new RegExp(
  `import\\s+(?:\\*\\s+as\\s+\\w+|\\w+)\\s+from\\s+["'](?:${HEAVY.join("|")})["']`,
);
for (const f of sourceFiles) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (heavyRe.test(line)) {
      fail(
        "performance-guard",
        `whole-library import in ${relative(ROOT, f)}:${i + 1} — use a subpath import (e.g. lodash/debounce)`,
      );
    }
  });
}
note(`performance-guard: checked imports in ${sourceFiles.length} source files`);

/* ---------- report ---------- */

console.log("Skills gate — Week 1 skills enforced on this push\n");
for (const n of notes) console.log("  • " + n);
console.log("");

if (failures.length) {
  console.error(`✗ Skills gate FAILED with ${failures.length} issue(s):\n`);
  for (const f of failures) console.error("  - " + f);
  console.error("\nFix the issue(s) above, or (for an intentional skill edit) regenerate the manifest.");
  process.exit(1);
}

console.log("✓ Skills gate passed — all five Week 1 skills are intact and enforced.");
