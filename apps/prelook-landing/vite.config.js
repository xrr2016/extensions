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
  plugins: [acceptRangesForMedia()],
});

/**
 * media 文件的全量响应也声明 `Accept-Ranges: bytes`。
 *
 * Vite 只在 **206** 上写这个头（分段响应确实是它自己处理的），200 的全量响应不写——
 * 而 Safari 的播放器只要服务端不声明支持 Range 就拒绝播放 hero 那段 `assets/demo.mp4`
 * （AGENTS.md「hero 视频要求服务端支持 Range」记的就是这件事）。
 * 这里在静态中间件之前按扩展名补上这个头，不碰 Vite 自己的分段逻辑。
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
