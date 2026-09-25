# Agent 友好文档 · 部署配置参考（content-negotiation）

本站是**零构建、整目录直传**的纯静态站点，无法在 HTML 层面实现 `Accept: text/markdown`
内容协商——这需要**服务器/反向代理层**处理。仓库内已完成的部分：

- `llms.txt`：Agent 机器可读索引（站点根）
- `index.html` / `privacy.html`：页首的视觉隐藏 Agent 指令（指向 llms.txt 与 .md 变体）
- `index.md` / `privacy.md`：各页面的 markdown 变体，供 `.md` URL 与内容协商使用

下面是把内容协商真正落到 HTTP 层的配置示例。**你的托管如果是 CDN / 对象存储（S3、
COS 等）类静态托管，多数平台不支持按请求头改写响应**，此时 Agent 仍可经 `llms.txt`
与 `.md` 变体取到 markdown；要完整支持需把站点放到支持此配置的反向代理（nginx /
Caddy）后面。

## nginx 示例

`map` 按请求头 `Accept` 决定改写的后缀，`server` 里对每个页面给出明确的 `rewrite`：

```nginx
# http 块内：根据 Accept 头判定是否要 markdown
map $http_accept $md_wanted {
    default     0;
    "~*text/markdown" 1;
}

server {
    listen 443 ssl;
    server_name prelook.coldstoneboy.cn;
    root /var/www/prelook-landing;   # 换成你的站点根目录

    # 首页（规范地址 / 与 /index.html）
    location = / {
        if ($md_wanted) { rewrite ^ /index.md break; }
        try_files /index.html =404;
    }
    location = /index.html {
        if ($md_wanted) { rewrite ^ /index.md break; }
        try_files /index.html =404;
    }
    location = /privacy.html {
        if ($md_wanted) { rewrite ^ /privacy.md break; }
        try_files /privacy.html =404;
    }
}
```

> 用 `location = /xxx.html` 精确匹配（不加 `try_files` 兜底）可避免 `rewrite break`
> 与 `try_files` 的路径叠加问题；`break` 会让改写后的 URI 直接落到磁盘上的 `.md` 文件。
> 若新增页面（如 `foo.html` / `foo.md`），按同款补一条 `location`。

## Caddy 示例

```caddyfile
prelook.coldstoneboy.cn {
	root * /var/www/prelook-landing

	@md header Accept text/markdown
	rewrite @md /index.html /index.md
	rewrite @md /privacy.html /privacy.md

	file_server
}
```

## 验证

部署后可用 curl 自测：

```bash
# 期望返回 markdown 正文
curl -H "Accept: text/markdown" https://prelook.coldstoneboy.cn/ 
curl -H "Accept: text/markdown" https://prelook.coldstoneboy.cn/privacy.html

# 期望返回 HTML
curl https://prelook.coldstoneboy.cn/
```
