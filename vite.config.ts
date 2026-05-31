import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { vercelPreset } from "@react-router/vercel/vite";

export default defineConfig({
  plugins: [reactRouter({ presets: [vercelPreset()] }), tsconfigPaths()],
});
