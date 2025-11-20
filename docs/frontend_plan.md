## 项目设计概述

- **目标**：基于 `COC` 创建角色的纯前端应用，聚焦角色属性计算与展示，兼容桌面与手机浏览器，离线可用。
- **约束**：不依赖服务器、尽量复用 `aps` 项目中“轻量入口 + 模块化 src”的结构，减少外部库（仅使用 Vite + React + TypeScript + pnpm/yarn 自带依赖）。
- **核心策略**：预置静态数据、在前端内存完成计算，利用浏览器 `localStorage` 记录用户配置；通过 Vite 构建静态资源，直接放入手机浏览器（可通过本地文件、离线 PWA、或静态托管）使用。

## 技术栈与库

1. **构建工具**：Vite（原生支持 TS/React、体积小、热更新快，`aps` 同款）。
2. **框架**：React 18 + TypeScript，组件化处理表单、计算结果与数据展示。
3. **状态管理**：React 内建状态 + `useReducer`，避免额外库。
4. **样式方案**：CSS Modules（或 `aps` 使用的轻量方式，如直接 `src/styles` 目录）。
5. **数据管理**：在 `src/data` 中写死职业、技能、物品等 JSON；提供类型定义。
6. **计算模块**：`src/services/calculator.ts` 内封装数值逻辑，方便单元测试。
7. **离线策略**：默认构建出的 `dist` 可直接打开；如需更好体验，可加 Vite PWA plugin，但默认不启用以减少依赖。

## 目录结构（参考 aps）

```
frontend/
├─ package.json          # 参照 aps，保留 scripts
├─ vite.config.ts
├─ tsconfig.json
├─ public/
│  └─ manifest.json      # 可选，用于 PWA/图标
└─ src/
   ├─ main.tsx           # 入口，挂载 App，与 aps 类似
   ├─ App.tsx
   ├─ assets/            # 静态图标、背景
   ├─ components/        # UI 组件，例如属性表、点数分配器
   ├─ features/
   │  ├─ character-form/ # 角色录入
   │  └─ summary-panel/  # 结果展示
   ├─ data/              # 写死的职业/技能/装备列表
   ├─ services/          # calculator、导出 PDF 等逻辑
   ├─ hooks/             # 自定义 Hook（如 useCharacterBuilder）
   ├─ styles/            # 全局样式，与 aps 一致
   └─ utils/             # 公共函数
```

> 若 aps 项目已有复用模块，可通过工作区内相对引用或创建 `packages/shared/` 的方式抽取，但该版本保持单仓。

## 功能模块设计

1. **角色基础信息**：姓名、职业、年龄等输入表单，验证逻辑写在 `features/character-form`.
2. **属性点数分配**：使用 `services/calculator` 中的规则函数，接收基础属性 + 职业系数，返回最终值。
3. **技能/装备选择**：下拉或多选组件读取 `data/skills.ts` & `data/items.ts`。
4. **数值计算核心**：
   - `calculateAttributes(baseStats, professionModifiers)`
   - `calculateSkillPoints(profession, intBonus, eduBonus)`
   - `deriveSecondaryStats(attributes)`（HP、SAN、幸运等）
5. **结果展示**：`features/summary-panel` 将计算结果拆分为卡片，支持导出 JSON（供备份）。
6. **数据持久化**：`localStorage`，存储最近一次角色；提供“快速恢复”按钮。
7. **数据写死策略**：`src/data/constants.ts` 导出所有职业/技能/装备；`src/types` 定义 `Character`, `Profession`, `Skill`.

## 开发步骤（建议按顺序执行）

1. **初始化工程**
   - `cd /Users/danlan/workspace/coc_tools`
   - `pnpm create vite frontend --template react-ts`
   - 对齐 aps 的 `package.json` scripts（如 `dev`, `build`, `preview`）。
2. **搭建基础结构**
   - 创建上述目录；复制/复用 aps 中的 ESLint、Prettier、tsconfig 设定。
   - 在 `App.tsx` 中放置布局骨架（Header + 两列主内容）。
3. **编写数据与类型**
   - `src/types/character.ts` 定义核心接口。
   - `src/data/professions.ts`, `skills.ts`, `items.ts` 写死常用 COC 职业/技能。
4. **实现计算服务**
   - `services/calculator.ts` 编写属性、技能、二次属性计算函数。
   - 补充单元测试（可用 Vitest，若 aps 已配置则复用）。
5. **构建页面组件**
   - `features/character-form`: 表单 + 输入校验。
   - `features/summary-panel`: 将计算结果以卡片显示。
   - `components/AttributeInput`, `components/SkillSelector` 等基础组件。
6. **状态与数据流**
   - `useCharacterBuilder`：封装 `useReducer`，处理用户操作 -> 状态 -> 调用 calculator。
   - `localStorage` 持久化 Hook（如 `useLocalStorageState`，可直接从 aps 拷贝）。
7. **离线与发布**
   - `pnpm build` 产出 `frontend/dist`。
   - 直接将 `dist` 目录拷到手机或托管在 GitHub Pages/静态空间；若需离线安装，可再加 `@vite-pwa/plugin`.

## 测试与验收

- **单元测试**：针对 `services/calculator` 的数值函数，以及数据转换工具。
- **E2E/手测**：
  1. 桌面浏览器输入角色信息，验证属性与技能点是否符合 COC 规则。
  2. 构建后用手机浏览器打开 `dist/index.html`，确认 UI 自适应、无跨域依赖。
  3. 关闭网络后再次打开页面，确保数据仍能读取（依赖浏览器缓存 + localStorage）。

## 后续扩展（可选）

- 集成本地 PDF/图像导出，方便打印角色卡。
- 使用 `IndexedDB` 存储多角色档案。
- 添加简单的“骰子掷点”工具，重用 calculator 中的随机函数。
- 若未来需要与服务器同步，可将当前 `services` 抽象出接口层，实现最少改动扩展。

