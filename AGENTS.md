# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains all application code.
- `src/components/` is organized by feature area: `Layout/`, `TypingArea/`, `KeyboardMap/`, `Stats/`.
- `src/stores/` holds Zustand state (`typingStore.ts`, `settingsStore.ts`, `historyStore.ts`).
- `src/utils/` stores pure helpers (for example, pinyin conversion and input checks).
- `src/data/` keeps static typing dictionaries (`flypy.ts`).
- `public/` is for static assets served directly; build output goes to `dist/`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start Vite dev server with HMR.
- `npm run build`: run TypeScript project build (`tsc -b`) and produce production bundle.
- `npm run preview`: preview the built app locally.
- `npm run lint`: run ESLint across the repository.

## Coding Style & Naming Conventions
- Language stack: TypeScript + React function components.
- Use 2-space indentation and semicolons, matching current source style.
- Component files use `PascalCase` (e.g., `ResultPanel.tsx`); stores and utilities use `camelCase` (e.g., `typingStore.ts`, `pinyin.ts`).
- Prefer small, focused modules and keep business logic in `stores/` or `utils/` instead of UI components.
- Run `npm run lint` before committing.

## Testing Guidelines
- This repository currently does not include an automated test runner.
- At minimum, verify changes with `npm run lint`, `npm run build`, and manual flow testing in `npm run dev`.
- For new non-trivial logic, add tests in a colocated `__tests__/` folder (for example, `src/utils/__tests__/pinyin.test.ts`) when introducing a test framework.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style seen in history: `feat:`, and use `fix:`, `refactor:`, `chore:` as appropriate.
- Keep each commit focused on one change.
- PRs should include: purpose, key changes, test/verification steps, and screenshots or GIFs for UI updates.
- Link related issues and call out any behavior changes (typing logic, scoring, history persistence).

## Configuration & Data Notes
- `settingsStore` and `historyStore` persist user data; treat schema changes carefully.
- When updating `src/data/flypy.ts`, document source and validate representative input mappings.
