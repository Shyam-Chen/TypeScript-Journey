import tailwindcss from "@tailwindcss/vite";
import vize from "@vizejs/vite-plugin";
import { createVizeLintConfig } from "oxlint-plugin-vize";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [tailwindcss(), vize()],
  fmt: {
    sortImports: true,
    sortTailwindcss: true,
  },
  lint: createVizeLintConfig({
    rules: {},
  }),
});
