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
});
