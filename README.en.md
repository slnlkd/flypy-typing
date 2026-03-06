# flypy-typing

[中文](./README.md) | [English](./README.en.md)

![Release](https://img.shields.io/github/v/release/slnlkd/flypy-typing?sort=semver)
![Downloads](https://img.shields.io/github/downloads/slnlkd/flypy-typing/total)
![License](https://img.shields.io/github/license/slnlkd/flypy-typing)

> A web-based typing practice app focused on **Flypy (Xiaohe Shuangpin)**, built to help users improve speed and accuracy.

> 小鹤双拼打字练习：单字/文章、实时统计、错字分析。 | Flypy typing trainer with real-time stats and mistake analytics.

**Quick Links:** [Releases](https://github.com/slnlkd/flypy-typing/releases) | [Packages](https://github.com/slnlkd?tab=packages&repo_name=flypy-typing)

## Overview

`flypy-typing` is built with **React + TypeScript + Vite**. It provides character/article practice, real-time stats, history tracking, wrong-character analysis, keyboard hints, and customizable settings for Flypy learners.

## Features

- Two practice modes: `Character Practice` and `Article Practice`
- Multiple question strategies: `Random`, `Sequential`, `Hard`, `Initial-focused`, `Final-focused`
- Real-time metrics: speed, accuracy, progress, combo
- Timer modes: `60s / 180s / 300s`
- Practice history and high-frequency mistake statistics
- Configurable keyboard highlighting, pinyin display, font size, sound effects, and volume
- Local persistence for settings and history (Zustand Persist)

## Preview

![App Preview](./docs/preview.png)

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Start dev server

```bash
npm run dev
```

3. Build for production

```bash
npm run build
```

4. Preview production build

```bash
npm run preview
```

5. Run lint

```bash
npm run lint
```

## Project Structure

```text
flypy-typing/
├─ public/                 # static assets
├─ src/
│  ├─ components/          # UI components (Layout / TypingArea / KeyboardMap / Stats / Settings)
│  ├─ data/                # static dictionaries and Flypy mappings
│  ├─ stores/              # Zustand stores
│  ├─ utils/               # pure helpers (pinyin, input checks, sound, etc.)
│  ├─ App.tsx              # app root
│  └─ main.tsx             # entry point
├─ package.json
└─ README.md
```

## Tech Stack

- React 19
- TypeScript 5
- Vite 7
- Zustand 5
- Tailwind CSS 4
- pinyin-pro

## Data & Config

- Settings storage key: `flypy-settings`
- History storage key: `flypy-history`
- Dictionary/mapping source: `src/data/flypy.ts`

## References

- Flypy official site: [https://flypy.cc/](https://flypy.cc/)
- Rime input method: [https://rime.im/](https://rime.im/)

## License

This project is licensed under the [MIT License](./LICENSE).
