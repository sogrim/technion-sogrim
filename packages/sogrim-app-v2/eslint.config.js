import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Native `title` tooltips are laggy (multi-second delay) and unstyled.
      // Use the <Hint> component (src/components/ui/hint.tsx) instead. This only
      // bans `title` on host (lowercase) DOM elements; component props named
      // `title` (e.g. <DetailSection title=...>) are unaffected.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "JSXOpeningElement[name.name=/^[a-z]/] > JSXAttribute[name.name='title']",
          message:
            'Use the <Hint label="..."> component instead of a native `title` attribute (native tooltips are laggy and unstyled).',
        },
      ],
    },
  },
  {
    // EXCEPTION: the semester timeline's slots are dnd-kit draggables that spread
    // `{...listeners}`/`{...attributes}` onto the same node as `title`. Wrapping
    // them in <Hint> (Radix `asChild`) would merge pointer handlers onto the drag
    // node and risk breaking drag-and-drop. These native titles are retained
    // intentionally until a drag-safe (controlled) tooltip is implemented.
    // TODO(benny-n): convert timeline slot tooltips with a controlled <Hint>.
    files: ['src/components/planner/semester-timeline.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
])
