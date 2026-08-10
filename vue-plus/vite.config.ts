import { defineConfig } from "vite-plus";
import vize from "@vizejs/vite-plugin";
import { createVizeLintConfig } from "oxlint-plugin-vize";

export default defineConfig({
  plugins: [vize()],
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: createVizeLintConfig({
    preset: "recommended",
    rules: {
      "no-console": "warn",
    },
    settings: {
      helpLevel: "short",
    },
  }),
});
