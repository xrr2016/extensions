import { defineConfig } from "vite";

/**
 * 官网只把 Vite 当**开发服务器**用，不引入构建步骤：
 * 站点本体（index.html / privacy.html + css/ js/ assets/）仍是零构建、整目录直传的部署物，
 * 所以 root 就是本目录——dev 服务器看到的就是线上那份文件、那套相对路径（`./assets/...`）。
 *
 * 热更新靠 Vite 自带的那套：`<link rel="stylesheet">` 命中的 css 走 css-update（换掉 link，不刷新页面），
 * js/ 与 html 改动走整页刷新。所以改样式时不丢滚动位置，改逻辑时自动重载。
 */
export default defineConfig({
  // 本站是多页静态站，没有前端路由：未知路径老老实实 404，不要回落到 index.html
  appType: "mpa",
  server: {
    host: "127.0.0.1",
    // 端口写死 + strictPort：根脚本、README 与 AGENTS.md 承诺的都是 4173，
    // 被占用时宁可起不来，也不要悄悄换到 4174 让人对着旧页面调半天
    port: 4173,
    strictPort: true,
  },
  plugins: [acceptRangesForMedia(), serveMarkdownNegotiation()],
});

/**
 * Agent 友好的 Markdown 内容协商（dev-only）。
 *
 * 当请求带 `Accept: text/markdown`（Claude Code / Cursor / OpenCode 的取文方式）时，
 * 把 `.html` 请求（含首页 `/`）改写成同名 `.md` 变体，让 Agent 拿到 markdown 而不是 HTML。
 * 这里只是把 `req.url` 改掉，随后交给 Vite 的静态中间件去 serve 对应 `.md` 文件，
 * 不碰响应体本身。**只作用于 dev 服务器**；线上由部署层（nginx / Caddy）做同样的事，
 * 见 `deploy-agent-content-negotiation.md`。命名约定：每个 `.html` 页面配一个同名 `.md`。
 */
function serveMarkdownNegotiation() {
  return {
    name: "prelook-landing:markdown-content-negotiation",
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
/**
 * media 文件的全量响应也声明 `Accept-Ranges: bytes`。
 *
 * Vite 只在 **206** 上写这个头（分段响应确实是它自己处理的），200 的全量响应不写——
 * 而 Safari 的播放器只要服务端不声明支持 Range 就拒绝播放这类媒体。
 * 这里在静态中间件之前按扩展名补上这个头，不碰 Vite 自己的分段逻辑；
 * 当前页面已无内嵌视频（hero 的 demo.mp4 已删除），此插件保留作通用兜底。
 */
function acceptRangesForMedia() {
  const MEDIA_RE = /\.(mp4|webm|ogv|ogg|mp3|m4a|wav)$/i;
  return {
    name: "prelook-landing:accept-ranges-for-media",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url || "").split(/[?#]/)[0];
        if (MEDIA_RE.test(path)) res.setHeader("Accept-Ranges", "bytes");
        next();
      });
    },
  };
}
