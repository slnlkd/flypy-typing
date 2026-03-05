# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Small Crane (Xiaohe) Shuangpin typing practice web app. Users practice typing Chinese characters using the Flypy (Xiaohe) double-pinyin input method, with single-character and article practice modes, a virtual keyboard map, real-time stats, and history tracking.

## Commands

- `npm run dev` - Start Vite dev server with HMR
- `npm run build` - TypeScript check + production build (`tsc -b && vite build`)
- `npm run lint` - ESLint
- `npm run preview` - Preview production build

## Tech Stack

React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + Zustand 5. No test framework configured.

## Architecture

**State management:** Three Zustand stores in `src/stores/`:
- `typingStore.ts` - Core typing logic: character generation, input validation, scoring, combo tracking, timer. Orchestrates practice sessions for both modes.
- `settingsStore.ts` - User preferences (dark mode, keyboard visibility, sound, font size, practice type, timer mode). Persisted via `zustand/middleware/persist`.
- `historyStore.ts` - Practice records and wrong-character statistics. Also persisted.

**Data flow:** `typingStore` reads settings from `settingsStore` and writes records to `historyStore` on session completion.

**Key data:** `src/data/flypy.ts` contains the Shuangpin mapping table (`pinyinToFlypy`) and the common character pool (`commonChars`). `src/utils/pinyin.ts` handles pinyin conversion (using `pinyin-pro` library) and Flypy input validation.

**Components** (`src/components/`):
- `Layout/Header` - Mode switching (char/article), dark mode, nav to history/settings
- `TypingArea/CharPractice` and `ArticlePractice` - The two practice modes
- `KeyboardMap/KeyboardMap` - Virtual keyboard showing Shuangpin mappings, highlights active keys
- `Stats/StatsBar` - Real-time speed/accuracy/combo during practice
- `Stats/ResultPanel` and `HistoryPanel` - End-of-session results and historical records
- `Settings/SettingsPanel` - Settings modal

**Theming:** CSS custom properties (`--bg-primary`, `--text-primary`, etc.) toggled by `.dark` class on `<html>`.

## Conventions

- 2-space indentation, semicolons
- PascalCase for component files, camelCase for stores/utils
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`
- Business logic belongs in stores/utils, not in UI components
- Both stores that persist use localStorage - treat schema changes carefully (migration needed)
- UI text is in Chinese
