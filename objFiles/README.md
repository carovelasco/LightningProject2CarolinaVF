## Install Dependencies
Install [Node.js](https://nodejs.org/) (which includes `npm`), then install Vite globally:

```bash
npm install -g vite
```
```bash
npm install
```
```bash
npm run dev
```

## Vite Configuration

Create a `vite.config.ts` at the root of your project. Set `base` to match your GitHub repository name:

```ts
import { defineConfig } from "vite";

export default defineConfig({
  base: "/<your-repo-name>/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        // add more entry points as needed
      },
    },
  },
});
```

## Publish to GitHub Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to the `gh-pages` branch:
   ```bash
   npm run deploy
   ```

3. In your GitHub repo settings, ensure Pages is set to serve from the `gh-pages` branch.

The site will be available at `https://<your-username>.github.io/<your-repo-name>/`.
