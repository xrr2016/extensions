## TabPeek → pnpm monorepo 重构计划（v2 · 多插件扁平布局）

**目标结构**：`apps/` 下按"每个产品两个目录"扁平排列，为未来多插件预留命名模式；不抽 shared 包。

```
tabpeek/                        # workspace 根
  package.json                  # 私有根包：脚本编排（-F 转发 + 聚合）
  pnpm-workspace.yaml           # packages: ['apps/*']
  .gitignore / README.md / AGENTS.md
  apps/
    tabpeek/                    # 插件本体   → @plugins/tabpeek
      package.json              # 保留 vue/wxt deps、postinstall: wxt prepare、license 脚本
      wxt.config.ts  tsconfig.json
      entrypoints/ utils/ assets/ public/ scripts/ test/
    tabpeek-landing/            # 官网       → @plugins/tabpeek-landing
      package.json              # 无依赖；scripts.dev = node scripts/serve.mjs
      scripts/serve.mjs         # 零依赖静态服务器（~40 行，端口 4173）
      index.html css/ js/ assets/
    # 未来：wordpeek/ + wordpeek-landing/ …
```

### 命名与脚本约定

- 包名统一 `@plugins/<目录名>`，避免与 npm 公共包冲突，也便于 `-F` 过滤。
- 根 package.json 脚本（当前只注册 tabpeek 一套，新产品照抄三行）：
  - 单产品：`dev:tabpeek`、`dev:tabpeek:firefox`、`build:tabpeek`、`zip:tabpeek`、`compile:tabpeek`、`landing:tabpeek`
  - 聚合：`compile` → `pnpm -r --if-present compile`；`build` → `pnpm -r --if-present build`
  - 授权工具留在产品包内：`pnpm -F @plugins/tabpeek license:issue <id>`
- 新产品接入清单（写入 AGENTS.md）：复制 `apps/<name>` 骨架 → 改 wxt.config manifest 与包名 → 注册根脚本三件套 → 建 `apps/<name>-landing` → 图标从 `public/icon` 同步到 landing/assets。

### 迁移步骤

1. **移动**（非 git 仓库，直接 mv）：`entrypoints utils assets public scripts test wxt.config.ts tsconfig.json` → `apps/tabpeek/`（`components/` 若已空则删除）；根 `package.json` 拆为根包 + `apps/tabpeek/package.json`；`landing/` → `apps/tabpeek-landing/`。
2. **新增**：`pnpm-workspace.yaml`、根 `package.json`（上述脚本）、`apps/tabpeek-landing/package.json` + `scripts/serve.mjs`。
3. **路径修正**：`.gitignore` 的私钥行 → `apps/tabpeek/scripts/private-key.json`（文件随目录移动，内容不动）；`apps/tabpeek/test/repro-hover.html` 的 `../.output/...` 相对路径平移后仍成立，无需改。
4. **重装**：删根 `node_modules/`、`pnpm-lock.yaml`、`.wxt/`、`.output/` → 根 `pnpm install`（workspace 包自身 postinstall 正常执行；若 pnpm 提示构建脚本审批则批准 wxt）。
5. **文档**：AGENTS.md（目录图、命令表、多插件约定与接入清单、"landing 与扩展零依赖共享"表述更新为 `tabpeek-landing`）、README.md 开发章节。

### 风险与决策说明

- **WXT 无需特殊配置**：工程根 = `apps/tabpeek/`（wxt.config.ts 所在处），`.wxt/`/`.output/` 生成物随之前移；`public/icon` 自动探测、Vue 模块、自动导入不受影响。
- **pnpm 12 lifecycle 脚本**：只拦外部依赖的 postinstall，workspace 包自身脚本会跑；安装时留意 approve-builds 交互提示。
- **回滚**：纯文件移动 + lockfile 重生成，可逆向恢复。

### 验证

- 根 `pnpm compile` 与 `pnpm build:tabpeek` 通过；`apps/tabpeek/.output/chrome-mv3/manifest.json` 完整（tabs/storage 权限、content_scripts、popup、icons）。
- `pnpm landing:tabpeek` 起服务，打开 `http://127.0.0.1:4173` 确认官网渲染 + 中英切换 + 锚点。
- 复现页经同一服务器打开 `…/apps/tabpeek/test/repro-hover.html`，确认悬停链路仍弹预览窗（相对路径回归）。
- `pnpm -F @plugins/tabpeek license:issue test` 正常发码（私钥路径迁移无碍）。

### 不做

Turborepo/Nx 编排、landing 构建管线、packages/shared、任何功能代码改动。