# unify-release-it-config

# 把两份 release-it 配置收成仓库根的一份

## 一、先说结论：可以，而且已经在本地实测跑通过（不是推测）

release-it 21.0.3 是这样取配置的（读了 `lib/config.js` + c12 3.3.4 源码）：以 **cwd** 为基准找 `.release-it`（`.json/.js/.mjs/…`），并用 `packageJson: true` 读 **cwd 的 `package.json`** 里 `release-it` 键；`pnpm -F @extensions/<app> release` 的 cwd 就是 `apps/<app>`。由此实测到的事实：

| 结论 | 证据（本次实际跑的） |
| --- | --- |
| 两份 app 配置能合并成「根一份 + app 指过来」 | c12 支持 `extends`：app 里写 `{"extends":"../../x.mjs"}` 时基础层先合并、app 自己的键覆盖它（`draft: true` 覆盖生效、`git.tagName` 从基础层拿到） |
| app 名/ tag 名可以从 cwd 推出来 | 统一配置里 `process.cwd()/package.json` 的 name 去掉 scope → 两个 app 的最终 options 与现状**逐键一致**（`prelook-v${version}` / `repoways-v${version}`、`npm: false`、`github.release: false`、bumper `out: package.json`、prelook 的 `after:bump` 钩子） |
| 两个 app 的 `release` 脚本与根脚本**一行都不用改** | 统一配置走 app 目录里那个 stub 的 `extends`，入口仍是 `pnpm release:<app>` |
| 全流程能跑 | 在 `apps/repoways` 用统一配置跑 `release-it --dry-run --ci`：`🏁 Done`、写出 tag `repoways-v0.0.1`、`$ Writing version to package.json`、`! git push --follow-tags`，跑完 `git status --porcelain` 为空（没落任何写入） |

**顺带查清的两件旧事**（都是真的、且都被文档写错过）：

1. **根 `package.json` 里那个 `release-it` 键从来没生效过**。c12 只读 cwd（= `apps/<app>`）的 `package.json`，实测两个 app 解析出的 `git.requireCleanWorkingDir` 都是默认的 **`true`**。也就是说那条 `requireCleanWorkingDir: false` 是一条死配置。
2. AGENTS.md 第 55、111 行说 RepoWays 的 `.release-it.json`「**没有** …bumper」，与第 357 行「`@release-it/bumper` 不能当模板残留删掉」自相矛盾——实测 `apps/repoways/.release-it.json` 里 bumper **是有的**，那两处是错的，这次一并改对。

## 二、改动（共 4 处文件 + 文档）

### 1. 新增根 `release-it.config.mjs`（唯一真源）

放在仓库根、与 `scripts/*.mjs` 同风格（双引号、分号、英文注释）。要点：

- app 名 = `JSON.parse(FS.read(process.cwd()/package.json)).name` 去 scope；tag 名由它拼：`app + "-v${version}"`（**`${version}` 必须留成字面量**，由 release-it 自己替换，所以用单引号/字符串拼接，不能用模板串插值）。
- 一张 `APPS` 表装「每个 app 的差异」：`prelook` 带 `hooks: { "after:bump": "pnpx auto-changelog -p" }`，`repoways` 是 `{}`（monorepo 共用一条 git 历史，给它跑 auto-changelog 会把 prelook 的提交灌进去 → 发布说明走 workflow 的 `--generate-notes`）。
- **未登记的 app 直接报错**（`Object.hasOwn(APPS, app)`）：这条守卫挡的是「在别处误跑」——比如在仓库根跑一次会拿根包名拼出 `extensions-v0.0.1` 这种 tag。因为 release-it 会把配置里的异常包成 `Invalid configuration file at <path>`（实测如此，原始 message 会被吞），所以先 `console.error` 打一行真实原因再 `throw`。
- 共用键连同「为什么不能删」的注释一起搬过来：`npm: false`、`github: { release: false }`（release 本体由 workflow 建成草稿）、`plugins: { "@release-it/bumper": { out: "package.json" } }`（npm 插件关掉后**只有它**会把版本写进 `apps/<app>/package.json`，而 zip 名读的正是这里）。
- 文件顶部加一行 `/** @type {import("release-it").Config} */` 拿编辑器提示（release-it 21 自带 `types/`）。

### 2. 两个 app 的 `.release-it.json` 改成 3 行指针

```json
{
  "$schema": "https://unpkg.com/release-it@21/schema/release-it.json",
  "extends": "../../release-it.config.mjs"
}
```

- `extends` 在 release-it 官方 schema 里（已确认 schema 第 12 行），所以编辑器校验是干净的。
- 顺手把 prelook 那份 `$schema` 从 `release-it@20` 升到 **21**（装的就是 21，老的是过期提示）。
- 保留 stub 的另一个收益：在 app 目录里**裸跑** `release-it`（不走 `pnpm release:*`）也照样读到共享配置；如果一份文件都不留，裸跑会退回 release-it 默认值（无前缀 `v${version}` tag + `npm.publish: true`）。

### 3. 根 `package.json`：删掉那条死键

