# flypy-typing

[中文](./README.md) | [English](./README.en.md)

![Release](https://img.shields.io/github/v/release/slnlkd/flypy-typing?sort=semver)
![Downloads](https://img.shields.io/github/downloads/slnlkd/flypy-typing/total)
![License](https://img.shields.io/github/license/slnlkd/flypy-typing)

> 一个专注于 **小鹤双拼** 的网页打字练习工具，帮助你从入门到提速。

> 小鹤双拼打字练习：单字/文章、实时统计、错字分析。 | Flypy typing trainer with real-time stats and mistake analytics.

**快速入口：** [Releases](https://github.com/slnlkd/flypy-typing/releases) | [Packages](https://github.com/slnlkd?tab=packages&repo_name=flypy-typing)

## 项目简介

`flypy-typing` 是基于 **React + TypeScript + Vite** 开发的双拼练习应用，面向小鹤双拼用户，提供单字/文章练习、实时统计、历史记录、错字分析、键位提示与练习设置等功能。

适合人群：

- 想系统练习小鹤双拼的新手
- 想提升速度与准确率的进阶用户
- 希望通过错字统计进行针对性训练的用户

## 功能亮点

- 支持两种练习模式：`单字练习`、`文章练习`
- 支持多种出题策略：`随机`、`顺序`、`难字`、`声母专项`、`韵母专项`
- 内置实时统计：速度、准确率、进度、连击
- 支持限时模式：`60s / 180s / 300s`
- 支持练习历史记录与高频错字统计
- 支持键位图高亮、拼音显示、字号、音效音量等个性化设置
- 本地持久化设置与历史数据（基于 Zustand Persist）

## 界面预览

![应用截图](./docs/preview.png)

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 启动开发环境

```bash
npm run dev
```

3. 构建生产版本

```bash
npm run build
```

4. 本地预览构建结果

```bash
npm run preview
```

5. 代码检查

```bash
npm run lint
```

## 使用说明

1. 打开页面后，选择练习模式（单字或文章）。
2. 根据需要调整练习参数（字数、出题模式、限时模式、音效等）。
3. 直接在键盘输入即可开始。
4. 练习结束后查看结果面板，并在历史记录中观察长期趋势。

## 项目结构

```text
flypy-typing/
├─ public/                 # 静态资源
├─ src/
│  ├─ components/          # UI 组件（Layout / TypingArea / KeyboardMap / Stats / Settings）
│  ├─ data/                # 静态字典数据（flypy 映射等）
│  ├─ stores/              # Zustand 状态管理
│  ├─ utils/               # 纯工具函数（拼音转换、输入校验、音效等）
│  ├─ App.tsx              # 应用主入口
│  └─ main.tsx             # 渲染入口
├─ package.json
└─ README.md
```

## 技术栈

- React 19
- TypeScript 5
- Vite 7
- Zustand 5
- Tailwind CSS 4
- pinyin-pro

## 数据与配置说明

- 练习设置存储于本地：`flypy-settings`
- 历史记录与错字统计存储于本地：`flypy-history`
- 题库与编码映射位于：`src/data/flypy.ts`

## 致谢与参考

- 小鹤双拼官网：[https://flypy.cc/](https://flypy.cc/)
- Rime 输入法：[https://rime.im/](https://rime.im/)

## License

本项目采用 [MIT License](./LICENSE) 开源。
