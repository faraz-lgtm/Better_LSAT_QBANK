# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Supabase Auth URL configuration (production)

Magic links, OAuth callbacks, and password-reset emails are constructed from the
**Site URL** and **Redirect URLs allow-list** configured in the **hosted** Supabase
project (Authentication -> URL Configuration). The local `supabase/config.toml`
governs only the local stack. If production emails point at `localhost`, the
Dashboard config is the source of truth that needs fixing.

For project `ymitqvbxrauychrkkhqp` set:

- **Site URL**: `https://better-lsat-qbank.vercel.app`
- **Redirect URLs** (keep localhost entries for dev):
  - `https://better-lsat-qbank.vercel.app/auth/callback`
  - `https://better-lsat-qbank.vercel.app/auth/callback?type=recovery`
  - `https://*-better-lsat-qbank-*.vercel.app/auth/callback` (Vercel preview deploys)
  - `http://localhost:5173/auth/callback`
  - `http://127.0.0.1:5173/auth/callback`
  - `http://localhost:5173/auth/callback?type=recovery`
  - `http://127.0.0.1:5173/auth/callback?type=recovery`

The frontend always passes the current-origin callback via
`getAuthCallbackUrl()` / `getPasswordResetCallbackUrl()` in
`src/lib/api/auth.ts`, so once the allow-list is correct, links sent from
production resolve to production and links sent from localhost resolve to
localhost.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

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
