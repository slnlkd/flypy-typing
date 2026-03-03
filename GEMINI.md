# Flypy Typing (小鹤双拼练习) - Project Overview

这是一个专为**小鹤双拼**输入法设计的打字练习 Web 应用。项目基于现代前端技术栈构建，旨在提供沉浸式的双拼学习与练习体验。

## 🚀 技术栈 (Tech Stack)

- **框架**: [React 19](https://react.dev/)
- **构建工具**: [Vite 7](https://vitejs.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
- **拼音处理**: [pinyin-pro](https://github.com/zh-lx/pinyin-pro)

## 📂 核心目录结构 (Core Structure)

- `src/components/`: UI 组件，按功能模块划分子目录。
  - `KeyboardMap/`: 小鹤双拼键位图显示。
  - `TypingArea/`: 核心练习区（单字模式与文章模式）。
  - `Stats/`: 实时统计栏、结果面板与历史记录。
- `src/stores/`: Zustand 状态仓库。
  - `typingStore.ts`: 练习核心逻辑（计时、速度计算、输入校验）。
  - `settingsStore.ts`: 用户偏好设置（字号、拼音提示开关）。
  - `historyStore.ts`: 练习记录持久化。
- `src/data/`: 静态数据，包括小鹤双拼映射表和常用练习文本。
- `src/utils/`: 工具函数，主要是拼音转换与输入验证逻辑。

## 🛠️ 构建与开发 (Build & Development)

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 生产环境构建
```bash
npm run build
```

### 代码检查
```bash
npm run lint
```

## ⌨️ 核心逻辑说明 (Key Logic)

- **输入校验**: 系统监听键盘事件，通过 `typingStore` 实时对比用户输入与目标字符的小鹤双拼编码。
- **双拼映射**: 映射关系定义在 `src/data/flypy.ts` 中，支持零声母处理及复杂的韵母映射。
- **练习模式**: 
  - **单字模式**: 随机抽取常用 500 字进行高频练习。
  - **文章模式**: 预置经典诗词及散文片段，模拟真实输入场景。

## 📏 开发惯例 (Development Conventions)

- **组件化**: 优先使用功能单一、高内聚的组件。
- **状态提升**: 跨组件共享的状态（如当前输入、统计数据）统一放置在 Zustand Store 中。
- **类型安全**: 所有数据结构和组件 Props 必须定义 TypeScript 接口。
- **样式规范**: 统一使用 Tailwind CSS 类名进行布局与样式定义，避免 CSS 污染。