删 `"release-it": { "git": { "requireCleanWorkingDir": false } }`。它今天就不生效，删掉 = **行为零变化**（脏工作区仍会拦住发版，这是安全的一侧）。
> 决策点 A：如果你当初的意图是「脏工作区也能发版」，说一声——那要把它搬进共享配置里才真正生效（那才是行为变化，我不擅自做）。

### 4. 文档（AGENTS.md 四处 + 可选）

- **「目录结构」块**（第 72 行 `pnpm-workspace.yaml` 之后）：补一行 `release-it.config.mjs` 的说明（唯一发版配置、按 cwd 推 app、APPS 表、未登记即报错）。
- **第 111 行**（repoways 的 `.release-it.json`）：改成「3 行指针 → 根配置」，并**修掉「没有 bumper」这句错的**；同类错误见第 55 行。
- **「常用命令」表第 55 行**：`pnpm release:prelook / release:repoways` 的说明改成「版本号 + tag 由根 `release-it.config.mjs` 统一管；app 目录只剩一行 `extends`；prelook 带 auto-changelog 钩子、repoways 不带，理由在 APPS 表旁」。
- **「发版链路」段（第 353 行开头与第 355 行）**：改写为「唯一配置在根」，说明推导方式、`extends` 解析（c12，相对 app 目录）、APPS 表、未登记 app 的守卫、以及两条死键的处理（`github.draft` 不搬：`github.release: false` 时它不参与任何事，草稿由 workflow 的 `gh release create --draft` 决定；根那行 `requireCleanWorkingDir` 删掉，行为不变）。保留 bumper / auto-changelog 那两条「为什么」的原段落，只把「`apps/repoways/.release-it.json` 的 tagName」这类指路改成新位置。
- **「新插件接入清单」**：加一步「在 `release-it.config.mjs` 的 `APPS` 表里登记一行（不登记 = 发版直接报错），并在 `apps/<name>/.release-it.json` 放那个 3 行 stub」。
- 决策点 B：README.md / README.en.md 我不动（它们只说「release-it 只切 tag、不建 release」，仍然成立）。

## 三、验证（真跑，不靠推断）

```powershell
# 1) 两个 app 的 dry-run：tag 名、钩子、bumper、push 都按老样子
pnpm release:prelook  --dry-run --ci    # 期望含 prelook-v1.8.1、（dry-run 只打印）! pnpx auto-changelog -p、Writing version to package.json、! git push --follow-tags
pnpm release:repoways --dry-run --ci    # 期望含 repoways-v0.0.1，且没有任何 hook 行
#    判别要点：出现 "Cannot extend config from …" 或 tag 变成无前缀的 v0.0.1 就是 extends 没走通
# 2) dry-run 不许落地任何东西
git status --porcelain                  # 期望空
git diff -- apps/prelook/package.json apps/repoways/package.json   # 期望空（版本仍是 1.8.0 / 1.0.0）
# 3) 守卫的负测：在仓库根跑
node node_modules/release-it/bin/release-it.js --dry-run --config=release-it.config.mjs
#    期望先看到 release-it.config.mjs: unknown app "extensions" (cwd …)，随后 release-it 报 Invalid configuration file at …，退出码非零，仓库无改动
# 4) 门禁没被带坏
pnpm lint                               # 期望仍是那 4 条 warning
```

`--dry-run` 的安全性已逐层核对：release-it 的 `shell.js` 对写命令只打印不执行、bumper `index.js:177` 在 dry-run 里 `return` 在 `writeFileSync` 之前、`github.release: false` 所以不需要 token。`--ci` 只为免去交互提问。

**不会做真发版**：不切 tag、不 push（那是你自己的发版动作；RepoWays 第一次发版仍按文档显式给版本号 `pnpm release:repoways 1.0.0`）。

## 四、明确不做

- 不改两个 app 的 `release` 脚本、不改根 `release:*` 脚本、不动 `.github/workflows/release-*.yml`。
- 不改 tag 命名规则（`<app>-v*`）、不加/删依赖、不动 `.release-it` 之外任何配置。
- 不把新文件加进 `oxlint apps scripts` / `oxfmt apps` 的 glob（决策点 C）：加进 fmt 会被 oxfmt 默认风格重排、与仓库现状不一致（CI 也不跑 `fmt:check`），所以文件按 `scripts/*.mjs` 的风格手写。（想纳入 lint 门禁也就一个词的事，你说要我再加。）
- 源码包不受影响：`apps/<name>/.release-it.json` 仍在 app 目录里（只是变短），根配置在 app 目录之外、本来就不会进 `wxt zip` 的 sources 包。

## 五、顺带发现（不在本次范围，除非你点头）

- AGENTS.md 第 353/355 行与 README 里指的 `.github/workflows/release.yml` 实际叫 **`release-prelook.yml`**（prelook 那条链路）；这是既有的文件名漂移，本次不顺手改，避免把无关改动混进来。
- 仓库里那个畸形 tag `prelook-vv1.0.3` 仍在（登记过、无危害，删远端 tag 要你点头）。
