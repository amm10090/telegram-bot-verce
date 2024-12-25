import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: ["react", "react-dom", "react-hook-form", "lucide-react"],
  esbuildOptions(options) {
    options.alias = {
      "@": "./src",
    };
  },
});
