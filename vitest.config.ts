import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  test: {
    // Default to jsdom for client component tests. Server-side test files
    // that don't touch the DOM opt into the node environment individually
    // via a `// @vitest-environment node` comment at the top of the file.
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["client/src/**/*.test.{ts,tsx}", "server/**/*.test.ts", "shared/**/*.test.ts"],
  },
});
