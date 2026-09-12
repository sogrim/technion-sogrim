# Releases

The app version in `package.json` is shared by Settings and the release announcement.
Clicking the version in Settings opens the release history, newest first.
The history and startup announcement share notes from `src/data/release-notes.ts`.
For a release:

1. Run `npm version <version> --no-git-tag-version` in this directory to update
   `package.json` and any local `package-lock.json` (ignored by Git). The tracked
   Bun lockfile does not store the root package version.
2. In `src/data/release-notes.ts`, archive the previous `CURRENT_RELEASE` at the
   start of the older entries in `RELEASE_HISTORY`, using its explicit old version
   number. Update `CURRENT_RELEASE.changes` with the new announcement copy; its
   version comes from `package.json`.
3. Merge into `master` to trigger the existing deployment workflow.

The announcement appears on startup for new and returning visitors until dismissed
using its close icon, Escape, or backdrop. Dismissal saves the current version
under `sogrim-last-seen-version` in localStorage, so it stays hidden on subsequent
visits in that browser until the version changes. It is not tied to an account.
Clearing storage or using another browser shows it again; if storage is blocked or
full, dismissal still works for the current page but cannot be remembered.
Already-open tabs need a reload to load a new release.
Opening or closing the history does not change the startup announcement's saved
version, so it can be revisited at any time.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
