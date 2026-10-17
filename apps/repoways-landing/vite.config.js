import { defineConfig } from "vite";

/**
 * 与 prelook-landing 同一套约定：Vite 只当开发服务器，站点本体是零构建、整目录直传的静态部署物。
 * root 就是本目录，dev 与线上看到同一批文件、同一套 `./assets/...` 相对路径。
 */
export default defineConfig({
  appType: "mpa",
  server: {
    host: "127.0.0.1",
    port: 8090,
  },
  plugins: [serveMarkdownNegotiation()],
});

/**
 * Agent 友好的 Markdown 内容协商（dev-only）。
 *
 * 当请求带 `Accept: text/markdown`（Claude Code / Cursor / OpenCode 的取文方式）时，
 * 把 `.html` 请求（含首页 `/`）改写成同名 `.md` 变体，让 Agent 拿到 markdown 而不是 HTML。
 * 这里只改 `req.url`，随后交给 Vite 静态中间件去 serve 对应 `.md` 文件，不碰响应体本身。
 * **只作用于 dev 服务器**；线上由部署层（nginx / Caddy）做同样的改写。
 * 命名约定：每个 `.html` 页面配一个同名 `.md`（index.html↔index.md、privacy.html↔privacy.md）。
 */
function serveMarkdownNegotiation() {
  return {
    name: "repoways-landing:markdown-content-negotiation",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const accept = req.headers.accept || "";
        if (!accept.includes("text/markdown")) return next();
        const url = req.url || "";
        const [path] = url.split(/[?#]/);
        let md;
        if (path === "/") md = "/index.md";
        else if (path.endsWith(".html")) md = path.slice(0, -5) + ".md";
        if (md) req.url = url.replace(path, md);
        next();
      });
    },
  };
}
