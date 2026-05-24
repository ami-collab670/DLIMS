# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

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
<<<<<<< HEAD

## Backend API mapping (LSIMS-main)

Frontend-only parity with `LSIMS-Backend/LSIMS-main` (Docker default). No backend changes.

### Manual verification checklist

Run `docker compose up` from repo root, then `npm run dev` in `LSIMS-Frontend`.

| Role | Check |
|------|--------|
| **Admin** | Users tab: create user (list refreshes), superuser badge, edit loads fresh row via `GET /users/:id/` |
| **Admin** | Roles tab: create, edit, delete role |
| **Admin** | Test catalog: delete row (or API error if referenced); toggle active |
| **Receptionist** | Job detail: set role hold (`blocked_by_role`), cancel with optional reason |
| **Finance / QC** | Job rows show hold badge when `blocked_by_role` is set |
| **Client** | New request wizard loads live test catalog; submit still creates job + samples |
| **Client** | Dashboard shows active job count and recent statuses |
| **Analyst** | Sample detail shows `blind_alias_id` when API returns analyst payload |
| **Any user** | Notifications: metadata block when present; “Load full detail” fetches `GET /inbox/:id/` |
=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
