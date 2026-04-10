import { defineConfig } from "vite";

export default defineConfig({
  base: "/<LightningProject2CarolinaVF>/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        // add more entry points as needed
      },
    },
  },
});