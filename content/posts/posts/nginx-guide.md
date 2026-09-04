---
title: Nginx 安装与配置指南
description: 介绍 Nginx 在 CentOS 和 Ubuntu 上的安装方法，以及静态站点、SSL/HTTPS、反向代理、WebSocket、TCP、MinIO 和 sub_filter 注入配置。
date: 2026-01-09
updated: 2026-04-11
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [Nginx, 反向代理, SSL, sub_filter]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

## 一、安装

### CentOS（yum）

```bash
# 添加 Nginx 官方 YUM 源
rpm -ivh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm

# 安装 Nginx
yum install -y nginx

# 启动并设置开机自启
systemctl start nginx
systemctl enable nginx
```

### Ubuntu / Debian（apt）

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
nginx -t
```

## 二、主配置文件结构

通常不会直接修改主配置文件，而是采用引入外部文件的方式管理多个站点。

```nginx [nginx.conf]
http {
  # 注释掉默认的 include，防止 80 端口冲突
  # include /etc/nginx/conf.d/*.conf;

  # 引入自定义 HTTP 配置
  include /opt/nginx/http/*.conf;

  # 不限制文件上传大小
  client_max_body_size 0;
}

# TCP/UDP 代理（需要在 http 块外部）
stream {
  include /opt/nginx/server/*.conf;
}
```

## 三、静态站点 / Vue SPA

```nginx [/opt/nginx/http/spa.conf]
server {
    listen 80;
    server_name example.com;
    root /opt/app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://127.0.0.1:8080/;
    }
}
```

## 四、sub_filter 注入自定义 HTML

在反向代理第三方服务时，若需要在页面中注入自定义 JS/CSS，但无法修改源码，可以借助 Nginx 的 `sub_filter` 指令在响应内容中做字符串替换注入。

::alert{type="info"}

`sub_filter` 由 `ngx_http_sub_module` 模块提供，编译 Nginx 时需确认已包含该模块：

```bash
nginx -V 2>&1 | grep sub_filter
```

::

### 配置示例

::alert{type="tip"}

尚未部署 Uptime Kuma？参见：[Docker 部署 Uptime Kuma 监控](/posts/docker-uptime-kuma///)

::

以下示例在代理 Uptime Kuma 状态页时，通过 `sub_filter` 在 `</head>` 前注入自定义资源：

```nginx [/opt/nginx/http/status.conf]
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name status.example.com;

    location ^~ /status/external {
        proxy_pass http://10.0.0.11:3001/status/external;

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        # 在 </head> 前注入自定义资源
        sub_filter '</head>' '<script src="/main.js"></script>';
        sub_filter '</head>' '<link rel="stylesheet" href="/main.css">';
        sub_filter '</head>' '<link rel="stylesheet" href="/iconfont.css">';

        sub_filter_once off;   # off = 替换所有匹配
        sub_filter_types *;    # 对所有 MIME 类型生效
    }
}
```

### 常用指令

| 指令 | 说明 |
|---|---|
| `sub_filter string replacement` | 将响应中的 `string` 替换为 `replacement` |
| `sub_filter_once on\|off` | `on`（默认）只替换第一处；`off` 替换全部匹配 |
| `sub_filter_types *` | 指定生效的 MIME 类型，默认仅 `text/html` |
| `sub_filter_last_modified on\|off` | 是否在替换后修改响应的 `Last-Modified` 头 |

### 注意事项

- 如果后端响应启用了 gzip 压缩，`sub_filter` 无法处理压缩内容，需在 `location` 内添加 `proxy_set_header Accept-Encoding "";` 禁用后端压缩。
- 注入的静态资源路径中不能使用动态变量，否则浏览器无法解析。建议将静态资源缓存到 Nginx 本地后统一提供。

### 环境标识示例

可为开发或测试环境注入固定提示条，无需修改应用代码：

```nginx
location / {
    # 插入自定义提示头
    sub_filter '</body>' '<div style="position:fixed;top:0;left:50%;transform:translateX(-50%);background:red;color:white;padding:2px 10px;z-index:9999;font-size:12px;pointer-events:none;opacity:0.8;border-radius:0 0 5px 5px;">当前环境：DEV 开发版</div></body>';
    sub_filter_once on;

    root $root/platform;
    index index.html;
    try_files $uri $uri/ /index.html;
    add_header Access-Control-Allow-Origin *;
    add_header 'Access-Control-Allow-Credentials' 'true';
    add_header 'Access-Control-Allow-Methods' *;
    add_header 'Access-Control-Allow-Headers' *;
    add_header Cache-Control no-cache;
}
```

效果如下：

![](./images/Nginx注入自定义HTML标签-2.webp)

## 五、SSL / HTTPS

```nginx [/opt/nginx/http/ssl.conf]
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate        /opt/cert/example.com.pem;
    ssl_certificate_key    /opt/cert/example.com.key;
    ssl_protocols          TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers            EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache      shared:SSL:10m;
    ssl_session_timeout    10m;
    add_header Strict-Transport-Security "max-age=31536000" always;

    root /opt/app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://127.0.0.1:8080/;
    }
}
```

## 六、反向代理

```nginx [/opt/nginx/http/proxy.conf]
server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout    600s;
        proxy_read_timeout    600s;
        proxy_pass http://127.0.0.1:3000;
    }
}
```

## 七、WebSocket 代理

代理 WebSocket 服务时需额外设置 `Upgrade` 和 `Connection` 请求头，否则 WS 握手会失败。

```nginx [/opt/nginx/http/ws.conf]
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name ws.example.com;

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_connect_timeout 60s;
        proxy_read_timeout    3600s;
        proxy_send_timeout    3600s;
        proxy_pass http://127.0.0.1:3001;
    }
}
```

::alert{type="tip"}

`map` 指令需放在 `http` 块内（通常在主配置文件中定义一次即可），用于自动将 HTTP 升级为 WebSocket 连接。`proxy_read_timeout` 建议设置较大值，防止长连接被提前断开。

::

## 八、TCP 流量转发（stream 模块）

适用于转发 MySQL、Redis 等 TCP 服务。`stream` 块与 `http` 块同级。以 MySQL 为例（安装参见 [CentOS MySQL 5.7 安装](/posts/centos-mysql-57///)）：

```nginx [/opt/nginx/server/mysql.conf]
upstream mysql3306 {
    hash $remote_addr consistent;
    server 192.168.1.58:3306 weight=5 max_fails=3 fail_timeout=30s;
}

server {
    listen 33306;
    proxy_connect_timeout 100s;
    proxy_timeout 500s;
    proxy_pass mysql3306;
}
```

::alert{type="info"}

使用 stream 模块前需确认编译时包含了该模块：

```bash
nginx -V 2>&1 | grep with-stream
```

::

## 九、MinIO 反向代理

::alert{type="info"}

尚未部署 MinIO？参见：[MinIO 对象存储安装指南](/posts/minio-install///)

::

MinIO 签名验证依赖 `Host` 头，必须正确透传，否则出现 `The request signature we calculated does not match the signature you provided` 错误。

```nginx [/opt/nginx/http/minio.conf]
server {
    listen 9000;
    server_name minio.example.com;
    client_max_body_size 0;

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://127.0.0.1:9001;
    }
}
```
