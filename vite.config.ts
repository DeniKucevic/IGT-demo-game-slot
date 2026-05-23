import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
      "@components": resolve(__dirname, "src/components"),
      "@core": resolve(__dirname, "src/core"),
      "@server": resolve(__dirname, "src/server"),
    },
  },
});
