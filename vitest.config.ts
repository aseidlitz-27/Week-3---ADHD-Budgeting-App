import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Resolve "@/..." the same way Next.js / tsconfig does ("@/*" -> "./*"),
// so unit tests import the real app modules with no source changes.
const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // A failing test must fail the process (and therefore the CI job).
    passWithNoTests: false,
  },
  resolve: {
    alias: [{ find: /^@\//, replacement: root + "/" }],
  },
});
